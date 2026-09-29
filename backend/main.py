from fastapi import FastAPI, UploadFile, File, Form, Depends, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from PIL import Image
import base64
from model_service import model_service
import uvicorn
import hashlib
import hmac
import secrets
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
import re

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="RepairLensAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Backend is running — DynamoDB mode"}

try:
    import razorpay
except ImportError:
    razorpay = None

try:
    import boto3
    from boto3.dynamodb.conditions import Key, Attr
    from botocore.exceptions import ClientError
except ImportError:
    boto3 = None

# ── AWS / DynamoDB Config ─────────────────────────────────
AWS_REGION          = os.getenv("AWS_REGION", "ap-south-1")
AWS_ACCESS_KEY_ID   = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
S3_BUCKET_NAME      = os.getenv("S3_BUCKET_NAME", "")
AWS_SES_SENDER      = os.getenv("AWS_SES_SENDER_EMAIL", "")

# DynamoDB table names
TBL_USERS       = os.getenv("DYNAMODB_TABLE_USERS",       "repairlens-users")
TBL_PREDICTIONS = os.getenv("DYNAMODB_TABLE_PREDICTIONS", "repairlens-predictions")
TBL_PAYMENTS    = os.getenv("DYNAMODB_TABLE_PAYMENTS",    "repairlens-payments")
TBL_OTP         = os.getenv("DYNAMODB_TABLE_OTP",         "repairlens-otp")
TBL_WEBHOOKS    = os.getenv("DYNAMODB_TABLE_WEBHOOKS",    "repairlens-webhooks")
TBL_COUPONS     = os.getenv("DYNAMODB_TABLE_COUPONS",     "repairlens-coupon-redemptions")

# Razorpay config
RAZORPAY_KEY_ID       = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET   = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
REPORT_PRICE = 29

PLAN_CREDITS = {
    "Quick Report Pass (₹29)": (29, 1),
    "Single Report Token":     (29, 1),
    "Single Report":           (29, 1),
    "Report Credit Token":     (29, 1),
    "Premium Valuation Upgrade": (29, 1),
    "Starter Plan (25 Reports/mo)":  (599, 25),
    "Standard Plan (50 Reports/mo)": (999, 50),
    "Pro Plan (100 Reports/mo)":     (1799, 100),
}
SUBSCRIPTION_PLANS = {
    "Starter Plan (25 Reports/mo)":  os.getenv("RAZORPAY_PLAN_STARTER_ID",  ""),
    "Standard Plan (50 Reports/mo)": os.getenv("RAZORPAY_PLAN_STANDARD_ID", ""),
    "Pro Plan (100 Reports/mo)":     os.getenv("RAZORPAY_PLAN_PRO_ID",      ""),
}

# ── DynamoDB Client ───────────────────────────────────────
_dynamodb = None

def get_dynamodb():
    global _dynamodb
    if _dynamodb is None:
        if not boto3:
            raise HTTPException(status_code=503, detail="boto3 not installed.")
        _dynamodb = boto3.resource(
            "dynamodb",
            region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY or None,
        )
    return _dynamodb

def ddb_table(name: str):
    return get_dynamodb().Table(name)

# ── DynamoDB Table Bootstrap ──────────────────────────────
def _ensure_table(ddb, name: str, key_schema, attr_defs, billing="PAY_PER_REQUEST", lsi=None, gsi=None):
    try:
        t = ddb.Table(name)
        t.load()
        logging.info(f"DynamoDB table already exists: {name}")
    except ClientError as e:
        if e.response["Error"]["Code"] != "ResourceNotFoundException":
            raise
        kwargs = {
            "TableName": name,
            "KeySchema": key_schema,
            "AttributeDefinitions": attr_defs,
            "BillingMode": billing,
        }
        if lsi:
            kwargs["LocalSecondaryIndexes"] = lsi
        if gsi:
            kwargs["GlobalSecondaryIndexes"] = gsi
        tbl = ddb.create_table(**kwargs)
        tbl.wait_until_exists()
        logging.info(f"Created DynamoDB table: {name}")

def init_dynamodb_tables():
    if not boto3:
        logging.warning("boto3 not available — skipping DynamoDB table setup.")
        return
    try:
        ddb = get_dynamodb()
        # Users: PK = email
        _ensure_table(ddb, TBL_USERS,
            key_schema=[{"AttributeName": "email", "KeyType": "HASH"}],
            attr_defs=[{"AttributeName": "email", "AttributeType": "S"}])

        # Predictions: PK = email, SK = prediction_id (timestamp#uuid)
        _ensure_table(ddb, TBL_PREDICTIONS,
            key_schema=[
                {"AttributeName": "email",         "KeyType": "HASH"},
                {"AttributeName": "prediction_id", "KeyType": "RANGE"},
            ],
            attr_defs=[
                {"AttributeName": "email",         "AttributeType": "S"},
                {"AttributeName": "prediction_id", "AttributeType": "S"},
            ])

        # Payments: PK = order_id
        _ensure_table(ddb, TBL_PAYMENTS,
            key_schema=[{"AttributeName": "order_id", "KeyType": "HASH"}],
            attr_defs=[{"AttributeName": "order_id", "AttributeType": "S"}])

        # OTP: PK = email
        _ensure_table(ddb, TBL_OTP,
            key_schema=[{"AttributeName": "email", "KeyType": "HASH"}],
            attr_defs=[{"AttributeName": "email", "AttributeType": "S"}])

        # Webhooks (idempotency): PK = event_id
        _ensure_table(ddb, TBL_WEBHOOKS,
            key_schema=[{"AttributeName": "event_id", "KeyType": "HASH"}],
            attr_defs=[{"AttributeName": "event_id", "AttributeType": "S"}])

        # Coupon redemptions: PK = email, SK = code
        _ensure_table(ddb, TBL_COUPONS,
            key_schema=[
                {"AttributeName": "email", "KeyType": "HASH"},
                {"AttributeName": "code",  "KeyType": "RANGE"},
            ],
            attr_defs=[
                {"AttributeName": "email", "AttributeType": "S"},
                {"AttributeName": "code",  "AttributeType": "S"},
            ])

        logging.info("DynamoDB tables ready.")
    except Exception as e:
        logging.error(f"DynamoDB init error: {e}")

init_dynamodb_tables()

# ── DynamoDB helpers ──────────────────────────────────────
def _clean(obj):
    """Recursively convert float/numpy types → Decimal/int for DynamoDB, and strip None values."""
    if isinstance(obj, dict):
        return {str(k): _clean(v) for k, v in obj.items() if v is not None and v != ""}
    if isinstance(obj, (list, tuple)):
        return [_clean(i) for i in obj]
    if isinstance(obj, float):
        return Decimal(str(round(obj, 4)))
    if hasattr(obj, "item"):
        val = obj.item()
        if isinstance(val, float):
            return Decimal(str(round(val, 4)))
        return val
    return obj

def _to_float(obj):
    """Recursively convert Decimal → float for JSON serialisation."""
    if isinstance(obj, dict):
        return {k: _to_float(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_float(i) for i in obj]
    if isinstance(obj, Decimal):
        return float(obj)
    return obj

# ── S3 Helpers ────────────────────────────────────────────
def upload_file_to_s3(file_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> str:
    if not S3_BUCKET_NAME or not boto3:
        return ""
    try:
        s3 = boto3.client(
            "s3", region_name=AWS_REGION,
            aws_access_key_id=AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY or None,
        )
        ts = int(time.time())
        key = f"uploads/{ts}_{filename.replace(' ', '_')}"
        s3.put_object(Bucket=S3_BUCKET_NAME, Key=key, Body=file_bytes, ContentType=content_type)
        url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{key}"
        logging.info(f"S3 upload OK: {url}")
        return url
    except Exception as e:
        logging.error(f"S3 upload error: {e}")
        return ""

def upload_b64_to_s3(b64_data: str, prefix: str, user_email: str) -> str:
    if not b64_data or not S3_BUCKET_NAME or not boto3:
        return ""
    try:
        encoded = b64_data.split(",", 1)[1] if "," in b64_data else b64_data
        file_bytes = base64.b64decode(encoded)
        return upload_file_to_s3(file_bytes, f"{prefix.replace(' ', '_')}.jpg", "image/jpeg")
    except Exception as e:
        logging.error(f"b64→S3 error: {e}")
        return ""

# ── AWS SES OTP Email ─────────────────────────────────────
def send_otp_email_ses(to_email: str, otp: str, username: str = "") -> bool:
    if not boto3:
        return False
    try:
        import urllib.request, botocore.auth, email.utils as eu, datetime as dt_module
        try:
            res = urllib.request.urlopen("https://s3.amazonaws.com", timeout=3)
            skew = eu.parsedate_to_datetime(res.headers["Date"]) - dt_module.datetime.now(dt_module.timezone.utc)
            _orig = botocore.auth.get_current_datetime
            def _patched(remove_tzinfo=True):
                now = dt_module.datetime.now(dt_module.timezone.utc) + skew
                return now.replace(tzinfo=None) if remove_tzinfo else now
            botocore.auth.get_current_datetime = _patched
        except Exception:
            pass
        ses = boto3.client("ses", region_name=AWS_REGION,
                           aws_access_key_id=AWS_ACCESS_KEY_ID or None,
                           aws_secret_access_key=AWS_SECRET_ACCESS_KEY or None)
        display = username or to_email.split("@")[0]
        body_html = f"""
        <html><body style="font-family:Arial,sans-serif;background:#f8fafc;">
        <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#ff6b2b,#e8622a);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;">RepairLens<span style="font-weight:400;">AI</span></h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Password Reset Request</p>
          </div>
          <div style="padding:32px;">
            <p style="color:#334155;font-size:15px;margin-top:0;">Hi <strong>{display}</strong>,</p>
            <p style="color:#64748b;font-size:14px;">Use the OTP below — expires in <strong>10 minutes</strong>.</p>
            <div style="text-align:center;margin:28px 0;">
              <div style="display:inline-block;background:#f1f5f9;border:2px dashed #e2e8f0;border-radius:12px;padding:18px 40px;">
                <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#0f172a;font-family:monospace;">{otp}</span>
              </div>
            </div>
          </div>
          <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:11px;margin:0;">&copy; 2026 RepairLensAI. All rights reserved.</p>
          </div>
        </div>
        </body></html>"""
        ses.send_email(
            Source=f"RepairLensAI <{AWS_SES_SENDER or 'noreply@repairlensai.com'}>",
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": f"RepairLensAI — Your OTP: {otp}", "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": body_html, "Charset": "UTF-8"},
                    "Text": {"Data": f"Your OTP is: {otp}. Valid 10 minutes.", "Charset": "UTF-8"},
                },
            },
        )
        return True
    except Exception as e:
        logging.error(f"SES error: {e}")
        return False

def generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)

# ── Password / Token helpers ──────────────────────────────
def hash_password(password: str, salt: Optional[str] = None):
    if not salt:
        salt = secrets.token_hex(16)
    h = hashlib.sha256((salt + password).encode()).hexdigest()
    return salt, h

def generate_token(email: str) -> str:
    raw = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    expiry = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    ddb_table(TBL_USERS).update_item(
        Key={"email": email},
        UpdateExpression="SET token_hash = :th, token_expiry = :te",
        ExpressionAttributeValues={":th": token_hash, ":te": expiry},
    )
    return raw

def current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Please sign in to continue.")
    raw_token = authorization[7:]
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    try:
        resp = ddb_table(TBL_USERS).scan(
            FilterExpression=Attr("token_hash").eq(token_hash)
        )
        items = resp.get("Items", [])
    except Exception as e:
        logging.error(f"DynamoDB current_user error: {e}")
        raise HTTPException(status_code=503, detail="Database error. Please try again.")
    if not items:
        raise HTTPException(status_code=401, detail="Invalid session token. Please sign in again.")
    user = _to_float(items[0])
    if user.get("token_expiry"):
        expiry = datetime.fromisoformat(user["token_expiry"])
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expiry:
            raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    return user

def coupon_discount(code, amount):
    coupons = {
        "REPAIR10": ("percent", 10), "CAR20": ("percent", 20),
        "FIRST50":  ("percent", 50), "PIYUSH100": ("flat", 100),
        "REPAIR20": ("percent", 20), "SAVE15": ("percent", 15),
        "FREEPASS": ("percent", 100),
    }
    c = coupons.get((code or "").strip().upper())
    if not c:
        return None
    kind, val = c
    d = round(amount * val / 100) if kind == "percent" else min(amount, val)
    return min(amount, d)

# ── Pydantic Models ───────────────────────────────────────
class SignupRequest(BaseModel):
    name: str; email: str; phone: str; password: str

class SigninRequest(BaseModel):
    email: str; password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str; otp: str

class ResetPasswordRequest(BaseModel):
    email: str; otp: str; new_password: str

class CreateOrderRequest(BaseModel):
    plan_name: str; coupon_code: Optional[str] = None

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: Optional[str] = None
    razorpay_subscription_id: Optional[str] = None
    razorpay_payment_id: str
    razorpay_signature: str

class CouponRequest(BaseModel):
    coupon_code: str; amount: int; plan_name: Optional[str] = None

def normalize_phone(phone_str: str) -> str:
    """Extract digits and normalize Indian phone numbers to 10 digits."""
    digits = re.sub(r"\D", "", phone_str or "")
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    return digits

def find_user_by_phone(phone_str: str):
    """Scan DynamoDB to check if phone number (raw or normalized) is already registered."""
    raw = (phone_str or "").strip()
    norm = normalize_phone(raw)
    if not norm:
        return None
    try:
        # Check against raw phone, normalized phone, or phone_norm
        resp = ddb_table(TBL_USERS).scan(
            FilterExpression=Attr("phone").eq(raw) | Attr("phone").eq(norm) | Attr("phone_norm").eq(norm),
            Limit=5
        )
        items = resp.get("Items", [])
        if items:
            return items[0]
        # Additional scan check: inspect phone and phone_norm
        scan_all = ddb_table(TBL_USERS).scan(
            ProjectionExpression="email, phone, phone_norm"
        ).get("Items", [])
        for u in scan_all:
            u_phone = u.get("phone", "")
            u_norm = u.get("phone_norm") or normalize_phone(u_phone)
            if (u_norm and u_norm == norm) or (u_phone and u_phone == raw):
                return u
    except Exception as e:
        logging.error(f"Error checking phone in DynamoDB: {e}")
    return None

# ── Auth Endpoints ────────────────────────────────────────
@app.get("/api/auth/check-availability")
def check_availability(email: Optional[str] = None, phone: Optional[str] = None):
    """Check if email or phone is already taken before account creation."""
    res = {
        "email_available": True,
        "phone_available": True,
        "email_error": "",
        "phone_error": ""
    }
    if email:
        em = email.strip().lower()
        existing = ddb_table(TBL_USERS).get_item(Key={"email": em}).get("Item")
        if existing:
            res["email_available"] = False
            res["email_error"] = "This Email is already registered. Please sign in."
    if phone:
        existing_p = find_user_by_phone(phone)
        if existing_p:
            res["phone_available"] = False
            res["phone_error"] = "This Phone number is already registered. Please use a different phone number."
    return res

@app.post("/api/auth/signup")
def signup(req: SignupRequest):
    email    = req.email.strip().lower()
    name     = req.name.strip()
    phone    = req.phone.strip()
    password = req.password.strip()
    if not all([email, name, phone, password]):
        raise HTTPException(400, "Name, Email, Phone and Password are all required.")

    norm_phone = normalize_phone(phone)
    if len(norm_phone) < 10:
        raise HTTPException(400, "Please enter a valid 10-digit phone number.")

    # 1. Check if Email is already registered
    existing_email = ddb_table(TBL_USERS).get_item(Key={"email": email}).get("Item")
    if existing_email:
        raise HTTPException(400, "An account with this Email already exists. Please sign in or use a different email.")

    # 2. Check if Phone number is already registered
    existing_phone = find_user_by_phone(phone)
    if existing_phone:
        raise HTTPException(400, "An account with this Phone number already exists. Please use a different phone number or sign in.")

    salt, pwd_hash = hash_password(password)
    created_at = datetime.now(timezone.utc).isoformat()
    ddb_table(TBL_USERS).put_item(Item={
        "email":          email,
        "name":           name,
        "phone":          phone,
        "phone_norm":     norm_phone,
        "password_salt":  salt,
        "password_hash":  pwd_hash,
        "report_credits": 0,
        "created_at":     created_at,
    })
    token = generate_token(email)
    return {"token": token, "user": {"email": email, "name": name, "phone": phone, "report_credits": 0}}


@app.post("/api/auth/signin")
def signin(req: SigninRequest):
    email    = req.email.strip().lower()
    password = req.password.strip()
    if not email or not password:
        raise HTTPException(400, "Email and Password are required.")

    item = ddb_table(TBL_USERS).get_item(Key={"email": email}).get("Item")
    if not item:
        raise HTTPException(401, "Invalid email or password.")
    _, pwd_hash = hash_password(password, item["password_salt"])
    if pwd_hash != item["password_hash"]:
        raise HTTPException(401, "Invalid email or password.")

    item = _to_float(item)
    token = generate_token(email)
    return {"token": token, "user": {
        "email":          item["email"],
        "name":           item.get("name", ""),
        "phone":          item.get("phone", ""),
        "report_credits": int(item.get("report_credits", 0)),
    }}


@app.get("/api/auth/me")
def get_me(user=Depends(current_user)):
    return {
        "email":          user["email"],
        "name":           user.get("name", ""),
        "phone":          user.get("phone", ""),
        "report_credits": int(user.get("report_credits", 0)),
    }


@app.post("/api/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    email = req.email.strip().lower()
    if not email:
        raise HTTPException(400, "Email is required.")
    item = ddb_table(TBL_USERS).get_item(Key={"email": email}).get("Item")
    if not item:
        return {"message": "If an account exists with this email, an OTP has been sent."}

    otp = generate_otp()
    now = datetime.now(timezone.utc)
    expires = (now + timedelta(minutes=10)).isoformat()
    ddb_table(TBL_OTP).put_item(Item={
        "email":      email,
        "otp":        otp,
        "created_at": now.isoformat(),
        "expires_at": expires,
        "verified":   False,
    })
    username = item.get("name", "")
    sent = send_otp_email_ses(email, otp, username)
    if not sent:
        return {"message": f"OTP generated (SES sandbox). Your OTP is: {otp}", "otp_sent": False, "test_otp": otp}
    return {"message": "OTP sent successfully! Please check your email."}


@app.post("/api/auth/verify-otp")
def verify_otp(req: VerifyOTPRequest):
    email = req.email.strip().lower()
    otp   = req.otp.strip()
    if not email or not otp:
        raise HTTPException(400, "Email and OTP are required.")
    record = ddb_table(TBL_OTP).get_item(Key={"email": email}).get("Item")
    if not record:
        raise HTTPException(400, "No OTP found. Please request a new one.")
    if record.get("verified"):
        raise HTTPException(400, "OTP already used. Please request a new one.")
    expires_at = datetime.fromisoformat(record["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(400, "OTP expired. Please request a new one.")
    if record["otp"] != otp:
        raise HTTPException(400, "Invalid OTP. Please try again.")
    ddb_table(TBL_OTP).update_item(
        Key={"email": email},
        UpdateExpression="SET verified = :v",
        ExpressionAttributeValues={":v": True},
    )
    return {"message": "OTP verified.", "verified": True}


@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest):
    email    = req.email.strip().lower()
    otp      = req.otp.strip()
    new_pass = req.new_password.strip()
    if not all([email, otp, new_pass]):
        raise HTTPException(400, "Email, OTP and new password are required.")
    if len(new_pass) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    record = ddb_table(TBL_OTP).get_item(Key={"email": email}).get("Item")
    if not record:
        raise HTTPException(400, "No OTP found.")
    if not record.get("verified"):
        raise HTTPException(400, "OTP not verified. Please verify first.")
    if record["otp"] != otp:
        raise HTTPException(400, "Invalid OTP.")
    salt, pwd_hash = hash_password(new_pass)
    ddb_table(TBL_USERS).update_item(
        Key={"email": email},
        UpdateExpression="SET password_salt = :s, password_hash = :h",
        ExpressionAttributeValues={":s": salt, ":h": pwd_hash},
    )
    ddb_table(TBL_OTP).delete_item(Key={"email": email})
    return {"message": "Password reset successfully. Please sign in."}


# ── Admin ─────────────────────────────────────────────────
@app.get("/api/admin/users")
def list_users():
    resp = ddb_table(TBL_USERS).scan(
        ProjectionExpression="email, #n, phone, report_credits, created_at",
        ExpressionAttributeNames={"#n": "name"},
    )
    return _to_float(resp.get("Items", []))


# ── Coupon Endpoints ──────────────────────────────────────
@app.post("/api/apply-coupon")
def apply_coupon(req: CouponRequest, user=Depends(current_user)):
    code = req.coupon_code.strip().upper() if req.coupon_code else ""
    if code and req.plan_name in SUBSCRIPTION_PLANS:
        return {"valid": False, "code": code,
                "original_amount": PLAN_CREDITS[req.plan_name][0], "discount_amount": 0,
                "final_amount": PLAN_CREDITS[req.plan_name][0],
                "message": "Coupons are available for one-time purchases, not subscriptions."}
    amount   = PLAN_CREDITS.get(req.plan_name or "", (REPORT_PRICE, 1))[0]
    discount = coupon_discount(code, amount)
    if discount is not None:
        return {"valid": True, "code": code, "original_amount": amount,
                "discount_amount": discount, "final_amount": amount - discount,
                "message": f"Coupon '{code}' applied! Saved ₹{discount}."}
    return {"valid": False, "code": code, "original_amount": amount, "discount_amount": 0,
            "final_amount": amount, "message": "Invalid or expired coupon code."}


@app.post("/api/redeem-report-coupon")
def redeem_report_coupon(req: CouponRequest, user=Depends(current_user)):
    code = (req.coupon_code or "").strip().upper()
    if coupon_discount(code, REPORT_PRICE) != REPORT_PRICE:
        raise HTTPException(400, "This code does not provide a free report.")
    email = user["email"]
    try:
        ddb_table(TBL_COUPONS).put_item(
            Item={"email": email, "code": code, "redeemed_at": datetime.now(timezone.utc).isoformat()},
            ConditionExpression="attribute_not_exists(email) AND attribute_not_exists(code)",
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise HTTPException(409, "This coupon has already been redeemed on this account.")
        raise
    credits = int(user.get("report_credits", 0)) + 1
    ddb_table(TBL_USERS).update_item(
        Key={"email": email},
        UpdateExpression="SET report_credits = :c",
        ExpressionAttributeValues={":c": credits},
    )
    return {"success": True, "message": "Free report activated.", "report_credits": credits}


# ── Razorpay ──────────────────────────────────────────────
@app.get("/api/razorpay-config")
def get_razorpay_config():
    return {"key_id": RAZORPAY_KEY_ID, "merchant_name": os.getenv("RAZORPAY_MERCHANT_NAME", "RepairLensAI")}


@app.post("/api/create-razorpay-order")
def create_razorpay_order(req: CreateOrderRequest, user=Depends(current_user)):
    if not razorpay or not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(503, "Razorpay is not configured.")
    plan = PLAN_CREDITS.get(req.plan_name)
    if not plan:
        raise HTTPException(400, "Unknown plan.")
    amount_rupees, credits = plan
    code     = (req.coupon_code or "").strip().upper()
    discount = coupon_discount(code, amount_rupees) if code else 0
    if code and discount is None:
        raise HTTPException(400, "Invalid coupon code.")
    amount_in_paise = (amount_rupees - discount) * 100
    if amount_in_paise <= 0:
        raise HTTPException(400, "A free report coupon must be redeemed before checkout.")
    client       = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    payment_type = "order"
    try:
        if req.plan_name in SUBSCRIPTION_PLANS:
            plan_id = SUBSCRIPTION_PLANS[req.plan_name]
            if not plan_id:
                raise HTTPException(503, "Recurring plan not configured.")
            payment      = client.subscription.create(data={"plan_id": plan_id, "total_count": 12, "quantity": 1,
                                                             "customer_notify": 1, "notes": {"email": user["email"]}})
            order_id     = payment["id"]
            payment_type = "subscription"
        else:
            payment  = client.order.create(data={"amount": amount_in_paise, "currency": "INR",
                                                  "receipt": f"rl_{secrets.token_hex(8)}",
                                                  "notes": {"plan": req.plan_name, "coupon": code, "email": user["email"]}})
            order_id = payment["id"]
    except Exception as err:
        if isinstance(err, HTTPException):
            raise
        raise HTTPException(502, f"Razorpay error: {err}")
    ddb_table(TBL_PAYMENTS).put_item(Item={
        "order_id":     order_id,
        "email":        user["email"],
        "amount":       amount_in_paise,
        "credits":      credits,
        "plan_name":    req.plan_name,
        "paid":         False,
        "payment_type": payment_type,
        "created_at":   datetime.now(timezone.utc).isoformat(),
    })
    return {"success": True, "order_id": order_id,
            "subscription_id": order_id if payment_type == "subscription" else None,
            "payment_type": payment_type, "amount": amount_in_paise,
            "final_price_rupees": amount_in_paise // 100, "currency": "INR",
            "key_id": RAZORPAY_KEY_ID, "plan_name": req.plan_name}


@app.post("/api/verify-razorpay-payment")
def verify_razorpay_payment(req: VerifyPaymentRequest, user=Depends(current_user)):
    if not razorpay or not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(503, "Razorpay not configured.")
    payment_ref = req.razorpay_subscription_id or req.razorpay_order_id
    if not payment_ref:
        raise HTTPException(400, "A Razorpay order or subscription ID is required.")
    order = ddb_table(TBL_PAYMENTS).get_item(Key={"order_id": payment_ref}).get("Item")
    if not order:
        raise HTTPException(404, "Payment order not found.")
    if order.get("paid"):
        raise HTTPException(409, "Payment already verified.")
    try:
        if order["payment_type"] == "subscription":
            signed = f"{req.razorpay_payment_id}|{payment_ref}".encode()
            expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), signed, hashlib.sha256).hexdigest()
            if not hmac.compare_digest(expected, req.razorpay_signature):
                raise ValueError("Bad signature")
        else:
            razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)).utility.verify_payment_signature({
                "razorpay_order_id": req.razorpay_order_id,
                "razorpay_payment_id": req.razorpay_payment_id,
                "razorpay_signature": req.razorpay_signature,
            })
    except Exception:
        raise HTTPException(400, "Invalid payment signature.")
    order = _to_float(order)
    credits_to_add = int(order["credits"])
    ddb_table(TBL_PAYMENTS).update_item(
        Key={"order_id": payment_ref},
        UpdateExpression="SET paid = :p, payment_id = :pid",
        ExpressionAttributeValues={":p": True, ":pid": req.razorpay_payment_id},
    )
    new_credits = int(user.get("report_credits", 0)) + credits_to_add
    ddb_table(TBL_USERS).update_item(
        Key={"email": user["email"]},
        UpdateExpression="SET report_credits = :c",
        ExpressionAttributeValues={":c": new_credits},
    )
    return {"success": True, "status": "PAID",
            "message": f"Payment verified. {credits_to_add} credit(s) added.",
            "order_id": payment_ref, "payment_id": req.razorpay_payment_id,
            "report_credits": new_credits, "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")}


@app.post("/api/razorpay-webhook")
async def razorpay_webhook(request: Request,
                           x_razorpay_signature: Optional[str] = Header(None),
                           x_razorpay_event_id: Optional[str] = Header(None)):
    if not RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(503, "Webhook not configured.")
    body = await request.body()
    expected = hmac.new(RAZORPAY_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    if not x_razorpay_signature or not hmac.compare_digest(expected, x_razorpay_signature):
        raise HTTPException(400, "Invalid webhook signature.")
    event = json.loads(body)
    if event.get("event") != "subscription.charged":
        return {"success": True, "ignored": True}
    sub     = event.get("payload", {}).get("subscription", {}).get("entity", {})
    payment = event.get("payload", {}).get("payment", {}).get("entity", {})
    sub_id  = sub.get("id")
    pay_id  = payment.get("id")
    if not sub_id or not pay_id or not x_razorpay_event_id:
        raise HTTPException(400, "Webhook missing details.")
    # Idempotency check
    try:
        ddb_table(TBL_WEBHOOKS).put_item(
            Item={"event_id": x_razorpay_event_id, "processed_at": datetime.now(timezone.utc).isoformat()},
            ConditionExpression="attribute_not_exists(event_id)",
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return {"success": True, "duplicate": True}
        raise
    order = ddb_table(TBL_PAYMENTS).get_item(Key={"order_id": sub_id}).get("Item")
    if not order:
        raise HTTPException(404, "Subscription not linked to an account.")
    order = _to_float(order)
    credits_to_add = int(order["credits"])
    user_item = ddb_table(TBL_USERS).get_item(Key={"email": order["email"]}).get("Item")
    current_credits = int(_to_float(user_item or {}).get("report_credits", 0))
    ddb_table(TBL_USERS).update_item(
        Key={"email": order["email"]},
        UpdateExpression="SET report_credits = :c",
        ExpressionAttributeValues={":c": current_credits + credits_to_add},
    )
    return {"success": True}


# ── Analyze / Predict ─────────────────────────────────────
@app.post("/api/analyze")
async def analyze_car(
    images:      List[UploadFile] = File(...),
    car_brand:   Optional[str]    = Form("Maruti Suzuki"),
    car_model:   Optional[str]    = Form("Swift"),
    car_variant: Optional[str]    = Form("Base (synthetic)"),
    car_type:    Optional[str]    = Form("Petrol"),
    year:        Optional[int]    = Form(2020),
    user=Depends(current_user),
):
    if len(images) > 1:
        return {"success": False, "analysis_message": "Please upload only 1 car photo at a time.", "results": []}

    results = []
    for image in images:
        try:
            image_data = await image.read()
            img = Image.open(BytesIO(image_data)).convert("RGB")

            # Upload original image to S3
            s3_url = upload_file_to_s3(image_data, f"{user['email']}_{image.filename}")

            # Convert original to base64
            buffered = BytesIO()
            img.save(buffered, format="JPEG")
            orig_b64 = "data:image/jpeg;base64," + base64.b64encode(buffered.getvalue()).decode()

            # Run AI analysis
            analysis = model_service.analyze_car(
                img,
                car_brand=car_brand, car_model=car_model,
                car_variant=car_variant, car_type=car_type, year=year,
            )

            # Upload predicted/annotated image to S3
            combined_b64 = analysis.get("combined_b64") or ""
            s3_predicted_url = upload_b64_to_s3(
                combined_b64, f"predicted_{user['email']}_{image.filename}", user["email"]
            ) if combined_b64 else ""

            combined_price = analysis.get("combined_price")
            est_price = 0.0
            if isinstance(combined_price, dict):
                est_price = float(combined_price.get("oem_total_estimate") or combined_price.get("aftermarket_total_estimate") or 0.0)
            elif isinstance(combined_price, (int, float)):
                est_price = float(combined_price)

            detections = analysis.get("detections", [])

            # ── Save full prediction to DynamoDB ──────────────
            prediction_id = f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')}_{secrets.token_hex(6)}"
            prediction_item = {
                "email":         user["email"],
                "prediction_id": prediction_id,
                "created_at":    datetime.now(timezone.utc).isoformat(),

                # ── User Inputs ──
                "car_brand":   car_brand   or "",
                "car_model":   car_model   or "",
                "car_variant": car_variant or "",
                "car_type":    car_type    or "",
                "year":        str(year)   if year else "",
                "filename":    image.filename or "",

                # ── S3 URLs ──
                "s3_url":           s3_url or "",
                "s3_predicted_url": s3_predicted_url or "",

                # ── AI Summary ──
                "damage_message":  analysis.get("message", ""),
                "estimated_price": Decimal(str(int(est_price))) if est_price else Decimal("0"),
                "analysis_success": analysis.get("success", False),

                # ── Full Detections (all detected damages) ──
                "detections": _clean(detections),

                # ── Full Price Breakdown ──
                "combined_price": _clean(combined_price) if combined_price else {},

                # ── Model classification results ──
                "car_vs_noncar":         _clean(analysis.get("car_vs_noncar") or {}),
                "car_damage_classifier": _clean(analysis.get("car_damage_classifier") or {}),

                # ── User info snapshot ──
                "user_name":  user.get("name", ""),
                "user_phone": user.get("phone", ""),
            }
            try:
                ddb_table(TBL_PREDICTIONS).put_item(Item=prediction_item)
                logging.info(f"Saved prediction {prediction_id} for {user['email']}")
            except Exception as db_err:
                logging.error(f"Failed to save prediction to DynamoDB: {db_err}")

            results.append({
                "filename":              image.filename,
                "prediction_id":         prediction_id,
                "s3_url":                s3_url,
                "s3_predicted_url":      s3_predicted_url,
                "success":               analysis["success"],
                "original_b64":          orig_b64,
                "combined_b64":          analysis.get("combined_b64"),
                "damage_detect_b64":     analysis.get("damage_detect_b64"),
                "damage_seg_b64":        analysis.get("damage_seg_b64"),
                "parts_seg_b64":         analysis.get("parts_seg_b64"),
                "grid_b64":              analysis.get("grid_b64"),
                "detections":            detections,
                "combined_price":        analysis.get("combined_price"),
                "car_vs_noncar":         analysis.get("car_vs_noncar"),
                "car_damage_classifier": analysis.get("car_damage_classifier"),
                "analysis_message":      analysis["message"],
            })
        except Exception as e:
            logging.exception(f"Error during car analysis for {image.filename}: {e}")
            if isinstance(e, HTTPException):
                raise
            results.append({"filename": image.filename, "success": False,
                            "analysis_message": f"Error: {str(e)}"})

    return {"success": True, "results": results}


# ── Prediction History ────────────────────────────────────
@app.get("/api/user/predictions")
def get_user_predictions(user=Depends(current_user)):
    """Fetch full prediction history for the logged-in user from DynamoDB."""
    try:
        resp = ddb_table(TBL_PREDICTIONS).query(
            KeyConditionExpression=Key("email").eq(user["email"]),
            ScanIndexForward=False,  # newest first
            Limit=50,
        )
        items = _to_float(resp.get("Items", []))
        # Sort newest first by prediction_id (which starts with timestamp)
        items.sort(key=lambda x: x.get("prediction_id", ""), reverse=True)
        return items
    except Exception as e:
        logging.error(f"Error fetching predictions: {e}")
        raise HTTPException(503, f"Could not fetch history: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

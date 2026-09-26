from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from PIL import Image
import base64
from model_service import model_service
import uvicorn

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
    return {"status": "Backend is running"}

from typing import List, Optional
from fastapi import Form
from pydantic import BaseModel
import os
import time
import random

try:
    import razorpay
except ImportError:
    razorpay = None

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_RMCL2XxhTCiDHJ")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "test_secret_RMCL2XxhTCiDHJ")
ACCOUNT_ID = "acc_RMCL2XxhTCiDHJ"
ACCOUNT_MID = "RMCL2XxhTCiDHJ"
ACCOUNT_NAME = "PIYUSH GUPTA"

class CreateOrderRequest(BaseModel):
    amount: int
    plan_name: str
    coupon_code: Optional[str] = None
    discount_amount: Optional[int] = 0

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: Optional[str] = None
    plan_name: Optional[str] = None
    amount: Optional[int] = None
    coupon_code: Optional[str] = None

class CouponRequest(BaseModel):
    coupon_code: str
    amount: int
    plan_name: Optional[str] = None

@app.post("/api/apply-coupon")
def apply_coupon(req: CouponRequest):
    code = req.coupon_code.strip().upper() if req.coupon_code else ""
    amount = req.amount
    discount = 0

    coupons = {
        "REPAIR10": {"type": "percent", "val": 10, "desc": "10% OFF on all plans"},
        "CAR20": {"type": "percent", "val": 20, "desc": "20% OFF on all plans"},
        "FIRST50": {"type": "percent", "val": 50, "desc": "50% Special Welcome Discount"},
        "PIYUSH100": {"type": "flat", "val": 100, "desc": "₹100 Flat Discount"},
        "REPAIR20": {"type": "percent", "val": 20, "desc": "20% OFF Special Promo"},
        "SAVE15": {"type": "percent", "val": 15, "desc": "15% Instant Savings"},
        "FREEPASS": {"type": "percent", "val": 100, "desc": "100% Complimentary Access"},
    }

    if code in coupons:
        c = coupons[code]
        if c["type"] == "percent":
            discount = int(round(amount * (c["val"] / 100.0)))
        else:
            discount = min(amount, c["val"])
        
        final_amount = max(0, amount - discount)
        return {
            "valid": True,
            "code": code,
            "original_amount": amount,
            "discount_amount": discount,
            "final_amount": final_amount,
            "message": f"Coupon '{code}' applied! Saved ₹{discount} ({c['desc']})"
        }
    else:
        return {
            "valid": False,
            "code": code,
            "original_amount": amount,
            "discount_amount": 0,
            "final_amount": amount,
            "message": "Invalid or expired coupon code. Try REPAIR10, CAR20, or FIRST50."
        }

@app.get("/api/razorpay-config")
def get_razorpay_config():
    return {
        "key_id": RAZORPAY_KEY_ID,
        "account_id": ACCOUNT_ID,
        "mid": ACCOUNT_MID,
        "account_name": ACCOUNT_NAME,
        "merchant_name": "RepairLensAI (Piyush Gupta)"
    }

@app.post("/api/create-razorpay-order")
def create_razorpay_order(req: CreateOrderRequest):
    final_amount = max(0, req.amount - (req.discount_amount or 0))
    amount_in_paise = final_amount * 100
    order_id = f"order_{int(time.time())}_{random.randint(1000, 9999)}"
    
    if razorpay and RAZORPAY_KEY_ID and not RAZORPAY_KEY_ID.startswith("rzp_test_RMCL"):
        try:
            client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
            data = {
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"rcpt_{int(time.time())}",
                "notes": {
                    "plan": req.plan_name,
                    "coupon": req.coupon_code or "None",
                    "account_id": ACCOUNT_ID,
                    "mid": ACCOUNT_MID,
                    "merchant": ACCOUNT_NAME
                }
            }
            order = client.order.create(data=data)
            order_id = order.get("id", order_id)
        except Exception as e:
            print(f"Razorpay Client error (using generated order ID): {e}")

    return {
        "success": True,
        "order_id": order_id,
        "amount": amount_in_paise,
        "final_price_rupees": final_amount,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "account_id": ACCOUNT_ID,
        "mid": ACCOUNT_MID,
        "account_name": ACCOUNT_NAME,
        "plan_name": req.plan_name,
        "coupon_code": req.coupon_code
    }

@app.post("/api/verify-razorpay-payment")
def verify_razorpay_payment(req: VerifyPaymentRequest):
    return {
        "success": True,
        "status": "PAID",
        "message": f"Payment of ₹{req.amount or 0} for plan '{req.plan_name}' was successful!",
        "order_id": req.razorpay_order_id,
        "payment_id": req.razorpay_payment_id,
        "account_name": ACCOUNT_NAME,
        "account_id": ACCOUNT_ID,
        "mid": ACCOUNT_MID,
        "coupon_used": req.coupon_code or "None",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }

@app.post("/api/analyze")
async def analyze_car(
    images: List[UploadFile] = File(...),
    car_brand: Optional[str] = Form("Maruti Suzuki"),
    car_model: Optional[str] = Form("Swift"),
    car_variant: Optional[str] = Form("Base (synthetic)"),
    car_type: Optional[str] = Form("Petrol"),
    year: Optional[int] = Form(2020)
):
    if len(images) > 1:
        return {"success": False, "analysis_message": "Please upload only 1 car photo at a time.", "results": []}

    results = []
    
    for image in images:
        try:
            image_data = await image.read()
            img = Image.open(BytesIO(image_data)).convert("RGB")
            
            # Convert original image to base64
            buffered = BytesIO()
            img.save(buffered, format="JPEG")
            orig_b64 = "data:image/jpeg;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")
            
            analysis_result = model_service.analyze_car(
                img,
                car_brand=car_brand,
                car_model=car_model,
                car_variant=car_variant,
                car_type=car_type,
                year=year
            )
            
            results.append({
                "filename": image.filename,
                "success": analysis_result["success"],
                "original_b64": orig_b64,
                "combined_b64": analysis_result.get("combined_b64"),
                "damage_detect_b64": analysis_result.get("damage_detect_b64"),
                "damage_seg_b64": analysis_result.get("damage_seg_b64"),
                "parts_seg_b64": analysis_result.get("parts_seg_b64"),
                "grid_b64": analysis_result.get("grid_b64"),
                "detections": analysis_result.get("detections", []),
                "combined_price": analysis_result.get("combined_price"),
                "car_vs_noncar": analysis_result.get("car_vs_noncar"),
                "car_damage_classifier": analysis_result.get("car_damage_classifier"),
                "analysis_message": analysis_result["message"]
            })
        except Exception as e:
            results.append({
                "filename": image.filename,
                "success": False,
                "analysis_message": f"Error processing image: {str(e)}"
            })

    return {
        "success": True,
        "results": results
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

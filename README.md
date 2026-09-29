# RepairLensAI

## Run locally

```powershell
docker compose up --build -d
```

Open the app at http://localhost:3001. Accounts and report credits are stored in `backend/repairlens.db`.

## Razorpay setup

Add these values to a local `.env` file before starting Compose. Never commit real credentials.

```dotenv
RAZORPAY_KEY_ID=rzp_test_or_live_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_MERCHANT_NAME=Your merchant name
RAZORPAY_PLAN_STARTER_ID=plan_id_for_599_inr_monthly
RAZORPAY_PLAN_STANDARD_ID=plan_id_for_999_inr_monthly
RAZORPAY_PLAN_PRO_ID=plan_id_for_1799_inr_monthly
```

Create matching monthly plans in the Razorpay Dashboard. Configure a webhook to `https://your-domain/api/razorpay-webhook` with the same webhook secret and subscribe to `subscription.charged`. The single-report checkout works as an order; monthly plans remain unavailable until their Razorpay Plan IDs are configured. Coupons apply to one-time report purchases, not recurring subscriptions.

Without Razorpay credentials, checkout deliberately returns a configuration error and does not create fake orders or grant report credits.

## Analysis flow

Users must sign in and have a report credit before analysis. The backend validates the upload, runs the car classifier, skips damage models for cars classified as undamaged, then runs detection, segmentation, and `price.keras` for damaged vehicles. A failed/non-car analysis returns its reserved credit. Missing required model weights are reported explicitly rather than replaced with sample results.

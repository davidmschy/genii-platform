"""Stripe Payment Processing Integration"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import os

router = APIRouter(
    prefix="/stripe",
    tags=["payments"],
)

# Stripe configuration (set via environment variables)
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_YOUR_TEST_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_YOUR_WEBHOOK_SECRET")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_YOUR_PUBLISHABLE_KEY")

class PaymentIntentRequest(BaseModel):
    amount: int  # Amount in cents
    currency: str = "usd"
    tier: str
    customer_email: str
    affiliate_id: Optional[str] = None

class SubscriptionRequest(BaseModel):
    tier: str  # starter, pro, enterprise, white_glove
    customer_email: str
    affiliate_id: Optional[str] = None

@router.get("/config")
async def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    return {
        "publishableKey": STRIPE_PUBLISHABLE_KEY,
        "prices": {
            "starter": {"amount": 9900, "currency": "usd"},    # $99
            "pro": {"amount": 29900, "currency": "usd"},       # $299
            "enterprise": {"amount": 99900, "currency": "usd"}, # $999
            "white_glove": {"amount": 250000, "currency": "usd"} # $2500
        }
    }

@router.post("/create-payment-intent")
async def create_payment_intent(request: PaymentIntentRequest):
    """Create a payment intent for one-time purchases"""
    try:
        # This would use stripe library in production
        # import stripe
        # stripe.api_key = STRIPE_SECRET_KEY
        # intent = stripe.PaymentIntent.create(...)
        
        return {
            "clientSecret": "pi_mock_secret_" + str(request.amount),
            "amount": request.amount,
            "currency": request.currency,
            "status": "requires_confirmation",
            "note": "Connect real Stripe account to process payments"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create-subscription")
async def create_subscription(request: SubscriptionRequest):
    """Create a subscription checkout session"""
    tier_prices = {
        "starter": 9900,
        "pro": 29900,
        "enterprise": 99900,
        "white_glove": 250000
    }
    
    if request.tier not in tier_prices:
        raise HTTPException(status_code=400, detail="Invalid tier")
    
    # This would create a real Stripe checkout session
    return {
        "sessionId": "cs_mock_" + request.tier,
        "url": f"https://checkout.stripe.com/mock/{request.tier}",
        "tier": request.tier,
        "amount": tier_prices[request.tier],
        "customer_email": request.customer_email,
        "note": "Connect real Stripe account at /stripe/connect"
    }

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks for payment events"""
    payload = await request.body()
    
    # Verify webhook signature in production
    # stripe_webhook_secret = STRIPE_WEBHOOK_SECRET
    
    # Process the event
    # event = stripe.Webhook.construct_event(payload, sig_header, stripe_webhook_secret)
    
    return {"status": "received", "note": "Implement webhook handling for production"}

@router.get("/connect")
async def get_stripe_connect_info():
    """Instructions for connecting Stripe account"""
    return {
        "status": "not_connected",
        "instructions": [
            "1. Create Stripe account at https://stripe.com",
            "2. Get API keys from https://dashboard.stripe.com/apikeys",
            "3. Set environment variables:",
            "   - STRIPE_SECRET_KEY=sk_live_...",
            "   - STRIPE_PUBLISHABLE_KEY=pk_live_...",
            "   - STRIPE_WEBHOOK_SECRET=whsec_...",
            "4. Restart the server",
            "5. Test with /stripe/config endpoint"
        ],
        "test_cards": {
            "success": "4242 4242 4242 4242",
            "decline": "4000 0000 0000 0002"
        }
    }

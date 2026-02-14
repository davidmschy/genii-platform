"""Revenue Dashboard and Monetization API"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

router = APIRouter(
    prefix="/revenue",
    tags=["revenue"],
)

# Empty revenue tracking - starts fresh
_revenue_db = {
    "transactions": [],
    "affiliate_earnings": [],
    "subscriptions": [],
    "fulfillment_fees": []
}

# Pricing tiers
SUBSCRIPTION_TIERS = {
    "starter": {"price": 99, "commission": 0.20},
    "pro": {"price": 299, "commission": 0.25},
    "enterprise": {"price": 999, "commission": 0.30},
    "white_glove": {"price": 2500, "commission": 0.35}
}

@router.get("/dashboard")
async def get_revenue_dashboard():
    """Real-time revenue dashboard - starts at $0"""
    total_revenue = sum(t["amount"] for t in _revenue_db["transactions"])
    total_affiliate = sum(a["commission"] for a in _revenue_db["affiliate_earnings"])
    total_subscriptions = sum(s["monthly_amount"] for s in _revenue_db["subscriptions"] if s["status"] == "active")
    total_fulfillment = sum(f["fee"] for f in _revenue_db["fulfillment_fees"])
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "summary": {
            "total_revenue_30d": round(total_revenue, 2),
            "affiliate_earnings": round(total_affiliate, 2),
            "subscription_mrr": round(total_subscriptions, 2),
            "fulfillment_fees": round(total_fulfillment, 2),
            "grand_total": round(total_revenue + total_affiliate + total_subscriptions + total_fulfillment, 2)
        },
        "streams": {
            "subscriptions": {
                "active_count": len([s for s in _revenue_db["subscriptions"] if s["status"] == "active"]),
                "tiers": SUBSCRIPTION_TIERS
            },
            "affiliate": {
                "programs": ["vultr", "digitalocean", "kimi", "anthropic", "clickup"],
                "total_affiliate_links": 0
            },
            "fulfillment": {
                "completed_orders": len(_revenue_db["fulfillment_fees"])
            }
        },
        "sales_history": _revenue_db["transactions"],
        "note": "Start making sales to see data here"
    }

@router.post("/record-sale")
async def record_sale(
    product: str,
    tier: str,
    customer_email: str,
    amount: float,
    affiliate_id: Optional[str] = None
):
    """Record a new sale - this is where real revenue gets tracked"""
    sale_id = str(uuid.uuid4())
    
    # Calculate affiliate commission if applicable
    commission = 0
    if affiliate_id and tier in SUBSCRIPTION_TIERS:
        commission = amount * SUBSCRIPTION_TIERS[tier]["commission"]
        _revenue_db["affiliate_earnings"].append({
            "id": str(uuid.uuid4()),
            "affiliate_id": affiliate_id,
            "sale_id": sale_id,
            "amount": amount,
            "commission": round(commission, 2),
            "timestamp": datetime.utcnow().isoformat()
        })
    
    # Record transaction
    transaction = {
        "id": sale_id,
        "product": product,
        "tier": tier,
        "customer": customer_email,
        "amount": amount,
        "commission_paid": round(commission, 2),
        "net_revenue": round(amount - commission, 2),
        "timestamp": datetime.utcnow().isoformat()
    }
    _revenue_db["transactions"].append(transaction)
    
    # Add subscription
    _revenue_db["subscriptions"].append({
        "id": str(uuid.uuid4()),
        "sale_id": sale_id,
        "tier": tier,
        "monthly_amount": SUBSCRIPTION_TIERS.get(tier, {}).get("price", 0),
        "start_date": datetime.utcnow().isoformat(),
        "status": "active"
    })
    
    return {
        "sale_id": sale_id,
        "status": "recorded",
        "gross_amount": amount,
        "commission": round(commission, 2),
        "net_revenue": round(amount - commission, 2)
    }

@router.get("/sales")
async def get_all_sales():
    """Get all sales history"""
    return {
        "total_sales": len(_revenue_db["transactions"]),
        "sales": _revenue_db["transactions"],
        "affiliate_earnings": _revenue_db["affiliate_earnings"]
    }

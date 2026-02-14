"""Marketplace API with Revenue Tracking"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import uuid
from datetime import datetime

router = APIRouter(
    prefix="/marketplace",
    tags=["marketplace"],
)

# In-memory sales tracking (would use database in production)
_sales_db = []

# Pricing tiers with features
TIERS = {
    "starter": {
        "name": "Genii Starter",
        "price": 99,
        "billing": "monthly",
        "features": ["3 AI Agents", "Basic CRM", "Email Support", "1 Workspace"],
        "commission_rate": 0.20
    },
    "pro": {
        "name": "Genii Pro", 
        "price": 299,
        "billing": "monthly",
        "features": ["10 AI Agents", "Advanced CRM", "Priority Support", "5 Workspaces", "API Access"],
        "commission_rate": 0.25
    },
    "enterprise": {
        "name": "Genii Enterprise",
        "price": 999,
        "billing": "monthly", 
        "features": ["Unlimited Agents", "Full ERP", "24/7 Support", "Unlimited Workspaces", "White-label"],
        "commission_rate": 0.30
    },
    "white_glove": {
        "name": "Genii White Glove",
        "price": 2500,
        "billing": "monthly",
        "features": ["Everything in Enterprise", "Dedicated Setup", "Custom Agents", "SLA Guarantee"],
        "commission_rate": 0.35
    }
}

@router.get("/tiers")
async def get_tiers():
    """Get all available subscription tiers"""
    return {
        "tiers": TIERS,
        "popular": "pro",
        "currency": "USD"
    }

@router.post("/purchase")
async def process_purchase(tier: str, email: str, affiliate_id: str = None):
    """
    Process a marketplace purchase and generate install command.
    Records revenue for tracking.
    """
    if tier not in TIERS:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {tier}")
    
    install_token = str(uuid.uuid4())[:8]
    tier_info = TIERS[tier]
    
    # Record the sale
    sale = {
        "id": str(uuid.uuid4()),
        "tier": tier,
        "customer_email": email,
        "amount": tier_info["price"],
        "affiliate_id": affiliate_id,
        "commission": tier_info["price"] * tier_info["commission_rate"] if affiliate_id else 0,
        "timestamp": datetime.utcnow().isoformat(),
        "install_token": install_token,
        "status": "completed"
    }
    _sales_db.append(sale)
    
    # Generate install command
    install_command = f"curl -sSL https://genii.sh/install | bash -s -- --token {install_token} --email {email}"
    
    return {
        "status": "success",
        "message": f"Welcome to {tier_info['name']}!",
        "tier": tier,
        "amount_charged": tier_info["price"],
        "billing": tier_info["billing"],
        "features": tier_info["features"],
        "install_command": install_command,
        "onboarding_url": f"http://localhost:3000/onboarding/{install_token}",
        "sale_id": sale["id"],
        "next_steps": [
            "Run the install command on your server",
            "Configure your first AI agent",
            "Connect your communication channels (Email, Slack, SMS)"
        ]
    }

@router.get("/sales")
async def get_sales_report():
    """Get sales report"""
    total_revenue = sum(s["amount"] for s in _sales_db)
    total_commissions = sum(s["commission"] for s in _sales_db)
    
    by_tier = {}
    for sale in _sales_db:
        tier = sale["tier"]
        if tier not in by_tier:
            by_tier[tier] = {"count": 0, "revenue": 0}
        by_tier[tier]["count"] += 1
        by_tier[tier]["revenue"] += sale["amount"]
    
    return {
        "total_sales": len(_sales_db),
        "total_revenue": round(total_revenue, 2),
        "total_commissions": round(total_commissions, 2),
        "net_revenue": round(total_revenue - total_commissions, 2),
        "by_tier": by_tier,
        "recent_sales": _sales_db[-5:]
    }

@router.get("/affiliates")
async def get_affiliate_links():
    """Returns affiliate links for infrastructure partners"""
    return {
        "vps": {
            "vultr": "https://vultr.com/?ref=genii",
            "digitalocean": "https://m.do.co/c/genii",
            "linode": "https://linode.com/?r=genii"
        },
        "gpus": {
            "lambdalabs": "https://lambdalabs.com/?ref=genii",
            "paperspace": "https://paperspace.com/?r=genii"
        },
        "llm": {
            "kimi": "https://kimi.ai/referral/genii",
            "anthropic": "https://anthropic.com/?ref=genii"
        },
        "tools": {
            "clickup": "https://clickup.com/?ref=genii",
            "slack": "https://slack.com/?ref=genii",
            "twilio": "https://twilio.com/?ref=genii"
        }
    }

@router.post("/demo-purchase")
async def demo_purchase():
    """Simulate a purchase for testing"""
    return await process_purchase(
        tier="pro",
        email="demo@example.com",
        affiliate_id="aff_demo_123"
    )

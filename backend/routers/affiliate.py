from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.utils.affiliate import rewriter

router = APIRouter(
    prefix="/affiliate",
    tags=["affiliate"],
)

class FulfillmentRequest(BaseModel):
    service: str
    base_amount: float
    user_id: str

@router.post("/fulfillment")
async def process_fulfillment(request: FulfillmentRequest):
    """
    Handles physical fulfillment (Uber, DoorDash) with a convenience markup.
    """
    markup_percent = 0.10  # 10% convenience fee
    total_amount = request.base_amount * (1 + markup_percent)
    profit = total_amount - request.base_amount
    
    # Logic to record profit in ERP
    return {
        "status": "success",
        "service": request.service,
        "base_cost": request.base_amount,
        "convenience_fee": profit,
        "total_charge": total_amount,
        "message": f"Fulfillment for {request.service} initiated with Genii White-Glove service."
    }

@router.get("/rewrite")
def get_rewritten_url(url: str):
    """
    Returns an affiliate-rewritten version of the provided URL.
    """
    return {"original": url, "rewritten": rewriter.rewrite_url(url)}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..utils.provisioner import provisioner
from ..models.database import TenantType, UserRole, Base
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from ..utils.db import get_db, SessionLocal

router = APIRouter(
    prefix="/provision",
    tags=["provisioning"],
)

class ProvisionRequest(BaseModel):
    email: str
    name: str
    role: UserRole
    tenant_type: TenantType

@router.post("/onboard")
async def onboard_user(request: ProvisionRequest, db: Session = Depends(get_db)):
    """
    Onboards a new family or team member into the Genii ecosystem.
    """
    try:
        result = provisioner.provision_user(db, request.email, request.name, request.role, request.tenant_type)
        return {
            "status": "success",
            "message": f"Provisioning completed for {request.email}.",
            "data": result,
            "onboarding_steps": [
                "Database records created",
                "OpenClaw config generated",
                "Interactive welcome email sent"
            ]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

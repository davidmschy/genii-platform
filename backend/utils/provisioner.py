import json
import os
import uuid
from typing import Dict, Any
from sqlalchemy.orm import Session
from ..models.database import Tenant, User, TenantType, UserRole

class TenantProvisioner:
    """
    Automates the rollout of new OpenClaw instances and ERP access.
    """
    def __init__(self, base_config_path: str = "C:/Users/Administrator/.openclaw/openclaw.json"):
        self.base_config_path = base_config_path

    def create_tenant_config(self, user_email: str, role: UserRole) -> Dict[str, Any]:
        """
        Scaffolds a new openclaw.json snippet for a specific user role.
        """
        try:
            with open(self.base_config_path, "r") as f:
                base_config = json.load(f)
        except Exception:
            base_config = {"version": 1, "agents": {"main": {}}, "plugins": {"entries": {}}}
        
        # Customize based on role
        tenant_config = dict(base_config)
        tenant_config["ui"] = {
            "assistant": {
                "name": f"Genii {role.value.capitalize()} Assistant",
                "avatar": "🤖"
            }
        }
        
        # Add role-specific skills/plugins if needed
        if "plugins" not in tenant_config:
            tenant_config["plugins"] = {"entries": {}}
        elif "entries" not in tenant_config["plugins"]:
             tenant_config["plugins"]["entries"] = {}
            
        if role == UserRole.KID:
            tenant_config["plugins"]["entries"]["homeschool"] = {"enabled": True}
        
        return tenant_config

    def provision_user(self, db: Session, email: str, name: str, role: UserRole, tenant_type: TenantType):
        """
        Creates DB records and returns the initial config.
        """
        # 1. Create Tenant
        slug = email.split('@')[0] + "-" + str(uuid.uuid4())[:4]
        tenant = Tenant(name=f"{name}'s Space", slug=slug, type=tenant_type)
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        # 2. Create User
        user = User(tenant_id=tenant.id, email=email, name=name, role=role)
        db.add(user)
        db.commit()
        
        # 3. Generate Config
        config = self.create_tenant_config(email, role)
        
        return {
            "tenant_id": str(tenant.id),
            "user_id": str(user.id),
            "openclaw_config": config
        }

provisioner = TenantProvisioner()

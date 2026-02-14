from sqlalchemy.orm import Session
from ..models.database import Tenant, User, TenantType, UserRole
from ..utils.db import SessionLocal
import uuid

def onboard_team_member(name: str, email: str, role: UserRole, vm_ip: str, vault_path: str):
    db = SessionLocal()
    try:
        # 1. Create Tenant (Workspace)
        slug = f"{name.lower().replace(' ', '-')}-{str(uuid.uuid4())[:4]}"
        tenant = Tenant(
            name=f"{name}'s Genii Workspace",
            slug=slug,
            type=TenantType.BUSINESS,
            vm_ip=vm_ip,
            obsidian_vault_path=vault_path
        )
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        # 2. Create User
        user = User(
            tenant_id=tenant.id,
            email=email,
            name=name,
            role=role
        )
        db.add(user)
        db.commit()
        
        print(f"Team member {name} onboarded successfully!")
        print(f"VM IP: {vm_ip}")
        print(f"Vault: {vault_path}")
        return tenant, user
    except Exception as e:
        db.rollback()
        print(f"Error onboarding team member: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    # Example usage for the user's team
    # onboard_team_member("Team Member 1", "member1@geniinow.com", UserRole.TEAM, "192.168.1.10", "C:/Vault/Team1")
    pass

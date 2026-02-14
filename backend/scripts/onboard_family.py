import sys
import os
# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.utils.provisioner import provisioner
from backend.models.database import TenantType, UserRole
from backend.utils.db import SessionLocal

def onboard_family():
    db = SessionLocal()
    try:
        print("--- Onboarding Amber ---")
        amber = provisioner.provision_user(
            db, 
            email="amber@geniinow.com", 
            name="Amber", 
            role=UserRole.AMBER, 
            tenant_type=TenantType.FAMILY
        )
        print(f"Amber Provisioned: {amber['tenant_id']}")

        print("\n--- Onboarding Kids ---")
        kids = [
            {"email": "kid1@geniinow.com", "name": "Kid 1"},
            {"email": "kid2@geniinow.com", "name": "Kid 2"}
        ]
        for kid in kids:
            k_res = provisioner.provision_user(
                db, 
                email=kid["email"], 
                name=kid["name"], 
                role=UserRole.KID, 
                tenant_type=TenantType.FAMILY
            )
            print(f"{kid['name']} Provisioned: {k_res['tenant_id']}")
            
        print("\n--- Onboarding Success ---")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    onboard_family()

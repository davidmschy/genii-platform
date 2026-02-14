import hashlib
import json
import os
from typing import Dict, Any
from datetime import datetime

class GeniiLedger:
    """
    Implements Triple-Entry Ledgering and signing for the Specialist Swarm.
    """
    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or os.getenv("LEDGER_SECRET", "genii-sovereign-secret")

    def generate_signature(self, data: Dict[str, Any], role_key: str) -> str:
        """
        Generates a SHA-256 signature for a given payload and role.
        """
        content = json.dumps(data, sort_keys=True) + self.secret_key + role_key
        return hashlib.sha256(content.encode()).hexdigest()

    def verify_triple_entry(self, entry: Dict[str, Any]) -> bool:
        """
        Verifies all three signatures in a ledger entry.
        """
        payload = entry.get("payload", {})
        
        # Verify Actor
        if entry.get("actor_sig") != self.generate_signature(payload, entry.get("actor_id")):
            return False
            
        # Verify Recipient
        if entry.get("recipient_sig") != self.generate_signature(payload, entry.get("recipient_id")):
            return False
            
        # Verify Auditor (The Auditor uses a master key or its own ID)
        if entry.get("auditor_sig") != self.generate_signature(payload, "FIN_AC_001"):
            return False
            
        return True

ledger = GeniiLedger()

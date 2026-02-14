from typing import List, Dict, Any
from pydantic import BaseModel

class HATEOASLink(BaseModel):
    rel: str
    href: str
    method: str = "GET"

class SwarmDiscovery:
    """
    Dynamic discovery engine based on the Specialist Swarm Blueprint.
    """
    def __init__(self):
        # Specialist Swarm Registry
        self.registry = {
            "MKT_PA_001": {
                "role": "Meta_Bidding_Optimizer",
                "department": "Growth",
                "actions": [
                    {"rel": "request_creative", "href": "/marketing/creative/generate", "method": "POST"},
                    {"rel": "pause_campaign", "href": "/marketing/paid/meta/stop", "method": "PATCH"},
                    {"rel": "ledger_verify", "href": "/finance/ledger/verify", "method": "GET"}
                ]
            },
            "FIN_AC_001": {
                "role": "Triple_Ledger_Auditor",
                "department": "Finance",
                "actions": [
                    {"rel": "audit_transaction", "href": "/finance/audit/verify", "method": "POST"},
                    {"rel": "compliance_check", "href": "/legal/compliance/verify", "method": "GET"}
                ]
            },
            "SLS_BD_001": {
                "role": "Lead_Dossier_Infiltrator",
                "department": "Sales",
                "actions": [
                    {"rel": "enrich_lead", "href": "/sales/leads/enrich", "method": "POST"},
                    {"rel": "book_meeting", "href": "/sales/appointments/book", "method": "POST"}
                ]
            },
            "OPS_LOG_001": {
                "role": "Logistics_Router",
                "department": "Operations",
                "actions": [
                    {"rel": "route_shipment", "href": "/ops/logistics/route", "method": "POST"},
                    {"rel": "inventory_check", "href": "/ops/inventory/check", "method": "GET"}
                ]
            }
        }

    def get_links(self, agent_id: str) -> List[HATEOASLink]:
        agent_data = self.registry.get(agent_id, {})
        return [HATEOASLink(**link) for link in agent_data.get("actions", [])]

    def discover_departments(self) -> List[str]:
        return [
            "Growth & Marketing",
            "Sales & Revenue",
            "Trust & Governance",
            "Workforce & Talent",
            "R&D & Engineering",
            "Operations & Fulfillment"
        ]

discovery = SwarmDiscovery()

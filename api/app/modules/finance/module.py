from app.modules.base import BaseModule
from typing import Dict, List, Any

class FinanceModule(BaseModule):
    name = "finance"
    description = "Accounting, invoicing, and payment processing"
    
    def get_actions(self) -> List[Dict[str, Any]]:
        return [
            {
                "rel": "create_invoice",
                "href": "/api/v1/finance/invoices",
                "method": "POST",
                "title": "Create Invoice",
                "description": "Create a new invoice for a customer",
                "requires": ["partner_id", "line_items"],
                "optional": ["due_date", "tax_rate", "notes"],
            },
            {
                "rel": "list_invoices",
                "href": "/api/v1/finance/invoices",
                "method": "GET",
                "title": "List Invoices",
                "description": "Get all invoices with optional filtering",
            },
            {
                "rel": "send_invoice",
                "href": "/api/v1/finance/invoices/{id}/send",
                "method": "POST",
                "title": "Send Invoice",
                "description": "Send invoice to customer via email",
            },
            {
                "rel": "record_payment",
                "href": "/api/v1/finance/payments",
                "method": "POST",
                "title": "Record Payment",
                "description": "Record payment against an invoice",
                "requires": ["invoice_id", "amount", "method"],
            },
        ]
    
    def get_schemas(self) -> Dict[str, Any]:
        return {
            "Invoice": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "format": "uuid"},
                    "invoice_number": {"type": "string"},
                    "partner_id": {"type": "string", "format": "uuid"},
                    "status": {"type": "string", "enum": ["draft", "sent", "paid", "overdue"]},
                    "total": {"type": "number"},
                    "due_date": {"type": "string", "format": "date"},
                }
            }
        }

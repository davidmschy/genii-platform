from typing import Dict, List, Any
from abc import ABC, abstractmethod

class BaseModule(ABC):
    """Base class for all ERP modules with HATEOAS discovery"""
    
    name: str = ""
    description: str = ""
    version: str = "1.0.0"
    
    @abstractmethod
    def get_actions(self) -> List[Dict[str, Any]]:
        """Return available actions with HATEOAS links"""
        pass
    
    @abstractmethod
    def get_schemas(self) -> Dict[str, Any]:
        """Return input/output schemas for actions"""
        pass
    
    def discover(self) -> Dict[str, Any]:
        """Return full discovery document"""
        return {
            "module": self.name,
            "description": self.description,
            "version": self.version,
            "_links": {
                "self": {"href": f"/api/v1/modules/{self.name}", "method": "GET"},
                "actions": self.get_actions(),
            },
            "schemas": self.get_schemas()
        }

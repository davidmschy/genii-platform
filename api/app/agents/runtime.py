import os
import requests
from typing import Dict, List, Any

class AgentRuntime:
    """OpenClaw agent runtime integration"""
    
    def __init__(self):
        self.openclaw_url = os.getenv("OPENCLAW_GATEWAY_URL", "http://localhost:18789")
        self.token = os.getenv("OPENCLAW_TOKEN")
    
    async def process_message(
        self,
        agent_namespace: str,
        message: str,
        context: Dict[str, Any]
    ) -> str:
        """Send message to OpenClaw agent and get response"""
        
        # Construct agent session key
        session_key = f"agent:{agent_namespace.replace(':', '-')}:main"
        
        # Send to OpenClaw
        response = requests.post(
            f"{self.openclaw_url}/v1/sessions/{session_key}/messages",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "content": message,
                "context": context
            }
        )
        
        return response.json().get("content", "")
    
    async def execute_task(
        self,
        agent_namespace: str,
        task_type: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute agent task with tool use"""
        
        # Build task prompt
        prompt = f"""
        Task: {task_type}
        Parameters: {parameters}
        
        Execute this task using available tools.
        Return result as JSON with 'status', 'result', and 'next_actions'.
        """
        
        response = await self.process_message(
            agent_namespace,
            prompt,
            {"task_type": task_type, "parameters": parameters}
        )
        
        return {"status": "completed", "result": response}
    
    async def get_agent_capabilities(self, agent_namespace: str) -> List[str]:
        """Get capabilities for agent"""
        capabilities = {
            "content:sarah": ["write_blog", "create_social", "email_campaign"],
            "sales:john": ["lead_qualification", "demo_scheduling", "proposal_writing"],
            "design:mike": ["logo_design", "ui_mockups", "brand_guidelines"],
        }
        return capabilities.get(agent_namespace, [])

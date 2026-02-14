from typing import Dict, Any
import asyncio
from .bridge import bridge

class ButlerSkill:
    """
    Detailed logic for the Personal Butler.
    Orchestrates real-world tasks via browser agents.
    """
    def __init__(self, config: Dict[str, Any]):
        self.config = config

    async def book_resource(self, service: str, details: str):
        """
        General method to trigger a browser agent for a specific service.
        """
        prompt = f"Using the Butler persona, log into {service} and perform the following: {details}"
        
        # In a real impl, this would call the browser-subagent or a specialized browser-tool agent
        agent_response = bridge.run_agent_task(
            agent_id="feature-dev/developer", # Placeholder for the Butler agent
            prompt=prompt
        )
        return agent_response

    async def run(self, task: str, parameters: Dict[str, Any]):
        if task == "book_uber":
            return await self.book_resource("Uber", f"Book a ride to {parameters.get('destination')}")
        elif task == "order_amazon":
            return await self.book_resource("Amazon", f"Purchase {parameters.get('item')}")
        elif task == "order_groceries":
             return await self.book_resource("Instacart", f"Deliver these groceries: {parameters.get('list')}")
        else:
            return {"error": "Task not supported by Butler yet."}

from typing import Dict, Any
import aiohttp

class ClickUpSkill:
    """
    Directly interfaces with ClickUp API to manage team tasks and spaces.
    """
    def __init__(self, config: Dict[str, Any]):
        self.api_key = config.get("api_key")
        self.base_url = "https://api.clickup.com/api/v2"

    async def get_tasks(self, list_id: str):
        headers = {"Authorization": self.api_key}
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/list/{list_id}/task", headers=headers) as resp:
                return await resp.json()

    async def create_task(self, list_id: str, name: str, description: str):
        headers = {"Authorization": self.api_key, "Content-Type": "application/json"}
        payload = {"name": name, "description": description}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/list/{list_id}/task", headers=headers, json=payload) as resp:
                return await resp.json()

    async def run(self, task: str, parameters: Dict[str, Any]):
        if task == "get_tasks":
            return await self.get_tasks(parameters.get("list_id"))
        elif task == "create_task":
            return await self.create_task(
                parameters.get("list_id"), 
                parameters.get("name"), 
                parameters.get("description")
            )
        else:
            return {"error": "Unknown task"}

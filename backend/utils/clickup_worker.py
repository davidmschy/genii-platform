import asyncio
import os
from backend.utils.google_auth import google_auth
from backend.utils.bridge import bridge
from backend.routers.clickup import ClickUpSkill

class ClickUpWorker:
    """
    Background worker that syncs ClickUp tasks with the Genii ERP.
    """
    def __init__(self, api_key: str, default_list_id: str):
        self.skill = ClickUpSkill({"api_key": api_key})
        self.default_list_id = default_list_id
        self.running = False

    async def sync_loop(self, interval: int = 300):
        """
        Periodically syncs tasks.
        """
        self.running = True
        print("ClickUpWorker: Starting sync loop...")
        while self.running:
            try:
                tasks = await self.skill.get_tasks(self.default_list_id)
                print(f"ClickUpWorker: Synced {len(tasks.get('tasks', []))} tasks.")
                # Logic to update database models would go here
            except Exception as e:
                print(f"ClickUpWorker Error: {e}")
            await asyncio.sleep(interval)

    def stop(self):
        self.running = False

worker = ClickUpWorker(
    api_key=os.getenv("CLICKUP_API_KEY", ""),
    default_list_id=os.getenv("CLICKUP_LIST_ID", "")
)

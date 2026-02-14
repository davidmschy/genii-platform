import os
from typing import List, Optional

class ObsidianBrain:
    """
    Interface for the shared Obsidian Brain vault across team VMs.
    """
    def __init__(self, base_path: str = "C:/Users/Administrator/Documents/Obsidian Vault"):
        self.base_path = base_path

    def read_note(self, relative_path: str) -> Optional[str]:
        full_path = os.path.join(self.base_path, relative_path)
        if os.path.exists(full_path):
            with open(full_path, "r", encoding="utf-8") as f:
                return f.read()
        return None

    def write_note(self, relative_path: str, content: str):
        full_path = os.path.join(self.base_path, relative_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

    def list_inbox(self) -> List[str]:
        inbox_path = os.path.join(self.base_path, "00_INBOX")
        if os.path.exists(inbox_path):
            return os.listdir(inbox_path)
        return []

brain = ObsidianBrain()

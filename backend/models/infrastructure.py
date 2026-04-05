from beanie import Document
from pydantic import Field
from datetime import datetime, timezone


class InfraItem(Document):
    name: str
    category: str = "venue"    # venue | materials | digital | logistics
    owner: str = ""
    notes: str = ""
    done: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "infrastructure_items"

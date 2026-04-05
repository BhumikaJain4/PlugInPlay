from beanie import Document
from pydantic import Field
from datetime import datetime, timezone
from typing import Optional, Dict, Any


class ActivityLog(Document):
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    message: str

    performed_by_id: Optional[str] = None
    performed_by_name: str
    performed_by_email: str
    performed_by_role: str

    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "activity_logs"

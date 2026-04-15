from beanie import Document
from pydantic import Field
from datetime import datetime, timezone
from typing import Any


class GlobalSettings(Document):
    key: str                        # e.g. "interview_questions", "smtp"
    value: Any = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "global_settings"

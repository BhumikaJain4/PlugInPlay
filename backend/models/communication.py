from beanie import Document
from pydantic import Field, EmailStr
from datetime import datetime, timezone


class Communication(Document):
    title: str
    assigned_to: str
    recipient_email: EmailStr | str = ""
    status: str = "draft"    # draft | approved | sent
    doc_link: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "communications"

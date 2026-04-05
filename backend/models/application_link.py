from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime, timezone


class ApplicationLink(Document):
    key: Indexed(str, unique=True)
    url: str = ""
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "application_links"

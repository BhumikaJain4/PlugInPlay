from beanie import Document
from pydantic import Field
from datetime import datetime, timezone
from typing import Optional


class TeamMember(Document):
    name: str
    dept: str = "—"
    role: str = "—"
    email: str = ""
    avatar_color: str = "maroon"   # maroon | gold | green | blue | purple | pink
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "team_members"

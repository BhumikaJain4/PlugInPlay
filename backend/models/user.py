from beanie import Document, Indexed
from pydantic import EmailStr, Field
from datetime import datetime, timezone
from typing import Optional


class User(Document):
    name: str
    email: Indexed(EmailStr, unique=True)
    hashed_password: str
    role: str = "member"          # "admin" | "member"
    avatar_color: str = "maroon"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

    class Settings:
        name = "users"

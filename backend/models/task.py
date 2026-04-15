from beanie import Document, Link
from pydantic import Field
from datetime import datetime, timezone
from typing import Optional, List
from models.user import User


class TaskLink(Document):
    """Embedded-style sub-doc for reference links on a task."""
    title: str
    url: str
    type: str = "doc"  # doc | form | canva | ppt | email | drive

    class Settings:
        name = "task_links"


class Task(Document):
    title: str
    detail: str = ""
    assigned_to: str                       # name string (flexible)
    due_date: str                          # "19 March" display string
    due_day: int                           # numeric day for calendar
    due_month: int = 3                     # numeric month
    due_year: int = 2026
    status: str = "pending"               # "pending" | "completed"
    module: str = "SM Orientation"
    links: List[dict] = Field(default_factory=list)   # [{title, url, type}]
    created_by: Optional[str] = None      # user id
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "tasks"

from beanie import Document, Indexed
from pydantic import EmailStr, Field
from datetime import datetime, timezone
from typing import Optional, Any


class ParticipantApplication(Document):
    name: str
    email: Indexed(EmailStr, unique=True)
    enrollment: str = ""
    year: str = ""
    clubs: list[str] = Field(default_factory=list)
    leadership_position: str = ""
    program: str = ""
    cgpa: str = ""
    geography: str = ""
    gender: str = ""
    three_words: str = ""
    submission_link_care: str = ""
    submission_link_change: str = ""
    source_sheet_row: Optional[int] = None

    # Screening
    screening_reviewer: str = ""
    screening_decision: str = ""
    screening_remarks: str = ""
    screening_decided_by: str = ""
    screening_decided_at: Optional[datetime] = None
    screening_email_sent: bool = False
    screening_email_message: str = ""

    # Interview
    interview_reviewer: str = ""
    interview_decision: str = ""
    interview_questions: list[dict[str, Any]] = Field(default_factory=list)
    interview_total_marks: int = 0
    interview_remarks: str = ""
    interview_scored_by: str = ""
    interview_scored_at: Optional[datetime] = None

    # Final
    final_selected: bool = False
    final_mail_sent: bool = False
    final_mail_sent_at: Optional[datetime] = None

    stage: str = "applied"

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "participant_applications"

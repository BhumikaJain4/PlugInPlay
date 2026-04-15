from datetime import datetime, timezone
import csv
import io
import re
from typing import Optional, Literal, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
import httpx

from core.audit import log_activity
from core.config import get_settings
from core.mailer import send_email
from core.security import get_current_user
from models.activity_log import ActivityLog
from models.application_link import ApplicationLink
from models.participant import ParticipantApplication
from models.settings import GlobalSettings
from models.user import User

router = APIRouter(prefix="/api/participants", tags=["participants"])

EVALUATORS = ["Kalyani B", "Ameresh K", "KM"]
SHEET_FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/csv,text/plain,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

DEFAULT_QUESTIONS = [
    "Self-Awareness and Willingness to Grow",
    "Sensitivity and Care for Others",
    "Clarity in Communication",
    "Sense of Responsibility and Initiative",
    "Orientation to Change and Enabling Others",
]

# ── Schemas ───────────────────────────────────────────────────────────────────

class ParticipantCreate(BaseModel):
    name: str
    email: EmailStr
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


class ParticipantBulkCreate(BaseModel):
    participants: list[ParticipantCreate]


class AutoAssignRequest(BaseModel):
    quotas: dict[str, int]   # e.g. {"Kalyani B": 100, "Ameresh K": 100, "KM": 97}


class ScreeningUpdate(BaseModel):
    reviewer: str
    decision: Literal["yes", "no", "maybe"]
    remarks: str = ""
    email_subject: str = "You're shortlisted for the interview round!"
    email_body: Optional[str] = None


class InterviewQuestionScore(BaseModel):
    question: str
    marks: int = 0


class InterviewUpdate(BaseModel):
    reviewer: str
    decision: Literal["yes", "no", "maybe"]
    remarks: str = ""
    questions: list[InterviewQuestionScore] = Field(default_factory=list)


class FinalSelectionUpdate(BaseModel):
    selected: bool


class FinalMailRequest(BaseModel):
    ids: list[str] = Field(default_factory=list)
    subject: str = "Congratulations – Final Selection"
    body: Optional[str] = None


class QuestionsUpdate(BaseModel):
    questions: list[str]


class ImportFromSheetRequest(BaseModel):
    url: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def p2d(p: ParticipantApplication) -> dict[str, Any]:
    return {
        "id": str(p.id),
        "name": p.name,
        "email": p.email,
        "enrollment": p.enrollment,
        "year": p.year,
        "clubs": p.clubs,
        "leadership_position": p.leadership_position,
        "program": p.program,
        "cgpa": p.cgpa,
        "geography": p.geography,
        "gender": p.gender,
        "three_words": p.three_words,
        "submission_link_care": p.submission_link_care,
        "submission_link_change": p.submission_link_change,
        "source_sheet_row": p.source_sheet_row,
        "screening_reviewer": p.screening_reviewer,
        "screening_decision": p.screening_decision,
        "screening_remarks": p.screening_remarks,
        "screening_decided_by": p.screening_decided_by,
        "screening_decided_at": p.screening_decided_at.isoformat() if p.screening_decided_at else None,
        "screening_email_sent": p.screening_email_sent,
        "screening_email_message": p.screening_email_message,
        "interview_reviewer": p.interview_reviewer,
        "interview_decision": p.interview_decision,
        "interview_questions": p.interview_questions,
        "interview_total_marks": p.interview_total_marks,
        "interview_remarks": p.interview_remarks,
        "interview_scored_by": p.interview_scored_by,
        "interview_scored_at": p.interview_scored_at.isoformat() if p.interview_scored_at else None,
        "final_selected": p.final_selected,
        "final_mail_sent": p.final_mail_sent,
        "final_mail_sent_at": p.final_mail_sent_at.isoformat() if p.final_mail_sent_at else None,
        "stage": p.stage,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
    }


async def _send_mail(recipient_email: str, recipient_name: str, subject: str, body: str) -> tuple[bool, str]:
    settings = get_settings()
    return await send_email(
        host=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_username,
        password=settings.smtp_password,
        sender=settings.smtp_from or settings.smtp_username,
        recipient=recipient_email,
        subject=subject,
        text_body=body,
        html_body=body.replace("\n", "<br/>"),
        use_tls=settings.smtp_use_tls,
    )


async def get_interview_questions() -> list[str]:
    doc = await GlobalSettings.find_one(GlobalSettings.key == "interview_questions")
    if doc and isinstance(doc.value, list):
        return doc.value
    return DEFAULT_QUESTIONS


def _normalize_header(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (text or "").strip().lower())


def _find_column(row: dict[str, str], candidates: list[str]) -> str:
    normalized_row = {_normalize_header(k): v for k, v in row.items()}
    for candidate in candidates:
        ckey = _normalize_header(candidate)
        value = normalized_row.get(ckey, "")
        if value:
            return str(value).strip()

    for key, value in normalized_row.items():
        if not value:
            continue
        for candidate in candidates:
            ckey = _normalize_header(candidate)
            if ckey in key or key in ckey:
                return str(value).strip()
    return ""


def _find_column_prefix(row: dict[str, str], candidates: list[str]) -> str:
    normalized_row = {_normalize_header(k): v for k, v in row.items()}
    for key, value in normalized_row.items():
        if not value:
            continue
        for candidate in candidates:
            ckey = _normalize_header(candidate)
            if key == ckey or key.startswith(ckey):
                return str(value).strip()
    return ""


def _find_drive_links(row: dict[str, str]) -> list[str]:
    links: list[str] = []
    for value in row.values():
        text = str(value or "").strip()
        if not text:
            continue
        if "drive.google.com" in text or text.startswith("http"):
            if text not in links:
                links.append(text)
    return links


def _get_cell_by_index(row: dict[str, str], fieldnames: list[str], index: int) -> str:
    if index < 0 or index >= len(fieldnames):
        return ""
    key = fieldnames[index]
    return str(row.get(key, "") or "").strip()


def _google_sheet_csv_url(url: str) -> str:
    cleaned = (url or "").strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Google Sheet link is required")
    if cleaned.lower().endswith(".csv"):
        return cleaned
    if "docs.google.com/spreadsheets" not in cleaned:
        raise HTTPException(status_code=400, detail="Please provide a valid Google Sheets link")

    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", cleaned)
    if not match:
        raise HTTPException(status_code=400, detail="Could not parse Google Sheet ID from link")

    sheet_id = match.group(1)
    gid_match = re.search(r"[?&]gid=(\d+)", cleaned)
    gid = gid_match.group(1) if gid_match else "0"
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"


def _google_sheet_csv_fallback_url(url: str) -> str | None:
    cleaned = (url or "").strip()
    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", cleaned)
    if not match:
        return None

    sheet_id = match.group(1)
    gid_match = re.search(r"[?&]gid=(\d+)", cleaned)
    gid = gid_match.group(1) if gid_match else "0"
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&gid={gid}"


def _guess_gender_from_name(name: str) -> str:
    first_name = (name or "").strip().split()[0].lower() if name else ""
    if not first_name:
        return ""

    female_names = {
        "aanya", "aanshi", "aashi", "adarshika", "adhira", "aishwarya", "akshita",
        "ananya", "anisha", "annanya", "anya", "ashi", "bhavya", "diya", "dhruvee",
        "isha", "jahnvi", "kalyani", "khushi", "mansi", "megha", "mitali", "naina",
        "nidhi", "pallavi", "riya", "sanskriti", "shreya", "sneha", "tanvi",
        "tanya", "urvi", "vanshika", "vedika",
    }
    male_names = {
        "aaryan", "ameresh", "aman", "aniket", "bhavesh", "dhruv", "fenil", "harsh",
        "jay", "jaydip", "krish", "kunal", "madhav", "mihir", "naman", "pranav",
        "rahul", "rishabh", "rushal", "shashvat", "shivam", "utkarsh", "vinchy",
    }

    if first_name in female_names:
        return "Female"
    if first_name in male_names:
        return "Male"
    if first_name.endswith(("a", "i", "y")):
        return "Female"
    return "Male"


# ── Question settings ─────────────────────────────────────────────────────────

@router.get("/questions")
async def get_questions(_: User = Depends(get_current_user)):
    return {"questions": await get_interview_questions()}


@router.put("/questions")
async def update_questions(body: QuestionsUpdate, current_user: User = Depends(get_current_user)):
    doc = await GlobalSettings.find_one(GlobalSettings.key == "interview_questions")
    if doc:
        doc.value = body.questions
        doc.updated_at = datetime.now(timezone.utc)
        await doc.save()
    else:
        await GlobalSettings(key="interview_questions", value=body.questions).insert()
    await log_activity(actor=current_user, action="questions_updated",
                       entity_type="settings", message="Interview questions updated",
                       metadata={"questions": body.questions})
    return {"questions": body.questions}


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("")
async def list_participants(
    stage: Optional[str] = None,
    reviewer: Optional[str] = None,
    selected: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    all_p = await ParticipantApplication.find_all().sort("+created_at").to_list()
    if stage:
        all_p = [p for p in all_p if p.stage == stage or p.screening_decision == stage or p.interview_decision == stage]
    if reviewer:
        all_p = [p for p in all_p if reviewer in {p.screening_reviewer, p.interview_reviewer}]
    if selected is not None:
        all_p = [p for p in all_p if p.final_selected is selected]
    if search:
        t = search.lower().strip()
        all_p = [p for p in all_p if t in p.name.lower() or t in p.email.lower() or t in p.program.lower() or t in p.geography.lower()]
    return [p2d(p) for p in all_p]


@router.post("", status_code=201)
async def create_participant(body: ParticipantCreate, current_user: User = Depends(get_current_user)):
    existing = await ParticipantApplication.find_one(ParticipantApplication.email == body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Participant already exists")
    count = await ParticipantApplication.find_all().count()
    p = ParticipantApplication(**body.model_dump())
    await p.insert()
    await log_activity(actor=current_user, action="participant_created",
                       entity_type="participant", entity_id=str(p.id),
                       message=f"Created profile for {p.name}",
                       metadata={"email": p.email})
    return p2d(p)


@router.post("/bulk", status_code=201)
async def bulk_create(body: ParticipantBulkCreate, current_user: User = Depends(get_current_user)):
    created = []
    for entry in body.participants:
        if await ParticipantApplication.find_one(ParticipantApplication.email == entry.email):
            continue
        p = ParticipantApplication(**entry.model_dump())
        await p.insert()
        created.append(p2d(p))
    await log_activity(actor=current_user, action="participant_bulk_created",
                       entity_type="participant",
                       message=f"Imported {len(created)} participants",
                       metadata={"count": len(created)})
    return {"created": created, "count": len(created)}


@router.post("/import-from-sheet", status_code=201)
async def import_from_sheet(body: ImportFromSheetRequest, current_user: User = Depends(get_current_user)):
    csv_url = _google_sheet_csv_url(body.url)
    fallback_csv_url = _google_sheet_csv_fallback_url(body.url)

    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            response = await client.get(csv_url, headers={**SHEET_FETCH_HEADERS, "Referer": body.url})
            if response.status_code >= 400 and fallback_csv_url and fallback_csv_url != csv_url:
                response = await client.get(fallback_csv_url, headers={**SHEET_FETCH_HEADERS, "Referer": body.url})
    except Exception:
        raise HTTPException(status_code=400, detail="Could not fetch the Google Sheet")

    if response.status_code >= 400:
        snippet = (response.text or "").strip().replace("\n", " ")[:200]
        raise HTTPException(
            status_code=400,
            detail=(
                "Could not download sheet CSV from an anonymous server request. "
                "Make sure the sheet is shared as 'Anyone with the link' or published to the web, "
                f"then paste the sheet URL again. Google returned HTTP {response.status_code}."
                + (f" Response: {snippet}" if snippet else "")
            ),
        )

    text = response.text or ""
    if text.lstrip().lower().startswith("<!doctype html") or "<html" in text[:300].lower():
        raise HTTPException(
            status_code=400,
            detail=(
                "Sheet is not publicly readable as CSV to the backend server. "
                "Use 'Anyone with the link' or publish the sheet to the web."
            ),
        )

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="No header row found in sheet")

    fieldnames = list(reader.fieldnames)

    created = []
    skipped = 0
    updated = 0

    for idx, row in enumerate(reader, start=2):
        name = _find_column(row, ["name", "full name", "student name"])
        email = _find_column(row, ["email", "email address", "mail id", "ahduni email"])
        if not name or not email:
            skipped += 1
            continue

        email = email.strip().lower()
        link_1 = _get_cell_by_index(row, fieldnames, 16)
        link_2 = _get_cell_by_index(row, fieldnames, 17)
        payload = {
            "name": name,
            "email": email,
            "enrollment": _find_column(row, ["enrolment number", "enrollment number", "enrollment", "enrolment", "roll number"]),
            "year": _find_column(row, ["year", "current year", "year of study"]),
            "program": _find_column(row, ["program", "programme", "course", "degree"]),
            "cgpa": _find_column(row, ["cgpa", "gpa"]),
            "geography": _find_column(row, ["geography", "city", "which city are you from", "location", "hometown"]),
            "gender": _find_column(row, ["gender", "sex"]),
            "three_words": _find_column(row, ["three words", "3 words", "describe yourself in 3 words"]),
            "submission_link_care": link_1,
            "submission_link_change": link_2,
            "leadership_position": _find_column(row, ["leadership", "leadership position", "position"]),
            "source_sheet_row": idx,
        }

        drive_links = _find_drive_links(row)
        if not payload["submission_link_care"] and drive_links:
            payload["submission_link_care"] = drive_links[0]
        if not payload["submission_link_change"] and len(drive_links) > 1:
            payload["submission_link_change"] = drive_links[1]

        if not str(payload.get("gender", "")).strip():
            inferred_gender = _guess_gender_from_name(name)
            if inferred_gender:
                payload["gender"] = inferred_gender

        clubs_raw = _find_column(row, ["clubs", "club", "societies", "student clubs"])
        if clubs_raw:
            payload["clubs"] = [c.strip() for c in clubs_raw.split(",") if c.strip()]

        existing = await ParticipantApplication.find_one(ParticipantApplication.email == email)
        if existing:
            changed = False
            for field_name in [
                "name",
                "enrollment",
                "year",
                "program",
                "cgpa",
                "geography",
                "gender",
                "three_words",
                "submission_link_care",
                "submission_link_change",
                "leadership_position",
            ]:
                incoming = str(payload.get(field_name, "")).strip()
                current = str(getattr(existing, field_name, "") or "").strip()
                if not incoming:
                    continue
                if field_name in {"submission_link_care", "submission_link_change", "gender"}:
                    setattr(existing, field_name, incoming)
                    changed = True
                elif not current:
                    setattr(existing, field_name, incoming)
                    changed = True

            if payload.get("clubs") and not existing.clubs:
                existing.clubs = payload["clubs"]
                changed = True

            if changed:
                existing.updated_at = datetime.now(timezone.utc)
                await existing.save()
                updated += 1
            else:
                skipped += 1
            continue

        participant = ParticipantApplication(**payload)
        await participant.insert()
        created.append(p2d(participant))

    await log_activity(
        actor=current_user,
        action="participant_sheet_import",
        entity_type="participant",
        message=f"Imported {len(created)} participants from sheet",
        metadata={"source": body.url, "imported": len(created), "updated": updated, "skipped": skipped},
    )
    return {"count": len(created), "updated": updated, "skipped": skipped, "created": created}


@router.delete("/reset-all")
async def reset_all_participants(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can reset participants")

    participants_result = await ParticipantApplication.get_motor_collection().delete_many({})
    logs_result = await ActivityLog.get_motor_collection().delete_many({})
    sheet_result = await ApplicationLink.get_motor_collection().delete_many({
        "key": "applications_sheet",
    })

    return {
        "participants_deleted": participants_result.deleted_count,
        "logs_deleted": logs_result.deleted_count,
        "sheet_links_deleted": sheet_result.deleted_count,
        "message": "Application data cleared",
    }


# ── Auto-assign with custom quotas ────────────────────────────────────────────

@router.post("/auto-assign")
async def auto_assign(body: AutoAssignRequest, current_user: User = Depends(get_current_user)):
    candidates = [
        p for p in await ParticipantApplication.find_all().sort("+created_at").to_list()
        if not p.screening_reviewer and not p.screening_decision
    ]

    # Build assignment slots from quotas
    slots: list[str] = []
    for ev, quota in body.quotas.items():
        if ev in EVALUATORS:
            slots.extend([ev] * max(0, quota))

    assigned_count = 0
    for i, p in enumerate(candidates):
        if i >= len(slots):
            break
        p.screening_reviewer = slots[i]
        p.updated_at = datetime.now(timezone.utc)
        await p.save()
        assigned_count += 1

    await log_activity(actor=current_user, action="auto_assign",
                       entity_type="participant",
                       message=f"Auto-assigned {assigned_count} participants",
                       metadata={"quotas": body.quotas})
    return {"assigned": assigned_count}


# ── Screening decision ────────────────────────────────────────────────────────

@router.patch("/{pid}/screening")
async def update_screening(pid: str, body: ScreeningUpdate, current_user: User = Depends(get_current_user)):
    p = await ParticipantApplication.get(pid)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")

    p.screening_reviewer = body.reviewer
    p.screening_decision = body.decision
    p.screening_remarks = body.remarks
    p.screening_decided_by = current_user.name
    p.screening_decided_at = datetime.now(timezone.utc)
    p.updated_at = p.screening_decided_at
    p.screening_email_sent = False
    p.screening_email_message = "Automatic screening mail is disabled"

    if body.decision == "yes":
        p.stage = "interview_invited"
        p.final_selected = False
    elif body.decision == "no":
        p.stage = "rejected"
        p.final_selected = False
    else:
        p.stage = "maybe"
        p.final_selected = False

    await p.save()
    await log_activity(actor=current_user, action="screening_decision",
                       entity_type="participant", entity_id=pid,
                       message=f"Screening → {body.decision} for {p.name}",
                       metadata={"decision": body.decision, "email_sent": p.screening_email_sent})
    return p2d(p)


# ── Interview scoring ─────────────────────────────────────────────────────────

@router.patch("/{pid}/interview")
async def update_interview(pid: str, body: InterviewUpdate, current_user: User = Depends(get_current_user)):
    p = await ParticipantApplication.get(pid)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")

    total = sum(max(0, min(5, q.marks)) for q in body.questions)
    p.interview_reviewer = body.reviewer
    p.interview_decision = body.decision
    p.interview_questions = [q.model_dump() for q in body.questions]
    p.interview_total_marks = min(25, total)
    p.interview_remarks = body.remarks
    p.interview_scored_by = current_user.name
    p.interview_scored_at = datetime.now(timezone.utc)
    p.updated_at = p.interview_scored_at
    p.final_selected = body.decision == "yes"
    p.stage = "selected" if body.decision == "yes" else ("rejected" if body.decision == "no" else "maybe")

    await p.save()
    await log_activity(actor=current_user, action="interview_scored",
                       entity_type="participant", entity_id=pid,
                       message=f"Interview scored {p.interview_total_marks}/25 for {p.name}",
                       metadata={"decision": body.decision, "marks": p.interview_total_marks})
    return p2d(p)


# ── Final selection toggle ────────────────────────────────────────────────────

@router.patch("/{pid}/selection")
async def update_selection(pid: str, body: FinalSelectionUpdate, current_user: User = Depends(get_current_user)):
    p = await ParticipantApplication.get(pid)
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    p.final_selected = body.selected
    if body.selected:
        p.stage = "selected"
    p.updated_at = datetime.now(timezone.utc)
    await p.save()
    return p2d(p)


# ── Final mail blast ──────────────────────────────────────────────────────────

@router.post("/final-mail")
async def send_final_mail(body: FinalMailRequest, current_user: User = Depends(get_current_user)):
    if body.ids:
        from beanie import PydanticObjectId
        participants = await ParticipantApplication.find(
            {"_id": {"$in": [PydanticObjectId(i) for i in body.ids]}}
        ).to_list()
    else:
        participants = await ParticipantApplication.find(
            ParticipantApplication.final_selected == True  # noqa: E712
        ).to_list()

    sent, failed = [], []
    for p in participants:
        if not p.final_selected:
            continue
        default_body = (
            f"Dear {p.name},\n\n"
            "Congratulations! You have been selected for the Mitr — Circle of Care programme.\n\n"
            "We look forward to welcoming you. Please reply to confirm your acceptance.\n\n"
            "Warm regards,\nThe Mitr Selection Committee"
        )
        ok, msg = await _send_mail(str(p.email), p.name, body.subject, body.body or default_body)
        p.final_mail_sent = ok
        if ok:
            p.final_mail_sent_at = datetime.now(timezone.utc)
        p.updated_at = datetime.now(timezone.utc)
        await p.save()
        (sent if ok else failed).append({"id": str(p.id), "name": p.name, "error": msg if not ok else None})

    await log_activity(actor=current_user, action="final_mail_sent",
                       entity_type="participant",
                       message=f"Final mail sent to {len(sent)} participants",
                       metadata={"sent": len(sent), "failed": len(failed)})
    return {"sent": sent, "failed": failed, "count": len(sent)}

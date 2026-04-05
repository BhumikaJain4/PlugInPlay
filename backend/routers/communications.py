from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone
import smtplib
import httpx
from models.communication import Communication
from models.user import User
from core.security import get_current_user
from core.audit import log_activity
from core.config import get_settings
from core.mailer import send_email

router = APIRouter(prefix="/api/communications", tags=["communications"])
VALID_STATUSES = {"draft", "approved", "sent"}


class CommCreate(BaseModel):
    title: str
    assigned_to: str
    recipient_email: EmailStr | str = ""
    status: str = "draft"
    doc_link: str = ""


class CommUpdate(BaseModel):
    title: Optional[str] = None
    assigned_to: Optional[str] = None
    recipient_email: Optional[EmailStr | str] = None
    status: Optional[str] = None
    doc_link: Optional[str] = None


class TestSendRequest(BaseModel):
    recipient_email: EmailStr
    subject: str = "Mitr communications test email"
    body: str = "This is a test email from the Mitr communications dashboard."


class SmtpCheckResponse(BaseModel):
    configured: bool
    provider: str = "smtp"
    host: str = ""
    port: int = 587
    username_set: bool = False
    from_set: bool = False
    tls: bool = True
    login_ok: bool = False
    message: str = ""


def comm_to_dict(c: Communication) -> dict:
    return {
        "id": str(c.id),
        "title": c.title,
        "assigned_to": c.assigned_to,
        "recipient_email": c.recipient_email,
        "status": c.status,
        "doc_link": c.doc_link,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat(),
    }


async def _send_comm_email(comm: Communication) -> tuple[bool, str]:
    settings = get_settings()
    recipient = str(comm.recipient_email or "").strip()
    if not recipient:
        return False, "Recipient email is required"

    subject = comm.title
    body = (
        f"Hello,\n\n"
        f"This is a communication draft for: {comm.title}\n"
        f"Assigned to: {comm.assigned_to}\n"
    )
    if comm.doc_link:
        body += f"Doc link: {comm.doc_link}\n"
    body += "\nSent from the Mitr communications dashboard."

    return await send_email(
        host=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_username,
        password=settings.smtp_password,
        sender=settings.smtp_from or settings.smtp_username,
        recipient=recipient,
        subject=subject,
        text_body=body,
        html_body=body.replace("\n", "<br/>") if body else None,
        use_tls=settings.smtp_use_tls,
        provider=settings.mail_provider,
        sendgrid_api_key=settings.sendgrid_api_key,
        sendgrid_from=settings.sendgrid_from,
    )


@router.get("")
async def get_comms(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    if status:
        comms = await Communication.find(Communication.status == status).to_list()
    else:
        comms = await Communication.find_all().sort("+created_at").to_list()
    return [comm_to_dict(c) for c in comms]


@router.post("", status_code=201)
async def create_comm(body: CommCreate, current_user: User = Depends(get_current_user)):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    if body.status in {"approved", "sent"} and current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Only admins can approve or send drafts")

    comm = Communication(**body.model_dump())
    await comm.insert()
    await log_activity(
        actor=current_user,
        action="communication_created",
        entity_type="communication",
        entity_id=str(comm.id),
        message=f"Created communication draft '{comm.title}'",
        metadata={"status": comm.status, "assigned_to": comm.assigned_to},
    )
    return comm_to_dict(comm)


@router.patch("/{comm_id}")
async def update_comm(
    comm_id: str,
    body: CommUpdate,
    current_user: User = Depends(get_current_user),
):
    comm = await Communication.get(comm_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Communication not found")
    update_data = body.model_dump(exclude_none=True)
    new_status = update_data.get("status")
    if new_status is not None:
        if new_status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid status")
        if new_status in {"approved", "sent"} and current_user.role != "admin":
            raise HTTPException(
                status_code=403, detail="Only admins can approve or send drafts")

    previous_status = comm.status
    update_data["updated_at"] = datetime.now(timezone.utc)
    for key, value in update_data.items():
        setattr(comm, key, value)
    await comm.save()

    if new_status is not None and previous_status != new_status:
        await log_activity(
            actor=current_user,
            action="communication_status_changed",
            entity_type="communication",
            entity_id=str(comm.id),
            message=(
                f"Changed communication '{comm.title}' status "
                f"from {previous_status} to {new_status}"
            ),
            metadata={"from": previous_status, "to": new_status},
        )
    else:
        await log_activity(
            actor=current_user,
            action="communication_updated",
            entity_type="communication",
            entity_id=str(comm.id),
            message=f"Updated communication '{comm.title}'",
            metadata={"fields": list(update_data.keys())},
        )

    return comm_to_dict(comm)


@router.post("/{comm_id}/send")
async def send_comm(comm_id: str, current_user: User = Depends(get_current_user)):
    comm = await Communication.get(comm_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Communication not found")

    ok, message = await _send_comm_email(comm)
    if not ok:
        raise HTTPException(status_code=400, detail=message)

    comm.status = "sent"
    comm.updated_at = datetime.now(timezone.utc)
    await comm.save()

    await log_activity(
        actor=current_user,
        action="communication_sent",
        entity_type="communication",
        entity_id=str(comm.id),
        message=f"Sent communication '{comm.title}' to {comm.recipient_email}",
        metadata={"recipient_email": str(comm.recipient_email)},
    )
    return {"ok": True, "message": message, **comm_to_dict(comm)}


@router.post("/test-send")
async def test_send(body: TestSendRequest, current_user: User = Depends(get_current_user)):
    settings = get_settings()
    ok, message = await send_email(
        host=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_username,
        password=settings.smtp_password,
        sender=settings.smtp_from or settings.smtp_username,
        recipient=body.recipient_email,
        subject=body.subject,
        text_body=body.body,
        html_body=body.body.replace("\n", "<br/>") if body.body else None,
        use_tls=settings.smtp_use_tls,
        provider=settings.mail_provider,
        sendgrid_api_key=settings.sendgrid_api_key,
        sendgrid_from=settings.sendgrid_from,
    )
    if not ok:
        raise HTTPException(status_code=400, detail=message)

    await log_activity(
        actor=current_user,
        action="communication_test_sent",
        entity_type="communication",
        message=f"Sent test email to {body.recipient_email}",
        metadata={"recipient_email": str(body.recipient_email), "subject": body.subject},
    )
    return {"ok": True, "message": message, "recipient_email": str(body.recipient_email)}


@router.get("/smtp-check", response_model=SmtpCheckResponse)
async def smtp_check(current_user: User = Depends(get_current_user)):
    settings = get_settings()
    selected_provider = (settings.mail_provider or "smtp").strip().lower()
    sendgrid_configured = bool(settings.sendgrid_api_key and settings.sendgrid_from)
    smtp_configured = bool(settings.smtp_host and settings.smtp_from and settings.smtp_username and settings.smtp_password)
    configured = sendgrid_configured or smtp_configured
    response = SmtpCheckResponse(
        configured=configured,
        provider=selected_provider,
        host=settings.smtp_host if selected_provider != "sendgrid" else "sendgrid",
        port=settings.smtp_port if smtp_configured else 443,
        username_set=bool(settings.smtp_username) if selected_provider != "sendgrid" else bool(settings.sendgrid_api_key),
        from_set=bool(settings.smtp_from) if selected_provider != "sendgrid" else bool(settings.sendgrid_from),
        tls=settings.smtp_use_tls if selected_provider != "sendgrid" else True,
        message="SendGrid settings loaded" if sendgrid_configured and selected_provider == "sendgrid" else ("SMTP settings loaded" if smtp_configured and selected_provider != "sendgrid" else "Mail settings are incomplete"),
    )

    if selected_provider == "sendgrid":
        if not sendgrid_configured:
            response.login_ok = False
            response.message = "Mail provider is set to SendGrid, but SENDGRID_API_KEY or SENDGRID_FROM is missing"
            return response

        try:
            headers = {"Authorization": f"Bearer {settings.sendgrid_api_key}"}
            async with httpx.AsyncClient(timeout=30.0) as client:
                result = await client.get("https://api.sendgrid.com/v3/user/account", headers=headers)
            if result.status_code >= 400:
                raise RuntimeError(result.text or f"SendGrid error {result.status_code}")
            response.login_ok = True
            response.message = "SendGrid API key validated"
        except Exception as exc:
            response.login_ok = False
            response.message = str(exc)
        return response

    if not smtp_configured:
        response.message = "SMTP is selected, but SMTP settings are incomplete"
        return response

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
            if settings.smtp_use_tls:
                server.starttls()
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
        response.login_ok = True
        response.message = "SMTP connection and login succeeded"
    except Exception as exc:
        response.login_ok = False
        response.message = str(exc)

    return response


@router.delete("/{comm_id}", status_code=204)
async def delete_comm(comm_id: str, current_user: User = Depends(get_current_user)):
    comm = await Communication.get(comm_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Communication not found")
    title = comm.title
    await comm.delete()
    await log_activity(
        actor=current_user,
        action="communication_deleted",
        entity_type="communication",
        entity_id=comm_id,
        message=f"Deleted communication '{title}'",
    )

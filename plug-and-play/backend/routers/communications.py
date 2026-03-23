from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from models.communication import Communication
from models.user import User
from core.security import get_current_user
from core.audit import log_activity

router = APIRouter(prefix="/api/communications", tags=["communications"])
VALID_STATUSES = {"draft", "approved", "sent"}


class CommCreate(BaseModel):
    title: str
    assigned_to: str
    status: str = "draft"
    doc_link: str = ""


class CommUpdate(BaseModel):
    title: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[str] = None
    doc_link: Optional[str] = None


def comm_to_dict(c: Communication) -> dict:
    return {
        "id": str(c.id),
        "title": c.title,
        "assigned_to": c.assigned_to,
        "status": c.status,
        "doc_link": c.doc_link,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat(),
    }


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

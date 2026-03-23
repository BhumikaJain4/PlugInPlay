from fastapi import APIRouter, Depends
from typing import Optional
from datetime import timezone
from models.activity_log import ActivityLog
from models.user import User
from core.security import get_current_user

router = APIRouter(prefix="/api/logs", tags=["logs"])


def log_to_dict(log: ActivityLog) -> dict:
    created_at = log.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    created_at_iso = created_at.astimezone(
        timezone.utc).isoformat().replace("+00:00", "Z")

    return {
        "id": str(log.id),
        "action": log.action,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "message": log.message,
        "performed_by": {
            "id": log.performed_by_id,
            "name": log.performed_by_name,
            "email": log.performed_by_email,
            "role": log.performed_by_role,
        },
        "metadata": log.metadata,
        "created_at": created_at_iso,
    }


@router.get("")
async def get_logs(
    limit: int = 100,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    safe_limit = max(1, min(limit, 500))
    filters = []

    if action:
        filters.append(ActivityLog.action == action)
    if entity_type:
        filters.append(ActivityLog.entity_type == entity_type)

    if filters:
        logs = await ActivityLog.find(*filters).sort("-created_at").limit(safe_limit).to_list()
    else:
        logs = await ActivityLog.find_all().sort("-created_at").limit(safe_limit).to_list()

    return [log_to_dict(l) for l in logs]

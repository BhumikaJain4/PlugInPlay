from typing import Optional, Dict, Any
from models.activity_log import ActivityLog
from models.user import User


async def log_activity(
    *,
    actor: User,
    action: str,
    entity_type: str,
    message: str,
    entity_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> ActivityLog:
    log = ActivityLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        message=message,
        performed_by_id=str(actor.id),
        performed_by_name=actor.name,
        performed_by_email=actor.email,
        performed_by_role=actor.role,
        metadata=metadata or {},
    )
    await log.insert()
    return log

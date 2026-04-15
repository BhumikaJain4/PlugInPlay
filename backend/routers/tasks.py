from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from models.task import Task
from models.user import User
from core.security import get_current_user
from core.audit import log_activity

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class LinkItem(BaseModel):
    title: str
    url: str
    type: str = "doc"


class TaskCreate(BaseModel):
    title: str
    detail: str = ""
    assigned_to: str
    due_date: str
    due_day: int
    due_month: int = 3
    due_year: int = 2026
    module: str = "SM Orientation"
    links: List[LinkItem] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    detail: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    due_day: Optional[int] = None
    due_month: Optional[int] = None
    due_year: Optional[int] = None
    status: Optional[str] = None
    module: Optional[str] = None
    links: Optional[List[LinkItem]] = None


def task_to_dict(task: Task) -> dict:
    return {
        "id": str(task.id),
        "title": task.title,
        "detail": task.detail,
        "assigned_to": task.assigned_to,
        "due_date": task.due_date,
        "due_day": task.due_day,
        "due_month": task.due_month,
        "due_year": task.due_year,
        "status": task.status,
        "module": task.module,
        "links": task.links,
        "created_by": task.created_by,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("")
async def get_tasks(
    status: Optional[str] = None,
    module: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    filters = []
    if status:
        filters.append(Task.status == status)
    if module:
        filters.append(Task.module == module)

    if filters:
        tasks = await Task.find(*filters).to_list()
    else:
        tasks = await Task.find_all().to_list()

    tasks = sorted(
        tasks,
        key=lambda t: (t.due_year, t.due_month, t.due_day, t.created_at),
    )

    return [task_to_dict(t) for t in tasks]


@router.post("", status_code=201)
async def create_task(
    body: TaskCreate,
    current_user: User = Depends(get_current_user),
):
    task = Task(
        title=body.title,
        detail=body.detail,
        assigned_to=body.assigned_to,
        due_date=body.due_date,
        due_day=body.due_day,
        due_month=body.due_month,
        due_year=body.due_year,
        module=body.module,
        links=[lnk.model_dump() for lnk in body.links],
        created_by=str(current_user.id),
    )
    await task.insert()
    await log_activity(
        actor=current_user,
        action="task_created",
        entity_type="task",
        entity_id=str(task.id),
        message=f"Created task '{task.title}'",
        metadata={"status": task.status, "assigned_to": task.assigned_to},
    )
    return task_to_dict(task)


@router.get("/{task_id}")
async def get_task(task_id: str, current_user: User = Depends(get_current_user)):
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_to_dict(task)


@router.patch("/{task_id}")
async def update_task(
    task_id: str,
    body: TaskUpdate,
    current_user: User = Depends(get_current_user),
):
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = body.model_dump(exclude_none=True)
    if "links" in update_data:
        update_data["links"] = [lnk if isinstance(lnk, dict) else lnk.model_dump()
                                for lnk in update_data["links"]]

    previous_status = task.status
    update_data["updated_at"] = datetime.now(timezone.utc)

    for key, value in update_data.items():
        setattr(task, key, value)

    await task.save()

    new_status = update_data.get("status")
    if new_status is not None and new_status != previous_status:
        await log_activity(
            actor=current_user,
            action="task_status_changed",
            entity_type="task",
            entity_id=str(task.id),
            message=f"Changed task '{task.title}' status from {previous_status} to {new_status}",
            metadata={"from": previous_status, "to": new_status},
        )
    else:
        await log_activity(
            actor=current_user,
            action="task_updated",
            entity_type="task",
            entity_id=str(task.id),
            message=f"Updated task '{task.title}'",
            metadata={"fields": list(update_data.keys())},
        )

    return task_to_dict(task)


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str, current_user: User = Depends(get_current_user)):
    task = await Task.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    title = task.title
    await task.delete()
    await log_activity(
        actor=current_user,
        action="task_deleted",
        entity_type="task",
        entity_id=task_id,
        message=f"Deleted task '{title}'",
    )


@router.delete("/reset-all", status_code=200)
async def reset_all_tasks(current_user: User = Depends(get_current_user)):
    """Delete all tasks except April 5-6"""
    # Delete tasks NOT on April 5 or 6
    result = await Task.get_motor_collection().delete_many({
        "$or": [
            {"due_day": {"$nin": [5, 6]}, "due_month": 4, "due_year": 2026},
            {"due_month": {"$ne": 4}},
            {"due_year": {"$ne": 2026}},
        ]
    })
    await log_activity(
        actor=current_user,
        action="tasks_deleted",
        entity_type="task",
        entity_id="all",
        message=f"Deleted most tasks, kept April 5-6 ({result.deleted_count} deleted)",
        metadata={"count": result.deleted_count},
    )
    return {"deleted_count": result.deleted_count, "message": "Tasks deleted (kept April 5-6)"}

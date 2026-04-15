from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Literal
from models.user import User
from core.security import require_admin
from core.audit import log_activity

router = APIRouter(prefix="/api/users", tags=["users"])


class UserRoleUpdate(BaseModel):
    role: Literal["admin", "member"]


def user_to_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar_color": user.avatar_color,
        "created_at": user.created_at.isoformat(),
        "is_active": user.is_active,
    }


@router.get("")
async def list_users(current_user: User = Depends(require_admin)):
    users = await User.find_all().sort("+created_at").to_list()
    return [user_to_dict(user) for user in users]


@router.patch("/{user_id}/role")
async def update_user_role(
    user_id: str,
    body: UserRoleUpdate,
    current_user: User = Depends(require_admin),
):
    target = await User.get(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if str(target.id) == str(current_user.id) and body.role != "admin":
        raise HTTPException(
            status_code=400, detail="You cannot remove your own admin access")

    previous_role = target.role
    target.role = body.role
    await target.save()
    if previous_role != body.role:
        await log_activity(
            actor=current_user,
            action="user_role_updated",
            entity_type="user",
            entity_id=str(target.id),
            message=f"Changed role for {target.email} from {previous_role} to {body.role}",
            metadata={"from": previous_role, "to": body.role},
        )

    return user_to_dict(target)


@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(require_admin)):
    target = await User.get(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if str(target.id) == str(current_user.id):
        raise HTTPException(
            status_code=400, detail="You cannot delete your own account")

    if target.role == "admin":
        remaining_admins = await User.find(User.role == "admin", User.id != target.id).count()
        if remaining_admins == 0:
            raise HTTPException(
                status_code=400, detail="At least one admin account must remain")

    target_email = target.email
    target_name = target.name
    target_role = target.role
    await target.delete()

    await log_activity(
        actor=current_user,
        action="user_deleted",
        entity_type="user",
        entity_id=user_id,
        message=f"Deleted user {target_email}",
        metadata={"name": target_name, "role": target_role},
    )

    return {"ok": True}

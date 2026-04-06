from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from models.team import TeamMember
from models.task import Task
from models.user import User
from core.security import get_current_user

router = APIRouter(prefix="/api/team", tags=["team"])


class MemberCreate(BaseModel):
    name: str
    dept: str = "—"
    role: str = "—"
    email: str = ""
    avatar_color: str = "maroon"


class MemberUpdate(BaseModel):
    name: Optional[str] = None
    dept: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    avatar_color: Optional[str] = None


def member_to_dict(m: TeamMember) -> dict:
    return {
        "id": str(m.id),
        "name": m.name,
        "dept": m.dept,
        "role": m.role,
        "email": m.email,
        "avatar_color": m.avatar_color,
        "created_at": m.created_at.isoformat(),
    }


@router.get("")
async def get_members(current_user: User = Depends(get_current_user)):
    members = await TeamMember.find_all().sort("+created_at").to_list()
    return [member_to_dict(m) for m in members]


@router.post("", status_code=201)
async def create_member(body: MemberCreate, current_user: User = Depends(get_current_user)):
    member = TeamMember(**body.model_dump())
    await member.insert()
    return member_to_dict(member)


@router.patch("/{member_id}")
async def update_member(
    member_id: str,
    body: MemberUpdate,
    current_user: User = Depends(get_current_user),
):
    member = await TeamMember.get(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    for key, value in body.model_dump(exclude_none=True).items():
        setattr(member, key, value)
    await member.save()
    return member_to_dict(member)


@router.delete("/{member_id}", status_code=200)
async def delete_member(member_id: str, current_user: User = Depends(get_current_user)):
    member = await TeamMember.get(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    member_name = member.name
    
    # Unassign all tasks assigned to this member
    await Task.find(Task.assigned_to == member_name).update({"$set": {"assigned_to": ""}})
    
    await member.delete()
    return {"message": f"Member '{member_name}' deleted. Tasks reassigned."}

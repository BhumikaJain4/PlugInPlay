from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from models.infrastructure import InfraItem
from models.user import User
from core.security import get_current_user

router = APIRouter(prefix="/api/infrastructure", tags=["infrastructure"])


class InfraCreate(BaseModel):
    name: str
    category: str = "venue"
    owner: str = ""
    notes: str = ""


class InfraUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    owner: Optional[str] = None
    notes: Optional[str] = None
    done: Optional[bool] = None


def infra_to_dict(i: InfraItem) -> dict:
    return {
        "id": str(i.id),
        "name": i.name,
        "category": i.category,
        "owner": i.owner,
        "notes": i.notes,
        "done": i.done,
        "created_at": i.created_at.isoformat(),
    }


@router.get("")
async def get_infra(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    if category:
        items = await InfraItem.find(InfraItem.category == category).to_list()
    else:
        items = await InfraItem.find_all().sort("+created_at").to_list()
    return [infra_to_dict(i) for i in items]


@router.post("", status_code=201)
async def create_infra(body: InfraCreate, current_user: User = Depends(get_current_user)):
    item = InfraItem(**body.model_dump())
    await item.insert()
    return infra_to_dict(item)


@router.patch("/{item_id}")
async def update_infra(
    item_id: str,
    body: InfraUpdate,
    current_user: User = Depends(get_current_user),
):
    item = await InfraItem.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in body.model_dump(exclude_none=True).items():
        setattr(item, key, value)
    await item.save()
    return infra_to_dict(item)


@router.delete("/{item_id}", status_code=204)
async def delete_infra(item_id: str, current_user: User = Depends(get_current_user)):
    item = await InfraItem.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await item.delete()

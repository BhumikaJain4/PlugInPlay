from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.security import get_current_user
from models.application_link import ApplicationLink
from models.user import User

router = APIRouter(prefix="/api/applications", tags=["applications"])
SHEET_KEY = "applications_sheet"


class SaveSheetRequest(BaseModel):
    url: str


def validate_google_sheet_url(url: str) -> str:
    cleaned = url.strip()
    if not cleaned:
        raise HTTPException(
            status_code=400, detail="Google Sheet link is required")
    if not (cleaned.startswith("http://") or cleaned.startswith("https://")):
        raise HTTPException(
            status_code=400, detail="Link must start with http:// or https://")
    if "docs.google.com/spreadsheets" not in cleaned:
        raise HTTPException(
            status_code=400, detail="Please provide a valid Google Sheets link")
    return cleaned


@router.get("")
async def get_sheet_link(current_user: User = Depends(get_current_user)):
    entry = await ApplicationLink.find_one(ApplicationLink.key == SHEET_KEY)
    if not entry:
        return {"url": ""}
    return {"url": entry.url}


@router.put("")
async def save_sheet_link(body: SaveSheetRequest, current_user: User = Depends(get_current_user)):
    sheet_url = validate_google_sheet_url(body.url)
    entry = await ApplicationLink.find_one(ApplicationLink.key == SHEET_KEY)

    if not entry:
        entry = ApplicationLink(key=SHEET_KEY, url=sheet_url)
        await entry.insert()
    else:
        entry.url = sheet_url
        entry.updated_at = datetime.now(timezone.utc)
        await entry.save()

    return {"url": entry.url}

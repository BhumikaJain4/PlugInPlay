"""
Restore MongoDB data from a backup snapshot directory.

Usage:
    python seed.py
    python seed.py 2026-04-15_18-31-30

Requires MONGODB_URL to be available in the environment or backend/.env.
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Default snapshot folder requested by the user.
DEFAULT_BACKUP_DIR = "2026-04-15_18-31-30"

# Backup filename -> Mongo collection name
COLLECTION_FILE_MAP: dict[str, str] = {
    "users.json": "users",
    "tasks.json": "tasks",
    "team_members.json": "team_members",
    "communications.json": "communications",
    "infrastructure_items.json": "infrastructure_items",
    "activity_logs.json": "activity_logs",
    "application_links.json": "application_links",
    "participant_applications.json": "participant_applications",
}


load_dotenv(Path(__file__).resolve().parent / ".env")
MONGODB_URL = os.getenv("MONGODB_URL")


def parse_datetime(value: str) -> Any:
    """Parse known backup datetime formats; return original value when not a datetime."""
    for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return value


def normalize_document(value: Any) -> Any:
    """Recursively convert backup values into Mongo-friendly Python types."""
    if isinstance(value, dict):
        normalized: dict[str, Any] = {}
        for key, item in value.items():
            if key == "id":
                # Backup exports store ObjectId in "id"; Mongo expects "_id".
                if isinstance(item, str) and ObjectId.is_valid(item):
                    normalized["_id"] = ObjectId(item)
                else:
                    normalized["_id"] = item
                continue
            normalized[key] = normalize_document(item)
        return normalized

    if isinstance(value, list):
        return [normalize_document(item) for item in value]

    if isinstance(value, str):
        return parse_datetime(value)

    return value


async def restore_from_backup(backup_dir_name: str = DEFAULT_BACKUP_DIR) -> None:
    backup_dir = Path(__file__).resolve().parent / backup_dir_name
    if not backup_dir.exists() or not backup_dir.is_dir():
        raise FileNotFoundError(f"Backup directory not found: {backup_dir}")

    if not MONGODB_URL:
        raise RuntimeError(
            "MONGODB_URL is not set. Create backend/.env or set the environment variable before running seed.py."
        )

    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.plugandplay

    try:
        print(f"Starting restore from: {backup_dir}")
        for file_name, collection_name in COLLECTION_FILE_MAP.items():
            file_path = backup_dir / file_name
            if not file_path.exists():
                print(f"Skipped {collection_name}: missing file {file_name}")
                continue

            with file_path.open("r", encoding="utf-8") as f:
                raw_items = json.load(f)

            if not isinstance(raw_items, list):
                print(f"Skipped {collection_name}: expected JSON array in {file_name}")
                continue

            docs = [normalize_document(item) for item in raw_items]
            collection = db[collection_name]

            await collection.delete_many({})
            if docs:
                await collection.insert_many(docs, ordered=False)

            print(f"Restored {collection_name}: {len(docs)} documents")

        print("Restore complete.")
    finally:
        client.close()


if __name__ == "__main__":
    target_backup = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_BACKUP_DIR
    asyncio.run(restore_from_backup(target_backup))

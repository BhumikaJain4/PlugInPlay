"""
Run once to seed the database:
    python seed.py

Requires .env to be configured with MONGODB_URL.
"""
import asyncio
from datetime import date, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from core.config import get_settings
from models import User, Task, TeamMember, Communication, InfraItem
from core.security import hash_password

settings = get_settings()
SHIFT_TASKS_BY_DAYS = 4
MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def shifted_task_dates(task: dict, days: int = SHIFT_TASKS_BY_DAYS) -> dict:
    original = date(task.get("due_year", 2026),
                    task.get("due_month", 3), task["due_day"])
    shifted = original + timedelta(days=days)
    updated = dict(task)
    updated["due_day"] = shifted.day
    updated["due_month"] = shifted.month
    updated["due_year"] = shifted.year
    updated["due_date"] = f"{shifted.day} {MONTH_NAMES[shifted.month - 1]}"
    return updated


TASKS = [
    # Keep only April 5-6 tasks. All others removed.
]

TEAM = [
    {"name": "Jahnvi Nagdev", "dept": "ME Department",
        "role": "Design Lead", "avatar_color": "maroon"},
    {"name": "Sanskriti Patidar", "dept": "Coordinator",
        "role": "Coordinator", "avatar_color": "pink"},
    {"name": "Rushal Panchal", "dept": "SEDC",
        "role": "Communications", "avatar_color": "gold"},
    {"name": "Annanya Deshmukh", "dept": "SEDC",
        "role": "Content", "avatar_color": "green"},
    {"name": "Vinchy Makwana", "dept": "Team Member",
        "role": "Support", "avatar_color": "blue"},
    {"name": "Fenil Shah", "dept": "Team Member",
        "role": "Support", "avatar_color": "purple"},
]

COMMS = [
    {"title": "Call for Interview Email", "assigned_to": "Rushal Panchal", "status": "draft",
        "doc_link": "https://docs.google.com/document/d/1WtTdOorPfLiNOa6cThiPerDRKkVW3s_t3Oa6NUnv6gQ/edit?usp=sharing"},
    {"title": "Mitr Selection Email", "assigned_to": "Rushal Panchal", "status": "draft",
        "doc_link": "https://docs.google.com/document/d/1WtTdOorPfLiNOa6cThiPerDRKkVW3s_t3Oa6NUnv6gQ/edit?usp=sharing"},
    {"title": "SM Orientation Email", "assigned_to": "Rushal Panchal", "status": "draft",
        "doc_link": "https://www.canva.com/design/DAGjBdeLeaA/oq6GNKb1lbr3KHKe1bATwQ/edit"},
    {"title": "SM Application Email", "assigned_to": "Rushal Panchal",
        "status": "draft", "doc_link": ""},
    {"title": "Information Session Invite",
        "assigned_to": "Rushal Panchal", "status": "draft", "doc_link": ""},
]

INFRA = [
    {"name": "MPH Booking (April 1)", "category": "venue",
     "owner": "Sanskriti Patidar", "notes": "Contact admin office"},
    {"name": "Projector & Screen Setup", "category": "venue",
        "owner": "Sanskriti Patidar", "notes": ""},
    {"name": "Chairs & Tables arranged", "category": "venue",
        "owner": "Vinchy Makwana", "notes": ""},
    {"name": "Orientation PPT finalised", "category": "materials",
        "owner": "Jahnvi Nagdev", "notes": ""},
    {"name": "Printed Handouts / Flyers", "category": "materials",
        "owner": "Fenil Shah", "notes": ""},
    {"name": "SM Application Form (live)", "category": "digital",
     "owner": "Sanskriti Patidar", "notes": "Google Forms link live"},
    {"name": "EOI Form (live)", "category": "digital",
     "owner": "Sanskriti Patidar", "notes": ""},
    {"name": "Drive folder access shared", "category": "digital",
        "owner": "Rushal Panchal", "notes": ""},
    {"name": "Transport / Directions shared", "category": "logistics",
        "owner": "Annanya Deshmukh", "notes": ""},
    {"name": "Refreshments arranged", "category": "logistics",
        "owner": "Vinchy Makwana", "notes": ""},
]

SHIFTED_TASKS = [shifted_task_dates(task) for task in TASKS]


async def seed():
    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=client.plugandplay,
        document_models=[User, Task, TeamMember, Communication, InfraItem],
    )

    # Admin user
    existing_admin = await User.find_one(User.email == "bhumika@plugandplay.com")
    if not existing_admin:
        admin = User(
            name="Bhumika Jain",
            email="bhumika@plugandplay.com",
            hashed_password=hash_password("admin123"),
            role="admin",
            avatar_color="gold",
        )
        await admin.insert()
        print("✅ Admin user created: bhumika@plugandplay.com / admin123")
    else:
        if existing_admin.role != "admin" or existing_admin.name != "Bhumika Jain" or existing_admin.avatar_color != "gold":
            existing_admin.name = "Bhumika Jain"
            existing_admin.role = "admin"
            existing_admin.avatar_color = "gold"
        existing_admin.hashed_password = hash_password("admin123")
        await existing_admin.save()
        print("✅ Admin user repaired: bhumika@plugandplay.com / admin123")

    # Evaluator users (profile login)
    evaluator_users = [
        {
            "name": "Kalyani B",
            "email": "kalyani@mitr.app",
            "password": "mitr1234",
            "role": "admin",
            "avatar_color": "maroon",
        },
        {
            "name": "Ameresh K",
            "email": "ameresh@mitr.app",
            "password": "mitr1234",
            "role": "admin",
            "avatar_color": "blue",
        },
        {
            "name": "KM",
            "email": "km@mitr.app",
            "password": "mitr1234",
            "role": "member",
            "avatar_color": "green",
        },
    ]

    for evaluator in evaluator_users:
        existing = await User.find_one(User.email == evaluator["email"])
        if not existing:
            user = User(
                name=evaluator["name"],
                email=evaluator["email"],
                hashed_password=hash_password(evaluator["password"]),
                role=evaluator["role"],
                avatar_color=evaluator["avatar_color"],
            )
            await user.insert()
            print(f"✅ Evaluator created: {evaluator['email']} / {evaluator['password']} ({evaluator['role']})")
        else:
            existing.name = evaluator["name"]
            existing.role = evaluator["role"]
            existing.avatar_color = evaluator["avatar_color"]
            existing.hashed_password = hash_password(evaluator["password"])
            await existing.save()
            print(f"✅ Evaluator repaired: {evaluator['email']} / {evaluator['password']} ({evaluator['role']})")

    # Tasks - Delete all non-April 5-6 tasks first
    await Task.get_motor_collection().delete_many({
        "$or": [
            {"due_day": {"$nin": [5, 6]}, "due_month": 4, "due_year": 2026},
            {"due_month": {"$ne": 4}},
            {"due_year": {"$ne": 2026}},
        ]
    })
    
    inserted_tasks = 0
    updated_tasks = 0
    for t in SHIFTED_TASKS:
        existing_task = await Task.find_one(Task.title == t["title"])
        if existing_task:
            existing_task.due_date = t["due_date"]
            existing_task.due_day = t["due_day"]
            existing_task.due_month = t["due_month"]
            existing_task.due_year = t["due_year"]
            await existing_task.save()
            updated_tasks += 1
        else:
            task = Task(**t)
            await task.insert()
            inserted_tasks += 1
    print(
        f"✅ Tasks synced: {len(SHIFTED_TASKS)} total "
        f"({inserted_tasks} inserted, {updated_tasks} shifted +{SHIFT_TASKS_BY_DAYS} days) - ALL OTHER TASKS DELETED"
    )

    # Team
    team_count = await TeamMember.count()
    if team_count == 0:
        for m in TEAM:
            member = TeamMember(**m)
            await member.insert()
        print(f"✅ Seeded {len(TEAM)} team members")
    else:
        print(f"⏭  Team already seeded ({team_count} found)")

    # Communications
    comm_count = await Communication.count()
    if comm_count == 0:
        for c in COMMS:
            comm = Communication(**c)
            await comm.insert()
        print(f"✅ Seeded {len(COMMS)} communications")
    else:
        print(f"⏭  Communications already seeded")

    # Infrastructure
    infra_count = await InfraItem.count()
    if infra_count == 0:
        for i in INFRA:
            item = InfraItem(**i)
            await item.insert()
        print(f"✅ Seeded {len(INFRA)} infra items")
    else:
        print(f"⏭  Infrastructure already seeded")

    print("\n🎉 Seed complete!")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())

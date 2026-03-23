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
    {"title": "Review Instagram Post for SM Information Session", "detail": "<ul><li>Go through Instagram post designed for SM orientation 2025</li><li>Suggest necessary changes and discuss with KB</li><li>Finalise the Instagram Post for Orientation 2026</li></ul>",
        "assigned_to": "Jahnvi Nagdev", "due_date": "19 March", "due_day": 19, "module": "SM Orientation", "links": [{"title": "Canva Post 2025", "url": "https://www.canva.com/design/DAGi_QwZ6cQ/Dpsa59KZ5GZMN7mWz_4mnQ/edit", "type": "canva"}]},
    {"title": "Review Instagram Post for SM Application", "detail": "<ul><li>Go through Instagram post designed for SM Application 2025</li><li>Suggest necessary changes and discuss with KB</li><li>Finalise the Instagram Post for Application 2026</li></ul>",
        "assigned_to": "Jahnvi Nagdev", "due_date": "19 March", "due_day": 19, "module": "SM Orientation", "links": [{"title": "Canva Post 2025", "url": "https://www.canva.com/design/DAGkVMqmTbA/21lmjWzaNpQpC6YwYlFO3w/edit", "type": "canva"}]},
    {"title": "Send Instagram Post to Comm for Approval", "detail": "<ul><li>Prepare final Instagram posts for review</li><li>Send to Communications team for approval</li><li>Address any feedback received</li></ul>",
        "assigned_to": "Jahnvi Nagdev", "due_date": "19 March", "due_day": 19, "module": "SM Orientation", "links": []},
    {"title": "MPH Booking", "detail": "<ul><li>Book MPH (Multi-Purpose Hall) for April 1 Information Session</li><li>Ensure availability for entire duration</li><li>Confirm booking and save confirmation</li></ul>",
     "assigned_to": "Sanskriti Patidar", "due_date": "19 March", "due_day": 19, "module": "Infrastructure", "links": []},
    {"title": "SM Application Form Review", "detail": "<ul><li>Review last year's Mitr application Google Form with KB</li><li>Identify necessary changes for 2026</li><li>Update form fields and questions</li></ul>", "assigned_to": "Sanskriti Patidar",
        "due_date": "19 March", "due_day": 19, "module": "SM Orientation", "links": [{"title": "Application Form 2025", "url": "https://docs.google.com/forms/d/e/1FAIpQLSfn0ccucd1O07qbHLvQVEvLuO6KqpLF0mnEMMsbLEUv71QzCQ/viewform?usp=sharing", "type": "form"}]},
    {"title": "Review PPT for SM Information Session", "detail": "<ul><li>Go through SM Orientation 2025 PPT</li><li>Identify changes and modifications required</li><li>Discuss with KB and make changes</li><li>Finalise PPT for Orientation 2026</li></ul>",
        "assigned_to": "Annanya Deshmukh (SEDC), Jahnvi Nagdev", "due_date": "20 March", "due_day": 20, "module": "SM Orientation", "links": [{"title": "Orientation PPT 2025", "url": "https://www.canva.com/design/DAGjk--VR0o/H8WuXeVfTAAQ71iU49hXWA/edit", "type": "ppt"}]},
    {"title": "SM Information Session EOI Form Review", "detail": "<ul><li>Review Orientation EOI form with KB</li><li>Make any changes required for 2026</li><li>Test form functionality</li></ul>",
        "assigned_to": "Sanskriti Patidar", "due_date": "20 March", "due_day": 20, "module": "SM Orientation", "links": [{"title": "EOI Form 2025", "url": "https://forms.gle/dH3521KmBBddhXpf7", "type": "form"}]},
    {"title": "Draft Mail — Call for Interview", "detail": "<ul><li>Draft email for applicants selected for the interview round</li><li>Get approval from KB</li><li>Paste final draft in Communication 2026 Doc</li></ul>", "assigned_to": "Rushal Panchal (SEDC)", "due_date": "20 March", "due_day": 20, "module": "Communications", "links": [
        {"title": "Reference Doc 2025", "url": "https://docs.google.com/document/d/1kD0Gqfu9x5v4tCkeXn20tPyAfqy5WcH4pTgC17aRcL0/edit", "type": "doc"}, {"title": "Communication Doc 2026", "url": "https://docs.google.com/document/d/1WtTdOorPfLiNOa6cThiPerDRKkVW3s_t3Oa6NUnv6gQ/edit?usp=sharing", "type": "doc"}]},
    {"title": "Draft Mail — Mitr Selection", "detail": "<ul><li>Draft email for applicants selected as Student Mitrs for 2026-27</li><li>Get approval from KB</li><li>Paste final draft in Communication 2026 Doc</li></ul>", "assigned_to": "Rushal Panchal (SEDC)", "due_date": "20 March", "due_day": 20, "module": "Communications", "links": [
        {"title": "Reference Doc 2025", "url": "https://docs.google.com/document/d/1kD0Gqfu9x5v4tCkeXn20tPyAfqy5WcH4pTgC17aRcL0/edit", "type": "doc"}, {"title": "Communication Doc 2026", "url": "https://docs.google.com/document/d/1WtTdOorPfLiNOa6cThiPerDRKkVW3s_t3Oa6NUnv6gQ/edit?usp=sharing", "type": "doc"}]},
    {"title": "Review Email for SM Orientation", "detail": "<ul><li>Read through the email sent for SM Orientation 2025</li><li>Identify required changes, discuss with KB</li><li>Make the necessary changes</li><li>Paste final draft in Communication 2026 Doc</li></ul>",
        "assigned_to": "Rushal Panchal (SEDC)", "due_date": "20 March", "due_day": 20, "module": "Communications", "links": [{"title": "Newsletter 2025", "url": "https://www.canva.com/design/DAGjBdeLeaA/oq6GNKb1lbr3KHKe1bATwQ/edit", "type": "email"}, {"title": "Communication Doc 2026", "url": "https://docs.google.com/document/d/1WtTdOorPfLiNOa6cThiPerDRKkVW3s_t3Oa6NUnv6gQ/edit?usp=sharing", "type": "doc"}]},
    {"title": "Send Information Session Invite", "detail": "<ul><li>Share the final Orientation Invitation email to AK</li><li>Send before 12pm deadline</li><li>Confirm receipt</li></ul>",
        "assigned_to": "Rushal Panchal (SEDC)", "due_date": "21 March", "due_day": 21, "module": "Communications", "links": []},
    {"title": "Review Email for SM Application", "detail": "<ul><li>Read through the email sent for SM Application 2025</li><li>Identify required changes, discuss with KB</li><li>Paste final draft in Communication 2026 Doc</li></ul>", "assigned_to": "Rushal Panchal (SEDC)", "due_date": "23 March", "due_day": 23, "module": "Communications", "links": [
        {"title": "Email Reference 2025", "url": "https://docs.google.com/document/d/1kD0Gqfu9x5v4tCkeXn20tPyAfqy5WcH4pTgC17aRcL0/edit", "type": "doc"}, {"title": "Communication Doc 2026", "url": "https://docs.google.com/document/d/1WtTdOorPfLiNOa6cThiPerDRKkVW3s_t3Oa6NUnv6gQ/edit?usp=sharing", "type": "doc"}]},
    {"title": "Create Assessment Infrastructure", "detail": "<ul><li>Review the existing five-dimension Competency Rubric with KB</li><li>Finalise the Assessment Rubric for SM Induction 2026</li><li>Document scoring criteria</li></ul>", "assigned_to": "Sanskriti Patidar",
        "due_date": "23 March", "due_day": 23, "module": "Infrastructure", "links": [{"title": "Rubric / Reference 2025", "url": "https://docs.google.com/document/d/1kD0Gqfu9x5v4tCkeXn20tPyAfqy5WcH4pTgC17aRcL0/edit?usp=sharing", "type": "doc"}]},
    {"title": "Post Information Session Invite Post", "detail": "<ul><li>Post invitation on official social media channels</li><li>Schedule posts for optimal engagement</li><li>Monitor responses</li></ul>",
        "assigned_to": "Jahnvi Nagdev", "due_date": "23 March", "due_day": 23, "module": "SM Orientation", "links": []},
    {"title": "SM Information Session Planning Meeting", "detail": "<ul><li>Go through the Orientation 2025 flow</li><li>Discuss and design the plan for Orientation 2026</li><li>Add the final plan under the tab SM Orientation Plan 2026</li></ul>",
        "assigned_to": "Sanskriti Patidar, Rushal Panchal (SEDC)", "due_date": "25 March", "due_day": 25, "module": "SM Orientation", "links": [{"title": "Orientation Plan Doc", "url": "https://docs.google.com/document/d/1e6731tY01Ey6lAh6wNdcPQXO8fC0QAiRIUdajruH1JE/edit?usp=sharing", "type": "doc"}]},
    {"title": "Information Session Readiness Meeting", "detail": "<ul><li>Go through the final orientation plan with KB</li><li>Prepare anything remaining before April 1 session</li></ul>",
        "assigned_to": "Sanskriti, Annanya Deshmukh, Jahnvi Nagdev, Rushal Panchal, Vinchy Makwana, Fenil Shah", "due_date": "31 March", "due_day": 31, "module": "SM Orientation", "links": []},
    {"title": "Student Mitr Information Session", "detail": "<ul><li>Conduct the Student Mitr Information Session</li><li>Follow finalised orientation plan</li></ul>",
        "assigned_to": "Full Team", "due_date": "1 April", "due_day": 1, "due_month": 4, "module": "SM Orientation", "links": []},
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
        print("⏭  Admin user already exists")

    # Tasks
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
        f"({inserted_tasks} inserted, {updated_tasks} shifted +{SHIFT_TASKS_BY_DAYS} days)"
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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from contextlib import asynccontextmanager

from core.config import get_settings
from models import User, Task, TeamMember, Communication, InfraItem, ActivityLog, ApplicationLink
from models.participant import ParticipantApplication
from models.settings import GlobalSettings
from routers import auth, tasks, team, communications, infrastructure, logs, users, applications
from routers.participants import router as participants_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=client.plugandplay,
        document_models=[
            User, Task, TeamMember, Communication, InfraItem,
            ActivityLog, ApplicationLink, ParticipantApplication, GlobalSettings,
        ],
    )
    app.state.mongo_client = client
    print("✅ Connected to MongoDB")
    yield
    client.close()
    print("🔌 MongoDB connection closed")


app = FastAPI(title="Plug in Play API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(team.router)
app.include_router(communications.router)
app.include_router(infrastructure.router)
app.include_router(logs.router)
app.include_router(users.router)
app.include_router(applications.router)
app.include_router(participants_router)


@app.get("/")
async def root():
    return {"status": "ok", "message": "Plug in Play API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

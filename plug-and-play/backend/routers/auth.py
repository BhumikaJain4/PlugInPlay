from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from models.user import User
from core.security import hash_password, verify_password, create_access_token, get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    avatar_color: str = "maroon"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar_color: str


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest):
    existing = await User.find_one(User.email == body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        avatar_color=body.avatar_color,
    )
    await user.insert()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user={"id": str(user.id), "name": user.name, "email": user.email,
              "role": user.role, "avatar_color": user.avatar_color},
    )


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    user = await User.find_one(User.email == form.username)
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user={"id": str(user.id), "name": user.name, "email": user.email,
              "role": user.role, "avatar_color": user.avatar_color},
    )


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "avatar_color": current_user.avatar_color,
    }


@router.patch("/me")
async def update_me(body: dict, current_user: User = Depends(get_current_user)):
    allowed = {"name", "avatar_color"}
    for key, value in body.items():
        if key in allowed:
            setattr(current_user, key, value)
    await current_user.save()
    return {"id": str(current_user.id), "name": current_user.name,
            "email": current_user.email, "role": current_user.role,
            "avatar_color": current_user.avatar_color}

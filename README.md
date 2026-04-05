# Plug in Play — ODS Task Management System

Full-stack task management system for Student Mitr Orientation 2026.

**Stack:** FastAPI · MongoDB Atlas · React · Vite · Tailwind CSS · React Query · JWT Auth

---

## Project Structure

```
plug-and-play/
├── backend/                  # FastAPI + Beanie + MongoDB
│   ├── main.py               # App entry + Beanie init + CORS
│   ├── seed.py               # Seed DB with tasks, team, comms, infra
│   ├── requirements.txt
│   ├── .env.example
│   ├── core/
│   │   ├── config.py         # Pydantic settings
│   │   └── security.py       # JWT + password hashing
│   ├── models/               # Beanie ODM documents
│   │   ├── user.py
│   │   ├── task.py
│   │   ├── team.py
│   │   ├── communication.py
│   │   └── infrastructure.py
│   └── routers/              # FastAPI routers (one per resource)
│       ├── auth.py           # register / login / me
│       ├── tasks.py
│       ├── team.py
│       ├── communications.py
│       └── infrastructure.py
│
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── main.jsx          # Entry: providers, QueryClient, Router
│   │   ├── App.jsx           # Routes (public + protected)
│   │   ├── api/
│   │   │   ├── client.js     # Axios instance + JWT interceptor
│   │   │   └── services.js   # All API calls
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useApi.js     # React Query hooks for all resources
│   │   ├── utils/
│   │   │   └── helpers.js    # Colors, icons, formatters
│   │   ├── components/
│   │   │   ├── ui/index.jsx  # Button, Modal, Input, StatBox, etc.
│   │   │   ├── layout/       # Sidebar, AppLayout
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskModal.jsx
│   │   │   └── CalendarWidget.jsx
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── Dashboard.jsx
│   │       ├── TasksPage.jsx
│   │       ├── CalendarPage.jsx
│   │       ├── TeamPage.jsx
│   │       ├── OrientationPage.jsx
│   │       ├── CommsPage.jsx
│   │       └── InfraPage.jsx
│   ├── tailwind.config.js    # Brand colors: maroon, gold, cream
│   └── vercel.json
│
└── render.yaml               # One-click Render deployment
```

---

## Local Setup

### 1. MongoDB Atlas (free)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → create free cluster
2. Create a database user with read/write access
3. Whitelist IP `0.0.0.0/0` (allow all) under Network Access
4. Copy your connection string — it looks like:
   `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — fill in MONGODB_URL and SECRET_KEY

# Seed the database (run once)
python seed.py

# Start the API server
uvicorn main:app --reload --port 8000
```

API runs at: `http://localhost:8000`
Swagger docs: `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install

# Configure environment (for local dev, no changes needed)
cp .env.example .env

# Start dev server
npm run dev
```

App runs at: `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint                   | Description                                                      |
| ------ | -------------------------- | ---------------------------------------------------------------- |
| POST   | `/api/auth/register`       | Register new user                                                |
| POST   | `/api/auth/login`          | Login (returns JWT)                                              |
| GET    | `/api/auth/me`             | Current user profile                                             |
| GET    | `/api/tasks`               | List all tasks (filter: `?status=pending&module=SM+Orientation`) |
| POST   | `/api/tasks`               | Create task                                                      |
| PATCH  | `/api/tasks/{id}`          | Update task (incl. `status: completed`)                          |
| DELETE | `/api/tasks/{id}`          | Delete task                                                      |
| GET    | `/api/team`                | List team members                                                |
| POST   | `/api/team`                | Add member                                                       |
| PATCH  | `/api/team/{id}`           | Update member                                                    |
| DELETE | `/api/team/{id}`           | Remove member                                                    |
| GET    | `/api/communications`      | List email drafts                                                |
| POST   | `/api/communications`      | Add draft                                                        |
| PATCH  | `/api/communications/{id}` | Update status/details                                            |
| DELETE | `/api/communications/{id}` | Delete                                                           |
| GET    | `/api/infrastructure`      | List infra items                                                 |
| POST   | `/api/infrastructure`      | Add item                                                         |
| PATCH  | `/api/infrastructure/{id}` | Toggle done / update                                             |
| DELETE | `/api/infrastructure/{id}` | Delete                                                           |

All endpoints except `/api/auth/register` and `/api/auth/login` require `Authorization: Bearer <token>` header.

---

## Deployment (Free Tier)

### Backend → Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo, set **Root Directory** to `backend`
4. Render auto-detects `render.yaml` — set env vars:
   - `MONGODB_URL` — your Atlas connection string
   - `SECRET_KEY` — any random 32+ char string
   - `CORS_ORIGINS` — `https://your-app.vercel.app`
5. Deploy → note your Render URL (e.g. `https://plug-and-play-api.onrender.com`)

**Run seed on Render:** In Render dashboard → Shell → `python seed.py`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import your repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `VITE_API_URL` = `https://plug-and-play-api.onrender.com/api`
4. Deploy → your app is live!

---

## Features

- **JWT Authentication** — register, login, protected routes
- **Dashboard** — live stats, task timeline with filter tabs, March 2026 calendar with task counts, quick resources, team list
- **All Tasks** — search, filter by status & module, full CRUD
- **Calendar** — click any day to see its tasks in a side panel
- **Team Management** — cards view + workload bar chart, add/edit/remove members
- **SM Orientation** — module-filtered task view
- **Communications** — email draft tracker with Draft → Approved → Sent workflow
- **Infrastructure** — checklist by category (Venue, Materials, Digital, Logistics) with click-to-tick
- **External links** — Applications & Interview Scoring open Google Sheets in a new tab
- **All data persisted** in MongoDB Atlas — survives page refreshes and works across devices

---

## Environment Variables Reference

### Backend `.env`

```
MONGODB_URL=mongodb+srv://...
SECRET_KEY=your-random-32-char-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```

### Frontend `.env` (production only)

```
VITE_API_URL=https://plug-and-play-api.onrender.com/api
```

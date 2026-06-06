<div align="center">

  <img src="./frontend/public/globe.svg" alt="DevLens AI Logo" width="120" />

  # 🔍 DevLens AI

  ### **An AI-Powered GitHub Contributor Intelligence & Analytics Platform**

  [![Next.js](https://img.shields.io/badge/Next.js-16.2.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.2.7-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.136.3-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Gemini](https://img.shields.io/badge/Google_Gemini-Flash-blue?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
  [![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)

  *DevLens AI transforms raw GitHub data into high-fidelity visual analytics, contributor intelligence reports, and professional developer role matches using advanced semantic models and Google Gemini AI.*

</div>

---

## ✨ Features

- 🧠 **Gemini-Powered Developer Intelligence**: Auto-generates detailed contributor summaries, identifies technical strengths, and profiles work histories.
- 🎯 **Role Prediction & Skill Radars**: Predicts specialized roles (e.g. Full-Stack, Backend, Devops, Machine Learning) and renders overlapping skill radar charts using Recharts.
- ⚔️ **Side-by-Side Developer Compare**: Evaluates two developers side-by-side with animated progress scores, comparative language breakdowns, overlapping radar skill graphs, and dual-timeline commit activity.
- 🏅 **Repository Quality Scorer**: Deep-inspects and scores repositories on a 100-point scale checking for `README.md` quality, CI/CD presence, testing coverage, documentation/contributing guides, and licensing.
- 💼 **GitHub Resume & Projects Matchmaker**:
  - Generates polished, resume-ready bullet points detailing impact from raw commit histories.
  - Matches contributor skills directly to active open issues across GitHub to recommend open-source project opportunities.
  - Generates personalized career roadmap plans to help transition to target engineering roles.
- ⚡ **High Performance Caching**: Heavily optimized FastAPI backend utilizing Redis and Hiredis to cache responses, minimize API latency, and stay safely within GitHub API rate limits.
- 🛡️ **Fail-safe Design**: Gracefully degrades to dynamic templates if the Gemini API key is missing or bypasses caching if Redis goes offline.

---

## 🏗️ Repository Architecture

The project is structured into three main areas:

```
devlens-ai/
├── ai_engine/          # Core Python module for AI matching & roadmap logic
│   ├── career.py       # Personalized career roadmap transitions & target roles
│   ├── matchmaker.py   # Issue parser matching developer skills to GitHub issues
│   └── github_issues.py# Open-source issue fetching and extraction
├── backend/            # FastAPI standard python backend application
│   ├── app/
│   │   ├── core/       # Configurations (Pydantic-Settings)
│   │   ├── routers/    # API endpoints (users, repos, explore, compare, ai)
│   │   └── services/   # AI services (Gemini), GitHub API wrappers, rate limiters, cache
│   └── tests/          # Python pytest suite (75 passing tests)
├── frontend/           # Next.js 16 + React 19 application
│   ├── src/
│   │   ├── app/        # Page Router (Dashboard, Compare, Explore, Settings, Profiles)
│   │   ├── components/ # Custom components (AI Insight Panel, Language Bar, Stat Card)
│   │   └── lib/        # API integrations, hooks, utility helpers
│   └── public/         # Vector illustrations and assets
└── docker/             # Docker compose configs & deployment infrastructure
```

---

## 🛠️ Modern Tech Stack

### Frontend
- **Framework**: [Next.js 16.2.7](https://nextjs.org/) (App Router, Turbopack enabled)
- **Runtime**: [React 19.2.7](https://react.dev/)
- **State Management**: [Zustand 5.0.14](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack React Query v5.101.0](https://tanstack.com/query/latest)
- **Animations**: [Framer Motion 12.40.0](https://www.framer.com/motion/)
- **Charts**: [Recharts 3.8.1](https://recharts.org/)
- **Styles**: [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI 4.10.0](https://ui.shadcn.com/)
- **Testing**: [Vitest 4.1.8](https://vitest.dev/) with jsdom

### Backend
- **Framework**: [FastAPI 0.136.3](https://fastapi.tiangolo.com/) (Standard)
- **Server**: [Uvicorn 0.49.0](https://www.uvicorn.org/) (Standard)
- **AI Integrations**: [Google Generative AI SDK >= 0.8.4](https://github.com/google/generative-ai-python) (Gemini 2.0 Flash / 1.5 Pro)
- **Configuration**: [Pydantic Settings >= 2.3.0](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- **Cache layer**: [Redis Client >= 5.2.0](https://redis-py.readthedocs.io/en/stable/) (Hiredis bindings enabled)
- **Testing**: [Pytest 8.3.4](https://docs.pytest.org/), `pytest-cov 6.0.0`, `pytest-asyncio 0.25.3`

---

## 🚀 Getting Started

Ensure you have the following installed before setting up the application:
- Node.js (v20+)
- Python (v3.11+)
- Redis Server (optional for local, required for production caching)
- PostgreSQL Server (optional, for persistent data extension)

### 1. Clone & Position
```bash
git clone https://github.com/Anik000007/devlens-ai.git
cd devlens-ai
```

### 2. Backend Environment & Setup
Navigate to the `backend` directory, activate a virtual environment, and install package dependencies:

```bash
cd backend
python -m venv venv

# Activate Virtual Environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` directory:
```env
GITHUB_TOKEN=ghp_your_github_personal_token
GEMINI_API_KEY=your_google_gemini_api_key
REDIS_URL=redis://localhost:6379/0
DATABASE_URL=postgresql://devlens:devlens_password@localhost:5432/devlens
LOG_LEVEL=INFO
```
> **Note on Tokens**:
> - Setting a `GITHUB_TOKEN` raises your GitHub rate limit from 60 to 5,000 requests per hour.
> - If `GEMINI_API_KEY` is not provided, the platform will automatically activate dynamic rule-based fallbacks.

Run the API:
```bash
uvicorn app.main:app --reload --port 8000
```
API docs are viewable at: `http://localhost:8000/docs`

### 3. Frontend App Setup
Open another terminal pane, navigate to the `frontend/` directory, install packages, and spin up the hot-reloading dev server:

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🐳 Running with Docker

You can spin up the entire application stack including Nginx and Redis in one command:

```bash
# Set environment variables locally or in a root .env file, then run:
docker compose -f docker/docker-compose.yml up --build
```
This builds and launches:
- **Frontend**: Next.js client on port `3000` (proxied)
- **Backend**: FastAPI app on port `8000`
- **Redis Cache**: High-performance transient key-value caching on port `6379`
- **Nginx**: Front-facing proxy/reverse routing on ports `80` / `443`

For spinning up database backing services only (PostgreSQL + Redis) to support local development:
```bash
docker compose up -d
```

---

## 🧪 Running Tests

Both frontend and backend packages are equipped with active unit-testing profiles:

### Run Backend Tests (pytest)
```bash
cd backend
pytest
# For coverage output:
pytest --cov=app --cov-report=term-missing
```

### Run Frontend Tests (vitest)
```bash
cd frontend
npm run test
```

---

## 🛡️ Architecture & Graceful Fallbacks

- **Zero Redis Caching**: If the Redis server is unreachable, the system auto-switches to live API fetching with zero user-facing errors.
- **AI Degradation**: If Google Gemini returns an API quota/key error or is missing, DevLens AI triggers rule-based matching algorithms and profile summary templates.
- **CORS Setup**: Out of the box, backend endpoints are configured with strict CORS rules permitting connections from local environments and customized production client locations.

---

<div align="center">
  Built with ❤️ by Anik
</div>

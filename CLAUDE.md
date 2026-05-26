# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: frontend is on Next.js 16 / React 19

`frontend/AGENTS.md` warns that this is **not** the Next.js you know from training data — APIs, conventions, and file structure may differ. Before writing or modifying frontend code, consult `frontend/node_modules/next/dist/docs/` and heed deprecation notices. The frontend `CLAUDE.md` is just `@AGENTS.md` — same instruction.

## Commands

### Backend (Python 3.11+, from `backend/`)
- Run dev server: `uvicorn app.main:app --reload --port 8000` (or `python run.py`)
- Run all tests: `pytest -v`
- Run one test file: `pytest tests/test_services.py -v`
- Run one test: `pytest tests/test_services.py::test_name -v`
- Coverage: `pytest --cov=app --cov-report=xml`
- Lint: `ruff check .` (with `--fix` to auto-fix)
- Type check: `mypy app --ignore-missing-imports`

### Frontend (from `frontend/`)
- Dev server: `npm run dev` (http://localhost:3000)
- Build: `npm run build`
- Lint: `npm run lint`
- Tests: `npm run test` (Vitest, jsdom, one-shot) or `npm run test:watch`
- Single test: `npx vitest run src/__tests__/path/to/file.test.tsx`

### Infrastructure
- Postgres + Redis via `docker-compose up` at repo root (Postgres on 5432, Redis on 6379). Postgres is provisioned but the backend does not currently use it — caching layer is Redis-only.

## Architecture

### Two-tier app: Next.js frontend ↔ FastAPI backend ↔ GitHub API

The backend is a **stateless proxy with caching** in front of GitHub's REST + GraphQL APIs, plus Gemini for AI summaries. All cross-service calls are coordinated by `backend/app/main.py`, which wires five routers and two HTTP middleware layers.

### Backend routers (`backend/app/routers/`)
Mounted in `main.py` with these prefixes:
- `users.py` → `/user` — profile, repos, events
- `explore.py` → `/explore` — search-as-you-type developer discovery
- `compare.py` → `/compare` — two-profile side-by-side metrics
- `ai.py` → `/ai` — Gemini-backed summaries and role predictions
- `repos.py` → `/repo` — repository quality scoring

### Backend services (`backend/app/services/`)
Every service is designed to **degrade gracefully**:
- `cache.py` — Redis via `redis.asyncio`, lazy-initialized. Sets `_redis_available = False` on first failure and silently bypasses caching for the rest of the process lifetime. Never raises.
- `rate_limiter.py` — in-memory sliding window per IP (60 req/min default). Applied via the `rate_limit_middleware` in `main.py`. Has `reset_rate_limits()` used by the `autouse` fixture in `tests/conftest.py`.
- `github_service.py` — all GitHub REST/GraphQL calls. Tracks remaining quota from response headers in module-level globals; surfaced via `/health`.
- `ai_service.py` — Gemini calls; falls back to template-based summaries when `GEMINI_API_KEY` is empty.

When adding a new feature that touches an external service, follow this pattern: try the external call, log a warning on failure, return a sentinel (None / empty / template), and never let the user-facing request 500.

### Frontend (`frontend/src/`)
- `app/` — Next.js App Router pages: `explore`, `profile`, `compare`, `repo`, `dashboard`, `settings`, `help`
- `lib/api.ts` — single fetch wrapper (`apiFetch`) used by every component. Reads `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`), 30s timeout, throws typed `ApiError`. All new backend calls should go through this file.
- `lib/query-client.ts` + `lib/hooks.ts` — TanStack Query is the data layer
- State: Zustand (`zustand`), Theme via `next-themes`, UI primitives via Shadcn + `@base-ui/react`

### Config
- `backend/app/core/config.py` — Pydantic `Settings` reads from `backend/.env`. Defaults make every key optional so the app boots without credentials (degraded mode).
- Required-ish envs: `GITHUB_TOKEN` (60→5000 req/hr), `GEMINI_API_KEY` (AI summaries), `REDIS_URL` (caching). All can be empty.

### Tests
- Backend: `tests/conftest.py` patches `httpx.AsyncClient` globally via `mock_httpx_client` fixture with realistic sample payloads (`SAMPLE_USER`, `SAMPLE_REPOS`, etc.). Settings are forced to empty tokens + unreachable Redis at import time so tests run hermetically. **Do not add tests that hit live GitHub.**
- Frontend: Vitest + jsdom + Testing Library. Setup file: `frontend/vitest-setup.ts`. Path alias `@/` → `frontend/src/`.

### CI
`.github/workflows/backend-ci.yml` runs `ruff check backend/` → `mypy backend/app` → `pytest backend/ --cov` → Docker build. Lint and type-check are gating, so run them locally before pushing backend changes.

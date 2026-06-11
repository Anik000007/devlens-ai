# Contributing to DevLens AI

Thanks for taking an interest in DevLens AI. This guide walks you through getting the project running locally, the development workflow, and the standards we hold for merged changes.

---

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| **Node.js** | 20.x or newer | Next.js 16, Vitest |
| **Python** | 3.11 or newer | FastAPI backend |
| **Redis** *(optional)* | 7.x | Caching layer — app works without it |
| **Docker** *(optional)* | 24.x | For `docker-compose up` |
| **Git** | any modern version | obvious |

You also need API credentials:

- A **GitHub Personal Access Token** — Settings → Developer settings → Personal access tokens → Tokens (classic). No scopes required for public read; `public_repo` if you want repo metadata. Without a token the backend falls back to GitHub's 60 req/hour anonymous limit and the app will rate-limit very quickly.
- A **Google Gemini API key** *(optional)* — without one, all `/ai/*` endpoints fall back to template responses. The UI works fine in both modes.

---

## One-shot setup

```bash
./scripts/setup.sh
```

This creates the backend `venv`, installs Python + Node dependencies, and seeds `backend/.env` from `.env.example`. After it finishes:

1. Edit `backend/.env` and fill in `GITHUB_TOKEN` and `GEMINI_API_KEY`.
2. Optionally start Redis: `docker run -p 6379:6379 redis:7-alpine`.
3. Start the backend (terminal 1):
   ```bash
   cd backend
   source venv/Scripts/activate   # macOS/Linux: source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```
4. Start the frontend (terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```
5. Open `http://localhost:3000`.

### Optional: warm the cache for demos

```bash
./scripts/seed-data.sh
```

This pre-fetches trending devs and a few curated profiles so the app feels fast during demos.

### Manual setup (without the script)

```bash
# backend
cd backend
python -m venv venv
source venv/Scripts/activate   # or venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env

# frontend
cd ../frontend
npm ci
```

---

## Running the test suites

### Backend
```bash
cd backend
pytest -v                                # full suite
pytest tests/test_services.py -v         # single file
pytest tests/test_routers.py::TestAIRoutes -v   # single class
pytest --cov=app --cov-report=html       # coverage report
```

All tests are hermetic. `tests/conftest.py` patches `httpx.AsyncClient` so no test ever hits live GitHub. The Redis URL is forced to an unreachable address so the cache silently bypasses.

### Frontend
```bash
cd frontend
npm run test            # one-shot
npm run test:watch      # watch mode
npx vitest run src/__tests__/api.test.ts    # single file
```

Setup file: `frontend/vitest-setup.ts`. Path alias: `@/` → `frontend/src/`. The jsdom env is configured in `vitest.config.ts`.

### Type checking + linting

```bash
# backend
cd backend
ruff check .                        # lint, --fix to auto-correct
mypy app --ignore-missing-imports   # type-check

# frontend
cd frontend
npx tsc --noEmit                    # type-check
npm run lint                        # eslint
```

CI runs all of these on every push/PR via `.github/workflows/`. Run them locally before pushing or expect noisy red checks.

---

## Development workflow

### Branching

- `main` is protected — every change lands via PR.
- Feature branches: `feat/<short-slug>` (e.g. `feat/pipeline-kanban`)
- Bug fixes: `fix/<short-slug>`
- Docs: `docs/<short-slug>`
- Chores / infra: `chore/<short-slug>`

### Commits

Conventional-style prefixes (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`). The body should explain **why** the change is needed — the code already shows *what*.

Example:
```
feat: surface GitHub rate-limit errors as HTTP 429

Previously a 403 from GitHub propagated as a generic 500 and the
frontend displayed "User not found", which masked the real cause.
The new GitHubRateLimitError exception is caught by main.py's
handler and returns 429 with a helpful detail message and Retry-After.
```

### Pre-commit hooks

```bash
pre-commit install
```

`.pre-commit-config.yaml` runs ruff (Python) and eslint (frontend/src/) on staged files. The hooks reject commits containing trailing whitespace, large binaries, or malformed JSON/YAML.

### PR checklist

Before requesting review:

- [ ] Tests pass locally (`pytest` and `npm run test`)
- [ ] `npx tsc --noEmit` is clean
- [ ] `ruff check backend/` and `npm run lint` are clean
- [ ] Updated relevant docs (this file, `docs/API.md`, `README.md`)
- [ ] No secrets / API keys committed (the pre-commit hook catches obvious cases but check anyway)
- [ ] If the change touches the user-facing UI, include before/after screenshots in the PR description

---

## Code style

### Python (backend, `ai_engine/`)

- **Formatter / linter**: `ruff` (config in `pyproject.toml`)
- **Type hints**: required on all public functions; `from typing import Optional, List, Dict, Any` patterns are used throughout — match the existing style.
- **Async I/O**: use `httpx.AsyncClient`, never the sync client. Every fetch function in `app/services/github_service.py` is `async`.
- **Graceful degradation**: external calls (GitHub / Gemini / Redis) must never raise to the caller. Catch the exception, log a warning, return a sentinel (`None`, `[]`, or a template object). The HTTP 429 from GitHub is the one exception — it's intentionally surfaced via `GitHubRateLimitError` → main.py exception handler.
- **Cache keys**: namespace under `gh:` or `ai:` (e.g. `gh:user:{name}`, `ai:summary:{name}`). TTL defaults to `settings.CACHE_TTL` (30 min) but can be overridden per call.

### TypeScript (frontend)

- **Formatter**: Prettier defaults (no config file = use ESLint's rules)
- **Linter**: ESLint with `eslint-config-next` (`npm run lint`)
- **Components**: `"use client"` directive at the top of any file using hooks, browser APIs, or stateful UI.
- **Types**: prefer interfaces over types for object shapes. Always type API response shapes in `frontend/src/lib/api.ts` — never `any`.
- **Styling**: Tailwind 4 with design-system tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`). Avoid raw hex colors except inside chart components. The system supports `dark:` variants via the `.dark` class on `<html>`.
- **State**: TanStack Query for server data, Zustand for client state (with `persist` middleware when it should survive a reload).
- **Imports**: use the `@/` alias for everything under `src/`.

### Next.js 16 / React 19 caveat

The frontend is on Next.js **16** with React **19**. APIs and conventions may differ from older Next docs you find online. Before writing route handlers, server components, or anything Next-specific, check `frontend/node_modules/next/dist/docs/` for the version-correct guidance. The `frontend/AGENTS.md` file flags this.

### File conventions

- New backend service helpers go in `backend/app/services/`.
- New AI logic (Gemini calls + heuristic fallback) goes in `ai_engine/`.
- New API endpoints go in the matching `backend/app/routers/` file.
- New frontend routes go under `frontend/src/app/<route>/page.tsx`.
- Shared frontend components go in `frontend/src/components/`.
- UI primitives (Button, Badge, Card) go in `frontend/src/components/ui/`.

---

## Reporting issues

Open an issue on GitHub with:

1. What you expected to happen
2. What actually happened
3. Steps to reproduce
4. Backend log excerpts (`/health` output is helpful)
5. Browser console output for frontend bugs

---

Thanks for contributing.

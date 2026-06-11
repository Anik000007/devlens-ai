# DevLens AI — Architecture

A high-level overview of how the pieces fit together. Read this before touching cross-service code paths.

---

## System overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              Browser (user)                              │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              Next.js 16 frontend  (React 19 client components)           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │ Landing /  │  │ Pipeline / │  │  Profile   │  │  Other pages       │  │
│  │ Explore    │  │ Career     │  │            │  │  (compare, repo…)  │  │
│  └────────────┘  └────────────┘  └────────────┘  └────────────────────┘  │
│         ▲                ▲              ▲                  ▲             │
│         └────────────────┴──────┬───────┴──────────────────┘             │
│                                 ▼                                        │
│                  frontend/src/lib/api.ts (typed apiFetch)                │
└──────────────────────────────────────────────────────────────────────────┘
                                     │  HTTP (fetch)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   FastAPI backend  (uvicorn, async)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  /user/*     │  │  /explore/*  │  │  /compare    │  │  /repo/*     │  │
│  │  router      │  │  router      │  │  router      │  │  router      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                 │                │          │
│         └──────────────────┼─────────────────┼────────────────┘          │
│                            ▼                 ▼                           │
│            ┌────────────────────┐  ┌────────────────────────┐            │
│            │  /ai/* router      │  │  middleware             │           │
│            │  → ai_service.py   │  │  rate_limiter, logs,    │           │
│            │  → ai_engine/*     │  │  exception handlers     │           │
│            └────────────────────┘  └────────────────────────┘            │
│                            │                                             │
│                            ▼                                             │
│            ┌────────────────────────────────────────┐                    │
│            │  services/github_service.py            │                    │
│            │   (async httpx + rate-limit tracking)  │                    │
│            └────────────────────────────────────────┘                    │
│                            │                                             │
│         ┌──────────────────┼──────────────────┐                          │
│         ▼                  ▼                  ▼                          │
│   ┌─────────────┐   ┌─────────────┐   ┌──────────────┐                   │
│   │ services/   │   │ ai_engine/  │   │ services/    │                   │
│   │ cache.py    │   │ matchmaker  │   │ ai_service   │                   │
│   │ (Redis)     │   │ career      │   │ (Gemini)     │                   │
│   └─────────────┘   └─────────────┘   └──────────────┘                   │
└──────────────────────────────────────────────────────────────────────────┘
        │                       │                   │
        ▼                       ▼                   ▼
  ┌──────────┐         ┌──────────────┐      ┌─────────────────┐
  │  Redis   │         │ GitHub REST  │      │ Google Gemini   │
  │  (cache) │         │ + GraphQL    │      │ API             │
  └──────────┘         └──────────────┘      └─────────────────┘
```

Three external dependencies. **All three are optional** — the app degrades gracefully when any is missing.

---

## Layers, in order

### 1. Browser → Next.js frontend

- **App Router** under `frontend/src/app/`. Each route is a `page.tsx`.
- **Client components** (`"use client"`) everywhere — DevLens is a primarily interactive app with no server-rendered fetches (the backend handles all data).
- **Shared layout** in `app/layout.tsx` wraps every page in `ThemeProvider` (next-themes), `QueryProvider` (TanStack Query), and `KeyboardShortcutsProvider` (global ⌘K + chord shortcuts).
- **Server-only metadata** (SEO, OpenGraph, JSON-LD) is exported from `layout.tsx` at module level.

### 2. Frontend → Backend API client

- Single fetch wrapper in `frontend/src/lib/api.ts`: `apiFetch<T>(path, options)`.
- 30-second `AbortController` timeout. Throws a typed `ApiError` with `status` and `message` (sourced from the backend's `detail` field on non-2xx responses).
- All backend response shapes are declared as TypeScript interfaces in the same file — never `any`.

### 3. Backend HTTP layer

- **FastAPI** mounted under five routers (`users`, `explore`, `compare`, `ai`, `repos`) plus a top-level `/health`.
- Two middlewares: `rate_limit_middleware` (60 req/min per client IP, sliding window) and `log_requests`.
- Three exception handlers:
  - `GitHubRateLimitError` → HTTP **429** with `Retry-After` and a `detail` message that tells the user to set `GITHUB_TOKEN`.
  - `RequestValidationError` → HTTP 422 with field-level error list.
  - Catch-all `Exception` → HTTP 500 with a generic message (full traceback logged server-side).

### 4. Service layer

Four services in `backend/app/services/`:

| Service | Responsibility | Fallback when external system fails |
|---|---|---|
| `github_service.py` | All GitHub REST/GraphQL calls, scoring helpers, commit-history transformation. ~500 LOC. | 404 → `None`; 403 + `X-RateLimit-Remaining=0` → raises `GitHubRateLimitError`; other errors → unhandled (caught by global handler). |
| `cache.py` | Async Redis client, JSON-encoded values, lazy initialization. | First failure sets `_redis_available = False` for the rest of the process lifetime; `cache_get/set/delete` are no-ops afterwards. |
| `rate_limiter.py` | In-memory sliding-window rate-limiter for inbound traffic. | N/A (no external dependency). |
| `ai_service.py` | Gemini calls for summaries, resume bullets, repo reviews, compare narratives. | If `GEMINI_API_KEY` missing or call fails → returns a deterministic template-built response. App stays functional with zero AI dependency. |

### 5. AI engine — `ai_engine/`

A separate package (importable from the backend via the `_PROJECT_ROOT` `sys.path` insertion in `main.py`) that contains the more elaborate Gemini-backed features:

- `career.py` — `TARGET_ROLES` list and `generate_career_path()`. Falls back to rule-based roadmaps in `_ROLE_ROADMAPS` when Gemini is unavailable.
- `matchmaker.py` — `match_developer_to_projects()`. Falls back to a heuristic language-overlap scorer.
- `github_issues.py` — helper for searching open issues with skill-aligned filters.

### 6. Caching strategy

| Cache key prefix | TTL | Notes |
|---|---|---|
| `gh:user:{username}` | 30 min (default) | Profile data |
| `gh:repos:{username}:{per_page}` | 30 min | User repositories |
| `gh:repo:{owner}:{repo}` | 30 min | Single repo detail |
| `gh:search:{q}:{per_page}` | 15 min | Search results |
| `gh:events:{username}` | 10 min | Activity feed (volatile) |
| `gh:commits:{owner}:{repo}` | 60 min | Weekly commit activity |
| `ai:summary:{username}` | 60 min | Gemini developer summary |
| `ai:resume:{username}` | 60 min | Resume bullets |
| `ai:repo:{owner}:{name}` | 60 min | Repo AI review |
| `ai:compare:{user_a}:{user_b}` | 60 min | Compare AI analysis |

**No explicit invalidation.** Caches drift naturally as TTLs expire. For pipeline/career features the frontend bypasses the backend cache (its own debounce on slider input acts as the rate-limiter).

---

## Data flows

### "Analyze this developer" (the profile page load)

1. User navigates to `/profile/torvalds`.
2. `profile/[username]/page.tsx` calls `fetchUserAnalytics("torvalds")` (HTTP `GET /user/torvalds/analytics`).
3. Backend `users.py::get_user_analytics`:
   - `fetch_user("torvalds")` — cache lookup → GitHub REST `/users/torvalds` if miss → cache.
   - `fetch_user_repos("torvalds", per_page=100)` — same pattern.
   - For the top-starred repo, `fetch_commit_activity(owner, repo)` (returns `[]` if GitHub is still computing).
   - Pure functions compute language stats, consistency score, collaboration score, OSS score, monthly commit history.
4. Returns a single `UserAnalytics` blob to the frontend.
5. Profile page then fires `fetchAISummary(...)` → `POST /ai/summary` → Gemini (or template).
6. Page then fires `fetchResumePoints(...)` → `POST /ai/resume-points` → Gemini (or template).
7. UI renders progressively as each promise resolves, with a step-indicator loading state.

### "Pipeline" (client-only persistence)

1. User adds developers from search results into the pipeline on `/pipeline`.
2. State lives in `frontend/src/lib/pipeline-store.ts` — a Zustand store wrapped with `persist({ name: "devlens-pipeline" })` middleware writing to `localStorage`.
3. **No backend involvement.** Pipeline state is private to the browser. The trade-off: it doesn't sync across devices, but it requires no auth or DB.

### "Career simulation" (slider-driven re-fetches)

1. User loads a profile on `/career`. Page fetches both `fetchUserAnalytics` and `fetchAISummary` in parallel.
2. Skill sliders drive a local `simulatedSkills` state.
3. A 500ms debounce wraps every slider change, then calls `fetchProjectMatches(...)` and `fetchCareerPath(...)`.
4. Backend `ai_engine/matchmaker.py` either calls Gemini with the skill profile or runs the heuristic scorer over a pre-fetched list of beginner-friendly issues.

---

## Graceful degradation

DevLens is designed so a fresh contributor with **zero credentials** can still see the UI working:

| Missing dependency | What happens |
|---|---|
| `GITHUB_TOKEN` empty | Anonymous GitHub limit applies (60 req/hr). First few requests succeed; subsequent ones hit `GitHubRateLimitError` → frontend shows a clear "rate limit reached" page instead of a generic error. |
| `GEMINI_API_KEY` empty | All `/ai/*` endpoints return deterministic template responses. UI is fully populated; quality of summaries/recommendations is lower but pages render. |
| Redis unreachable | Cache layer silently bypasses. Every request fans out to GitHub fresh. Hits the rate limit sooner. |
| Backend down (frontend dev) | All `apiFetch` calls reject with `ApiError`. Pages display their typed error states. |

This is load-bearing — never add code that violates these contracts.

---

## Performance notes

- **Frontend bundle**: Next.js 16 with Turbopack. Production bundle hovers around the 200 KB initial JS mark for the landing page.
- **Backend latency**: a fully cached `/user/{x}/analytics` round-trip is < 50 ms (Redis hit). Cold (no Redis hit, no GitHub cache) it's 500-1500 ms depending on user repo count.
- **Concurrency**: every router that needs multiple GitHub fans out with `asyncio.gather` — see `compare.py` and `users.py::get_user_analytics` for examples.

---

## Deploy topology

`docker/docker-compose.yml` defines a four-container stack:

- `backend` (FastAPI, port 8000)
- `frontend` (Next.js, port 3000)
- `redis` (cache, port 6379)
- `nginx` (optional reverse proxy, ports 80/443)

The frontend container talks to the backend via the internal Docker network (`http://backend:8000`) — **not** `localhost`. The browser still talks to both via host ports via the nginx proxy.

For production deploys (Vercel + Render), see `.github/workflows/deploy.yml`.

---

## Testing strategy

- **Backend**: `pytest` with `tests/conftest.py` patching `httpx.AsyncClient` globally. Every test runs without network access. Settings are forced to empty credentials at import time.
- **Frontend**: Vitest + Testing Library + jsdom. `global.fetch = vi.fn()` replaces network calls. Page-level tests mock the API module via `vi.mock("@/lib/api", ...)`.
- **CI**: Three workflows (`backend-ci.yml`, `frontend-ci.yml`, `deploy.yml`) gate every PR on lint → typecheck → test → build.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full local test commands.

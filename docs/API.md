# DevLens AI — API Reference

All endpoints are served from the FastAPI backend (default `http://localhost:8000`).

- All routes return `application/json`.
- All write endpoints accept JSON request bodies.
- All responses degrade gracefully when GitHub, Gemini, or Redis are unavailable — the API never crashes on external failure.

---

## Common conventions

### Headers

The API does not require auth headers from clients. The backend itself authenticates outbound calls to GitHub via the `GITHUB_TOKEN` environment variable.

### Error shape

Errors are returned with appropriate HTTP status codes and a JSON body:

```json
{ "detail": "Human-readable message" }
```

Validation errors (HTTP 422) include an `errors` array describing each field.

### Rate limits

| Limit | Scope |
|---|---|
| **60 req/min per IP** | Inbound rate limit, enforced by `rate_limit_middleware`. Returns HTTP 429 with `Retry-After`. |
| **5,000 req/hr (token) / 60 req/hr (anon)** | Outbound GitHub API rate limit. If exhausted, the API returns HTTP **429** with a clear `detail` message instructing you to set `GITHUB_TOKEN`. |

Inbound rate-limit response headers on every successful request:

- `X-RateLimit-Limit: 60`
- `X-RateLimit-Remaining: <int>`
- `X-RateLimit-Reset: <unix timestamp>`

---

## `/health` — service status

| Method | Path |
|---|---|
| `GET` | `/health` |

**Response 200**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "service": "DevLens AI API",
  "github_rate_limit": { "remaining": 4998, "reset": 1780346402 },
  "client_ip": "127.0.0.1"
}
```

```bash
curl http://localhost:8000/health
```

---

## Users — `/user`

### `GET /user/{username}`

Returns a normalized GitHub user profile.

**Response 200**
```json
{
  "username": "torvalds",
  "name": "Linus Torvalds",
  "avatar": "https://avatars.githubusercontent.com/u/1024025?v=4",
  "bio": "",
  "location": "Portland, OR",
  "company": "Linux Foundation",
  "blog": "",
  "followers": 200000,
  "following": 0,
  "public_repos": 8,
  "created_at": "2011-09-03T15:26:22Z",
  "html_url": "https://github.com/torvalds"
}
```

**Errors**
- `404` — user not found on GitHub
- `429` — GitHub rate limit exhausted

```bash
curl http://localhost:8000/user/torvalds
```

---

### `GET /user/{username}/repos`

Returns the user's public repositories, sorted by stars, with a derived quality score per repo.

**Response 200**
```json
[
  {
    "name": "linux",
    "description": "Linux kernel source tree",
    "stars": 175000,
    "forks": 53000,
    "language": "C",
    "html_url": "https://github.com/torvalds/linux",
    "updated_at": "2026-06-09T17:22:00Z",
    "quality_score": 92,
    "topics": [],
    "has_license": true
  }
]
```

```bash
curl http://localhost:8000/user/torvalds/repos
```

---

### `GET /user/{username}/analytics`

The **aggregated profile + scores + chart data** endpoint that powers the profile page. Internally fans out to GitHub for profile, top 100 repos, and weekly commit activity on the top repo.

**Response 200** (truncated)
```json
{
  "username": "torvalds",
  "name": "Linus Torvalds",
  "avatar": "...",
  "total_stars": 175123,
  "total_forks": 53201,
  "repo_count": 8,
  "language_stats": [
    { "name": "C", "percentage": 75, "color": "#555555" }
  ],
  "top_languages": ["C", "Shell"],
  "commit_history": [{ "month": "Jan", "commits": 14 }],
  "consistency_score": 78,
  "collaboration_score": 64,
  "open_source_score": 97,
  "top_repos": [/* up to 6 enriched repo entries */]
}
```

**Errors** — `404`, `429`.

```bash
curl http://localhost:8000/user/torvalds/analytics
```

---

### `GET /user/{username}/activity`

Latest 15 public events, formatted as human-readable descriptions.

**Response 200**
```json
{
  "events": [
    { "type": "PushEvent", "description": "Pushed 3 commits to torvalds/linux", "repo": "torvalds/linux", "created_at": "..." }
  ]
}
```

```bash
curl http://localhost:8000/user/torvalds/activity
```

---

## Explore — `/explore`

### `GET /explore/trending`

Curated list of 8 well-known developers, enriched with profile + language stats. No query parameters.

```bash
curl http://localhost:8000/explore/trending
```

### `GET /explore/search?q={query}&per_page={n}`

Search GitHub users by query string. Minimum query length is 2 characters; longer queries are truncated to 100 chars.

| Param | Type | Default |
|---|---|---|
| `q` | string | required, ≥ 2 chars |
| `per_page` | int | 10 |

```bash
curl "http://localhost:8000/explore/search?q=gaearon"
```

---

## Compare — `/compare`

### `POST /compare`

Side-by-side comparison of two developers with AI-generated analysis.

**Request body**
```json
{ "username_a": "torvalds", "username_b": "gaearon" }
```

**Response 200** (truncated)
```json
{
  "developer_a": { "username": "torvalds", "/* profile + scores */": "..." },
  "developer_b": { "username": "gaearon", "/* ... */": "..." },
  "ai_analysis": "Both developers bring complementary strengths..."
}
```

```bash
curl -X POST http://localhost:8000/compare \
  -H "Content-Type: application/json" \
  -d '{"username_a":"torvalds","username_b":"gaearon"}'
```

---

## Repos — `/repo`

### `GET /repo/{owner}/{repo}`

Repository analysis: quality score, language breakdown, recent commit activity, top contributors, and an AI-generated review.

**Response 200** (truncated)
```json
{
  "owner": "facebook",
  "name": "react",
  "stars": 220000,
  "forks": 45000,
  "watchers": 6700,
  "language": "JavaScript",
  "license": "MIT",
  "open_issues": 1200,
  "html_url": "https://github.com/facebook/react",
  "topics": ["javascript", "react"],
  "quality_score": 98,
  "checks": [
    { "label": "README.md present", "status": "pass", "detail": "README found (8,231 chars) — comprehensive documentation" }
  ],
  "languages": [{ "name": "JavaScript", "percentage": 87.4, "color": "#f1e05a" }],
  "commit_activity": [{ "week": "W1", "commits": 47 }],
  "contributors": [{ "name": "gaearon", "avatar": "...", "commits": 1240 }],
  "ai_review": "React's codebase demonstrates exemplary documentation practices...",
  "ai_suggestions": []
}
```

```bash
curl http://localhost:8000/repo/facebook/react
```

---

## AI — `/ai`

All `/ai/*` endpoints **fall back to template responses** when `GEMINI_API_KEY` is not configured or the Gemini API call fails. They never return errors for AI-side issues.

### `POST /ai/summary`

Generates a developer summary with role prediction, strengths, and a skill radar.

**Request body**
```json
{
  "username": "torvalds",
  "name": "Linus Torvalds",
  "bio": "",
  "top_languages": ["C", "Shell"],
  "total_stars": 175000,
  "followers": 200000,
  "repos": 8,
  "created_at": "2011-09-03T15:26:22Z"
}
```

**Response 200**
```json
{
  "summary": "...",
  "role_prediction": "Systems Engineering Lead",
  "strengths": ["Strong C expertise", "Impactful open-source contributor"],
  "skills": [
    { "skill": "Backend", "value": 60 },
    { "skill": "Systems", "value": 95 }
  ]
}
```

```bash
curl -X POST http://localhost:8000/ai/summary \
  -H "Content-Type: application/json" \
  -d '{"username":"torvalds","name":"Linus Torvalds"}'
```

### `POST /ai/resume-points`

Generates 4–5 achievement-focused resume bullets.

**Response 200**
```json
{ "bullets": ["Maintained open-source repositories earning 175,000+ GitHub stars", "..."] }
```

### `POST /ai/repo-review`

AI review of a single repository — used inline by `GET /repo/{owner}/{repo}`.

**Response 200**
```json
{ "review": "...", "suggestions": ["Add a CONTRIBUTING.md", "Set up CI"] }
```

### `POST /ai/compare`

AI-generated comparison narrative between two developer dicts.

**Response 200**
```json
{ "analysis": "..." }
```

### `POST /ai/match-projects`

Matches a developer's profile with open, beginner-friendly GitHub issues.

**Request body** (skills are optional but improve match quality)
```json
{
  "username": "torvalds",
  "top_languages": ["C", "Rust"],
  "skills": [{ "skill": "Systems", "value": 95 }]
}
```

**Response 200**
```json
{
  "summary": "Found 6 strong matches based on your systems expertise.",
  "matches": [
    {
      "repo": "rust-lang/rust",
      "issue_title": "Improve compile error message for trait bounds",
      "issue_url": "https://github.com/rust-lang/rust/issues/12345",
      "issue_number": 12345,
      "labels": ["E-easy", "T-compiler"],
      "language": "Rust",
      "match_score": 0.87,
      "reason": "Strong systems background; matches Rust ecosystem.",
      "created_at": "2026-04-12T...",
      "updated_at": "2026-06-09T...",
      "comments": 4,
      "body_snippet": "..."
    }
  ]
}
```

### `POST /ai/career-path`

Personalized career-transition roadmap. `target_role` is validated against the supported list — invalid values silently fall back to `"Full-Stack Engineer"`.

**Request body**
```json
{
  "username": "torvalds",
  "top_languages": ["C"],
  "skills": [{ "skill": "Systems", "value": 95 }],
  "target_role": "DevOps / SRE"
}
```

**Response 200**
```json
{
  "current_role": "Systems Engineering Lead",
  "target_role": "DevOps / SRE",
  "gap_analysis": "Strong systems fundamentals; needs containerization + cloud experience.",
  "milestones": [
    {
      "title": "Master container orchestration",
      "description": "Learn Kubernetes deeply...",
      "suggested_repos": ["kubernetes/kubernetes"],
      "priority": "high"
    }
  ],
  "timeline": "6-9 months",
  "key_technologies": ["Docker", "Kubernetes", "Terraform"]
}
```

### `GET /ai/career-roles`

Returns the list of supported target roles.

**Response 200**
```json
{
  "roles": [
    "Full-Stack Engineer", "Backend Engineer", "Frontend Engineer",
    "DevOps / SRE", "ML / AI Engineer", "Systems Engineer", "Mobile Developer"
  ]
}
```

```bash
curl http://localhost:8000/ai/career-roles
```

---

## Interactive docs

FastAPI auto-generates Swagger UI and ReDoc:

- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

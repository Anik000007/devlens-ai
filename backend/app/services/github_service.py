"""
GitHub API service layer for DevLens AI.
Handles all GitHub REST & GraphQL API calls with Redis caching.
"""
import httpx
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from app.core.config import settings
from app.services.cache import cache_get, cache_set

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"
GITHUB_GRAPHQL = "https://api.github.com/graphql"

# GitHub language colors for the frontend
LANG_COLORS: Dict[str, str] = {
    "JavaScript": "#f1e05a", "TypeScript": "#3178c6", "Python": "#3572A5",
    "Rust": "#dea584", "Go": "#00ADD8", "C": "#555555", "C++": "#f34b7d",
    "Java": "#b07219", "Ruby": "#701516", "Swift": "#F05138", "Kotlin": "#7F52FF",
    "Shell": "#89e051", "Vue": "#41b883", "HTML": "#e34c26", "CSS": "#563d7c",
    "Perl": "#0298c3", "PHP": "#4F5D95", "Dart": "#00B4AB", "Scala": "#c22d40",
    "R": "#198CE7", "Lua": "#000080", "Haskell": "#5e5086", "Elixir": "#6e4a7e",
    "Clojure": "#db5855", "Objective-C": "#438eff", "Jupyter Notebook": "#DA5B0B",
    "SCSS": "#c6538c", "Dockerfile": "#384d54", "Makefile": "#427819",
}

# Rate-limit tracking
_rate_limit_remaining: Optional[int] = None
_rate_limit_reset: Optional[int] = None


def get_headers() -> Dict[str, str]:
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return headers


def _track_rate_limit(resp: httpx.Response) -> None:
    """Track GitHub API rate limit from response headers."""
    global _rate_limit_remaining, _rate_limit_reset
    remaining = resp.headers.get("X-RateLimit-Remaining")
    reset = resp.headers.get("X-RateLimit-Reset")
    if remaining is not None:
        _rate_limit_remaining = int(remaining)
    if reset is not None:
        _rate_limit_reset = int(reset)
    if _rate_limit_remaining is not None and _rate_limit_remaining < 50:
        logger.warning("GitHub API rate limit low: %d remaining", _rate_limit_remaining)


def get_rate_limit_info() -> Dict[str, Any]:
    """Return current rate limit info."""
    return {
        "remaining": _rate_limit_remaining,
        "reset": _rate_limit_reset,
    }


# ---------------------------------------------------------------------------
# Core GitHub API calls (with caching)
# ---------------------------------------------------------------------------

async def fetch_user(username: str) -> Optional[Dict[str, Any]]:
    """Fetch a GitHub user profile. Cached for CACHE_TTL seconds."""
    cache_key = f"gh:user:{username.lower()}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{GITHUB_API}/users/{username}", headers=get_headers())
        _track_rate_limit(resp)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        data = resp.json()
        await cache_set(cache_key, data)
        return data


async def fetch_user_repos(username: str, per_page: int = 30) -> list:
    """Fetch user repositories sorted by stars. Cached."""
    cache_key = f"gh:repos:{username.lower()}:{per_page}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"{GITHUB_API}/users/{username}/repos",
            headers=get_headers(),
            params={"sort": "stars", "per_page": per_page, "type": "owner"},
        )
        _track_rate_limit(resp)
        resp.raise_for_status()
        data = resp.json()
        await cache_set(cache_key, data)
        return data


async def fetch_repo_detail(owner: str, repo: str) -> Optional[Dict[str, Any]]:
    """Fetch detailed info for a single repository."""
    cache_key = f"gh:repo:{owner.lower()}:{repo.lower()}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=get_headers())
        _track_rate_limit(resp)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        data = resp.json()
        await cache_set(cache_key, data)
        return data


async def fetch_repo_languages(owner: str, repo: str) -> Dict[str, int]:
    """Fetch language breakdown for a repository."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}/languages", headers=get_headers())
        _track_rate_limit(resp)
        resp.raise_for_status()
        return resp.json()


async def fetch_commit_activity(owner: str, repo: str) -> list:
    """Fetch weekly commit activity for a repo (last 52 weeks)."""
    cache_key = f"gh:commits:{owner.lower()}:{repo.lower()}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/stats/commit_activity",
            headers=get_headers(),
        )
        _track_rate_limit(resp)
        if resp.status_code == 202:
            return []  # GitHub is computing stats, retry later
        if resp.status_code != 200:
            return []
        data = resp.json()
        if isinstance(data, list):
            await cache_set(cache_key, data, ttl=3600)
        return data if isinstance(data, list) else []


async def fetch_repo_contents(owner: str, repo: str, path: str = "") -> Optional[Any]:
    """Check if a file or directory exists in a repo via Contents API."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
                headers=get_headers(),
            )
            _track_rate_limit(resp)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.json()
    except Exception:
        return None


async def fetch_repo_readme(owner: str, repo: str) -> Optional[str]:
    """Fetch the decoded README content."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {**get_headers(), "Accept": "application/vnd.github.raw+json"}
            resp = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/readme",
                headers=headers,
            )
            _track_rate_limit(resp)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.text
    except Exception:
        return None


async def fetch_user_events(username: str, per_page: int = 10) -> list:
    """Fetch recent public events for a user."""
    cache_key = f"gh:events:{username.lower()}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{GITHUB_API}/users/{username}/events/public",
                headers=get_headers(),
                params={"per_page": per_page},
            )
            _track_rate_limit(resp)
            if resp.status_code != 200:
                return []
            data = resp.json()
            await cache_set(cache_key, data, ttl=600)  # 10min cache for events
            return data
    except Exception:
        return []


async def search_github_users(query: str, per_page: int = 10) -> Dict[str, Any]:
    """Search GitHub users by query."""
    cache_key = f"gh:search:{query.lower()}:{per_page}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{GITHUB_API}/search/users",
                headers=get_headers(),
                params={"q": query, "per_page": per_page},
            )
            _track_rate_limit(resp)
            resp.raise_for_status()
            data = resp.json()
            await cache_set(cache_key, data, ttl=900)  # 15min cache for search
            return data
    except Exception:
        return {"items": [], "total_count": 0}


async def fetch_repo_contributors(owner: str, repo: str, per_page: int = 5) -> list:
    """Fetch top contributors for a repo."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/contributors",
                headers=get_headers(),
                params={"per_page": per_page},
            )
            _track_rate_limit(resp)
            if resp.status_code != 200:
                return []
            return resp.json()
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Analytics & scoring functions
# ---------------------------------------------------------------------------

def calculate_language_stats(repos: list) -> list:
    """Calculate language percentages from a list of repos, with colors."""
    lang_counts: Dict[str, int] = {}
    for repo in repos:
        lang = repo.get("language")
        if lang:
            lang_counts[lang] = lang_counts.get(lang, 0) + 1
    total = sum(lang_counts.values()) or 1
    return [
        {
            "name": lang,
            "percentage": round((count / total) * 100),
            "color": LANG_COLORS.get(lang, "#8b8b8b"),
        }
        for lang, count in sorted(lang_counts.items(), key=lambda x: -x[1])
    ]


def calculate_quality_score(repo: Dict[str, Any], file_checks: Optional[Dict] = None) -> int:
    """
    Calculate a quality score for a repository.
    Enhanced version that checks for more signals.
    """
    score = 30  # base

    # Basic metadata
    if repo.get("description"):
        score += 8
    if repo.get("license"):
        score += 10
    if repo.get("homepage"):
        score += 3
    if repo.get("has_wiki"):
        score += 2
    if repo.get("has_issues"):
        score += 2
    if repo.get("has_projects"):
        score += 2

    # Stars indicate community validation
    stars = repo.get("stargazers_count", 0)
    if stars > 10000:
        score += 15
    elif stars > 1000:
        score += 10
    elif stars > 100:
        score += 6
    elif stars > 10:
        score += 3

    # Forks indicate usefulness
    forks = repo.get("forks_count", 0)
    if forks > 1000:
        score += 5
    elif forks > 100:
        score += 3

    # Recency
    updated = repo.get("updated_at") or repo.get("pushed_at")
    if updated:
        try:
            updated_dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
            days_ago = (datetime.now(timezone.utc) - updated_dt).days
            if days_ago < 30:
                score += 8
            elif days_ago < 90:
                score += 5
            elif days_ago < 365:
                score += 2
        except Exception:
            pass

    # File-based checks (from Contents API)
    if file_checks:
        if file_checks.get("has_readme"):
            score += 5
        if file_checks.get("readme_length", 0) > 500:
            score += 3
        if file_checks.get("has_ci"):
            score += 8
        if file_checks.get("has_tests"):
            score += 5
        if file_checks.get("has_contributing"):
            score += 3
        if file_checks.get("has_changelog"):
            score += 2

    return min(score, 99)


async def run_repo_quality_checks(owner: str, repo: str, repo_data: Dict) -> List[Dict]:
    """Run quality checks on a repository and return detailed results."""
    checks = []

    # README
    readme = await fetch_repo_readme(owner, repo)
    if readme:
        readme_len = len(readme)
        detail = f"README found ({readme_len:,} chars)"
        if readme_len > 2000:
            detail += " — comprehensive documentation"
        elif readme_len > 500:
            detail += " — good coverage"
        else:
            detail += " — could be more detailed"
        checks.append({
            "label": "README.md present",
            "status": "pass" if readme_len > 200 else "warn",
            "detail": detail,
        })
    else:
        checks.append({"label": "README.md present", "status": "fail", "detail": "No README.md found"})

    # License
    if repo_data.get("license"):
        lic_name = repo_data["license"].get("spdx_id", "Unknown")
        checks.append({"label": "License file", "status": "pass", "detail": f"{lic_name} license detected"})
    else:
        checks.append({"label": "License file", "status": "fail", "detail": "No license file found"})

    # CI/CD
    ci = await fetch_repo_contents(owner, repo, ".github/workflows")
    if ci and isinstance(ci, list) and len(ci) > 0:
        checks.append({
            "label": "CI/CD configured",
            "status": "pass",
            "detail": f"GitHub Actions found ({len(ci)} workflow{'s' if len(ci) > 1 else ''})",
        })
    else:
        checks.append({"label": "CI/CD configured", "status": "fail", "detail": "No GitHub Actions workflows found"})

    # Contributing guide
    contributing = await fetch_repo_contents(owner, repo, "CONTRIBUTING.md")
    if contributing:
        checks.append({"label": "Contributing guide", "status": "pass", "detail": "CONTRIBUTING.md present"})
    else:
        checks.append({"label": "Contributing guide", "status": "warn", "detail": "No CONTRIBUTING.md found"})

    # Tests
    for test_dir in ["tests", "test", "__tests__", "spec"]:
        test_contents = await fetch_repo_contents(owner, repo, test_dir)
        if test_contents:
            checks.append({"label": "Test coverage", "status": "pass", "detail": f"Test directory '{test_dir}/' found"})
            break
    else:
        checks.append({"label": "Test coverage", "status": "warn", "detail": "No test directory detected"})

    # Description
    if repo_data.get("description"):
        checks.append({"label": "Repository description", "status": "pass", "detail": "Description provided"})
    else:
        checks.append({"label": "Repository description", "status": "warn", "detail": "No description set"})

    # Topics/tags
    topics = repo_data.get("topics", [])
    if topics and len(topics) > 0:
        checks.append({"label": "Topic tags", "status": "pass", "detail": f"{len(topics)} topics: {', '.join(topics[:5])}"})
    else:
        checks.append({"label": "Topic tags", "status": "warn", "detail": "No topic tags added"})

    # Code of conduct
    coc = await fetch_repo_contents(owner, repo, "CODE_OF_CONDUCT.md")
    if coc:
        checks.append({"label": "Code of conduct", "status": "pass", "detail": "CODE_OF_CONDUCT.md present"})
    else:
        checks.append({"label": "Code of conduct", "status": "warn", "detail": "No CODE_OF_CONDUCT.md found"})

    return checks


def calculate_consistency_score(repos: list) -> int:
    """Estimate consistency based on update frequency of repos."""
    if not repos:
        return 0
    recent = 0
    now = datetime.now(timezone.utc)
    for r in repos:
        pushed = r.get("pushed_at") or r.get("updated_at")
        if pushed:
            try:
                dt = datetime.fromisoformat(pushed.replace("Z", "+00:00"))
                if (now - dt).days < 90:
                    recent += 1
            except Exception:
                pass
    ratio = recent / len(repos) if repos else 0
    return min(int(ratio * 100), 99)


def calculate_collaboration_score(repos: list) -> int:
    """Estimate collaboration based on forks and issue presence."""
    if not repos:
        return 0
    total_forks = sum(r.get("forks_count", 0) for r in repos)
    has_issues = sum(1 for r in repos if r.get("has_issues"))
    fork_score = min(40, total_forks // 10)
    issue_score = min(30, (has_issues / len(repos)) * 30) if repos else 0
    return min(int(fork_score + issue_score + 20), 99)


def calculate_oss_score(user: Dict, repos: list) -> int:
    """Calculate open-source impact score."""
    if not repos:
        return 0
    stars = sum(r.get("stargazers_count", 0) for r in repos)
    followers = user.get("followers", 0)
    repo_count = len(repos)

    star_score = min(40, stars // 100)
    follow_score = min(25, followers // 200)
    repo_score = min(20, repo_count // 5)
    base = 10

    return min(star_score + follow_score + repo_score + base, 99)


def build_commit_history(commit_activity: list) -> list:
    """Convert GitHub's weekly commit activity to monthly summary."""
    if not commit_activity or not isinstance(commit_activity, list):
        return []

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    # GitHub returns 52 weeks; group into ~monthly
    monthly: Dict[str, int] = {}
    for week in commit_activity:
        ts = week.get("week", 0)
        total = week.get("total", 0)
        try:
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            key = months[dt.month - 1]
            monthly[key] = monthly.get(key, 0) + total
        except Exception:
            pass

    # Return last 12 months in order
    now = datetime.now(timezone.utc)
    result = []
    for i in range(11, -1, -1):
        month_idx = (now.month - 1 - i) % 12
        m = months[month_idx]
        result.append({"month": m, "commits": monthly.get(m, 0)})
    return result

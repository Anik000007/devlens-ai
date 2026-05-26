"""
Pytest fixtures for DevLens AI backend tests.
All external API calls are mocked to avoid rate limits and API costs.
"""
from unittest.mock import AsyncMock, MagicMock, patch
import json
import pytest
from httpx import Response

from app.core.config import settings


# Force test settings before importing app
settings.GITHUB_TOKEN = ""
settings.GEMINI_API_KEY = ""
settings.REDIS_URL = "redis://localhost:63799"  # Unreachable → cache disabled
settings.CACHE_TTL = 300
settings.LOG_LEVEL = "CRITICAL"


SAMPLE_USER: dict = {
    "login": "testuser",
    "id": 12345,
    "name": "Test User",
    "avatar_url": "https://avatars.githubusercontent.com/u/12345",
    "bio": "A test developer",
    "location": "Test City",
    "company": "Test Corp",
    "blog": "https://test.dev",
    "followers": 1500,
    "following": 42,
    "public_repos": 30,
    "created_at": "2020-01-15T00:00:00Z",
    "html_url": "https://github.com/testuser",
    "type": "User",
}

SAMPLE_REPOS: list = [
    {
        "id": 1,
        "name": "awesome-project",
        "description": "An awesome open-source project",
        "stargazers_count": 2500,
        "forks_count": 500,
        "language": "Python",
        "html_url": "https://github.com/testuser/awesome-project",
        "updated_at": "2026-04-01T00:00:00Z",
        "pushed_at": "2026-04-01T00:00:00Z",
        "topics": ["python", "cli"],
        "license": {"spdx_id": "MIT"},
        "has_issues": True,
        "has_wiki": True,
        "has_projects": True,
        "owner": {"login": "testuser"},
    },
    {
        "id": 2,
        "name": "another-tool",
        "description": "CLI tool for devs",
        "stargazers_count": 800,
        "forks_count": 120,
        "language": "TypeScript",
        "html_url": "https://github.com/testuser/another-tool",
        "updated_at": "2026-03-15T00:00:00Z",
        "pushed_at": "2026-03-15T00:00:00Z",
        "topics": ["typescript", "cli"],
        "license": {"spdx_id": "Apache-2.0"},
        "has_issues": True,
        "has_wiki": False,
        "has_projects": False,
        "owner": {"login": "testuser"},
    },
]

SAMPLE_REPO_DETAIL: dict = {
    "id": 1,
    "name": "awesome-project",
    "full_name": "testuser/awesome-project",
    "description": "An awesome open-source project",
    "stargazers_count": 2500,
    "forks_count": 500,
    "language": "Python",
    "html_url": "https://github.com/testuser/awesome-project",
    "updated_at": "2026-04-01T00:00:00Z",
    "pushed_at": "2026-04-01T00:00:00Z",
    "topics": ["python", "cli"],
    "license": {"spdx_id": "MIT"},
    "has_issues": True,
    "has_wiki": True,
    "has_projects": True,
    "open_issues_count": 12,
    "subscribers_count": 100,
    "owner": {"login": "testuser", "avatar_url": ""},
}

SAMPLE_COMMIT_ACTIVITY: list = [
    {"week": 1700000000, "total": 15, "days": [2, 3, 1, 4, 2, 2, 1]},
    {"week": 1700000000 + 604800, "total": 22, "days": [4, 5, 3, 4, 3, 2, 1]},
]

SAMPLE_SEARCH_RESULT: dict = {
    "total_count": 1,
    "items": [SAMPLE_USER],
}


@pytest.fixture
def mock_httpx_client():
    """Fixture that patches httpx.AsyncClient to return sample data."""
    with patch("httpx.AsyncClient") as mock:
        client_instance = AsyncMock()

        def _make_response(status_code: int, json_data: dict | list) -> Response:
            resp = MagicMock(spec=Response)
            resp.status_code = status_code
            resp.json.return_value = json_data
            resp.headers = {
                "X-RateLimit-Remaining": "5000",
                "X-RateLimit-Reset": "9999999999",
            }
            resp.raise_for_status = MagicMock()
            return resp

        async def get_side(url, **kwargs):
            if "search/users" in url:
                return _make_response(200, SAMPLE_SEARCH_RESULT)
            if "/users/" in url and "/repos" not in url and "/events" not in url:
                return _make_response(200, SAMPLE_USER)
            if "/users/" in url and "/repos" in url:
                return _make_response(200, SAMPLE_REPOS)
            if "/users/" in url and "/events" in url:
                return _make_response(200, [])
            if "/repos/" in url and "/languages" in url:
                return _make_response(200, {"Python": 5000, "TypeScript": 3000})
            if "/repos/" in url and "/contents/" in url:
                return _make_response(404, {"message": "Not Found"})
            if "/repos/" in url and "/readme" in url:
                return _make_response(404, {"message": "Not Found"})
            if "/repos/" in url and "/stats/commit_activity" in url:
                return _make_response(200, SAMPLE_COMMIT_ACTIVITY)
            if "/repos/" in url and "/contributors" in url:
                return _make_response(200, [])
            if "/repos/" in url:
                return _make_response(200, SAMPLE_REPO_DETAIL)
            return _make_response(200, {})

        client_instance.get = AsyncMock(side_effect=get_side)
        mock.return_value.__aenter__.return_value = client_instance
        yield mock


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """Reset rate limiter between tests so tests don't get 429'd."""
    from app.services.rate_limiter import reset_rate_limits
    reset_rate_limits()


@pytest.fixture
def test_client(mock_httpx_client):
    """Create a FastAPI TestClient with mocked external services."""
    from fastapi.testclient import TestClient
    from app.main import app

    with TestClient(app) as client:
        yield client


@pytest.fixture
def sample_user() -> dict:
    return dict(SAMPLE_USER)


@pytest.fixture
def sample_repos() -> list:
    return [dict(r) for r in SAMPLE_REPOS]

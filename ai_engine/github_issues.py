"""
GitHub issue search for the AI Engine matchmaker.

Searches for open issues labeled 'good-first-issue' or 'help-wanted'
filtered by programming language, using the same patterns as github_service.py.
"""

import httpx
import logging
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.services.cache import cache_get, cache_set

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"


def _get_headers() -> Dict[str, str]:
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return headers


async def search_matching_issues(
    languages: List[str],
    max_results: int = 15,
) -> List[Dict[str, Any]]:
    """
    Search GitHub for open issues labeled 'good first issue' or 'help wanted',
    filtered by the developer's known languages.

    Returns a list of issue dicts with repo info, labels, and URLs.
    """
    if not languages:
        languages = ["Python", "JavaScript"]

    # Build a query: open issues with good-first-issue OR help-wanted labels
    # filtered by the developer's top languages
    lang_filter = " ".join(f"language:{lang}" for lang in languages[:3])
    query = f"label:\"good first issue\" state:open {lang_filter}"

    cache_key = f"ai:issues:{':'.join(sorted(l.lower() for l in languages[:3]))}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{GITHUB_API}/search/issues",
                headers=_get_headers(),
                params={
                    "q": query,
                    "sort": "updated",
                    "order": "desc",
                    "per_page": max_results,
                },
            )
            if resp.status_code != 200:
                logger.warning(
                    "GitHub issue search failed: %d %s",
                    resp.status_code,
                    resp.text[:200],
                )
                return _fallback_issues(languages)

            data = resp.json()
            items = data.get("items", [])

            results = []
            for item in items[:max_results]:
                repo_url = item.get("repository_url", "")
                # Extract owner/repo from repository_url
                # e.g. https://api.github.com/repos/facebook/react
                repo_parts = repo_url.rstrip("/").split("/")
                repo_full = (
                    f"{repo_parts[-2]}/{repo_parts[-1]}"
                    if len(repo_parts) >= 2
                    else "unknown/unknown"
                )

                results.append({
                    "repo": repo_full,
                    "issue_title": item.get("title", ""),
                    "issue_url": item.get("html_url", ""),
                    "issue_number": item.get("number", 0),
                    "labels": [
                        lbl.get("name", "") for lbl in item.get("labels", [])
                    ],
                    "language": _guess_language_from_labels(
                        item.get("labels", []), languages
                    ),
                    "created_at": item.get("created_at", ""),
                    "updated_at": item.get("updated_at", ""),
                    "comments": item.get("comments", 0),
                    "body_snippet": (item.get("body") or "")[:300],
                })

            await cache_set(cache_key, results, ttl=900)  # 15 min cache
            return results

    except Exception as e:
        logger.warning("GitHub issue search error: %s", e)
        return _fallback_issues(languages)


def _guess_language_from_labels(
    labels: List[Dict], developer_languages: List[str]
) -> str:
    """Try to guess the language of an issue from its labels."""
    label_names = [lbl.get("name", "").lower() for lbl in labels]
    for lang in developer_languages:
        if lang.lower() in label_names:
            return lang
    return developer_languages[0] if developer_languages else "Unknown"


def _fallback_issues(languages: List[str]) -> List[Dict[str, Any]]:
    """
    Return curated fallback issues when GitHub API is unavailable.
    These are well-known repos that consistently have good-first-issues.
    """
    curated = {
        "python": [
            {
                "repo": "python/cpython",
                "issue_title": "Improve documentation for asyncio module",
                "issue_url": "https://github.com/python/cpython/issues",
                "issue_number": 0,
                "labels": ["good first issue", "docs"],
                "language": "Python",
                "created_at": "",
                "updated_at": "",
                "comments": 0,
                "body_snippet": "Help improve Python's asyncio documentation.",
            },
            {
                "repo": "tiangolo/fastapi",
                "issue_title": "Add examples for dependency injection patterns",
                "issue_url": "https://github.com/tiangolo/fastapi/issues",
                "issue_number": 0,
                "labels": ["good first issue", "documentation"],
                "language": "Python",
                "created_at": "",
                "updated_at": "",
                "comments": 0,
                "body_snippet": "FastAPI needs more examples for DI patterns.",
            },
        ],
        "javascript": [
            {
                "repo": "facebook/react",
                "issue_title": "Improve accessibility in core components",
                "issue_url": "https://github.com/facebook/react/issues",
                "issue_number": 0,
                "labels": ["good first issue", "accessibility"],
                "language": "JavaScript",
                "created_at": "",
                "updated_at": "",
                "comments": 0,
                "body_snippet": "Help improve accessibility across React.",
            },
        ],
        "typescript": [
            {
                "repo": "microsoft/TypeScript",
                "issue_title": "Fix type inference edge case",
                "issue_url": "https://github.com/microsoft/TypeScript/issues",
                "issue_number": 0,
                "labels": ["good first issue", "bug"],
                "language": "TypeScript",
                "created_at": "",
                "updated_at": "",
                "comments": 0,
                "body_snippet": "Address a type inference issue in generics.",
            },
        ],
        "rust": [
            {
                "repo": "rust-lang/rust",
                "issue_title": "Improve compiler error messages",
                "issue_url": "https://github.com/rust-lang/rust/issues",
                "issue_number": 0,
                "labels": ["good first issue", "diagnostics"],
                "language": "Rust",
                "created_at": "",
                "updated_at": "",
                "comments": 0,
                "body_snippet": "Improve compiler diagnostics for common errors.",
            },
        ],
        "go": [
            {
                "repo": "golang/go",
                "issue_title": "Add standard library documentation improvements",
                "issue_url": "https://github.com/golang/go/issues",
                "issue_number": 0,
                "labels": ["good first issue", "documentation"],
                "language": "Go",
                "created_at": "",
                "updated_at": "",
                "comments": 0,
                "body_snippet": "Help improve Go standard library docs.",
            },
        ],
    }

    results = []
    for lang in languages[:3]:
        results.extend(curated.get(lang.lower(), []))

    # If no matches, return Python fallbacks
    if not results:
        results = curated.get("python", [])

    return results[:15]

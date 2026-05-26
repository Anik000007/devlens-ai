from fastapi import APIRouter
from app.services.github_service import search_github_users, fetch_user, fetch_user_repos, calculate_language_stats

router = APIRouter()

TRENDING_CURATED = [
    "torvalds", "gaearon", "sindresorhus", "yyx990803", "antfu",
    "tj", "ThePrimeagen", "fireship-io",
]


@router.get("/trending")
async def get_trending():
    """
    Returns a curated list of trending developers with real GitHub data.
    Falls back to basic info if API calls fail for some users.
    """
    developers = []
    for username in TRENDING_CURATED:
        try:
            user = await fetch_user(username)
            if not user:
                continue
            repos = await fetch_user_repos(username, per_page=30)
            langs = calculate_language_stats(repos)
            total_stars = sum(r.get("stargazers_count", 0) for r in repos)

            developers.append({
                "id": str(user["id"]),
                "username": user["login"],
                "name": user.get("name") or user["login"],
                "avatar": user["avatar_url"],
                "bio": user.get("bio") or "",
                "location": user.get("location") or "",
                "followers": user["followers"],
                "following": user["following"],
                "repos": user["public_repos"],
                "stars": total_stars,
                "topLanguages": [l["name"] for l in langs[:3]],
                "score": min(95, 50 + min(user["followers"], 100000) // 2500),
                "contributions": [],  # Would need GraphQL for this
            })
        except Exception:
            continue

    return {"developers": developers, "total": len(developers)}


@router.get("/search")
async def search_users(q: str = "", per_page: int = 10):
    """
    Search GitHub users by query string.
    Returns enriched profiles with language stats.
    """
    q = q.strip()
    if not q or len(q) < 2:
        return {"developers": [], "total": 0}
    if len(q) > 100:
        q = q[:100]

    search_result = await search_github_users(q, per_page=per_page)
    items = search_result.get("items", [])

    developers = []
    for item in items[:per_page]:
        try:
            user = await fetch_user(item["login"])
            if not user:
                continue
            repos = await fetch_user_repos(item["login"], per_page=10)
            langs = calculate_language_stats(repos)
            total_stars = sum(r.get("stargazers_count", 0) for r in repos)

            developers.append({
                "id": str(user["id"]),
                "username": user["login"],
                "name": user.get("name") or user["login"],
                "avatar": user["avatar_url"],
                "bio": user.get("bio") or "",
                "location": user.get("location") or "",
                "followers": user["followers"],
                "following": user["following"],
                "repos": user["public_repos"],
                "stars": total_stars,
                "topLanguages": [l["name"] for l in langs[:3]],
                "score": min(95, 50 + min(user["followers"], 100000) // 2500),
                "contributions": [],
            })
        except Exception:
            continue

    return {"developers": developers, "total": search_result.get("total_count", 0)}

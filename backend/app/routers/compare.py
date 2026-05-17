import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.github_service import (
    fetch_user, fetch_user_repos, calculate_language_stats,
    calculate_consistency_score, calculate_collaboration_score,
    calculate_oss_score, calculate_quality_score,
    fetch_commit_activity, build_commit_history,
)
from app.services.ai_service import generate_compare_analysis

router = APIRouter()


class CompareRequest(BaseModel):
    username_a: str
    username_b: str


@router.post("")
async def compare_users(req: CompareRequest):
    """Compare two GitHub developers side by side with real data."""
    # Fetch both users in parallel
    user_a, user_b = await asyncio.gather(
        fetch_user(req.username_a),
        fetch_user(req.username_b),
    )
    if not user_a:
        raise HTTPException(status_code=404, detail=f"User '{req.username_a}' not found")
    if not user_b:
        raise HTTPException(status_code=404, detail=f"User '{req.username_b}' not found")

    # Fetch repos in parallel
    repos_a, repos_b = await asyncio.gather(
        fetch_user_repos(req.username_a, per_page=100),
        fetch_user_repos(req.username_b, per_page=100),
    )

    # Build commit history from top repo for each dev
    async def get_commit_history(user, repos):
        if repos:
            top = max(repos, key=lambda r: r["stargazers_count"])
            activity = await fetch_commit_activity(user["login"], top["name"])
            return build_commit_history(activity)
        return []

    history_a, history_b = await asyncio.gather(
        get_commit_history(user_a, repos_a),
        get_commit_history(user_b, repos_b),
    )

    def build_profile(user, repos, commit_history):
        langs = calculate_language_stats(repos)
        total_stars = sum(r.get("stargazers_count", 0) for r in repos)
        total_forks = sum(r.get("forks_count", 0) for r in repos)
        return {
            "username": user["login"],
            "name": user.get("name") or user["login"],
            "avatar": user["avatar_url"],
            "bio": user.get("bio") or "",
            "followers": user["followers"],
            "repos": user["public_repos"],
            "total_stars": total_stars,
            "total_forks": total_forks,
            "languages": calculate_language_stats(repos),
            "top_language_names": [l["name"] for l in langs[:3]],
            "consistency_score": calculate_consistency_score(repos),
            "collaboration_score": calculate_collaboration_score(repos),
            "open_source_score": calculate_oss_score(user, repos),
            "commit_history": commit_history,
            "skills": _estimate_skills(langs, total_stars, user["followers"]),
        }

    dev_a = build_profile(user_a, repos_a, history_a)
    dev_b = build_profile(user_b, repos_b, history_b)

    # AI comparison
    ai_analysis = await generate_compare_analysis(
        {**dev_a, "languages": dev_a["top_language_names"]},
        {**dev_b, "languages": dev_b["top_language_names"]},
    )

    return {
        "developer_a": dev_a,
        "developer_b": dev_b,
        "ai_analysis": ai_analysis,
    }


def _estimate_skills(langs, total_stars, followers):
    """Estimate skill radar values from language usage."""
    lang_names = [l["name"].lower() for l in langs]
    return [
        {"skill": "Backend", "value": min(95, 60 if any(l in lang_names for l in ["python", "go", "java", "rust", "c", "ruby"]) else 25)},
        {"skill": "Frontend", "value": min(95, 70 if any(l in lang_names for l in ["javascript", "typescript", "vue", "html", "css"]) else 20)},
        {"skill": "Systems", "value": min(95, 80 if any(l in lang_names for l in ["c", "c++", "rust", "assembly"]) else 20)},
        {"skill": "Open Source", "value": min(95, 40 + min(total_stars, 10000) // 250)},
        {"skill": "DevOps", "value": min(95, 50 if any(l in lang_names for l in ["shell", "dockerfile", "makefile"]) else 25)},
        {"skill": "Community", "value": min(95, 30 + min(followers, 50000) // 1000)},
    ]

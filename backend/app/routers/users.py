import asyncio
from fastapi import APIRouter, HTTPException
from app.services.github_service import (
    fetch_user, fetch_user_repos, fetch_user_events, fetch_commit_activity,
    calculate_language_stats, calculate_quality_score,
    calculate_consistency_score, calculate_collaboration_score,
    calculate_oss_score, build_commit_history, LANG_COLORS,
)

router = APIRouter()


@router.get("/{username}")
async def get_user(username: str):
    """Get a GitHub user's profile."""
    user = await fetch_user(username)
    if not user:
        raise HTTPException(status_code=404, detail=f"GitHub user '{username}' not found")
    return {
        "username": user["login"],
        "name": user.get("name") or user["login"],
        "avatar": user["avatar_url"],
        "bio": user.get("bio") or "",
        "location": user.get("location") or "",
        "company": user.get("company") or "",
        "blog": user.get("blog") or "",
        "followers": user["followers"],
        "following": user["following"],
        "public_repos": user["public_repos"],
        "created_at": user["created_at"],
        "html_url": user["html_url"],
    }


@router.get("/{username}/repos")
async def get_user_repos(username: str):
    """Get a user's repositories sorted by stars."""
    repos = await fetch_user_repos(username)
    return [
        {
            "name": r["name"],
            "description": r.get("description") or "",
            "stars": r["stargazers_count"],
            "forks": r["forks_count"],
            "language": r.get("language") or "",
            "html_url": r["html_url"],
            "updated_at": r["updated_at"],
            "quality_score": calculate_quality_score(r),
            "topics": r.get("topics", []),
            "has_license": r.get("license") is not None,
        }
        for r in repos
    ]


@router.get("/{username}/analytics")
async def get_user_analytics(username: str):
    """Get comprehensive analytics for a GitHub user."""
    user = await fetch_user(username)
    if not user:
        raise HTTPException(status_code=404, detail=f"GitHub user '{username}' not found")

    repos = await fetch_user_repos(username, per_page=100)
    langs = calculate_language_stats(repos)
    total_stars = sum(r["stargazers_count"] for r in repos)
    total_forks = sum(r["forks_count"] for r in repos)

    # Try to get commit activity from top repo for the chart
    commit_history = []
    if repos:
        top_repo = max(repos, key=lambda r: r["stargazers_count"])
        activity = await fetch_commit_activity(user["login"], top_repo["name"])
        commit_history = build_commit_history(activity)

    # Calculate scores
    consistency = calculate_consistency_score(repos)
    collaboration = calculate_collaboration_score(repos)
    oss_score = calculate_oss_score(user, repos)

    # Top languages as list of strings
    top_lang_names = [l["name"] for l in langs[:5]]

    return {
        "username": user["login"],
        "name": user.get("name") or user["login"],
        "avatar": user["avatar_url"],
        "bio": user.get("bio") or "",
        "location": user.get("location") or "",
        "company": user.get("company") or "",
        "blog": user.get("blog") or "",
        "followers": user["followers"],
        "following": user["following"],
        "total_stars": total_stars,
        "total_forks": total_forks,
        "repo_count": len(repos),
        "language_stats": langs,
        "top_languages": top_lang_names,
        "commit_history": commit_history,
        "consistency_score": consistency,
        "collaboration_score": collaboration,
        "open_source_score": oss_score,
        "created_at": user["created_at"],
        "html_url": user["html_url"],
        "top_repos": [
            {
                "name": r["name"],
                "description": r.get("description") or "",
                "stars": r["stargazers_count"],
                "forks": r["forks_count"],
                "language": r.get("language") or "",
                "html_url": r["html_url"],
                "score": calculate_quality_score(r),
            }
            for r in sorted(repos, key=lambda x: x["stargazers_count"], reverse=True)[:6]
        ],
    }


@router.get("/{username}/activity")
async def get_user_activity(username: str):
    """Get recent public events for a user."""
    events = await fetch_user_events(username, per_page=15)
    formatted = []
    for e in events:
        event_type = e.get("type", "")
        repo_name = e.get("repo", {}).get("name", "")
        created = e.get("created_at", "")

        if event_type == "PushEvent":
            commits = e.get("payload", {}).get("commits", [])
            desc = f"Pushed {len(commits)} commit{'s' if len(commits) != 1 else ''} to {repo_name}"
        elif event_type == "PullRequestEvent":
            action = e.get("payload", {}).get("action", "")
            pr_title = e.get("payload", {}).get("pull_request", {}).get("title", "")
            desc = f"{action.capitalize()} PR '{pr_title}' in {repo_name}"
        elif event_type == "IssuesEvent":
            action = e.get("payload", {}).get("action", "")
            title = e.get("payload", {}).get("issue", {}).get("title", "")
            desc = f"{action.capitalize()} issue '{title}' in {repo_name}"
        elif event_type == "WatchEvent":
            desc = f"Starred {repo_name}"
        elif event_type == "CreateEvent":
            ref_type = e.get("payload", {}).get("ref_type", "")
            ref = e.get("payload", {}).get("ref", "")
            desc = f"Created {ref_type} {ref or ''} in {repo_name}".strip()
        elif event_type == "ForkEvent":
            desc = f"Forked {repo_name}"
        else:
            desc = f"{event_type.replace('Event', '')} on {repo_name}"

        formatted.append({
            "type": event_type,
            "description": desc,
            "repo": repo_name,
            "created_at": created,
        })
    return {"events": formatted}

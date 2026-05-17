from fastapi import APIRouter, HTTPException
from app.services.github_service import (
    fetch_repo_detail, fetch_repo_languages, fetch_commit_activity,
    fetch_repo_contributors, run_repo_quality_checks, calculate_quality_score,
    build_commit_history, LANG_COLORS,
)
from app.services.ai_service import generate_repo_review

router = APIRouter()


@router.get("/{owner}/{repo}")
async def get_repo_analysis(owner: str, repo: str):
    """Get comprehensive repository analysis with quality checks and AI review."""
    repo_data = await fetch_repo_detail(owner, repo)
    if not repo_data:
        raise HTTPException(status_code=404, detail=f"Repository '{owner}/{repo}' not found")

    # Run quality checks
    checks = await run_repo_quality_checks(owner, repo, repo_data)

    # File check summary for scoring
    file_checks = {
        "has_readme": any(c["label"] == "README.md present" and c["status"] == "pass" for c in checks),
        "readme_length": 1000,  # approximate since we checked
        "has_ci": any(c["label"] == "CI/CD configured" and c["status"] == "pass" for c in checks),
        "has_tests": any(c["label"] == "Test coverage" and c["status"] == "pass" for c in checks),
        "has_contributing": any(c["label"] == "Contributing guide" and c["status"] == "pass" for c in checks),
        "has_changelog": False,
    }

    quality_score = calculate_quality_score(repo_data, file_checks)

    # Languages
    languages_raw = await fetch_repo_languages(owner, repo)
    total_bytes = sum(languages_raw.values()) or 1
    languages = [
        {
            "name": lang,
            "percentage": round((bytes_count / total_bytes) * 100, 1),
            "color": LANG_COLORS.get(lang, "#8b8b8b"),
        }
        for lang, bytes_count in sorted(languages_raw.items(), key=lambda x: -x[1])[:8]
    ]

    # Commit activity
    activity = await fetch_commit_activity(owner, repo)
    weekly_activity = []
    if activity:
        for i, week in enumerate(activity[-8:]):
            weekly_activity.append({
                "week": f"W{i + 1}",
                "commits": week.get("total", 0),
            })

    # Contributors
    contributors_raw = await fetch_repo_contributors(owner, repo, per_page=5)
    contributors = [
        {
            "name": c["login"],
            "avatar": c["avatar_url"],
            "commits": c.get("contributions", 0),
        }
        for c in contributors_raw
    ]

    # AI Review
    ai_review = await generate_repo_review({
        "owner": owner,
        "name": repo,
        "description": repo_data.get("description") or "",
        "stars": repo_data.get("stargazers_count", 0),
        "forks": repo_data.get("forks_count", 0),
        "language": repo_data.get("language") or "",
        "license": (repo_data.get("license") or {}).get("spdx_id", "None"),
        "checks": checks,
    })

    return {
        "owner": owner,
        "name": repo_data["name"],
        "description": repo_data.get("description") or "",
        "stars": repo_data.get("stargazers_count", 0),
        "forks": repo_data.get("forks_count", 0),
        "watchers": repo_data.get("subscribers_count", 0),
        "language": repo_data.get("language") or "",
        "license": (repo_data.get("license") or {}).get("spdx_id", ""),
        "open_issues": repo_data.get("open_issues_count", 0),
        "html_url": repo_data.get("html_url", ""),
        "topics": repo_data.get("topics", []),
        "quality_score": quality_score,
        "checks": checks,
        "languages": languages,
        "commit_activity": weekly_activity,
        "contributors": contributors,
        "ai_review": ai_review.get("review", ""),
        "ai_suggestions": ai_review.get("suggestions", []),
    }

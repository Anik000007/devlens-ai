from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.services.ai_service import (
    generate_developer_summary,
    generate_resume_bullets,
    generate_repo_review,
    generate_compare_analysis,
)

router = APIRouter()


class SummaryRequest(BaseModel):
    username: str
    name: str
    bio: str = ""
    top_languages: list = []
    total_stars: int = 0
    followers: int = 0
    repos: int = 0
    created_at: str = ""


class ResumeRequest(BaseModel):
    username: str
    name: str = ""
    repos_data: list = []
    total_stars: int = 0
    top_languages: list = []


class RepoReviewRequest(BaseModel):
    owner: str
    name: str
    description: str = ""
    stars: int = 0
    forks: int = 0
    language: str = ""
    license: str = ""
    checks: list = []


class CompareAIRequest(BaseModel):
    developer_a: dict
    developer_b: dict


@router.post("/summary")
async def ai_summary(req: SummaryRequest):
    """Generate an AI-powered developer summary with role prediction and skills."""
    result = await generate_developer_summary(req.model_dump())
    return result


@router.post("/resume-points")
async def ai_resume_points(req: ResumeRequest):
    """Generate resume-ready bullet points from GitHub data."""
    bullets = await generate_resume_bullets(req.model_dump())
    return {"bullets": bullets}


@router.post("/repo-review")
async def ai_repo_review(req: RepoReviewRequest):
    """Generate an AI review of a repository."""
    result = await generate_repo_review(req.model_dump())
    return result


@router.post("/compare")
async def ai_compare(req: CompareAIRequest):
    """Generate an AI comparison analysis between two developers."""
    analysis = await generate_compare_analysis(req.developer_a, req.developer_b)
    return {"analysis": analysis}

"""
AI service using Google Gemini for generating developer insights.
Falls back to template-based responses if Gemini API key is not set or calls fail.
"""
import json
import logging
from typing import Dict, Any, List, Optional

from app.services.cache import cache_get, cache_set

logger = logging.getLogger(__name__)

_model = None
_ai_available: Optional[bool] = None


def _get_model():
    """Lazy-initialize the Gemini model."""
    global _model, _ai_available

    if _ai_available is False:
        return None
    if _model is not None:
        return _model

    try:
        from app.core.config import settings
        if not settings.GEMINI_API_KEY:
            logger.info("No GEMINI_API_KEY set — AI features will use template fallbacks")
            _ai_available = False
            return None

        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-2.0-flash")
        _ai_available = True
        logger.info("Gemini AI model initialized")
        return _model
    except Exception as e:
        logger.warning("Gemini AI unavailable — using template fallback: %s", e)
        _ai_available = False
        return None


def _parse_json_response(text: str) -> Optional[Dict]:
    """Try to extract JSON from a Gemini response (which may include markdown fences)."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last lines (``` markers)
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


# ---------------------------------------------------------------------------
# Template fallbacks (used when Gemini is unavailable)
# ---------------------------------------------------------------------------

def _template_summary(data: Dict) -> Dict:
    langs = ", ".join(data.get("top_languages", ["various languages"])[:3])
    name = data.get("name", data.get("username", "This developer"))
    followers = data.get("followers", 0)
    repos = data.get("repos", 0)
    stars = data.get("total_stars", 0)

    summary = (
        f"{name} is a skilled software developer with expertise in {langs}. "
        f"With {followers:,} followers and {repos} public repositories earning {stars:,} stars, "
        f"they demonstrate a strong commitment to open-source development and code quality. "
        f"Their GitHub profile reflects consistent contribution patterns and technical depth."
    )
    return {
        "summary": summary,
        "role_prediction": _guess_role(data),
        "strengths": _guess_strengths(data),
        "skills": _guess_skills(data),
    }


def _guess_role(data: Dict) -> str:
    langs = [l.lower() for l in data.get("top_languages", [])]
    if any(l in langs for l in ["c", "rust", "assembly"]):
        return "Systems Engineer"
    if any(l in langs for l in ["typescript", "javascript", "vue", "react"]):
        return "Full-Stack Engineer"
    if any(l in langs for l in ["python", "r", "jupyter notebook"]):
        return "Data / ML Engineer"
    if any(l in langs for l in ["go", "java", "kotlin"]):
        return "Backend Engineer"
    return "Software Engineer"


def _guess_strengths(data: Dict) -> List[str]:
    strengths = []
    langs = data.get("top_languages", [])
    if langs:
        strengths.append(f"Strong {langs[0]} expertise")
    if data.get("total_stars", 0) > 100:
        strengths.append("Impactful open-source contributor")
    if data.get("followers", 0) > 1000:
        strengths.append("Strong community following")
    if data.get("repos", 0) > 50:
        strengths.append("Prolific project creator")
    if len(langs) >= 4:
        strengths.append("Polyglot developer")
    if not strengths:
        strengths = ["Active developer", "Code quality focus"]
    return strengths[:5]


def _guess_skills(data: Dict) -> List[Dict]:
    langs = [l.lower() for l in data.get("top_languages", [])]
    stars = data.get("total_stars", 0)
    repos = data.get("repos", 0)

    skills = [
        {"skill": "Open Source", "value": min(95, 40 + min(stars, 10000) // 200)},
        {"skill": "Backend", "value": 60 if any(l in langs for l in ["python", "go", "java", "rust", "c"]) else 30},
        {"skill": "Frontend", "value": 70 if any(l in langs for l in ["javascript", "typescript", "vue", "html", "css"]) else 20},
        {"skill": "DevOps", "value": 50 if repos > 30 else 25},
        {"skill": "Systems", "value": 80 if any(l in langs for l in ["c", "c++", "rust", "assembly"]) else 25},
        {"skill": "Data/ML", "value": 70 if any(l in langs for l in ["python", "r", "jupyter notebook"]) else 15},
    ]
    return skills


def _template_resume_bullets(data: Dict) -> List[str]:
    bullets = []
    name = data.get("name", "Developer")
    stars = data.get("total_stars", 0)
    repos_list = data.get("repos_data", [])
    langs = data.get("top_languages", [])

    if stars > 1000:
        bullets.append(f"Maintained open-source repositories earning {stars:,}+ GitHub stars")
    if repos_list:
        top = max(repos_list, key=lambda r: r.get("stars", 0))
        desc = top.get("description", "a widely-used open-source project")
        bullets.append(f"Built '{top['name']}' — {desc}")
    if langs:
        bullets.append(f"Proficient in {', '.join(langs[:4])} with production-grade projects")
    bullets.append("Actively contributes to open-source community with consistent commit history")
    return bullets


def _template_repo_review(data: Dict) -> Dict:
    name = data.get("name", "this repository")
    checks = data.get("checks", [])
    pass_count = sum(1 for c in checks if c.get("status") == "pass")
    total = len(checks) or 1
    return {
        "review": f"{name} scores {pass_count}/{total} on quality checks. "
                  f"The repository shows {'strong' if pass_count / total > 0.7 else 'room for improvement in'} "
                  f"code quality and project maintenance practices.",
        "suggestions": [
            c["label"] for c in checks if c.get("status") in ("fail", "warn")
        ]
    }


def _template_compare(data_a: Dict, data_b: Dict) -> str:
    name_a = data_a.get("name", data_a.get("username", "Developer A"))
    name_b = data_b.get("name", data_b.get("username", "Developer B"))
    return (
        f"{name_a} and {name_b} bring complementary strengths to the table. "
        f"{name_a} has {data_a.get('total_stars', 0):,} stars across {data_a.get('repos', 0)} repos, "
        f"while {name_b} has {data_b.get('total_stars', 0):,} stars across {data_b.get('repos', 0)} repos. "
        f"Both demonstrate strong open-source commitment with consistent contribution patterns."
    )


# ---------------------------------------------------------------------------
# Public API — calls Gemini or falls back to templates
# ---------------------------------------------------------------------------

async def generate_developer_summary(profile_data: Dict) -> Dict:
    """Generate an AI-powered developer summary with role prediction and skills."""
    cache_key = f"ai:summary:{profile_data.get('username', '')}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    model = _get_model()
    if model is None:
        return _template_summary(profile_data)

    try:
        langs = ", ".join(profile_data.get("top_languages", [])[:5])
        prompt = f"""Analyze this GitHub developer profile and return a JSON response.

Developer: {profile_data.get('name', 'Unknown')} (@{profile_data.get('username', '')})
Bio: {profile_data.get('bio', 'N/A')}
Followers: {profile_data.get('followers', 0):,}
Public Repos: {profile_data.get('repos', 0)}
Total Stars: {profile_data.get('total_stars', 0):,}
Top Languages: {langs}
Account Created: {profile_data.get('created_at', 'N/A')}

Return ONLY valid JSON with this structure:
{{
  "summary": "A 3-4 sentence professional summary of this developer's profile and impact",
  "role_prediction": "Their most likely professional role (e.g. Senior Backend Engineer, Full-Stack Developer, ML Engineer)",
  "strengths": ["strength1", "strength2", "strength3", "strength4", "strength5"],
  "skills": [
    {{"skill": "Backend", "value": 0-100}},
    {{"skill": "Frontend", "value": 0-100}},
    {{"skill": "Systems", "value": 0-100}},
    {{"skill": "Open Source", "value": 0-100}},
    {{"skill": "DevOps", "value": 0-100}},
    {{"skill": "Data/ML", "value": 0-100}}
  ]
}}
"""
        response = model.generate_content(prompt)
        parsed = _parse_json_response(response.text)
        if parsed:
            await cache_set(cache_key, parsed, ttl=3600)
            return parsed
        # Couldn't parse — fall back
        return _template_summary(profile_data)
    except Exception as e:
        logger.warning("Gemini summary generation failed: %s", e)
        return _template_summary(profile_data)


async def generate_resume_bullets(profile_data: Dict) -> List[str]:
    """Generate resume-ready bullet points from GitHub data."""
    cache_key = f"ai:resume:{profile_data.get('username', '')}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    model = _get_model()
    if model is None:
        return _template_resume_bullets(profile_data)

    try:
        repos_info = ""
        for r in profile_data.get("repos_data", [])[:5]:
            repos_info += f"  - {r['name']}: {r.get('description', 'N/A')} ({r.get('stars', 0)} stars)\n"

        prompt = f"""Generate 4-5 resume bullet points for a software developer based on their GitHub activity.

Developer: {profile_data.get('name', 'Unknown')}
Total Stars: {profile_data.get('total_stars', 0):,}
Repos: {profile_data.get('repos', 0)}
Top Languages: {', '.join(profile_data.get('top_languages', [])[:5])}
Top Repositories:
{repos_info}

Return ONLY a JSON array of strings. Each bullet should be achievement-focused, quantified where possible, and suitable for a professional resume. Example format:
["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4"]
"""
        response = model.generate_content(prompt)
        parsed = _parse_json_response(response.text)
        if parsed and isinstance(parsed, list):
            await cache_set(cache_key, parsed, ttl=3600)
            return parsed
        return _template_resume_bullets(profile_data)
    except Exception as e:
        logger.warning("Gemini resume generation failed: %s", e)
        return _template_resume_bullets(profile_data)


async def generate_repo_review(repo_data: Dict) -> Dict:
    """Generate an AI review of a repository."""
    cache_key = f"ai:repo:{repo_data.get('owner', '')}:{repo_data.get('name', '')}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    model = _get_model()
    if model is None:
        return _template_repo_review(repo_data)

    try:
        checks_str = "\n".join(
            f"  - {c['label']}: {c['status']} ({c.get('detail', '')})"
            for c in repo_data.get("checks", [])
        )
        prompt = f"""Analyze this GitHub repository and provide a professional review.

Repository: {repo_data.get('owner', '')}/{repo_data.get('name', '')}
Description: {repo_data.get('description', 'N/A')}
Stars: {repo_data.get('stars', 0):,} | Forks: {repo_data.get('forks', 0):,}
Language: {repo_data.get('language', 'N/A')}
License: {repo_data.get('license', 'None')}
Quality Checks:
{checks_str}

Return ONLY valid JSON:
{{
  "review": "A 3-4 sentence professional review of this repository",
  "suggestions": ["improvement1", "improvement2", "improvement3"]
}}
"""
        response = model.generate_content(prompt)
        parsed = _parse_json_response(response.text)
        if parsed:
            await cache_set(cache_key, parsed, ttl=3600)
            return parsed
        return _template_repo_review(repo_data)
    except Exception as e:
        logger.warning("Gemini repo review failed: %s", e)
        return _template_repo_review(repo_data)


async def generate_compare_analysis(data_a: Dict, data_b: Dict) -> str:
    """Generate AI comparison analysis between two developers."""
    cache_key = f"ai:compare:{data_a.get('username', '')}:{data_b.get('username', '')}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    model = _get_model()
    if model is None:
        return _template_compare(data_a, data_b)

    try:
        prompt = f"""Compare these two GitHub developers in 4-5 sentences.

Developer A: {data_a.get('name', 'Unknown')} (@{data_a.get('username', '')})
  Stars: {data_a.get('total_stars', 0):,} | Repos: {data_a.get('repos', 0)} | Followers: {data_a.get('followers', 0):,}
  Languages: {', '.join(data_a.get('languages', [])[:3])}

Developer B: {data_b.get('name', 'Unknown')} (@{data_b.get('username', '')})
  Stars: {data_b.get('total_stars', 0):,} | Repos: {data_b.get('repos', 0)} | Followers: {data_b.get('followers', 0):,}
  Languages: {', '.join(data_b.get('languages', [])[:3])}

Write a professional, balanced comparison highlighting each developer's unique strengths. Return ONLY the comparison text as a plain string (no JSON).
"""
        response = model.generate_content(prompt)
        text = response.text.strip()
        await cache_set(cache_key, text, ttl=3600)
        return text
    except Exception as e:
        logger.warning("Gemini compare analysis failed: %s", e)
        return _template_compare(data_a, data_b)

"""
Developer-Project Matchmaker for DevLens AI.

Matches a developer's profile/skills with active, unassigned open-source issues
on GitHub. Uses Gemini for intelligent matching and falls back to a heuristic
language-overlap scorer when Gemini is unavailable.
"""

import json
import logging
from typing import Dict, Any, List, Optional

from app.services.cache import cache_get, cache_set
from ai_engine.github_issues import search_matching_issues

logger = logging.getLogger(__name__)

_model = None
_ai_available: Optional[bool] = None


def _get_model():
    """Lazy-initialize the Gemini model (shared logic with ai_service)."""
    global _model, _ai_available

    if _ai_available is False:
        return None
    if _model is not None:
        return _model

    try:
        from app.core.config import settings

        if not settings.GEMINI_API_KEY:
            logger.info(
                "No GEMINI_API_KEY — matchmaker will use heuristic fallback"
            )
            _ai_available = False
            return None

        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-2.0-flash")
        _ai_available = True
        return _model
    except Exception as e:
        logger.warning("Gemini unavailable for matchmaker: %s", e)
        _ai_available = False
        return None


def _parse_json_response(text: str) -> Optional[Dict]:
    """Extract JSON from a Gemini response (may include markdown fences)."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [line for line in lines if not line.strip().startswith("```")]
        text = "\n".join(lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


async def match_developer_to_projects(profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Match a developer profile to open-source issues.

    Args:
        profile: Dict with keys: username, name, top_languages, total_stars,
                 followers, repos, skills (optional list of {skill, value})

    Returns:
        Dict with 'matches' (list of issue matches) and 'summary' string.
    """
    username = profile.get("username", "")
    cache_key = f"ai:match:{username}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    languages = profile.get("top_languages", [])
    issues = await search_matching_issues(languages, max_results=15)

    if not issues:
        return {
            "matches": [],
            "summary": "No matching open-source issues found. Try again later when more issues are available.",
        }

    model = _get_model()
    if model is None:
        result = _heuristic_match(profile, issues)
        return result

    try:
        langs_str = ", ".join(languages[:5])
        skills_str = ""
        if profile.get("skills"):
            skills_str = "\n".join(
                f"  - {s['skill']}: {s['value']}/100"
                for s in profile["skills"]
            )

        issues_str = "\n".join(
            f"  {i+1}. [{issue['repo']}] \"{issue['issue_title']}\" "
            f"(labels: {', '.join(issue['labels'][:3])}, "
            f"language: {issue['language']})"
            for i, issue in enumerate(issues[:10])
        )

        prompt = f"""You are an expert open-source mentor. Match this developer to the most suitable open-source issues.

Developer Profile:
- Name: {profile.get('name', 'Unknown')} (@{username})
- Top Languages: {langs_str}
- Total Stars: {profile.get('total_stars', 0):,}
- Followers: {profile.get('followers', 0):,}
- Public Repos: {profile.get('repos', 0)}
{f"- Skills:{chr(10)}{skills_str}" if skills_str else ""}

Available Open Issues:
{issues_str}

For each issue, evaluate fit based on:
1. Language match with developer's skills
2. Issue complexity vs developer's experience level
3. Potential learning and impact value

Return ONLY valid JSON:
{{
  "matches": [
    {{
      "index": 1,
      "match_score": 85,
      "reason": "Short explanation of why this is a good fit"
    }}
  ],
  "summary": "A 2-3 sentence summary of the overall matching results"
}}

Rank by match_score (0-100). Include the top 5-8 best matches only.
"""
        response = model.generate_content(prompt)
        parsed = _parse_json_response(response.text)

        if parsed and "matches" in parsed:
            # Merge AI scores back with issue data
            enriched_matches = []
            for match in parsed["matches"]:
                idx = match.get("index", 1) - 1
                if 0 <= idx < len(issues):
                    issue = issues[idx]
                    enriched_matches.append({
                        **issue,
                        "match_score": match.get("match_score", 50),
                        "reason": match.get("reason", "Good language match."),
                    })

            result = {
                "matches": enriched_matches,
                "summary": parsed.get(
                    "summary",
                    f"Found {len(enriched_matches)} matching issues for @{username}.",
                ),
            }
            await cache_set(cache_key, result, ttl=1800)
            return result

        # Gemini returned something unparseable — fall back
        return _heuristic_match(profile, issues)

    except Exception as e:
        logger.warning("Gemini matchmaker failed: %s", e)
        return _heuristic_match(profile, issues)


def _heuristic_match(
    profile: Dict[str, Any], issues: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Template-based heuristic matcher. Scores issues by language overlap,
    label relevance, and recency.
    """
    languages = [lang.lower() for lang in profile.get("top_languages", [])]
    total_stars = profile.get("total_stars", 0)
    name = profile.get("name", profile.get("username", "Developer"))

    scored = []
    for issue in issues:
        score = 40  # base score

        # Language match bonus
        issue_lang = issue.get("language", "").lower()
        if issue_lang in languages:
            lang_idx = languages.index(issue_lang)
            score += max(30 - lang_idx * 8, 10)  # Primary lang gets +30

        # Good first issue label bonus
        labels_lower = [lbl.lower() for lbl in issue.get("labels", [])]
        if "good first issue" in labels_lower:
            score += 10
        if "help wanted" in labels_lower:
            score += 5
        if "documentation" in labels_lower or "docs" in labels_lower:
            score += 3

        # Low comment count = less competition
        comments = issue.get("comments", 0)
        if comments < 3:
            score += 8
        elif comments < 10:
            score += 3

        # Experience level adjustment
        if total_stars > 1000:
            # Experienced devs: prefer more complex issues
            if "bug" in labels_lower or "enhancement" in labels_lower:
                score += 5
        else:
            # Newer devs: prefer docs and easy issues
            if "documentation" in labels_lower or "docs" in labels_lower:
                score += 8

        score = min(score, 95)

        reason = _generate_match_reason(issue, languages, total_stars)
        scored.append({**issue, "match_score": score, "reason": reason})

    # Sort by score descending
    scored.sort(key=lambda x: x["match_score"], reverse=True)
    top_matches = scored[:8]

    return {
        "matches": top_matches,
        "summary": (
            f"Based on {name}'s expertise in {', '.join(profile.get('top_languages', ['various languages'])[:3])}, "
            f"we found {len(top_matches)} open-source issues that align with their skills. "
            f"These issues range from beginner-friendly contributions to impactful feature work."
        ),
    }


def _generate_match_reason(
    issue: Dict, languages: List[str], total_stars: int
) -> str:
    """Generate a human-readable reason for why this issue matches."""
    issue_lang = issue.get("language", "").lower()
    labels = [lbl.lower() for lbl in issue.get("labels", [])]
    repo = issue.get("repo", "")

    reasons = []

    if issue_lang in languages:
        idx = languages.index(issue_lang)
        if idx == 0:
            reasons.append(
                f"Directly matches your primary language ({issue_lang.title()})"
            )
        else:
            reasons.append(
                f"Uses {issue_lang.title()}, one of your known languages"
            )

    if "good first issue" in labels:
        reasons.append("marked as beginner-friendly by maintainers")

    if issue.get("comments", 0) < 3:
        reasons.append("low competition — few comments so far")

    if not reasons:
        reasons.append(f"Contributes to {repo}, a well-known open-source project")

    return ". ".join(reasons).capitalize() + "."

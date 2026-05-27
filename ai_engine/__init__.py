"""
DevLens AI Engine — Advanced AI features for developer intelligence.

Provides:
- Developer-Project Matchmaker: matches developer profiles to open-source issues
- Career Path Generator: personalized role transition roadmaps
"""

from ai_engine.matchmaker import match_developer_to_projects
from ai_engine.career import generate_career_path

__all__ = ["match_developer_to_projects", "generate_career_path"]

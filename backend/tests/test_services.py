"""Tests for service-layer functions (scoring, analytics, AI templates)."""

import pytest
from app.services.github_service import (
    calculate_language_stats,
    calculate_quality_score,
    calculate_consistency_score,
    calculate_collaboration_score,
    calculate_oss_score,
    build_commit_history,
    LANG_COLORS,
)
from app.services.ai_service import (
    _template_summary,
    _template_resume_bullets,
    _template_repo_review,
    _template_compare,
    _guess_role,
    _parse_json_response,
)


class TestLanguageStats:
    def test_basic_calculation(self, sample_repos):
        stats = calculate_language_stats(sample_repos)
        assert len(stats) == 2
        names = [s["name"] for s in stats]
        assert "Python" in names
        assert "TypeScript" in names
        assert all(0 <= s["percentage"] <= 100 for s in stats)
        assert stats[0]["percentage"] + stats[1]["percentage"] == 100

    def test_empty_repos(self):
        assert calculate_language_stats([]) == []

    def test_unknown_language_gets_default_color(self):
        repos = [{"language": "FakeLang123"}]
        stats = calculate_language_stats(repos)
        assert stats[0]["color"] == "#8b8b8b"

    def test_known_language_gets_color(self):
        repos = [{"language": "Python"}]
        stats = calculate_language_stats(repos)
        assert stats[0]["color"] == LANG_COLORS["Python"]


class TestQualityScore:
    def test_basic_score(self):
        repo = {
            "description": "A great project",
            "license": {"spdx_id": "MIT"},
            "homepage": "https://example.com",
            "has_wiki": True,
            "has_issues": True,
            "has_projects": True,
            "stargazers_count": 500,
            "forks_count": 50,
            "updated_at": "2024-12-01T00:00:00+00:00",
        }
        score = calculate_quality_score(repo)
        assert 30 < score <= 99

    def test_minimal_repo(self):
        repo = {
            "stargazers_count": 0,
            "forks_count": 0,
        }
        score = calculate_quality_score(repo)
        assert score == 30  # base score

    def test_with_file_checks(self):
        repo = {"stargazers_count": 100, "forks_count": 10}
        checks = {
            "has_readme": True,
            "readme_length": 1000,
            "has_ci": True,
            "has_tests": True,
            "has_contributing": True,
            "has_changelog": True,
        }
        score = calculate_quality_score(repo, checks)
        assert score > 50  # file checks add significant score

    def test_score_clamped_to_max(self):
        repo = {
            "description": "x",
            "license": {"spdx_id": "MIT"},
            "homepage": "x",
            "has_wiki": True,
            "has_issues": True,
            "has_projects": True,
            "stargazers_count": 100000,
            "forks_count": 50000,
            "updated_at": "2024-01-01T00:00:00+00:00",
        }
        score = calculate_quality_score(repo, {
            "has_readme": True, "readme_length": 2000, "has_ci": True,
            "has_tests": True, "has_contributing": True, "has_changelog": True,
        })
        assert score <= 99


class TestConsistencyScore:
    def test_all_recent(self, sample_repos):
        score = calculate_consistency_score(sample_repos)
        assert score > 50

    def test_empty_repos(self):
        assert calculate_consistency_score([]) == 0

    def test_no_pushed_date(self):
        repos = [{"name": "test"}]
        score = calculate_consistency_score(repos)
        assert score == 0


class TestCollaborationScore:
    def test_with_forks_and_issues(self, sample_repos):
        score = calculate_collaboration_score(sample_repos)
        assert 20 <= score <= 99

    def test_empty_repos(self):
        assert calculate_collaboration_score([]) == 0


class TestOSSScore:
    def test_calculation(self, sample_user, sample_repos):
        score = calculate_oss_score(sample_user, sample_repos)
        assert 10 <= score <= 99

    def test_empty_repos(self, sample_user):
        assert calculate_oss_score(sample_user, []) == 0

    def test_no_user_data(self):
        assert calculate_oss_score({}, []) == 0


class TestBuildCommitHistory:
    def test_empty_input(self):
        assert build_commit_history([]) == []
        assert build_commit_history(None) == []

    def test_returns_12_months(self):
        history = build_commit_history([
            {"week": 1700000000, "total": 10, "days": []}
        ])
        assert len(history) == 12
        assert all(isinstance(h["commits"], int) for h in history)

    def test_non_list_input(self):
        assert build_commit_history("invalid") == []


class TestAITemplates:
    def test_template_summary_has_all_keys(self):
        data = {
            "username": "testuser",
            "name": "Test User",
            "top_languages": ["Python", "TypeScript"],
            "followers": 100,
            "repos": 20,
            "total_stars": 500,
        }
        result = _template_summary(data)
        assert "summary" in result
        assert "role_prediction" in result
        assert "strengths" in result
        assert "skills" in result

    def test_template_summary_with_minimal_data(self):
        result = _template_summary({"username": "dev"})
        assert "summary" in result
        assert result["role_prediction"] in ("Software Engineer",)

    def test_guess_role(self):
        assert _guess_role({"top_languages": ["C", "Rust"]}) == "Systems Engineer"
        assert _guess_role({"top_languages": ["TypeScript", "Vue"]}) == "Full-Stack Engineer"
        assert _guess_role({"top_languages": ["Python", "R"]}) == "Data / ML Engineer"
        assert _guess_role({"top_languages": ["Go"]}) == "Backend Engineer"
        assert _guess_role({}) == "Software Engineer"

    def test_template_resume_bullets(self):
        data = {
            "name": "Test User",
            "total_stars": 5000,
            "repos_data": [
                {"name": "awesome", "description": "Great", "stars": 3000}
            ],
            "top_languages": ["Python", "Go"],
        }
        bullets = _template_resume_bullets(data)
        assert len(bullets) >= 2
        assert any("5,000" in b for b in bullets)

    def test_template_resume_with_no_data(self):
        bullets = _template_resume_bullets({"name": "Dev"})
        assert len(bullets) >= 1

    def test_template_repo_review(self):
        data = {
            "name": "my-repo",
            "checks": [
                {"label": "README", "status": "pass", "detail": "Found"},
                {"label": "CI/CD", "status": "fail", "detail": "Missing"},
                {"label": "License", "status": "pass", "detail": "MIT"},
            ],
        }
        result = _template_repo_review(data)
        assert "review" in result
        assert "suggestions" in result
        assert len(result["suggestions"]) == 1

    def test_template_compare(self):
        a = {"name": "DevA", "total_stars": 1000, "repos": 10}
        b = {"name": "DevB", "total_stars": 500, "repos": 5}
        text = _template_compare(a, b)
        assert "DevA" in text
        assert "DevB" in text
        assert "1,000" in text
        assert "500" in text


class TestParseJsonResponse:
    def test_plain_json(self):
        result = _parse_json_response('{"key": "value"}')
        assert result == {"key": "value"}

    def test_with_code_fence(self):
        result = _parse_json_response('```json\n{"key": "value"}\n```')
        assert result == {"key": "value"}

    def test_invalid_json(self):
        result = _parse_json_response("not json")
        assert result is None

    def test_empty_string(self):
        assert _parse_json_response("") is None

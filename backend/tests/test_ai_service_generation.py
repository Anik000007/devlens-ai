"""Tests for AI service generation paths (cache/model/fallback)."""

import pytest

from app.services import ai_service


class _FakeResponse:
    def __init__(self, text: str):
        self.text = text


class _FakeModel:
    def __init__(self, text: str = "", error: Exception | None = None):
        self._text = text
        self._error = error

    def generate_content(self, prompt: str):
        if self._error:
            raise self._error
        return _FakeResponse(self._text)


@pytest.mark.asyncio
async def test_generate_developer_summary_returns_cached_value(monkeypatch):
    cached_value = {"summary": "cached-summary"}

    async def fake_cache_get(_key):
        return cached_value

    monkeypatch.setattr(ai_service, "cache_get", fake_cache_get)
    result = await ai_service.generate_developer_summary({"username": "dev"})
    assert result == cached_value


@pytest.mark.asyncio
async def test_generate_developer_summary_uses_model_and_caches(monkeypatch):
    async def fake_cache_get(_key):
        return None

    cache_set_calls = {}

    async def fake_cache_set(key, value, ttl):
        cache_set_calls["key"] = key
        cache_set_calls["value"] = value
        cache_set_calls["ttl"] = ttl

    monkeypatch.setattr(ai_service, "cache_get", fake_cache_get)
    monkeypatch.setattr(ai_service, "cache_set", fake_cache_set)
    monkeypatch.setattr(
        ai_service,
        "_get_model",
        lambda: _FakeModel(
            '{"summary":"ok","role_prediction":"Engineer","strengths":["a"],"skills":[]}'
        ),
    )

    result = await ai_service.generate_developer_summary({"username": "dev"})
    assert result["summary"] == "ok"
    assert cache_set_calls["key"] == "ai:summary:dev"
    assert cache_set_calls["ttl"] == 3600


@pytest.mark.asyncio
async def test_generate_developer_summary_falls_back_on_invalid_json(monkeypatch):
    async def fake_cache_get(_key):
        return None

    monkeypatch.setattr(ai_service, "cache_get", fake_cache_get)
    monkeypatch.setattr(ai_service, "_get_model", lambda: _FakeModel("not valid json"))
    result = await ai_service.generate_developer_summary({"username": "dev", "name": "Dev"})
    assert "summary" in result
    assert result["role_prediction"]


@pytest.mark.asyncio
async def test_generate_resume_bullets_returns_cached_value(monkeypatch):
    cached_value = ["cached bullet"]

    async def fake_cache_get(_key):
        return cached_value

    monkeypatch.setattr(ai_service, "cache_get", fake_cache_get)
    result = await ai_service.generate_resume_bullets({"username": "dev"})
    assert result == cached_value


@pytest.mark.asyncio
async def test_generate_resume_bullets_uses_model_and_caches(monkeypatch):
    async def fake_cache_get(_key):
        return None

    cache_set_calls = {}

    async def fake_cache_set(key, value, ttl):
        cache_set_calls["key"] = key
        cache_set_calls["value"] = value
        cache_set_calls["ttl"] = ttl

    monkeypatch.setattr(ai_service, "cache_get", fake_cache_get)
    monkeypatch.setattr(ai_service, "cache_set", fake_cache_set)
    monkeypatch.setattr(ai_service, "_get_model", lambda: _FakeModel('["bullet 1","bullet 2"]'))
    result = await ai_service.generate_resume_bullets({"username": "dev", "repos_data": []})
    assert result == ["bullet 1", "bullet 2"]
    assert cache_set_calls["key"] == "ai:resume:dev"
    assert cache_set_calls["ttl"] == 3600


@pytest.mark.asyncio
async def test_generate_resume_bullets_falls_back_on_model_error(monkeypatch):
    async def fake_cache_get(_key):
        return None

    monkeypatch.setattr(ai_service, "cache_get", fake_cache_get)
    monkeypatch.setattr(ai_service, "_get_model", lambda: _FakeModel(error=RuntimeError("boom")))
    result = await ai_service.generate_resume_bullets({"username": "dev"})
    assert isinstance(result, list)
    assert len(result) >= 1


@pytest.mark.asyncio
async def test_generate_repo_review_returns_cached_value(monkeypatch):
    cached_value = {"review": "cached", "suggestions": []}

    async def fake_cache_get(_key):
        return cached_value

    monkeypatch.setattr(ai_service, "cache_get", fake_cache_get)
    result = await ai_service.generate_repo_review({"owner": "o", "name": "r"})
    assert result == cached_value


@pytest.mark.asyncio
async def test_generate_repo_review_falls_back_when_parse_fails(monkeypatch):
    async def fake_cache_get(_key):
        return None

    monkeypatch.setattr(ai_service, "cache_get", fake_cache_get)
    monkeypatch.setattr(ai_service, "_get_model", lambda: _FakeModel("invalid json"))
    result = await ai_service.generate_repo_review(
        {"owner": "o", "name": "r", "checks": [{"label": "CI", "status": "fail"}]}
    )
    assert "review" in result
    assert result["suggestions"] == ["CI"]


@pytest.mark.asyncio
async def test_generate_compare_analysis_uses_model_and_caches(monkeypatch):
    async def fake_cache_get(_key):
        return None

    cache_set_calls = {}

    async def fake_cache_set(key, value, ttl):
        cache_set_calls["key"] = key
        cache_set_calls["value"] = value
        cache_set_calls["ttl"] = ttl

    monkeypatch.setattr(ai_service, "cache_get", fake_cache_get)
    monkeypatch.setattr(ai_service, "cache_set", fake_cache_set)
    monkeypatch.setattr(ai_service, "_get_model", lambda: _FakeModel("A balanced comparison"))

    result = await ai_service.generate_compare_analysis(
        {"username": "a", "name": "A"},
        {"username": "b", "name": "B"},
    )
    assert result == "A balanced comparison"
    assert cache_set_calls["key"] == "ai:compare:a:b"
    assert cache_set_calls["ttl"] == 3600


@pytest.mark.asyncio
async def test_generate_compare_analysis_falls_back_on_model_error(monkeypatch):
    async def fake_cache_get(_key):
        return None

    monkeypatch.setattr(ai_service, "cache_get", fake_cache_get)
    monkeypatch.setattr(ai_service, "_get_model", lambda: _FakeModel(error=RuntimeError("boom")))

    result = await ai_service.generate_compare_analysis(
        {"username": "a", "name": "Alpha"},
        {"username": "b", "name": "Beta"},
    )
    assert "Alpha" in result
    assert "Beta" in result

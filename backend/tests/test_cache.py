"""Tests for the Redis caching layer with graceful degradation."""

import json
import pytest
from app.services import cache as cache_module
from app.services.cache import cache_get, cache_set, cache_delete


class TestCacheWhenRedisUnavailable:
    """Redis is configured to use an unreachable URL — operations should silently fail."""

    @pytest.mark.asyncio
    async def test_cache_get_returns_none(self):
        result = await cache_get("some-key")
        assert result is None

    @pytest.mark.asyncio
    async def test_cache_set_does_not_raise(self):
        await cache_set("some-key", {"data": 123})
        # Should not raise any exception

    @pytest.mark.asyncio
    async def test_cache_delete_does_not_raise(self):
        await cache_delete("some-key")
        # Should not raise any exception

    @pytest.mark.asyncio
    async def test_multiple_operations(self):
        """Multiple cache operations in sequence should all gracefully degrade."""
        await cache_set("key1", "value1")
        await cache_set("key2", "value2")
        r1 = await cache_get("key1")
        r2 = await cache_get("key2")
        assert r1 is None
        assert r2 is None
        await cache_delete("key1")
        await cache_delete("key2")


class TestCacheWhenRedisAvailable:
    @pytest.mark.asyncio
    async def test_cache_get_returns_parsed_json(self, monkeypatch):
        class FakeRedis:
            async def get(self, key):
                return json.dumps({"key": key, "ok": True})

        async def fake_get_redis():
            return FakeRedis()

        monkeypatch.setattr(cache_module, "_get_redis", fake_get_redis)
        result = await cache_get("alpha")
        assert result == {"key": "alpha", "ok": True}

    @pytest.mark.asyncio
    async def test_cache_set_uses_given_ttl(self, monkeypatch):
        calls = {}

        class FakeRedis:
            async def setex(self, key, ttl, value):
                calls["key"] = key
                calls["ttl"] = ttl
                calls["value"] = value

        async def fake_get_redis():
            return FakeRedis()

        monkeypatch.setattr(cache_module, "_get_redis", fake_get_redis)
        await cache_set("beta", {"n": 1}, ttl=42)
        assert calls["key"] == "beta"
        assert calls["ttl"] == 42
        assert json.loads(calls["value"]) == {"n": 1}

    @pytest.mark.asyncio
    async def test_cache_delete_calls_redis_delete(self, monkeypatch):
        calls = {"keys": []}

        class FakeRedis:
            async def delete(self, key):
                calls["keys"].append(key)

        async def fake_get_redis():
            return FakeRedis()

        monkeypatch.setattr(cache_module, "_get_redis", fake_get_redis)
        await cache_delete("gamma")
        assert calls["keys"] == ["gamma"]

    @pytest.mark.asyncio
    async def test_cache_get_returns_none_on_redis_exception(self, monkeypatch):
        class FakeRedis:
            async def get(self, key):
                raise RuntimeError("redis get failed")

        async def fake_get_redis():
            return FakeRedis()

        monkeypatch.setattr(cache_module, "_get_redis", fake_get_redis)
        assert await cache_get("broken") is None

    @pytest.mark.asyncio
    async def test_cache_set_swallows_redis_exception(self, monkeypatch):
        class FakeRedis:
            async def setex(self, key, ttl, value):
                raise RuntimeError("redis set failed")

        async def fake_get_redis():
            return FakeRedis()

        monkeypatch.setattr(cache_module, "_get_redis", fake_get_redis)
        await cache_set("broken", {"x": 1}, ttl=30)

    @pytest.mark.asyncio
    async def test_cache_delete_swallows_redis_exception(self, monkeypatch):
        class FakeRedis:
            async def delete(self, key):
                raise RuntimeError("redis delete failed")

        async def fake_get_redis():
            return FakeRedis()

        monkeypatch.setattr(cache_module, "_get_redis", fake_get_redis)
        await cache_delete("broken")

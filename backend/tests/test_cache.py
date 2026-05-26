"""Tests for the Redis caching layer with graceful degradation."""

from unittest.mock import patch, AsyncMock
import pytest
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

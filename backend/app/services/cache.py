"""
Redis caching layer for DevLens AI.
Gracefully degrades if Redis is unavailable — the app works without it,
just without caching (every request hits GitHub API fresh).
"""
import json
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)

# Lazy-initialized Redis connection
_redis = None
_redis_available: Optional[bool] = None


async def _get_redis():
    """Get or create a Redis connection. Returns None if Redis is unavailable."""
    global _redis, _redis_available

    if _redis_available is False:
        return None

    if _redis is not None:
        return _redis

    try:
        import redis.asyncio as aioredis
        from app.core.config import settings

        _redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        # Test the connection
        await _redis.ping()
        _redis_available = True
        logger.info("Redis connected at %s", settings.REDIS_URL)
        return _redis
    except Exception as e:
        _redis_available = False
        _redis = None
        logger.warning("Redis unavailable — caching disabled: %s", e)
        return None


async def cache_get(key: str) -> Optional[Any]:
    """Get a value from cache. Returns None on miss or if Redis is down."""
    r = await _get_redis()
    if r is None:
        return None
    try:
        raw = await r.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as e:
        logger.warning("Cache GET failed for key=%s: %s", key, e)
        return None


async def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> None:
    """Set a value in cache with optional TTL (seconds)."""
    r = await _get_redis()
    if r is None:
        return
    try:
        from app.core.config import settings
        ttl = ttl or settings.CACHE_TTL
        await r.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.warning("Cache SET failed for key=%s: %s", key, e)


async def cache_delete(key: str) -> None:
    """Delete a key from cache."""
    r = await _get_redis()
    if r is None:
        return
    try:
        await r.delete(key)
    except Exception:
        pass

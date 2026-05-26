"""
Simple in-memory rate limiter for DevLens AI API.
Tracks requests per IP with sliding window.
"""
import time
import logging
from collections import defaultdict
from typing import Dict, List

logger = logging.getLogger(__name__)

# Default: 60 requests per minute per IP
DEFAULT_MAX_REQUESTS = 60
DEFAULT_WINDOW_SECONDS = 60

_request_log: Dict[str, List[float]] = defaultdict(list)


def reset_rate_limits() -> None:
    """Clear all rate limit tracking. Useful for tests."""
    _request_log.clear()


def check_rate_limit(
    ip: str,
    max_requests: int = DEFAULT_MAX_REQUESTS,
    window: int = DEFAULT_WINDOW_SECONDS,
) -> tuple[bool, int]:
    """
    Check if a request from this IP is within the rate limit.
    Returns (is_allowed, retry_after_seconds).
    """
    now = time.time()
    timestamps = _request_log[ip]

    # Remove timestamps outside the window
    cutoff = now - window
    _request_log[ip] = [t for t in timestamps if t > cutoff]

    if len(_request_log[ip]) >= max_requests:
        oldest = _request_log[ip][0]
        retry_after = int(window - (now - oldest))
        logger.warning("Rate limit exceeded for %s", ip)
        return False, max(retry_after, 1)

    _request_log[ip].append(now)
    remaining = max_requests - len(_request_log[ip])
    return True, remaining


def get_rate_limit_headers(ip: str) -> dict:
    """Get rate limit info for response headers."""
    now = time.time()
    timestamps = _request_log.get(ip, [])
    cutoff = now - DEFAULT_WINDOW_SECONDS
    active = len([t for t in timestamps if t > cutoff])
    remaining = max(0, DEFAULT_MAX_REQUESTS - active)
    return {
        "X-RateLimit-Limit": str(DEFAULT_MAX_REQUESTS),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": str(int(time.time()) + DEFAULT_WINDOW_SECONDS),
    }

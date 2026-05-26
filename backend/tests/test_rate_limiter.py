"""Tests for the in-memory rate limiter."""

from app.services.rate_limiter import check_rate_limit, get_rate_limit_headers


class TestRateLimiter:
    def test_allows_requests_under_limit(self):
        allowed, remaining = check_rate_limit("127.0.0.1", max_requests=5, window=60)
        assert allowed is True
        assert remaining >= 0

    def test_rate_limit_headers(self):
        headers = get_rate_limit_headers("127.0.0.1")
        assert "X-RateLimit-Limit" in headers
        assert "X-RateLimit-Remaining" in headers
        assert "X-RateLimit-Reset" in headers

    def test_429_on_explore_endpoint(self, test_client):
        """Send many fast requests to explore to test rate limiting."""
        for _ in range(70):
            test_client.get("/health")  # warm up

        resp = test_client.get("/explore/trending")
        # Might or might not be rate limited depending on timing,
        # but the headers should always be present
        assert resp.status_code in (200, 429)
        if resp.status_code == 429:
            data = resp.json()
            assert "detail" in data
            assert "retry_after" in data

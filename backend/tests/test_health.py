"""Tests for the health check endpoint."""


def test_health_check(test_client):
    """GET /health returns ok status and version."""
    resp = test_client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
    assert data["service"] == "DevLens AI API"
    assert "github_rate_limit" in data
    assert data["client_ip"] is not None


def test_docs_available(test_client):
    """Swagger docs are accessible."""
    resp = test_client.get("/docs")
    assert resp.status_code == 200


def test_openapi_schema(test_client):
    """OpenAPI schema is valid and lists all routes."""
    resp = test_client.get("/openapi.json")
    assert resp.status_code == 200
    schema = resp.json()
    assert schema["info"]["title"] == "DevLens AI API"
    paths = schema["paths"]
    assert "/health" in paths
    assert "/user/{username}" in paths
    assert "/user/{username}/analytics" in paths
    assert "/explore/trending" in paths
    assert "/explore/search" in paths
    assert "/compare" in paths
    assert "/ai/summary" in paths
    assert "/repo/{owner}/{repo}" in paths

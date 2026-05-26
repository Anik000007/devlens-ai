"""Tests for all API router endpoints."""


class TestUserRoutes:
    def test_get_user_found(self, test_client):
        resp = test_client.get("/user/testuser")
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "testuser"
        assert data["name"] == "Test User"
        assert data["followers"] == 1500

    def test_get_user_not_found(self, test_client, mock_httpx_client):
        from httpx import Response
        from unittest.mock import MagicMock

        async def not_found(url, **kwargs):
            resp = MagicMock(spec=Response)
            resp.status_code = 404
            resp.json.return_value = {"message": "Not Found"}
            resp.headers = {"X-RateLimit-Remaining": "5000"}
            resp.raise_for_status.side_effect = Exception("404")
            return resp

        mock_httpx_client.return_value.__aenter__.return_value.get = not_found
        resp = test_client.get("/user/nonexistent")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_get_user_repos(self, test_client):
        resp = test_client.get("/user/testuser/repos")
        assert resp.status_code == 200
        repos = resp.json()
        assert len(repos) == 2
        assert repos[0]["name"] == "awesome-project"
        assert repos[0]["stars"] == 2500
        assert repos[0]["quality_score"] > 0

    def test_get_user_analytics(self, test_client):
        resp = test_client.get("/user/testuser/analytics")
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "testuser"
        assert data["total_stars"] == 3300
        assert data["repo_count"] == 2
        assert len(data["language_stats"]) > 0
        assert len(data["top_repos"]) <= 6
        assert 0 <= data["consistency_score"] <= 100

    def test_get_user_analytics_not_found(self, test_client, mock_httpx_client):
        from httpx import Response
        from unittest.mock import MagicMock

        async def not_found(url, **kwargs):
            resp = MagicMock(spec=Response)
            resp.status_code = 404
            resp.json.return_value = {"message": "Not Found"}
            resp.headers = {"X-RateLimit-Remaining": "5000"}
            resp.raise_for_status.side_effect = Exception("404")
            return resp

        mock_httpx_client.return_value.__aenter__.return_value.get = not_found
        resp = test_client.get("/user/nonexistent/analytics")
        assert resp.status_code == 404

    def test_get_user_activity(self, test_client):
        resp = test_client.get("/user/testuser/activity")
        assert resp.status_code == 200
        data = resp.json()
        assert "events" in data


class TestExploreRoutes:
    def test_get_trending(self, test_client):
        resp = test_client.get("/explore/trending")
        assert resp.status_code == 200
        data = resp.json()
        assert "developers" in data
        assert "total" in data
        assert len(data["developers"]) > 0
        dev = data["developers"][0]
        assert dev["username"] == "testuser"
        assert dev["score"] > 0

    def test_search_with_query(self, test_client):
        resp = test_client.get("/explore/search?q=testuser")
        assert resp.status_code == 200
        data = resp.json()
        assert "developers" in data

    def test_search_empty_query(self, test_client):
        resp = test_client.get("/explore/search?q=")
        assert resp.status_code == 200
        data = resp.json()
        assert data["developers"] == []
        assert data["total"] == 0

    def test_search_short_query(self, test_client):
        resp = test_client.get("/explore/search?q=x")
        assert resp.status_code == 200
        data = resp.json()
        assert data["developers"] == []


class TestCompareRoutes:
    def test_compare_two_users(self, test_client):
        resp = test_client.post("/compare", json={
            "username_a": "testuser",
            "username_b": "testuser",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "developer_a" in data
        assert "developer_b" in data
        assert data["developer_a"]["username"] == "testuser"
        assert data["developer_b"]["username"] == "testuser"
        assert "ai_analysis" in data

    def test_compare_missing_user(self, test_client, mock_httpx_client):
        from httpx import Response
        from unittest.mock import MagicMock

        async def not_found(url, **kwargs):
            resp = MagicMock(spec=Response)
            resp.status_code = 404
            resp.json.return_value = {"message": "Not Found"}
            resp.headers = {"X-RateLimit-Remaining": "5000"}
            resp.raise_for_status.side_effect = Exception("404")
            return resp

        mock_httpx_client.return_value.__aenter__.return_value.get = not_found
        resp = test_client.post("/compare", json={
            "username_a": "nonexistent",
            "username_b": "alsononexistent",
        })
        assert resp.status_code == 404


class TestAIRoutes:
    def test_ai_summary(self, test_client):
        resp = test_client.post("/ai/summary", json={
            "username": "testuser",
            "name": "Test User",
            "bio": "A developer",
            "top_languages": ["Python", "TypeScript"],
            "total_stars": 3300,
            "followers": 1500,
            "repos": 30,
            "created_at": "2020-01-15T00:00:00Z",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "summary" in data
        assert "role_prediction" in data
        assert "strengths" in data
        assert "skills" in data

    def test_ai_resume_points(self, test_client):
        resp = test_client.post("/ai/resume-points", json={
            "username": "testuser",
            "name": "Test User",
            "repos_data": [
                {"name": "awesome-project", "description": "Great project", "stars": 2500}
            ],
            "total_stars": 3300,
            "top_languages": ["Python", "TypeScript"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "bullets" in data
        assert len(data["bullets"]) > 0

    def test_ai_repo_review(self, test_client):
        resp = test_client.post("/ai/repo-review", json={
            "owner": "testuser",
            "name": "awesome-project",
            "description": "A test project",
            "stars": 2500,
            "forks": 500,
            "language": "Python",
            "license": "MIT",
            "checks": [
                {"label": "README", "status": "pass", "detail": "README found"},
                {"label": "CI/CD", "status": "fail", "detail": "No CI"},
            ],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "review" in data
        assert "suggestions" in data

    def test_ai_compare(self, test_client):
        resp = test_client.post("/ai/compare", json={
            "developer_a": {"username": "user1", "name": "User 1", "languages": ["Python"]},
            "developer_b": {"username": "user2", "name": "User 2", "languages": ["Go"]},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "analysis" in data


class TestRepoRoutes:
    def test_repo_analysis_found(self, test_client):
        resp = test_client.get("/repo/testuser/awesome-project")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "awesome-project"
        assert data["owner"] == "testuser"
        assert data["quality_score"] > 0
        assert len(data["languages"]) > 0

    def test_repo_analysis_not_found(self, test_client, mock_httpx_client):
        from httpx import Response
        from unittest.mock import MagicMock

        async def not_found(url, **kwargs):
            resp = MagicMock(spec=Response)
            if "contents" in url or "readme" in url:
                resp.status_code = 404
            elif "repos/testuser/unknown" in url:
                resp.status_code = 404
            else:
                resp.status_code = 200
            resp.json.return_value = {"message": "Not Found"}
            resp.headers = {"X-RateLimit-Remaining": "5000"}
            if resp.status_code != 200:
                resp.raise_for_status.side_effect = Exception("404")
            else:
                resp.raise_for_status = MagicMock()
            return resp

        mock_httpx_client.return_value.__aenter__.return_value.get = not_found
        resp = test_client.get("/repo/testuser/unknown")
        assert resp.status_code == 404

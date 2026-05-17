import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GITHUB_TOKEN: str = ""
    DATABASE_URL: str = "postgresql://devlens:devlens_password@localhost:5432/devlens"
    REDIS_URL: str = "redis://localhost:6379"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    CACHE_TTL: int = 1800  # 30 minutes

    class Config:
        env_file = ".env"

settings = Settings()

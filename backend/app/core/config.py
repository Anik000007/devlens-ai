from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    GITHUB_TOKEN: str = ""
    DATABASE_URL: str = "postgresql://devlens:devlens_password@localhost:5432/devlens"
    REDIS_URL: str = "redis://localhost:6379"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    CACHE_TTL: int = 1800
    LOG_LEVEL: str = "INFO"


settings = Settings()

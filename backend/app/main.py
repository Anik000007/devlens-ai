import logging
import sys
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from typing import Union

from app.core.config import settings
from app.routers import users, explore, compare, ai, repos
from app.services.rate_limiter import check_rate_limit, get_rate_limit_headers

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="DevLens AI API",
    description="AI-powered GitHub Contributor Intelligence Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://devlens.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    allowed, retry_after = check_rate_limit(client_ip)
    if not allowed:
        logger.warning("Rate limited %s on %s", client_ip, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Rate limit exceeded. Please try again later.",
                "retry_after": retry_after,
            },
            headers={"Retry-After": str(retry_after)},
        )
    response = await call_next(request)
    rate_headers = get_rate_limit_headers(client_ip)
    for key, value in rate_headers.items():
        response.headers[key] = value
    return response


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Status: {response.status_code}")
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation Error",
            "errors": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
        },
    )


app.include_router(users.router, prefix="/user", tags=["Users"])
app.include_router(explore.router, prefix="/explore", tags=["Explore"])
app.include_router(compare.router, prefix="/compare", tags=["Compare"])
app.include_router(ai.router, prefix="/ai", tags=["AI"])
app.include_router(repos.router, prefix="/repo", tags=["Repository"])


@app.get("/health", tags=["Health"])
def health_check(request: Request):
    from app.services.github_service import get_rate_limit_info
    gh_rate = get_rate_limit_info()
    return {
        "status": "ok",
        "version": "1.0.0",
        "service": "DevLens AI API",
        "github_rate_limit": gh_rate,
        "client_ip": request.client.host if request.client else "unknown",
    }

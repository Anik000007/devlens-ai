from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, explore, compare, ai, repos

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

app.include_router(users.router, prefix="/user", tags=["Users"])
app.include_router(explore.router, prefix="/explore", tags=["Explore"])
app.include_router(compare.router, prefix="/compare", tags=["Compare"])
app.include_router(ai.router, prefix="/ai", tags=["AI"])
app.include_router(repos.router, prefix="/repo", tags=["Repository"])

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "1.0.0", "service": "DevLens AI API"}

#!/usr/bin/env bash
# DevLens AI — one-shot dev setup.
# Installs backend deps in a venv, frontend deps via npm, and seeds .env from .env.example.
# Works on macOS, Linux, and Windows (Git Bash / WSL).

set -euo pipefail

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

log() { printf "${GREEN}▸${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}!${NC} %s\n" "$*"; }
err() { printf "${RED}✖${NC} %s\n" "$*" >&2; }

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# ── Backend ────────────────────────────────────────────────
log "Setting up backend Python environment"
cd "$REPO_ROOT/backend"

if [ ! -d "venv" ]; then
  python -m venv venv || python3 -m venv venv
  log "Created venv at backend/venv"
else
  log "venv already exists — skipping creation"
fi

# Cross-platform activation: Windows uses Scripts/, Unix uses bin/
if [ -f "venv/Scripts/activate" ]; then
  source venv/Scripts/activate
elif [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
else
  err "Could not find venv activation script"
  exit 1
fi

log "Installing backend requirements"
pip install --upgrade pip > /dev/null
pip install -r requirements.txt

# ── Frontend ───────────────────────────────────────────────
log "Installing frontend dependencies"
cd "$REPO_ROOT/frontend"
npm ci || npm install

# ── Env files ──────────────────────────────────────────────
log "Seeding env files"
if [ -f "$REPO_ROOT/.env.example" ] && [ ! -f "$REPO_ROOT/backend/.env" ]; then
  cp "$REPO_ROOT/.env.example" "$REPO_ROOT/backend/.env"
  warn "Created backend/.env from .env.example — set GITHUB_TOKEN and GEMINI_API_KEY"
else
  log "backend/.env already exists — leaving untouched"
fi

if [ ! -f "$REPO_ROOT/frontend/.env.local" ]; then
  printf "NEXT_PUBLIC_API_URL=http://localhost:8000\n" > "$REPO_ROOT/frontend/.env.local"
  log "Created frontend/.env.local"
else
  log "frontend/.env.local already exists — leaving untouched"
fi

# ── Summary ────────────────────────────────────────────────
cat <<EOF

${GREEN}✓ Setup complete.${NC}

Next steps:
  1. Edit backend/.env and set GITHUB_TOKEN + GEMINI_API_KEY.
  2. (Optional) Start Redis: docker run -p 6379:6379 redis:7-alpine
  3. Start the backend:
       cd backend && source venv/Scripts/activate   # (or venv/bin/activate)
       uvicorn app.main:app --reload --port 8000
  4. Start the frontend in a separate terminal:
       cd frontend && npm run dev
  5. (Optional) Warm the cache: ./scripts/seed-data.sh

EOF

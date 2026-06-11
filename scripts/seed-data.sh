#!/usr/bin/env bash
# DevLens AI — Cache warmer.
# Hits the trending feed and a handful of curated user/repo endpoints so the
# Redis cache (or in-memory state) is primed for a demo.

set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8000}"
USERS=("torvalds" "gaearon" "sindresorhus" "yyx990803" "antfu" "tj")
REPOS=("torvalds/linux" "facebook/react" "vuejs/vue" "tiangolo/fastapi")

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

log() { printf "${GREEN}▸${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}!${NC} %s\n" "$*"; }

if ! command -v curl >/dev/null 2>&1; then
  printf "${RED}✖${NC} curl is required\n" >&2
  exit 1
fi

# ── Health check ───────────────────────────────────────────
log "Pinging $API_BASE/health"
if ! curl -fsS "$API_BASE/health" >/dev/null; then
  warn "Backend at $API_BASE is unreachable. Start it with: cd backend && uvicorn app.main:app --port 8000"
  exit 1
fi

# ── Trending ───────────────────────────────────────────────
log "Warming trending feed"
curl -fsS "$API_BASE/explore/trending" >/dev/null && log "  → /explore/trending ok"

# ── User profiles + analytics ──────────────────────────────
for u in "${USERS[@]}"; do
  log "Warming user: $u"
  curl -fsS "$API_BASE/user/$u" >/dev/null && log "  → /user/$u ok" || warn "  → /user/$u failed (continuing)"
  curl -fsS "$API_BASE/user/$u/analytics" >/dev/null && log "  → /user/$u/analytics ok" || warn "  → /user/$u/analytics failed"
done

# ── Repos ──────────────────────────────────────────────────
for r in "${REPOS[@]}"; do
  log "Warming repo: $r"
  curl -fsS "$API_BASE/repo/$r" >/dev/null && log "  → /repo/$r ok" || warn "  → /repo/$r failed"
done

cat <<EOF

${GREEN}✓ Cache warmed.${NC} Subsequent profile/repo loads should be instant.

Tip: set GITHUB_TOKEN in backend/.env first — without it you'll likely hit the
60 req/hour anonymous limit before this script finishes.

EOF

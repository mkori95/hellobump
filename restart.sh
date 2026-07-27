#!/usr/bin/env bash
# restart.sh — Clean restart for the HelloBump dev server
# Usage: ./restart.sh [--hard]
#   (no flag)  kills port 3000, clears .next, starts dev server
#   --hard     also clears node_modules/.cache (rarely needed)

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "Stopping any running Next.js dev servers..."
if lsof -ti :3000 &>/dev/null; then
  lsof -ti :3000 | xargs kill -9 2>/dev/null || true
  echo "  Killed process on port 3000."
else
  echo "  No process on port 3000."
fi

echo "Clearing .next cache..."
rm -rf .next
echo "  Done."

if [[ "${1:-}" == "--hard" ]]; then
  echo "Clearing node_modules/.cache (hard reset)..."
  rm -rf node_modules/.cache
  echo "  Done."
fi

echo ""
echo "Starting Next.js dev server..."
echo "Open http://localhost:3000 once you see 'Ready'"
echo ""
npx next dev

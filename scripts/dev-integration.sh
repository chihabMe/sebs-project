#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

BACKEND_PID=""
FRONTEND_PID=""
ADMIN_PID=""

cleanup() {
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  if [ -n "$ADMIN_PID" ]; then
    kill "$ADMIN_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

echo "Starting Firestore emulator (docker compose)..."
docker compose -f docker-compose.dev.yml up -d firestore-dev

echo "Waiting for Firestore emulator readiness..."
for i in {1..30}; do
  if curl -fsS http://localhost:8085/ >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS http://localhost:8085/ >/dev/null 2>&1; then
  echo "Firestore emulator did not become ready in time."
  exit 1
fi

echo "Seeding Firestore data..."
FIRESTORE_PROJECT_ID=eventify-dev FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 pnpm --filter @sebs/backend db:seed

echo "Building backend..."
pnpm --filter @sebs/backend build

echo "Starting backend for smoke run..."
PORT=4000 FIRESTORE_PROJECT_ID=eventify-dev FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 pnpm --filter @sebs/backend start > /tmp/sebs-backend-smoke.log 2>&1 &
BACKEND_PID=$!

echo "Waiting for backend health..."
for i in {1..30}; do
  if curl -fsS http://localhost:4000/api/events >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Running API smoke checks..."
bash scripts/smoke-api.sh
bash scripts/smoke-admin.sh

echo "Building frontend and admin..."
pnpm --filter @sebs/frontend build
pnpm --filter @sebs/admin build

echo "Starting frontend preview for smoke run..."
pnpm --filter @sebs/frontend preview -- --host 0.0.0.0 --port 4173 > /tmp/sebs-frontend-preview.log 2>&1 &
FRONTEND_PID=$!

echo "Starting admin preview for smoke run..."
pnpm --filter @sebs/admin preview -- --host 0.0.0.0 --port 4174 > /tmp/sebs-admin-preview.log 2>&1 &
ADMIN_PID=$!

echo "Waiting for frontend preview..."
for i in {1..30}; do
  if curl -fsS http://localhost:4173/ >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Waiting for admin preview..."
for i in {1..30}; do
  if curl -fsS http://localhost:4174/ >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Checking web app entrypoints..."
curl -fsS http://localhost:4173/ | grep -q "<title>"
curl -fsS http://localhost:4174/login | grep -q "SEBS Admin"

echo "Integration bootstrap is healthy."
echo "You can now run full dev mode with: pnpm dev"

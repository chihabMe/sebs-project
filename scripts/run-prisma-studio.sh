#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEFAULT_SCHEMA="apps/backend/prisma/schema.prisma"
SCHEMA_PATH="${PRISMA_SCHEMA_PATH:-$DEFAULT_SCHEMA}"
PORT="${PRISMA_STUDIO_PORT:-5555}"

if [[ ! -f "$SCHEMA_PATH" ]]; then
  GENERATED_SCHEMA="$(find node_modules -type f -path '*/.prisma/client/schema.prisma' 2>/dev/null | head -n 1 || true)"
  if [[ -n "$GENERATED_SCHEMA" ]]; then
    SCHEMA_PATH="$GENERATED_SCHEMA"
  fi
fi

if [[ ! -f "$SCHEMA_PATH" ]]; then
  echo "No Prisma schema found."
  echo "Expected: $DEFAULT_SCHEMA"
  echo "Tip: set PRISMA_SCHEMA_PATH=/absolute/or/relative/path/to/schema.prisma"
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set."
  echo "Prisma Studio needs a SQL database URL matching your schema datasource."
  echo "Current project runtime is Firestore-based, so Prisma Studio is optional unless you maintain a SQL schema."
  exit 1
fi

echo "Starting Prisma Studio on port $PORT using schema: $SCHEMA_PATH"
pnpm exec prisma studio --schema "$SCHEMA_PATH" --port "$PORT"

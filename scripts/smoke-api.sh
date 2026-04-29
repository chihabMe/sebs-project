#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000/api}"
EMAIL="smoke.$(date +%s)@example.com"
PASSWORD="password123"

echo "Running API smoke checks against: $API_URL"

curl -fsS "$API_URL/events" >/dev/null
curl -fsS "$API_URL/tags" >/dev/null

REGISTER_PAYLOAD="{\"name\":\"Smoke User\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"USER\"}"
curl -fsS -c /tmp/sebs-smoke-cookies.txt -H "Content-Type: application/json" \
  -d "$REGISTER_PAYLOAD" "$API_URL/auth/register" >/dev/null

LOGIN_PAYLOAD="{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
curl -fsS -c /tmp/sebs-smoke-cookies.txt -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD" "$API_URL/auth/login" >/dev/null

curl -fsS -b /tmp/sebs-smoke-cookies.txt "$API_URL/users/profile" >/dev/null

echo "API smoke checks passed."

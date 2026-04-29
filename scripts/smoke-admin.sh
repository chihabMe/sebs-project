#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@sebs.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-password123}"
COOKIE_FILE="${COOKIE_FILE:-/tmp/sebs-admin-smoke-cookies.txt}"
USER_COOKIE_FILE="${USER_COOKIE_FILE:-/tmp/sebs-user-smoke-cookies.txt}"
NORMAL_EMAIL="user.$(date +%s)@example.com"
NORMAL_PASSWORD="password123"
TEMP_TAG="smoke-tag-$(date +%s)"
TEMP_USER_EMAIL="smoke-admin-user.$(date +%s)@example.com"

echo "Running admin smoke checks against: $API_URL"

ADMIN_STATUS=$(curl -sS -o /tmp/sebs-admin-login.json -w "%{http_code}" \
  -c "$COOKIE_FILE" -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  "$API_URL/auth/admin/login")

if [ "$ADMIN_STATUS" != "200" ]; then
  echo "Admin login failed with status $ADMIN_STATUS"
  cat /tmp/sebs-admin-login.json
  exit 1
fi

curl -fsS -b "$COOKIE_FILE" "$API_URL/auth/admin/session" >/dev/null
curl -fsS -b "$COOKIE_FILE" "$API_URL/admin/stats" >/dev/null
curl -fsS -b "$COOKIE_FILE" "$API_URL/admin/users" >/dev/null
curl -fsS -b "$COOKIE_FILE" "$API_URL/admin/pending-events" >/dev/null

CREATE_TAG_STATUS=$(curl -sS -o /tmp/sebs-admin-tag.json -w "%{http_code}" \
  -b "$COOKIE_FILE" -H "Content-Type: application/json" \
  -d "{\"name\":\"$TEMP_TAG\"}" "$API_URL/tags")

if [ "$CREATE_TAG_STATUS" != "201" ] && [ "$CREATE_TAG_STATUS" != "200" ]; then
  echo "Admin tag creation failed with status $CREATE_TAG_STATUS"
  cat /tmp/sebs-admin-tag.json
  exit 1
fi

TAG_ID=$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('/tmp/sebs-admin-tag.json','utf8')); process.stdout.write(data.data?.id || '')")

if [ -z "$TAG_ID" ]; then
  echo "Could not parse tag id from admin tag creation response."
  exit 1
fi

curl -fsS -X DELETE -b "$COOKIE_FILE" "$API_URL/tags/$TAG_ID" >/dev/null

CREATE_USER_STATUS=$(curl -sS -o /tmp/sebs-admin-user.json -w "%{http_code}" \
  -b "$COOKIE_FILE" -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke Admin Managed User\",\"email\":\"$TEMP_USER_EMAIL\",\"password\":\"password123\",\"role\":\"USER\"}" \
  "$API_URL/admin/users")

if [ "$CREATE_USER_STATUS" != "201" ] && [ "$CREATE_USER_STATUS" != "200" ]; then
  echo "Admin user creation failed with status $CREATE_USER_STATUS"
  cat /tmp/sebs-admin-user.json
  exit 1
fi

NORMAL_REGISTER_STATUS=$(curl -sS -o /tmp/sebs-normal-register.json -w "%{http_code}" \
  -c "$USER_COOKIE_FILE" -H "Content-Type: application/json" \
  -d "{\"name\":\"Normal User\",\"email\":\"$NORMAL_EMAIL\",\"password\":\"$NORMAL_PASSWORD\",\"role\":\"USER\"}" \
  "$API_URL/auth/register")

if [ "$NORMAL_REGISTER_STATUS" != "201" ]; then
  echo "Normal user registration failed with status $NORMAL_REGISTER_STATUS"
  cat /tmp/sebs-normal-register.json
  exit 1
fi

NON_ADMIN_STATUS=$(curl -sS -o /tmp/sebs-normal-admin-denied.json -w "%{http_code}" \
  -b "$USER_COOKIE_FILE" "$API_URL/admin/stats")

if [ "$NON_ADMIN_STATUS" != "403" ]; then
  echo "Expected non-admin access to fail with 403, got $NON_ADMIN_STATUS"
  cat /tmp/sebs-normal-admin-denied.json
  exit 1
fi

NON_ADMIN_ADMIN_LOGIN_STATUS=$(curl -sS -o /tmp/sebs-non-admin-login.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$NORMAL_EMAIL\",\"password\":\"$NORMAL_PASSWORD\"}" \
  "$API_URL/auth/admin/login")

if [ "$NON_ADMIN_ADMIN_LOGIN_STATUS" != "403" ]; then
  echo "Expected admin login with non-admin account to fail with 403, got $NON_ADMIN_ADMIN_LOGIN_STATUS"
  cat /tmp/sebs-non-admin-login.json
  exit 1
fi

echo "Admin smoke checks passed."

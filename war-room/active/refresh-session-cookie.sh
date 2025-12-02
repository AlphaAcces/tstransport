#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${QA_BASE_URL:-}" ]]; then
  echo "[war-room] QA_BASE_URL is not set" >&2
  exit 1
fi

if [[ -z "${TS24_JWT:-}" ]]; then
  echo "[war-room] TS24_JWT is not set (provide ALPHA-issued token)" >&2
  exit 1
fi

echo "[war-room] Requesting fresh session cookie from ${QA_BASE_URL}"
response_headers=$(curl -s -D - -o /dev/null "$QA_BASE_URL/sso-login?sso=${TS24_JWT}&refresh=1")

cookie_line=$(printf '%s' "$response_headers" | grep -i "set-cookie: ts24_sso_session" || true)
if [[ -z "$cookie_line" ]]; then
  echo "[war-room] No ts24_sso_session cookie detected." >&2
  exit 2
fi

printf '\n[war-room] Cookie header captured:\n%s\n' "$cookie_line"

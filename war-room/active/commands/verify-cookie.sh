#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${QA_BASE_URL:-}" ]]; then
  echo "[verify-cookie] QA_BASE_URL not set" >&2
  exit 1
fi

if [[ -z "${TS24_JWT:-}" ]]; then
  echo "[verify-cookie] TS24_JWT not provided" >&2
  exit 1
fi

response=$(curl -s -D - -o /dev/null "$QA_BASE_URL/sso-login?sso=${TS24_JWT}&check=1")
set_cookie=$(printf '%s' "$response" | grep -i 'set-cookie: ts24_sso_session' || true)

if [[ -z "$set_cookie" ]]; then
  echo "[verify-cookie] No ts24_sso_session header detected" >&2
  exit 2
fi

echo "[verify-cookie] Cookie header:" >&2
printf '%s\n' "$set_cookie"

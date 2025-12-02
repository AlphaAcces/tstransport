#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${QA_BASE_URL:-}" ]]; then
  echo "[trace-redirect] QA_BASE_URL not set" >&2
  exit 1
fi

url="${QA_BASE_URL}/sso-login?trace=1"

curl -s -I -L -o /dev/null -w '%{url_effective}\n' "$url" > /tmp/trace-final-url.txt

curl -s -I "$url" -D - -o /dev/null | grep -i location || true

echo "[trace-redirect] Final URL recorded in /tmp/trace-final-url.txt" >&2

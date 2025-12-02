#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${QA_BASE_URL:-}" ]]; then
  echo "[diagnose] QA_BASE_URL not set" >&2
  exit 1
fi

echo "[diagnose] Capturing health snapshot from ${QA_BASE_URL}" >&2
curl -s "$QA_BASE_URL/api/health" | jq '.status? // .'

echo "[diagnose] Recent latency metrics (watchdog)" >&2
tail -n 20 test-results/watchdog.log 2>/dev/null || echo "No watchdog log captured yet"

echo "[diagnose] Reminder: run \"npm run qa:monitor -- --burst 3\" in parallel for live data" >&2

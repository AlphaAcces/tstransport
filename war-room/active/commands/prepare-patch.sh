#!/usr/bin/env bash
set -euo pipefail

echo "[prepare] Verifying clean working tree..." >&2
git status --short

echo "[prepare] Recording current commit" >&2
git rev-parse HEAD

echo "[prepare] Suggested branch command:" >&2
echo "git checkout -b hotfix/<incident>" >&2

echo "[prepare] Reminder: no runtime change until ALPHA go signal." >&2

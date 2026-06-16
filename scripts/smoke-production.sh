#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:-http://127.0.0.1:8080}"

curl --fail --silent --show-error "${BASE_URL}/api/health/live/" >/dev/null
curl --fail --silent --show-error "${BASE_URL}/api/health/ready/" >/dev/null
curl --fail --silent --show-error "${BASE_URL}/" \
  | grep -q '<div id="root"></div>'

echo "Smoke checks passed for ${BASE_URL}."

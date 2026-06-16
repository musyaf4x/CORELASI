#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.production.yml"
RUNTIME_DIR="${REPO_ROOT}/deploy/runtime"
BACKEND_ENV="${RUNTIME_DIR}/backend.env"
POSTGRES_ENV="${RUNTIME_DIR}/postgres.env"
SEED=false

usage() {
  cat <<'EOF'
Usage: scripts/deploy-linux.sh [--seed]

Build and deploy the production stack. --seed is accepted only when the user
table is empty because seed_data replaces existing application data.
EOF
}

while (($#)); do
  case "$1" in
    --seed)
      SEED=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

compose() {
  docker compose --file "${COMPOSE_FILE}" "$@"
}

require_file() {
  local path="$1"
  if [[ ! -f "${path}" ]]; then
    echo "Required file is missing: ${path}" >&2
    exit 1
  fi
}

require_file "${BACKEND_ENV}"
require_file "${POSTGRES_ENV}"

if grep -Eiq 'replace-with|change-me|example\.local' "${BACKEND_ENV}" "${POSTGRES_ENV}"; then
  echo "Production environment still contains placeholder values." >&2
  exit 1
fi

mkdir -p \
  "${REPO_ROOT}/backups" \
  "${REPO_ROOT}/runtime/logs" \
  "${REPO_ROOT}/runtime/media" \
  "${REPO_ROOT}/runtime/staticfiles"
chmod 700 "${RUNTIME_DIR}" "${REPO_ROOT}/runtime"
chmod 600 "${BACKEND_ENV}" "${POSTGRES_ENV}"

echo "[1/7] Pulling base images"
compose pull postgres || echo "Warning: failed to pull postgres image, using local cache."

echo "[2/7] Building application images"
compose build --pull backend web

echo "[3/7] Starting PostgreSQL"
compose up --detach postgres

echo "[4/7] Running Django production checks and migrations"
compose run --rm backend python manage.py check --deploy
compose run --rm backend python manage.py migrate --noinput
compose run --rm backend python manage.py collectstatic --noinput

if [[ "${SEED}" == "true" ]]; then
  user_count="$(
    compose run --rm backend \
      python manage.py shell -c \
      "from django.contrib.auth import get_user_model; print(get_user_model().objects.count())" \
      | tail -n 1 | tr -d '[:space:]'
  )"
  if [[ "${user_count}" != "0" ]]; then
    echo "Refusing to seed a database containing ${user_count} users." >&2
    exit 1
  fi
  echo "[5/7] Loading exhibition seed data"
  compose run --rm backend python manage.py seed_data
else
  echo "[5/7] Seed skipped"
fi

echo "[6/7] Starting the complete stack"
compose up --detach --remove-orphans

echo "[7/7] Waiting for readiness"
for attempt in {1..30}; do
  if curl --fail --silent --show-error \
    http://127.0.0.1:8080/api/health/ready/ >/dev/null; then
    compose ps
    echo "CORELASI deployment is ready on http://127.0.0.1:8080."
    exit 0
  fi
  sleep 2
done

compose ps
compose logs --tail 100 backend web
echo "Deployment did not become ready within 60 seconds." >&2
exit 1

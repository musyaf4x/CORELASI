#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.production.yml"
BACKUP_DIR="$(realpath --canonicalize-existing "${REPO_ROOT}/backups")"
DATABASE_BACKUP=""
MEDIA_BACKUP=""
CONFIRM=false

usage() {
  cat <<'EOF'
Usage: scripts/restore-production.sh --database backups/file.dump
       [--media backups/file.tar.gz] --confirm

The command creates a safety backup before replacing production data.
EOF
}

while (($#)); do
  case "$1" in
    --database)
      DATABASE_BACKUP="${2:-}"
      shift
      ;;
    --media)
      MEDIA_BACKUP="${2:-}"
      shift
      ;;
    --confirm)
      CONFIRM=true
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

if [[ "${CONFIRM}" != "true" || -z "${DATABASE_BACKUP}" ]]; then
  usage >&2
  exit 2
fi

resolve_backup() {
  local requested="$1"
  local expected_suffix="$2"
  local resolved
  resolved="$(realpath --canonicalize-existing "${REPO_ROOT}/${requested}")"
  case "${resolved}" in
    "${BACKUP_DIR}"/*"${expected_suffix}") ;;
    *)
      echo "Backup must be a ${expected_suffix} file inside ${BACKUP_DIR}." >&2
      exit 1
      ;;
  esac
  printf '%s\n' "${resolved}"
}

database_path="$(resolve_backup "${DATABASE_BACKUP}" ".dump")"
media_path=""
if [[ -n "${MEDIA_BACKUP}" ]]; then
  media_path="$(resolve_backup "${MEDIA_BACKUP}" ".tar.gz")"
fi

compose() {
  docker compose --file "${COMPOSE_FILE}" "$@"
}

"${SCRIPT_DIR}/backup-production.sh" >/dev/null

database_file="$(basename "${database_path}")"
database_user="$(compose exec -T postgres printenv POSTGRES_USER)"
database_name="$(compose exec -T postgres printenv POSTGRES_DB)"

compose stop backend
trap 'compose up --detach backend web >/dev/null 2>&1 || true' EXIT

compose exec -T postgres psql \
  --username="${database_user}" \
  --dbname=postgres \
  --set=ON_ERROR_STOP=1 \
  --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${database_name}' AND pid <> pg_backend_pid();"

compose exec -T postgres pg_restore \
  --clean \
  --if-exists \
  --exit-on-error \
  --no-owner \
  --no-acl \
  --username="${database_user}" \
  --dbname="${database_name}" \
  "/backups/${database_file}"

if [[ -n "${media_path}" ]]; then
  media_root="${REPO_ROOT}/runtime/media"
  mkdir -p "${media_root}"
  find "${media_root}" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
  tar --extract --gzip --file "${media_path}" --directory "${media_root}"
fi

compose run --rm backend python manage.py migrate --noinput
compose up --detach backend web
trap - EXIT

echo "Restore completed. Run smoke tests before admitting users."

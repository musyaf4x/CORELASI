#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.production.yml"
BACKUP_DIR="${REPO_ROOT}/backups"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if ! [[ "${RETENTION_DAYS}" =~ ^[1-9][0-9]*$ ]]; then
  echo "RETENTION_DAYS must be a positive integer." >&2
  exit 2
fi

compose() {
  docker compose --file "${COMPOSE_FILE}" "$@"
}

mkdir -p "${BACKUP_DIR}"
timestamp="$(date -u +%Y%m%d-%H%M%S)"
database_file="corelasi-db-${timestamp}.dump"
media_file="corelasi-media-${timestamp}.tar.gz"

if [[ "$(compose ps --status running --quiet postgres)" == "" ]]; then
  echo "PostgreSQL is not running." >&2
  exit 1
fi

compose exec -T postgres sh -ceu \
  'pg_dump --format=custom --no-owner --no-acl --file="/backups/$1" --username="$POSTGRES_USER" "$POSTGRES_DB"' \
  sh "${database_file}"
compose exec -T postgres pg_restore --list "/backups/${database_file}" >/dev/null

if [[ -d "${REPO_ROOT}/runtime/media" ]] \
  && find "${REPO_ROOT}/runtime/media" -mindepth 1 -print -quit | grep -q .; then
  tar --create --gzip --file "${BACKUP_DIR}/${media_file}" \
    --directory "${REPO_ROOT}/runtime/media" .
else
  media_file=""
fi

(
  cd "${BACKUP_DIR}"
  sha256sum "${database_file}" ${media_file:+"${media_file}"} \
    > "corelasi-${timestamp}.sha256"
)

find "${BACKUP_DIR}" -maxdepth 1 -type f \
  \( -name 'corelasi-db-*.dump' -o -name 'corelasi-media-*.tar.gz' -o -name 'corelasi-*.sha256' \) \
  -mtime "+${RETENTION_DAYS}" -delete

echo "${BACKUP_DIR}/${database_file}"

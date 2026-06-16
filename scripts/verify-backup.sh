#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.production.yml"
BACKUP_DIR="$(realpath --canonicalize-existing "${REPO_ROOT}/backups")"
DATABASE_BACKUP="${1:-}"

if [[ -z "${DATABASE_BACKUP}" ]]; then
  echo "Usage: scripts/verify-backup.sh backups/corelasi-db-TIMESTAMP.dump" >&2
  exit 2
fi

backup_path="$(realpath --canonicalize-existing "${REPO_ROOT}/${DATABASE_BACKUP}")"
case "${backup_path}" in
  "${BACKUP_DIR}"/*.dump) ;;
  *)
    echo "Backup must be a .dump file inside ${BACKUP_DIR}." >&2
    exit 1
    ;;
esac

compose() {
  docker compose --file "${COMPOSE_FILE}" "$@"
}

database_file="$(basename "${backup_path}")"
database_user="$(compose exec -T postgres printenv POSTGRES_USER)"
verification_db="corelasi_restore_verify_$(date +%s)"

cleanup() {
  compose exec -T postgres dropdb \
    --if-exists --force --username="${database_user}" "${verification_db}" \
    >/dev/null 2>&1 || true
}
trap cleanup EXIT

compose exec -T postgres createdb \
  --username="${database_user}" "${verification_db}"
compose exec -T postgres pg_restore \
  --exit-on-error \
  --no-owner \
  --no-acl \
  --username="${database_user}" \
  --dbname="${verification_db}" \
  "/backups/${database_file}"

migration_rows="$(
  compose exec -T postgres psql \
    --tuples-only \
    --no-align \
    --username="${database_user}" \
    --dbname="${verification_db}" \
    --command='SELECT COUNT(*) FROM django_migrations;'
)"
if ! [[ "${migration_rows}" =~ ^[1-9][0-9]*$ ]]; then
  echo "Restore verification did not find Django migrations." >&2
  exit 1
fi

echo "Restore verification passed with ${migration_rows} migration rows."

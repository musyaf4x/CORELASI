#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
SYSTEMD_DIR="${HOME}/.config/systemd/user"

mkdir -p "${SYSTEMD_DIR}"

sed "s|__CORELASI_ROOT__|${REPO_ROOT}|g" \
  "${REPO_ROOT}/deploy/systemd/corelasi.service" \
  > "${SYSTEMD_DIR}/corelasi.service"
sed "s|__CORELASI_ROOT__|${REPO_ROOT}|g" \
  "${REPO_ROOT}/deploy/systemd/corelasi-backup.service" \
  > "${SYSTEMD_DIR}/corelasi-backup.service"
cp "${REPO_ROOT}/deploy/systemd/corelasi-backup.timer" \
  "${SYSTEMD_DIR}/corelasi-backup.timer"

systemctl --user daemon-reload
systemctl --user enable --now corelasi.service
systemctl --user enable --now corelasi-backup.timer

systemctl --user --no-pager status corelasi.service
systemctl --user --no-pager status corelasi-backup.timer

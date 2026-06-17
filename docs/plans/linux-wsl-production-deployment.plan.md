# Plan: Linux WSL Production Deployment

**Source**: User-approved seven-step deployment sequence
**Target**: `<your-private-network-hostname>`
**Complexity**: Large

## Summary

Deploy the verified CORELASI revision to the Ubuntu 24.04 WSL2 target without a
GitHub dependency. The release uses isolated Docker services, loopback-only
application ingress, Tailscale HTTPS, verified backups, and boot recovery.

## Patterns To Mirror

| Category | Source | Pattern |
| --- | --- | --- |
| Runtime validation | `corelasi-backend/config/runtime.py` | Fail fast on insecure production settings. |
| Database | `docker-compose.yml` | PostgreSQL health checks and persistent data. |
| Application server | `scripts/start-backend-production.ps1` | Waitress limits and deployment checks. |
| Reverse proxy | `deploy/Caddyfile.example` | Same-origin frontend/API and security headers. |
| Backup safety | `scripts/restore-production.ps1` | Safety backup and explicit destructive confirmation. |

## Tasks

- [x] Add Linux production Docker images and Compose topology.
- [x] Add Linux deployment, smoke, backup, restore, and restore-drill scripts.
- [x] Add user systemd service and backup timer templates.
- [x] Update the production runbook and remove the obsolete localStorage risk.
- [x] Validate manifests, application builds, tests, and security settings.
- [ ] Transfer an immutable checksummed release through Tailscale SSH.
- [ ] Generate secrets and deploy PostgreSQL, backend, and frontend.
- [ ] Configure Tailscale Serve HTTPS.
- [ ] Run all-role E2E against the deployed URL.
- [ ] Verify backup restore and full reboot recovery.

## Acceptance

- [ ] Only loopback port `8080` is published by CORELASI.
- [ ] Public application URL uses tailnet HTTPS.
- [ ] PostgreSQL, backend, and web containers are healthy.
- [ ] Admin, guru, and siswa critical paths pass.
- [ ] Backup restores into an isolated verification database.
- [ ] The application recovers after a Windows reboot.

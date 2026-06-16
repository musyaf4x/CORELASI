# CORELASI Production Runbook

## Supported Deployment

The primary production target is Ubuntu 24.04 on WSL2:

- PostgreSQL 16 runs in Docker with no published host port.
- Django and Waitress run in an isolated backend container.
- Caddy serves the React build and proxies API traffic on
  `127.0.0.1:8080`.
- Cloudflare Tunnel publishes `https://app.corelasi.my.id` without opening an
  inbound port on the Windows or Ubuntu host.
- Tailscale Serve terminates tailnet HTTPS and forwards to the loopback Caddy
  endpoint as the private fallback.
- Docker restart policies and a user systemd service recover the stack after
  the Ubuntu distribution starts.

The earlier Windows/PowerShell scripts remain available for local maintenance,
but they are not the deployment path for the Ubuntu host.

## Runtime Secrets

Create `deploy/runtime/backend.env`:

```dotenv
DEBUG=False
SECRET_KEY=<unique-random-secret-at-least-50-characters>
ALLOWED_HOSTS=app.corelasi.my.id,desktop-0e2e0e5-1.tail320122.ts.net,localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=https://app.corelasi.my.id,https://desktop-0e2e0e5-1.tail320122.ts.net
CSRF_TRUSTED_ORIGINS=https://app.corelasi.my.id,https://desktop-0e2e0e5-1.tail320122.ts.net
CORS_ALLOW_CREDENTIALS=True
AUTH_REFRESH_COOKIE_NAME=corelasi_refresh
AUTH_REFRESH_COOKIE_MAX_AGE=604800
SHOWCASE_MODE=True
SHOWCASE_ACCOUNT_EMAILS=admin@corelasi.test,guru@corelasi.test,siswa@corelasi.test
TRUST_PROXY_HEADERS=True
SECURE_SSL_REDIRECT=True
SECURE_COOKIES=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=False
SECURE_HSTS_PRELOAD=False
DB_ENGINE=postgresql
POSTGRES_DB=corelasi
POSTGRES_USER=corelasi_app
POSTGRES_PASSWORD=<unique-random-database-password>
DB_HOST=postgres
DB_PORT=5432
DB_CONN_MAX_AGE=60
DB_CONNECT_TIMEOUT=5
DRF_NUM_PROXIES=2
THROTTLE_ANON_RATE=120/min
THROTTLE_USER_RATE=1200/min
THROTTLE_LOGIN_RATE=10/min
THROTTLE_TOKEN_REFRESH_RATE=30/min
THROTTLE_PASSWORD_RESET_RATE=3/hour
THROTTLE_UPLOAD_RATE=20/hour
MAX_UPLOAD_SIZE=10485760
FILE_UPLOAD_MAX_MEMORY_SIZE=10485760
DATA_UPLOAD_MAX_MEMORY_SIZE=11534336
LOG_FILE=/app/logs/corelasi.log
```

Create `deploy/runtime/postgres.env` with the same database name, user, and
password:

```dotenv
POSTGRES_DB=corelasi
POSTGRES_USER=corelasi_app
POSTGRES_PASSWORD=<same-random-database-password>
```

Both files must be mode `0600`. They are ignored by Git and must never be
included in source archives.

## Initial Deployment

From the immutable release checkout:

```bash
chmod +x scripts/*.sh
scripts/deploy-linux.sh --seed
scripts/install-linux-user-services.sh
tailscale serve --bg --yes http://127.0.0.1:8080
```

Create the remotely managed Cloudflare Tunnel `corelasi-production`, store its
connector token outside the release checkout, and run the connector:

```bash
install -d -m 700 ~/apps/corelasi/shared/cloudflared
install -m 600 /secure/source/token \
  ~/apps/corelasi/shared/cloudflared/token
docker run -d \
  --name corelasi-cloudflared \
  --restart unless-stopped \
  --user 1000:1000 \
  --network host \
  -v ~/apps/corelasi/shared/cloudflared/token:/etc/cloudflared/token:ro \
  cloudflare/cloudflared:latest \
  tunnel --no-autoupdate run --token-file /etc/cloudflared/token
```

Configure its published application route:

```text
Hostname: app.corelasi.my.id
Service:  http://127.0.0.1:8080
```

Verify:

```bash
scripts/smoke-production.sh https://app.corelasi.my.id
scripts/smoke-production.sh \
  https://desktop-0e2e0e5-1.tail320122.ts.net
docker compose --file docker-compose.production.yml ps
docker inspect corelasi-cloudflared \
  --format '{{.State.Status}} {{.HostConfig.RestartPolicy.Name}}'
systemctl --user status corelasi.service
tailscale serve status
```

Do not use `--seed` on subsequent releases. It is allowed only while the user
table is empty because the exhibition seed command replaces application data.

## Release Update

1. Create and checksum an immutable source archive from a clean Git commit.
2. Back up the active database.
3. Extract the new revision into a separate release directory.
4. Copy only the runtime environment files and media directory.
5. Run `scripts/deploy-linux.sh` without `--seed`.
6. Run role smoke tests before removing the previous release.

Rollback means switching the service working directory to the previous release
and restoring the pre-deploy database backup only when the migration is not
backward-compatible.

## Backup And Restore

The user systemd timer runs a verified backup daily at approximately 02:15.
Backups include:

- PostgreSQL custom-format dump.
- Media archive when uploaded media exists.
- SHA-256 checksum manifest.

Run a manual backup and non-destructive restore drill:

```bash
backup_path="$(scripts/backup-production.sh)"
scripts/verify-backup.sh \
  "backups/$(basename "${backup_path}")"
```

An actual restore requires explicit confirmation and creates a safety backup
first:

```bash
scripts/restore-production.sh \
  --database backups/corelasi-db-YYYYMMDD-HHMMSS.dump \
  --confirm
```

Successful local backups must also be copied to another device. A backup on the
same physical disk is not disaster recovery.

## WSL Recovery

Ubuntu uses systemd and user lingering, but the Windows host must start the
distribution after boot. Keep the Windows scheduled task that launches:

```text
wsl.exe -d Ubuntu --exec /bin/true
```

enabled. Validate recovery with a full Windows reboot:

1. Tailscale Linux peer becomes online.
2. Docker is active.
3. `corelasi.service` is active.
4. All three containers are healthy.
5. `corelasi-cloudflared` is running and has active tunnel connections.
6. Both public and Tailscale HTTPS readiness endpoints return HTTP 200.

## Security Operations

- Do not publish PostgreSQL or Django ports to the host.
- Keep Caddy bound to `127.0.0.1`; only Cloudflare Tunnel and Tailscale Serve
  may reach that loopback endpoint.
- Keep the Cloudflare Tunnel token outside releases and Git with mode `0600`.
- Review `runtime/logs/corelasi.log` and `docker compose logs`.
- Patch Ubuntu, Docker, base images, Python dependencies, Node dependencies,
  and Caddy regularly.
- Rotate the Django secret and database password after suspected disclosure.
- The refresh token is stored in a Secure, HttpOnly, SameSite cookie. Access
  tokens remain in memory and are not persisted in browser local storage.
- The backend showcase endpoint remains disabled unless `SHOWCASE_MODE=True`.
  Keep `SHOWCASE_ACCOUNT_EMAILS` limited to the three dedicated demo accounts.
- The production Compose build enables the demo-account quick login explicitly
  with `VITE_ENABLE_DEMO_LOGIN=true`.
- Showcase quick-login accounts follow the same role-based access control as
  normal accounts. Admin, guru, and siswa showcase sessions are not given extra
  showcase-only restrictions.
- Admin and superuser accounts are still blocked from deleting their own user
  record.
- The operator superuser is not included in `SHOWCASE_ACCOUNT_EMAILS` and is not
  displayed in the quick-login panel.
- Non-showcase production account passwords must be unique, randomly generated,
  and stored only in a protected operator file outside Git. Rotate them and
  blacklist outstanding refresh tokens before public exposure.
- Keep HSTS and the restrictive CSP enabled at Caddy. Cloudflare analytics
  beacon injection may be blocked by that CSP; do not weaken `script-src` just
  to silence the optional beacon.

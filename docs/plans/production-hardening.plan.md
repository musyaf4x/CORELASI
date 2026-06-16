# Production Hardening Plan

## Goal

Prepare CORELASI for a production-style Windows PC deployment while preserving
the current PostgreSQL-backed local and E2E workflows.

## Scope

- Fail fast when production secrets, hosts, or trusted origins are unsafe.
- Configure HTTPS redirect, reverse-proxy trust, secure cookies, HSTS, and
  browser security headers.
- Serve collected static assets with WhiteNoise and keep uploaded media outside
  Django's production URL routing.
- Add liveness and database-readiness endpoints.
- Add structured application logging without request-body or credential logs.
- Throttle anonymous, authenticated, login, token refresh, and password-reset
  traffic.
- Harden upload filenames and retain the existing type and size restrictions.
- Add PostgreSQL and media backup/restore scripts with verification and
  retention.
- Add production environment and reverse-proxy templates plus an operating
  runbook.
- Upgrade Django and Django REST Framework to supported production branches.

## Explicitly Deferred

- Replacing the existing browser `localStorage` JWT flow with an HttpOnly-cookie
  authentication architecture. This is a separate cross-stack migration and
  remains documented as residual XSS exposure.
- Installing the final TLS certificate and binding the final production
  hostname. Those values depend on the target PC/network and are applied during
  deployment using the templates produced here.

## Execution Order

1. Add tests for production runtime validation, health endpoints, security
   headers, endpoint throttles, and upload filename sanitization.
2. Implement runtime validation and security settings.
3. Implement middleware, health checks, logging, throttling, and static/media
   production behavior.
4. Add backup/restore scripts, production templates, and runbook.
5. Upgrade dependencies and run Django deployment checks.
6. Run the complete PostgreSQL backend suite, frontend unit tests/build, and
   role-based E2E verification.
7. Review the final diff and commit the hardening as one coherent change.

## Acceptance Criteria

- `DEBUG=False` refuses placeholder secrets, wildcard/empty hosts, and invalid
  trusted origins.
- Django `check --deploy` has no unaddressed security warning for the intended
  HTTPS deployment profile.
- Liveness returns 200 without touching PostgreSQL; readiness returns 503 when
  PostgreSQL is unavailable.
- Sensitive public endpoints return HTTP 429 after their configured rate.
- Production static collection succeeds and uploaded media is not routed by
  Django when debug is disabled.
- Backup output is verified with `pg_restore --list`; restore requires an
  explicit confirmation switch.
- Existing PostgreSQL backend, frontend, and role workflows remain green.

## Authorization

The user explicitly requested execution and completion of production hardening
on 2026-06-10. No separate plan approval pause is required for this run.

## Verification Results

- Django `check --deploy`: no issues.
- Migration drift and unapplied migration checks: clean.
- Backend PostgreSQL suite: 95 tests passed.
- Frontend suite: 76 tests passed.
- Frontend production build: passed.
- Production npm audit: 0 vulnerabilities.
- PowerShell scripts and Docker Compose configuration: valid.
- PostgreSQL backup: custom-format dump verified with `pg_restore --list`.
- Restore drill: completed against a disposable PostgreSQL 16 container; 28
  Django migrations were present after restore.
- Authenticated smoke tests: Admin, Guru, and Siswa critical API flows returned
  their expected status codes.
- Security headers and exact local CORS origin were observed on the running
  application.
- The files added or changed for XLSX export pass ESLint. The repository-wide
  lint command still reports pre-existing issues across unrelated frontend
  modules and is tracked as refactor-clean debt.
- Visual browser automation could not be attached in this environment. The
  live frontend returned HTTP 200, but final visual role walkthrough remains a
  deployment-step smoke check.

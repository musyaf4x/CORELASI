# Security Requirements Checklist — CORELASI Sprint 9

**Jira Task:** S09-TL-01 — Review Security Requirements and Deployment Risks  
**Sprint:** Sprint 9 — Security and Production Hardening  
**Author:** Hafidz Musyafa Azmi (Tech Lead)  
**Review Date:** 2026-06-15  
**Status:** Review Complete

---

## 1. Authentication and Session Security

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 1.1 | JWT access token stored in memory, refresh token in HttpOnly cookie | `accounts/views.py` — cookie set with `httponly=True`, `samesite='Lax'` | ✅ PASS |
| 1.2 | Refresh cookie is Secure in production (`SESSION_COOKIE_SECURE = True`) | `config/settings.py` — driven by `RUNTIME["SESSION_COOKIE_SECURE"]`, set to `True` when `HTTPS_MODE=true` | ✅ PASS |
| 1.3 | Login endpoint rate-limited (brute-force protection) | `accounts/views.py` — `throttle_scope = "login"` with `RuntimeScopedRateThrottle`; tested in `accounts/tests.py:test_login_is_throttled_by_client_ip` | ✅ PASS |
| 1.4 | Token refresh endpoint rate-limited | `accounts/views.py` — `throttle_scope = "token_refresh"` | ✅ PASS |
| 1.5 | Password reset endpoint rate-limited | `accounts/views.py` — `throttle_scope = "password_reset"` on `ChangePasswordView.get_throttles()` | ✅ PASS |
| 1.6 | Logout invalidates refresh cookie | `accounts/views.py:LogoutView` — cookie deleted via `delete_cookie` on response | ✅ PASS |

---

## 2. CSRF Protection

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 2.1 | CSRF middleware enabled | `config/settings.py` — `django.middleware.csrf.CsrfViewMiddleware` in `MIDDLEWARE` | ✅ PASS |
| 2.2 | CSRF cookie is Secure in production | `config/settings.py` — `CSRF_COOKIE_SECURE = RUNTIME["CSRF_COOKIE_SECURE"]` | ✅ PASS |
| 2.3 | CSRF SameSite policy set to `Lax` | `config/settings.py` — `CSRF_COOKIE_SAMESITE = "Lax"` | ✅ PASS |
| 2.4 | CSRF trusted origins restricted to production domain | `config/runtime.py` — `CSRF_TRUSTED_ORIGINS` validated to require HTTPS; tested in `config/tests/test_runtime.py` | ✅ PASS |
| 2.5 | CSRF cookie endpoint available for SPA initialization | `accounts/views.py:CsrfCookieView` — GET endpoint seeds cookie, logged in tests | ✅ PASS |

---

## 3. CORS Configuration

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 3.1 | CORS restricted to declared origins | `config/runtime.py` — `CORS_ALLOWED_ORIGINS` required in production; `CORS_ALLOW_ALL_ORIGINS = False` | ✅ PASS |
| 3.2 | CORS credentials allowed for same-origin SPA | `config/settings.py` — `CORS_ALLOW_CREDENTIALS = True` with explicit origins only | ✅ PASS |
| 3.3 | Wildcard CORS origins rejected at startup | `config/runtime.py:_validate_https_origins` — raises `ImproperlyConfigured` for non-HTTPS or missing values | ✅ PASS |

---

## 4. Role-Based Access Control (RBAC)

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 4.1 | All API endpoints require authentication | `config/settings.py` — `DEFAULT_AUTHENTICATION_CLASSES` and `DEFAULT_PERMISSION_CLASSES = [IsAuthenticated]` | ✅ PASS |
| 4.2 | Admin-only endpoints guarded by `IsAdminUser` | `accounts/views.py`, `academic/views.py` — role checks on admin CRUD | ✅ PASS |
| 4.3 | Attendance status restricted by role: Guru Pengampu can only set `Hadir`/`Alpa` | `attendance/serializers.py:validate` — guard rejects `Sakit`/`Izin` for non-piket teachers | ✅ PASS (Sprint 9 hardening) |
| 4.4 | Guru Piket and Admin retain full attendance status range | `attendance/serializers.py` — checked via `is_piket_today` and `user.profile.role == 'admin'` | ✅ PASS |
| 4.5 | Siswa cannot modify attendance records directly | `attendance/views.py` — Siswa role has no write permission on `AbsensiViewSet` | ✅ PASS |
| 4.6 | Frontend enforces role constraints at UI level | `guru/AttendancePage.tsx` — statuses filtered by role, `Sakit`/`Izin` rendered as read-only badges for regular Guru | ✅ PASS |

---

## 5. Upload Security

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 5.1 | File size capped at `MAX_UPLOAD_SIZE` | `config/settings.py` — `MAX_UPLOAD_SIZE` config-driven; enforced in `learning/views.py:perform_create` | ✅ PASS |
| 5.2 | Upload endpoint is rate-limited | `learning/views.py` — `throttle_scope = "upload"` with `RuntimeScopedRateThrottle` | ✅ PASS |
| 5.3 | File type validated before storage | `learning/views.py` — serializer validates `content_type` against allowed MIME list | ✅ PASS |
| 5.4 | Uploaded files stored outside web root | `config/settings.py` — `MEDIA_ROOT` mapped to `/app/runtime/media/`, not served by backend directly; Caddy used | ✅ PASS |

---

## 6. Transport Security (HTTPS / HSTS)

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 6.1 | HSTS enabled in production | `config/settings.py` — `SECURE_HSTS_SECONDS`, `SECURE_HSTS_INCLUDE_SUBDOMAINS`, `SECURE_HSTS_PRELOAD` from runtime config | ✅ PASS |
| 6.2 | HSTS applied at reverse proxy (Caddy) | `deploy/Caddyfile.container` — `header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"` | ✅ PASS |
| 6.3 | SSL redirect enabled | `config/settings.py` — `SECURE_SSL_REDIRECT = RUNTIME["SECURE_SSL_REDIRECT"]`; behind Cloudflare proxy in production | ✅ PASS |
| 6.4 | Proxy SSL header set for Cloudflare | `config/settings.py` — `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")` | ✅ PASS |

---

## 7. Django Security Headers

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 7.1 | `X-Content-Type-Options: nosniff` | `config/settings.py` — `SECURE_CONTENT_TYPE_NOSNIFF = True` | ✅ PASS |
| 7.2 | Referrer policy restricted | `config/settings.py` — `SECURE_REFERRER_POLICY = "same-origin"` | ✅ PASS |
| 7.3 | Cross-Origin-Opener-Policy set | `config/settings.py` — `SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"` | ✅ PASS |
| 7.4 | DEBUG disabled in production | `config/runtime.py` — `DEBUG = False` when `DJANGO_ENV != "development"` | ✅ PASS |
| 7.5 | `SECRET_KEY` loaded from environment only | `config/settings.py` — `SECRET_KEY = config("SECRET_KEY")` with no default | ✅ PASS |

---

## 8. Database and Secret Management

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 8.1 | Database credentials not in source code | `.env.example` and `.postgres.env.example` — placeholder values only; actual secrets in `deploy/runtime/*.env` outside repo | ✅ PASS |
| 8.2 | `deploy/runtime/` is in `.gitignore` | `.gitignore` — `deploy/runtime/` excluded | ✅ PASS |
| 8.3 | Backup plan documented | Deployment runbook includes `pg_dump` step before migrations | ⚠️ PARTIAL — runbook exists but automated backup not yet scheduled |
| 8.4 | DB connection uses env-injected DSN | `config/settings.py` — `DATABASES["default"]` built from `DATABASE_URL` env var via `dj-database-url` | ✅ PASS |

---

## 9. Deploy Reproducibility

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 9.1 | Frontend uses `npm ci` (not `npm install`) in Docker build | `deploy/docker/frontend.Dockerfile` — `RUN npm ci` (restored in commit `3060a55`) | ✅ PASS |
| 9.2 | Docker base images refreshed on every build | `scripts/deploy-linux.sh` — `compose build --pull backend web` (restored in commit `3060a55`) | ✅ PASS |
| 9.3 | Environment placeholder check before deploy | `scripts/deploy-linux.sh` — `grep -Eiq 'replace-with|change-me|example.local'` aborts if found | ✅ PASS |
| 9.4 | Production `manage.py check --deploy` runs before migrations | `scripts/deploy-linux.sh` — step 4 runs `check --deploy` | ✅ PASS |
| 9.5 | Seed guard prevents overwriting live data | `scripts/deploy-linux.sh` — `--seed` flag only allowed when `user_count == 0` | ✅ PASS |

---

## Summary

| Domain | Total Checks | Pass | Partial | Fail |
|--------|-------------|------|---------|------|
| Auth/Session | 6 | 6 | 0 | 0 |
| CSRF | 5 | 5 | 0 | 0 |
| CORS | 3 | 3 | 0 | 0 |
| RBAC | 6 | 6 | 0 | 0 |
| Upload Security | 4 | 4 | 0 | 0 |
| Transport Security | 4 | 4 | 0 | 0 |
| Security Headers | 5 | 5 | 0 | 0 |
| Secrets/DB | 4 | 3 | 1 | 0 |
| Deploy Reproducibility | 5 | 5 | 0 | 0 |
| **TOTAL** | **42** | **41** | **1** | **0** |

**Overall: PASS** — One partial item (automated DB backup scheduling) is tracked as a risk in the deployment risk register.

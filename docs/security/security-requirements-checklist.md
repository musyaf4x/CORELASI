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
| 1.1 | JWT access token stored in memory, refresh token in HttpOnly cookie | `accounts/views.py` — cookie set with `httponly=True`, `samesite='Lax'` | PASS |
| 1.2 | Refresh cookie is Secure in production | `config/settings.py` — `SESSION_COOKIE_SECURE` driven by `RUNTIME`, set `True` when `HTTPS_MODE=true` | PASS |
| 1.3 | Login endpoint rate-limited (brute-force protection) | `accounts/views.py` — `throttle_scope = "login"` dengan `RuntimeScopedRateThrottle`; diuji di `accounts/tests.py:test_login_is_throttled_by_client_ip` | PASS |
| 1.4 | Token refresh endpoint rate-limited | `accounts/views.py` — `throttle_scope = "token_refresh"` | PASS |
| 1.5 | Password reset endpoint rate-limited | `accounts/views.py` — `throttle_scope = "password_reset"` pada `ChangePasswordView.get_throttles()` | PASS |
| 1.6 | Logout invalidates refresh cookie | `accounts/views.py:LogoutView` — cookie dihapus via `delete_cookie` | PASS |

---

## 2. CSRF Protection

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 2.1 | CSRF middleware enabled | `config/settings.py` — `django.middleware.csrf.CsrfViewMiddleware` aktif | PASS |
| 2.2 | CSRF cookie Secure di production | `config/settings.py` — `CSRF_COOKIE_SECURE = RUNTIME["CSRF_COOKIE_SECURE"]` | PASS |
| 2.3 | CSRF SameSite policy Lax | `config/settings.py` — `CSRF_COOKIE_SAMESITE = "Lax"` | PASS |
| 2.4 | CSRF trusted origins dibatasi ke domain production | `config/runtime.py` — `CSRF_TRUSTED_ORIGINS` divalidasi wajib HTTPS; diuji di `config/tests/test_runtime.py` | PASS |
| 2.5 | CSRF cookie endpoint tersedia untuk inisialisasi SPA | `accounts/views.py:CsrfCookieView` — endpoint GET untuk seed cookie | PASS |

---

## 3. CORS Configuration

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 3.1 | CORS dibatasi ke origins yang dideklarasikan | `config/runtime.py` — `CORS_ALLOWED_ORIGINS` wajib di production; `CORS_ALLOW_ALL_ORIGINS = False` | PASS |
| 3.2 | CORS credentials diizinkan untuk SPA | `config/settings.py` — `CORS_ALLOW_CREDENTIALS = True` dengan explicit origins | PASS |
| 3.3 | Wildcard CORS ditolak saat startup | `config/runtime.py:_validate_https_origins` — raise `ImproperlyConfigured` untuk non-HTTPS | PASS |

---

## 4. Role-Based Access Control (RBAC)

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 4.1 | Semua API endpoint memerlukan autentikasi | `config/settings.py` — `DEFAULT_PERMISSION_CLASSES = [IsAuthenticated]` | PASS |
| 4.2 | Endpoint admin-only dijaga `IsAdminUser` | `accounts/views.py`, `academic/views.py` — role check pada admin CRUD | PASS |
| 4.3 | Status absensi dibatasi per role: Guru Pengampu hanya `Hadir`/`Alpa` | `attendance/serializers.py:validate` — guard menolak `Sakit`/`Izin` untuk guru non-piket | PASS (Sprint 9 hardening) |
| 4.4 | Guru Piket dan Admin tetap punya akses penuh status absensi | `attendance/serializers.py` — dicek via `is_piket_today` dan `role == 'admin'` | PASS |
| 4.5 | Siswa tidak bisa memodifikasi record absensi langsung | `attendance/views.py` — role Siswa tidak punya write permission | PASS |
| 4.6 | Frontend menerapkan constraint role di level UI | `guru/AttendancePage.tsx` — status difilter per role, `Sakit`/`Izin` jadi read-only badge untuk Guru biasa | PASS |

---

## 5. Upload Security

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 5.1 | Ukuran file dibatasi `MAX_UPLOAD_SIZE` | `config/settings.py` — config-driven; diterapkan di `learning/views.py:perform_create` | PASS |
| 5.2 | Upload endpoint rate-limited | `learning/views.py` — `throttle_scope = "upload"` | PASS |
| 5.3 | Tipe file divalidasi sebelum disimpan | `learning/views.py` — serializer memvalidasi `content_type` terhadap daftar MIME yang diizinkan | PASS |
| 5.4 | File upload disimpan di luar web root | `config/settings.py` — `MEDIA_ROOT` di `/app/runtime/media/`, tidak dilayani langsung backend | PASS |

---

## 6. Transport Security (HTTPS / HSTS)

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 6.1 | HSTS aktif di production | `config/settings.py` — `SECURE_HSTS_SECONDS`, `SECURE_HSTS_INCLUDE_SUBDOMAINS`, `SECURE_HSTS_PRELOAD` dari runtime config | PASS |
| 6.2 | HSTS diterapkan di reverse proxy (Caddy) | `deploy/Caddyfile.container` — `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` | PASS |
| 6.3 | SSL redirect aktif | `config/settings.py` — `SECURE_SSL_REDIRECT = RUNTIME["SECURE_SSL_REDIRECT"]`; di belakang Cloudflare di production | PASS |
| 6.4 | Proxy SSL header dikonfigurasi untuk Cloudflare | `config/settings.py` — `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")` | PASS |

---

## 7. Django Security Headers

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 7.1 | `X-Content-Type-Options: nosniff` | `config/settings.py` — `SECURE_CONTENT_TYPE_NOSNIFF = True` | PASS |
| 7.2 | Referrer policy dibatasi | `config/settings.py` — `SECURE_REFERRER_POLICY = "same-origin"` | PASS |
| 7.3 | Cross-Origin-Opener-Policy dikonfigurasi | `config/settings.py` — `SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"` | PASS |
| 7.4 | DEBUG dinonaktifkan di production | `config/runtime.py` — `DEBUG = False` saat `DJANGO_ENV != "development"` | PASS |
| 7.5 | `SECRET_KEY` hanya dari environment | `config/settings.py` — `SECRET_KEY = config("SECRET_KEY")` tanpa default | PASS |

---

## 8. Database and Secret Management

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 8.1 | Kredensial database tidak ada di source code | `.env.example` dan `.postgres.env.example` — hanya placeholder; secret aktual di `deploy/runtime/*.env` di luar repo | PASS |
| 8.2 | `deploy/runtime/` ada di `.gitignore` | `.gitignore` — `deploy/runtime/` dikecualikan | PASS |
| 8.3 | Backup plan terdokumentasi | Runbook deployment mencakup langkah `pg_dump` sebelum migrasi | PARTIAL — runbook ada tapi backup otomatis belum dijadwalkan |
| 8.4 | Koneksi DB menggunakan DSN dari env | `config/settings.py` — `DATABASES["default"]` dari `DATABASE_URL` env var via `dj-database-url` | PASS |

---

## 9. Deploy Reproducibility

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 9.1 | Frontend menggunakan `npm ci` di Docker build | `deploy/docker/frontend.Dockerfile` — `RUN npm ci` (dipulihkan di commit `3060a55`) | PASS |
| 9.2 | Docker base images di-refresh setiap build | `scripts/deploy-linux.sh` — `compose build --pull backend web` (dipulihkan di commit `3060a55`) | PASS |
| 9.3 | Pengecekan placeholder environment sebelum deploy | `scripts/deploy-linux.sh` — `grep -Eiq 'replace-with|change-me|example.local'` abort jika ditemukan | PASS |
| 9.4 | Production `manage.py check --deploy` berjalan sebelum migrasi | `scripts/deploy-linux.sh` — step 4 menjalankan `check --deploy` | PASS |
| 9.5 | Guard seed mencegah overwrite data live | `scripts/deploy-linux.sh` — flag `--seed` hanya diizinkan saat `user_count == 0` | PASS |

---

## Ringkasan

| Domain | Total | Pass | Partial | Fail |
|--------|-------|------|---------|------|
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

**Overall: PASS** — Satu item partial (jadwal backup DB otomatis) dicatat sebagai risiko terbuka di deployment risk register.

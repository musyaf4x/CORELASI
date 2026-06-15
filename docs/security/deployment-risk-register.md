# Deployment Risk Register — CORELASI Sprint 9

**Jira Task:** S09-TL-01 — Review Security Requirements and Deployment Risks  
**Sprint:** Sprint 9 — Security and Production Hardening  
**Author:** Hafidz Musyafa Azmi (Tech Lead)  
**Review Date:** 2026-06-15  
**Status:** Active

---

## Risk Matrix

| ID | Risk | Likelihood | Impact | Severity | Mitigation | Owner | Status |
|----|------|-----------|--------|----------|------------|-------|--------|
| DR-01 | Automated DB backup not scheduled | Medium | High | **HIGH** | Manual `pg_dump` before every migration; documented in runbook | Tech Lead | ⚠️ Open |
| DR-02 | `npm install` (non-deterministic) used in Docker build | High | Medium | **HIGH** | Restored `npm ci` in `frontend.Dockerfile` (commit `3060a55`) | Tech Lead | ✅ Resolved |
| DR-03 | `compose build --pull` dropped — stale base images in production | Medium | Medium | **MEDIUM** | Restored `--pull` flag in `deploy-linux.sh` (commit `3060a55`) | Tech Lead | ✅ Resolved |
| DR-04 | Attendance role restriction missing in backend | High | High | **CRITICAL** | Serializer guard added (`attendance/serializers.py`), unit-tested, deployed as `att-workflow-fix-v3` | Tech Lead | ✅ Resolved |
| DR-05 | Attendance status `Sakit`/`Izin` accessible to Guru Pengampu via UI | High | High | **CRITICAL** | Frontend constrained to `[Hadir, Alpa]` for regular Guru; read-only badges for locked statuses (commit `87df1e3`) | Tech Lead | ✅ Resolved |
| DR-06 | SECRET_KEY or DB credentials committed to repository | Low | Critical | **HIGH** | Checked: `.gitignore` excludes `deploy/runtime/`; `.env.example` contains only placeholders; no secrets in any committed file | Tech Lead | ✅ Verified |
| DR-07 | Production deploy does not validate environment placeholders | Low | High | **HIGH** | `deploy-linux.sh` includes `grep` guard for placeholder strings; exits with code 1 if found | Tech Lead | ✅ Verified |
| DR-08 | CSRF not enforced on mutation endpoints | Low | High | **HIGH** | `CsrfViewMiddleware` active; SPA initializes cookie before mutation via `CsrfCookieView`; tested in `accounts/tests.py` | Backend | ✅ Verified |
| DR-09 | Upload endpoint allows oversized or malicious files | Low | Medium | **MEDIUM** | `MAX_UPLOAD_SIZE` enforced; MIME type validated; upload throttled | Backend | ✅ Verified |
| DR-10 | Session cookie sent over HTTP | Low | High | **HIGH** | `SESSION_COOKIE_SECURE = True` in production; enforced via runtime config | Backend | ✅ Verified |
| DR-11 | Cloudflare bypass allows direct HTTP access to origin | Low | Medium | **MEDIUM** | Origin IP not publicly exposed; only Cloudflare IPs whitelisted at firewall level | Tech Lead | ✅ Verified |
| DR-12 | Seed data replaces live production data accidentally | Low | Critical | **HIGH** | `--seed` flag guards with `user_count == 0` check; will abort if any user exists | Tech Lead | ✅ Verified |

---

## Open Risks (Action Required)

### DR-01 — Automated DB backup not scheduled

**Description:**  
There is no automated pre-deployment backup. The current runbook requires a manual `pg_dump` before each migration. In a rapid-deploy scenario, this step could be skipped.

**Current Mitigation:**  
- Runbook mandates manual backup before `manage.py migrate`
- Production only has a single instance — risk of data loss if migration fails without prior backup

**Recommended Action:**  
1. Add a `pg_dump` step to `deploy-linux.sh` before running migrations (guarded by backup output file existence check)
2. Store backups in `/home/hafidz/apps/corelasi/backups/` with timestamp rotation
3. Track via `S12-BE-01` in Sprint 12 (Deployment Preparation)

**Target Sprint:** Sprint 12 (S12-BE-01)  
**Priority:** HIGH

---

## Resolved Risks — Evidence Summary

### DR-02 + DR-03 — Deploy Reproducibility (Resolved: 2026-06-15)

- **Commit:** `3060a55` — `fix(deploy): restore npm ci and --pull flag for reproducible builds`
- **Files:** `deploy/docker/frontend.Dockerfile`, `scripts/deploy-linux.sh`
- **Detail:** `npm install` inadvertently introduced in commit `87df1e3` during attendance fix sprint. `npm ci` requires exact match to `package-lock.json`, preventing lockfile drift across environments. `--pull` ensures Docker always uses the latest base image during build, preventing stale security patches in base layers.

### DR-04 + DR-05 — Attendance Role Restriction (Resolved: 2026-06-15)

- **Backend Commit:** `87df1e3` — `fix(attendance): restore role-based attendance status rules`
- **Deployment:** Production release `20260615-att-workflow-fix-v3` (host `100.87.113.74`)
- **Evidence:** Backend unit tests 13/13 PASS; Frontend unit tests 104/104 PASS; E2E smoke test PASS
- **Business Rule:** Guru Pengampu → `[Hadir, Alpa]` only. Guru Piket/Admin → full status range. This is a domain rule from SMAT Baiturrahman policy, not a bug — classified as Sprint 9 access-control hardening.

### DR-06 — Secret Exposure (Verified: 2026-06-15)

- `.gitignore` reviewed: `deploy/runtime/`, `*.env`, `.postgres.env` excluded
- No secrets found in committed files via `git log --all -- '**/*.env'`
- `.env.example` and `.postgres.env.example` contain only placeholder strings

---

## Risk Methodology

**Likelihood:** Low = unlikely in normal operation | Medium = possible | High = likely without mitigation  
**Impact:** Low = cosmetic/minor | Medium = degraded service | High = data breach or downtime | Critical = data loss or security breach  
**Severity:** Low | Medium | **HIGH** | **CRITICAL**

---

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2026-06-15 | Initial risk register created for Sprint 9 review | Hafidz Musyafa Azmi |
| 2026-06-15 | DR-02, DR-03 resolved via `3060a55` | Hafidz Musyafa Azmi |
| 2026-06-15 | DR-04, DR-05 resolved via attendance hardening release v3 | Hafidz Musyafa Azmi |

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
| DR-01 | Backup DB otomatis belum dijadwalkan | Medium | High | HIGH | Manual `pg_dump` sebelum setiap migrasi; terdokumentasi di runbook | Tech Lead | Open |
| DR-02 | `npm install` (non-deterministik) dipakai di Docker build | High | Medium | HIGH | Dipulihkan ke `npm ci` di `frontend.Dockerfile` (commit `3060a55`) | Tech Lead | Resolved |
| DR-03 | `compose build --pull` dihapus — base image stale di production | Medium | Medium | MEDIUM | Flag `--pull` dipulihkan di `deploy-linux.sh` (commit `3060a55`) | Tech Lead | Resolved |
| DR-04 | Restriction role absensi tidak ada di backend | High | High | CRITICAL | Serializer guard ditambahkan (`attendance/serializers.py`), diuji, di-deploy sebagai `att-workflow-fix-v3` | Tech Lead | Resolved |
| DR-05 | Status `Sakit`/`Izin` bisa diakses Guru Pengampu via UI | High | High | CRITICAL | Frontend dibatasi ke `[Hadir, Alpa]` untuk Guru biasa; badge read-only untuk status terkunci (commit `87df1e3`) | Tech Lead | Resolved |
| DR-06 | `SECRET_KEY` atau kredensial DB ter-commit ke repo | Low | Critical | HIGH | Dicek: `.gitignore` mengecualikan `deploy/runtime/`; `.env.example` hanya placeholder; tidak ada secret di commit mana pun | Tech Lead | Verified |
| DR-07 | Deploy production tidak memvalidasi placeholder environment | Low | High | HIGH | `deploy-linux.sh` punya `grep` guard untuk string placeholder; exit code 1 jika ditemukan | Tech Lead | Verified |
| DR-08 | CSRF tidak diterapkan di mutation endpoint | Low | High | HIGH | `CsrfViewMiddleware` aktif; SPA init cookie via `CsrfCookieView` sebelum mutasi; diuji di `accounts/tests.py` | Backend | Verified |
| DR-09 | Upload endpoint menerima file oversized atau berbahaya | Low | Medium | MEDIUM | `MAX_UPLOAD_SIZE` diterapkan; MIME type divalidasi; upload di-throttle | Backend | Verified |
| DR-10 | Session cookie dikirim via HTTP | Low | High | HIGH | `SESSION_COOKIE_SECURE = True` di production; dikonfigurasi via runtime config | Backend | Verified |
| DR-11 | Bypass Cloudflare mengizinkan akses HTTP langsung ke origin | Low | Medium | MEDIUM | IP origin tidak terekspos publik; hanya IP Cloudflare yang diwhitelist di firewall | Tech Lead | Verified |
| DR-12 | Seed data menggantikan data production live secara tidak sengaja | Low | Critical | HIGH | Flag `--seed` dijaga dengan cek `user_count == 0`; abort jika ada user | Tech Lead | Verified |

---

## Risiko Terbuka — Action Required

### DR-01 — Backup DB Otomatis Belum Dijadwalkan

**Deskripsi:**
Tidak ada backup otomatis sebelum deploy. Runbook saat ini memerlukan `pg_dump` manual sebelum setiap `migrate`. Dalam skenario deploy cepat, langkah ini bisa terlewat.

**Mitigasi Saat Ini:**
- Runbook mewajibkan backup manual sebelum `manage.py migrate`
- Production hanya satu instance — risiko data loss jika migrasi gagal tanpa backup sebelumnya

**Rekomendasi Action:**
1. Tambahkan langkah `pg_dump` ke `deploy-linux.sh` sebelum menjalankan migrasi (dijaga dengan pengecekan file output backup)
2. Simpan backup di `/home/hafidz/apps/corelasi/backups/` dengan rotasi timestamp
3. Lacak via `S12-BE-01` di Sprint 12 (Deployment Preparation)

**Target Sprint:** Sprint 12 (S12-BE-01)
**Prioritas:** HIGH

---

## Risiko Resolved — Ringkasan Evidence

### DR-02 + DR-03 — Deploy Reproducibility (Resolved: 2026-06-15)

- **Commit:** `3060a55` — `fix(deploy): restore npm ci and --pull flag for reproducible builds`
- **Files:** `deploy/docker/frontend.Dockerfile`, `scripts/deploy-linux.sh`
- **Detail:** `npm install` tidak sengaja diperkenalkan di commit `87df1e3` selama sprint attendance fix. `npm ci` memerlukan kecocokan persis dengan `package-lock.json`, mencegah lockfile drift antar environment. `--pull` memastikan Docker selalu menggunakan base image terbaru, mencegah patch keamanan stale di base layer.

### DR-04 + DR-05 — Attendance Role Restriction (Resolved: 2026-06-15)

- **Backend Commit:** `87df1e3` — `fix(attendance): restore role-based attendance status rules`
- **Deployment:** Production release `20260615-att-workflow-fix-v3` (host `100.87.113.74`)
- **Evidence:** Backend unit tests 13/13 PASS; Frontend unit tests 104/104 PASS; E2E smoke test PASS
- **Business Rule:** Guru Pengampu -> `[Hadir, Alpa]` only. Guru Piket/Admin -> full status range. Ini domain rule dari kebijakan SMAT Baiturrahman, bukan bug — diklasifikasikan sebagai Sprint 9 access-control hardening.

### DR-06 — Secret Exposure (Verified: 2026-06-15)

- `.gitignore` telah direview: `deploy/runtime/`, `*.env`, `.postgres.env` dikecualikan
- Tidak ada secret ditemukan di file yang ter-commit
- `.env.example` dan `.postgres.env.example` hanya berisi string placeholder

---

## Metodologi Risk

**Likelihood:** Low = tidak mungkin dalam operasi normal | Medium = mungkin terjadi | High = kemungkinan terjadi tanpa mitigasi
**Impact:** Low = kosmetik/minor | Medium = layanan terdegradasi | High = data breach atau downtime | Critical = data loss atau security breach
**Severity:** Low | Medium | HIGH | CRITICAL

---

## Change History

| Tanggal | Perubahan | Author |
|---------|-----------|--------|
| 2026-06-15 | Risk register awal dibuat untuk review Sprint 9 | Hafidz Musyafa Azmi |
| 2026-06-15 | DR-02, DR-03 resolved via `3060a55` | Hafidz Musyafa Azmi |
| 2026-06-15 | DR-04, DR-05 resolved via attendance hardening release v3 | Hafidz Musyafa Azmi |

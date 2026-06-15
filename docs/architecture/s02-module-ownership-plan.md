# Sprint 02 Architecture and Module Ownership Plan

Jira task: PM-14  
Owner: Hafidz Musyafa Azmi  
Role: Tech Lead + Fullstack  
Sprint: Sprint 02 - Project Foundation and Scope Alignment

## Objective

Menetapkan rencana arsitektur, batas modul, kepemilikan file, dan aturan kerja GitHub agar pengerjaan CORELASI dapat berjalan paralel dengan risiko konflik yang rendah.

## Architecture Snapshot

CORELASI dibagi menjadi empat area utama:

| Area | Teknologi | Tanggung Jawab |
| --- | --- | --- |
| Backend API | Django, Django REST Framework | Auth, master akademik, jadwal, absensi, pembelajaran, jurnal, laporan, dan security hardening. |
| Frontend Web | React, TypeScript, Vite | Login, route guard, dashboard role, halaman administrasi, pembelajaran, absensi, dan laporan. |
| Database | PostgreSQL | Penyimpanan data production/demo, migrasi schema, seed demo, backup, dan restore. |
| Deployment | Docker Compose, Caddy, Linux service | Runtime production demo, reverse proxy, static files, health check, dan runbook operasional. |

## Module Ownership

| Role | Owner | Area Utama | Batas Perubahan |
| --- | --- | --- | --- |
| Tech Lead + Fullstack | Hafidz Musyafa Azmi | Root config, integrasi, deploy, release, merge, dokumentasi arsitektur | Boleh lintas modul untuk integrasi dan release. |
| Backend | Haafizd Alhabib Azwir | `corelasi-backend/apps/accounts`, `academic`, `schedules`, sebagian `config` | Tidak mengubah frontend tanpa koordinasi. |
| Backend | Gilang Tirta Kesumah | `attendance`, `learning`, `journals`, `reports`, `shared` | Koordinasi kontrak API dengan frontend. |
| Frontend | Fadhli Muhammad Dzaki | `corelasi-frontend/src`, `public`, frontend tests | Tidak mengubah model/API backend tanpa ticket. |
| UI/UX | Khansa Aulia Fauzah | Figma, user flow, prototype, design handoff, `docs/uiux` bila perlu | GitHub opsional hanya untuk catatan handoff. |
| QA | Nashbilla Nurfazza | Jira QA, test scenario, bug report, regression checklist, `docs/qa` | Tidak mengubah source code aplikasi. |

## Branch Strategy

| Branch | Fungsi |
| --- | --- |
| `main` | Release-ready branch. |
| `develop` | Integrasi hasil sprint sebelum release. |
| `feature/*` | Fitur lintas role atau pekerjaan fullstack. |
| `backend/*` | Pekerjaan backend per modul. |
| `frontend/*` | Pekerjaan frontend per modul. |
| `qa/*` | Dokumentasi dan evidence QA. |
| `docs/*` | Dokumentasi arsitektur, UI/UX handoff, dan planning formal. |

## Sprint 02 File Boundary

| Task | Branch/Artifact | File Scope |
| --- | --- | --- |
| S02-TL-01 | `feature/s02-project-foundation` | Root README, `.gitignore`, `.gitattributes`, folder scaffold, project context. |
| S02-TL-02 | `docs/s02-architecture-plan` | `docs/architecture/s02-module-ownership-plan.md`. |
| S02-UI-01 | Figma page `01 User Flow` | Figma/prototype evidence, optional `docs/uiux`. |
| S02-BE-01 | `backend/s02-api-contract` | Backend API contract documentation only. |
| S02-FE-01 | `frontend/s02-route-map` | Frontend route map documentation only. |
| S02-QA-01 | Jira QA artifact | QA strategy and acceptance checklist. |

## Conflict Prevention Rules

1. Satu task Jira dikerjakan pada satu branch atau satu artefak utama.
2. Setiap anggota hanya mengubah file sesuai module ownership.
3. Perubahan lintas role harus dicatat di komentar Jira sebelum merge.
4. Commit message mengikuti format conventional commit.
5. Tech Lead melakukan final review dan merge berurutan ke `develop`, lalu ke `main`.
6. Tidak ada force-push pada branch yang sudah dipakai anggota lain.

## Evidence for PM-14

Task PM-14 dianggap selesai jika evidence berikut tersedia:

| Evidence | Status |
| --- | --- |
| Dokumen arsitektur dan module ownership | Tersedia di file ini. |
| Branch dokumentasi Sprint 02 | `docs/s02-architecture-plan`. |
| Commit GitHub | `docs(project): prepare architecture and module ownership plan`. |
| Screenshot manual | Tampilan file ini di GitHub dan status task PM-14 di Jira. |

## Acceptance Note

Rencana ini menjadi dasar pembagian kerja tim mulai Sprint 02 sampai Sprint 13. UI/UX dan QA tetap memiliki kontribusi formal melalui Figma, Jira, dokumen QA, dan evidence pengujian meskipun tidak wajib mengubah source code aplikasi.

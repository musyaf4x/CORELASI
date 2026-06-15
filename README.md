# CORELASI

CORELASI adalah aplikasi administrasi akademik untuk SMAT Baiturrahman. Repository ini disiapkan untuk pengerjaan tim berbasis Jira Scrum, dengan pembagian role Tech Lead, Backend, Frontend, UI/UX, dan QA.

## Tujuan Repository

- Menyediakan struktur kerja awal untuk backend, frontend, dokumentasi, deployment, QA, dan asset.
- Menjadi basis kolaborasi GitHub yang mengikuti pembagian task Jira.
- Mengurangi konflik dengan pembagian file ownership per role.

## Struktur Awal

| Path | Fungsi | Owner Utama |
| --- | --- | --- |
| `corelasi-backend/` | Area implementasi backend Django/DRF | Backend |
| `corelasi-frontend/` | Area implementasi frontend React/Vite | Frontend |
| `docs/` | Dokumentasi project, arsitektur, QA, dan context | Tech Lead, QA, UI/UX |
| `deploy/` | Konfigurasi deployment dan runtime production | Tech Lead |
| `scripts/` | Script operasional project | Tech Lead |
| `icon/` | Asset branding dan icon aplikasi | UI/UX, Frontend |

## Alur Kerja

1. Ambil task dari Jira sesuai sprint dan role.
2. Buat branch sesuai nama branch di Jira.
3. Kerjakan hanya file yang termasuk scope task.
4. Commit dengan message yang disepakati di Jira.
5. Push branch ke GitHub.
6. Lampirkan link commit/branch dan evidence ke Jira.

## Aturan Dasar

- Jangan commit file `.env` asli atau credential.
- Jangan commit dependency lokal seperti `node_modules/` atau `.venv/`.
- Jangan mengubah file milik role lain tanpa koordinasi di Jira.
- Gunakan branch per task agar riwayat kontribusi tetap rapi.

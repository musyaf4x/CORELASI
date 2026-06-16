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

## Dokumentasi Setup dan Deployment

Panduan lengkap mengenai instalasi, konfigurasi database, integrasi Docker, serta petunjuk rilis produksi dapat dibaca pada dokumen utama:
👉 **[Installation and Deployment Guide](file:///docs/setup/INSTALLATION_AND_DEPLOYMENT_GUIDE.md)**

## Quick Start Lokal (SQLite)

### 1. Jalankan Backend
```bash
cd corelasi-backend
python -m venv .venv
# Aktifkan venv sesuai OS (cth: source .venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env
# Ubah DB_ENGINE=sqlite di dalam .env
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

### 2. Jalankan Frontend
```bash
cd corelasi-frontend
npm ci
cp .env.example .env
# Pastikan VITE_API_BASE_URL mengarah ke http://localhost:8000/api
npm run dev
```

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


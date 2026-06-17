# CORELASI Installation and Deployment Guide

## 1. Overview
Dokumen ini merupakan panduan lengkap untuk melakukan instalasi, konfigurasi, pengujian, serta deployment aplikasi **CORELASI** (Sistem Administrasi Akademik SMAT Baiturrahman) baik untuk lingkungan lokal (development/testing) maupun produksi (live).

### Target Pembaca
- Developer/Engineer yang ingin berkontribusi pada codebase.
- System Administrator / DevOps Engineer yang mengelola deployment server.
- Technical Writer / QA Engineer untuk verifikasi runnability sistem.

### Repository GitHub
- URL: `git@github.com:musyaf4x/CORELASI.git`

### Struktur Proyek
Aplikasi dibagi menjadi dua bagian utama:
1. **Backend (`corelasi-backend`)**: Dibangun dengan Django 5.2 & Django REST Framework (DRF) untuk API, JWT auth, database access, dan business logic.
2. **Frontend (`corelasi-frontend`)**: Dibangun menggunakan React (Vite, TypeScript, Tailwind CSS) untuk User Interface interaktif.
3. **Deployment (`deploy/` & root configuration)**: Berisi template docker-compose, config Caddy, environment file, dan service script.

---

## 2. Prerequisites
Sebelum memulai, pastikan sistem Anda telah memiliki komponen-komponen berikut:

- **Git**: Untuk clone repository.
- **Python (v3.10, v3.11, atau v3.12)**: Bahasa pemrograman backend.
- **Node.js (v20+ atau v22 LTS)** dan **npm**: Runtime & package manager frontend.
- **PostgreSQL (v16 atau v17)**: (Opsional untuk development, wajib untuk Docker/Production).
- **Docker & Docker Compose**: (Opsional, untuk containerized deployment).
- **Sistem Operasi**: Windows (dengan PowerShell/WSL2), macOS, atau Linux (Ubuntu 22.04/24.04).

---

## 3. Clone Repository
Lakukan clone repository dari GitHub dan masuk ke direktori proyek:
```bash
git clone git@github.com:musyaf4x/CORELASI.git
cd CORELASI
```

---

## 4. Backend Setup - SQLite Local
Pengaturan ini menggunakan basis data SQLite lokal (default dan sangat direkomendasikan untuk uji coba cepat tanpa harus setup PostgreSQL).

### Langkah-langkah:
1. Masuk ke direktori backend:
   ```bash
   cd corelasi-backend
   ```
2. Buat Python Virtual Environment (`.venv`):
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux (Bash)**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install package/requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Buat environment file lokal:
   Copy file `.env.example` menjadi `.env`.
   - **Windows (PowerShell)**:
     ```powershell
     Copy-Item .env.example .env
     ```
   - **macOS/Linux (Bash)**:
     ```bash
     cp .env.example .env
     ```
5. Sesuaikan parameter `.env` untuk SQLite:
   Buka file `.env` di text editor dan ubah nilai `DB_ENGINE` menjadi `sqlite`:
   ```ini
   DEBUG=True
   SECRET_KEY=django-insecure-corelasi-secret-key-1234567890-abcdef
   ALLOWED_HOSTS=localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   CSRF_TRUSTED_ORIGINS=http://localhost:5173
   CORS_ALLOW_CREDENTIALS=True
   
   # Ganti dari postgresql ke sqlite
   DB_ENGINE=sqlite
   
   # Parameter PostgreSQL di bawah ini akan diabaikan jika DB_ENGINE=sqlite
   SHOWCASE_MODE=True
   SHOWCASE_ACCOUNT_EMAILS=admin@corelasi.test,guru@corelasi.test,siswa@corelasi.test
   ```
6. Jalankan migrasi database:
   ```bash
   python manage.py migrate
   ```
7. Jalankan script seeding data demo/showcase:
   ```bash
   python manage.py seed_data
   ```
   *Perintah ini akan membuat data pengguna (Admin, Guru, Siswa), tahun ajaran, kelas, jadwal pelajaran, jurnal KBM, dan tugas simulasi.*
8. Jalankan server lokal:
   ```bash
   python manage.py runserver
   ```
9. **Endpoint Backend**: Server backend berjalan di `http://127.0.0.1:8000/` dengan API root di `/api/`.

---

## 5. Frontend Setup - Local
Pengaturan ini untuk menjalankan server development frontend yang akan terhubung dengan backend API lokal.

### Langkah-langkah:
1. Buka terminal baru dan masuk ke direktori frontend:
   ```bash
   cd corelasi-frontend
   ```
2. Install dependensi secara bersih (clean install):
   ```bash
   npm ci
   ```
3. Buat environment file lokal:
   Copy file `.env.example` menjadi `.env`.
   - **Windows (PowerShell)**:
     ```powershell
     Copy-Item .env.example .env
     ```
   - **macOS/Linux (Bash)**:
     ```bash
     cp .env.example .env
     ```
4. Pastikan file `.env` mengarah ke URL API backend yang benar:
   ```ini
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
5. Jalankan server development:
   ```bash
   npm run dev
   ```
   *Aplikasi web lokal dapat diakses melalui browser di alamat `http://localhost:5173/`.*
6. Untuk build aset produksi lokal:
   ```bash
   npm run build
   ```
7. Untuk menjalankan unit testing frontend:
   ```bash
   npm run test
   ```

---

## 6. Local Run Smoke Test
Setelah kedua server berjalan (backend di port 8000 dan frontend di port 5173), lakukan pengujian manual dengan langkah-barang berikut:

1. Buka browser dan arahkan ke `http://localhost:5173/`.
2. Halaman Login akan mendeteksi `SHOWCASE_MODE=True` dan menampilkan tombol **Quick Login / Akun Demo**.
3. Uji login untuk ketiga role utama:
   - **Admin Utama** (`admin@corelasi.test` / password `password123`):
     - Membuka Dashboard Admin.
     - Membuka menu Kelola Pengguna, Tahun Ajaran, Kelas, Jadwal Pelajaran.
     - Membuka tab Verifikasi Absensi (untuk menyetujui koreksi absen siswa).
   - **Guru Pengampu / Wali Kelas** (`guru@corelasi.test` / password `password123`):
     - Membuka Dashboard Guru.
     - Melakukan input absensi (Hadir/Alpa) untuk kelas X-A.
     - Menulis Jurnal Pertemuan KBM kelas.
     - Mengunggah materi belajar atau membuat tugas siswa.
   - **Siswa** (`siswa@corelasi.test` / password `password123`):
     - Membuka Dashboard Siswa.
     - Melihat grafik kehadiran personal.
     - Mengirim pengajuan koreksi kehadiran (absen) yang salah.
     - Mengunduh materi atau mengunggah file tugas (PDF/gambar).
4. Klik tombol **Logout** di pojok kanan atas, pastikan redirect kembali ke Halaman Login berjalan lancar dan state login dibersihkan sepenuhnya.

---

## 7. Backend Setup - PostgreSQL Local
Untuk lingkungan pengujian lokal yang lebih mendekati produksi, Anda dapat menggunakan PostgreSQL.

### Langkah-langkah:
1. Pastikan PostgreSQL server berjalan di mesin lokal Anda.
2. Buat database baru bernama `corelasi` dan user database bernama `corelasi_app` dengan password yang aman:
   ```sql
   CREATE DATABASE corelasi;
   CREATE USER corelasi_app WITH PASSWORD 'password_postgres_kamu';
   GRANT ALL PRIVILEGES ON DATABASE corelasi TO corelasi_app;
   ALTER DATABASE corelasi OWNER TO corelasi_app;
   ```
3. Update file `corelasi-backend/.env` Anda:
   ```ini
   DB_ENGINE=postgresql
   POSTGRES_DB=corelasi
   POSTGRES_USER=corelasi_app
   POSTGRES_PASSWORD=password_postgres_kamu
   DB_HOST=127.0.0.1
   DB_PORT=5432
   ```
4. Jalankan migrasi dan seeding:
   ```bash
   python manage.py migrate
   python manage.py seed_data
   ```
5. Jalankan server kembali dan pastikan tidak ada kegagalan koneksi.

---

## 8. Docker / Production-like Run
Aplikasi CORELASI dilengkapi dengan konfigurasi Docker Compose untuk menjalankan seluruh sistem (PostgreSQL, Django + Waitress, React + Vite Static, dan Caddy Proxy) secara otomatis.

### Langkah-langkah:
1. Pastikan Docker Daemon dan Docker Compose telah terinstall dan berjalan di mesin Anda.
2. Buat file `.env` di root directory (atau di dalam direktori `deploy/runtime/`):
   Copy `.postgres.env.example` ke `deploy/runtime/postgres.env` dan `deploy/runtime/backend.env.example` ke `deploy/runtime/backend.env` jika belum dibuat secara default.
3. Build container image:
   ```bash
   docker compose build
   ```
4. Jalankan container secara background (detached mode):
   ```bash
   docker compose up -d
   ```
5. Jalankan migrasi dan database seeding di dalam backend container:
   ```bash
   docker compose exec backend python manage.py migrate
   ```
6. Jalankan pengumpulan berkas statis (static files collection):
   ```bash
   docker compose exec backend python manage.py collectstatic --noinput
   ```
7. Seeding data jika diperlukan:
   ```bash
   docker compose exec backend python manage.py seed_data
   ```
8. **Health Check & Logs**:
   Periksa status container:
   ```bash
   docker compose ps
   ```
   Melihat logs container:
   ```bash
   docker compose logs -f
   ```

---

## 9. Production Deployment Live
Untuk melakukan deployment langsung pada server produksi berbasis Linux (misal: Ubuntu 24.04 LTS), ikuti pola deployment berikut:

### Alur Deployment:
1. **Pull Code Terkini**:
   Masuk ke direktori rilis/aplikasi server, lakukan pull dari main branch atau rilis tag tertentu:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Siapkan Environment Produksi**:
   Buat file `.env.production` (pastikan file ini aman dan tidak masuk ke repositori git). Isi dengan secret key produksi, password database asli yang rumit, domain name Anda, HTTPS settings, dan `SHOWCASE_MODE=False`.
3. **Backup Database**:
   Lakukan backup database lama sebelum menerapkan perubahan (lihat bagian Backup di bawah).
4. **Build & Restart Docker Service**:
   Jika menggunakan Docker Compose produksi:
   ```bash
   docker compose -f docker-compose.production.yml build
   docker compose -f docker-compose.production.yml down
   docker compose -f docker-compose.production.yml up -d
   ```
5. **Run Migrations & Collect Static**:
   ```bash
   docker compose -f docker-compose.production.yml exec backend python manage.py migrate --noinput
   docker compose -f docker-compose.production.yml exec backend python manage.py collectstatic --noinput
   ```
6. **Verify Domain & Smoke Test**:
   Lakukan verifikasi domain HTTPS dan jalankan script pengujian backend produksi:
   ```bash
   ./scripts/smoke-production.sh https://app.your-domain.example
   ```

---

## 10. Environment Variables Reference

Berikut adalah tabel referensi variabel lingkungan (environment variables) yang digunakan oleh aplikasi backend:

| Variable | Required | Example/Description | Environment |
| :--- | :--- | :--- | :--- |
| `DEBUG` | Ya | `True` (dev) atau `False` (prod). Menyalakan mode debug. | Semua |
| `SECRET_KEY` | Ya | String enkripsi acak minimal 50 karakter untuk keamanan token. | Semua |
| `ALLOWED_HOSTS` | Ya | Host yang diizinkan, dipisahkan koma, contoh: `localhost,app.your-domain.example`. | Semua |
| `CORS_ALLOWED_ORIGINS` | Ya | Origin yang diizinkan untuk request lintas domain. | Semua |
| `CSRF_TRUSTED_ORIGINS` | Ya | URL trusted domain untuk pengecekan CSRF token. | Semua |
| `DB_ENGINE` | Ya | Engine database: `sqlite` atau `postgresql`. | Semua |
| `POSTGRES_DB` | Tidak | Nama database PostgreSQL, contoh: `corelasi`. | PostgreSQL / Prod |
| `POSTGRES_USER` | Tidak | User database PostgreSQL, contoh: `corelasi_app`. | PostgreSQL / Prod |
| `POSTGRES_PASSWORD` | Tidak | Password user database PostgreSQL. | PostgreSQL / Prod |
| `DB_HOST` | Tidak | Host database, contoh: `127.0.0.1` atau `db` (dalam Docker). | PostgreSQL / Prod |
| `DB_PORT` | Tidak | Port database, contoh: `5432` atau `55432`. | PostgreSQL / Prod |
| `SHOWCASE_MODE` | Tidak | `True` jika ingin mengaktifkan tombol login demo instan di UI. | Dev / Demo |
| `SHOWCASE_ACCOUNT_EMAILS`| Tidak | Email demo yang diizinkan Quick Login, dipisahkan koma. | Dev / Demo |
| `LOG_FILE` | Tidak | Path file logs backend, contoh: `logs/corelasi.log`. | Semua |

*Catatan: Jangan pernah menulis kredensial/password asli di file template `.env.example`.*

---

## 11. Backup and Rollback

### Pembuatan Backup (Backup)
Untuk membackup database PostgreSQL produksi, gunakan tool `pg_dump`. Anda dapat menjalankan shell script yang telah disediakan:
```bash
./scripts/backup-production.sh
```
Atau manual via Docker:
```bash
docker compose exec db pg_dump -U corelasi_app -d corelasi > backup_$(date +%F).sql
```

### Pemulihan Data (Restore)
Untuk memulihkan data dari berkas SQL backup:
```bash
./scripts/restore-production.sh backup_filename.sql
```
Atau manual:
```bash
docker compose exec -T db psql -U corelasi_app -d corelasi < backup_filename.sql
```

### Prosedur Rollback Deploy
Jika rilis versi baru gagal atau crash pada saat deployment live:
1. Kembalikan kode aplikasi ke commit terakhir yang stabil:
   ```bash
   git checkout <hash-commit-stabil-sebelumnya>
   ```
2. Restart container atau server:
   ```bash
   docker compose down && docker compose up -d
   ```
3. Jika skema database berubah (migration rollback), pulihkan database ke kondisi backup pra-deployment:
   ```bash
   ./scripts/restore-production.sh backup_sebelum_deploy.sql
   ```
4. Jalankan kembali uji kelayakan (smoke test) untuk memastikan sistem kembali normal:
   ```bash
   ./scripts/smoke-production.sh https://app.your-domain.example
   ```

---

## 12. Troubleshooting

Berikut adalah solusi untuk kendala yang sering ditemui pada saat instalasi dan setup lokal:

### 1. `npm ci` Gagal
- **Penyebab**: Perbedaan versi npm lockfile atau folder `node_modules` lama masih tersisa.
- **Solusi**: Hapus folder `node_modules` dan file `package-lock.json` (bila diperlukan), lalu jalankan `npm install` sebagai alternatif. Pastikan versi Node.js minimal adalah v20+.

### 2. Migration Gagal
- **Penyebab**: Koneksi database terputus atau terdapat data konflik pada saat migrasi skema database.
- **Solusi**: Jika menggunakan SQLite, hapus file `db.sqlite3` dan ulangi `python manage.py migrate`. Jika menggunakan PostgreSQL, pastikan server database aktif dan user `corelasi_app` memiliki privilese penuh.

### 3. Kendala CORS / CSRF pada Login
- **Penyebab**: Origin frontend di `.env` backend tidak cocok dengan URL yang dibuka di browser.
- **Solusi**: Periksa `.env` backend. Pastikan `CORS_ALLOWED_ORIGINS` dan `CSRF_TRUSTED_ORIGINS` terisi tepat sama dengan alamat browser Anda (misalnya `http://localhost:5173` atau `http://127.0.0.1:5173`). Hilangkan trailing slash (`/`) di bagian akhir domain.

### 4. Redirect Login Mengarah ke Halaman Salah (Cross-Role Redirect Leak)
- **Penyebab**: URL asal (history/state) pengguna lain masih tersimpan setelah klik Logout.
- **Solusi**: Pastikan Anda menggunakan kode terbaru di `corelasi-frontend/src/app/router.tsx` yang telah ditambahi safeguard prefix check (`from.startsWith('/${user.role}/')`).

### 5. Tombol Quick Login Siswa Hilang / Gagal Login
- **Penyebab**: Akun `siswa@corelasi.test` tidak ditemukan di database atau email tersebut tidak terdaftar di variabel `SHOWCASE_ACCOUNT_EMAILS` pada file `.env`.
- **Solusi**: Jalankan kembali `python manage.py seed_data` untuk mengembalikan akun demo siswa. Periksa kembali isi file `.env` di backend, pastikan email `siswa@corelasi.test` ada di baris `SHOWCASE_ACCOUNT_EMAILS`.

### 6. Berkas Statis / Gambar Rusak setelah Deploy
- **Penyebab**: Django tidak melayani berkas statis secara default pada mode produksi (`DEBUG=False`).
- **Solusi**: Pastikan Anda telah menjalankan `python manage.py collectstatic --noinput` dan middleware **WhiteNoise** diaktifkan di `MIDDLEWARE` dalam `config/settings.py` untuk melayani file statis secara efisien tanpa web server terpisah.

---

## 13. Verification Checklist

Sebelum menyerahkan pekerjaan atau melakukan release, pastikan Anda mencentang checklist verifikasi berikut:

### Lingkungan Lokal SQLite
- [ ] Virtual environment berhasil dibuat dan diaktifkan.
- [ ] Seluruh package di `requirements.txt` terinstall tanpa error.
- [ ] Migrasi skema database SQLite (`python manage.py migrate`) berjalan sukses.
- [ ] Perintah `python manage.py seed_data` berjalan normal tanpa warning.
- [ ] Pengguna `admin@corelasi.test`, `guru@corelasi.test`, dan `siswa@corelasi.test` berhasil dibuat.
- [ ] Frontend berhasil di-install (`npm ci`) dan dijalankan (`npm run dev`).
- [ ] Login menggunakan tombol Quick Login berjalan normal tanpa 403/404.

### Lingkungan Lokal PostgreSQL
- [ ] Koneksi database PostgreSQL lokal terhubung dengan sukses.
- [ ] Skema database PostgreSQL berhasil dimigrasi dari awal.
- [ ] Seeding data demo berhasil dimasukkan ke PostgreSQL.
- [ ] Tes autentikasi dan otorisasi API berjalan lancar.

### Lingkungan Docker / WSL
- [ ] `docker compose build` berjalan normal.
- [ ] Seluruh service container (web, db, frontend) dalam status `healthy` atau `running`.
- [ ] Volume database PostgreSQL dan berkas statis (media/staticfiles) tersambung dengan benar.

### Deployment Produksi (Release Readiness)
- [ ] Parameter `DEBUG` diset ke `False`.
- [ ] `SECRET_KEY` diubah ke nilai produksi yang aman dan unik.
- [ ] `SHOWCASE_MODE` diset ke `False` (atau tetap `True` jika lingkungan demo).
- [ ] Backup otomatis terjadwal (systemd backup timer/cron) berjalan aktif.
- [ ] Domain utama terakses via HTTPS dengan sertifikat SSL valid.

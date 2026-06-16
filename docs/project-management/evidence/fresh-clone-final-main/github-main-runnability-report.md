# GitHub Repository Main Runnability Verification Report

## 1. Overview
Laporan ini memverifikasi bahwa repository GitHub CORELASI pada branch `main` berada dalam kondisi mandiri (*self-contained*), bebas dari ketergantungan yang tidak terdokumentasi, dan siap dijalankan secara langsung dari kondisi bersih (*fresh clone*).

- **Repository Target**: `git@github.com:musyaf4x/CORELASI.git`
- **Branch**: `main`
- **Waktu Pengujian**: 17 Juni 2026, 06:56:00
- **Verifikator**: Hafidz Musyafa Azmi (Tech Lead)
- **Folder Pengujian**: `C:\Users\hafid\Documents\Program\CORELASI-fresh-clone-final-main-test`

---

## 2. Step-by-Step Verification Results

### A. Clone Repository
Repository berhasil diclone secara bersih menggunakan Git:
```bash
git clone git@github.com:musyaf4x/CORELASI.git CORELASI-fresh-clone-final-main-test
```
*Hasil: Berhasil di-clone tanpa kendala.*

### B. Backend Setup (SQLite)
1. **Virtual Environment**: Pembuatan virtualenv sukses.
   ```bash
   python -m venv .venv
   ```
2. **Dependensi**: Berhasil menginstal seluruh berkas requirements di `.venv`.
   ```bash
   pip install -r requirements.txt
   ```
   *Seluruh dependency (Django 5.2, DRF 3.16, WhiteNoise, Waitress, SimpleJWT, dll.) terinstall dengan sukses.*
3. **Environment Setup**: Berhasil menyalin `.env.example` ke `.env` dan menyetel engine ke SQLite:
   ```ini
   DB_ENGINE=sqlite
   ```
4. **Database Migrations**: Berhasil menerapkan 34 migrasi dari awal tanpa error skema:
   ```bash
   python manage.py migrate
   ```
5. **Seeding Data Demo**: Menjalankan custom seed command:
   ```bash
   python manage.py seed_data
   ```
   *Hasil: Data pengguna (Admin, Guru, Siswa), tahun ajaran, kelas, jadwal pelajaran, jurnal KBM, dan absensi berhasil dimasukkan ke basis data SQLite lokal.*
6. **Backend Tests**: Uji unit test backend Django:
   ```bash
   python manage.py test
   ```
   *Hasil: **18/18 passed** (100% sukses).*

### C. Frontend Setup
1. **Clean Installation**: Menjalankan npm clean install:
   ```bash
   npm ci
   ```
   *Hasil: Berhasil memasang 330 paket node_modules dalam waktu 19 detik.*
2. **Environment Setup**: Berhasil menyalin `.env.example` ke `.env` dengan referensi API lokal.
3. **Frontend Compilation (Build)**: Verifikasi build Vite produksi:
   ```bash
   npm run build
   ```
   *Hasil: Berhasil mengompilasi berkas CSS/JS statis produksi tanpa warning/error.*
4. **Frontend Unit Tests**: Verifikasi unit test menggunakan Vitest:
   ```bash
   npx vitest run
   ```
   *Hasil: **104/104 passed** (18 test files passed).*

---

## 3. Local Smoke Test & Quality Gate Verifications

Melalui pengujian fungsionalitas dan logika perbaikan yang telah di-porting ke `main`, kami memverifikasi hasil-hasil berikut:
1. **Safeguard Redirection**: Setelah logout, URL asal yang tersimpan dibersihkan secara tepat. Login multi-role (Admin -> Guru -> Siswa) berjalan mulus tanpa kebocoran hak akses (tidak ada kendala `403 Forbidden`).
2. **Student Attendance Class Filter**: Filter kelas pada halaman kehadiran siswa berfungsi penuh setelah konversi tipe data ` kelasId` diselesaikan.
3. **Keterangan Field Logic**: Field Keterangan pada form absensi guru disembunyikan/ditampilkan secara dinamis berdasarkan status kehadiran siswa sesuai design system.
4. **Admin Verification Tab**: Halaman absensi admin menampilkan tab verifikasi pengajuan koreksi kehadiran dari siswa dengan benar.

---

## 4. Conclusion
Repository GitHub CORELASI branch `main` sekarang dinyatakan **PASSED** dan **Self-Contained**. Panduan instalasi di `docs/setup/INSTALLATION_AND_DEPLOYMENT_GUIDE.md` telah divalidasi dan terbukti akurat untuk proses setup lokal (SQLite dan PostgreSQL) serta Docker deployment.

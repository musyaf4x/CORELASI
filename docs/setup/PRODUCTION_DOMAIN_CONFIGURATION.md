# Production Domain Configuration Guide

## 1. Purpose
Dokumen ini menjelaskan langkah-langkah untuk mengonfigurasi nama domain kustom (*custom domain*) dan perutean jaringan untuk deployment sistem CORELASI di lingkungan produksi. Setiap penginstalan baru yang melakukan *fresh clone* harus menyiapkan domain produksi dan server mereka sendiri.

---

## 2. Choosing a Domain
Sebelum melakukan deployment produksi, Anda harus memiliki nama domain kustom yang terdaftar (contoh: `domain-anda.id`, `sekolah-anda.sch.id`, atau subdomain seperti `app.domain-anda.id`). 

Domain ini akan digunakan untuk mengarahkan pengguna (Admin, Guru, Siswa) ke antarmuka aplikasi web dan memfasilitasi komunikasi API yang aman.

---

## 3. DNS Setup Options
Berikut adalah beberapa opsi konfigurasi DNS untuk mengarahkan domain Anda ke server produksi:

### Opsi A: Direct A Record / CNAME ke VPS (Rekomendasi Umum)
1. Dapatkan IP publik statis dari VPS/Server Anda (contoh: `192.0.2.1`).
2. Masuk ke panel DNS manager domain Anda.
3. Tambahkan **A Record** baru:
   - Host: `app` (atau `@` untuk domain utama)
   - Value: `<IP_SERVER_PRODUKSI>`
   - TTL: Automatic / 3600
4. Konfigurasikan Caddy/Nginx di server untuk mendengarkan domain tersebut dan mengarahkan lalu lintas ke port container aplikasi.

### Opsi B: Ingress via Cloudflare Tunnel (Tanpa Buka Inbound Port)
1. Jalankan daemon `cloudflared` di server produksi Anda.
2. Buat tunnel baru dan kaitkan dengan akun Cloudflare Anda.
3. Konfigurasikan tunnel untuk mengarahkan lalu lintas dari `https://app.domain-anda.id` ke port reverse proxy lokal (contoh: `http://localhost:8080` yang melayani Caddy).
4. Cloudflare akan secara otomatis membuatkan CNAME record yang mengarah ke tunnel tersebut.

### Opsi C: Akses Private Fallback (Tailscale)
Jika aplikasi hanya ingin diakses melalui jaringan privat virtual (VPN):
1. Install Tailscale di server produksi dan mesin pengguna.
2. Aktifkan **Tailscale MagicDNS**.
3. Gunakan hostname Tailscale server (contoh: `nama-server.tail12345.ts.net`) sebagai domain akses aplikasi.

---

## 4. Required Environment Variables
Variabel lingkungan produksi berikut wajib dikonfigurasi menggunakan nama domain kustom Anda di server backend (`backend.env` atau file `.env.production` Anda).

### Backend Configuration
```ini
# Ubah sesuai domain produksi Anda
ALLOWED_HOSTS=app.domain-anda.id,nama-server.tail12345.ts.net,localhost,127.0.0.1,backend

# Origin frontend yang diizinkan melakukan request API
CORS_ALLOWED_ORIGINS=https://app.domain-anda.id,https://nama-server.tail12345.ts.net

# Domain tepercaya untuk verifikasi CSRF token
CSRF_TRUSTED_ORIGINS=https://app.domain-anda.id,https://nama-server.tail12345.ts.net
```

### Frontend Configuration
Di server web frontend atau saat melakukan kompilasi aset produksi frontend, pastikan variabel berikut disetel ke domain API produksi Anda:
```ini
VITE_API_BASE_URL=https://app.domain-anda.id/api
```

---

## 5. TLS / HTTPS Requirement
Aplikasi CORELASI mewajibkan koneksi terenkripsi **HTTPS** di produksi demi menjaga keamanan data pengguna, sesi token JWT, dan file media.

- **Caddy Server**: Jika menggunakan docker compose bawaan dengan Caddy, Caddy akan secara otomatis menerbitkan sertifikat SSL Let's Encrypt gratis untuk domain Anda jika server terhubung langsung ke internet publik.
- **Cloudflare SSL**: Jika menggunakan Cloudflare Tunnel, sertifikat SSL akan ditangani secara otomatis di tingkat Cloudflare edge proxy.
- **HSTS (HTTP Strict Transport Security)**: Sistem telah menyalakan HSTS secara default. Jangan pernah mengakses domain produksi melalui HTTP biasa karena request akan otomatis dialihkan ke HTTPS.

---

## 6. Smoke Test After Deployment
Setelah deployment selesai, jalankan script pengujian kelayakan menggunakan domain produksi baru Anda untuk memastikan rilis berjalan normal:
```bash
./scripts/smoke-production.sh https://app.domain-anda.id
```

---

## 7. Pre-Deployment Checklist
Sebelum melepas versi produksi ke pengguna, pastikan Anda mencentang checklist domain berikut:
- [ ] Domain kustom aktif dan mengarah ke IP Server/Tunnel yang benar.
- [ ] Sertifikat SSL/TLS valid dan dimuat tanpa warning di browser.
- [ ] Variabel `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, dan `CSRF_TRUSTED_ORIGINS` di backend telah mencakup domain produksi tersebut.
- [ ] Variabel `VITE_API_BASE_URL` di frontend mengarah ke domain produksi API dengan HTTPS.
- [ ] Pengujian `smoke-production.sh` menghasilkan status sukses (*passed*).

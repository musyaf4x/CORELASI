# 08 Editor Brief

## Ringkasan Perubahan yang Disarankan

Bagian SRS lama yang aman dipertahankan:

- Struktur utama dokumen SRS: Pendahuluan, Deskripsi Keseluruhan Sistem, Kebutuhan Antarmuka, Kebutuhan Fungsional, Diagram, dan Kebutuhan Non-Fungsional.
- Enam grup requirement lama: `FR-AKS`, `FR-ADM`, `FR-JWL`, `FR-ABS`, `FR-PMB`, dan `FR-JRN`.
- Role utama `Admin`, `Guru`, dan `Siswa`.
- Modul inti: akun, administrasi akademik, jadwal, absensi, pembelajaran/penilaian, jurnal, dan rekap.
- Narasi akademik formal untuk konteks SMAT Baiturrahman.

Bagian yang wajib diperbarui:

- Jelaskan bahwa `Guru Pengampu`, `Guru Piket`, dan `Wali Kelas` adalah penugasan/scope di bawah role `Guru`, bukan role login terpisah.
- Perbarui autentikasi: login memakai CSRF, JWT access token, refresh cookie aman, logout, refresh session, dan change password.
- Tambahkan aturan self-delete: admin/superuser tidak dapat menghapus akun dirinya sendiri.
- Perbarui reset password: implementasi aktual berupa permintaan reset password dan resolve menjadi temporary password.
- Perbarui administrasi akademik: user punya `kelas`, kelas punya `wali_kelas`, jadwal piket memakai `JadwalPiket`.
- Perbarui absensi: ada batch absensi, override admin, permintaan koreksi, dan verifikasi koreksi.
- Perbarui pembelajaran: materi, tugas, upload file, submission, late status, grade 0-100, dan feedback.
- Perbarui laporan: sebut laporan/rekap absensi, nilai, dan operasional; jangan klaim export file bila belum dibuktikan.
- Perbarui NFR security, session, upload limitation, backup/recovery, dan reliability secara ringkas.

Bagian dari implementasi yang jangan dimasukkan ke SRS karena terlalu teknis:

- Detail Cloudflare Tunnel, Tailscale Serve, WSL2, systemd user service, Docker healthcheck, Caddy config, release path, scheduled task Windows, dan command deployment.
- Password, token, secret, atau kredensial apa pun.
- Detail test report angka penuh kecuali dokumen SRS memang membutuhkan ringkasan readiness.
- `SRS_CORELASI_Final_New(updated).md` sebagai struktur final. File itu hanya pembanding dan terlalu jauh dari baseline lama.

Risiko jika SRS lama tidak diperbarui:

- Dokumen akan menyebut fitur yang tidak tepat, misalnya role akademik seolah role login terpisah.
- Klaim export, semester aktif tepat satu, atau membership semester bisa berlebihan dibanding bukti implementasi.
- Security/session production yang penting tidak tercermin dalam NFR.
- Tim QA/UI/UX dapat membuat test case atau artefak yang tidak selaras dengan software aktual.

Risiko jika SRS diubah terlalu jauh:

- SRS berubah menjadi runbook/deployment note, bukan dokumen requirement akademik.
- Kode requirement lama hilang sehingga traceability ke tugas/kuliah dan test report menjadi rusak.
- Editor dokumen akan sulit mempertahankan gaya dan struktur formal SRS lama.

## Prinsip Penulisan Final

- Pertahankan struktur lama.
- Pertahankan gaya bahasa formal akademik.
- Pertahankan kode requirement lama.
- Update hanya bagian yang terbukti tidak sesuai implementasi.
- Jangan mengubah SRS menjadi runbook, README, release note, atau production handoff.
- Jika detail implementasi terlalu teknis, masukkan sebagai catatan NFR ringkas atau `DO NOT IMPORT`.
- Untuk klaim yang belum terbukti, gunakan wording konservatif atau tandai perlu cek manual.

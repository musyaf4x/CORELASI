# Software Requirements Specification — CORELASI

**Sistem:** Collaborative Resource & Learning System (CORELASI)  
**Institusi:** SMAT Baiturrahman  
**Versi:** 1.0  
**Disusun oleh:**
- 103022300162 — Hafidz Musyafa Azmi
- 103022300126 — Khansa Aulia Fauzah
- 103022300062 — Nashbilla Nurfazza
- 103022330068 — Fadhli Muhammad Dzaki
- 103022330077 — Gilang Tirta Kesumah
- 103022330089 — Haafizd Alhabib Azwir

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
   - 1.1 Tujuan Penulisan Dokumen
   - 1.2 Lingkup Masalah
   - 1.3 Definisi, Istilah dan Singkatan
   - 1.4 Referensi
   - 1.5 Deskripsi Umum Dokumen (Ikhtisar)
2. [Deskripsi Keseluruhan Sistem](#2-deskripsi-keseluruhan-sistem)
   - 2.1 Deskripsi Umum Sistem
   - 2.2 Penggolongan Karakteristik Pengguna
   - 2.3 Lingkungan Operasi
   - 2.4 Batasan Desain dan Implementasi
3. [Deskripsi Kebutuhan](#3-deskripsi-kebutuhan)
   - 3.1 Kebutuhan Antarmuka Eksternal
   - 3.2 Kebutuhan Fungsional
   - 3.3 Kebutuhan Non-Fungsional

---

# 1. Pendahuluan

## 1.1 Tujuan Penulisan Dokumen

Dokumen Software Requirements Specification (SRS) ini disusun untuk mendefinisikan kebutuhan perangkat lunak CORELASI secara jelas, terstruktur, dan dapat ditelusuri. Dokumen ini menjadi acuan resmi bagi tim pengembang, dosen pembimbing, dan pihak sekolah dalam proses analisis, perancangan, implementasi, pengujian, serta evaluasi hasil pengembangan sistem.

Melalui dokumen ini, seluruh pihak yang terlibat memiliki pemahaman yang sama mengenai tujuan sistem, ruang lingkup fungsi, batasan operasional, kebutuhan antarmuka, kebutuhan fungsional, kebutuhan non-fungsional, serta relasi antar artefak pemodelan yang digunakan. Dengan demikian, dokumen SRS berperan sebagai dasar kendali ruang lingkup sekaligus penghubung antara kebutuhan pengguna dan perancangan sistem.

## 1.2 Lingkup Masalah

CORELASI dikembangkan untuk menjawab permasalahan operasional di SMAT Baiturrahman yang berkaitan langsung dengan administrasi akademik dan pembelajaran berbasis web. Fokus sistem diarahkan pada proses yang paling sering terjadi dalam kegiatan sekolah sehari-hari, sehingga pengembangan sistem tetap relevan terhadap kebutuhan nyata dan tidak melebar ke fungsi yang tidak esensial.

**Masalah utama:**

- Pencatatan dan rekap absensi siswa masih belum terpusat sehingga rawan keterlambatan rekap, duplikasi data, dan kesalahan input.
- Aktivitas pembelajaran digital masih tersebar pada beberapa media, sehingga guru dan siswa harus berpindah-pindah platform untuk materi, tugas, dan hasil belajar.
- Manajemen akun pengguna serta pembagian peran kerja sekolah belum tertata rapi dalam satu sistem yang konsisten.
- Informasi jadwal, jurnal pembelajaran, nilai, dan riwayat absensi belum tersaji dalam satu alur operasional yang mudah dipantau oleh pihak yang berwenang.
- SMAT Baiturrahman memerlukan akses informasi akademik yang lebih cepat, akurat, dan mudah dipahami oleh Admin, Guru, dan Siswa pada semester berjalan.

**Ruang lingkup sistem** mencakup: manajemen akun dan akses, administrasi akademik, pengelolaan semester aktif, jadwal pembelajaran, absensi berbasis web, LMS ringan untuk materi sederhana dan tugas, submission sederhana, penilaian sederhana, jurnal pertemuan, serta rekap operasional yang dapat diekspor untuk kebutuhan absensi dan nilai.

**Di luar ruang lingkup:** aplikasi mobile atau PWA, absensi berbasis QR, integrasi portal orang tua atau API eksternal, pengelolaan riwayat akademik lengkap siswa non-aktif, audit log sistem yang rinci, repository materi multi-file, multi-file submission dan version history, penilaian berbobot kompleks, rapor otomatis, serta fitur e-learning lanjutan seperti forum diskusi dan kuis interaktif.

## 1.3 Definisi, Istilah dan Singkatan

| Istilah | Definisi |
|---------|----------|
| SRS/SKPL | Software Requirements Specification atau Spesifikasi Kebutuhan Perangkat Lunak |
| CORELASI | Collaborative Resource & Learning System |
| Admin | Pengguna yang bertanggung jawab mengelola akun, struktur akademik, semester aktif, jadwal, monitoring operasional, serta override administratif |
| Guru | Pengguna yang menjalankan aktivitas absensi, pembelajaran, penilaian sederhana, dan jurnal pertemuan |
| Siswa | Pengguna yang mengakses materi, melihat tugas, mengirim submission, serta melihat nilai dan absensi pribadi |
| Guru Pengampu | Penugasan Guru yang bertanggung jawab atas kelas dan mata pelajaran tertentu, termasuk pencatatan absensi awal per sesi |
| Guru Piket | Penugasan Guru yang menangani status sakit, izin, alpa, dan koreksi absensi rutin |
| Wali Kelas | Penugasan Guru yang memantau kehadiran, nilai, dan kelengkapan jurnal pada kelas perwaliannya |
| Semester Aktif | Semester tunggal yang sedang berjalan dan menjadi fokus operasi sistem |
| LMS Ringan | Modul pembelajaran berbasis web yang mencakup materi sederhana, tugas, submission sederhana, dan penilaian dasar |
| Rekap Operasional | Ringkasan data absensi, nilai, dan jurnal pada semester aktif |
| FR | Functional Requirement atau kebutuhan fungsional |
| NFR | Non-Functional Requirement atau kebutuhan non-fungsional |

## 1.4 Referensi

- IEEE Std 830-1998, IEEE Recommended Practice for Software Requirements Specifications.
- Template dokumen SRS Telkom University.
- Hasil observasi, wawancara, dan diskusi kebutuhan operasional di lingkungan SMAT Baiturrahman.
- Hasil kuesioner kebutuhan pengguna yang melibatkan guru dan siswa.

## 1.5 Deskripsi Umum Dokumen (Ikhtisar)

Dokumen ini terdiri atas tiga bab utama:

- **Bab 1** — Tujuan penulisan, lingkup masalah, definisi istilah, referensi, dan ikhtisar susunan dokumen.
- **Bab 2** — Deskripsi keseluruhan sistem: gambaran umum produk, karakteristik pengguna, lingkungan operasi, serta batasan desain dan implementasi.
- **Bab 3** — Kebutuhan sistem: antarmuka eksternal, kebutuhan fungsional, use case diagram, activity diagram, class diagram, sequence diagram, serta kebutuhan non-fungsional.

---

# 2. Deskripsi Keseluruhan Sistem

## 2.1 Deskripsi Umum Sistem

CORELASI adalah sistem informasi berbasis web yang dirancang untuk mendukung administrasi akademik dan pembelajaran di SMAT Baiturrahman dalam satu lingkungan digital yang terintegrasi. Sistem ini memusatkan pengelolaan akun, struktur akademik, jadwal pembelajaran, absensi, materi dan tugas, penilaian, jurnal pertemuan, serta rekap operasional.

CORELASI dibangun sebagai aplikasi web tunggal dengan modul berbasis peran:
- **Admin** — Fondasi data dan pengaturan akademik.
- **Guru** — Proses operasional kelas sesuai penugasan (Guru Pengampu, Guru Piket, Wali Kelas).
- **Siswa** — Mengikuti kegiatan belajar dan memantau hasil akademik.

### Ruang Lingkup Fungsional

| Modul | Fungsi Utama |
|-------|-------------|
| Akun dan Akses | Autentikasi, profil baca-saja, perubahan kata sandi, kontrol akses berbasis peran |
| Administrasi Akademik | Mengelola data pengguna, penugasan peran, struktur akademik, dan semester aktif |
| Jadwal Pembelajaran | Menyusun dan menyesuaikan jadwal berdasarkan kelas, guru, dan mata pelajaran |
| Absensi | Mencatat absensi awal per sesi, koreksi rutin, override administratif, rekap sesuai scope |
| Pembelajaran dan Penilaian | Materi sederhana, tugas dengan mode submission tunggal, penilaian tugas, feedback, nilai manual |
| Jurnal dan Rekap Operasional | Jurnal pertemuan serta ringkasan data operasional dan ekspor absensi/nilai |

## 2.2 Penggolongan Karakteristik Pengguna

| Kategori | Tugas Utama | Hak Akses Utama |
|----------|-------------|-----------------|
| **Admin** | Mengelola akun, data akademik, semester aktif, jadwal, rekap operasional, override administratif | Akses penuh ke seluruh modul; ekspor absensi/nilai lintas kelas |
| **Guru Pengampu** | Absensi awal per sesi, materi dan tugas, nilai sederhana, jurnal pertemuan | Akses ke kelas-mapel yang diampu; rekap/ekspor hanya untuk kelas-mapel yang diajar |
| **Guru Piket** | Status sakit/izin/alpa, koreksi absensi rutin, pemantauan operasional harian | Koreksi absensi dan rekap operasional sesuai kewenangan piket |
| **Wali Kelas** | Memantau kehadiran, nilai, kelengkapan jurnal pada kelas perwalian | Akses baca rekap absensi/nilai/jurnal kelas perwalian; ekspor untuk kelas perwalian |
| **Siswa** | Mengakses materi, tugas, submission, melihat nilai dan absensi pribadi | Akses ke kelas pembelajaran yang diikutinya; tidak ada fitur ekspor |

## 2.3 Lingkungan Operasi

| Aspek | Rincian |
|-------|---------|
| Platform utama | Aplikasi web tunggal berbasis peran, diakses melalui browser desktop |
| Perangkat pengguna | Laptop/PC untuk semua pengguna; mobile hanya pelengkap |
| Sistem operasi | Windows 10+, distribusi Linux modern, atau macOS |
| Browser | Google Chrome, Microsoft Edge, Mozilla Firefox (dua rilis stabil terbaru) |
| Lingkungan server | Web server + basis data relasional |
| Jaringan | Jaringan lokal sekolah atau internet dengan koneksi stabil dan HTTPS |

## 2.4 Batasan Desain dan Implementasi

| Batasan | Implikasi |
|---------|-----------|
| Aplikasi web tunggal | Seluruh fungsi inti melalui browser; tidak ada mobile app/PWA |
| Semester aktif tunggal | Operasi difokuskan pada satu semester aktif |
| Materi sederhana | Setiap materi: satu sumber utama (tautan eksternal atau satu file lampiran) |
| Submission sederhana | Satu mode submission per tugas: teks singkat, satu tautan, atau satu file lampiran |
| Penilaian dasar | Penilaian tugas, feedback singkat, nilai manual tanpa formula bobot kompleks |
| Tanpa integrasi eksternal | Tidak bergantung pada portal orang tua, Google Classroom API, atau platform eksternal |
| Peran guru sebagai penugasan | Guru Pengampu, Guru Piket, Wali Kelas = penugasan hak akses di bawah entitas Guru |
| Keamanan dasar wajib | HTTPS, password hash, akses berbasis peran, validasi input |

---

# 3. Deskripsi Kebutuhan

## 3.1 Kebutuhan Antarmuka Eksternal

### 3.1.1 Antarmuka Pemakai

Antarmuka disesuaikan per pengguna:

| Pengguna | Komponen Antarmuka | Karakteristik |
|----------|-------------------|---------------|
| Admin | Dashboard administrasi, data pengguna, struktur akademik, jadwal, rekap | Hierarkis, berorientasi tabel dan formulir, pencarian, filter, aksi kelola data |
| Guru | Dashboard kelas, absensi, materi, tugas, penilaian, jurnal, rekap | Konteks kelas dan mata pelajaran, operasional harian tanpa berpindah modul |
| Siswa | Dashboard pembelajaran, materi, tugas, status submission, nilai, absensi | Sederhana, fokus kegiatan belajar, form pengumpulan sesuai mode tugas |

### 3.1.2 Antarmuka Perangkat Keras

Tidak memerlukan perangkat keras khusus. Interaksi melalui keyboard, mouse/touchpad, layar monitor, koneksi jaringan. Printer opsional untuk cetak ekspor.

### 3.1.3 Antarmuka Perangkat Lunak

- **Klien:** Browser web.
- **Server:** Aplikasi web + basis data relasional.
- **Keluaran:** File ekspor operasional (spreadsheet/berkas siap unduh).

### 3.1.4 Antarmuka Komunikasi

- Protokol HTTPS di atas TCP/IP.
- Request/response aplikasi web untuk login, pemuatan data, penyimpanan absensi, pengumpulan tugas, penilaian, ekspor.
- Unggah jawaban tugas: data formulir + satu file lampiran secara aman.
- Semua komunikasi autentikasi, data pribadi, dan data akademik wajib terlindungi.

## 3.2 Kebutuhan Fungsional

### Tabel Keterelusuran Permasalahan, Modul, dan Use Case

| Permasalahan Utama | Modul Terkait | Use Case |
|--------------------|--------------|----------|
| Pencatatan dan rekap absensi belum terpusat | Absensi, Jadwal, Rekap Operasional | UC05, UC06, UC10, UC11 |
| Pembelajaran digital tersebar di banyak media | Pembelajaran dan Penilaian | UC07, UC08, UC09 |
| Manajemen akun dan peran belum tertata | Akun dan Administrasi Akademik | UC01, UC02, UC03, UC04 |
| Informasi jadwal, jurnal, dan nilai sulit dipantau | Jadwal, Penilaian, Jurnal, Rekap | UC05, UC09, UC10, UC11 |
| Sekolah memerlukan informasi akademik cepat dan akurat | Rekap Operasional | UC10 |

### FR-AKS: Modul Akun dan Akses

| Kode | Deskripsi | Aktor |
|------|-----------|-------|
| FR-AKS-01 | Verifikasi kredensial login untuk Admin, Guru, dan Siswa | Admin, Guru, Siswa |
| FR-AKS-02 | Arahkan pengguna ke dashboard sesuai peran setelah autentikasi berhasil | Admin, Guru, Siswa |
| FR-AKS-03 | Setiap pengguna dapat melihat profilnya sendiri; identitas formal dan atribut akademik/admin baca-saja | Admin, Guru, Siswa |
| FR-AKS-04 | Setiap pengguna dapat mengubah kata sandi secara mandiri | Admin, Guru, Siswa |
| FR-AKS-05 | Akses fitur dibatasi berdasarkan peran utama dan penugasan peran akademik | Seluruh peran |

### FR-ADM: Modul Administrasi Akademik

| Kode | Deskripsi | Aktor |
|------|-----------|-------|
| FR-ADM-01 | Admin dapat menambah, mengubah, menonaktifkan, dan mengaktifkan kembali akun pengguna | Admin |
| FR-ADM-02 | Admin dapat mereset kata sandi pengguna | Admin |
| FR-ADM-03 | Admin dapat mengelola penugasan Guru Piket dan Wali Kelas | Admin |
| FR-ADM-04 | Admin dapat mengelola data tahun ajaran, semester, kelas, dan mata pelajaran | Admin |
| FR-ADM-05 | Admin dapat menetapkan tepat satu semester aktif pada satu waktu | Admin |
| FR-ADM-06 | Admin dapat mengelola keanggotaan siswa pada kelas di semester aktif | Admin |

### FR-JWL: Modul Jadwal Pembelajaran

| Kode | Deskripsi | Aktor |
|------|-----------|-------|
| FR-JWL-01 | Admin dapat menyusun jadwal pembelajaran per kelas, mata pelajaran, guru, hari, dan jam pada semester aktif | Admin |
| FR-JWL-02 | Admin dapat mengubah, membatalkan, atau menyesuaikan sesi jadwal | Admin |
| FR-JWL-03 | Sistem menampilkan jadwal kepada pengguna sesuai peran dan keterkaitan kelasnya | Admin, Guru, Siswa |

### FR-ABS: Modul Absensi

| Kode | Deskripsi | Aktor |
|------|-----------|-------|
| FR-ABS-01 | Guru Pengampu mencatat kehadiran awal siswa secara manual per sesi pembelajaran | Guru Pengampu |
| FR-ABS-02 | Guru Piket menangani status sakit/izin/alpa dan koreksi absensi rutin; Admin override administratif pada kondisi khusus | Guru Piket, Admin |
| FR-ABS-03 | Sistem menyimpan riwayat absensi per siswa, kelas, dan semester aktif | Sistem |
| FR-ABS-04 | Sistem menampilkan rekap dan riwayat absensi berdasarkan scope tanggung jawab pengguna | Admin, Guru Pengampu, Guru Piket, Wali Kelas, Siswa |
| FR-ABS-05 | Ekspor rekap absensi hanya untuk Admin, Guru Pengampu, dan Wali Kelas sesuai scope | Admin, Guru Pengampu, Wali Kelas |

### FR-PMB: Modul Pembelajaran dan Penilaian

| Kode | Deskripsi | Aktor |
|------|-----------|-------|
| FR-PMB-01 | Guru Pengampu mengelola materi sederhana dengan satu sumber utama (tautan eksternal atau file lampiran) | Guru Pengampu |
| FR-PMB-02 | Guru Pengampu membuat/memperbarui tugas dengan instruksi, deadline, status publikasi, satu mode submission | Guru Pengampu |
| FR-PMB-03 | Siswa mengakses materi dan tugas yang dipublikasikan pada kelas yang diikutinya | Siswa |
| FR-PMB-04 | Siswa mengirim/memperbarui satu submission aktif per tugas sesuai mode; submission setelah deadline berstatus Late | Siswa |
| FR-PMB-05 | Guru Pengampu melihat status pengumpulan tugas siswa | Guru Pengampu |
| FR-PMB-06 | Guru Pengampu memberi nilai tugas dan feedback singkat | Guru Pengampu |
| FR-PMB-07 | Guru Pengampu memasukkan nilai manual sederhana untuk komponen offline dan menyimpan nilai akhir operasional | Guru Pengampu |
| FR-PMB-08 | Siswa melihat nilai dan feedback yang telah dipublikasikan | Siswa |
| FR-PMB-09 | Ekspor rekap nilai hanya untuk Admin, Guru Pengampu, dan Wali Kelas sesuai scope | Admin, Guru Pengampu, Wali Kelas |

### FR-JRN: Modul Jurnal dan Rekap Operasional

| Kode | Deskripsi | Aktor |
|------|-----------|-------|
| FR-JRN-01 | Guru Pengampu mengisi jurnal pertemuan untuk sesi pembelajaran yang dijalankan | Guru Pengampu |
| FR-JRN-02 | Admin dan Wali Kelas memantau kelengkapan dan isi jurnal pertemuan | Admin, Wali Kelas |
| FR-JRN-03 | Sistem menyediakan rekap akademik operasional yang menggabungkan data absensi, nilai, dan jurnal berdasarkan scope | Sistem |
| FR-JRN-04 | Filter rekap berdasarkan kelas, mata pelajaran, pengguna, dan periode pada semester aktif (hanya pilihan dalam scope) | Sistem |

### 3.2.1 Use Case Diagram

| ID | Use Case | Aktor | FR Terkait |
|----|----------|-------|------------|
| UC01 | Autentikasi Pengguna | Admin, Guru, Siswa | FR-AKS-01, FR-AKS-02 |
| UC02 | Lihat Profil dan Ubah Kata Sandi | Admin, Guru, Siswa | FR-AKS-03, FR-AKS-04 |
| UC03 | Kelola Pengguna dan Penugasan Peran | Admin | FR-ADM-01 s.d. FR-ADM-03 |
| UC04 | Kelola Struktur Akademik dan Semester Aktif | Admin | FR-ADM-04 s.d. FR-ADM-06 |
| UC05 | Kelola Jadwal Pembelajaran | Admin | FR-JWL-01 s.d. FR-JWL-03 |
| UC06 | Kelola Absensi Kelas | Guru Pengampu, Guru Piket, Admin | FR-ABS-01 s.d. FR-ABS-04 |
| UC07 | Kelola Materi dan Tugas Pembelajaran | Guru Pengampu | FR-PMB-01, FR-PMB-02 |
| UC08 | Akses Materi dan Kumpulkan Tugas | Siswa | FR-PMB-03, FR-PMB-04 |
| UC09 | Kelola Penilaian | Guru Pengampu | FR-PMB-05 s.d. FR-PMB-08 |
| UC10 | Lihat Rekap Akademik Operasional | Admin, Guru Pengampu, Guru Piket, Wali Kelas, Siswa | FR-ABS-04, FR-PMB-09, FR-JRN-03, FR-JRN-04 |
| UC10a | Ekspor Rekap Absensi *(extend UC10)* | Admin, Guru Pengampu, Wali Kelas | FR-ABS-05 |
| UC10b | Ekspor Rekap Nilai *(extend UC10)* | Admin, Guru Pengampu, Wali Kelas | FR-PMB-09 |
| UC11 | Isi dan Monitor Jurnal Pertemuan | Guru Pengampu, Admin, Wali Kelas | FR-JRN-01, FR-JRN-02 |

### 3.2.2 Activity Diagram

Merujuk pada diagram aktivitas untuk masing-masing use case:

- **UC01** — Autentikasi Pengguna
- **UC02** — Lihat Profil dan Ubah Kata Sandi
- **UC03** — Kelola Pengguna dan Penugasan Peran
- **UC04** — Kelola Struktur Akademik dan Semester Aktif
- **UC05** — Kelola Jadwal Pembelajaran
- **UC06** — Kelola Absensi Kelas
- **UC07** — Kelola Materi dan Tugas Pembelajaran
- **UC08** — Akses Materi dan Kumpulkan Tugas
- **UC09** — Kelola Penilaian
- **UC10** — Lihat Rekap Akademik Operasional
- **UC11** — Isi dan Monitor Jurnal Pertemuan

### 3.2.3 Class Diagram

Class diagram konseptual menunjukkan struktur utama domain CORELASI:

- **Pengguna** sebagai dasar identitas, diturunkan ke **Guru** dan **Siswa**.
- Struktur akademik: **TahunAjaran**, **Semester**, **Kelas**, **MataPelajaran**, **KeanggotaanKelas**.
- Seluruh aktivitas operasional (absensi, materi, tugas, penilaian, jurnal) berelasi terhadap **JadwalPembelajaran** sebagai konteks utama.

### 3.2.4 Sequence Diagram

Sequence diagram untuk alur interaksi kritis:

1. Autentikasi Pengguna
2. Kelola Jadwal Pembelajaran
3. Kelola Absensi Kelas
4. Kelola Materi dan Tugas
5. Kelola Penilaian
6. Rekap Akademik Operasional
7. Isi Jurnal Pertemuan

## 3.3 Kebutuhan Non-Fungsional

| No | Parameter | Deskripsi |
|----|-----------|-----------|
| 1 | Availability | Tersedia selama jam operasional sekolah; dapat diakses kembali tanpa konfigurasi ulang saat server aktif |
| 2 | Reliability | Data absensi, tugas, nilai, dan jurnal konsisten; tidak boleh menghasilkan data duplikat saat kegagalan |
| 3 | Usability | Antarmuka konsisten, mudah dipahami, tugas utama selesai tanpa pelatihan teknis kompleks |
| 4 | Performance | Respons login, dashboard, simpan absensi, dan penilaian dalam rentang wajar pada koneksi sekolah stabil |
| 5 | Portability | Berjalan pada browser modern di Windows, Linux, dan macOS tanpa instalasi tambahan |
| 6 | Compatibility | Mendukung Chrome, Edge, dan Firefox pada dua versi stabil terbaru |
| 7 | Security | HTTPS, password hash, akses berbasis peran, validasi input |
| 8 | Maintainability | Struktur modul, penamaan, dan dokumentasi konsisten agar perubahan dapat ditelusuri |
| 9 | Backup & Recovery | Data akademik dapat dicadangkan berkala dan dipulihkan saat gangguan server/database |
| 10 | Safety | Tidak ada kebutuhan keselamatan fisik yang bersifat kritis |

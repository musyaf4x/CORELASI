# Manual Test Cases

Environment:

```text
Application URL:
Browser:
Tester:
Date:
Build/Commit:
```

| Test Case ID | Modul | Scenario | Preconditions | Steps | Expected Result | Status | Jira Bug |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC-AUTH-001 | Auth | Login admin berhasil | Akun admin aktif | 1. Buka `/login` 2. Login sebagai admin | Sistem masuk ke dashboard admin | Not Run |  |
| TC-AUTH-002 | Auth | Login guru berhasil | Akun guru aktif | 1. Buka `/login` 2. Login sebagai guru | Sistem masuk ke dashboard guru | Not Run |  |
| TC-AUTH-003 | Auth | Login siswa berhasil | Akun siswa aktif | 1. Buka `/login` 2. Login sebagai siswa | Sistem masuk ke dashboard siswa | Not Run |  |
| TC-AUTH-004 | Auth | Role guard menolak route lain | User guru login | 1. Akses `/admin/dashboard` | Sistem menampilkan akses ditolak atau redirect aman | Not Run |  |
| TC-AUTH-005 | Auth | Ganti password valid | User login | 1. Buka change password 2. Isi password lama dan baru valid 3. Submit | Password berhasil diubah | Not Run |  |
| TC-AUTH-006 | Auth | Ganti password invalid | User login | 1. Isi password lama salah atau password baru lemah | Sistem menampilkan error validasi | Not Run |  |
| TC-ADM-001 | Akademik | Admin membuat user guru | Admin login | 1. Buka users 2. Create guru 3. Simpan | User guru tampil di daftar | Not Run |  |
| TC-ADM-002 | Akademik | Admin membuat user siswa | Admin login | 1. Buka users 2. Create siswa dengan kelas 3. Simpan | User siswa tampil dengan kelas | Not Run |  |
| TC-ADM-003 | Akademik | Admin membuat kelas | Admin login | 1. Buka academic 2. Tambah kelas 3. Simpan | Kelas baru tampil | Not Run |  |
| TC-ADM-004 | Akademik | Admin membuat mata pelajaran | Admin login | 1. Buka academic 2. Tambah mapel 3. Simpan | Mapel baru tampil | Not Run |  |
| TC-SCH-001 | Jadwal | Admin membuat jadwal pelajaran | Admin login; data kelas/mapel/guru ada | 1. Buka schedules 2. Tambah jadwal | Jadwal tampil di admin | Not Run |  |
| TC-SCH-002 | Jadwal | Guru melihat jadwalnya | Guru punya jadwal | 1. Login guru 2. Buka jadwal | Jadwal guru tampil | Not Run |  |
| TC-SCH-003 | Jadwal | Siswa melihat jadwal kelas | Siswa punya kelas | 1. Login siswa 2. Buka jadwal | Jadwal kelas siswa tampil | Not Run |  |
| TC-ATT-001 | Absensi | Guru input absensi kelas | Guru pengampu login | 1. Buka absensi 2. Isi status siswa 3. Simpan | Absensi tersimpan | Not Run |  |
| TC-ATT-002 | Absensi | Siswa melihat riwayat absensi | Siswa punya absensi | 1. Login siswa 2. Buka absensi | Riwayat absensi tampil | Not Run |  |
| TC-ATT-003 | Absensi | Siswa mengajukan koreksi absensi | Siswa login | 1. Buka absensi 2. Ajukan koreksi | Koreksi tercatat | Not Run |  |
| TC-ATT-004 | Absensi | Admin/guru piket verifikasi koreksi | Koreksi pending | 1. Login admin/guru piket 2. Verify koreksi | Status koreksi terverifikasi | Not Run |  |
| TC-LRN-001 | Learning | Guru membuat materi | Guru pengampu login | 1. Buka materi 2. Tambah materi 3. Simpan | Materi tampil | Not Run |  |
| TC-LRN-002 | Learning | Guru membuat tugas | Guru pengampu login | 1. Buka tugas 2. Tambah tugas 3. Simpan | Tugas tampil | Not Run |  |
| TC-LRN-003 | Learning | Upload file valid | File PDF/JPG/PNG/DOCX valid | 1. Upload file saat membuat materi/tugas | File diterima | Not Run |  |
| TC-LRN-004 | Learning | Upload file invalid ditolak | File tidak didukung | 1. Upload file invalid | Sistem menolak file | Not Run |  |
| TC-SUB-001 | Submission | Siswa submit tugas | Tugas publish untuk kelas siswa | 1. Login siswa 2. Buka tugas 3. Submit file | Submission tersimpan | Not Run |  |
| TC-SUB-002 | Submission | Submit tanpa file ditolak | Tugas tersedia | 1. Submit tanpa file | Sistem menampilkan error | Not Run |  |
| TC-GRD-001 | Grading | Guru memberi nilai valid | Submission tersedia | 1. Login guru 2. Buka grading 3. Isi nilai 0-100 | Nilai tersimpan | Not Run |  |
| TC-GRD-002 | Grading | Nilai di luar range ditolak | Submission tersedia | 1. Isi nilai >100 atau <0 | Sistem menolak nilai | Not Run |  |
| TC-JRN-001 | Jurnal | Guru membuat jurnal | Guru login | 1. Buka jurnal 2. Tambah jurnal | Jurnal tersimpan | Not Run |  |
| TC-RPT-001 | Laporan | Admin melihat laporan absensi | Data absensi ada | 1. Login admin 2. Buka laporan absensi | Laporan tampil | Not Run |  |
| TC-RPT-002 | Laporan | Admin melihat laporan nilai | Data nilai ada | 1. Login admin 2. Buka laporan nilai | Laporan tampil | Not Run |  |
| TC-RPT-003 | Laporan | Admin melihat laporan operasional | Data operasional ada | 1. Login admin 2. Buka laporan operasional | Laporan tampil | Not Run |  |
| TC-REG-001 | Regression | Logout lalu login role lain | Pernah login admin | 1. Logout admin 2. Login guru 3. Cek dashboard | Tidak muncul state akses role lama | Not Run |  |
| TC-REG-002 | Regression | Refresh halaman dashboard | User login | 1. Refresh halaman dashboard | Session tetap valid atau diarahkan aman | Not Run |  |

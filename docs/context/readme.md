Saya sedang menyiapkan pembaruan dokumen SRS CORELASI berdasarkan codebase terbaru.

Tugas Anda **bukan menulis ulang SRS**. Tugas Anda hanya membuat **SRS Implementation Context Pack** yang akan diberikan ke editor dokumen untuk memperbarui SRS lama secara konservatif.

## Prinsip utama

SRS lama adalah baseline yang harus dipertahankan. Jangan mengubah kerangka SRS, jangan membuat SRS baru, dan jangan mengganti sistem requirement lama.

Saya hanya ingin mengetahui:

1. Bagian mana dari SRS lama yang masih sesuai.
2. Bagian mana yang perlu diperbarui karena implementasi software sudah berbeda.
3. Fitur aktual apa saja yang benar-benar ada di codebase.
4. Bukti codebase untuk setiap temuan.

## File baseline SRS lama

Gunakan SRS lama sebagai acuan struktur dan requirement:

* `SRS_CORELASI_Final_New.md`
* atau versi docx ekuivalen bila tersedia.

Jangan gunakan `SRS_CORELASI_Final_New(updated).md` sebagai baseline final. File itu hanya contoh pembanding yang terlalu banyak bergeser dari struktur SRS lama.

## Output yang harus dibuat

Buat folder:

`srs-context-pack/`

Isi folder tersebut dengan file berikut:

---

# 1. `01_feature_inventory.md`

Buat inventaris fitur aktual berdasarkan codebase.

Format wajib:

| Modul | Fitur Aktual | Aktor | Status Implementasi | Bukti Codebase |
| ----- | ------------ | ----- | ------------------- | -------------- |

Modul harus mengikuti modul SRS lama:

* Akun dan Akses
* Administrasi Akademik
* Jadwal Pembelajaran
* Absensi
* Pembelajaran dan Penilaian
* Jurnal dan Rekap Operasional

Untuk setiap fitur, sertakan bukti berupa:

* path file,
* nama function/class/component/model/view/serializer,
* endpoint jika ada,
* route frontend jika ada.

Jangan menulis klaim tanpa bukti codebase.

---

# 2. `02_delta_against_old_srs.md`

Bandingkan implementasi aktual dengan SRS lama.

Format wajib:

| Section SRS Lama | Kode Requirement Lama | Isi Lama Ringkas | Kondisi Implementasi Aktual | Status | Rekomendasi Perubahan | Bukti Codebase |
| ---------------- | --------------------- | ---------------- | --------------------------- | ------ | --------------------- | -------------- |

Status hanya boleh salah satu:

* `KEEP` = masih sesuai, jangan ubah.
* `UPDATE` = struktur lama benar, tapi detail perlu disesuaikan.
* `ADD` = ada fitur aktual yang belum tertulis di SRS lama, masukkan ke section lama yang paling relevan.
* `REMOVE/OUTDATED` = isi lama sudah tidak sesuai software jadi.
* `DO NOT IMPORT` = ada detail implementasi, tapi terlalu teknis untuk SRS akademik sehingga cukup disimpan di runbook/handoff, bukan dimasukkan ke SRS.

Penting:

* Jangan mengganti kode requirement lama seperti `FR-AKS`, `FR-ADM`, `FR-JWL`, `FR-ABS`, `FR-PMB`, dan `FR-JRN`.
* Jika ada fitur baru, rekomendasikan masuk ke grup lama yang paling cocok.
* Jangan membuat kode requirement baru kecuali benar-benar tidak bisa dimasukkan ke grup lama.

---

# 3. `03_roles_and_access_matrix.md`

Petakan role dan hak akses aktual.

Format wajib:

| Role / Penugasan | Fitur yang Bisa Diakses | Fitur yang Dilarang | Guard/Permission yang Mengatur | Bukti Codebase |
| ---------------- | ----------------------- | ------------------- | ------------------------------ | -------------- |

Role minimal:

* Admin
* Guru
* Siswa
* Guru Pengampu, jika ada sebagai penugasan
* Guru Piket, jika ada sebagai penugasan
* Wali Kelas, jika ada sebagai penugasan
* Superuser/operator, jika memang ada di implementasi

Jelaskan apakah Guru Pengampu, Guru Piket, dan Wali Kelas merupakan role terpisah atau penugasan di bawah Guru.

---

# 4. `04_routes_and_api_map.md`

Petakan route frontend dan endpoint backend aktual.

Buat dua tabel.

## Frontend Routes

| Route | Role yang Boleh Mengakses | Fungsi Halaman | Component/Page | Bukti Codebase |
| ----- | ------------------------- | -------------- | -------------- | -------------- |

## Backend API

| Endpoint | Method | Modul | Aktor/Role | Fungsi | Handler/View/Serializer | Bukti Codebase |
| -------- | ------ | ----- | ---------- | ------ | ----------------------- | -------------- |

Jangan memasukkan endpoint yang tidak ada di codebase.

---

# 5. `05_data_model_summary.md`

Ringkas model data/domain yang relevan untuk SRS.

Format wajib:

| Entitas/Model | Field Utama | Relasi Penting | Modul Terkait | Bukti Codebase |
| ------------- | ----------- | -------------- | ------------- | -------------- |

Fokus pada entitas seperti:

* User/account
* Role/profile
* Tahun ajaran
* Semester
* Kelas
* Mata pelajaran
* Jadwal
* Jadwal piket
* Absensi
* Koreksi absensi
* Materi
* Tugas
* Submission
* Nilai
* Jurnal
* Laporan/rekap

Hanya sertakan yang benar-benar ada di codebase.

---

# 6. `06_non_functional_evidence.md`

Petakan kebutuhan non-fungsional aktual berdasarkan implementasi.

Format wajib:

| Kategori NFR | Kondisi Aktual | Relevan Masuk SRS? | Rekomendasi Penulisan SRS | Bukti Codebase/Config |
| ------------ | -------------- | ------------------ | ------------------------- | --------------------- |

Kategori minimal:

* Security
* Authentication/session
* Authorization/RBAC
* Data validation
* File upload limitation
* Performance
* Reliability/recovery
* Backup/restore, jika ada
* Compatibility/browser
* Maintainability
* Logging/monitoring, jika ada

Catatan:

* Jangan menulis detail runbook terlalu panjang.
* Detail seperti Docker, Cloudflare Tunnel, Tailscale, systemd, WSL2, domain production, dan scheduled task hanya diberi label `DO NOT IMPORT` kecuali memang perlu disebut ringkas pada lingkungan operasi atau NFR.

---

# 7. `07_out_of_scope_and_limitations.md`

Buat daftar fitur yang **tidak ada** atau **di luar scope**.

Format wajib:

| Item | Status | Alasan | Bukti/Ketiadaan di Codebase | Rekomendasi untuk SRS |
| ---- | ------ | ------ | --------------------------- | --------------------- |

Cek minimal:

* Mobile native
* PWA
* Parent portal
* QR/RFID/biometric attendance
* Integrasi Google Classroom/API eksternal
* Notifikasi email/WhatsApp production
* Audit trail penuh
* Multi-school tenancy
* LMS lanjutan seperti forum, kuis interaktif, video streaming
* Rapor otomatis
* Penilaian berbobot kompleks
* Multi-file submission/version history

---

# 8. `08_editor_brief.md`

Buat ringkasan untuk editor SRS.

Format:

## Ringkasan Perubahan yang Disarankan

Tulis bullet singkat:

* Bagian SRS lama yang aman dipertahankan.
* Bagian yang wajib diperbarui.
* Bagian dari implementasi yang jangan dimasukkan ke SRS karena terlalu teknis.
* Risiko jika SRS lama tidak diperbarui.
* Risiko jika SRS diubah terlalu jauh.

## Prinsip Penulisan Final

Tulis instruksi:

* Pertahankan struktur lama.
* Pertahankan gaya bahasa formal akademik.
* Pertahankan kode requirement lama.
* Update hanya bagian yang terbukti tidak sesuai implementasi.
* Jangan mengubah SRS menjadi runbook, README, release note, atau production handoff.

---

## Aturan kualitas

1. Semua klaim harus punya bukti codebase.
2. Jangan mengarang fitur.
3. Jangan menulis ulang SRS final.
4. Jangan membuat requirement taxonomy baru.
5. Jangan mengganti nama role tanpa alasan kuat dari codebase.
6. Jangan memasukkan detail deployment secara berlebihan.
7. Bila ada hal yang tidak jelas, tulis sebagai `UNCERTAIN` dan jelaskan file mana yang perlu dicek manual.
8. Gunakan bahasa Indonesia formal dan ringkas.

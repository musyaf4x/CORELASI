# 07 Out Of Scope And Limitations

| Item | Status | Alasan | Bukti/Ketiadaan di Codebase | Rekomendasi untuk SRS |
| ---- | ------ | ------ | --------------------------- | --------------------- |
| Mobile native | Tidak ada | Tidak ditemukan project Android/iOS/native mobile. | `rg --files` menunjukkan frontend React web dan backend Django; tidak ada Gradle/Xcode/React Native/Flutter project. | Tetap tulis di luar scope. |
| PWA | Tidak ada/UNCERTAIN | Tidak ditemukan service worker/manifest PWA sebagai fitur utama dari evidence yang dibaca. | Perlu cek manual `frontend/public` jika editor ingin klaim final; tidak muncul di route/API utama. | Jangan klaim PWA; tulis web responsive/browser modern saja. |
| Parent portal | Tidak ada | Role utama hanya admin/guru/siswa. | `accounts/models.py`: `ROLE_CHOICES` admin/guru/siswa; `frontend/src/app/router.tsx` hanya admin/guru/siswa. | Tetap di luar scope. |
| QR/RFID/biometric attendance | Tidak ada | Absensi manual/batch/koreksi; tidak ada integrasi hardware/QR. | `attendance/views.py`: create/batch/override/verify; tidak ada endpoint QR/RFID/biometric. | Tetap di luar scope. |
| Integrasi Google Classroom/API eksternal | Tidak ada | Tidak ditemukan service integrasi eksternal pembelajaran. | `learning/views.py` memakai model internal dan `file_url`; tidak ada client Google Classroom. | Tetap di luar scope. |
| Notifikasi email/WhatsApp production | Tidak ada | Reset password menghasilkan temporary password di response; tidak terlihat email/WhatsApp sender. | `accounts/views.py`: `PasswordResetRequestViewSet.resolve`; tidak terlihat SMTP/WhatsApp integration pada evidence. | Tetap di luar scope atau backlog. |
| Audit trail penuh | Tidak ada | Model domain tidak menunjukkan tabel audit/event log umum. | Tidak ditemukan model `AuditLog`/history global; `AbsensiSiswa.status_awal` hanya konteks absensi. | Jangan klaim audit trail penuh; boleh tulis pencatatan perubahan terbatas bila relevan. |
| Multi-school tenancy | Tidak ada | Tidak ditemukan entitas sekolah/tenant yang membatasi seluruh data. | Model akademik dimulai dari tahun ajaran/kelas/mapel; tidak ada model `School`/`Tenant`. | Tetap di luar scope. |
| LMS lanjutan: forum | Tidak ada | Tidak ditemukan model/route forum atau diskusi. | `learning/models.py` hanya `Materi`, `Tugas`, `Submission`. | Tetap di luar scope. |
| LMS lanjutan: kuis interaktif | Tidak ada | Tidak ditemukan model quiz/question/answer. | `learning/models.py` tidak memuat quiz; route frontend tidak ada quiz. | Tetap di luar scope. |
| LMS lanjutan: video streaming | Tidak ada | Materi mendukung `file_url`/source sederhana, bukan streaming. | `learning/models.py`: `Materi.source_type`, `file_url`; `FileUploadView` hanya file dokumen/gambar. | Tetap di luar scope. |
| Rapor otomatis | Tidak ada/terbatas | Ada laporan nilai, tetapi tidak terlihat generator rapor formal otomatis. | `reports/views.py`: `GradeReportView`; tidak ada model/template rapor. | Jangan klaim rapor otomatis; tulis rekap nilai. |
| Penilaian berbobot kompleks | Tidak ada/terbatas | Nilai utama pada `Submission.grade`; nilai manual UI ada, model bobot kompleks tidak terlihat. | `learning/models.py`: `Submission.grade`; `frontend/src/pages/guru/ManualGradingPage.tsx`; tidak ada model bobot. | Tulis penilaian sederhana/manual, bukan grading weighted kompleks. |
| Multi-file submission/version history | Tidak ada | Submission punya satu `file_url` dan `update_or_create`; tidak ada versioning table. | `learning/models.py`: `Submission.file_url`; `learning/views.py`: `SubmissionViewSet.create`. | Tulis satu submission aktif per tugas. |
| Export file laporan | UNCERTAIN | SRS lama menyebut ekspor; backend report endpoints terlihat mengembalikan data API, bukan bukti export file. | `reports/views.py`: report API; perlu cek halaman report/service jika editor ingin memastikan export. | Gunakan istilah "laporan/rekap"; hanya tulis export bila UI/service terbukti. |
| Semester aktif tepat satu | UNCERTAIN | Ada `Semester.status`, tetapi enforcement exactly-one active belum terlihat dari file yang dibaca. | `academic/models.py`, `academic/serializers.py`: status dan validasi tanggal/overlap; tidak tampak constraint exactly-one active. | Revisi wording menjadi "mengelola semester aktif" kecuali enforcement ditemukan. |

Keterbatasan implementasi yang sebaiknya ditulis hati-hati:

1. Role akademik tambahan adalah penugasan guru, bukan role login tersendiri.
2. Laporan nilai/absensi/operasional ada, tetapi klaim export formal perlu bukti UI/service tambahan.
3. Detail production sudah matang, tetapi sebagian besar tidak perlu masuk SRS final kecuali ringkas di lingkungan operasi.

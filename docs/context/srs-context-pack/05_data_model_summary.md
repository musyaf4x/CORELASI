# 05 Data Model Summary

| Entitas/Model | Field Utama | Relasi Penting | Modul Terkait | Bukti Codebase |
| ------------- | ----------- | -------------- | ------------- | -------------- |
| `User` | `email`, `name`, `role`, `status`, `nip_or_nis`, `gender`, `phone_number`, `angkatan`, `is_pengampu`, `is_piket_today`, `is_wali_kelas` | FK `kelas` ke `Kelas`; role utama admin/guru/siswa. | Akun dan Akses, Administrasi Akademik | `corelasi-backend/apps/accounts/models.py`: `User`; `accounts/serializers.py`: `UserDetailSerializer`. |
| `PasswordResetRequest` | `user`, `requested_at`, `status` | FK ke `User`. | Akun dan Akses | `accounts/models.py`: `PasswordResetRequest`; `accounts/views.py`: `PasswordResetRequestViewSet`. |
| `TahunAjaran` | `name`, `status`, `tanggal_mulai`, `tanggal_selesai` | Dipakai `Semester` dan `Kelas`. | Administrasi Akademik | `academic/models.py`: `TahunAjaran`. |
| `Semester` | `name`, `status`, `tanggal_mulai`, `tanggal_selesai` | FK `tahun_ajaran`; dipakai jadwal. | Administrasi Akademik, Jadwal | `academic/models.py`: `Semester`; `academic/serializers.py`: `SemesterSerializer`. |
| `Kelas` | `name`, `tingkat` | FK `wali_kelas` ke guru; FK `tahun_ajaran`; FK dari `User.kelas`, jadwal, absensi, materi, tugas, jurnal. | Administrasi Akademik | `academic/models.py`: `Kelas`; `accounts/models.py`: `User.kelas`. |
| `MataPelajaran` | `name`, `kode` | Dipakai jadwal, absensi, materi, tugas, jurnal. | Administrasi Akademik, Jadwal, Pembelajaran | `academic/models.py`: `MataPelajaran`. |
| `JadwalPelajaran` | `kelas`, `mapel`, `guru`, `hari`, `waktu_mulai`, `waktu_selesai`, `semester` | FK ke `Kelas`, `MataPelajaran`, guru `User`, `Semester`; menjadi basis `can_teach_subject`. | Jadwal Pembelajaran | `schedules/models.py`: `JadwalPelajaran`; `shared/access.py`: `can_teach_subject`. |
| `JadwalPiket` | `guru`, `hari`, `semester` | FK guru `User`, FK `Semester`; menjadi basis `is_duty_teacher`. | Jadwal Pembelajaran, Absensi | `schedules/models.py`: `JadwalPiket`; `shared/access.py`: `is_duty_teacher`. |
| `AbsensiSiswa` | `siswa`, `kelas`, `mapel`, `tanggal`, `status`, `status_awal`, `keterangan` | FK siswa `User`, `Kelas`, optional `MataPelajaran`; dipakai laporan absensi. | Absensi | `attendance/models.py`: `AbsensiSiswa`; `attendance/views.py`: `AbsensiSiswaViewSet`. |
| `PermintaanKoreksi` | `siswa`, `kelas`, `mapel_name`, `status_semula`, `status_koreksi`, `keterangan`, `verified`, `tanggal` | FK siswa `User`, FK `Kelas`; saat verify dapat membuat/update `AbsensiSiswa`. | Absensi | `attendance/models.py`: `PermintaanKoreksi`; `attendance/views.py`: `PermintaanKoreksiViewSet.verify`. |
| `Materi` | `title`, `description`, `source_type`, `file_url`, `date_created`, `status` | FK `Kelas`, `MataPelajaran`, guru `User`. | Pembelajaran dan Penilaian | `learning/models.py`: `Materi`; `learning/views.py`: `MateriViewSet`. |
| `Tugas` | `title`, `description`, `file_url`, `due_date`, `date_created`, `status` | FK `Kelas`, `MataPelajaran`, guru `User`; parent dari `Submission`. | Pembelajaran dan Penilaian | `learning/models.py`: `Tugas`; `learning/views.py`: `TugasViewSet`. |
| `Submission` | `tugas`, `siswa`, `submit_date`, `file_url`, `status`, `grade`, `feedback` | FK `Tugas`, siswa `User`; nilai/feedback berada di model ini. | Pembelajaran dan Penilaian | `learning/models.py`: `Submission`; `learning/views.py`: `SubmissionViewSet`. |
| Nilai | Tidak ada model nilai terpisah yang ditemukan; nilai tugas disimpan sebagai `Submission.grade`, `Submission.feedback`. | Relasi melalui `Submission -> Tugas -> Kelas/Mapel/Guru`. | Pembelajaran dan Penilaian, Rekap | `learning/models.py`: `Submission`; `reports/views.py`: `GradeReportView`. |
| `JurnalPertemuan` | `date`, `agenda`, `material_summary`, `present_count`, `absent_count`, `notes` | FK `Kelas`, `MataPelajaran`, guru `User`. | Jurnal dan Rekap Operasional | `journals/models.py`: `JurnalPertemuan`; `journals/views.py`: `JurnalPertemuanViewSet`. |
| Laporan/Rekap | Tidak tampak sebagai model persistent terpisah; laporan dihitung dari model domain. | Membaca `AbsensiSiswa`, `Submission/Tugas`, `User`, `JurnalPertemuan`, dan data akademik terkait. | Jurnal dan Rekap Operasional | `reports/views.py`: `AttendanceReportView`, `GradeReportView`, `OperationalReportView`. |

Catatan untuk editor SRS:

1. Jangan menulis `KeanggotaanKelas` sebagai model implementasi aktual; yang terlihat adalah `User.kelas` dan `Kelas.tahun_ajaran`.
2. Jangan menulis `Guru`, `Siswa`, dan `Admin` sebagai tabel/model turunan terpisah; implementasi memakai satu model `User` dengan field `role`.
3. Jangan menulis model nilai akhir kompleks bila tidak diperlukan; implementasi nilai utama berada pada `Submission.grade`.

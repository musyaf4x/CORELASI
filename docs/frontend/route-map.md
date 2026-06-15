# Corelasi Frontend - Route Map

Dokumen ini berisi peta rute (routing) lengkap yang ada di aplikasi **Corelasi Frontend** berdasarkan konfigurasi Router di `src/app/router.tsx` dan `src/app/lazyPages.ts`.

---

##  Rute Publik & Autentikasi
Rute-rute berikut dapat diakses tanpa login atau digunakan untuk penanganan error.

| Path | Komponen Halaman | Deskripsi |
| :--- | :--- | :--- |
| `/login` | `LoginPage` | Halaman utama untuk login pengguna |
| `/403` | `Error403Page` | Halaman error ketika akses ditolak (Forbidden) |
| `/` | `AppShell` | Rute root utama (otomatis redirect ke `/login`) |

---

## Rute Admin (`/admin/...`)
Hanya dapat diakses oleh pengguna dengan role **`admin`**. Memakai `RoleLayout` sebagai pelindung (guard).

| Path | Komponen Halaman | File Halaman | Deskripsi |
| :--- | :--- | :--- | :--- |
| `/admin/dashboard` | `AdminDashboard` | `@/pages/admin/AdminDashboard` | Dashboard overview untuk admin |
| `/admin/users` | `UsersPage` | `@/pages/admin/UsersPage` | Daftar seluruh pengguna sistem |
| `/admin/users/create` | `UserFormPage` | `@/pages/admin/UserFormPage` | Form membuat user baru |
| `/admin/users/:id` | `UserDetailPage` | `@/pages/admin/UserDetailPage` | Informasi detail data user |
| `/admin/users/:id/edit`| `UserFormPage` | `@/pages/admin/UserFormPage` | Form mengedit data user |
| `/admin/academic` | `AcademicPage` | `@/pages/admin/AcademicPage` | Manajemen data akademik (tahun ajaran, dll) |
| `/admin/schedules` | `AdminSchedulesPage`| `@/pages/admin/SchedulesPage` | Manajemen jadwal pelajaran |
| `/admin/duty-schedules`| `AdminDutySchedulesPage`| `@/pages/admin/DutySchedulesPage`| Manajemen jadwal piket guru |
| `/admin/attendance` | `AdminAttendancePage` | `@/pages/admin/AttendancePage` | Monitoring absensi guru/siswa |
| `/admin/journals` | `AdminJournalsPage` | `@/pages/admin/JournalsPage` | Monitoring jurnal pembelajaran |
| `/admin/reports/attendance`| `AdminAttendanceReportsPage`| `@/pages/admin/AttendanceReportsPage`| Laporan kehadiran global |
| `/admin/reports/grades`| `AdminGradeReportsPage`| `@/pages/admin/GradeReportsPage`| Rekapitulasi laporan nilai |
| `/admin/reports/operational`| `AdminOperationalReportsPage`| `@/pages/admin/OperationalReportsPage`| Laporan operasional sekolah |
| `/admin/profile` | `ProfilePage` | `@/pages/auth/ProfilePage` | Profil pribadi admin |
| `/admin/change-password`| `ChangePasswordPage`| `@/pages/auth/ChangePasswordPage`| Ganti kata sandi admin |

---

## Rute Guru (`/guru/...`)
Hanya dapat diakses oleh pengguna dengan role **`guru`**. Sebagian rute dilindungi oleh guard khusus (`AssignmentGuard`).

| Path | Komponen Halaman | File Halaman | Guard Tambahan | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| `/guru/dashboard` | `GuruDashboard` | `@/pages/guru/GuruDashboard` | - | Ringkasan tugas & info guru |
| `/guru/schedules` | `GuruSchedulesPage` | `@/pages/guru/SchedulesPage` | - | Jadwal mengajar guru |
| `/guru/attendance` | `GuruAttendancePage` | `@/pages/guru/AttendancePage` | - | Form absensi kelas ajar |
| `/guru/materials` | `MaterialsPage` | `@/pages/guru/MaterialsPage` | - | Daftar materi pelajaran |
| `/guru/materials/create` | `MaterialFormPage` | `@/pages/guru/MaterialFormPage` | - | Form pembuatan materi |
| `/guru/materials/:id/edit`| `MaterialFormPage` | `@/pages/guru/MaterialFormPage` | - | Form edit materi |
| `/guru/assignments` | `AssignmentsPage` | `@/pages/guru/AssignmentsPage` | - | Daftar tugas kelas ajar |
| `/guru/assignments/create`| `AssignmentFormPage`| `@/pages/guru/AssignmentFormPage`| - | Form pembuatan tugas |
| `/guru/assignments/:id` | `GuruAssignmentDetailPage`| `@/pages/guru/AssignmentDetailPage`| - | Detail tugas & hasil kerja siswa |
| `/guru/assignments/:id/edit`| `AssignmentFormPage`| `@/pages/guru/AssignmentFormPage`| - | Form edit tugas |
| `/guru/homeroom` | `HomeroomPage` | `@/pages/guru/HomeroomPage` | Wali Kelas (`isWaliKelas`) | Menu khusus wali kelas |
| `/guru/duty-attendance` | `DutyAttendancePage` | `@/pages/guru/DutyAttendancePage` | Guru Piket (`isPiketToday`) | Input absen oleh guru piket |
| `/guru/journals` | `GuruJournalsPage` | `@/pages/guru/JournalsPage` | - | Jurnal mengajar guru |
| `/guru/grading` | `GuruGradingPage` | `@/pages/guru/GradingPage` | - | Penilaian tugas/ujian |
| `/guru/manual-grading` | `GuruManualGradingPage`| `@/pages/guru/ManualGradingPage`| - | Penilaian manual |
| `/guru/classes` | `GuruClassesPage` | `@/pages/guru/ClassesPage` | - | Daftar kelas yang diajar |
| `/guru/classes/:id` | `GuruClassDetailPage` | `@/pages/guru/ClassDetailPage` | - | Informasi detail per kelas |
| `/guru/reports/classes` | `GuruClassReportsPage` | `@/pages/guru/ClassReportsPage` | - | Laporan nilai per kelas |
| `/guru/reports/duty-attendance`| `GuruDutyAttendanceReportsPage`| `@/pages/guru/DutyAttendanceReportsPage`| Guru Piket (`isPiketToday`) | Rekap/laporan absensi piket |
| `/guru/reports/homeroom`| `GuruHomeroomReportsPage`| `@/pages/guru/HomeroomReportsPage`| Wali Kelas (`isWaliKelas`) | Rekap/laporan kelas binaan |
| `/guru/profile` | `ProfilePage` | `@/pages/auth/ProfilePage` | - | Profil pribadi guru |
| `/guru/change-password` | `ChangePasswordPage` | `@/pages/auth/ChangePasswordPage`| - | Ganti kata sandi guru |

---

##  Rute Siswa (`/siswa/...`)
Hanya dapat diakses oleh pengguna dengan role **`siswa`**.

| Path | Komponen Halaman | File Halaman | Deskripsi |
| :--- | :--- | :--- | :--- |
| `/siswa/dashboard` | `SiswaDashboard` | `@/pages/siswa/SiswaDashboard` | Dashboard ringkasan nilai & tugas |
| `/siswa/schedules` | `SiswaSchedulesPage` | `@/pages/siswa/SchedulesPage` | Jadwal mata pelajaran siswa |
| `/siswa/attendance` | `SiswaAttendancePage` | `@/pages/siswa/AttendancePage` | Riwayat kehadiran siswa |
| `/siswa/learning` | `LearningPage` | `@/pages/siswa/LearningPage` | Halaman materi/bahan ajar |
| `/siswa/learning/:id` | `LearningDetailPage` | `@/pages/siswa/LearningDetailPage` | Membaca materi ajar secara lengkap |
| `/siswa/assignments` | `SiswaAssignmentsListPage`| `@/pages/siswa/AssignmentsListPage`| Daftar tugas mandiri & kelompok |
| `/siswa/assignments/:id`| `SiswaAssignmentDetailPage`| `@/pages/siswa/AssignmentDetailPage`| Detail tugas & form unggah jawaban |
| `/siswa/grades` | `SiswaGradesPage` | `@/pages/siswa/GradesPage` | Rekapitulasi rapor/nilai siswa |
| `/siswa/profile` | `ProfilePage` | `@/pages/auth/ProfilePage` | Profil pribadi siswa |
| `/siswa/change-password`| `ChangePasswordPage`| `@/pages/auth/ChangePasswordPage`| Ganti kata sandi siswa |

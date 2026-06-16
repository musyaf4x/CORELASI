# 04 Routes And API Map

## Frontend Routes

| Route | Role yang Boleh Mengakses | Fungsi Halaman | Component/Page | Bukti Codebase |
| ----- | ------------------------- | -------------- | -------------- | -------------- |
| `/login` | Publik | Login manual dan showcase quick login. | `LoginPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/auth/LoginPage.tsx`. |
| `/403` | Semua/publik | Halaman akses ditolak. | `Error403Page` | `frontend/src/app/router.tsx`; `frontend/src/pages/auth/Error403Page.tsx`. |
| `/admin/dashboard` | Admin | Dashboard admin. | `AdminDashboard` | `frontend/src/app/router.tsx`; `frontend/src/app/lazyPages.ts`. |
| `/admin/users` | Admin | Daftar pengguna. | `UsersPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/admin/UsersPage.tsx`. |
| `/admin/users/create` | Admin | Form tambah pengguna. | `UserFormPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/admin/UserFormPage.tsx`. |
| `/admin/users/:id` | Admin | Detail pengguna. | `UserDetailPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/admin/UserDetailPage.tsx`. |
| `/admin/users/:id/edit` | Admin | Edit pengguna. | `UserFormPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/admin/UserFormPage.tsx`. |
| `/admin/academic` | Admin | Tahun ajaran, semester, kelas, mapel. | `AcademicPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/admin/AcademicPage.tsx`. |
| `/admin/schedules` | Admin | Jadwal pembelajaran. | `AdminSchedulesPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/admin/SchedulesPage.tsx`. |
| `/admin/duty-schedules` | Admin | Jadwal piket. | `AdminDutySchedulesPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/admin/DutySchedulesPage.tsx`. |
| `/admin/attendance` | Admin | Absensi sekolah. | `AdminAttendancePage` | `frontend/src/app/router.tsx`; `frontend/src/pages/admin/AttendancePage.tsx`. |
| `/admin/journals` | Admin | Monitoring jurnal. | `AdminJournalsPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/admin/JournalsPage.tsx`. |
| `/admin/reports/attendance` | Admin | Laporan absensi. | `AdminAttendanceReportsPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/admin/AttendanceReportsPage.tsx`. |
| `/admin/reports/grades` | Admin | Laporan nilai. | `AdminGradeReportsPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/admin/GradeReportsPage.tsx`. |
| `/admin/reports/operational` | Admin | Laporan operasional. | `AdminOperationalReportsPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/admin/OperationalReportsPage.tsx`. |
| `/guru/dashboard` | Guru | Dashboard guru. | `GuruDashboard` | `frontend/src/app/router.tsx`; `frontend/src/pages/guru/GuruDashboard.tsx`. |
| `/guru/schedules` | Guru | Jadwal guru. | `GuruSchedulesPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/guru/SchedulesPage.tsx`. |
| `/guru/attendance` | Guru | Absensi kelas. | `GuruAttendancePage` | `frontend/src/app/router.tsx`; `frontend/src/pages/guru/AttendancePage.tsx`. |
| `/guru/materials` | Guru | Daftar materi. | `MaterialsPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/guru/MaterialsPage.tsx`. |
| `/guru/materials/create` | Guru | Form materi. | `MaterialFormPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/guru/MaterialFormPage.tsx`. |
| `/guru/assignments` | Guru | Daftar tugas. | `AssignmentsPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/guru/AssignmentsPage.tsx`. |
| `/guru/assignments/create` | Guru | Form tugas. | `AssignmentFormPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/guru/AssignmentFormPage.tsx`. |
| `/guru/assignments/:id` | Guru | Detail tugas dan submission. | `GuruAssignmentDetailPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/guru/AssignmentDetailPage.tsx`. |
| `/guru/homeroom` | Guru dengan `isWaliKelas` | Kelas perwalian. | `HomeroomPage` | `frontend/src/app/router.tsx`; `AssignmentGuard`. |
| `/guru/duty-attendance` | Guru dengan `isPiketToday` | Koreksi absensi piket. | `DutyAttendancePage` | `frontend/src/app/router.tsx`; `AssignmentGuard`. |
| `/guru/journals` | Guru | Jurnal pertemuan. | `GuruJournalsPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/guru/JournalsPage.tsx`. |
| `/guru/grading` | Guru | Penilaian submission. | `GuruGradingPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/guru/GradingPage.tsx`. |
| `/guru/manual-grading` | Guru | Input nilai manual di UI. | `GuruManualGradingPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/guru/ManualGradingPage.tsx`. |
| `/guru/classes` | Guru | Kelas diampu. | `GuruClassesPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/guru/ClassesPage.tsx`. |
| `/guru/reports/classes` | Guru | Laporan kelas diampu. | `GuruClassReportsPage` | `frontend/src/app/router.tsx`. |
| `/guru/reports/duty-attendance` | Guru dengan `isPiketToday` | Rekap absensi piket. | `GuruDutyAttendanceReportsPage` | `frontend/src/app/router.tsx`; `AssignmentGuard`. |
| `/guru/reports/homeroom` | Guru dengan `isWaliKelas` | Laporan perwalian. | `GuruHomeroomReportsPage` | `frontend/src/app/router.tsx`; `AssignmentGuard`. |
| `/siswa/dashboard` | Siswa | Dashboard siswa. | `SiswaDashboard` | `frontend/src/app/router.tsx`; `frontend/src/pages/siswa/SiswaDashboard.tsx`. |
| `/siswa/schedules` | Siswa | Jadwal siswa. | `SiswaSchedulesPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/siswa/SchedulesPage.tsx`. |
| `/siswa/attendance` | Siswa | Riwayat absensi siswa. | `SiswaAttendancePage` | `frontend/src/app/router.tsx`; `frontend/src/pages/siswa/AttendancePage.tsx`. |
| `/siswa/learning` | Siswa | Materi pembelajaran. | `LearningPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/siswa/LearningPage.tsx`. |
| `/siswa/learning/:id` | Siswa | Detail materi. | `LearningDetailPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/siswa/LearningDetailPage.tsx`. |
| `/siswa/assignments` | Siswa | Daftar tugas. | `SiswaAssignmentsListPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/siswa/AssignmentsListPage.tsx`. |
| `/siswa/assignments/:id` | Siswa | Detail/submit tugas. | `SiswaAssignmentDetailPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/siswa/AssignmentDetailPage.tsx`. |
| `/siswa/grades` | Siswa | Nilai siswa. | `SiswaGradesPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/siswa/GradesPage.tsx`. |
| `/{role}/profile`, `/{role}/change-password` | Role terkait | Profil dan ganti password. | `ProfilePage`, `ChangePasswordPage` | `frontend/src/app/router.tsx`; `frontend/src/pages/auth/*`. |

## Backend API

| Endpoint | Method | Modul | Aktor/Role | Fungsi | Handler/View/Serializer | Bukti Codebase |
| -------- | ------ | ----- | ---------- | ------ | ----------------------- | -------------- |
| `/api/health/live/` | GET | Config | Publik/internal smoke | Liveness. | `liveness` | `config/urls.py`; `config/views.py`. |
| `/api/health/ready/` | GET | Config | Publik/internal smoke | Readiness DB. | `readiness` | `config/urls.py`; `config/views.py`. |
| `/api/auth/csrf/` | GET | Akun | Publik | Siapkan CSRF cookie/token. | `CsrfTokenView` | `accounts/urls.py`; `accounts/views.py`. |
| `/api/auth/login/` | POST | Akun | Publik | Login email/password. | `LoginView`, `CustomTokenObtainPairSerializer` | `accounts/urls.py`; `accounts/views.py`; `accounts/serializers.py`. |
| `/api/auth/showcase-login/` | POST | Akun | Publik demo | Login akun showcase allowlist. | `ShowcaseLoginView` | `accounts/urls.py`; `accounts/views.py`; `config/settings.py`. |
| `/api/auth/refresh/` | POST | Akun | Publik dengan cookie | Refresh access token. | `CustomTokenRefreshView` | `accounts/urls.py`; `accounts/views.py`. |
| `/api/auth/me/` | GET | Akun | Authenticated | Profil user saat ini. | `ProfileView`, `UserDetailSerializer` | `accounts/urls.py`; `accounts/views.py`; `accounts/serializers.py`. |
| `/api/auth/change-password/` | POST | Akun | Authenticated | Ubah kata sandi sendiri. | `ChangePasswordView` | `accounts/urls.py`; `accounts/views.py`. |
| `/api/auth/logout/` | POST | Akun | Semua dengan cookie | Logout dan clear refresh cookie. | `LogoutView` | `accounts/urls.py`; `accounts/views.py`. |
| `/api/users/` | GET/POST | Akun | GET authenticated scoped, POST admin | List/create user. | `UserViewSet`, `UserDetailSerializer` | `accounts/urls.py`; `accounts/views.py`. |
| `/api/users/{id}/` | GET/PATCH/PUT/DELETE | Akun | Auth scoped/admin write | Detail/update/delete user. | `UserViewSet` | `accounts/views.py`. |
| `/api/users/password-reset-requests/` | GET/POST | Akun | POST publik, list admin | Permintaan reset password. | `PasswordResetRequestViewSet` | `accounts/urls.py`; `accounts/views.py`. |
| `/api/users/password-reset-requests/{id}/resolve/` | PATCH | Akun | Admin | Resolve reset password. | `PasswordResetRequestViewSet.resolve` | `accounts/views.py`. |
| `/api/academic/tahun-ajaran/` | GET/POST/PATCH/DELETE | Administrasi Akademik | Auth read, admin write | Tahun ajaran. | `TahunAjaranViewSet` | `academic/urls.py`; `academic/views.py`. |
| `/api/academic/semester/` | GET/POST/PATCH/DELETE | Administrasi Akademik | Auth read, admin write | Semester. | `SemesterViewSet`, `SemesterSerializer` | `academic/urls.py`; `academic/views.py`; `academic/serializers.py`. |
| `/api/academic/kelas/` | GET/POST/PATCH/DELETE | Administrasi Akademik | Auth read, admin write | Kelas/wali kelas. | `KelasViewSet`, `KelasSerializer` | `academic/urls.py`; `academic/views.py`. |
| `/api/academic/mapel/` | GET/POST/PATCH/DELETE | Administrasi Akademik | Auth read, admin write | Mata pelajaran. | `MataPelajaranViewSet` | `academic/urls.py`; `academic/views.py`. |
| `/api/schedules/pembelajaran/` | GET/POST/PATCH/DELETE | Jadwal | Auth scoped, admin write | Jadwal pembelajaran. | `JadwalPelajaranViewSet` | `schedules/urls.py`; `schedules/views.py`. |
| `/api/schedules/piket/` | GET/POST/PATCH/DELETE | Jadwal | Auth scoped, admin write | Jadwal piket. | `JadwalPiketViewSet` | `schedules/urls.py`; `schedules/views.py`. |
| `/api/attendance/siswa/` | GET/POST/PATCH/DELETE | Absensi | Auth scoped; admin/guru write | Absensi siswa. | `AbsensiSiswaViewSet` | `attendance/urls.py`; `attendance/views.py`. |
| `/api/attendance/siswa/batch/` | POST | Absensi | Admin/Guru | Batch absensi. | `AbsensiSiswaViewSet.batch` | `attendance/views.py`. |
| `/api/attendance/siswa/{id}/override/` | PATCH | Absensi | Admin | Override absensi. | `AbsensiSiswaViewSet.override` | `attendance/views.py`. |
| `/api/attendance/koreksi/` | GET/POST/PATCH/DELETE | Absensi | Auth scoped | Permintaan koreksi. | `PermintaanKoreksiViewSet` | `attendance/urls.py`; `attendance/views.py`. |
| `/api/attendance/koreksi/{id}/verify/` | PATCH | Absensi | Admin/Guru Piket | Verifikasi koreksi. | `PermintaanKoreksiViewSet.verify` | `attendance/views.py`. |
| `/api/learning/materi/` | GET/POST/PATCH/DELETE | Pembelajaran | Auth scoped; admin/guru write | Materi. | `MateriViewSet`, `MateriSerializer` | `learning/urls.py`; `learning/views.py`. |
| `/api/learning/tugas/` | GET/POST/PATCH/DELETE | Pembelajaran | Auth scoped; admin/guru write | Tugas. | `TugasViewSet`, `TugasSerializer` | `learning/urls.py`; `learning/views.py`. |
| `/api/learning/submissions/` | GET/POST | Pembelajaran | Auth scoped; siswa submit | Submission tugas. | `SubmissionViewSet`, `SubmissionSerializer` | `learning/urls.py`; `learning/views.py`. |
| `/api/learning/submissions/{id}/grade/` | PATCH | Pembelajaran | Admin/Guru pemilik | Nilai submission. | `SubmissionViewSet.grade` | `learning/views.py`. |
| `/api/learning/upload/` | POST | Pembelajaran | Authenticated | Upload file. | `FileUploadView` | `learning/urls.py`; `learning/views.py`. |
| `/api/journals/` | GET/POST/PATCH/DELETE | Jurnal | Auth scoped; admin/guru write | Jurnal pertemuan. | `JurnalPertemuanViewSet` | `journals/urls.py`; `journals/views.py`. |
| `/api/reports/attendance/` | GET | Rekap | Admin/Guru | Laporan absensi. | `AttendanceReportView` | `reports/urls.py`; `reports/views.py`. |
| `/api/reports/grades/` | GET | Rekap | Admin/Guru | Laporan nilai. | `GradeReportView` | `reports/urls.py`; `reports/views.py`. |
| `/api/reports/operational/` | GET | Rekap | Admin | Laporan operasional. | `OperationalReportView` | `reports/urls.py`; `reports/views.py`. |

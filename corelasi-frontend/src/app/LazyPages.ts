import { lazy } from "react";

export const AdminDashboard = lazy(() =>
  import("@/pages/admin/AdminDashboard").then(({ AdminDashboard }) => ({
    default: AdminDashboard,
  })),
);
export const UsersPage = lazy(() =>
  import("@/pages/admin/UsersPage").then(({ UsersPage }) => ({
    default: UsersPage,
  })),
);
export const UserFormPage = lazy(() =>
  import("@/pages/admin/UserFormPage").then(({ UserFormPage }) => ({
    default: UserFormPage,
  })),
);
export const UserDetailPage = lazy(() =>
  import("@/pages/admin/UserDetailPage").then(({ UserDetailPage }) => ({
    default: UserDetailPage,
  })),
);
export const AcademicPage = lazy(() =>
  import("@/pages/admin/AcademicPage").then(({ AcademicPage }) => ({
    default: AcademicPage,
  })),
);
export const AdminSchedulesPage = lazy(() =>
  import("@/pages/admin/SchedulesPage").then(({ SchedulesPage }) => ({
    default: SchedulesPage,
  })),
);
export const AdminDutySchedulesPage = lazy(() =>
  import("@/pages/admin/DutySchedulesPage").then(({ DutySchedulesPage }) => ({
    default: DutySchedulesPage,
  })),
);
export const AdminAttendancePage = lazy(() =>
  import("@/pages/admin/AttendancePage").then(({ AttendancePage }) => ({
    default: AttendancePage,
  })),
);
export const AdminJournalsPage = lazy(() =>
  import("@/pages/admin/JournalsPage").then(({ JournalsPage }) => ({
    default: JournalsPage,
  })),
);
export const AdminAttendanceReportsPage = lazy(() =>
  import("@/pages/admin/AttendanceReportsPage").then(
    ({ AttendanceReportsPage }) => ({ default: AttendanceReportsPage }),
  ),
);
export const AdminGradeReportsPage = lazy(() =>
  import("@/pages/admin/GradeReportsPage").then(({ GradeReportsPage }) => ({
    default: GradeReportsPage,
  })),
);
export const AdminOperationalReportsPage = lazy(() =>
  import("@/pages/admin/OperationalReportsPage").then(
    ({ OperationalReportsPage }) => ({ default: OperationalReportsPage }),
  ),
);

export const GuruDashboard = lazy(() =>
  import("@/pages/guru/GuruDashboard").then(({ GuruDashboard }) => ({
    default: GuruDashboard,
  })),
);
export const GuruSchedulesPage = lazy(() =>
  import("@/pages/guru/SchedulesPage").then(({ SchedulesPage }) => ({
    default: SchedulesPage,
  })),
);
export const GuruAttendancePage = lazy(() =>
  import("@/pages/guru/AttendancePage").then(({ AttendancePage }) => ({
    default: AttendancePage,
  })),
);
export const MaterialsPage = lazy(() =>
  import("@/pages/guru/MaterialsPage").then(({ MaterialsPage }) => ({
    default: MaterialsPage,
  })),
);
export const MaterialFormPage = lazy(() =>
  import("@/pages/guru/MaterialFormPage").then(({ MaterialFormPage }) => ({
    default: MaterialFormPage,
  })),
);
export const AssignmentsPage = lazy(() =>
  import("@/pages/guru/AssignmentsPage").then(({ AssignmentsPage }) => ({
    default: AssignmentsPage,
  })),
);
export const AssignmentFormPage = lazy(() =>
  import("@/pages/guru/AssignmentFormPage").then(({ AssignmentFormPage }) => ({
    default: AssignmentFormPage,
  })),
);
export const GuruAssignmentDetailPage = lazy(() =>
  import("@/pages/guru/AssignmentDetailPage").then(
    ({ AssignmentDetailPage }) => ({ default: AssignmentDetailPage }),
  ),
);
export const HomeroomPage = lazy(() =>
  import("@/pages/guru/HomeroomPage").then(({ HomeroomPage }) => ({
    default: HomeroomPage,
  })),
);
export const DutyAttendancePage = lazy(() =>
  import("@/pages/guru/DutyAttendancePage").then(({ DutyAttendancePage }) => ({
    default: DutyAttendancePage,
  })),
);
export const GuruJournalsPage = lazy(() =>
  import("@/pages/guru/JournalsPage").then(({ JournalsPage }) => ({
    default: JournalsPage,
  })),
);
export const GuruGradingPage = lazy(() =>
  import("@/pages/guru/GradingPage").then(({ GradingPage }) => ({
    default: GradingPage,
  })),
);
export const GuruManualGradingPage = lazy(() =>
  import("@/pages/guru/ManualGradingPage").then(({ ManualGradingPage }) => ({
    default: ManualGradingPage,
  })),
);
export const GuruClassesPage = lazy(() =>
  import("@/pages/guru/ClassesPage").then(({ ClassesPage }) => ({
    default: ClassesPage,
  })),
);
export const GuruClassDetailPage = lazy(() =>
  import("@/pages/guru/ClassDetailPage").then(({ ClassDetailPage }) => ({
    default: ClassDetailPage,
  })),
);
export const GuruClassReportsPage = lazy(() =>
  import("@/pages/guru/ClassReportsPage").then(({ ClassReportsPage }) => ({
    default: ClassReportsPage,
  })),
);
export const GuruDutyAttendanceReportsPage = lazy(() =>
  import("@/pages/guru/DutyAttendanceReportsPage").then(
    ({ DutyAttendanceReportsPage }) => ({ default: DutyAttendanceReportsPage }),
  ),
);
export const GuruHomeroomReportsPage = lazy(() =>
  import("@/pages/guru/HomeroomReportsPage").then(
    ({ HomeroomReportsPage }) => ({ default: HomeroomReportsPage }),
  ),
);

export const SiswaDashboard = lazy(() =>
  import("@/pages/siswa/SiswaDashboard").then(({ SiswaDashboard }) => ({
    default: SiswaDashboard,
  })),
);
export const SiswaSchedulesPage = lazy(() =>
  import("@/pages/siswa/SchedulesPage").then(({ SchedulesPage }) => ({
    default: SchedulesPage,
  })),
);
export const SiswaAttendancePage = lazy(() =>
  import("@/pages/siswa/AttendancePage").then(({ AttendancePage }) => ({
    default: AttendancePage,
  })),
);
export const LearningPage = lazy(() =>
  import("@/pages/siswa/LearningPage").then(({ LearningPage }) => ({
    default: LearningPage,
  })),
);
export const LearningDetailPage = lazy(() =>
  import("@/pages/siswa/LearningDetailPage").then(({ LearningDetailPage }) => ({
    default: LearningDetailPage,
  })),
);
export const SiswaAssignmentsListPage = lazy(() =>
  import("@/pages/siswa/AssignmentsListPage").then(
    ({ AssignmentsListPage }) => ({ default: AssignmentsListPage }),
  ),
);
export const SiswaAssignmentDetailPage = lazy(() =>
  import("@/pages/siswa/AssignmentDetailPage").then(
    ({ AssignmentDetailPage }) => ({ default: AssignmentDetailPage }),
  ),
);
export const SiswaGradesPage = lazy(() =>
  import("@/pages/siswa/GradesPage").then(({ GradesPage }) => ({
    default: GradesPage,
  })),
);

export const ProfilePage = lazy(() =>
  import("@/pages/auth/ProfilePage").then(({ ProfilePage }) => ({
    default: ProfilePage,
  })),
);
export const ChangePasswordPage = lazy(() =>
  import("@/pages/auth/ChangePasswordPage").then(({ ChangePasswordPage }) => ({
    default: ChangePasswordPage,
  })),
);

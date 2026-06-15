import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AssignmentGuard } from "@/components/shared/AssignmentGuard";
import { RoleLayout } from "@/app/RoleLayout";
import {
  AcademicPage,
  AdminAttendancePage,
  AdminAttendanceReportsPage,
  AdminDashboard,
  AdminDutySchedulesPage,
  AdminGradeReportsPage,
  AdminJournalsPage,
  AdminOperationalReportsPage,
  AdminSchedulesPage,
  AssignmentFormPage,
  AssignmentsPage,
  ChangePasswordPage,
  DutyAttendancePage,
  GuruAssignmentDetailPage,
  GuruAttendancePage,
  GuruClassDetailPage,
  GuruClassesPage,
  GuruClassReportsPage,
  GuruDashboard,
  GuruDutyAttendanceReportsPage,
  GuruGradingPage,
  GuruHomeroomReportsPage,
  GuruJournalsPage,
  GuruManualGradingPage,
  GuruSchedulesPage,
  HomeroomPage,
  LearningDetailPage,
  LearningPage,
  MaterialFormPage,
  MaterialsPage,
  ProfilePage,
  SiswaAssignmentDetailPage,
  SiswaAssignmentsListPage,
  SiswaAttendancePage,
  SiswaDashboard,
  SiswaGradesPage,
  SiswaSchedulesPage,
  UserDetailPage,
  UserFormPage,
  UsersPage,
} from "@/app/lazyPages";

import { LoginPage } from "@/pages/auth/LoginPage";
import { Error403Page } from "@/pages/auth/Error403Page";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/403",
    element: <Error403Page />,
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      // Default landing redirect
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },

      // Admin Routes
      {
        path: "admin",
        element: <RoleLayout allowedRoles={["admin"]} />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <AdminDashboard />,
          },
          {
            path: "users",
            element: <UsersPage />,
          },
          {
            path: "users/create",
            element: <UserFormPage />,
          },
          {
            path: "users/:id",
            element: <UserDetailPage />,
          },
          {
            path: "users/:id/edit",
            element: <UserFormPage />,
          },
          {
            path: "academic",
            element: <AcademicPage />,
          },
          {
            path: "schedules",
            element: <AdminSchedulesPage />,
          },
          {
            path: "duty-schedules",
            element: <AdminDutySchedulesPage />,
          },
          {
            path: "attendance",
            element: <AdminAttendancePage />,
          },
          {
            path: "journals",
            element: <AdminJournalsPage />,
          },
          {
            path: "reports/attendance",
            element: <AdminAttendanceReportsPage />,
          },
          {
            path: "reports/grades",
            element: <AdminGradeReportsPage />,
          },
          {
            path: "reports/operational",
            element: <AdminOperationalReportsPage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "change-password",
            element: <ChangePasswordPage />,
          },
          // Placeholder routes redirecting back to dashboard for safety
          {
            path: "*",
            element: <Navigate to="dashboard" replace />,
          },
        ],
      },

      // Guru Routes
      {
        path: "guru",
        element: <RoleLayout allowedRoles={["guru"]} />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <GuruDashboard />,
          },
          {
            path: "schedules",
            element: <GuruSchedulesPage />,
          },
          {
            path: "attendance",
            element: <GuruAttendancePage />,
          },
          {
            path: "materials",
            element: <MaterialsPage />,
          },
          {
            path: "materials/create",
            element: <MaterialFormPage />,
          },
          {
            path: "materials/:id/edit",
            element: <MaterialFormPage />,
          },
          {
            path: "assignments",
            element: <AssignmentsPage />,
          },
          {
            path: "assignments/create",
            element: <AssignmentFormPage />,
          },
          {
            path: "assignments/:id",
            element: <GuruAssignmentDetailPage />,
          },
          {
            path: "assignments/:id/edit",
            element: <AssignmentFormPage />,
          },
          {
            path: "homeroom",
            element: (
              <AssignmentGuard requiredAssignment="isWaliKelas">
                <HomeroomPage />
              </AssignmentGuard>
            ),
          },
          {
            path: "duty-attendance",
            element: (
              <AssignmentGuard requiredAssignment="isPiketToday">
                <DutyAttendancePage />
              </AssignmentGuard>
            ),
          },
          {
            path: "journals",
            element: <GuruJournalsPage />,
          },
          {
            path: "grading",
            element: <GuruGradingPage />,
          },
          {
            path: "manual-grading",
            element: <GuruManualGradingPage />,
          },
          {
            path: "classes",
            element: <GuruClassesPage />,
          },
          {
            path: "classes/:id",
            element: <GuruClassDetailPage />,
          },
          {
            path: "reports/classes",
            element: <GuruClassReportsPage />,
          },
          {
            path: "reports/duty-attendance",
            element: (
              <AssignmentGuard requiredAssignment="isPiketToday">
                <GuruDutyAttendanceReportsPage />
              </AssignmentGuard>
            ),
          },
          {
            path: "reports/homeroom",
            element: (
              <AssignmentGuard requiredAssignment="isWaliKelas">
                <GuruHomeroomReportsPage />
              </AssignmentGuard>
            ),
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "change-password",
            element: <ChangePasswordPage />,
          },
          // Placeholder routes
          {
            path: "*",
            element: <Navigate to="dashboard" replace />,
          },
        ],
      },

      // Siswa Routes
      {
        path: "siswa",
        element: <RoleLayout allowedRoles={["siswa"]} />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <SiswaDashboard />,
          },
          {
            path: "schedules",
            element: <SiswaSchedulesPage />,
          },
          {
            path: "attendance",
            element: <SiswaAttendancePage />,
          },
          {
            path: "learning",
            element: <LearningPage />,
          },
          {
            path: "learning/:id",
            element: <LearningDetailPage />,
          },
          {
            path: "assignments",
            element: <SiswaAssignmentsListPage />,
          },
          {
            path: "assignments/:id",
            element: <SiswaAssignmentDetailPage />,
          },
          {
            path: "grades",
            element: <SiswaGradesPage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "change-password",
            element: <ChangePasswordPage />,
          },
          // Placeholder routes
          {
            path: "*",
            element: <Navigate to="dashboard" replace />,
          },
        ],
      },

      // Catch-all
      {
        path: "*",
        element: <Navigate to="/login" replace />,
      },
    ],
  },
]);

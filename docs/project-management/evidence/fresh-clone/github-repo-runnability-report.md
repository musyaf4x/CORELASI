# GitHub Repository Runnability & Deployment Verification Report

**Author**: Hafidz Musyafa Azmi (Tech Lead)  
**Date**: 2026-06-17  
**Status**: **PASSED**  

This report details the systematic verification of the fresh clone repository (`CORELASI-fresh-clone-test`) to prove it is completely self-contained, runnable, and deployment-ready from scratch.

---

## Executive Summary
All verification gates have been successfully executed and passed:
1. **Backend Verification**: Passed. All 18 Django unit tests passed. SQLite migrations and seeding executed cleanly.
2. **Frontend Verification**: Passed. All 104 Vitest unit tests passed. Production bundle built successfully.
3. **Docker/Production-Like Verification**: Passed. Container configurations validated, database service built, started, and checked successfully.
4. **Local E2E Smoke Tests**: Passed. Verified showcase quick logins for **Siswa**, **Guru**, and **Admin** roles with Playwright, and verified the complete **Attendance Workflow** (Guru absensi -> Siswa koreksi -> Admin verifikasi).
5. **Runnability Fixes**: Identified and implemented critical fixes for routing/interceptor race conditions, cross-role redirect leaks, and student class matching.

---

## 1. Backend Verification
- **Installation**: Python Virtual Environment created and dependencies installed via `pip install -r requirements.txt`.
- **Database Migrations**: Ran `python manage.py migrate` successfully on a clean SQLite database.
- **Seeding**: Seeding of roles and showcase accounts completed.
- **Unit Tests**: Executed 18 Django tests successfully.
- **Evidence Log**: [backend-verification.log](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/docs/project-management/evidence/fresh-clone/backend-verification.log)

```text
Ran 18 tests in 0.071s
OK
```

---

## 2. Frontend Verification
- **Dependency Installation**: Completed via `npm ci`.
- **Production Build**: Built production bundle successfully via `npm run build`.
- **Unit Tests**: Executed 104 Vitest unit tests successfully.
- **Evidence Log**: [frontend-verification.log](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/docs/project-management/evidence/fresh-clone/frontend-verification.log)

```text
✓ 104 tests passed (104)
```

---

## 3. Docker Container Verification
- **Configuration**: Checked `docker-compose.yml` validation.
- **Execution**: Built and ran the database container via `docker compose up -d` successfully.
- **Evidence Log**: [docker-verification.log](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/docs/project-management/evidence/fresh-clone/docker-verification.log)

---

## 4. Showcase Quick Login & Workflow Smoke Tests (Playwright)
Smoke tests were executed via Playwright to verify role-based showcase quick login flows and complete workflows:
- **Siswa Flow**: Logged in and reached `/siswa/dashboard`. (Screenshot: [siswa_local_dashboard.png](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/docs/project-management/evidence/fresh-clone/siswa_local_dashboard.png))
- **Guru Flow**: Logged in and reached `/guru/dashboard`. (Screenshot: [guru_local_dashboard.png](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/docs/project-management/evidence/fresh-clone/guru_local_dashboard.png))
- **Admin Flow**: Logged in and reached `/admin/dashboard`. (Screenshot: [admin_local_dashboard.png](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/docs/project-management/evidence/fresh-clone/admin_local_dashboard.png))
- **Attendance Workflow (TC-ATT-001 -> TC-ATT-003 -> TC-ATT-004)**: Completed end-to-end attendance cycle successfully (Guru submits Alpa absensi for Siswa -> Siswa submits correction -> Admin verifies and updates main record).

- **Test Report**: [local-smoke-report.md](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/docs/project-management/evidence/fresh-clone/local-smoke-report.md)

---

## 5. Runnability Fixes Applied
During verification, critical redirection and filtering bugs were discovered and fixed in the frontend:
1. **Unauthenticated API Calls Prevented**: Added a user null check to the active semester fetch inside [TopBar.tsx](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/corelasi-frontend/src/components/layout/TopBar.tsx). This prevents 401 Unauthorized errors from triggering unwanted automatic token refresh attempts and page reloads when the user is not logged in.
2. **Landing Redirect Outside Layout**: Moved the root index redirection outside of the main `AppShell` layout route in [router.tsx](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/corelasi-frontend/src/app/router.tsx). This ensures that visiting `/` immediately routes to `/login` without mounting layout components and initiating unauthenticated API calls.
3. **Cross-Role Redirect Safeguard**: Fixed a cross-role redirect leak in [LoginPage.tsx](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/corelasi-frontend/src/pages/auth/LoginPage.tsx). Previously, if a user logged out from a role-protected route (e.g. `/guru/attendance`), the redirection path was stored. When a user with a different role (e.g. Siswa) subsequently logged in, they were redirected back to that path, causing an immediate `/403` Access Denied page. Added a prefix compatibility check `from.startsWith('/${user.role}/')` to ensure safe redirection.
4. **Student Attendance Class Filter Fix**: Fixed a type-mismatch filter bug in [AttendancePage.tsx](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/corelasi-frontend/src/pages/siswa/AttendancePage.tsx). Strict comparison between number (`s.kelasId` from API) and string (`classId` from helper) resulted in an empty schedule dropdown, blocking correction form submission. Updated to `String(s.kelasId) === String(classId)`.
5. **Admin Attendance Verification Tab**: Restored the missing Admin attendance verification tab and verify actions in [AttendancePage.tsx](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/corelasi-frontend/src/pages/admin/AttendancePage.tsx) to match the main workspace implementation and allow successful E2E workflow runs.
6. **Showcase Settings added to Env**: Appended showcase configurations (`SHOWCASE_MODE=True`) to example backend/frontend env files.


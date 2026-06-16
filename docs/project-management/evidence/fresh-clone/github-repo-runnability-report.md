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
4. **Local E2E Smoke Tests**: Passed. Verified showcase quick logins for **Siswa**, **Guru**, and **Admin** roles with Playwright.
5. **Runnability Fixes**: Identified and implemented critical fixes for routing/interceptor race conditions.

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

## 4. Showcase Quick Login Smoke Tests (Playwright)
Smoke tests were executed via Playwright to verify role-based showcase quick login flows:
- **Siswa Flow**: Logged in and reached `/siswa/dashboard`. (Screenshot: [siswa_local_dashboard.png](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/docs/project-management/evidence/fresh-clone/siswa_local_dashboard.png))
- **Guru Flow**: Logged in and reached `/guru/dashboard`. (Screenshot: [guru_local_dashboard.png](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/docs/project-management/evidence/fresh-clone/guru_local_dashboard.png))
- **Admin Flow**: Logged in and reached `/admin/dashboard`. (Screenshot: [admin_local_dashboard.png](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/docs/project-management/evidence/fresh-clone/admin_local_dashboard.png))

- **Test Report**: [local-smoke-report.md](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/docs/project-management/evidence/fresh-clone/local-smoke-report.md)

---

## 5. Runnability Fixes Applied
During verification, a critical redirection race condition was discovered and fixed in the frontend:
1. **Unauthenticated API Calls Prevented**: Added a user null check to the active semester fetch inside [TopBar.tsx](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/corelasi-frontend/src/components/layout/TopBar.tsx). This prevents 401 Unauthorized errors from triggering unwanted automatic token refresh attempts and page reloads when the user is not logged in.
2. **Landing Redirect Outside Layout**: Moved the root index redirection outside of the main `AppShell` layout route in [router.tsx](file:///C:/Users/hafid/Documents/Program/CORELASI-fresh-clone-test/corelasi-frontend/src/app/router.tsx). This ensures that visiting `/` immediately routes to `/login` without mounting layout components and initiating unauthenticated API calls.
3. **Showcase Settings added to Env**: Appended showcase configurations (`SHOWCASE_MODE=True`) to example backend/frontend env files.

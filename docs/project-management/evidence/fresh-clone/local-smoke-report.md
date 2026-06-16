# Local Smoke Test Verification Report

Date/Time: 2026-06-17T02:48:11+07:00
Environment: Local Development (Fresh Clone)
Backend Host: `http://127.0.0.1:8000/` (SQLite DB)
Frontend Host: `http://localhost:5173/` (Vite Dev Server)

## Test Cases & Results

| Test Case ID | Scope | Target Dashboard / Action | Status | Reference |
| --- | --- | --- | --- | --- |
| TC-LOGIN-001 | Siswa Quick Login | `/siswa/dashboard` | PASS | `siswa_local_dashboard.png` |
| TC-LOGIN-002 | Guru Quick Login | `/guru/dashboard` | PASS | `guru_local_dashboard.png` |
| TC-LOGIN-003 | Admin Quick Login | `/admin/dashboard` | PASS | `admin_local_dashboard.png` |
| TC-ATT-E2E   | E2E Attendance Workflow | Guru Absensi -> Siswa Koreksi -> Admin Verifikasi | PASS | `e2e/attendance-workflow.spec.ts` |

## Execution Log (Showcase Quick Login)

```text
Running 3 tests using 1 worker

BROWSER CONSOLE: [vite] connecting...
BROWSER CONSOLE: [vite] connected.
BROWSER CONSOLE: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
BROWSER CONSOLE: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ok 1 [chromium] › e2e\showcase-login.spec.ts:8:3 › Showcase Quick Login Smoke Test › Siswa quick login flow (1.7s)
BROWSER CONSOLE: [vite] connecting...
BROWSER CONSOLE: [vite] connected.
BROWSER CONSOLE: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
BROWSER CONSOLE: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ok 2 [chromium] › e2e\showcase-login.spec.ts:36:3 › Showcase Quick Login Smoke Test › Guru quick login flow (1.6s)
BROWSER CONSOLE: [vite] connecting...
BROWSER CONSOLE: [vite] connected.
BROWSER CONSOLE: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
BROWSER CONSOLE: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ok 3 [chromium] › e2e\showcase-login.spec.ts:61:3 › Showcase Quick Login Smoke Test › Admin quick login flow (1.5s)

  3 passed (6.3s)
```

## Execution Log (Attendance Workflow E2E)

```text
Running 1 test using 1 worker

BROWSER CONSOLE: [vite] connecting...
BROWSER CONSOLE: [vite] connected.
BROWSER CONSOLE: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
BROWSER CONSOLE: Failed to load resource: the server responded with a status of 401 (Unauthorized)
BROWSER CONSOLE: [vite] connecting...
BROWSER CONSOLE: [vite] connected.
BROWSER CONSOLE: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
BROWSER CONSOLE: [vite] connecting...
BROWSER CONSOLE: [vite] connected.
BROWSER CONSOLE: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
BROWSER CONSOLE: [vite] connecting...
BROWSER CONSOLE: [vite] connected.
BROWSER CONSOLE: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
  ok 1 [chromium] › e2e\attendance-workflow.spec.ts:4:3 › CORELASI Attendance Workflow E2E › should complete the entire attendance workflow (Guru -> Siswa -> Admin) (10.4s)

  1 passed (12.4s)
```

## Summary
The smoke and E2E tests verify that the frontend and backend are fully operational, communicating properly, and handling core state-mutation workflows cleanly on a local fresh clone.
Key runnability fixes deployed to `fix/fresh-clone-runnability`:
1. Checked for a logged-in user in `TopBar.tsx` before invoking any semester loading requests to avoid unwanted 401 unauthorized errors.
2. Repositioned the default index redirect route in `router.tsx` to prevent `AppShell` from mounting during landing redirections.
3. Implemented a cross-role redirect safeguard in `LoginPage.tsx` checking prefix compatibility of the redirect URL `from.startsWith('/${user.role}/')`.
4. Cast student classId to string `String(s.kelasId) === String(classId)` in `AttendancePage.tsx` to fix filtering for schedule selections.
5. Restored the Admin attendance verification tab and actions.


# Local Smoke Test Verification Report

Date/Time: 2026-06-17T02:36:20+07:00
Environment: Local Development (Fresh Clone)
Backend Host: `http://127.0.0.1:8000/` (SQLite DB)
Frontend Host: `http://localhost:5173/` (Vite Dev Server)

## Test Cases & Results

| Test Case ID | Role | Target Dashboard | Status | Screenshot Path |
| --- | --- | --- | --- | --- |
| TC-LOGIN-001 | Siswa | `/siswa/dashboard` | PASS | `docs/project-management/evidence/fresh-clone/siswa_local_dashboard.png` |
| TC-LOGIN-002 | Guru | `/guru/dashboard` | PASS | `docs/project-management/evidence/fresh-clone/guru_local_dashboard.png` |
| TC-LOGIN-003 | Admin | `/admin/dashboard` | PASS | `docs/project-management/evidence/fresh-clone/admin_local_dashboard.png` |

## Execution Log

```text
Running 3 tests using 1 worker

BROWSER CONSOLE: [vite] connecting...
BROWSER CONSOLE: [vite] connected.
BROWSER CONSOLE: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
BROWSER CONSOLE: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ok 1 [chromium] › e2e\showcase-login.spec.ts:8:3 › Showcase Quick Login Smoke Test › Siswa quick login flow (1.8s)
BROWSER CONSOLE: [vite] connecting...
BROWSER CONSOLE: [vite] connected.
BROWSER CONSOLE: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
BROWSER CONSOLE: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ok 2 [chromium] › e2e\showcase-login.spec.ts:36:3 › Showcase Quick Login Smoke Test › Guru quick login flow (1.6s)
BROWSER CONSOLE: [vite] connecting...
BROWSER CONSOLE: [vite] connected.
BROWSER CONSOLE: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
BROWSER CONSOLE: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  ok 3 [chromium] › e2e\showcase-login.spec.ts:61:3 › Showcase Quick Login Smoke Test › Admin quick login flow (1.6s)

  3 passed (6.5s)
```

## Summary
The showcase quick login tests verify that the frontend and backend are fully operational and communicating properly on a local machine.
The race conditions that previously caused page reloads and aborted login attempts have been fixed:
1. Checked for a logged-in user in `TopBar.tsx` before invoking any semester loading requests to avoid unwanted 401 unauthorized errors.
2. Repositioned the default index redirect route in `router.tsx` to prevent `AppShell` from mounting during landing redirections.

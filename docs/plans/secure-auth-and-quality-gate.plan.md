# Plan: Secure Auth And Quality Gate

**Source**: User-approved execution of pre-deployment steps 1 through 4
**Complexity**: Large

## Summary

Replace production JWT persistence in Web Storage with an HttpOnly refresh
cookie and an in-memory access token. Then resolve the existing frontend
quality-gate findings, run only SAFE dead-code cleanup, and complete full
backend/frontend/role verification before deployment.

## Patterns To Mirror

| Category | Source | Pattern |
|---|---|---|
| API response | `corelasi-backend/shared/responses.py` | Preserve the standard success/error envelope. |
| Auth endpoints | `corelasi-backend/apps/accounts/views.py` | Keep login, refresh, profile, and logout under `/api/auth/`. |
| Client requests | `corelasi-frontend/src/services/api.ts` | Centralize credentials, retry, and error normalization in one Axios layer. |
| Client auth state | `corelasi-frontend/src/app/providers.tsx` | Expose session state through the existing Auth context. |
| Backend tests | `corelasi-backend/apps/accounts/tests.py` | Use DRF integration tests and explicit response assertions. |
| Frontend tests | `corelasi-frontend/src/test/api.test.ts` | Use Vitest and mock only transport boundaries. |

## Files To Change

| File | Action | Why |
|---|---|---|
| `corelasi-backend/apps/accounts/cookies.py` | CREATE | Centralize secure refresh-cookie lifecycle and no-store headers. |
| `corelasi-backend/apps/accounts/views.py` | UPDATE | Set/read/delete refresh cookie, enforce CSRF, blacklist logout tokens. |
| `corelasi-backend/apps/accounts/urls.py` | UPDATE | Add CSRF bootstrap endpoint. |
| `corelasi-backend/config/settings.py` | UPDATE | Cookie policy, shorter access lifetime, blacklist app and rotation. |
| `corelasi-backend/apps/accounts/tests.py` | UPDATE | Lock cookie, CSRF, rotation, and revocation behavior. |
| `corelasi-frontend/src/services/sessionStore.ts` | CREATE | Hold access token and current user only in module memory. |
| `corelasi-frontend/src/services/api.ts` | UPDATE | Refresh using cookie credentials and retry with in-memory access token. |
| `corelasi-frontend/src/services/authService.ts` | UPDATE | Bootstrap, login, and logout without production Web Storage tokens. |
| `corelasi-frontend/src/app/providers.tsx` | UPDATE | Restore the cookie-backed session asynchronously. |
| `corelasi-frontend/src/app/authContext.ts` | CREATE | Separate React context from component exports. |
| Frontend lint findings | UPDATE | Resolve hook correctness, type safety, and unused code without disabling rules. |

## Tasks

### Task 1: Secure Cookie Contract

- Add failing backend integration tests.
- Require a CSRF cookie/header on login, refresh, and logout.
- Return only access token and user data in JSON.
- Store refresh token in a host-only HttpOnly cookie.
- Rotate and blacklist refresh tokens.

### Task 2: Browser Session Architecture

- Add an in-memory session store.
- Bootstrap CSRF and refresh on application startup.
- Keep mock/test databases in localStorage, but never production tokens.
- Update auth and interceptor tests.

### Task 3: Quality Gate

- Fix all ESLint errors and warnings by category.
- Prioritize hook dependencies, derived state, async correctness, and type
  safety before cosmetic unused-code findings.
- Keep React/TypeScript rules enabled.

### Task 4: SAFE Refactor Clean

- Run dead-code and dependency analysis.
- Delete only zero-consumer internal code/dependencies.
- Re-run tests after every accepted cleanup group.

### Task 5: Verification

- Django deployment/migration checks.
- Full PostgreSQL backend suite and auth coverage.
- Frontend lint, tests, coverage, build, and npm audit.
- E2E/smoke flows for Admin, Guru, and Siswa.
- Security and diff review before commit.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| CSRF blocks legitimate dev requests | Medium | Bootstrap CSRF explicitly and test cross-port localhost flow. |
| Refresh retry loops | Medium | Use a transport without response interceptors and share one refresh promise. |
| Page reload loses access token | Expected | Refresh from HttpOnly cookie during provider initialization. |
| Token rotation race | Medium | Serialize refresh requests and enable SimpleJWT blacklist. |
| Lint cleanup changes behavior | Medium | Fix by category with focused tests and builds between batches. |
| Dead-code false positive | Medium | SAFE tier only; verify imports/string references and tests before deletion. |

## Acceptance

- [x] No production JWT appears in localStorage or sessionStorage.
- [x] Refresh cookie is HttpOnly, Secure in production, and scoped to auth paths.
- [x] CSRF is enforced on cookie-sensitive auth requests.
- [x] Refresh rotation and logout revocation are tested.
- [x] ESLint reports zero errors and zero warnings.
- [x] SAFE dead-code cleanup completes without regressions.
- [x] Backend, frontend, coverage, build, audit, and all-role verification pass.

## Authorization

The user explicitly approved executing steps 1 through 4 to completion on
2026-06-10, so this plan does not pause for additional confirmation.

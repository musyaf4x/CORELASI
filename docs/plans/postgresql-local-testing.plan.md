# Plan: PostgreSQL Local and Testing Migration

**Scope**: Move CORELASI local development, Django integration tests, and E2E data flows from SQLite to PostgreSQL.
**Complexity**: Medium
**Decision**: Run PostgreSQL as a separate Docker service on the same development device. Keep the application and database independently deployable.

## Summary

PostgreSQL becomes the default Django database for development and tests before
production deployment. SQLite remains available only through an explicit
`DB_ENGINE=sqlite` override for emergency diagnostics, so normal validation
cannot silently pass against a different database engine.

## Patterns to Mirror

| Category | Source | Pattern |
|---|---|---|
| Configuration | `corelasi-backend/config/settings.py` | Environment values are loaded with `python-decouple`. |
| Data access | `corelasi-backend/apps/*/models.py` | All persistence uses Django ORM; no SQLite-specific raw SQL was found. |
| Transactions | `corelasi-backend/apps/accounts/management/commands/seed_data.py` | Seed replacement is wrapped in `transaction.atomic()`. |
| Tests | `corelasi-backend/apps/*/tests.py` | Django `TestCase` and DRF API integration tests create isolated test data. |
| Schema | `corelasi-backend/apps/*/migrations/` | Existing Django migrations are the source of truth. |

## Files to Change

| File | Action | Why |
|---|---|---|
| `corelasi-backend/config/database.py` | CREATE | Centralize validated database configuration. |
| `corelasi-backend/config/settings.py` | UPDATE | Make PostgreSQL the default database engine. |
| `corelasi-backend/config/tests/test_database.py` | CREATE | Cover PostgreSQL, missing settings, fallback, and invalid engine behavior. |
| `corelasi-backend/requirements.txt` | UPDATE | Add the supported Psycopg 3 driver. |
| `corelasi-backend/.env.example` | CREATE | Document non-secret Django connection variables. |
| `corelasi-backend/.postgres.env.example` | CREATE | Document the minimal PostgreSQL container environment. |
| `docker-compose.yml` | CREATE | Provide PostgreSQL 16, health checks, and persistent storage. |
| `docs/plans/postgresql-local-testing.plan.md` | CREATE | Preserve implementation and validation sequence. |

## Tasks

### Task 1: Validated Database Configuration

- **Action**: Build PostgreSQL settings from environment variables and fail fast when required values are missing.
- **Fallback**: Permit SQLite only when `DB_ENGINE=sqlite` is explicitly set.
- **Validate**: `python manage.py test config.tests.test_database`

### Task 2: Local PostgreSQL Service

- **Action**: Run PostgreSQL 16 in Docker with a named volume, loopback-only port binding, and health check.
- **Security**: Read only PostgreSQL credentials from ignored `corelasi-backend/.postgres.env`; never pass Django secrets into the database container.
- **Validate**: `docker compose config` and `docker compose up -d postgres`

### Task 3: Schema and Demo Data

- **Action**: Apply the existing Django migrations to the clean PostgreSQL database, then run `seed_data`.
- **Validate**: `python manage.py migrate`, `python manage.py seed_data`, and model-count checks.

### Task 4: PostgreSQL Regression Suite

- **Action**: Run system checks, migration drift checks, and all backend tests against PostgreSQL.
- **Validate**: `python manage.py test accounts academic schedules attendance learning journals reports config`

### Task 5: Application Smoke

- **Action**: Start Django against PostgreSQL and exercise role-based login and critical API/UI routes.
- **Validate**: Login and dashboard smoke for Admin, Guru, and Siswa with no runtime or HTTP 5xx errors.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Docker daemon unavailable | Medium | Start Docker Desktop and verify daemon readiness before pulling the image. |
| Existing port 5432 occupied | Realized | Use the dedicated loopback host port `55432`; PostgreSQL remains on `5432` inside the container. |
| Test role cannot create databases | Low | Local container role owns the cluster and may create Django test databases. |
| SQLite-only query behavior | Low | CodeGraph and source scan found ORM usage and no SQLite-specific raw SQL. |
| Seed drift from current date | Medium | Validate record counts and critical logins after every seed. |
| Data loss during reset | Low | Use a dedicated named development volume; never point reset commands at production. |

## Validation

```powershell
Copy-Item corelasi-backend/.env.example corelasi-backend/.env
Copy-Item corelasi-backend/.postgres.env.example corelasi-backend/.postgres.env
docker compose config
docker compose up -d postgres
python manage.py migrate
python manage.py seed_data
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test config accounts academic schedules attendance learning journals reports
```

## Rollback

1. Stop the local PostgreSQL service with `docker compose stop postgres`.
2. Set `DB_ENGINE=sqlite` only for temporary diagnostics.
3. Do not delete the named PostgreSQL volume unless its resolved name and development-only ownership have been verified.

## Acceptance

- [x] PostgreSQL 16.13 service is healthy on `127.0.0.1:55432`.
- [x] Django reports vendor `postgresql` and database `corelasi`.
- [x] Existing migrations apply to a clean PostgreSQL database.
- [x] Demo seed completes and all three role accounts authenticate.
- [x] All 79 backend tests pass using a PostgreSQL test database.
- [x] Admin, Guru, and Siswa smoke routes pass across 12 routes.
- [x] Django system checks and migration drift checks pass.
- [x] PostgreSQL audit reports zero foreign keys without supporting indexes.

## Execution Result

Completed on June 10, 2026.

- Container: `corelasi-postgres`
- Image: `postgres:16-alpine`
- Persistent volume: `corelasi_postgres_data`
- Public exposure: loopback only, host port `55432`
- Schema: 23 public tables after Django migrations
- Seed: 7 users, 2 classes, 4 subjects, 3 schedules, 8 attendance rows
- Regression: 79/79 backend tests passed
- E2E: 12/12 critical role routes passed with no runtime errors or HTTP 5xx

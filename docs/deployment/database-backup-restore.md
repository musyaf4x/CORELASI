# Database Backup and Restore Operations Plan - CORELASI

This document outlines the database backup schedule, dump commands, storage policies, restore procedures, migration safety gates, and validation checklists for the CORELASI PostgreSQL database in production.

---

## 1. Backup Schedule & Strategy
*   **Automated Daily Backup**: Backups are run daily at 01:00 AM Western Indonesian Time (WIB) when system load is lowest.
*   **Retention Policy**: Keep daily backups for 7 days, weekly backups for 4 weeks, and monthly backups for 3 months.
*   **Backup Storage Location**: Stored on local host storage (`/var/backups/corelasi/`) and replicated securely to an offsite S3-compatible cloud storage bucket.
*   **Pre-Deployment Backup**: A manual backup must be executed immediately before applying any Django database migrations or system upgrades.

---

## 2. Backup Command
To dump the PostgreSQL database configuration and data from the active Docker container:
```bash
# Set variables
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/var/backups/corelasi/corelasi_backup_${BACKUP_DATE}.sql"

# Execute pg_dumpall (includes schemas, users, and all databases)
docker exec -t corelasi-prod-postgres pg_dumpall -c -U postgres > "$BACKUP_FILE"

# Compress the backup file to save space
gzip "$BACKUP_FILE"
```

> [!WARNING]
> Do NOT hardcode database credentials or passwords in the backup scripts. Use the standard `.postgres.env` or Docker env configurations for authentication.

---

## 3. Restore & Recovery Procedure
In the event of database corruption or a failed deployment migration:

1.  **Stop application services** to prevent active writes:
    ```bash
    docker compose -f docker-compose.prod.yml stop backend
    ```
2.  **Locate the latest backup file** and extract it:
    ```bash
    gunzip /var/backups/corelasi/corelasi_backup_[TARGET_DATE].sql.gz
    ```
3.  **Restore the SQL dump** directly into the PostgreSQL container:
    ```bash
    cat /var/backups/corelasi/corelasi_backup_[TARGET_DATE].sql | docker exec -i corelasi-prod-postgres psql -U postgres
    ```
4.  **Restart the backend service**:
    ```bash
    docker compose -f docker-compose.prod.yml start backend
    ```
5.  **Verify service logs**:
    ```bash
    docker compose -f docker-compose.prod.yml logs -f backend
    ```

---

## 4. Migration Safety & Rollback Gates
*   **Dry-Run Verification**: Before applying migrations in production, run them on a local SQLite or staging database to detect syntax errors.
*   **No Auto-Destructive Migrations**: Do not run migrations that delete columns or tables without a two-phase deploy (e.g. deprecate in Release N, delete in Release N+1).
*   **Rollback Procedure**:
    *   If a migration fails mid-way, check if Django has applied it partially using `showmigrations`.
    *   Revert the migration manually by running `migrate [app_name] [previous_migration_name]` if supported.
    *   If rollback fails, restore the pre-deployment database dump immediately.

---

## 5. Verification Checklist
Prior to finalizing any backup/restore task:
- [ ] Automated cron scheduled task is active and logging successes.
- [ ] Database backup file size is greater than 0 KB and increases with data addition.
- [ ] Pre-deployment backup executes cleanly.
- [ ] Restore procedure successfully recreates sample tables and relations in a test container.
- [ ] Secret values are completely absent from documentation and script logs.

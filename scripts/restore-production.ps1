[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$DatabaseBackup,
    [string]$MediaBackup,
    [string]$ContainerName = "corelasi-postgres",
    [switch]$ReplaceMedia,
    [switch]$ConfirmRestore
)

$ErrorActionPreference = "Stop"

if (-not $ConfirmRestore) {
    throw "Restore is destructive. Re-run with -ConfirmRestore."
}

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$backupDirectory = [System.IO.Path]::GetFullPath(
    (Join-Path $repoRoot "backups")
)
$backupPrefix = $backupDirectory.TrimEnd("\") + "\"

function Resolve-BackupPath {
    param(
        [string]$Path,
        [string]$RequiredExtension
    )

    $candidate = if ([System.IO.Path]::IsPathRooted($Path)) {
        [System.IO.Path]::GetFullPath($Path)
    } else {
        [System.IO.Path]::GetFullPath((Join-Path $repoRoot $Path))
    }

    if (
        -not $candidate.StartsWith(
            $backupPrefix,
            [System.StringComparison]::OrdinalIgnoreCase
        ) -or
        [System.IO.Path]::GetExtension($candidate) -ne $RequiredExtension
    ) {
        throw "Restore input must be a $RequiredExtension file inside backups."
    }
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
        throw "Backup file does not exist: $candidate"
    }
    return $candidate
}

$databasePath = Resolve-BackupPath $DatabaseBackup ".dump"

# Always take a fresh recovery point before changing production data.
& (Join-Path $PSScriptRoot "backup-production.ps1") `
    -ContainerName $ContainerName
if ($LASTEXITCODE -ne 0) {
    throw "Safety backup failed; restore aborted."
}

$databaseFile = [System.IO.Path]::GetFileName($databasePath)
$databaseUser = (& docker exec $ContainerName printenv POSTGRES_USER).Trim()
$databaseName = (& docker exec $ContainerName printenv POSTGRES_DB).Trim()
if (-not $databaseUser -or -not $databaseName) {
    throw "Container PostgreSQL environment is incomplete."
}

& docker exec $ContainerName psql `
    --username=$databaseUser `
    --dbname=postgres `
    --set=ON_ERROR_STOP=1 `
    --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$databaseName' AND pid <> pg_backend_pid();"
if ($LASTEXITCODE -ne 0) {
    throw "Could not terminate active database connections."
}

& docker exec $ContainerName pg_restore `
    --clean `
    --if-exists `
    --exit-on-error `
    --no-owner `
    --no-acl `
    --username=$databaseUser `
    --dbname=$databaseName `
    "/backups/$databaseFile"
if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL restore failed. Use the safety backup to recover."
}

if ($MediaBackup) {
    if (-not $ReplaceMedia) {
        throw "Media restore requires -ReplaceMedia."
    }
    $mediaPath = Resolve-BackupPath $MediaBackup ".zip"
    $mediaDirectory = [System.IO.Path]::GetFullPath(
        (Join-Path $repoRoot "corelasi-backend\media")
    )
    $backendDirectory = [System.IO.Path]::GetFullPath(
        (Join-Path $repoRoot "corelasi-backend")
    )
    $backendPrefix = $backendDirectory.TrimEnd("\") + "\"
    if (
        -not $mediaDirectory.StartsWith(
            $backendPrefix,
            [System.StringComparison]::OrdinalIgnoreCase
        ) -or
        [System.IO.Path]::GetFileName($mediaDirectory) -ne "media"
    ) {
        throw "Media directory safety validation failed."
    }

    New-Item -ItemType Directory -Path $mediaDirectory -Force | Out-Null
    Get-ChildItem -LiteralPath $mediaDirectory -Force |
        Remove-Item -Recurse -Force
    Expand-Archive `
        -LiteralPath $mediaPath `
        -DestinationPath $mediaDirectory `
        -Force
}

Write-Output "Restore completed. Run application smoke tests before reopening traffic."

[CmdletBinding()]
param(
    [string]$ContainerName = "corelasi-postgres",
    [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"

if ($RetentionDays -lt 1) {
    throw "RetentionDays must be at least 1."
}

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$backupDirectory = [System.IO.Path]::GetFullPath(
    (Join-Path $repoRoot "backups")
)
$expectedPrefix = $repoRoot.TrimEnd("\") + "\"
if (-not $backupDirectory.StartsWith(
    $expectedPrefix,
    [System.StringComparison]::OrdinalIgnoreCase
)) {
    throw "Backup directory resolved outside the repository."
}

New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null

$running = & docker inspect --format "{{.State.Running}}" $ContainerName 2>$null
if ($LASTEXITCODE -ne 0 -or $running -ne "true") {
    throw "PostgreSQL container '$ContainerName' is not running."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$databaseFile = "corelasi-db-$timestamp.dump"
$databaseContainerPath = "/backups/$databaseFile"
$dumpCommand = @'
pg_dump --format=custom --no-owner --no-acl --file="/backups/BACKUP_FILE" --username="$POSTGRES_USER" "$POSTGRES_DB"
'@.Replace("BACKUP_FILE", $databaseFile).Trim()

& docker exec $ContainerName sh -c $dumpCommand
if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL backup failed."
}

& docker exec $ContainerName pg_restore --list $databaseContainerPath *> $null
if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL backup verification failed."
}

$mediaDirectory = Join-Path $repoRoot "corelasi-backend\media"
$mediaFile = $null
if (
    (Test-Path -LiteralPath $mediaDirectory) -and
    (Get-ChildItem -LiteralPath $mediaDirectory -Force | Select-Object -First 1)
) {
    $mediaFile = "corelasi-media-$timestamp.zip"
    Compress-Archive `
        -Path (Join-Path $mediaDirectory "*") `
        -DestinationPath (Join-Path $backupDirectory $mediaFile) `
        -CompressionLevel Optimal
}

$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -LiteralPath $backupDirectory -File |
    Where-Object {
        $_.LastWriteTime -lt $cutoff -and
        $_.Extension -in ".dump", ".zip"
    } |
    ForEach-Object {
        Remove-Item -LiteralPath $_.FullName -Force
    }

Write-Output "Database backup verified: backups\$databaseFile"
if ($mediaFile) {
    Write-Output "Media backup created: backups\$mediaFile"
}

[CmdletBinding()]
param(
    [string]$EnvironmentFile = "corelasi-backend\.env.production",
    [string]$PythonExecutable = "corelasi-backend\.venv\Scripts\python.exe",
    [switch]$Prepare,
    [switch]$PrepareOnly
)

$ErrorActionPreference = "Stop"
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))

function Resolve-RepoPath {
    param([string]$Path)
    if ([System.IO.Path]::IsPathRooted($Path)) {
        return [System.IO.Path]::GetFullPath($Path)
    }
    return [System.IO.Path]::GetFullPath((Join-Path $repoRoot $Path))
}

$environmentPath = Resolve-RepoPath $EnvironmentFile
$pythonPath = Resolve-RepoPath $PythonExecutable
$backendDirectory = Join-Path $repoRoot "corelasi-backend"

if (-not (Test-Path -LiteralPath $environmentPath -PathType Leaf)) {
    throw "Production environment file not found: $environmentPath"
}
if (-not (Test-Path -LiteralPath $pythonPath -PathType Leaf)) {
    throw "Python executable not found: $pythonPath"
}

Get-Content -LiteralPath $environmentPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line.Split("=", 2)
        if ($parts.Count -ne 2) {
            throw "Invalid environment line: $line"
        }
        $name = $parts[0].Trim()
        $value = $parts[1].Trim().Trim('"').Trim("'")
        [System.Environment]::SetEnvironmentVariable(
            $name,
            $value,
            "Process"
        )
    }
}

Push-Location $backendDirectory
try {
    & $pythonPath manage.py check --deploy
    if ($LASTEXITCODE -ne 0) {
        throw "Django deployment check failed."
    }

    if ($Prepare -or $PrepareOnly) {
        & $pythonPath manage.py migrate --noinput
        if ($LASTEXITCODE -ne 0) {
            throw "Database migration failed."
        }
        & $pythonPath manage.py collectstatic --noinput
        if ($LASTEXITCODE -ne 0) {
            throw "Static collection failed."
        }
    }

    if (-not $PrepareOnly) {
        & $pythonPath -m waitress `
            --listen=127.0.0.1:8000 `
            --threads=8 `
            --connection-limit=100 `
            --channel-timeout=30 `
            --max-request-header-size=65536 `
            --max-request-body-size=12582912 `
            config.wsgi:application
    }
} finally {
    Pop-Location
}

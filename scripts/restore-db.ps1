param(
    [string]$DumpPath,
    [switch]$ResetDatabase
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot '.env'
$composeFile = Join-Path $repoRoot 'docker-compose.yml'

function Read-EnvFile {
    param([string]$Path)

    $values = @{}

    if (-not (Test-Path $Path)) {
        return $values
    }

    foreach ($line in Get-Content -LiteralPath $Path) {
        if ($line -match '^(?<key>[A-Za-z_][A-Za-z0-9_]*)=(?<value>.*)$') {
            $values[$Matches.key] = $Matches.value
        }
    }

    return $values
}

function Resolve-BackupDirectory {
    param([hashtable]$EnvValues)

    if ($EnvValues.ContainsKey('BACKUP_HOST_DIR') -and $EnvValues['BACKUP_HOST_DIR'].Trim() -ne '') {
        return $EnvValues['BACKUP_HOST_DIR']
    }

    return (Join-Path $repoRoot 'backups')
}

function Resolve-DumpPath {
    param(
        [string]$CandidatePath,
        [string]$BackupDirectory
    )

    if ($CandidatePath -and $CandidatePath.Trim() -ne '') {
        $resolved = $CandidatePath

        if (-not [System.IO.Path]::IsPathRooted($resolved)) {
            $resolved = Join-Path $repoRoot $resolved
        }

        $resolved = [System.IO.Path]::GetFullPath($resolved)

        if (-not (Test-Path -LiteralPath $resolved)) {
            throw "Dump non trovato: $resolved"
        }

        return $resolved
    }

    if (-not (Test-Path -LiteralPath $BackupDirectory)) {
        throw "Directory backup non trovata: $BackupDirectory"
    }

    $latestDump = Get-ChildItem -LiteralPath $BackupDirectory -Filter '*.sql' -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $latestDump) {
        throw "Nessun file .sql trovato in $BackupDirectory"
    }

    return $latestDump.FullName
}

function Get-DatabaseSettings {
    param([hashtable]$EnvValues)

    $user = if ($EnvValues.ContainsKey('POSTGRES_USER') -and $EnvValues['POSTGRES_USER'].Trim() -ne '') {
        $EnvValues['POSTGRES_USER']
    } else {
        'masso'
    }

    $database = if ($EnvValues.ContainsKey('POSTGRES_DB') -and $EnvValues['POSTGRES_DB'].Trim() -ne '') {
        $EnvValues['POSTGRES_DB']
    } else {
        'masso_db'
    }

    return @{
        User = $user
        Database = $database
    }
}

function Invoke-DockerCompose {
    param([string[]]$Arguments)

    & docker compose @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Comando fallito: docker compose $($Arguments -join ' ')"
    }
}

$envValues = Read-EnvFile -Path $envPath
$backupDirectory = Resolve-BackupDirectory -EnvValues $envValues
$resolvedDumpPath = Resolve-DumpPath -CandidatePath $DumpPath -BackupDirectory $backupDirectory
$databaseSettings = Get-DatabaseSettings -EnvValues $envValues

Write-Host ''
Write-Host 'Restore database' -ForegroundColor Cyan
Write-Host "Compose file: $composeFile"
Write-Host "Dump: $resolvedDumpPath"
Write-Host "Database: $($databaseSettings.Database)"
Write-Host ''

$confirmation = Read-Host 'Digita RESTORE per continuare'
if ($confirmation -ne 'RESTORE') {
    Write-Host 'Restore annullato.' -ForegroundColor Yellow
    exit 1
}

if ($ResetDatabase) {
    Write-Host 'Reset schema public prima del restore...' -ForegroundColor Yellow
    Invoke-DockerCompose -Arguments @(
        '-f', $composeFile,
        'exec', '-T', 'db',
        'psql', '-v', 'ON_ERROR_STOP=1',
        '-U', $databaseSettings.User,
        '-d', $databaseSettings.Database,
        '-c', 'DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;'
    )
}

Write-Host 'Esecuzione restore...' -ForegroundColor Yellow

$dumpContent = [System.IO.File]::ReadAllText($resolvedDumpPath)
$dumpContent |
    & docker compose -f $composeFile exec -T db psql -v ON_ERROR_STOP=1 -U $databaseSettings.User -d $databaseSettings.Database

if ($LASTEXITCODE -ne 0) {
    throw 'Restore fallito.'
}

Write-Host ''
Write-Host 'Restore completato con successo.' -ForegroundColor Green
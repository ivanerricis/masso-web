param(
    [switch]$OpenAfterSave,
    [switch]$ConfigureFirewall
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot '.env'
$examplePath = Join-Path $repoRoot '.env.example'

$entries = [ordered]@{
    POSTGRES_USER = 'masso'
    POSTGRES_PASSWORD = 'masso_password'
    POSTGRES_DB = 'masso_db'
    BACKUP_HOST_DIR = 'C:\Users\Utente\Desktop'
    LAB_NAME = 'Masso'
    LAB_EMAIL = 'info@masso.local'
    LAB_ADDRESS = 'Indirizzo laboratorio'
    LAB_PHONE = '+39 000 000 0000'
    LAB_LOGO_TEXT = 'Masso'
    LAB_LOGO_URL = '/assets/logo.jpg'
}

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

function Prompt-Value {
    param(
        [string]$Key,
        [string]$CurrentValue,
        [string]$DefaultValue
    )

    $label = if ($CurrentValue -ne '') { $CurrentValue } else { $DefaultValue }
    $input = Read-Host "$Key [$label]"

    if ($input.Trim() -eq '') {
        return $label
    }

    return $input
}

function Ensure-FirewallRule {
    param(
        [string]$DisplayName,
        [int]$Port
    )

    $existingRule = Get-NetFirewallRule -DisplayName $DisplayName -ErrorAction SilentlyContinue

    if ($null -ne $existingRule) {
        Write-Host "Regola firewall già presente: $DisplayName" -ForegroundColor DarkGray
        return
    }

    New-NetFirewallRule -DisplayName $DisplayName -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow | Out-Null
    Write-Host "Regola firewall creata: $DisplayName ($Port)" -ForegroundColor Green
}

function Get-PrimaryIpv4Address {
    $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notlike '127.*' -and
            $_.IPAddress -notlike '169.254.*' -and
            $_.IPAddress -ne '0.0.0.0'
        } |
        Sort-Object InterfaceMetric, InterfaceIndex

    return $candidates | Select-Object -First 1
}

$currentValues = Read-EnvFile -Path $envPath

Write-Host ''
Write-Host 'Editor interattivo del file .env' -ForegroundColor Cyan
Write-Host "Percorso: $envPath"
Write-Host ''

$newValues = [ordered]@{}

foreach ($key in $entries.Keys) {
    $currentValue = if ($currentValues.ContainsKey($key)) { [string]$currentValues[$key] } else { '' }
    $newValues[$key] = Prompt-Value -Key $key -CurrentValue $currentValue -DefaultValue $entries[$key]
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('# Shared / production-like configuration')
foreach ($key in @('POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'BACKUP_HOST_DIR')) {
    $lines.Add("$key=$($newValues[$key])")
}

$lines.Add('')
foreach ($key in @('LAB_NAME', 'LAB_EMAIL', 'LAB_ADDRESS', 'LAB_PHONE', 'LAB_LOGO_TEXT', 'LAB_LOGO_URL')) {
    $lines.Add("$key=$($newValues[$key])")
}

$lines.Add('')
$lines.Add('# Development-only notes:')
$lines.Add('# docker-compose.dev.yml already injects the frontend VITE_* values.')
$lines.Add('# If you run frontend outside Docker, you can use:')
$lines.Add('# VITE_API_URL=http://localhost:3000/api')
$lines.Add('# VITE_LOGO_URL=http://localhost:3000/assets/logo.jpg')

$content = ($lines -join [Environment]::NewLine) + [Environment]::NewLine
Set-Content -LiteralPath $envPath -Value $content -Encoding UTF8

Write-Host ''
Write-Host ".env aggiornato: $envPath" -ForegroundColor Green

if ($OpenAfterSave) {
    Start-Process notepad.exe $envPath
}

if ($ConfigureFirewall) {
    Write-Host ''
    Write-Host 'Configurazione firewall Windows Server...' -ForegroundColor Cyan

    try {
        Ensure-FirewallRule -DisplayName 'Masso Web HTTP 80' -Port 80
        Ensure-FirewallRule -DisplayName 'Masso Web HTTP 5173' -Port 5173
        Ensure-FirewallRule -DisplayName 'Masso Web API 3000' -Port 3000
    } catch {
        Write-Host 'Impossibile configurare il firewall. Avvia PowerShell come Amministratore e riprova.' -ForegroundColor Yellow
        Write-Host $_.Exception.Message -ForegroundColor Yellow
    }
}

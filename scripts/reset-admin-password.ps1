param(
    [string]$Username = 'admin'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $repoRoot 'docker-compose.yml'

Write-Host ''
Write-Host 'Reset password utente' -ForegroundColor Cyan
Write-Host "Compose file: $composeFile"
Write-Host "Utente: $Username"
Write-Host ''

$confirmation = Read-Host 'Digita RESET per continuare'
if ($confirmation -ne 'RESET') {
    Write-Host 'Operazione annullata.' -ForegroundColor Yellow
    exit 1
}

& docker compose -f $composeFile exec -T backend node reset-admin-password.js $Username
if ($LASTEXITCODE -ne 0) {
    throw 'Reset password fallito.'
}

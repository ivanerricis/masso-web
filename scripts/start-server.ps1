param(
    [switch]$NoBuild
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

Push-Location $repoRoot
try {
    Write-Host ''
    Write-Host 'Avvio container Docker...' -ForegroundColor Cyan

    $composeArgs = @('compose', 'up', '--build', '-d')
    if ($NoBuild) {
        $composeArgs = @('compose', 'up', '-d')
    }

    & docker @composeArgs

    if ($LASTEXITCODE -ne 0) {
        throw 'docker compose non è terminato correttamente.'
    }

    $ipCandidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notlike '127.*' -and
            $_.IPAddress -notlike '169.254.*' -and
            $_.IPAddress -ne '0.0.0.0'
        } |
        Sort-Object InterfaceMetric, InterfaceIndex
    $primaryIp = @($ipCandidates) | Select-Object -First 1

    Write-Host ''
    Write-Host 'Container avviati con successo.' -ForegroundColor Green

    if ($null -ne $primaryIp) {
        Write-Host 'Indirizzi di collegamento:' -ForegroundColor Cyan
        Write-Host "- Frontend: http://$($primaryIp.IPAddress)"
        Write-Host "- Backend:  http://$($primaryIp.IPAddress):3000/api"
    } else {
        Write-Host "Nessun indirizzo IPv4 trovato. Verifica l'IP della macchina manualmente." -ForegroundColor Yellow
    }
} finally {
    Pop-Location
}
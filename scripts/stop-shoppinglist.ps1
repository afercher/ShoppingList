$ErrorActionPreference = 'Stop'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$backendPath = Join-Path $projectRoot 'backend'
$runtimePath = Join-Path $projectRoot '.runtime'
$frontendPidFile = Join-Path $runtimePath 'frontend-http.pid'
Write-Host 'Stopping frontend server...' -ForegroundColor Cyan
if (Test-Path $frontendPidFile) {
    $savedPid = Get-Content $frontendPidFile -ErrorAction SilentlyContinue
    if ($savedPid -and (Get-Process -Id $savedPid -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $savedPid -Force
        Write-Host "Stopped frontend process PID $savedPid."
    } else {
        Write-Host 'No running frontend process found in PID file.' -ForegroundColor Yellow
    }
    Remove-Item $frontendPidFile -ErrorAction SilentlyContinue
} else {
    Write-Host 'No frontend PID file found.' -ForegroundColor Yellow
}
Write-Host 'Stopping backend services (Docker)...' -ForegroundColor Cyan
Push-Location $backendPath
try {
    docker compose down
} finally {
    Pop-Location
}
Write-Host ''
Write-Host 'ShoppingList services stopped.' -ForegroundColor Green

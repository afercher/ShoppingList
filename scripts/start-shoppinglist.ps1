$ErrorActionPreference = 'Stop'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'
$runtimePath = Join-Path $projectRoot '.runtime'
$frontendPidFile = Join-Path $runtimePath 'frontend-http.pid'
$frontendOutLog = Join-Path $runtimePath 'frontend-http.out.log'
$frontendErrLog = Join-Path $runtimePath 'frontend-http.err.log'
if (-not (Test-Path $runtimePath)) {
    New-Item -ItemType Directory -Path $runtimePath | Out-Null
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host 'Docker was not found. Please install/start Docker Desktop first.' -ForegroundColor Red
    exit 1
}
$pythonCommand = $null
if (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCommand = 'py'
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCommand = 'python'
}
if (-not $pythonCommand) {
    Write-Host 'Python launcher was not found (py/python). Please install Python 3.' -ForegroundColor Red
    exit 1
}
Write-Host 'Starting backend services (Docker)...' -ForegroundColor Cyan
Push-Location $backendPath
try {
    docker compose up -d --build
    if ($LASTEXITCODE -ne 0) {
        throw 'docker compose up failed.'
    }
    Write-Host 'Initializing database schema...' -ForegroundColor Cyan
    docker compose exec app php bin/init_schema.php
    if ($LASTEXITCODE -ne 0) {
        throw 'Schema initialization failed.'
    }
} finally {
    Pop-Location
}
$frontendRunning = $false
if (Test-Path $frontendPidFile) {
    $savedPid = Get-Content $frontendPidFile -ErrorAction SilentlyContinue
    if ($savedPid -and (Get-Process -Id $savedPid -ErrorAction SilentlyContinue)) {
        $frontendRunning = $true
    } else {
        Remove-Item $frontendPidFile -ErrorAction SilentlyContinue
    }
}
if (-not $frontendRunning) {
    Write-Host 'Starting frontend server on http://localhost:3000 ...' -ForegroundColor Cyan
    $process = Start-Process -FilePath $pythonCommand -ArgumentList '-m','http.server','3000' -WorkingDirectory $frontendPath -WindowStyle Hidden -RedirectStandardOutput $frontendOutLog -RedirectStandardError $frontendErrLog -PassThru
    Set-Content -Path $frontendPidFile -Value $process.Id
    Start-Sleep -Seconds 1
} else {
    Write-Host 'Frontend server is already running.' -ForegroundColor Yellow
}
Write-Host 'Opening app in browser...' -ForegroundColor Cyan
Start-Process 'http://shoppinglist.localhost:3000'
Write-Host ''
Write-Host 'ShoppingList is running.' -ForegroundColor Green
Write-Host 'Use StopShoppingList.bat to stop all services.' -ForegroundColor Green

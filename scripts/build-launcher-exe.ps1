param(
	[switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$outDir = Join-Path $projectRoot 'dist'
$startScript = Join-Path $PSScriptRoot 'start-shoppinglist.ps1'
$stopScript = Join-Path $PSScriptRoot 'stop-shoppinglist.ps1'
$startExe = Join-Path $outDir 'StartShoppingList.exe'
$stopExe = Join-Path $outDir 'StopShoppingList.exe'
$iconFile = Join-Path $projectRoot 'assets\shoppinglist.ico'

if (-not (Test-Path $outDir)) {
	New-Item -ItemType Directory -Path $outDir | Out-Null
}

if (-not (Test-Path $startScript)) {
	throw "Missing file: $startScript"
}

if (-not (Test-Path $stopScript)) {
	throw "Missing file: $stopScript"
}

if (-not (Get-Command Invoke-ps2exe -ErrorAction SilentlyContinue)) {
	if ($DryRun) {
		Write-Host 'DryRun: ps2exe module not installed, would run Install-Module ps2exe -Scope CurrentUser -Force' -ForegroundColor Yellow
	} else {
		Write-Host 'Installing ps2exe module (CurrentUser)...' -ForegroundColor Cyan
		Install-Module ps2exe -Scope CurrentUser -Force -AllowClobber
	}
}

$useIcon = Test-Path $iconFile
if ($useIcon) {
	Write-Host "Using icon: $iconFile" -ForegroundColor Cyan
} else {
	Write-Host 'No icon file found at assets/shoppinglist.ico. Building EXEs with default icon.' -ForegroundColor Yellow
}

$baseParams = @{
	noConsole = $false
	x64 = $true
	title = 'ShoppingList Launcher'
	company = 'ShoppingList'
	product = 'ShoppingList'
	copyright = 'Local Build'
	version = '1.0.0.0'
}

if ($DryRun) {
	Write-Host "DryRun: Would build $startExe from $startScript" -ForegroundColor Green
	Write-Host "DryRun: Would build $stopExe from $stopScript" -ForegroundColor Green
	exit 0
}

$startParams = $baseParams.Clone()
$startParams.inputFile = $startScript
$startParams.outputFile = $startExe
if ($useIcon) { $startParams.iconFile = $iconFile }

$stopParams = $baseParams.Clone()
$stopParams.inputFile = $stopScript
$stopParams.outputFile = $stopExe
if ($useIcon) { $stopParams.iconFile = $iconFile }

Write-Host 'Building StartShoppingList.exe ...' -ForegroundColor Cyan
Invoke-ps2exe @startParams

Write-Host 'Building StopShoppingList.exe ...' -ForegroundColor Cyan
Invoke-ps2exe @stopParams

Write-Host ''
Write-Host 'EXE build complete.' -ForegroundColor Green
Write-Host "Output: $outDir" -ForegroundColor Green


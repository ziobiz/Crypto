# Pack a modules/* kit into modules/dist/<name>-<version>.zip
# Usage: powershell -ExecutionPolicy Bypass -File modules\pack-module.ps1 -Name customer-auth-2fa

param(
  [Parameter(Mandatory = $true)]
  [string]$Name
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ModDir = Join-Path $Root "modules\$Name"
if (-not (Test-Path $ModDir)) {
  Write-Error "Module not found: $ModDir"
}

$VersionFile = Join-Path $ModDir "VERSION"
$Version = if (Test-Path $VersionFile) {
  (Get-Content $VersionFile -Raw).Trim()
} else {
  "0.0.0"
}

$DistDir = Join-Path $Root "modules\dist"
New-Item -ItemType Directory -Force -Path $DistDir | Out-Null

$ZipName = "$Name-$Version.zip"
$ZipPath = Join-Path $DistDir $ZipName
$LatestPath = Join-Path $DistDir "$Name.zip"

if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
if (Test-Path $LatestPath) { Remove-Item $LatestPath -Force }

$Staging = Join-Path $env:TEMP "tinpass-module-$Name-$Version"
if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
New-Item -ItemType Directory -Force -Path $Staging | Out-Null
Copy-Item -Path (Join-Path $ModDir "*") -Destination $Staging -Recurse -Force

Compress-Archive -Path (Join-Path $Staging "*") -DestinationPath $ZipPath -Force
Copy-Item $ZipPath $LatestPath -Force
Remove-Item $Staging -Recurse -Force

Write-Host "Packed: $ZipPath"
Write-Host "Latest: $LatestPath"
Write-Host "Size:   $([math]::Round((Get-Item $ZipPath).Length / 1KB, 1)) KB"

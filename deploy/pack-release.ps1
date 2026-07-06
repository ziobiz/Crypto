# 빌드 + 배포용 단일 zip 생성
#   powershell -ExecutionPolicy Bypass -File deploy\pack-release.ps1
#   powershell -ExecutionPolicy Bypass -File deploy\pack-release.ps1 -SkipBuild
#
# 생성 파일: deploy\release\crypto-release.zip
# FTP 업로드: /var/www/crypto-workflow/incoming/crypto-release.zip
# 서버 배포:  bash deploy/cafe24-business/apply-release.sh

param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$ReleaseDir = Join-Path $Root "deploy\release"
$ZipPath = Join-Path $ReleaseDir "crypto-release.zip"
$Stage = Join-Path $env:TEMP "crypto-release-stage"

if (-not $SkipBuild) {
  Write-Host "==> 빌드"
  & (Join-Path $Root "deploy\local-build.ps1")
}

Write-Host "==> 빌드 산출물 확인"
foreach ($f in @("backend\dist\index.js", "frontend\.next\BUILD_ID", "server\dist\index.js")) {
  if (-not (Test-Path $f)) {
    Write-Host "ERROR: $f 없음"
    exit 1
  }
}

Write-Host "==> 배포 패키지 생성"
if (Test-Path $Stage) { Remove-Item $Stage -Recurse -Force }
New-Item -ItemType Directory -Path $Stage | Out-Null
if (-not (Test-Path $ReleaseDir)) { New-Item -ItemType Directory -Path $ReleaseDir | Out-Null }
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

$copy = @(
  @{ Src = "backend\dist"; Dst = "backend\dist" },
  @{ Src = "backend\prisma"; Dst = "backend\prisma" },
  @{ Src = "backend\package.json"; Dst = "backend\package.json" },
  @{ Src = "backend\package-lock.json"; Dst = "backend\package-lock.json" },
  @{ Src = "frontend\.next"; Dst = "frontend\.next" },
  @{ Src = "frontend\package.json"; Dst = "frontend\package.json" },
  @{ Src = "frontend\package-lock.json"; Dst = "frontend\package-lock.json" },
  @{ Src = "frontend\next.config.js"; Dst = "frontend\next.config.js" },
  @{ Src = "server\dist"; Dst = "server\dist" },
  @{ Src = "server\package.json"; Dst = "server\package.json" },
  @{ Src = "server\package-lock.json"; Dst = "server\package-lock.json" },
  @{ Src = "deploy"; Dst = "deploy" }
)
if (Test-Path "frontend\public") {
  $copy += @{ Src = "frontend\public"; Dst = "frontend\public" }
}

foreach ($item in $copy) {
  $src = Join-Path $Root $item.Src
  $dest = Join-Path $Stage $item.Dst
  $parent = Split-Path $dest -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
  if (Test-Path $src -PathType Container) {
    Copy-Item $src $dest -Recurse -Force
  } elseif (Test-Path $src) {
    Copy-Item $src $dest -Force
  } else {
    Write-Host "WARN: $($item.Src) 없음 — 건너뜀"
  }
}

Compress-Archive -Path (Join-Path $Stage "*") -DestinationPath $ZipPath -CompressionLevel Optimal -Force
Remove-Item $Stage -Recurse -Force

$sizeMb = [math]::Round((Get-Item $ZipPath).Length / 1MB, 1)
Write-Host ""
Write-Host "=============================================="
Write-Host " 배포 패키지 생성 완료"
Write-Host " 파일: $ZipPath ($sizeMb MB)"
Write-Host "=============================================="
Write-Host ""
Write-Host " [1] FTP 업로드"
Write-Host "     로컬: deploy\release\crypto-release.zip"
Write-Host "     서버: /var/www/crypto-workflow/incoming/crypto-release.zip"
Write-Host ""
Write-Host " [2] SSH 배포 (1줄)"
Write-Host "     cd /var/www/crypto-workflow && bash deploy/cafe24-business/apply-release.sh"
Write-Host ""

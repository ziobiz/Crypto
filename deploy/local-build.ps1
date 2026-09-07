# 로컬 PC (Windows) — 배포용 빌드
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "==> Frontend (next build)"
if (-not (Test-Path "frontend\node_modules\.bin\next.cmd")) {
  npm ci --prefix frontend
}
$env:NODE_OPTIONS = "--max-old-space-size=4096"
npm run build --prefix frontend

Write-Host "==> Backend (prisma generate + tsc) — frontend 이후에 실행 (dist 오염 방지)"
if (-not (Test-Path "backend\node_modules\.bin\tsc.cmd")) {
  npm ci --prefix backend
}
Push-Location backend
if (Test-Path "node_modules\.bin\prisma.cmd") {
  npx prisma generate
}
Pop-Location
npm run build --prefix backend

Write-Host "==> Server (tsc)"
if (-not (Test-Path "server\node_modules\.bin\tsc.cmd")) {
  npm ci --prefix server
}
npm run build --prefix server

Write-Host ""
Write-Host "빌드 완료. 배포 zip 생성:"
Write-Host "  powershell -ExecutionPolicy Bypass -File deploy\pack-release.ps1 -SkipBuild"

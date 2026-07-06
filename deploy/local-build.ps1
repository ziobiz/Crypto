# 로컬 PC (Windows) — 배포용 빌드
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "==> Backend (tsc)"
if (-not (Test-Path "backend\node_modules\.bin\tsc.cmd")) {
  npm ci --prefix backend
}
npm run build --prefix backend
Push-Location backend
if (Test-Path "node_modules\.bin\prisma.cmd") {
  npx prisma generate
} else {
  Write-Warn "prisma CLI missing — skip generate (server will run prisma generate)"
}
Pop-Location

Write-Host "==> Frontend (next build)"
if (-not (Test-Path "frontend\node_modules\.bin\next.cmd")) {
  npm ci --prefix frontend
}
$env:NODE_OPTIONS = "--max-old-space-size=4096"
npm run build --prefix frontend

Write-Host "==> Server (tsc)"
if (-not (Test-Path "server\node_modules\.bin\tsc.cmd")) {
  npm ci --prefix server
}
npm run build --prefix server

Write-Host ""
Write-Host "빌드 완료. FTP 업로드 후 서버 SSH:"
Write-Host "  bash deploy/cafe24-business/ftp-apply-built.sh"

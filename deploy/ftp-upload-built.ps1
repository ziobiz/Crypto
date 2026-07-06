# 로컬 빌드 산출물 → zip 생성 후 SCP 업로드 (FTP 대신 자동 업로드용)
# 권장: deploy\pack-release.ps1 로 zip 만든 뒤 FTP 수동 업로드
# 사용: powershell -ExecutionPolicy Bypass -File deploy\ftp-upload-built.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Server = "root@114.207.245.160"
$RemoteDir = "/var/www/crypto-workflow"
$ZipPath = Join-Path $env:TEMP "crypto-built-upload.zip"

Set-Location $Root

& (Join-Path $Root "deploy\pack-release.ps1") -SkipBuild
$ZipPath = Join-Path $Root "deploy\release\crypto-release.zip"
if (-not (Test-Path $ZipPath)) { exit 1 }

Write-Host "==> SCP 업로드 (비밀번호 입력)"
scp $ZipPath "${Server}:/var/www/crypto-workflow/incoming/crypto-release.zip"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> 서버 배포 (비밀번호 재입력)"
$remoteCmd = "cd $RemoteDir && bash deploy/cafe24-business/apply-release.sh"

ssh $Server $remoteCmd

Write-Host ""
Write-Host "완료: https://api.tinpass.com/login"

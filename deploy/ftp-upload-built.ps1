# 로컬 빌드 산출물 → 서버 SCP 업로드 → ftp-apply-built.sh
# 사용: powershell -ExecutionPolicy Bypass -File deploy\ftp-upload-built.ps1
# (root 비밀번호 입력 필요)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Server = "root@114.207.245.160"
$RemoteDir = "/var/www/crypto-workflow"
$ZipPath = Join-Path $env:TEMP "crypto-built-upload.zip"

Set-Location $Root

Write-Host "==> 빌드 확인"
foreach ($f in @("backend\dist\index.js", "frontend\.next\BUILD_ID", "server\dist\index.js")) {
  if (-not (Test-Path $f)) {
    Write-Host "ERROR: $f 없음 — 먼저 deploy\local-build.ps1 실행"
    exit 1
  }
}

Write-Host "==> 업로드 패키지 생성"
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
$Stage = Join-Path $env:TEMP "crypto-built-stage"
if (Test-Path $Stage) { Remove-Item $Stage -Recurse -Force }
New-Item -ItemType Directory -Path $Stage | Out-Null

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
  $dest = Join-Path $Stage $item.Dst
  $parent = Split-Path $dest -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
  if (Test-Path $item.Src -PathType Container) {
    Copy-Item $item.Src $dest -Recurse -Force
  } else {
    Copy-Item $item.Src $dest -Force
  }
}

Compress-Archive -Path (Join-Path $Stage "*") -DestinationPath $ZipPath -Force
Write-Host "패키지: $ZipPath ($([math]::Round((Get-Item $ZipPath).Length / 1MB, 1)) MB)"

Write-Host "==> SCP 업로드 (비밀번호 입력)"
scp $ZipPath "${Server}:/tmp/crypto-built-upload.zip"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> 서버 적용 (비밀번호 재입력)"
$remoteCmd = @"
set -e
cd $RemoteDir
unzip -o /tmp/crypto-built-upload.zip
sed -i 's/\r$//' deploy/cafe24-business/*.sh
bash deploy/cafe24-business/ftp-apply-built.sh
"@

ssh $Server $remoteCmd

Write-Host ""
Write-Host "완료: https://api.tinpass.com/login"

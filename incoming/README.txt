Cafe24 FTP — 배포 zip 업로드 폴더
====================================

업로드할 파일 (이름 고정):
  crypto-release.zip

FTP 경로:
  /var/www/crypto-workflow/incoming/crypto-release.zip

PC에서 zip 생성:
  powershell -ExecutionPolicy Bypass -File deploy\pack-release.ps1

SSH에서 배포 (1줄):
  cd /var/www/crypto-workflow && bash deploy/cafe24-business/apply-release.sh

주의:
  - backend/.env, frontend/.env.local 은 서버에만 두고 zip에 넣지 마세요.
  - 배포 완료 후 zip은 crypto-release.applied-날짜.zip 으로 자동 백업됩니다.

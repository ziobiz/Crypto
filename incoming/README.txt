Cafe24 FTP - deploy zip upload
================================

Upload ONE file (fixed name):
  crypto-release.zip

FTP path (choose either):

  A) /var/www/crypto-workflow/incoming/crypto-release.zip
  B) /var/www/crypto-workflow/deploy/cafe24-business/crypto-release.zip

Create zip on PC:
  powershell -ExecutionPolicy Bypass -File deploy\pack-release.ps1

Deploy on server (SSH):
  cd /var/www/crypto-workflow && bash deploy/cafe24-business/apply-release.sh

Notes:
  - incoming/ = zip drop folder only
  - cafe24-business/ = deploy scripts (+ optional zip upload path B)
  - zip extracts to project root (backend/, frontend/, server/, deploy/)
  - do NOT put backend/.env in the zip

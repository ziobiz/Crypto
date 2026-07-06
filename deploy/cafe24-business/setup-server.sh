#!/bin/bash
# 카페24 가상서버 비즈니스(2GB) — 최초 1회 서버 설정
# Ubuntu 22.04 + root 실행
set -euo pipefail

APP_DIR="/var/www/crypto-workflow"
DB_NAME="crypto_workflow"
DB_USER="crypto"
SWAP_SIZE="2G"

echo "==> Swap 추가 (2GB RAM 보완)"
if [ ! -f /swapfile ]; then
  fallocate -l "$SWAP_SIZE" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> 패키지 설치"
apt-get update
apt-get install -y curl git nginx postgresql postgresql-contrib ufw

echo "==> 방화벽 (HTTP/HTTPS + SSH)"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Node.js 20 LTS"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2

echo "==> PostgreSQL 설정"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD 'CHANGE_ME_STRONG';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# PostgreSQL 메모리 튜닝 (2GB 서버)
PG_CONF=$(sudo -u postgres psql -t -P format=unaligned -c 'SHOW config_file')
cat >> "$PG_CONF" << 'EOF'

# crypto-workflow low-memory tuning
shared_buffers = 128MB
effective_cache_size = 512MB
work_mem = 4MB
maintenance_work_mem = 64MB
EOF
systemctl restart postgresql

echo "==> 앱 디렉터리"
mkdir -p "$APP_DIR/uploads"
APP_OWNER="${SUDO_USER:-root}"
chown -R "$APP_OWNER:$APP_OWNER" "$APP_DIR" 2>/dev/null || true

echo "==> PM2 부팅 시 자동 시작"
pm2 startup systemd -u root --hp /root
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root || true

echo ""
echo "완료. 다음 단계:"
echo "  1. git clone 또는 코드 업로드 → $APP_DIR"
echo "  2. backend/.env, frontend/.env.local 설정"
echo "  3. bash deploy/cafe24-business/deploy.sh 실행"
echo "  4. nginx 설정: deploy/cafe24-business/nginx/crypto-workflow.conf"

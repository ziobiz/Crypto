#!/bin/bash
# tinpass.com 운영 — env 작성 + (선택) Nginx + 빌드 + PM2
# SSL(certbot) 적용 후에는 Nginx 설정을 덮어쓰지 않습니다.
#
# 사용:
#   cd /var/www/crypto-workflow
#   git pull
#   bash deploy/cafe24-business/tinpass-deploy-all.sh
set -euo pipefail

ROOT="/var/www/crypto-workflow"
cd "$ROOT"

echo "==> Git 최신화"
git checkout -- deploy/cafe24-business/deploy.sh deploy/cafe24-business/setup-server.sh 2>/dev/null || true
git pull

echo "==> backend/.env"
cat > backend/.env <<'ENVEOF'
DATABASE_URL="postgresql://crypto:Line2025%21%21@localhost:5432/crypto_workflow?schema=public"

PORT=4000
NODE_ENV=production

CORS_ORIGIN=https://api.tinpass.com,https://tinpass.com,https://www.tinpass.com

JWT_SECRET=CryptoWorkflow2026ZiobizSecretKey32
JWT_EXPIRES_IN=7d

UPLOAD_DIR=/var/www/crypto-workflow/uploads

EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest/USD
ENVEOF

echo "==> frontend/.env.local"
cat > frontend/.env.local <<'ENVEOF'
NEXT_PUBLIC_API_URL=https://api.tinpass.com
ENVEOF

if [ -f /etc/letsencrypt/live/api.tinpass.com/fullchain.pem ] || \
   [ -f /etc/letsencrypt/live/tinpass.com/fullchain.pem ]; then
  echo "==> Nginx + SSL (인증서 있음)"
  sudo bash deploy/cafe24-business/setup-ssl-tinpass.sh 2>/dev/null || \
    bash deploy/cafe24-business/setup-ssl-tinpass.sh
else
  echo "==> Nginx HTTP + SSL 발급 시도"
  sudo bash deploy/cafe24-business/setup-ssl-tinpass.sh 2>/dev/null || {
    echo "==> Nginx (HTTP only — SSL은 수동 실행)"
    cp deploy/cafe24-business/nginx/crypto-workflow-tinpass.conf /etc/nginx/conf.d/
    rm -f /etc/nginx/conf.d/crypto-workflow.conf
    nginx -t
    systemctl reload nginx
    echo "    sudo bash deploy/cafe24-business/setup-ssl-tinpass.sh"
  }
fi

echo "==> 디렉터리"
mkdir -p uploads logs /var/www/crypto-workflow/uploads

echo "==> 배포 (빌드 + db push + PM2)"
bash deploy/cafe24-business/deploy.sh

echo ""
echo "============================================"
echo " 완료 — https://api.tinpass.com"
echo " 로그인: ziobizm@gmail.com / ziobizm1!"
echo "============================================"
pm2 status
curl -sf https://api.tinpass.com/api/auth/me -H "Authorization: Bearer x" | head -c 120 || true
echo ""

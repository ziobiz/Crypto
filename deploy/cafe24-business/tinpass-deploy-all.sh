#!/bin/bash
# tinpass.com 운영 — env 작성 + Nginx + 빌드 + PM2 재시작 (한 번에)
# 사용: bash deploy/cafe24-business/tinpass-deploy-all.sh
set -euo pipefail

ROOT="/var/www/crypto-workflow"
cd "$ROOT"

echo "==> Git 최신화"
git checkout -- deploy/cafe24-business/deploy.sh deploy/cafe24-business/setup-server.sh 2>/dev/null || true
git pull

echo "==> backend/.env"
cat > backend/.env <<'EOF'
DATABASE_URL="postgresql://crypto:Line2025%21%21@localhost:5432/crypto_workflow?schema=public"

PORT=4000
NODE_ENV=production

CORS_ORIGIN=https://api.tinpass.com,https://tinpass.com,https://www.tinpass.com

JWT_SECRET=CryptoWorkflow2026ZiobizSecretKey32
JWT_EXPIRES_IN=7d

UPLOAD_DIR=/var/www/crypto-workflow/uploads

EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest/USD
EOF

echo "==> frontend/.env.local"
cat > frontend/.env.local <<'EOF'
NEXT_PUBLIC_API_URL=https://api.tinpass.com
EOF

echo "==> Nginx (tinpass)"
cp deploy/cafe24-business/nginx/crypto-workflow-tinpass.conf /etc/nginx/conf.d/
rm -f /etc/nginx/conf.d/crypto-workflow.conf
nginx -t
systemctl reload nginx

echo "==> 디렉터리"
mkdir -p uploads logs
mkdir -p /var/www/crypto-workflow/uploads

echo "==> 배포 (빌드 + db push + PM2)"
bash deploy/cafe24-business/deploy.sh

echo ""
echo "============================================"
echo " 완료"
echo "  Web/API: https://api.tinpass.com"
echo "  로그인:  admin@ziobiz.com / password123"
echo ""
echo " SSL 미적용 시 아래 실행:"
echo "  certbot --nginx -d api.tinpass.com -d tinpass.com -d www.tinpass.com \\"
echo "    --non-interactive --agree-tos -m admin@ziobiz.com --redirect"
echo "============================================"

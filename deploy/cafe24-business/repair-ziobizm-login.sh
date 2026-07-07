#!/bin/bash
# ziobizm@gmail.com 로그인 즉시 복구 (배포 없이 DB만)
#   cd /var/www/crypto-workflow/backend && node scripts/ensure-admin-account.js
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/backend"
node scripts/ensure-admin-account.js
pm2 restart crypto 2>/dev/null || true
echo ""
echo "Try: ziobizm@gmail.com / ziobizm1!"
echo "If OTP screen appears, use Google Authenticator or reset OTP in user admin."

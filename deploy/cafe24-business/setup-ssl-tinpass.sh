#!/bin/bash
# tinpass.com / api.tinpass.com — Let's Encrypt SSL + Nginx HTTPS
#
#   cd /var/www/crypto-workflow
#   sudo bash deploy/cafe24-business/setup-ssl-tinpass.sh
#
# 환경변수 (선택):
#   CERTBOT_EMAIL=admin@example.com
#   CERTBOT_STAGING=1   # 테스트용
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

DOMAINS=(api.tinpass.com tinpass.com www.tinpass.com)
EMAIL="${CERTBOT_EMAIL:-ziobizm@gmail.com}"
NGINX_CONF="/etc/nginx/conf.d/crypto-workflow-tinpass.conf"
SSL_TEMPLATE="$ROOT/deploy/cafe24-business/nginx/crypto-workflow-tinpass-ssl.conf.template"
HTTP_CONF="$ROOT/deploy/cafe24-business/nginx/crypto-workflow-tinpass.conf"

echo "=============================================="
echo " TINPASS SSL setup"
echo "=============================================="

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo bash deploy/cafe24-business/setup-ssl-tinpass.sh"
  exit 1
fi

echo "==> Install certbot (if needed)"
if ! command -v certbot >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y certbot
fi

mkdir -p /var/www/certbot

echo "==> HTTP nginx (ACME challenge + proxy)"
cp "$HTTP_CONF" "$NGINX_CONF"
rm -f /etc/nginx/conf.d/crypto-workflow.conf
nginx -t
systemctl reload nginx

CERT_NAME=""
for name in api.tinpass.com tinpass.com; do
  if [ -f "/etc/letsencrypt/live/$name/fullchain.pem" ]; then
    CERT_NAME="$name"
    break
  fi
done

echo "==> Obtain / expand certificate (tinpass.com + api.tinpass.com)"
CERTBOT_ARGS=(
  certonly
  --webroot
  -w /var/www/certbot
  --email "$EMAIL"
  --agree-tos
  --no-eff-email
  --non-interactive
  --keep-until-expiring
)
if [ -n "${CERTBOT_STAGING:-}" ]; then
  CERTBOT_ARGS+=(--staging)
fi
if [ -n "$CERT_NAME" ]; then
  CERTBOT_ARGS+=(--cert-name "$CERT_NAME" --expand)
else
  CERT_NAME="api.tinpass.com"
  CERTBOT_ARGS+=(--cert-name "$CERT_NAME")
fi
for d in "${DOMAINS[@]}"; do
  CERTBOT_ARGS+=(-d "$d")
done

if ! certbot "${CERTBOT_ARGS[@]}"; then
  echo ""
  echo "certbot failed. Check:"
  echo "  1) DNS A record: tinpass.com, www.tinpass.com, api.tinpass.com → server IP"
  echo "  2) Port 80 open (ufw allow 80)"
  echo "  3) curl -I http://tinpass.com/.well-known/acme-challenge/test"
  exit 1
fi

if [ ! -f "/etc/letsencrypt/live/$CERT_NAME/fullchain.pem" ]; then
  for name in api.tinpass.com tinpass.com; do
    if [ -f "/etc/letsencrypt/live/$name/fullchain.pem" ]; then
      CERT_NAME="$name"
      break
    fi
  done
fi

if [ ! -f "/etc/letsencrypt/live/$CERT_NAME/fullchain.pem" ]; then
  echo "ERROR: certificate file not found"
  exit 1
fi

echo "==> SSL helper files"
if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
  curl -fsSL https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o /etc/letsencrypt/options-ssl-nginx.conf 2>/dev/null || {
    cat > /etc/letsencrypt/options-ssl-nginx.conf <<'EOF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
EOF
  }
fi
if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
  openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

echo "==> Apply HTTPS nginx (cert: $CERT_NAME)"
sed "s/CERT_NAME/$CERT_NAME/g" "$SSL_TEMPLATE" > "$NGINX_CONF"
nginx -t
systemctl reload nginx

systemctl enable certbot.timer 2>/dev/null || true
systemctl start certbot.timer 2>/dev/null || true

echo ""
echo "=============================================="
echo " SSL OK"
echo "  https://tinpass.com/login"
echo "  https://api.tinpass.com/login"
openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$CERT_NAME/fullchain.pem"
echo "=============================================="

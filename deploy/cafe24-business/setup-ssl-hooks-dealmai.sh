#!/bin/bash
# hooks.dealmai.com — Let's Encrypt SSL + Nginx (CURFEX webhook hostname)
#
#   cd /var/www/crypto-workflow
#   sudo bash deploy/cafe24-business/setup-ssl-hooks-dealmai.sh
#
# DNS: hooks.dealmai.com A → TINPASS server IP (162.35.16.100)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

DOMAIN="hooks.dealmai.com"
EMAIL="${CERTBOT_EMAIL:-ziobizm@gmail.com}"
NGINX_CONF="/etc/nginx/conf.d/hooks-dealmai.conf"
HTTP_CONF="$ROOT/deploy/cafe24-business/nginx/hooks-dealmai.conf"
SSL_TEMPLATE="$ROOT/deploy/cafe24-business/nginx/hooks-dealmai-ssl.conf.template"

echo "=============================================="
echo " hooks.dealmai.com SSL setup"
echo "=============================================="

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo bash deploy/cafe24-business/setup-ssl-hooks-dealmai.sh"
  exit 1
fi

echo "==> Install certbot (if needed)"
if ! command -v certbot >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y certbot
fi

mkdir -p /var/www/certbot

echo "==> HTTP nginx for ACME ($DOMAIN)"
cp "$HTTP_CONF" "$NGINX_CONF"
nginx -t
systemctl reload nginx

echo "==> Obtain / renew certificate for $DOMAIN"
CERT_NAME="$DOMAIN"
run_certbot() {
  local -a args=(
    certonly
    --webroot
    -w /var/www/certbot
    --email "$EMAIL"
    --agree-tos
    --no-eff-email
    --non-interactive
    --keep-until-expiring
    --cert-name "$CERT_NAME"
    -d "$DOMAIN"
  )
  if [ -n "${CERTBOT_STAGING:-}" ]; then
    args+=(--staging)
  fi
  certbot "${args[@]}"
}

if ! run_certbot; then
  echo ""
  echo "certbot failed for $DOMAIN. Check:"
  echo "  1) DNS A: $DOMAIN → this server IP"
  echo "  2) Port 80 open"
  echo "  3) dig +short $DOMAIN"
  exit 1
fi

if [ ! -f "/etc/letsencrypt/live/$CERT_NAME/fullchain.pem" ]; then
  echo "ERROR: certificate file not found for $CERT_NAME"
  exit 1
fi

echo "==> SSL helper files"
if [ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]; then
  cat > /etc/letsencrypt/options-ssl-nginx.conf <<'EOF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
EOF
fi
if [ ! -f /etc/letsencrypt/ssl-dhparams.pem ]; then
  openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

echo "==> Apply HTTPS nginx for $DOMAIN"
sed "s/CERT_NAME/$CERT_NAME/g" "$SSL_TEMPLATE" > "$NGINX_CONF"
nginx -t
systemctl reload nginx

echo ""
echo "=============================================="
echo " SSL OK: https://$DOMAIN"
echo " CURFEX webhook: https://$DOMAIN/api/webhooks/curfex"
echo "=============================================="

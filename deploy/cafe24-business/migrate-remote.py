#!/usr/bin/env python3
"""Remote helper for TINPASS server migration. Do not commit secrets."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import paramiko

NEW_HOST = "162.35.16.100"
OLD_HOST = "114.207.245.160"


def connect(host: str, password: str | None = None) -> paramiko.SSHClient:
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    kwargs = {
        "hostname": host,
        "username": "root",
        "timeout": 30,
    }
    if password:
        kwargs.update(password=password, allow_agent=False, look_for_keys=False)
    else:
        kwargs.update(allow_agent=True, look_for_keys=True)
    c.connect(**kwargs)
    return c


def run(c: paramiko.SSHClient, cmd: str, check: bool = True) -> str:
    print(f"\n$ {cmd[:200]}{'...' if len(cmd) > 200 else ''}")
    stdin, stdout, stderr = c.exec_command(cmd, get_pty=True)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    code = stdout.channel.recv_exit_status()
    safe_out = out.encode("utf-8", errors="replace").decode("utf-8", errors="replace")
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    except Exception:
        pass
    if safe_out:
        print(safe_out)
    if err and err.strip() and err.strip() not in out:
        print(err.encode("ascii", errors="replace").decode("ascii"), file=sys.stderr)
    if check and code != 0:
        raise RuntimeError(f"exit {code} for: {cmd[:120]}")
    return out


def sftp_get(c: paramiko.SSHClient, remote: str, local: Path) -> None:
    local.parent.mkdir(parents=True, exist_ok=True)
    sftp = c.open_sftp()
    print(f"GET {remote} -> {local}")
    sftp.get(remote, str(local))
    sftp.close()


def sftp_put(c: paramiko.SSHClient, local: Path, remote: str) -> None:
    sftp = c.open_sftp()
    print(f"PUT {local} -> {remote}")
    sftp.put(str(local), remote)
    sftp.close()


def cmd_inspect_old(_: argparse.Namespace) -> None:
    c = connect(OLD_HOST)
    run(
        c,
        """
set -e
echo '=== files ==='
ls -la /var/www/crypto-workflow/backend/.env /var/www/crypto-workflow/frontend/.env.local || true
echo '=== sizes ==='
du -sh /var/www/crypto-workflow/uploads || true
du -sh /var/www/crypto-workflow || true
echo '=== mem ==='
free -h | head -2
echo '=== pm2 ==='
pm2 list || true
echo '=== db ==='
sudo -u postgres psql -tAc "SELECT datname || ' ' || pg_size_pretty(pg_database_size(datname)) FROM pg_database WHERE datistemplate = false;"
""",
    )
    c.close()


def cmd_setup_new(args: argparse.Namespace) -> None:
    # Prefer key auth; fall back to password if provided.
    try:
        c = connect(NEW_HOST)
    except Exception:
        if not args.password:
            raise
        c = connect(NEW_HOST, password=args.password)

    # Upload setup-server.sh from local repo if present
    local_setup = Path(args.repo) / "deploy/cafe24-business/setup-server.sh"
    if local_setup.exists():
        run(c, "mkdir -p /var/www/crypto-workflow/deploy/cafe24-business /var/www/crypto-workflow/incoming /var/www/crypto-workflow/uploads")
        sftp_put(c, local_setup, "/tmp/setup-server.sh")
        run(c, "sed -i 's/\\r$//' /tmp/setup-server.sh && chmod +x /tmp/setup-server.sh && bash /tmp/setup-server.sh")
    else:
        run(
            c,
            """
set -euo pipefail
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y curl git nginx postgresql postgresql-contrib ufw unzip
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='crypto'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER crypto WITH PASSWORD 'CHANGE_ME_STRONG';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='crypto_workflow'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE crypto_workflow OWNER crypto;"
mkdir -p /var/www/crypto-workflow/uploads /var/www/crypto-workflow/incoming
pm2 startup systemd -u root --hp /root || true
""",
        )
    run(c, "node -v; npm -v; psql --version; nginx -v; pm2 -v; free -h | head -2")
    c.close()
    print("SETUP_NEW_DONE")


def cmd_backup_old(args: argparse.Namespace) -> None:
    staging = Path(args.staging)
    staging.mkdir(parents=True, exist_ok=True)
    c = connect(OLD_HOST)
    run(
        c,
        """
set -euo pipefail
mkdir -p /tmp/tinpass-migrate
rm -f /tmp/tinpass-migrate/*
echo '==> pg_dump'
sudo -u postgres pg_dump -Fc crypto_workflow > /tmp/tinpass-migrate/crypto_workflow.dump
echo '==> uploads'
tar -C /var/www/crypto-workflow -czf /tmp/tinpass-migrate/uploads.tar.gz uploads || tar -czf /tmp/tinpass-migrate/uploads.tar.gz --files-from /dev/null
echo '==> env'
cp /var/www/crypto-workflow/backend/.env /tmp/tinpass-migrate/backend.env
cp /var/www/crypto-workflow/frontend/.env.local /tmp/tinpass-migrate/frontend.env.local
ls -lh /tmp/tinpass-migrate/
""",
    )
    for name in (
        "crypto_workflow.dump",
        "uploads.tar.gz",
        "backend.env",
        "frontend.env.local",
    ):
        sftp_get(c, f"/tmp/tinpass-migrate/{name}", staging / name)
    run(c, "rm -rf /tmp/tinpass-migrate")
    c.close()
    print(f"BACKUP_OLD_DONE -> {staging}")


def _db_password_from_env(env_text: str) -> str | None:
    for line in env_text.splitlines():
        if line.startswith("DATABASE_URL="):
            # postgresql://user:pass@host:5432/db
            raw = line.split("=", 1)[1].strip().strip('"').strip("'")
            try:
                # user:pass@
                after = raw.split("://", 1)[1]
                creds = after.split("@", 1)[0]
                return creds.split(":", 1)[1]
            except Exception:
                return None
    return None


def cmd_restore_new(args: argparse.Namespace) -> None:
    staging = Path(args.staging)
    for name in (
        "crypto_workflow.dump",
        "uploads.tar.gz",
        "backend.env",
        "frontend.env.local",
    ):
        if not (staging / name).exists():
            raise SystemExit(f"missing {staging / name}")

    env_text = (staging / "backend.env").read_text(encoding="utf-8", errors="replace")
    db_pass = _db_password_from_env(env_text)
    if not db_pass:
        raise SystemExit("Could not parse DATABASE_URL password from backend.env")

    c = connect(NEW_HOST)
    run(
        c,
        """
set -euo pipefail
mkdir -p /var/www/crypto-workflow/backend /var/www/crypto-workflow/frontend /var/www/crypto-workflow/uploads /var/www/crypto-workflow/incoming /tmp/tinpass-migrate
""",
    )
    for name in (
        "crypto_workflow.dump",
        "uploads.tar.gz",
        "backend.env",
        "frontend.env.local",
    ):
        sftp_put(c, staging / name, f"/tmp/tinpass-migrate/{name}")

    # Escape single quotes in password for SQL
    sql_pass = db_pass.replace("'", "''")
    run(
        c,
        f"""
set -euo pipefail
echo '==> recreate DB and restore'
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'crypto_workflow' AND pid <> pg_backend_pid();" || true
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS crypto_workflow;"
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "DROP ROLE IF EXISTS crypto;"
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE ROLE crypto LOGIN PASSWORD '{sql_pass}';"
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE crypto_workflow OWNER crypto;"
sudo -u postgres pg_restore -d crypto_workflow --no-owner --role=crypto /tmp/tinpass-migrate/crypto_workflow.dump
sudo -u postgres psql -d crypto_workflow -c "ALTER SCHEMA public OWNER TO crypto;"
sudo -u postgres psql -d crypto_workflow -c "GRANT ALL ON SCHEMA public TO crypto;"
sudo -u postgres psql -d crypto_workflow -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO crypto;"
sudo -u postgres psql -d crypto_workflow -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO crypto;"

echo '==> env files'
cp /tmp/tinpass-migrate/backend.env /var/www/crypto-workflow/backend/.env
cp /tmp/tinpass-migrate/frontend.env.local /var/www/crypto-workflow/frontend/.env.local
# force localhost DB host
python3 - <<'PY'
from pathlib import Path
import re
p = Path('/var/www/crypto-workflow/backend/.env')
t = p.read_text()
t2 = re.sub(r'(DATABASE_URL=.*@)[^:/]+', r'\\1localhost', t)
p.write_text(t2)
PY
chmod 600 /var/www/crypto-workflow/backend/.env /var/www/crypto-workflow/frontend/.env.local

echo '==> uploads'
tar -C /var/www/crypto-workflow -xzf /tmp/tinpass-migrate/uploads.tar.gz || true
mkdir -p /var/www/crypto-workflow/uploads
chown -R root:root /var/www/crypto-workflow/uploads
ls -la /var/www/crypto-workflow/backend/.env /var/www/crypto-workflow/frontend/.env.local
du -sh /var/www/crypto-workflow/uploads
sudo -u postgres psql -tAc "SELECT pg_size_pretty(pg_database_size('crypto_workflow'));"
rm -rf /tmp/tinpass-migrate
""",
    )
    c.close()
    print("RESTORE_NEW_DONE")


def cmd_upload_release(args: argparse.Namespace) -> None:
    zip_path = Path(args.zip)
    if not zip_path.exists():
        raise SystemExit(f"missing zip: {zip_path}")
    c = connect(NEW_HOST)
    run(c, "mkdir -p /var/www/crypto-workflow/incoming")
    sftp_put(c, zip_path, "/var/www/crypto-workflow/incoming/crypto-release.zip")
    # also need deploy scripts present before apply-release — extract deploy/ from zip first if missing
    run(
        c,
        """
set -euo pipefail
cd /var/www/crypto-workflow
if [ ! -f deploy/cafe24-business/apply-release.sh ]; then
  echo '==> bootstrap unpack deploy scripts from zip'
  mkdir -p /tmp/tinpass-zip
  unzip -qo incoming/crypto-release.zip -d /tmp/tinpass-zip
  mkdir -p deploy
  cp -a /tmp/tinpass-zip/deploy/. deploy/ || true
  rm -rf /tmp/tinpass-zip
fi
sed -i 's/\\r$//' deploy/cafe24-business/*.sh || true
chmod +x deploy/cafe24-business/*.sh || true
ls -lh incoming/crypto-release.zip
test -f backend/.env
bash deploy/cafe24-business/apply-release.sh
""",
        check=True,
    )
    c.close()
    print("UPLOAD_RELEASE_DONE")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--repo", default=str(Path(__file__).resolve().parents[2]))
    p.add_argument("--password", default=None)
    p.add_argument(
        "--staging",
        default=str(Path(__file__).resolve().parents[2] / "deploy/release/migrate-staging"),
    )
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("inspect-old")
    sub.add_parser("setup-new")
    sub.add_parser("backup-old")
    sub.add_parser("restore-new")
    up = sub.add_parser("upload-release")
    up.add_argument(
        "--zip",
        default=str(Path(__file__).resolve().parents[2] / "deploy/release/crypto-release.zip"),
    )
    args = p.parse_args()
    if args.cmd == "inspect-old":
        cmd_inspect_old(args)
    elif args.cmd == "setup-new":
        cmd_setup_new(args)
    elif args.cmd == "backup-old":
        cmd_backup_old(args)
    elif args.cmd == "restore-new":
        cmd_restore_new(args)
    elif args.cmd == "upload-release":
        cmd_upload_release(args)



if __name__ == "__main__":
    main()

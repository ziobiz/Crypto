#!/usr/bin/env python3
import paramiko

SQL = r"""
set +e
echo HOST=$(hostname)
cd /tmp
sudo -u postgres psql -d crypto_workflow -Atc "SELECT 'db_size=' || pg_size_pretty(pg_database_size('crypto_workflow'));"
sudo -u postgres psql -d crypto_workflow -Atc "SELECT 'users=' || count(*) FROM users;"
sudo -u postgres psql -d crypto_workflow -Atc "SELECT 'tickets=' || count(*) FROM transaction_tickets;"
sudo -u postgres psql -d crypto_workflow -Atc "SELECT 'customers=' || count(*) FROM customer_profiles;"
sudo -u postgres psql -d crypto_workflow -Atc "SELECT 'attachments=' || count(*) FROM attachments;"
sudo -u postgres psql -d crypto_workflow -Atc "SELECT 'orgs=' || count(*) FROM organizations;"
sudo -u postgres psql -d crypto_workflow -Atc "SELECT 'wallets=' || count(*) FROM wallets;"
du -sh /var/www/crypto-workflow/uploads 2>/dev/null
test -f /var/www/crypto-workflow/backend/.env && echo env=yes || echo env=no
find /var/www/crypto-workflow/uploads -type f 2>/dev/null | wc -l | awk '{print "upload_files="$1}'
"""


def check(host: str) -> None:
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username="root", timeout=20)
    _, stdout, stderr = c.exec_command(SQL)
    print("====", host, "====")
    print(stdout.read().decode("utf-8", "replace"))
    err = stderr.read().decode("utf-8", "replace")
    if err.strip():
        print("STDERR:", err[:800])
    c.close()


if __name__ == "__main__":
    check("114.207.245.160")
    check("162.35.16.100")

#!/bin/bash
set -euo pipefail
cd /var/www/crypto-workflow/backend
node scripts/fix-wallet-unique-now.js
node scripts/probe-usdc-settlement.js > /tmp/usdc-probe.json 2>/dev/null || true
# strip prisma query noise if any leaked — probe writes JSON only to stdout when quiet
# Re-run redirecting prisma logs
export PRISMA_DISABLE_WARNINGS=1
node scripts/probe-usdc-settlement.js > /tmp/usdc-probe.json 2>/tmp/usdc-probe.err
echo "PROBE_EXIT:$?"
python3 - <<'PY'
import json
d=json.load(open('/tmp/usdc-probe.json'))
print(json.dumps({
  'ok': d.get('ok'),
  'twinSync': d.get('twinSync'),
  'tradeSample': {
    'walletId': (d.get('tradeSample') or {}).get('walletId'),
    'network': (d.get('tradeSample') or {}).get('network'),
    'assetType': (d.get('tradeSample') or {}).get('assetType'),
    'rate': (d.get('tradeSample') or {}).get('rate'),
    'fromFiat': (d.get('tradeSample') or {}).get('fromFiat'),
    'fromTarget': (d.get('tradeSample') or {}).get('fromTarget'),
  } if d.get('tradeSample') else None,
  'fails': [c for c in d.get('checks',[]) if not c.get('pass')],
  'passCount': sum(1 for c in d.get('checks',[]) if c.get('pass')),
  'checkCount': len(d.get('checks',[])),
}, indent=2, ensure_ascii=False))
PY

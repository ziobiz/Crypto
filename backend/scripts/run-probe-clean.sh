#!/bin/bash
set -euo pipefail
cd /var/www/crypto-workflow/backend
export DEBUG=
# Prisma query logs pollute stdout when log levels include query
node scripts/probe-usdc-settlement.js > /tmp/usdc-probe.raw 2>/tmp/usdc-probe.err || true
python3 <<'PY'
import json
s = open('/tmp/usdc-probe.raw', encoding='utf-8', errors='ignore').read()
lines = [ln for ln in s.splitlines() if not ln.startswith('prisma:')]
text = '\n'.join(lines)
start = text.find('{')
if start < 0:
    print(json.dumps({'ok': False, 'error': 'no json', 'rawHead': s[:200]}))
    raise SystemExit(1)
text = text[start:]
depth = 0
end = None
for i, ch in enumerate(text):
    if ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0:
            end = i + 1
            break
obj = json.loads(text[:end])
open('/tmp/usdc-probe.json', 'w', encoding='utf-8').write(json.dumps(obj, ensure_ascii=False, indent=2))
fails = [c for c in obj.get('checks', []) if not c.get('pass')]
summary = {
    'ok': obj.get('ok'),
    'twinSync': obj.get('twinSync'),
    'tradeSample': obj.get('tradeSample'),
    'fails': fails,
    'passCount': sum(1 for c in obj.get('checks', []) if c.get('pass')),
    'checkCount': len(obj.get('checks', [])),
}
print(json.dumps(summary, indent=2, ensure_ascii=False, default=str))
raise SystemExit(0 if obj.get('ok') and not fails else 2)
PY

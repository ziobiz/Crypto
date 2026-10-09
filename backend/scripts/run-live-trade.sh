#!/bin/bash
set -euo pipefail
cd /var/www/crypto-workflow/backend
ASSET="${1:-USDC}"
export DEBUG=
# Silence prisma query logs if enabled via env
unset DEBUG
node "scripts/live-trade-probe.js" "$ASSET" > "/tmp/live-${ASSET}.raw" 2>/tmp/live-${ASSET}.err || true
python3 <<PY
import json, re
asset = "${ASSET}"
s = open(f"/tmp/live-{asset}.raw", encoding="utf-8", errors="ignore").read()
err = open(f"/tmp/live-{asset}.err", encoding="utf-8", errors="ignore").read()
# Prefer last top-level JSON object that contains "target"
candidates = []
for m in re.finditer(r"\{", s):
    i = m.start()
    depth = 0
    end = None
    for n in range(i, len(s)):
        ch = s[n]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = n + 1
                break
    if end is None:
        continue
    chunk = s[i:end]
    if '"target"' in chunk and '"steps"' in chunk:
        try:
            candidates.append(json.loads(chunk))
        except Exception:
            pass
if not candidates:
    print(json.dumps({"ok": False, "error": "no json", "rawTail": s[-800:], "err": err[:800]}, ensure_ascii=False, indent=2))
    raise SystemExit(2)
obj = candidates[-1]
open(f"/tmp/live-{asset}.json", "w", encoding="utf-8").write(json.dumps(obj, ensure_ascii=False, indent=2))
print(json.dumps(obj, ensure_ascii=False, indent=2))
raise SystemExit(0 if obj.get("ok") else 2)
PY

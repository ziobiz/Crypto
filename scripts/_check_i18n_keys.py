from pathlib import Path
import re

kr = Path('frontend/src/i18n/kr.ts').read_text(encoding='utf-8')
keys = []
seen = set()
for k in re.findall(r"^  '([^']+)':", kr, re.M):
    if k not in seen:
        seen.add(k)
        keys.append(k)
for loc in ['us', 'jp', 'ch', 'th']:
    text = Path(f'frontend/src/i18n/locale/{loc}.ts').read_text(encoding='utf-8')
    missing = [k for k in keys if f"'{k}':" not in text]
    print(loc, 'missing', len(missing))
    for k in missing:
        print(' ', k)

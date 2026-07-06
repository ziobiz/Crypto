#!/bin/bash
# zip 압축 해제 (unzip 없는 최소 서버 대응)
# 사용: unpack-zip.sh <zip파일> <대상디렉터리>
set -euo pipefail

ZIP="${1:?zip path required}"
DEST="${2:?dest dir required}"

if [ ! -f "$ZIP" ]; then
  echo "ERROR: zip 없음: $ZIP"
  exit 1
fi

mkdir -p "$DEST"

if command -v unzip >/dev/null 2>&1; then
  unzip -o "$ZIP" -d "$DEST"
  exit 0
fi

if command -v python3 >/dev/null 2>&1; then
  python3 - "$ZIP" "$DEST" <<'PY'
import sys, zipfile, os
zip_path, dest = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(zip_path) as zf:
    for info in zf.infolist():
        name = info.filename.replace("\\", "/")
        if not name or name.endswith("/"):
            continue
        target = os.path.join(dest, name)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with zf.open(info) as src, open(target, "wb") as out:
            out.write(src.read())
print(f"extracted via python3 -> {dest}")
PY
  exit 0
fi

if command -v python >/dev/null 2>&1; then
  python - "$ZIP" "$DEST" <<'PY'
import sys, zipfile, os
zip_path, dest = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(zip_path) as zf:
    for info in zf.infolist():
        name = info.filename.replace("\\", "/")
        if not name or name.endswith("/"):
            continue
        target = os.path.join(dest, name)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with zf.open(info) as src, open(target, "wb") as out:
            out.write(src.read())
print(f"extracted via python -> {dest}")
PY
  exit 0
fi

if command -v 7z >/dev/null 2>&1; then
  7z x -y "-o$DEST" "$ZIP"
  exit 0
fi

if command -v 7za >/dev/null 2>&1; then
  7za x -y "-o$DEST" "$ZIP"
  exit 0
fi

echo "ERROR: 압축 해제 도구 없음 (unzip / python3 / 7z)"
echo "설치: apt-get update && apt-get install -y unzip"
exit 1

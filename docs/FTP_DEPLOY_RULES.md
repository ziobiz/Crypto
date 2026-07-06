# Crypto Workflow — FTP 재배포 규칙 (운영 표준)

> **서버 경로:** `/var/www/crypto-workflow`  
> **메인 URL:** `https://api.tinpass.com`  
> **로컬 개발 → FTP 업로드 → SSH 적용** 이 표준 운영 흐름입니다.

---

## 1. 운영 흐름 (매번 동일)

```
[로컬 PC] 코드 수정 · 테스트
    ↓
[FTP] 지정 폴더/파일만 서버에 업로드
    ↓
[SSH] bash deploy/cafe24-business/ftp-apply.sh
    ↓
[브라우저] https://api.tinpass.com 확인
```

---

## 2. FTP 업로드 — 올릴 것 (모드 A: 소스 배포 · 권장)

서버 루트 `/var/www/crypto-workflow/` 기준으로 **아래만** 업로드합니다.

| 경로 | 설명 |
|------|------|
| `backend/src/` | API 소스 전체 |
| `backend/prisma/` | 스키마·시드 |
| `backend/package.json` | |
| `backend/package-lock.json` | |
| `backend/tsconfig.json` | |
| `frontend/src/` | 화면 소스 전체 |
| `frontend/public/` | 정적 파일 (있을 때) |
| `frontend/package.json` | |
| `frontend/package-lock.json` | |
| `frontend/tsconfig.json` | |
| `frontend/next.config.js` | |
| `frontend/postcss.config.js` | |
| `frontend/tailwind.config.js` | |
| `deploy/` | 배포 스크립트·PM2·nginx 템플릿 |

**변경된 파일만** 올려도 됩니다. `package.json` / `schema.prisma`가 바뀌면 반드시 해당 파일 포함.

---

## 3. FTP — 절대 올리지 말 것

| 경로 | 이유 |
|------|------|
| `node_modules/` | 서버에서 `npm ci`로 설치 |
| `backend/dist/` | 서버(또는 로컬)에서 빌드 |
| `frontend/.next/` | 모드 A에서는 서버에서 빌드 |
| `.git/` | 불필요 |
| `uploads/` | 운영 증빙 파일 — 서버 데이터 |
| `*.log` | |

---

## 4. FTP — 절대 덮어쓰지 말 것 (서버 전용)

| 경로 | 내용 |
|------|------|
| `backend/.env` | DB 비밀번호, JWT_SECRET, CORS |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` |
| `/etc/nginx/conf.d/crypto-workflow-tinpass.conf` | **certbot SSL 적용본** — Git 템플릿으로 덮어쓰기 금지 |

---

## 5. SSH — 재배포 실행 (모드 A)

FTP 업로드가 끝나면 **항상** SSH에서:

```bash
cd /var/www/crypto-workflow
bash deploy/cafe24-business/ftp-apply.sh
```

이 스크립트가 자동으로 수행:

1. `backend` — `npm ci` → `prisma generate` → `tsc` → `db push`
2. `frontend` — `npm ci` → `next build`
3. `pm2` — `crypto-api`, `crypto-web` 재시작

**예상 시간:** 3~8분 (2GB RAM 서버)

---

## 6. 모드 B — 로컬 빌드 후 산출물만 FTP (OOM 시)

로컬 PC에서:

```powershell
cd d:\Delopment\Crypto\backend
npm run build

cd ..\frontend
npm run build
```

FTP로 추가 업로드:

| 경로 |
|------|
| `backend/dist/` |
| `frontend/.next/` |
| `package.json` / `package-lock.json` (양쪽) |
| `backend/prisma/` (스키마 변경 시) |

SSH:

```bash
cd /var/www/crypto-workflow
bash deploy/cafe24-business/ftp-apply-built.sh
```

---

## 7. 서버 일상 관리 명령

```bash
# 상태
pm2 status

# 로그 (오류 확인)
pm2 logs crypto-api --lines 50
pm2 logs crypto-web --lines 50

# 재시작만 (코드 변경 없을 때)
pm2 restart crypto-api crypto-web

# Nginx (설정 변경 시만 — SSL 파일 덮어쓰지 말 것)
nginx -t && systemctl reload nginx

# API 헬스
curl -s https://api.tinpass.com/health
```

---

## 8. 최초 1회 서버 구성 (이미 완료 시 생략)

1. Ubuntu + Node 20 + PM2 + PostgreSQL + Nginx
2. `backend/.env`, `frontend/.env.local` 작성
3. `certbot --nginx -d api.tinpass.com ...`
4. `pm2 startup` + `pm2 save`

자세한 내용: `docs/DEPLOY_CAFE24_BUSINESS.md`

---

## 9. 재배포 체크리스트

- [ ] 로컬에서 빌드/테스트 완료
- [ ] FTP — `backend/.env`, `frontend/.env.local` **미포함**
- [ ] FTP — `node_modules`, `.next`, `dist` **미포함** (모드 A)
- [ ] SSH — `bash deploy/cafe24-business/ftp-apply.sh`
- [ ] `pm2 status` → `online`, 재시작 횟수(↺) 0
- [ ] 브라우저 로그인 테스트

---

## 10. 자주 나는 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| Failed to fetch (로그인) | 프론트 미재빌드 | `ftp-apply.sh` 재실행 |
| Cannot find module express | `node_modules` 없음 | `ftp-apply.sh` (내부 `npm ci`) |
| HTTPS 깨짐 | nginx 템플릿으로 SSL 덮어씀 | certbot 재실행, 템플릿 cp 금지 |
| P3005 migrate | migrations 없음 | 정상 — `db push` 사용 |

---

## 11. 환경 변수 참고 (서버에만 보관)

`backend/.env` 예시:

```env
DATABASE_URL="postgresql://crypto:비밀번호@localhost:5432/crypto_workflow?schema=public"
CORS_ORIGIN=https://api.tinpass.com,https://tinpass.com,https://www.tinpass.com
JWT_SECRET=...
UPLOAD_DIR=/var/www/crypto-workflow/uploads
```

`frontend/.env.local` 예시:

```env
NEXT_PUBLIC_API_URL=https://api.tinpass.com
```

또는 비워 두면 same-origin(`/api`) 사용 (코드 기본 동작).

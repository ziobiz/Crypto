# 카페24 가상서버 비즈니스(2GB) 배포 가이드

대상: [카페24 가상서버호스팅 — 비즈니스](https://hosting.cafe24.com/?controller=new_product_page&page=virtual)

| 항목 | 스펙 |
|------|------|
| RAM | 2GB |
| SSD | 40GB |
| 트래픽 | 500GB/월 |
| 월 요금 | 14,000원 (VAT 포함) |
| OS | **Ubuntu 22.04** 선택 (Rocky도 가능하나 본 가이드는 Ubuntu 기준) |

---

## 아키텍처 (한 서버)

```
[HTTPS] Nginx (80/443)
    ├── /          → Next.js  :3000  (PM2, max 450MB)
    └── /api/*     → Express  :4000  (PM2, max 350MB)
              ↓
         PostgreSQL (로컬, ~128MB shared_buffers)
         /var/www/crypto-workflow/uploads
```

2GB RAM에서 동작하도록 **Swap 2GB + PM2 메모리 제한 + PG 튜닝**을 적용합니다.

---

## 1. 카페24 신청 시 선택

1. **리눅스** 탭 → **비즈니스** (14,000원/월)
2. OS: **Ubuntu 22.04**
3. **APM(PHP+MySQL) 옵션: 선택하지 않음** — Node.js + PostgreSQL 직접 설치
4. 보안 설정: Node 빌드에 `curl`/`gcc` 필요 시 **미사용** 또는 설치 후 root로 사용

---

## 2. 로컬 개발 (기존과 동일)

```powershell
# 로컬 PC에서 개발
cd backend && npm run dev
cd frontend && npm run dev
```

운영 서버는 **배포 전용**으로 두고, 코드는 Git으로 push → 서버에서 pull 후 `deploy.sh` 실행.

---

## 3. 서버 최초 설정 (1회)

SSH 접속 후:

```bash
# 코드 업로드 (GitHub 예시)
cd /var/www
git clone https://github.com/YOUR_USER/crypto-workflow.git crypto-workflow
cd crypto-workflow

# 서버 환경 구성
sudo bash deploy/cafe24-business/setup-server.sh

# 환경변수
cp deploy/cafe24-business/env.backend.production.example backend/.env
cp deploy/cafe24-business/env.frontend.production.example frontend/.env.local
nano backend/.env          # DATABASE_URL, JWT_SECRET, CORS_ORIGIN 수정
nano frontend/.env.local   # NEXT_PUBLIC_API_URL 수정

# PostgreSQL 비밀번호를 backend/.env DATABASE_URL과 일치시키기
sudo -u postgres psql -c "ALTER USER crypto WITH PASSWORD 'YOUR_PASSWORD';"
```

---

## 4. Nginx 설정

```bash
sudo cp deploy/cafe24-business/nginx/crypto-workflow.conf /etc/nginx/conf.d/
sudo nano /etc/nginx/conf.d/crypto-workflow.conf   # server_name 수정
sudo nginx -t && sudo systemctl reload nginx
```

카페24에서 SSL(무료 인증서) 적용 후 `https://your-id.cafe24.com` 사용.

`backend/.env`:
```
CORS_ORIGIN=https://your-id.cafe24.com
```

`frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=https://your-id.cafe24.com
```

---

## 5. 배포 / 업데이트

```bash
cd /var/www/crypto-workflow
git pull
bash deploy/cafe24-business/deploy.sh
```

`deploy.sh`는 **Backend → Frontend 순차 빌드**로 2GB RAM OOM을 방지합니다.

---

## 6. 시드 데이터 (최초 1회만)

```bash
cd /var/www/crypto-workflow/backend
npx tsx prisma/seed.ts
```

운영 전 **테스트 계정 비밀번호 변경** 또는 seed 제거 필수.

---

## 7. 2GB RAM 운영 팁

| 항목 | 권장 |
|------|------|
| Swap | setup-server.sh가 2GB 추가 |
| PM2 | `max_memory_restart` 350M / 450M |
| Next.js 빌드 | 서버에서 OOM 나면 **로컬에서 build 후 `.next`만 rsync** |
| Prisma Studio | 운영 서버에서 실행하지 않음 |
| 동시 빌드 | Backend/Frontend **동시에 build 금지** |

### 로컬 빌드 후 업로드 (OOM 시)

```powershell
# 로컬 PC
cd backend && npm run build
cd ../frontend && npm run build

# 서버에 dist, .next만 전송 (scp/rsync)
```

서버에서는 `npm ci --omit=dev` + `prisma migrate deploy` + `pm2 reload`만 실행.

---

## 8. 백업 (필수)

카페24 가상서버는 **자동 백업 없음**.

```bash
# DB 백업 (cron 등록 권장)
pg_dump -U crypto crypto_workflow > /backup/db_$(date +%Y%m%d).sql

# 증빙 파일
tar czf /backup/uploads_$(date +%Y%m%d).tar.gz /var/www/crypto-workflow/uploads
```

---

## 9. 비용 요약

| 항목 | 금액 |
|------|------|
| 비즈니스 월료 | 14,000원 |
| 설치비 (1회) | 22,000원 |
| 트래픽 초과 | 165원/GB |

초기 소규모 내부·데모 운영에 적합. 동시 사용자·거래가 늘면 **자이언트(4GB, 33,000원)** 업그레이드 권장 (카페24는 상위 플랜만 변경 가능).

---

## 10. 체크리스트

- [ ] Ubuntu 22.04, APM 미선택
- [ ] setup-server.sh 실행 (Swap + PostgreSQL + Node)
- [ ] `.env` / `.env.local` 운영값 설정
- [ ] JWT_SECRET 변경
- [ ] seed 계정 비밀번호 변경
- [ ] Nginx + SSL
- [ ] `deploy.sh` 성공 + `/health` 확인
- [ ] DB·uploads 백업 cron 등록

# Crypto Workflow System

금융 API 연동 없이 송금 증빙 업로드 + 관리자 수동 확인을 통해 거래 상태를 추적하고, 영업 조직별 수수료를 정산하는 워크플로우·장부 시스템.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Node.js, Express, Prisma, TypeScript |
| Frontend | Next.js 15, React 19, TailwindCSS |
| Database | PostgreSQL 16 |
| Storage | 로컬 파일 (`uploads/`) / MinIO (docker-compose) |

## 기능 목록

### 사용자·조직
- 5단계 영업 조직 (본사 → 총판 → 지사 → 대리점 → 영업점)
- 고객 회원가입 (개인/기업, 영업점 유치)
- JWT 인증 + RBAC (SUPER_ADMIN / ORG_STAFF / CUSTOMER)

### 워크플로우 1: USDT 매입
- 환율 API 참고 시세 노출 + 스냅샷
- 5단계 상태: 신청 → 입금증빙 → 관리자확인 → 송금중 → 완료(TXID)
- 고객: 지갑 등록 (가스비/플랫폼 수수료), 영수증 업로드
- 관리자: 상태 변경, TXID 등록, 완료 시 수수료 정산

### 워크플로우 2: 무역 에스크로
- 6단계 상태: 생성 → A입금 → 관리자확인 → B이행 → A승인 → 완료
- 구매자/판매자 3자 구조, 증빙 업로드, 관리자 수동 송금

### 수수료 장부
- 거래 완료 시 영업점→본사 체인 수수료 자동 정산
- ORG_STAFF / ADMIN 장부 조회

## Directory Structure

```
Crypto/
├── backend/
│   ├── prisma/schema.prisma
│   ├── prisma/seed.ts
│   └── src/
│       ├── routes/          # auth, wallet, usdt, escrow, ledger, org, attachment
│       ├── services/        # business logic
│       └── middleware/      # auth, rbac, errors
├── frontend/
│   └── src/
│       ├── app/             # login, register, dashboard/*
│       ├── components/
│       ├── context/         # AuthProvider
│       └── lib/             # api client, format
├── docs/DATABASE_DESIGN.md
└── docker-compose.yml
```

## Deployment (카페24 비즈니스 2GB)

운영 배포 가이드: **[docs/DEPLOY_CAFE24_BUSINESS.md](docs/DEPLOY_CAFE24_BUSINESS.md)**

```bash
# 서버 최초 1회
sudo bash deploy/cafe24-business/setup-server.sh

# 코드 업데이트 시
bash deploy/cafe24-business/deploy.sh
```

## Local Development

### 1. PostgreSQL (Docker)

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:generate
npm run db:push      # 또는 npm run db:migrate
npm run db:seed
npm run dev          # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| 총본사 관리자 | admin@ziobiz.com | password123 |
| 영업점 직원 | staff@so-001.com | password123 |
| 고객 (구매자) | customer@example.com | password123 |
| 고객 (판매자) | seller@example.com | password123 |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/register` | 고객 회원가입 |
| GET | `/api/auth/me` | 내 정보 |
| GET | `/api/auth/dashboard` | 역할별 대시보드 통계 |
| GET | `/api/organizations/sales-offices` | 영업점 목록 |
| GET/POST | `/api/wallets` | 지갑 CRUD |
| GET/POST | `/api/tickets/usdt-purchase` | USDT 매입 |
| PATCH | `/api/tickets/usdt-purchase/:id/status` | 상태 변경 |
| POST | `/api/tickets/usdt-purchase/:id/deposit-proof` | 입금 증빙 |
| GET/POST | `/api/tickets/trade-escrow` | 무역 에스크로 |
| GET | `/api/ledger` | 수수료 장부 |
| GET | `/api/attachments/:id/file` | 증빙 파일 다운로드 |

상세 DB 설계: [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md)

## Deployment Notes

- `JWT_SECRET`, `DATABASE_URL` 환경변수 설정
- `uploads/` → S3/MinIO 마이그레이션 가능 (`attachment.service.ts`)
- Frontend `NEXT_PUBLIC_API_URL` → API 서버 URL

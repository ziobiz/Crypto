# Database Schema Design

## ERD 개요

```
Organization (5단계 트리)
    │
    ├── User (SUPER_ADMIN | ORG_STAFF | CUSTOMER)
    │       ├── CustomerProfile (개인/기업, recruitingOrg 연결)
    │       └── Wallet (USDT 주소 + gas/platform fee)
    │
    └── CommissionRate (조직별·티켓유형별 요율 %)

CustomerProfile
    └── TransactionTicket (USDT_PURCHASE | TRADE_ESCROW)
            ├── UsdtPurchaseDetail (5단계 상태)
            ├── TradeEscrowDetail (6단계 상태, buyer/seller)
            ├── Attachment (증빙 파일)
            ├── TicketStatusHistory (감사 로그)
            └── LedgerEntry (수수료 정산 장부)
```

---

## 1. Organization — 5단계 영업 조직 트리

| 필드 | 설계 이유 |
|------|-----------|
| `parentId` (Adjacency List) | Prisma/PostgreSQL과 호환성이 좋고, 7단계 이하 계층에서 상위 체인 순회(수수료 정산)에 충분 |
| `path` (Materialized Path) | "하위 조직 전체 조회" (`path LIKE '/HQ%/'`) 와 권한 범위 필터링을 O(1) 인덱스로 처리 |
| `type` (OrgType enum) | 본사~영업점 5단계를 명시적으로 구분 — 요율 기본값·UI 라벨·권한 정책에 활용 |
| `code` (unique) | ziobiz/PG 체계와 동일하게 조직 코드로 식별 |

**고객은 Organization이 아닌 `CustomerProfile`로 분리**  
→ 영업 조직(5단계)과 고객(개인/기업)의 역할이 다르므로, 고객은 User + CustomerProfile로 모델링하고 `recruitingOrgId`로 유치 영업점을 연결합니다. 수수료 정산 체인은 이 지점에서 시작해 상위으로 올라갑니다.

---

## 2. User & CustomerProfile — 권한 3분할

| Role | 권한 |
|------|------|
| `SUPER_ADMIN` | 모든 티켓 상태 변경, 최종 승인/완료, TXID 등록 |
| `ORG_STAFF` | 하위 조직 고객의 티켓 **조회만**, 본인 조직 Ledger **조회만** |
| `CUSTOMER` | 본인 티켓 CRUD(신청·증빙), 지갑 등록, 상태 조회 |

**CustomerProfile**은 가맹점 등록과 동일한 형태:
- `INDIVIDUAL`: 개인 정보
- `CORPORATE`: `businessName`, `businessNumber`, `representative` 등 기업 필드

---

## 3. Wallet — 지갑 + 수수료

고객은 USDT 수령 지갑을 등록해야 하며, 지갑마다:
- `gasFeeAmount` — 블록체인 가스비
- `platformFeeAmount` — 시스템 부가 수수료

티켓 생성 시 이 값을 **스냅샷**(`gasFeeSnapshot`, `platformFeeSnapshot`)으로 복사해, 이후 요율 변경이 과거 거래에 영향을 주지 않도록 합니다.

---

## 4. TransactionTicket — 공통 진입점 + 워크플로우 분리

**왜 단일 테이블이 아닌 1:1 확장 테이블인가?**

| 테이블 | 역할 |
|--------|------|
| `TransactionTicket` | 티켓 번호, 고객, 유형, 수수료 정산 플래그 |
| `UsdtPurchaseDetail` | USDT 매입 전용 필드 (환율, fiat 금액, TXID) |
| `TradeEscrowDetail` | 에스크로 전용 필드 (buyer, seller, 이행 정보) |

두 워크플로우의 필드가 크게 다르므로 **Class Table Inheritance** 패턴을 사용했습니다. Attachment, StatusHistory, LedgerEntry는 공통 `ticketId`로 연결됩니다.

### USDT 매입 상태 (UsdtPurchaseStatus)

```
APPLICATION_COMPLETED → DEPOSIT_PROOF_PENDING → ADMIN_REVIEWING
  → TRANSFER_IN_PROGRESS → COMPLETED
```

### 무역 에스크로 상태 (TradeEscrowStatus)

```
ESCROW_CREATED → BUYER_DEPOSIT_PROOF → ADMIN_DEPOSIT_CONFIRMED
  → SELLER_FULFILLMENT_PROOF → BUYER_FINAL_APPROVAL → ESCROW_COMPLETED
```

각 상태 전환은 `TicketStatusHistory`에 `fromStatus → toStatus`, `changedById`로 기록됩니다.

---

## 5. Attachment — 증빙 파일

| purpose | 사용 시점 |
|---------|-----------|
| `FIAT_DEPOSIT_RECEIPT` | USDT 매입·에스크로 입금 증빙 |
| `USDT_TRANSFER_PROOF` | USDT 송금 TXID 스크린샷 |
| `SHIPPING_PROOF` | 에스크로 판매자 발송 증빙 |
| `CONTRACT_DOCUMENT` | 거래 계약서 |

`storageKey` + MinIO/S3로 파일 저장, DB에는 메타데이터만 보관합니다.

---

## 6. CommissionRate & LedgerEntry — 수수료 정산

### 정산 트리거 조건
- `UsdtPurchaseStatus = COMPLETED` 또는 `TradeEscrowStatus = ESCROW_COMPLETED`
- `TransactionTicket.commissionSettled = false` → 정산 후 `true` (멱등성)

### 정산 알고리즘 (의사코드)

```
1. customer.recruitingOrg (영업점)부터 parent 체인을 본사까지 순회
2. 각 org의 CommissionRate[ticketType] 조회 (effectiveFrom/To 적용)
3. amount = commissionPool × ratePercent / 100
4. LedgerEntry 생성 (ratePercent, baseAmount 스냅샷 포함)
5. ticket.commissionSettled = true
```

### LedgerEntry 설계 포인트

| 필드 | 이유 |
|------|------|
| `ratePercent`, `baseAmount` 스냅샷 | 정산 시점 요율·기준금액을 불변 기록 |
| `reversalOfId` | 취소/환불 시 역분개로 잔액 정합성 유지 |
| `entryType` | COMMISSION_EARNED / REVERSED / ADJUSTMENT 구분 |

---

## 7. 인덱스 전략

- `Organization.path`, `parentId` — 하위 조직·상위 체인 조회
- `TransactionTicket.customerId`, `type`, `commissionSettled` — 목록·정산 배치
- `LedgerEntry(organizationId, settledAt)` — 조직별 수수료 누적 조회
- `UsdtPurchaseDetail.status`, `TradeEscrowDetail.status` — 워크플로우 대시보드

---

## 8. 보안·운영 고려사항 (Phase 2)

- `residentId`, `businessNumber` — 암호화(at-rest) 저장 권장
- 파일 업로드 — MIME 검증, 크기 제한, 바이러스 스캔
- `SUPER_ADMIN` 상태 변경 — TicketStatusHistory 필수 기록
- 환율 API — `exchangeRateAt` 스냅샷으로 분쟁 시 기준 확보

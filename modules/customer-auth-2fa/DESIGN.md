# Customer Auth 2FA — 설계값 (DESIGN)

버전: **1.2.0**  
적용 제품: TINPASS / 동일 패턴의 고객 로그인

## 1. 제품 정책 (고정)

| 대상 | 2차 인증 | 비고 |
|------|----------|------|
| 개인 고객 (INDIVIDUAL) | OTP **필수** + 바이오(WebAuthn) **선택** | 바이오 ON이면 로그인 시 **바이오 우선** → 실패/취소 시 OTP |
| 법인 고객 (CORPORATE) | OTP만 | 바이오·QR 미제공 |
| 본사/관리자 | OTP만 | 본 모듈 범위 밖 |

### 가입·등록

1. 가입/최초 활성화: **Google OTP(TOTP) 필수** — 바이오만으로 가입 불가  
2. OTP 완료 후(계정 설정): 본인이 바이오 등록 여부 선택  
3. 기기 변경 시 바이오 재등록 필요 → OTP는 항상 백업

### 바이오 계정당 1개 (v1.2) — 권장·고정

- **계정당 WebAuthn credential 최대 1개** (서버 `WEBAUTHN_LIMIT`)  
- 2개 이상은 권장하지 않음: 분실·공유·감사 추적 모호. 폰 교체는 OTP 삭제 후 재등록으로 충분  
- 삭제: **Google OTP 6자리 필수** (`POST …/credentials/:id/delete`)  
- UI: 1개 있으면 「등록 완료」만 표시, 추가 등록 불가

### 미사용 시 1회 안내 (v1.1)

- 대상: 개인 + 바이오 credential 0개  
- UX: 대시보드 **얇은 배너** (모달 금지)  
- 동작: 「설정하기」→ 계정 생체 등록 / 「나중에」→ dismiss  
- 저장: `localStorage` `…_bio_hint_dismissed:{userId}` — **다시 안 뜸**  
- i18n: `auth.bioHintBannerTitle|Body|Cta|Dismiss` (KR/US/JP/CH/TH)

### PC 로그인

- OTP 입력과 병행해 **로그인용 QR** 제공 가능 (개인만)
- 흐름: PC QR 표시 → 폰 카메라 스캔 → 폰에서 동일 계정 승인 → PC 세션 발급
- ticket: **짧은 만료(기본 2분)·1회용**

## 2. 기술 선택

| 항목 | 값 |
|------|-----|
| 바이오 | WebAuthn 플랫폼 인증기 (Face ID / 지문 / Windows Hello) — **네이티브 앱 API 아님** |
| 서버 라이브러리 | `@simplewebauthn/server` ^13 |
| 브라우저 | `@simplewebauthn/browser` ^13 |
| RP ID | 환경변수 `WEBAUTHN_RP_ID` (예: `tinpass.com`) |
| Origins | `WEBAUTHN_ORIGINS` CSV (HTTPS 필수) |
| Challenge TTL | 5분 |
| QR TTL | 2분 |

## 3. 로그인 시퀀스

```text
email+password
  → (개인 + credential 있음) WebAuthn get 우선
  → 실패/취소/미등록 → TOTP 6자리
  → (선택) QR ticket → 폰 승인 → PC exchange
```

## 4. API 표면 (호스트 `/api/auth` 아래 권장)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/webauthn/register/options` | Bearer | 등록 options |
| POST | `/webauthn/register/verify` | Bearer | 등록 검증 |
| GET | `/webauthn/credentials` | Bearer | 목록 |
| POST | `/webauthn/credentials/:id/delete` | Bearer + OTP code | 삭제 (OTP 필수) |
| POST | `/webauthn/login/options` | otpToken | 로그인 options |
| POST | `/webauthn/login/verify` | otpToken | 로그인 검증 → session |
| POST | `/qr/create` | otpToken | 2FA 단계 QR |
| POST | `/qr/create-anonymous` | — | 폰 세션 승인형 QR |
| GET | `/qr/status` | — | 폴링 |
| GET | `/qr/info` | — | 승인 페이지용 |
| POST | `/qr/approve` | Bearer | 폰 승인 |
| POST | `/qr/exchange` | — | PC 세션 발급 |

로그인 password 응답 확장:

```json
{
  "otpRequired": true,
  "otpToken": "...",
  "otpMethod": "totp",
  "webauthnAvailable": true,
  "qrLoginAvailable": true
}
```

## 5. DB 테이블

- `webauthn_credentials`
- `webauthn_challenges`
- `login_qr_tickets`

상세: `schema/`

## 6. 호스트가 반드시 제공할 것 (어댑터)

- `isIndividualEligible(userId)` — 개인 고객 여부  
- Prisma(또는 동등) CRUD for 위 3 테이블  
- `issueSession(userId)` — 세션 JWT 발급  
- `verifyOtpLoginToken(otpToken)` — 2FA pending 토큰 검증  
- HTTP 에러 매핑 (`code` 필드 권장)

# Integration checklist — 다른 저장소에서 붙이기

예상 공수: **반나절 ~ 1일** (기존 OTP 로그인 있는 경우)

## 0. 복사

```text
modules/customer-auth-2fa/  →  대상저장소/modules/customer-auth-2fa/
# 또는 modules/dist/customer-auth-2fa.zip 압축 해제
```

## 1. 의존성

```bash
# backend
npm i @simplewebauthn/server@^13

# frontend
npm i @simplewebauthn/browser@^13
```

## 2. 환경변수

`env.example` 참고:

```env
WEBAUTHN_RP_ID=example.com
WEBAUTHN_ORIGINS=https://example.com,https://www.example.com
WEBAUTHN_RP_NAME=MyApp
PUBLIC_WEB_URL=https://example.com
```

## 3. DB

1. `schema/prisma.fragment.prisma` 내용을 호스트 `schema.prisma`의 `User` 모델에 relation 추가 후 붙여넣기  
2. `schema/migration.sql` 적용 또는 `prisma migrate`  
3. **FK `users(id)`** — 호스트 사용자 테이블명이 다르면 SQL의테이블명 수정

## 4. 백엔드 어댑터

`src/adapters.ts`의 `CustomerAuth2faAdapters`를 구현합니다.

최소 구현 예:

```ts
import { createWebAuthnService, createLoginQrService } from '@tinpass/customer-auth-2fa';
import { adapters } from './my-adapters';

export const webauthn = createWebAuthnService(adapters);
export const loginQr = createLoginQrService(adapters);
```

라우트는 `src/routes.express.example.ts`를 호스트 Express 라우터에 복사·연결합니다.  
password 로그인 성공 후 OTP 필요 시 `webauthnAvailable` / `qrLoginAvailable` 필드를 붙입니다.

## 5. 프론트

1. `frontend/types.ts` · `frontend/api-client.ts`를 호스트 API 클라이언트에 병합  
2. 로그인 2차 화면: 바이오 우선 → OTP → QR (DESIGN.md)  
3. 계정 설정: 개인만 생체 등록/삭제  
4. `/login/qr-approve?ticket=` 페이지  
5. `frontend/i18n/keys.json` 키를 호스트 로케일에 병합 (KR/US/JP/CH/TH)  
6. (v1.1) `frontend/BioHintBanner.tsx.example` → 대시보드에 1회 안내 배너

## 6. 정책 게이트

`isIndividualEligible(userId)`에서 **법인·관리자는 false**를 반환해야 합니다.

## 7. 검증 시나리오

- [ ] 개인: OTP 등록 없이 바이오만 → 불가  
- [ ] 개인: 바이오 등록 후 로그인 → Face ID/지문 우선  
- [ ] 바이오 취소 → OTP 입력으로 로그인  
- [ ] 법인: `webauthnAvailable=false`, QR 없음  
- [ ] PC QR → 폰 승인 → PC 세션  
- [ ] QR 2분 만료

## 8. TINPASS 참고 구현 위치

| 영역 | 경로 |
|------|------|
| 서비스 | `backend/src/services/webauthn.service.ts`, `login-qr.service.ts` |
| 라우트 | `backend/src/routes/auth.routes.ts` |
| 로그인 UI | `frontend/src/app/login/page.tsx` |
| QR 승인 | `frontend/src/app/login/qr-approve/page.tsx` |
| 계정 바이오 | `frontend/src/app/dashboard/account/page.tsx` |

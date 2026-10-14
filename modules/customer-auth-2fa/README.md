# @tinpass/customer-auth-2fa

개인 고객 **WebAuthn 바이오 + OTP 폴백 + PC QR 로그인** 이식 키트.

| | |
|--|--|
| 버전 | `VERSION` → 1.2.0 |
| 설계 | [DESIGN.md](./DESIGN.md) |
| 붙이는 법 | [INTEGRATION.md](./INTEGRATION.md) |

## 폴더

```text
customer-auth-2fa/
  DESIGN.md                 # 제품·보안 설계값 (단일 출처)
  INTEGRATION.md            # 다른 저장소 체크리스트
  env.example
  schema/                   # Prisma fragment + SQL
  src/                      # 어댑터 기반 서버 로직
  frontend/                 # API 타입·클라이언트·i18n
  package.json
```

## 빠른 시작

1. 이 폴더(또는 `modules/dist/customer-auth-2fa.zip`)를 대상 저장소로 복사  
2. `INTEGRATION.md` 순서대로 의존성·DB·어댑터·UI  
3. `isIndividualEligible`에서 법인/관리자 제외  

## 배포 zip

저장소 루트에서:

```powershell
powershell -ExecutionPolicy Bypass -File modules\pack-module.ps1 -Name customer-auth-2fa
```

산출물: `modules/dist/customer-auth-2fa-1.0.0.zip`

## TINPASS 실구현

동일 설계가 운영 코드에 이미 반영되어 있습니다.

- `backend/src/services/webauthn.service.ts`
- `backend/src/services/login-qr.service.ts`
- `frontend/src/app/login/page.tsx`
- `frontend/src/app/login/qr-approve/page.tsx`

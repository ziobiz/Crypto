# TINPASS (Crypto) live mapping

이 모듈 DESIGN과 운영 코드 대응표입니다.

| 모듈 | 운영 경로 |
|------|-----------|
| DESIGN.md 정책 | 개인만 바이오/QR, 법인·관리자 OTP |
| schema/ | `backend/prisma/schema.prisma` + `migrations/20261014120000_webauthn_login_qr/` |
| src/webauthn.ts | `backend/src/services/webauthn.service.ts` |
| src/login-qr.ts | `backend/src/services/login-qr.service.ts` |
| routes.express.example.ts | `backend/src/routes/auth.routes.ts` (webauthn/qr endpoints) |
| frontend/api-client.ts | `frontend/src/lib/api.ts` |
| frontend/i18n | `frontend/src/i18n/kr.ts` + locale/{us,jp,ch,th}.ts |
| 로그인 UI | `frontend/src/app/login/page.tsx` |
| QR 승인 | `frontend/src/app/login/qr-approve/page.tsx` |
| 계정 등록 | `frontend/src/app/dashboard/account/page.tsx` |
| 1회 안내 배너 | `frontend/src/components/auth/BioHintBanner.tsx` (DashboardGuard) |

운영 코드는 호스트에 밀결합되어 있고, 이 모듈은 **다른 저장소 이식용 배포본**입니다.

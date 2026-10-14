# TINPASS reusable modules

다른 저장소에서 빠르게 이식할 수 있도록 **설계값 + 구현 키트**를 모아 둔 디렉터리입니다.

| 모듈 | 설명 | 배포 zip |
|------|------|----------|
| [`customer-auth-2fa`](./customer-auth-2fa/) | 개인 고객 WebAuthn(바이오) + OTP 폴백 + PC QR 로그인 | `modules/dist/customer-auth-2fa.zip` |
| [`email-otp-template`](./email-otp-template/) | 인증번호 이메일 HTML 카드 (Wirex 스타일) + KR/US/JP/CH/TH | `modules/dist/email-otp-template.zip` |

## 사용 방법

```powershell
# zip 생성 (배포용)
powershell -ExecutionPolicy Bypass -File modules\pack-module.ps1 -Name customer-auth-2fa
```

다른 저장소에서는 zip을 풀거나 이 폴더를 복사한 뒤, 각 모듈의 `INTEGRATION.md`를 따릅니다.

## 규칙

- 모듈은 **호스트 앱에 종속되지 않는 어댑터 인터페이스**를 둡니다 (User/DB/JWT/에러).
- 제품 정책(개인만 바이오, 법인 OTP, 가입 시 OTP 필수 등)은 `DESIGN.md`가 단일 출처입니다.
- Crypto(TINPASS) 본 저장소 연동 구현은 `backend/` · `frontend/`에 있으며, 모듈은 **이식용 배포본**입니다.

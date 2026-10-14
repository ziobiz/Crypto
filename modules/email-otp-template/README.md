# @tinpass/email-otp-template

이메일 **인증번호(OTP / verification code)** HTML 템플릿 이식 키트.  
Wirex One 스타일 카드 UI + TINPASS 브랜딩 + KR/US/JP/CH/TH.

| | |
|--|--|
| 버전 | `VERSION` → 1.0.0 |
| 설계 | [DESIGN.md](./DESIGN.md) |
| 붙이는 법 | [INTEGRATION.md](./INTEGRATION.md) |

## 폴더

```text
email-otp-template/
  DESIGN.md
  INTEGRATION.md
  VERSION
  package.json
  src/
    types.ts
    i18n.ts       # 로케일·목적별 문구
    template.ts   # HTML 카드 빌더
    index.ts
  preview/        # 선택: 로컬 HTML 미리보기
```

## 빠른 시작

```ts
import { renderOtpMail, resolveOtpMailLocale } from '@tinpass/email-otp-template';

const locale = resolveOtpMailLocale(req.headers['x-locale']);
const { subject, text, html } = renderOtpMail(locale, {
  name: 'Hong',
  code: '434168',
  minutes: '5',
  purpose: 'REGISTER', // LOGIN | REGISTER | OTP_ENROLL | PASSWORD_RESET | OTP_RESET
  brand: {
    brandLabel: 'TINPASS By Ontheline',
    productName: 'TINPASS',
    serviceByName: 'Thinpass',
  },
});

await transporter.sendMail({ to, subject, text, html });
```

## 배포 zip

```powershell
powershell -ExecutionPolicy Bypass -File modules\pack-module.ps1 -Name email-otp-template
```

산출물: `modules/dist/email-otp-template-1.0.0.zip`

## TINPASS 실구현

- `backend/src/constants/otp-mail-i18n.ts`
- `backend/src/services/email.service.ts`

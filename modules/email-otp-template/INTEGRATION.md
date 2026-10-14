# Integration checklist — 이메일 인증 템플릿

예상 공수: **1~2시간** (SMTP 이미 있는 경우)

## 0. 복사

```text
modules/email-otp-template/  →  대상저장소/modules/email-otp-template/
# 또는 modules/dist/email-otp-template.zip 압축 해제
```

소스만 쓸 경우 `src/` 를 호스트 `backend/src/lib/email-otp-template/` 등으로 복사해도 됩니다.

## 1. 의존성

없음 (순수 TypeScript / HTML 문자열). nodemailer 등 SMTP는 호스트 책임.

## 2. 발송 연결

```ts
import {
  renderOtpMail,
  resolveOtpMailLocale,
  type OtpMailPurpose,
} from './email-otp-template'; // 또는 @tinpass/email-otp-template

function mapPurpose(hostPurpose: string): OtpMailPurpose {
  switch (hostPurpose) {
    case 'REGISTER': return 'REGISTER';
    case 'PASSWORD_RESET': return 'PASSWORD_RESET';
    case 'OTP_RESET': return 'OTP_RESET';
    case 'OTP_ENROLL': return 'OTP_ENROLL';
    default: return 'LOGIN';
  }
}

const locale = resolveOtpMailLocale(localeHint);
const { subject, text, html } = renderOtpMail(locale, {
  name: userName,
  code,
  minutes: String(expireMinutes),
  purpose: mapPurpose(purpose),
});

await transport.sendMail({ from, to, subject, text, html });
```

## 3. 브랜드

다른 사이트에서는 `brand` 만 교체:

```ts
brand: {
  brandLabel: 'MyApp By Company',
  productName: 'MyApp',
  serviceByName: 'MyApp',
}
```

## 4. 다국어

- 요청 헤더 `X-Locale` / `Accept-Language` → `resolveOtpMailLocale`
- 미지원 로케일은 US(English) 폴백
- 문구 추가·수정은 `src/i18n.ts`

## 5. 확인

1. 회원가입 / 비번재설정 / OTP초기화 각각 메일 1통 발송
2. Gmail·Outlook에서 카드·코드 박스·하단 Service by 확인
3. KR/US 로케일 전환 후 제목·본문 언어 확인

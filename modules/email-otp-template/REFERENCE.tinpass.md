# TINPASS 실구현 참조

| 모듈 파일 | TINPASS 경로 |
|-----------|--------------|
| `src/i18n.ts` + `src/template.ts` | `backend/src/constants/otp-mail-i18n.ts` |
| 발송 | `backend/src/services/email.service.ts` |
| purpose 전달 | `backend/src/services/email-verification.service.ts` |
| 미리보기 | `preview/design-preview.html` / `deploy/release/otp-email-design-preview.html` |

레이아웃·문구를 바꿀 때는 **모듈과 백엔드 상수 파일을 함께** 수정한다.

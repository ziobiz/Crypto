export { EMAIL_OTP_TEMPLATE_VERSION } from './types.js';
export type {
  OtpMailBrand,
  OtpMailLocale,
  OtpMailPurpose,
  OtpMailRenderVars,
  OtpMailRendered,
} from './types.js';
export { otpMailCopy, resolveOtpMailLocale } from './i18n.js';
export {
  DEFAULT_OTP_MAIL_BRAND,
  buildOtpMailHtml,
  renderOtpMail,
  renderOtpMailFromHint,
} from './template.js';

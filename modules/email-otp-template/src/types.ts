export const EMAIL_OTP_TEMPLATE_VERSION = '1.0.0';

/** UI / mail locale codes used across TINPASS products. */
export type OtpMailLocale = 'KR' | 'US' | 'JP' | 'CH' | 'TH';

/**
 * Why the code was sent — drives title + subject.
 * Host apps may map their own purpose enums onto these.
 */
export type OtpMailPurpose =
  | 'LOGIN'
  | 'REGISTER'
  | 'OTP_ENROLL'
  | 'PASSWORD_RESET'
  | 'OTP_RESET';

export type OtpMailBrand = {
  /** Top line inside card, e.g. "TINPASS By Ontheline" */
  brandLabel: string;
  /** Bold product name in the title, e.g. "TINPASS" */
  productName: string;
  /** Footer outside card, e.g. "Thinpass" (shown after "Service by") */
  serviceByName: string;
};

export type OtpMailRenderVars = {
  name: string;
  code: string;
  minutes: string;
  purpose?: OtpMailPurpose;
  brand?: Partial<OtpMailBrand>;
};

export type OtpMailRendered = {
  subject: string;
  text: string;
  html: string;
};

/** Login / register email OTP copy by UI locale. Default: English (US). */
export type OtpMailLocale = 'KR' | 'US' | 'JP' | 'CH' | 'TH';

type OtpMailCopy = {
  subject: string;
  body: string;
};

const OTP_MAIL: Record<OtpMailLocale, OtpMailCopy> = {
  US: {
    subject: '[Crypto Trading by Tinpass.com] Login verification code {code}',
    body:
      'Hello {name},\n\nLogin verification code: {code}\nValid for: {minutes} minutes\n\nIf you did not request this, please ignore this email.',
  },
  KR: {
    subject: '[Crypto Trading by Tinpass.com] 로그인 인증번호 {code}',
    body:
      '안녕하세요 {name}님,\n\n로그인 인증번호: {code}\n유효시간: {minutes}분\n\n본인이 요청하지 않았다면 무시하세요.',
  },
  JP: {
    subject: '[Crypto Trading by Tinpass.com] ログイン認証コード {code}',
    body:
      '{name} 様\n\nログイン認証コード: {code}\n有効時間: {minutes}分\n\nご本人の操作でない場合は、このメールを無視してください。',
  },
  CH: {
    subject: '[Crypto Trading by Tinpass.com] 登录验证码 {code}',
    body:
      '您好 {name}，\n\n登录验证码：{code}\n有效时间：{minutes} 分钟\n\n如非本人操作，请忽略此邮件。',
  },
  TH: {
    subject: '[Crypto Trading by Tinpass.com] รหัสยืนยันเข้าสู่ระบบ {code}',
    body:
      'สวัสดี {name}\n\nรหัสยืนยันเข้าสู่ระบบ: {code}\nใช้ได้ภายใน: {minutes} นาที\n\nหากคุณไม่ได้ขอรหัสนี้ โปรดเพิกเฉยอีเมลนี้',
  },
};

/** Resolve mail locale from X-Locale / Accept-Language. Falls back to English. */
export function resolveOtpMailLocale(hint?: string | null): OtpMailLocale {
  const raw = String(hint || '').trim().toUpperCase();
  if (!raw) return 'US';
  if (raw === 'JP' || raw.startsWith('JA') || raw.includes('JP') || raw.includes('JA-JP')) return 'JP';
  if (raw === 'KR' || raw.startsWith('KO') || raw.includes('KR') || raw.includes('KO-KR')) return 'KR';
  if (raw === 'CH' || raw.startsWith('ZH') || raw.includes('ZH-CN') || raw.includes('ZH-TW')) return 'CH';
  if (raw === 'TH' || raw.startsWith('TH')) return 'TH';
  if (raw === 'US' || raw.startsWith('EN') || raw.includes('EN-')) return 'US';
  return 'US';
}

export function otpMailCopy(locale: OtpMailLocale): OtpMailCopy {
  return OTP_MAIL[locale] || OTP_MAIL.US;
}

export function renderOtpMail(
  locale: OtpMailLocale,
  vars: { name: string; code: string; minutes: string },
): { subject: string; text: string; html: string } {
  const copy = otpMailCopy(locale);
  const fill = (s: string) =>
    s
      .replace(/\{name\}/g, vars.name)
      .replace(/\{code\}/g, vars.code)
      .replace(/\{minutes\}/g, vars.minutes);
  const subject = fill(copy.subject);
  const text = fill(copy.body);
  const html =
    locale === 'KR'
      ? `<div style="font-family:sans-serif;line-height:1.6">
<p>${vars.name}님,</p>
<p>로그인 인증번호:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">${vars.code}</p>
<p>유효시간 ${vars.minutes}분</p>
<p style="color:#666;font-size:12px">본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
</div>`
      : locale === 'JP'
        ? `<div style="font-family:sans-serif;line-height:1.6">
<p>${vars.name} 様</p>
<p>ログイン認証コード:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">${vars.code}</p>
<p>有効時間 ${vars.minutes}分</p>
<p style="color:#666;font-size:12px">ご本人の操作でない場合は、このメールを無視してください。</p>
</div>`
        : locale === 'CH'
          ? `<div style="font-family:sans-serif;line-height:1.6">
<p>您好 ${vars.name}，</p>
<p>登录验证码：</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">${vars.code}</p>
<p>有效时间 ${vars.minutes} 分钟</p>
<p style="color:#666;font-size:12px">如非本人操作，请忽略此邮件。</p>
</div>`
          : locale === 'TH'
            ? `<div style="font-family:sans-serif;line-height:1.6">
<p>สวัสดี ${vars.name}</p>
<p>รหัสยืนยันเข้าสู่ระบบ:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">${vars.code}</p>
<p>ใช้ได้ภายใน ${vars.minutes} นาที</p>
<p style="color:#666;font-size:12px">หากคุณไม่ได้ขอรหัสนี้ โปรดเพิกเฉยอีเมลนี้</p>
</div>`
            : `<div style="font-family:sans-serif;line-height:1.6">
<p>Hello ${vars.name},</p>
<p>Login verification code:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">${vars.code}</p>
<p>Valid for ${vars.minutes} minutes</p>
<p style="color:#666;font-size:12px">If you did not request this, please ignore this email.</p>
</div>`;
  return { subject, text, html };
}

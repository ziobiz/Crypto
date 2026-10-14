import type { OtpMailLocale, OtpMailPurpose } from './types.js';

export type OtpMailCopy = {
  subject: string;
  /** Plain-text body (multipart/alternative text part). */
  body: string;
  /** Title line inside card, e.g. "Log in to {product}" — {product} replaced with bold product name. */
  title: string;
  yourCodeIs: string;
  expires: string;
  ignore: string;
  serviceByPrefix: string;
};

type PurposeCopy = Record<OtpMailPurpose, Pick<OtpMailCopy, 'subject' | 'body' | 'title'>>;

const SHARED: Record<OtpMailLocale, Pick<OtpMailCopy, 'yourCodeIs' | 'expires' | 'ignore' | 'serviceByPrefix'>> = {
  US: {
    yourCodeIs: 'Your code is',
    expires: 'This code expires in {minutes} minutes. Do not share this code with anyone.',
    ignore: "Wasn't you? You can safely ignore this email.",
    serviceByPrefix: 'Service by',
  },
  KR: {
    yourCodeIs: '인증번호',
    expires: '유효시간 {minutes}분. 이 코드를 다른 사람과 공유하지 마세요.',
    ignore: '본인이 요청하지 않았다면 이 메일을 무시하세요.',
    serviceByPrefix: 'Service by',
  },
  JP: {
    yourCodeIs: '認証コード',
    expires: '有効時間 {minutes}分。このコードを他人と共有しないでください。',
    ignore: 'ご本人の操作でない場合は、このメールを無視してください。',
    serviceByPrefix: 'Service by',
  },
  CH: {
    yourCodeIs: '验证码',
    expires: '有效时间 {minutes} 分钟。请勿与他人分享此验证码。',
    ignore: '如非本人操作，请忽略此邮件。',
    serviceByPrefix: 'Service by',
  },
  TH: {
    yourCodeIs: 'รหัสยืนยันของคุณคือ',
    expires: 'รหัสหมดอายุใน {minutes} นาที ห้ามแชร์รหัสนี้กับผู้อื่น',
    ignore: 'หากคุณไม่ได้ขอรหัสนี้ โปรดเพิกเฉยอีเมลนี้',
    serviceByPrefix: 'Service by',
  },
};

const PURPOSE: Record<OtpMailLocale, PurposeCopy> = {
  US: {
    LOGIN: {
      subject: '[TINPASS] Login verification code {code}',
      title: 'Log in to {product}',
      body:
        'Hello {name},\n\nLogin verification code: {code}\nValid for: {minutes} minutes\n\nIf you did not request this, please ignore this email.',
    },
    REGISTER: {
      subject: '[TINPASS] Sign-up verification code {code}',
      title: 'Sign up for {product}',
      body:
        'Hello {name},\n\nSign-up verification code: {code}\nValid for: {minutes} minutes\n\nIf you did not request this, please ignore this email.',
    },
    OTP_ENROLL: {
      subject: '[TINPASS] OTP setup verification code {code}',
      title: 'Set up OTP on {product}',
      body:
        'Hello {name},\n\nOTP setup verification code: {code}\nValid for: {minutes} minutes\n\nIf you did not request this, please ignore this email.',
    },
    PASSWORD_RESET: {
      subject: '[TINPASS] Password reset code {code}',
      title: 'Reset password on {product}',
      body:
        'Hello {name},\n\nPassword reset code: {code}\nValid for: {minutes} minutes\n\nIf you did not request this, please ignore this email.',
    },
    OTP_RESET: {
      subject: '[TINPASS] OTP reset code {code}',
      title: 'Reset OTP on {product}',
      body:
        'Hello {name},\n\nOTP reset code: {code}\nValid for: {minutes} minutes\n\nIf you did not request this, please ignore this email.',
    },
  },
  KR: {
    LOGIN: {
      subject: '[TINPASS] 로그인 인증번호 {code}',
      title: '{product} 로그인',
      body:
        '안녕하세요 {name}님,\n\n로그인 인증번호: {code}\n유효시간: {minutes}분\n\n본인이 요청하지 않았다면 무시하세요.',
    },
    REGISTER: {
      subject: '[TINPASS] 회원가입 인증번호 {code}',
      title: '{product} 회원가입',
      body:
        '안녕하세요 {name}님,\n\n회원가입 인증번호: {code}\n유효시간: {minutes}분\n\n본인이 요청하지 않았다면 무시하세요.',
    },
    OTP_ENROLL: {
      subject: '[TINPASS] OTP 등록 인증번호 {code}',
      title: '{product} OTP 등록',
      body:
        '안녕하세요 {name}님,\n\nOTP 등록 인증번호: {code}\n유효시간: {minutes}분\n\n본인이 요청하지 않았다면 무시하세요.',
    },
    PASSWORD_RESET: {
      subject: '[TINPASS] 비밀번호 재설정 인증번호 {code}',
      title: '{product} 비밀번호 재설정',
      body:
        '안녕하세요 {name}님,\n\n비밀번호 재설정 인증번호: {code}\n유효시간: {minutes}분\n\n본인이 요청하지 않았다면 무시하세요.',
    },
    OTP_RESET: {
      subject: '[TINPASS] OTP 초기화 인증번호 {code}',
      title: '{product} OTP 초기화',
      body:
        '안녕하세요 {name}님,\n\nOTP 초기화 인증번호: {code}\n유효시간: {minutes}분\n\n본인이 요청하지 않았다면 무시하세요.',
    },
  },
  JP: {
    LOGIN: {
      subject: '[TINPASS] ログイン認証コード {code}',
      title: '{product} にログイン',
      body:
        '{name} 様\n\nログイン認証コード: {code}\n有効時間: {minutes}分\n\nご本人の操作でない場合は、このメールを無視してください。',
    },
    REGISTER: {
      subject: '[TINPASS] 会員登録認証コード {code}',
      title: '{product} 会員登録',
      body:
        '{name} 様\n\n会員登録認証コード: {code}\n有効時間: {minutes}分\n\nご本人の操作でない場合は、このメールを無視してください。',
    },
    OTP_ENROLL: {
      subject: '[TINPASS] OTP登録認証コード {code}',
      title: '{product} OTP登録',
      body:
        '{name} 様\n\nOTP登録認証コード: {code}\n有効時間: {minutes}分\n\nご本人の操作でない場合は、このメールを無視してください。',
    },
    PASSWORD_RESET: {
      subject: '[TINPASS] パスワード再設定コード {code}',
      title: '{product} パスワード再設定',
      body:
        '{name} 様\n\nパスワード再設定コード: {code}\n有効時間: {minutes}分\n\nご本人の操作でない場合は、このメールを無視してください。',
    },
    OTP_RESET: {
      subject: '[TINPASS] OTP初期化コード {code}',
      title: '{product} OTP初期化',
      body:
        '{name} 様\n\nOTP初期化コード: {code}\n有効時間: {minutes}分\n\nご本人の操作でない場合は、このメールを無視してください。',
    },
  },
  CH: {
    LOGIN: {
      subject: '[TINPASS] 登录验证码 {code}',
      title: '登录 {product}',
      body:
        '您好 {name}，\n\n登录验证码：{code}\n有效时间：{minutes} 分钟\n\n如非本人操作，请忽略此邮件。',
    },
    REGISTER: {
      subject: '[TINPASS] 注册验证码 {code}',
      title: '注册 {product}',
      body:
        '您好 {name}，\n\n注册验证码：{code}\n有效时间：{minutes} 分钟\n\n如非本人操作，请忽略此邮件。',
    },
    OTP_ENROLL: {
      subject: '[TINPASS] OTP 设置验证码 {code}',
      title: '在 {product} 设置 OTP',
      body:
        '您好 {name}，\n\nOTP 设置验证码：{code}\n有效时间：{minutes} 分钟\n\n如非本人操作，请忽略此邮件。',
    },
    PASSWORD_RESET: {
      subject: '[TINPASS] 密码重置验证码 {code}',
      title: '重置 {product} 密码',
      body:
        '您好 {name}，\n\n密码重置验证码：{code}\n有效时间：{minutes} 分钟\n\n如非本人操作，请忽略此邮件。',
    },
    OTP_RESET: {
      subject: '[TINPASS] OTP 重置验证码 {code}',
      title: '重置 {product} OTP',
      body:
        '您好 {name}，\n\nOTP 重置验证码：{code}\n有效时间：{minutes} 分钟\n\n如非本人操作，请忽略此邮件。',
    },
  },
  TH: {
    LOGIN: {
      subject: '[TINPASS] รหัสยืนยันเข้าสู่ระบบ {code}',
      title: 'เข้าสู่ระบบ {product}',
      body:
        'สวัสดี {name}\n\nรหัสยืนยันเข้าสู่ระบบ: {code}\nใช้ได้ภายใน: {minutes} นาที\n\nหากคุณไม่ได้ขอรหัสนี้ โปรดเพิกเฉยอีเมลนี้',
    },
    REGISTER: {
      subject: '[TINPASS] รหัสยืนยันสมัครสมาชิก {code}',
      title: 'สมัคร {product}',
      body:
        'สวัสดี {name}\n\nรหัสยืนยันสมัครสมาชิก: {code}\nใช้ได้ภายใน: {minutes} นาที\n\nหากคุณไม่ได้ขอรหัสนี้ โปรดเพิกเฉยอีเมลนี้',
    },
    OTP_ENROLL: {
      subject: '[TINPASS] รหัสยืนยันตั้งค่า OTP {code}',
      title: 'ตั้งค่า OTP บน {product}',
      body:
        'สวัสดี {name}\n\nรหัสยืนยันตั้งค่า OTP: {code}\nใช้ได้ภายใน: {minutes} นาที\n\nหากคุณไม่ได้ขอรหัสนี้ โปรดเพิกเฉยอีเมลนี้',
    },
    PASSWORD_RESET: {
      subject: '[TINPASS] รหัสรีเซ็ตรหัสผ่าน {code}',
      title: 'รีเซ็ตรหัสผ่าน {product}',
      body:
        'สวัสดี {name}\n\nรหัสรีเซ็ตรหัสผ่าน: {code}\nใช้ได้ภายใน: {minutes} นาที\n\nหากคุณไม่ได้ขอรหัสนี้ โปรดเพิกเฉยอีเมลนี้',
    },
    OTP_RESET: {
      subject: '[TINPASS] รหัสรีเซ็ต OTP {code}',
      title: 'รีเซ็ต OTP บน {product}',
      body:
        'สวัสดี {name}\n\nรหัสรีเซ็ต OTP: {code}\nใช้ได้ภายใน: {minutes} นาที\n\nหากคุณไม่ได้ขอรหัสนี้ โปรดเพิกเฉยอีเมลนี้',
    },
  },
};

export function otpMailCopy(locale: OtpMailLocale, purpose: OtpMailPurpose = 'LOGIN'): OtpMailCopy {
  const loc = PURPOSE[locale] ? locale : 'US';
  const purposeKey = PURPOSE[loc][purpose] ? purpose : 'LOGIN';
  return {
    ...PURPOSE[loc][purposeKey],
    ...SHARED[loc],
  };
}

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

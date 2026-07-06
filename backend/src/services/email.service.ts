import nodemailer from 'nodemailer';
import type { HqEmailOtpConfig } from '../constants/hq-policy';

function buildTransport(cfg: HqEmailOtpConfig) {
  const host = cfg.smtpHost || process.env.SMTP_HOST;
  const port = cfg.smtpPort || Number(process.env.SMTP_PORT ?? 587);
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: cfg.smtpSecure ?? process.env.SMTP_SECURE === 'true',
    auth:
      (cfg.smtpUser || process.env.SMTP_USER)
        ? {
            user: cfg.smtpUser || process.env.SMTP_USER,
            pass: cfg.smtpPassword || process.env.SMTP_PASSWORD,
          }
        : undefined,
  });
}

export async function sendOtpEmail(
  cfg: HqEmailOtpConfig,
  to: string,
  code: string,
  userName: string,
): Promise<void> {
  const subject = (cfg.otpEmailSubject || '로그인 인증번호').replace('{code}', code);
  const bodyTemplate =
    cfg.otpEmailBody ||
    '안녕하세요 {name}님,\n\n로그인 인증번호: {code}\n유효시간: {minutes}분\n\n본인이 요청하지 않았다면 무시하세요.';

  const text = bodyTemplate
    .replace(/\{name\}/g, userName)
    .replace(/\{code\}/g, code)
    .replace(/\{minutes\}/g, String(cfg.otpExpireMinutes || 5));

  const html = `<div style="font-family:sans-serif;line-height:1.6">
<p>${userName}님,</p>
<p>로그인 인증번호:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>
<p>유효시간 ${cfg.otpExpireMinutes || 5}분</p>
<p style="color:#666;font-size:12px">본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
</div>`;

  const from = cfg.fromAddress || process.env.SMTP_FROM || 'noreply@tinpass.com';
  const fromName = cfg.fromName || 'Crypto Workflow';

  const transport = buildTransport(cfg);
  if (!transport) {
    console.warn(`[OTP/email] SMTP not configured — login code for ${to}: ${code}`);
    return;
  }

  try {
    await transport.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error('[OTP/email] send failed:', err);
    console.warn(`[OTP/email] fallback — login code for ${to}: ${code}`);
  }
}

export async function sendTestEmail(cfg: HqEmailOtpConfig, to: string): Promise<void> {
  await sendOtpEmail(cfg, to, '123456', 'Test User');
}

export async function sendGenericEmail(
  cfg: HqEmailOtpConfig,
  to: string,
  subject: string,
  text: string,
  html?: string,
): Promise<void> {
  const from = cfg.fromAddress || process.env.SMTP_FROM || 'noreply@tinpass.com';
  const fromName = cfg.fromName || 'Crypto Workflow';

  const transport = buildTransport(cfg);
  if (!transport) {
    console.warn(`[email] SMTP not configured — message to ${to}:\n${text}`);
    return;
  }

  try {
    await transport.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      text,
      html: html ?? text.replace(/\n/g, '<br>'),
    });
  } catch (err) {
    console.error('[email] send failed:', err);
    console.warn(`[email] fallback — message to ${to}:\n${text}`);
  }
}

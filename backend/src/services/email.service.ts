import nodemailer from 'nodemailer';
import type { HqEmailOtpConfig } from '../constants/hq-policy';
import { AppError } from '../lib/errors';
import {
  renderOtpMail,
  resolveOtpMailLocale,
  type OtpMailLocale,
} from '../constants/otp-mail-i18n';

function buildTransport(cfg: HqEmailOtpConfig) {
  const host = (cfg.smtpHost || process.env.SMTP_HOST || '').trim();
  const port = cfg.smtpPort || Number(process.env.SMTP_PORT ?? 587);
  const user = (cfg.smtpUser || process.env.SMTP_USER || '').trim();
  const pass = (cfg.smtpPassword || process.env.SMTP_PASSWORD || '').trim();
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: cfg.smtpSecure ?? process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

export async function sendOtpEmail(
  cfg: HqEmailOtpConfig,
  to: string,
  code: string,
  userName: string,
  expireMinutes?: number,
  localeHint?: string | null,
): Promise<void> {
  const minutes = String(expireMinutes ?? (cfg.otpExpireMinutes || 5));
  const locale: OtpMailLocale = resolveOtpMailLocale(localeHint);
  const rendered = renderOtpMail(locale, {
    name: userName,
    code,
    minutes,
  });

  // HQ custom templates are Korean-centric — only apply for KR; other locales use built-in i18n.
  let subject = rendered.subject;
  let text = rendered.text;
  let html = rendered.html;
  if (locale === 'KR') {
    if (cfg.otpEmailSubject?.trim()) {
      subject = cfg.otpEmailSubject.replace(/\{code\}/g, code).replace(/\{name\}/g, userName);
    }
    if (cfg.otpEmailBody?.trim()) {
      text = cfg.otpEmailBody
        .replace(/\{name\}/g, userName)
        .replace(/\{code\}/g, code)
        .replace(/\{minutes\}/g, minutes);
    }
  }

  const from = cfg.fromAddress || process.env.SMTP_FROM || 'noreply@tinpass.com';
  const fromName = cfg.fromName || 'TINPASS';

  const transport = buildTransport(cfg);
  if (!transport) {
    console.error(`[OTP/email] SMTP not configured — cannot send to ${to}`);
    throw new AppError(503, 'Email service is not configured', 'EMAIL_NOT_CONFIGURED');
  }

  try {
    const info = await transport.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`[OTP/email] sent to ${to} locale=${locale} messageId=${info.messageId || '-'}`);
  } catch (err) {
    console.error('[OTP/email] send failed:', err);
    throw new AppError(502, 'Failed to send verification email', 'EMAIL_SEND_FAILED');
  }
}

export async function sendTestEmail(cfg: HqEmailOtpConfig, to: string): Promise<void> {
  await sendOtpEmail(cfg, to, '123456', 'Test User', undefined, 'US');
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
    throw err;
  }
}

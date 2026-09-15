import type { Request } from 'express';
import { AppError } from './errors';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function getTurnstileSecret(): string {
  return (process.env.TURNSTILE_SECRET_KEY ?? '').trim();
}

export function isTurnstileConfigured(): boolean {
  return getTurnstileSecret().length > 0;
}

export function clientIp(req: Request): string | undefined {
  const forwarded = req.headers['cf-connecting-ip'] ?? req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).split(',')[0]?.trim();
  }
  return req.ip || req.socket?.remoteAddress;
}

export async function assertTurnstile(token: string | undefined, remoteip?: string): Promise<void> {
  if (!isTurnstileConfigured()) return;

  const response = (token ?? '').trim();
  if (!response) {
    throw new AppError(400, 'Complete the security check', 'TURNSTILE_REQUIRED');
  }

  const body = new URLSearchParams();
  body.set('secret', getTurnstileSecret());
  body.set('response', response);
  if (remoteip) body.set('remoteip', remoteip);

  let data: { success?: boolean; 'error-codes'?: string[] };
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
  } catch {
    throw new AppError(400, 'Security check failed. Try again.', 'TURNSTILE_FAILED');
  }

  if (!data.success) {
    throw new AppError(400, 'Security check failed. Try again.', 'TURNSTILE_FAILED');
  }
}

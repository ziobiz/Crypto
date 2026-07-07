import crypto from 'crypto';
import { AppError } from '../lib/errors';
import type { HqIcopayConfig } from '../constants/hq-policy';

const DEFAULT_ICOPAY_API = process.env.ICOPAY_API_URL?.trim() || 'https://pg.ziobiz.com/api/v1';

export type IcopayCardInput = {
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardholderName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
};

export type IcopayChargeInput = {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  card: IcopayCardInput;
};

export type IcopayChargeResult = {
  success: boolean;
  orderId: string;
  transactionId: string;
  last4: string;
  message?: string;
  raw?: unknown;
};

function maskCardNumber(num: string): string {
  const digits = num.replace(/\D/g, '');
  return digits.slice(-4);
}

function signBody(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret.trim()).update(body).digest('hex');
}

function isSandbox(config: HqIcopayConfig): boolean {
  return (
    config.sandbox === true ||
    process.env.ICOPAY_SANDBOX === '1' ||
    config.bracketSecret.trim().toUpperCase() === 'SANDBOX'
  );
}

function simulateCharge(orderId: string, cardNumber: string): IcopayChargeResult {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.endsWith('0000')) {
    return {
      success: false,
      orderId,
      transactionId: '',
      last4: maskCardNumber(cardNumber),
      message: 'Card declined (sandbox)',
    };
  }
  return {
    success: true,
    orderId,
    transactionId: `SANDBOX-${Date.now()}`,
    last4: maskCardNumber(cardNumber),
    raw: { sandbox: true },
  };
}

export function normalizeIcopayConfig(raw: Partial<HqIcopayConfig>): HqIcopayConfig {
  return {
    enabled: Boolean(raw.enabled),
    mid: String(raw.mid ?? '').trim(),
    bracketSecret: String(raw.bracketSecret ?? '').trim(),
    apiBaseUrl: raw.apiBaseUrl?.trim() || undefined,
    sandbox: raw.sandbox === true,
  };
}

export function maskIcopaySecret(config: HqIcopayConfig): HqIcopayConfig {
  return {
    ...config,
    bracketSecret: config.bracketSecret ? '********' : '',
  };
}

/** ICOPAY 카드 승인 요청 */
export async function chargeIcopayCard(
  config: HqIcopayConfig,
  input: IcopayChargeInput,
): Promise<IcopayChargeResult> {
  if (!config.enabled) {
    throw new AppError(503, 'Card payment is disabled', 'ICOPAY_DISABLED');
  }
  if (!config.mid) {
    throw new AppError(503, 'ICOPAY MID is not configured', 'ICOPAY_MID_MISSING');
  }
  if (!config.bracketSecret) {
    throw new AppError(503, 'ICOPAY bracket secret is not configured', 'ICOPAY_SECRET_MISSING');
  }

  if (isSandbox(config)) {
    const result = simulateCharge(input.orderId, input.card.cardNumber);
    if (!result.success) {
      throw new AppError(402, result.message ?? 'Card payment declined', 'ICOPAY_DECLINED');
    }
    return result;
  }

  const baseUrl = (config.apiBaseUrl || DEFAULT_ICOPAY_API).replace(/\/$/, '');
  const payload = {
    mid: config.mid,
    orderId: input.orderId,
    amount: Math.round(input.amount * 100) / 100,
    currency: input.currency,
    description: input.description,
    cardNumber: input.card.cardNumber.replace(/\s/g, ''),
    cardExpiry: input.card.cardExpiry.replace(/\D/g, ''),
    cardCvv: input.card.cardCvv,
    cardholderName: input.card.cardholderName.trim(),
    email: input.card.email.trim(),
    phone: input.card.phone.replace(/\D/g, ''),
    phoneCountryCode: input.card.phoneCountryCode.trim(),
  };
  const body = JSON.stringify(payload);
  const signature = signBody(body, config.bracketSecret);
  const res = await fetch(`${baseUrl}/payments/card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-MID': config.mid,
      'X-Bracket-Signature': signature,
    },
    body,
  });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const approved =
    res.ok &&
    (raw.success === true ||
      raw.status === 'APPROVED' ||
      raw.resultCode === '0000' ||
      raw.approved === true);
  if (!approved) {
    const msg =
      String(raw.message ?? raw.resultMessage ?? raw.error ?? 'Card payment declined') ||
      'Card payment declined';
    throw new AppError(402, msg, 'ICOPAY_DECLINED');
  }
  return {
    success: true,
    orderId: String(raw.orderId ?? input.orderId),
    transactionId: String(raw.transactionId ?? raw.tid ?? raw.paymentId ?? ''),
    last4: String(raw.last4 ?? maskCardNumber(input.card.cardNumber)),
    raw,
  };
}

export function verifyIcopayWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const expected = signBody(body, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return expected === signature;
  }
}

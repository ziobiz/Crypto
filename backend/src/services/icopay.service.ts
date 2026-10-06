import crypto from 'crypto';
import { AppError } from '../lib/errors';
import type { HqIcopayConfig } from '../constants/hq-policy';

/** ICOPAY public API (DEALMAI / TINPASS LIVE) */
const DEFAULT_ICOPAY_API = process.env.ICOPAY_API_URL?.trim() || 'https://api.icopay.co.kr';

export type IcopayBuyerInput = {
  email: string;
  phone: string;
  phoneCountryCode: string;
  firstName?: string;
  lastName?: string;
  cardholderName?: string;
};

export type IcopayPrepareInput = {
  orderNo: string;
  amount: number;
  currency: string;
  productName: string;
  lang?: string;
  buyer: IcopayBuyerInput;
};

export type IcopayPrepareResult = {
  sessionId: string;
  sessionToken: string;
  payUrl: string;
  embedScriptUrl?: string;
  expiresAt?: string;
  orderNo: string;
  amount: number;
  currency: string;
  integrationMode?: string;
  sandbox?: boolean;
  raw?: unknown;
};

export type IcopayStatusResult = {
  found: boolean;
  paymentStatus: string;
  orderNo: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  last4?: string;
  raw?: unknown;
};

const PHONE_TO_ISO2: Record<string, string> = {
  '+82': 'KR',
  '+81': 'JP',
  '+66': 'TH',
  '+86': 'CN',
  '+1': 'US',
  '+44': 'GB',
  '+65': 'SG',
  '+84': 'VN',
  '+62': 'ID',
  '+60': 'MY',
};

export function phoneCountryToIso2(phoneCountryCode: string): string {
  const code = phoneCountryCode.trim().startsWith('+')
    ? phoneCountryCode.trim()
    : `+${phoneCountryCode.trim()}`;
  return PHONE_TO_ISO2[code] || 'TH';
}

export function localPhoneDigits(phone: string): string {
  return String(phone || '').replace(/\D/g, '').replace(/^0+/, '') || String(phone || '').replace(/\D/g, '');
}

export function splitCardholderName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Buyer', lastName: 'TINPASS' };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: parts[0]! };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') };
}

export function mapAppLangToIcopay(lang?: string): string {
  const u = String(lang || 'ENG').toUpperCase();
  if (u === 'KR' || u === 'KO' || u === 'KOR') return 'KOR';
  if (u === 'JP' || u === 'JA' || u === 'JPN') return 'JPN';
  if (u === 'CH' || u === 'ZH' || u === 'CHN') return 'CHN';
  if (u === 'TH' || u === 'THA') return 'THA';
  return 'ENG';
}

export function normalizeIcopayConfig(raw: Partial<HqIcopayConfig>): HqIcopayConfig {
  const apiBaseUrl = String(raw.apiBaseUrl ?? '').trim() || DEFAULT_ICOPAY_API;
  return {
    enabled: Boolean(raw.enabled),
    mid: String(raw.mid ?? '').trim(),
    compId: String(raw.compId ?? '').trim(),
    bracketSecret: String(raw.bracketSecret ?? '').trim(),
    apiBaseUrl,
    sandbox: raw.sandbox === true,
    channel: raw.channel === 'RE' ? 'RE' : 'IN',
  };
}

export function maskIcopaySecret(config: HqIcopayConfig): HqIcopayConfig {
  return {
    ...config,
    bracketSecret: config.bracketSecret ? '********' : '',
  };
}

export function resolveIcopayCompId(config: HqIcopayConfig): string {
  return config.compId || config.mid;
}

function apiBase(config: HqIcopayConfig): string {
  return (config.apiBaseUrl || DEFAULT_ICOPAY_API).replace(/\/$/, '');
}

function brokerHeaders(config: HqIcopayConfig): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Icopay-Merchant-Broker-Secret': config.bracketSecret.trim(),
  };
}

function icopayErrorMessage(raw: Record<string, unknown>, fallback: string): string {
  const messages = raw.messages as Record<string, string> | undefined;
  return messages?.KOR || messages?.ENG || String(raw.message ?? raw.error ?? fallback);
}

function isIcopaySandboxPayload(data: Record<string, unknown>): boolean {
  if (data.sandbox === true || String(data.sandbox).toLowerCase() === 'true') return true;
  return String(data.integrationMode || '').toUpperCase() === 'SANDBOX';
}

async function completeIcopaySandbox(
  config: HqIcopayConfig,
  input: IcopayPrepareInput,
  sessionToken: string,
): Promise<Record<string, unknown>> {
  const payload = {
    compId: resolveIcopayCompId(config),
    orderNo: input.orderNo,
    sessionToken,
  };
  const res = await fetch(`${apiBase(config)}/api/middleware/v1/merchant/checkout/complete`, {
    method: 'POST',
    headers: brokerHeaders(config),
    body: JSON.stringify(payload),
  });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || raw.success === false) {
    throw new AppError(
      502,
      icopayErrorMessage(raw, `ICOPAY sandbox complete failed (${res.status})`),
      String(raw.errorCode ?? 'ICOPAY_SANDBOX_COMPLETE_FAILED'),
    );
  }
  return (raw.data ?? raw) as Record<string, unknown>;
}

/** Unified Checkout prepare. Sandbox broker secret → complete (no EP). Live secret → payUrl. */
export async function prepareIcopayCheckout(
  config: HqIcopayConfig,
  input: IcopayPrepareInput,
): Promise<IcopayPrepareResult> {
  if (!config.enabled) {
    throw new AppError(503, 'Card payment is disabled', 'ICOPAY_DISABLED');
  }
  const compId = resolveIcopayCompId(config);
  if (!compId) {
    throw new AppError(503, 'ICOPAY compId is not configured', 'ICOPAY_COMP_MISSING');
  }
  if (!config.bracketSecret) {
    throw new AppError(503, 'ICOPAY broker secret is not configured', 'ICOPAY_SECRET_MISSING');
  }

  const name =
    input.buyer.firstName || input.buyer.lastName
      ? {
          firstName: input.buyer.firstName || 'Buyer',
          lastName: input.buyer.lastName || 'TINPASS',
        }
      : splitCardholderName(input.buyer.cardholderName || 'TINPASS Buyer');

  const payload = {
    compId,
    orderNo: input.orderNo,
    amount: Math.round(input.amount * 100) / 100,
    currency: input.currency.toUpperCase(),
    productName: input.productName.slice(0, 500),
    lang: mapAppLangToIcopay(input.lang),
    buyer: {
      email: input.buyer.email.trim(),
      phone: localPhoneDigits(input.buyer.phone),
      countryIso2: phoneCountryToIso2(input.buyer.phoneCountryCode),
      firstName: name.firstName,
      lastName: name.lastName,
    },
  };

  const res = await fetch(`${apiBase(config)}/api/middleware/v1/merchant/checkout/prepare`, {
    method: 'POST',
    headers: brokerHeaders(config),
    body: JSON.stringify(payload),
  });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || raw.success === false) {
    throw new AppError(
      502,
      icopayErrorMessage(raw, `ICOPAY prepare failed (${res.status})`),
      String(raw.errorCode ?? 'ICOPAY_PREPARE_FAILED'),
    );
  }
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const sessionToken = String(data.sessionToken ?? data.sessionId ?? '');

  if (isIcopaySandboxPayload(data)) {
    const completed = await completeIcopaySandbox(config, input, sessionToken);
    return {
      sessionId: String(completed.sessionToken ?? sessionToken),
      sessionToken: String(completed.sessionToken ?? sessionToken),
      payUrl: '',
      orderNo: String(completed.orderNo ?? input.orderNo),
      amount: Number(completed.amount ?? input.amount),
      currency: String(completed.currency ?? input.currency),
      integrationMode: 'SANDBOX',
      sandbox: true,
      raw: { prepare: raw, complete: completed },
    };
  }

  const payUrl = String(data.payUrl ?? data.checkoutUrl ?? '');
  if (!payUrl) {
    throw new AppError(502, 'ICOPAY prepare did not return payUrl', 'ICOPAY_PAYURL_MISSING');
  }
  return {
    sessionId: String(data.sessionId ?? sessionToken),
    sessionToken,
    payUrl,
    embedScriptUrl: data.embedScriptUrl ? String(data.embedScriptUrl) : undefined,
    expiresAt: data.expiresAt ? String(data.expiresAt) : undefined,
    orderNo: String(data.orderNo ?? input.orderNo),
    amount: Number(data.amount ?? input.amount),
    currency: String(data.currency ?? input.currency),
    integrationMode: data.integrationMode ? String(data.integrationMode) : undefined,
    sandbox: false,
    raw,
  };
}

/** Payment status poll — confirm after webhook or browser return. */
export async function getIcopayCheckoutStatus(
  config: HqIcopayConfig,
  orderNo: string,
  sessionId?: string | null,
): Promise<IcopayStatusResult> {
  const compId = resolveIcopayCompId(config);
  if (!compId || !config.bracketSecret) {
    throw new AppError(503, 'ICOPAY is not configured', 'ICOPAY_NOT_CONFIGURED');
  }

  const qs = new URLSearchParams({ compId, orderNo });
  if (sessionId) qs.set('sessionId', sessionId);
  const res = await fetch(
    `${apiBase(config)}/api/middleware/v1/merchant/checkout/status?${qs}`,
    { method: 'GET', headers: brokerHeaders(config) },
  );
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const paymentStatus = String(
    data.paymentStatus ?? data.status ?? data.resultCode ?? 'UNKNOWN',
  ).toUpperCase();
  return {
    found: data.found === true || ['APPROVED', 'PAID', 'SUCCESS', '0000', 'COMPLETED'].includes(paymentStatus),
    paymentStatus,
    orderNo: String(data.orderNo ?? orderNo),
    transactionId: data.transactionId
      ? String(data.transactionId)
      : data.tid
        ? String(data.tid)
        : data.paymentId
          ? String(data.paymentId)
          : data.sessionToken
            ? String(data.sessionToken)
            : undefined,
    amount: data.amount != null ? Number(data.amount) : undefined,
    currency: data.currency ? String(data.currency) : undefined,
    last4: data.last4 ? String(data.last4) : data.cardLast4 ? String(data.cardLast4) : undefined,
    raw,
  };
}

export function isIcopayPaidStatus(status: string): boolean {
  const s = status.toUpperCase();
  return ['APPROVED', 'PAID', 'SUCCESS', 'COMPLETED', '0000', 'OK', 'CAPTURED'].includes(s);
}

export function isIcopayFailedStatus(status: string): boolean {
  const s = status.toUpperCase();
  return ['DECLINED', 'FAILED', 'CANCELLED', 'CANCELED', 'EXPIRED', 'ERROR', 'NOT_FOUND'].includes(s);
}

export function parseIcopayWebhookBody(body: unknown): {
  orderNo: string;
  paymentStatus: string;
  transactionId?: string;
  last4?: string;
  amount?: number;
  currency?: string;
} {
  const root = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const data =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root.payload && typeof root.payload === 'object'
        ? (root.payload as Record<string, unknown>)
        : root;
  const orderNo = String(
    data.orderNo ?? data.order_no ?? data.merchantOrderNo ?? data.moid ?? data.oid ?? '',
  ).trim();
  const paymentStatus = String(
    data.paymentStatus ?? data.status ?? data.resultCode ?? data.result_code ?? data.payStatus ?? '',
  ).trim();
  return {
    orderNo,
    paymentStatus,
    transactionId: data.transactionId
      ? String(data.transactionId)
      : data.tid
        ? String(data.tid)
        : data.paymentId
          ? String(data.paymentId)
          : undefined,
    last4: data.last4 ? String(data.last4) : data.cardLast4 ? String(data.cardLast4) : undefined,
    amount: data.amount != null ? Number(data.amount) : undefined,
    currency: data.currency ? String(data.currency) : undefined,
  };
}

export function verifyIcopayWebhookSignature(
  body: string,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) return true; // allow when PG does not send signature
  const expectedHex = crypto.createHmac('sha256', secret.trim()).update(body).digest('hex');
  const expectedB64 = crypto.createHmac('sha256', secret.trim()).update(body).digest('base64');
  const sig = signature.trim();
  try {
    if (sig.length === expectedHex.length) {
      return crypto.timingSafeEqual(Buffer.from(expectedHex), Buffer.from(sig));
    }
    if (sig.length === expectedB64.length) {
      return crypto.timingSafeEqual(Buffer.from(expectedB64), Buffer.from(sig));
    }
  } catch {
    /* fall through */
  }
  return sig === expectedHex || sig === expectedB64;
}

/** @deprecated legacy key-in path — use prepareIcopayCheckout */
export type IcopayCardInput = IcopayBuyerInput & {
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardholderName: string;
};

export type IcopayChargeResult = {
  success: boolean;
  orderId: string;
  transactionId: string;
  last4: string;
  message?: string;
  raw?: unknown;
};

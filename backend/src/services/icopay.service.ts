import crypto from 'crypto';
import { AppError } from '../lib/errors';
import type { HqIcopayConfig, IcopayBrokerEnv } from '../constants/hq-policy';

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
  /** 결제 완료 후 브라우저 복귀 URL (ICOPAY 가맹 Result URL과 동일 계열) */
  resultUrl?: string;
};

/** TINPASS 카드 결제 복귀·성공 안내 페이지 */
export const ICOPAY_BROWSER_RESULT_URL = 'https://tinpass.com/dashboard/usdt/card-result';

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
  /** true when ICOPAY merchant sandbox secret was used (no live acquirer / no payUrl). */
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

const MASK = '********';

/** 저장된 시크릿 끝 3자리 (식별용). 짧으면 전부 표시하지 않고 빈 문자열 */
export function secretTail(secret: string | undefined | null, n = 3): string {
  const s = String(secret || '').trim();
  if (!s || s === MASK) return '';
  if (s.length <= n) return s;
  return s.slice(-n);
}

export function isMaskedIcopaySecret(value: string | undefined | null): boolean {
  const v = String(value ?? '').trim();
  if (!v) return true;
  if (v === MASK) return true;
  /** ********abc 형태 — 저장 시 기존 키 유지 */
  if (v.startsWith(MASK) && v.length <= MASK.length + 3) return true;
  return false;
}

export function normalizeIcopayBrokerEnv(value: unknown): IcopayBrokerEnv {
  if (value === 'SANDBOX' || value === 'LOCAL_MOCK' || value === 'LIVE') return value;
  return 'LIVE';
}

/** 저장된 시크릿·활성 시크릿으로 LIVE / SANDBOX / LOCAL_MOCK 판별 */
export function resolveIcopayBrokerEnv(config: Partial<HqIcopayConfig>): IcopayBrokerEnv {
  const active = String(config.bracketSecret ?? '').trim();
  if (active.toUpperCase() === 'SANDBOX') return 'LOCAL_MOCK';
  const live = String(config.brokerSecretLive ?? '').trim();
  const sandbox = String(config.brokerSecretSandbox ?? '').trim();
  // Exact slot match first — LIVE and SANDBOX secrets both start with ic_
  if (live && active && active === live) return 'LIVE';
  if (sandbox && active && active === sandbox) return 'SANDBOX';
  if (config.activeBrokerEnv === 'LIVE' || config.activeBrokerEnv === 'SANDBOX' || config.activeBrokerEnv === 'LOCAL_MOCK') {
    return config.activeBrokerEnv;
  }
  if (!active) return 'LIVE';
  // Unknown single secret: default LIVE (never guess SANDBOX from ic_ prefix)
  return 'LIVE';
}

export function activeSecretForBrokerEnv(
  env: IcopayBrokerEnv,
  live: string,
  sandbox: string,
  fallbackActive = '',
): string {
  const fb = fallbackActive.trim();
  if (env === 'LOCAL_MOCK') return 'SANDBOX';
  if (env === 'SANDBOX') {
    if (sandbox) return sandbox;
    if (fb && fb !== live) return fb;
    return '';
  }
  if (live) return live;
  if (fb && fb !== sandbox && fb.toUpperCase() !== 'SANDBOX') return fb;
  return '';
}

export function normalizeIcopayConfig(raw: Partial<HqIcopayConfig>): HqIcopayConfig {
  const apiBaseUrl = String(raw.apiBaseUrl ?? '').trim() || DEFAULT_ICOPAY_API;
  let bracketSecret = String(raw.bracketSecret ?? '').trim();
  let brokerSecretLive = String(raw.brokerSecretLive ?? '').trim();
  let brokerSecretSandbox = String(raw.brokerSecretSandbox ?? '').trim();

  // Legacy: only migrate a lone active secret into slots using activeBrokerEnv (never guess SANDBOX from ic_)
  if (bracketSecret && bracketSecret.toUpperCase() !== 'SANDBOX') {
    const hinted = normalizeIcopayBrokerEnv(raw.activeBrokerEnv);
    if (!brokerSecretLive && !brokerSecretSandbox) {
      if (hinted === 'SANDBOX') brokerSecretSandbox = bracketSecret;
      else brokerSecretLive = bracketSecret;
    } else if (!brokerSecretLive && hinted !== 'SANDBOX' && bracketSecret !== brokerSecretSandbox) {
      brokerSecretLive = bracketSecret;
    } else if (!brokerSecretSandbox && hinted === 'SANDBOX' && bracketSecret !== brokerSecretLive) {
      brokerSecretSandbox = bracketSecret;
    }
  }

  const activeBrokerEnv = raw.activeBrokerEnv
    ? normalizeIcopayBrokerEnv(raw.activeBrokerEnv)
    : resolveIcopayBrokerEnv({
        bracketSecret,
        brokerSecretLive,
        brokerSecretSandbox,
        activeBrokerEnv: raw.activeBrokerEnv,
      });

  bracketSecret = activeSecretForBrokerEnv(
    activeBrokerEnv,
    brokerSecretLive,
    brokerSecretSandbox,
    bracketSecret,
  );

  return {
    enabled: Boolean(raw.enabled),
    mid: String(raw.mid ?? '').trim(),
    compId: String(raw.compId ?? '').trim(),
    bracketSecret,
    brokerSecretLive,
    brokerSecretSandbox,
    activeBrokerEnv,
    apiBaseUrl,
    sandbox: raw.sandbox === true,
    channel: raw.channel === 'RE' ? 'RE' : 'IN',
  };
}

export function maskIcopaySecret(config: HqIcopayConfig): HqIcopayConfig {
  const liveTail = secretTail(config.brokerSecretLive);
  const sandboxTail = secretTail(config.brokerSecretSandbox);
  const activeTail = secretTail(config.bracketSecret);
  return {
    ...config,
    bracketSecret: config.bracketSecret ? MASK : '',
    brokerSecretLive: config.brokerSecretLive ? MASK : '',
    brokerSecretSandbox: config.brokerSecretSandbox ? MASK : '',
    /** HQ UI에서 끝자리로 LIVE/SANDBOX 키를 구분 */
    brokerSecretLiveTail: liveTail || undefined,
    brokerSecretSandboxTail: sandboxTail || undefined,
    bracketSecretTail: activeTail || undefined,
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

/**
 * TINPASS 로컬 목업만 — ICOPAY API를 호출하지 않음.
 * 공식 ICOPAY SANDBOX(envMode=SANDBOX + 샌드박스 Broker Secret)는 이 경로가 아님.
 * config.sandbox=true 이면 실 prepare/status를 호출하되 샌드박스 시크릿을 쓰는 모드.
 */
function isLocalIcopayMock(config: HqIcopayConfig): boolean {
  return (
    process.env.ICOPAY_LOCAL_MOCK === '1' ||
    config.activeBrokerEnv === 'LOCAL_MOCK' ||
    config.bracketSecret.trim().toUpperCase() === 'SANDBOX'
  );
}

function simulatePrepare(input: IcopayPrepareInput): IcopayPrepareResult {
  const sessionId = `LOCAL-MOCK-${Date.now()}`;
  const rawResult = String(input.resultUrl || ICOPAY_BROWSER_RESULT_URL).trim();
  const resultBase = (rawResult.split('?')[0] || ICOPAY_BROWSER_RESULT_URL).replace(/\/$/, '');
  let ticketId = '';
  try {
    const q = new URL(rawResult, 'https://tinpass.com').searchParams;
    ticketId = q.get('ticketId') || q.get('ticket_id') || '';
  } catch {
    /* ignore */
  }
  const payQ = new URLSearchParams({
    icopaySandbox: '1',
    orderNo: input.orderNo,
    paymentStatus: 'APPROVED',
  });
  if (ticketId) payQ.set('ticketId', ticketId);
  const payUrl = `${resultBase}?${payQ.toString()}`;
  return {
    sessionId,
    sessionToken: sessionId,
    payUrl,
    orderNo: input.orderNo,
    amount: input.amount,
    currency: input.currency,
    integrationMode: 'LOCAL_MOCK',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    raw: { localMock: true },
  };
}

/** Unified Checkout prepare — returns hosted payUrl (INLINE / REDIRECT). */
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

  if (isLocalIcopayMock(config)) {
    return simulatePrepare(input);
  }

  const name =
    input.buyer.firstName || input.buyer.lastName
      ? {
          firstName: input.buyer.firstName || 'Buyer',
          lastName: input.buyer.lastName || 'TINPASS',
        }
      : splitCardholderName(input.buyer.cardholderName || 'TINPASS Buyer');

  /** ICOPAY orderNo: digits only — strip letters/crypto terms (USDT/USD) and symbols */
  const orderNo = String(input.orderNo || '').replace(/\D/g, '');
  if (!orderNo) {
    throw new AppError(400, 'ICOPAY orderNo must be numeric', 'ICOPAY_ORDER_INVALID');
  }

  const resultUrl =
    String(input.resultUrl || '').trim() ||
    `${ICOPAY_BROWSER_RESULT_URL}?orderNo=${encodeURIComponent(orderNo)}`;

  const payload = {
    compId,
    orderNo,
    amount: Math.round(input.amount * 100) / 100,
    currency: input.currency.toUpperCase(),
    productName: input.productName.slice(0, 500),
    lang: mapAppLangToIcopay(input.lang),
    /** 가맹 Result URL — ICOPAY/PG가 지원하면 결제 후 이 주소로 복귀 */
    resultUrl,
    returnUrl: resultUrl,
    successUrl: resultUrl,
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
    const messages = raw.messages as Record<string, string> | undefined;
    const msg =
      messages?.KOR ||
      messages?.ENG ||
      String(raw.message ?? raw.error ?? `ICOPAY prepare failed (${res.status})`);
    throw new AppError(502, msg, String(raw.errorCode ?? 'ICOPAY_PREPARE_FAILED'));
  }
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const integrationMode = data.integrationMode ? String(data.integrationMode) : undefined;
  const sandbox =
    data.sandbox === true || String(integrationMode || '').toUpperCase() === 'SANDBOX';
  const payUrl = String(data.payUrl ?? data.checkoutUrl ?? '');
  if (!sandbox && !payUrl) {
    throw new AppError(502, 'ICOPAY prepare did not return payUrl', 'ICOPAY_PAYURL_MISSING');
  }
  return {
    sessionId: String(data.sessionId ?? ''),
    sessionToken: String(data.sessionToken ?? ''),
    payUrl,
    embedScriptUrl: data.embedScriptUrl ? String(data.embedScriptUrl) : undefined,
    expiresAt: data.expiresAt ? String(data.expiresAt) : undefined,
    orderNo: String(data.orderNo ?? orderNo),
    amount: Number(data.amount ?? input.amount),
    currency: String(data.currency ?? input.currency),
    integrationMode,
    sandbox,
    raw,
  };
}

/** ICOPAY merchant sandbox simulate-approve. Requires sandbox broker secret. */
export async function completeIcopaySandboxCheckout(
  config: HqIcopayConfig,
  input: { orderNo: string; sessionToken?: string },
): Promise<{ status: string; orderNo: string; sandbox: boolean; raw?: unknown }> {
  const compId = resolveIcopayCompId(config);
  if (!compId || !config.bracketSecret) {
    throw new AppError(503, 'ICOPAY is not configured', 'ICOPAY_NOT_CONFIGURED');
  }
  if (isLocalIcopayMock(config)) {
    return { status: 'APPROVED', orderNo: input.orderNo, sandbox: true, raw: { localMock: true } };
  }
  const orderNo = String(input.orderNo || '').replace(/\D/g, '') || String(input.orderNo || '');
  const body: Record<string, string> = { compId, orderNo };
  if (input.sessionToken) body.sessionToken = input.sessionToken;
  const res = await fetch(`${apiBase(config)}/api/middleware/v1/merchant/checkout/complete`, {
    method: 'POST',
    headers: brokerHeaders(config),
    body: JSON.stringify(body),
  });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || raw.success === false) {
    const msg = String(raw.message ?? `ICOPAY sandbox complete failed (${res.status})`);
    throw new AppError(502, msg, String(raw.errorCode ?? 'ICOPAY_SANDBOX_COMPLETE_FAILED'));
  }
  const data = (raw.data ?? raw) as Record<string, unknown>;
  return {
    status: String(data.paymentStatus ?? data.status ?? 'APPROVED').toUpperCase(),
    orderNo: String(data.orderNo ?? orderNo),
    sandbox: true,
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
  if (isLocalIcopayMock(config)) {
    return {
      found: true,
      paymentStatus: 'APPROVED',
      orderNo,
      transactionId: sessionId || `LOCAL-MOCK-${orderNo}`,
      raw: { localMock: true },
    };
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
          : undefined,
    amount: data.amount != null ? Number(data.amount) : undefined,
    currency: data.currency ? String(data.currency) : undefined,
    last4: data.last4 ? String(data.last4) : data.cardLast4 ? String(data.cardLast4) : undefined,
    raw,
  };
}

function flattenIcopayFields(body: unknown): Record<string, unknown> {
  const root = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const nested =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root.payload && typeof root.payload === 'object'
        ? (root.payload as Record<string, unknown>)
        : {};
  const out: Record<string, unknown> = {};
  for (const src of [root, nested]) {
    for (const [k, v] of Object.entries(src)) {
      out[k] = v;
      out[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = v;
    }
  }
  return out;
}

function firstString(map: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = map[key] ?? map[key.toLowerCase().replace(/[^a-z0-9]/g, '')];
    if (v == null || v === '') continue;
    return String(v).trim();
  }
  return '';
}

export function isIcopayPaidStatus(status: string): boolean {
  const s = String(status || '')
    .trim()
    .toUpperCase();
  if (!s) return false;
  if (['APPROVED', 'PAID', 'SUCCESS', 'SUCCEEDED', 'SUCCEED', 'COMPLETED', 'CAPTURED', 'OK', 'Y'].includes(s)) {
    return true;
  }
  if (['0000', '00', '0'].includes(s)) return true;
  return false;
}

export function isIcopayFailedStatus(status: string): boolean {
  const s = String(status || '')
    .trim()
    .toUpperCase();
  if (!s) return false;
  return [
    'DECLINED',
    'FAILED',
    'FAIL',
    'FAILURE',
    'CANCELLED',
    'CANCELED',
    'EXPIRED',
    'ERROR',
    'REJECTED',
    'VOID',
    'ABORTED',
    'NOT_FOUND',
  ].includes(s);
}

/** 확정 실패(거절·실패·취소). NOT_FOUND는 아직 미결제 가능하므로 제외 */
export function isIcopayTerminalFailedStatus(status: string): boolean {
  return isIcopayFailedStatus(status) && String(status).trim().toUpperCase() !== 'NOT_FOUND';
}

export function parseIcopayWebhookBody(body: unknown): {
  orderNo: string;
  paymentStatus: string;
  transactionId?: string;
  last4?: string;
  amount?: number;
  currency?: string;
} {
  const map = flattenIcopayFields(body);
  const orderRaw = firstString(map, [
    'orderNo',
    'order_no',
    'ordNo',
    'orderid',
    'orderId',
    'orderID',
    'OrderNo',
    'merchantOrderNo',
    'moid',
    'oid',
  ]);
  const orderNo = orderRaw.replace(/\D/g, '') || orderRaw;
  const paymentStatus = firstString(map, [
    'paymentStatus',
    'chillPaymentStatus',
    'payStatus',
    'status',
    'resultCode',
    'result_code',
    'returncode',
    'returnCode',
    'outcome',
  ]);
  const tx = firstString(map, ['transactionId', 'tid', 'paymentId', 'approvalNo']);
  const last4 = firstString(map, ['last4', 'cardLast4']);
  const amountRaw = map.amount ?? map.payamount ?? map.payAmount;
  const currency = firstString(map, ['currency', 'payCurrency', 'paycurrency']);
  return {
    orderNo,
    paymentStatus,
    transactionId: tx || undefined,
    last4: last4 || undefined,
    amount: amountRaw != null && Number.isFinite(Number(amountRaw)) ? Number(amountRaw) : undefined,
    currency: currency || undefined,
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

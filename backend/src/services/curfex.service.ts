import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import {
  DEFAULT_CURFEX_CONFIG,
  HQ_CONFIG_KEYS,
  type CurfexCollectionAccount,
  type HqCurfexConfig,
} from '../constants/hq-policy';

const DEFAULT_API = 'https://fcol-dashboard-uat1.curfex.com';

type TokenCache = { accessToken: string; expiresAt: number };

let tokenCache: TokenCache | null = null;

async function getConfigRow<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  if (!row?.value) return fallback;
  return { ...fallback, ...(row.value as object) } as T;
}

export function normalizeCurfexConfig(raw: Partial<HqCurfexConfig>): HqCurfexConfig {
  const base = DEFAULT_CURFEX_CONFIG();
  const allowed = new Set<string>(['JPY', 'KRW', 'THB', 'CNY']);
  const currencies = Array.isArray(raw.currencies) && raw.currencies.length
    ? (raw.currencies.filter((c) => allowed.has(String(c))) as NonNullable<HqCurfexConfig['currencies']>)
    : base.currencies;
  const defaultCollectionMode =
    raw.defaultCollectionMode === 'VIRTUAL' ? 'VIRTUAL' : 'FIXED';
  return {
    enabled: raw.enabled === true,
    clientId: String(raw.clientId ?? '').trim(),
    clientSecret: String(raw.clientSecret ?? '').trim(),
    apiBaseUrl: String(raw.apiBaseUrl ?? base.apiBaseUrl ?? DEFAULT_API).trim() || DEFAULT_API,
    walletName: String(raw.walletName ?? '').trim(),
    currencies: currencies?.length ? currencies : ['JPY'],
    sandbox: raw.sandbox !== false,
    webhookSecret: String(raw.webhookSecret ?? '').trim(),
    autoApproveOnDeposit: raw.autoApproveOnDeposit !== false,
    defaultCollectionMode,
  };
}

export function maskCurfexSecret(config: HqCurfexConfig): HqCurfexConfig {
  return {
    ...config,
    clientSecret: config.clientSecret ? '********' : '',
    webhookSecret: config.webhookSecret ? '********' : '',
  };
}

export async function getCurfexConfig(): Promise<HqCurfexConfig> {
  return normalizeCurfexConfig(
    await getConfigRow(HQ_CONFIG_KEYS.curfex, DEFAULT_CURFEX_CONFIG()),
  );
}

export async function getCurfexConfigMasked(): Promise<HqCurfexConfig> {
  return maskCurfexSecret(await getCurfexConfig());
}

export async function saveCurfexConfig(
  incoming: Partial<HqCurfexConfig>,
  existingSecret?: string,
  existingWebhookSecret?: string,
): Promise<HqCurfexConfig> {
  const current = await getCurfexConfig();
  const clientSecret =
    incoming.clientSecret && incoming.clientSecret !== '********'
      ? incoming.clientSecret
      : existingSecret ?? current.clientSecret;
  const webhookSecret =
    incoming.webhookSecret && incoming.webhookSecret !== '********'
      ? incoming.webhookSecret
      : existingWebhookSecret ?? current.webhookSecret;
  const normalized = normalizeCurfexConfig({
    ...current,
    ...incoming,
    clientSecret,
    webhookSecret,
  });
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.curfex },
    create: {
      key: HQ_CONFIG_KEYS.curfex,
      value: normalized as object,
      description: 'CURFEX/Fukugu Collection (일본 이체)',
    },
    update: { value: normalized as object },
  });
  tokenCache = null;
  return maskCurfexSecret(normalized);
}

/** HMAC 공유 비밀 생성 (CURFEX 포털에 동일 값 등록) */
export async function generateCurfexWebhookSecret(): Promise<HqCurfexConfig> {
  const { randomBytes } = await import('crypto');
  const current = await getCurfexConfig();
  return saveCurfexConfig(
    { ...current, webhookSecret: randomBytes(32).toString('hex') },
    current.clientSecret,
    undefined,
  );
}

export function isCurfexCurrencyEnabled(config: HqCurfexConfig, currency: string): boolean {
  if (!config.enabled) return false;
  const list = config.currencies?.length ? config.currencies : ['JPY'];
  return list.includes(currency as NonNullable<HqCurfexConfig['currencies']>[number]);
}

export type UsdtCollectionModeSetting = 'FOLLOW_HQ' | 'FIXED' | 'VIRTUAL';

/**
 * 고객 설정 + 본사 기본 → 실효 모드(FIXED|VIRTUAL).
 * VIRTUAL이어도 해당 통화 CURFEX 미적용이면 FIXED.
 */
export function resolveUsdtCollectionProvider(input: {
  customerMode?: UsdtCollectionModeSetting | null;
  config: HqCurfexConfig;
  currency: string;
}): 'FIXED' | 'CURFEX' {
  const preferred: 'FIXED' | 'VIRTUAL' =
    !input.customerMode || input.customerMode === 'FOLLOW_HQ'
      ? input.config.defaultCollectionMode === 'VIRTUAL'
        ? 'VIRTUAL'
        : 'FIXED'
      : input.customerMode === 'VIRTUAL'
        ? 'VIRTUAL'
        : 'FIXED';
  if (preferred === 'VIRTUAL' && isCurfexCurrencyEnabled(input.config, input.currency)) {
    return 'CURFEX';
  }
  return 'FIXED';
}

export type CurfexPaymentRequestInput = {
  sendAmount: number;
  currency: string;
  merchantReference: string;
  customerName: string;
  customerEmail: string;
  customerType?: string;
  description?: string;
  paymentDueDateTime?: string;
  requestExpiryDateTime?: string;
};

export type CurfexPaymentRequestResult = {
  refNo: string;
  statusCode: string;
  detail?: string;
  currency: string;
  amount: number;
  requestExpiryDateTime?: string;
  collectionAccount: CurfexCollectionAccount;
};

function baseUrl(config: HqCurfexConfig): string {
  return (config.apiBaseUrl || DEFAULT_API).replace(/\/$/, '');
}

async function curfexFetch<T>(
  config: HqCurfexConfig,
  path: string,
  body: unknown,
  accessToken?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${baseUrl(config)}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as {
    errors?: Array<{ message?: string; code?: string }>;
    payload?: T;
  };

  if (!res.ok) {
    const msg = json.errors?.[0]?.message || `CURFEX HTTP ${res.status}`;
    throw new AppError(502, msg, 'CURFEX_HTTP_ERROR');
  }
  if (json.errors?.length && !json.payload) {
    throw new AppError(502, json.errors[0]?.message || 'CURFEX error', 'CURFEX_API_ERROR');
  }
  if (json.payload == null) {
    throw new AppError(502, 'CURFEX empty payload', 'CURFEX_EMPTY');
  }
  return json.payload;
}

async function requestAccessToken(config: HqCurfexConfig): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }
  if (!config.clientId || !config.clientSecret) {
    throw new AppError(503, 'CURFEX credentials are not configured', 'CURFEX_NOT_CONFIGURED');
  }
  const payload = await curfexFetch<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }>(config, '/api/auth/request-token', {
    payload: {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    },
  });
  const expiresIn = Number(payload.expiresIn ?? 3600);
  tokenCache = {
    accessToken: payload.accessToken,
    expiresAt: Date.now() + Math.max(60, expiresIn - 30) * 1000,
  };
  return payload.accessToken;
}

function sandboxCollection(input: CurfexPaymentRequestInput): CurfexPaymentRequestResult {
  const suffix = String(Date.now()).slice(-7);
  return {
    refNo: `CURFEX-SBX-${suffix}`,
    statusCode: 'PENDING',
    detail: 'Sandbox collection account',
    currency: input.currency,
    amount: input.sendAmount,
    requestExpiryDateTime: input.requestExpiryDateTime,
    collectionAccount: {
      bankName: 'Sandbox Ginko',
      branchCode: '001',
      branchName: 'Tokyo',
      accountType: '普通',
      accountNo: `9${suffix}`,
      accountName: 'CURFEX SANDBOX',
    },
  };
}

function mapAccount(raw: Record<string, unknown> | undefined): CurfexCollectionAccount {
  if (!raw) {
    throw new AppError(502, 'CURFEX collection account missing', 'CURFEX_NO_ACCOUNT');
  }
  const accountNo = String(raw.accountNo ?? '').trim();
  const bankName = String(raw.bankName ?? '').trim();
  const accountName = String(raw.accountName ?? '').trim();
  if (!accountNo || !bankName) {
    throw new AppError(502, 'CURFEX collection account incomplete', 'CURFEX_BAD_ACCOUNT');
  }
  return {
    bankName,
    branchCode: raw.branchCode != null ? String(raw.branchCode) : undefined,
    branchName: raw.branchName != null ? String(raw.branchName) : undefined,
    accountType: raw.accountType != null ? String(raw.accountType) : undefined,
    accountNo,
    accountName: accountName || bankName,
  };
}

/** JPY 이체 매입 시 건별 수취 계좌 발급. enabled+해당 통화일 때만 호출. */
export async function createCurfexCollection(
  input: CurfexPaymentRequestInput,
): Promise<CurfexPaymentRequestResult> {
  const config = await getCurfexConfig();
  if (!isCurfexCurrencyEnabled(config, input.currency)) {
    throw new AppError(400, 'CURFEX is not enabled for this currency', 'CURFEX_DISABLED');
  }

  if (config.sandbox === true || config.clientSecret.toUpperCase() === 'SANDBOX') {
    return sandboxCollection(input);
  }

  const token = await requestAccessToken(config);
  const due =
    input.paymentDueDateTime ||
    new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const expiry =
    input.requestExpiryDateTime ||
    new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const payload = await curfexFetch<{
    refNo: string;
    statusCode: string;
    detail?: string;
    currency: string;
    amount: number;
    requestExpiryDateTime?: string;
    collectionAccount?: Record<string, unknown>;
  }>(
    config,
    '/api/payment/request',
    {
      payload: {
        description: input.description || `USDT purchase ${input.merchantReference}`,
        sendAmount: input.sendAmount,
        currency: input.currency,
        paymentDueDateTime: due,
        requestExpiryDateTime: expiry,
        walletName: config.walletName || undefined,
        merchantReference: input.merchantReference,
        customerType: input.customerType || 'INDIVIDUAL',
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPreferredLanguage: 'JP',
      },
    },
    token,
  );

  return {
    refNo: payload.refNo,
    statusCode: payload.statusCode,
    detail: payload.detail,
    currency: payload.currency || input.currency,
    amount: payload.amount ?? input.sendAmount,
    requestExpiryDateTime: payload.requestExpiryDateTime,
    collectionAccount: mapAccount(payload.collectionAccount),
  };
}

export function collectionAccountToDisplay(account: CurfexCollectionAccount): {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchName?: string;
  accountType?: string;
} {
  const branch = [account.branchCode, account.branchName].filter(Boolean).join(' ');
  return {
    bankName: branch ? `${account.bankName} (${branch})` : account.bankName,
    accountNumber: account.accountNo,
    accountHolder: account.accountName,
    branchName: account.branchName,
    accountType: account.accountType,
  };
}

export type CurfexPaymentStatus = {
  refNo: string;
  statusCode: string;
  detail?: string;
  currency?: string;
  amount?: number;
  amountCollected?: number;
  paymentBalance?: number;
  excessAmount?: number;
  senderAccountName?: string;
  merchantReference?: string;
  decisionList?: Array<{ decision?: string; paymentMade?: boolean }>;
};

/** 입금 감지에 해당하는 CURFEX statusCode */
export function isCurfexDepositStatus(statusCode: string | undefined | null): boolean {
  const s = String(statusCode ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (!s) return false;
  return [
    'PAID',
    'PAYMENT_RECEIVED',
    'PAYMENT_COMPLETED',
    'DEPOSITED',
    'FUNDS_RECEIVED',
    'AWAITING_DECISION',
    'AWAITING_MERCHANT_DECISION',
    'UNDERPAID',
    'OVERPAID',
    'PARTIAL',
    'PARTIAL_PAID',
    'APPROVED',
    'COMPLETED',
    'SUCCESS',
    'SETTLED',
  ].includes(s);
}

export async function getCurfexPaymentStatus(refNo: string): Promise<CurfexPaymentStatus> {
  const config = await getCurfexConfig();
  if (config.sandbox === true || config.clientSecret.toUpperCase() === 'SANDBOX') {
    throw new AppError(400, 'Sandbox mode has no live payment status', 'CURFEX_SANDBOX');
  }
  const token = await requestAccessToken(config);
  const payload = await curfexFetch<{
    refNo: string;
    statusCode: string;
    detail?: string;
    currency?: string;
    amount?: number;
    amountCollected?: number;
    paymentBalance?: number;
    excessAmount?: number;
    senderAccountName?: string;
    merchantReference?: string;
    decisionList?: Array<{ decision?: string; paymentMade?: boolean }>;
  }>(config, '/api/payment/status', { payload: { refNo } }, token);

  return {
    refNo: payload.refNo || refNo,
    statusCode: payload.statusCode,
    detail: payload.detail,
    currency: payload.currency,
    amount: payload.amount,
    amountCollected: payload.amountCollected,
    paymentBalance: payload.paymentBalance,
    excessAmount: payload.excessAmount,
    senderAccountName: payload.senderAccountName,
    merchantReference: payload.merchantReference,
    decisionList: payload.decisionList,
  };
}

export async function getCurfexPaymentDetail(refNo: string): Promise<CurfexPaymentStatus> {
  const config = await getCurfexConfig();
  if (config.sandbox === true || config.clientSecret.toUpperCase() === 'SANDBOX') {
    throw new AppError(400, 'Sandbox mode has no live payment detail', 'CURFEX_SANDBOX');
  }
  const token = await requestAccessToken(config);
  const payload = await curfexFetch<{
    refNo: string;
    statusCode: string;
    detail?: string;
    currency?: string;
    amount?: number;
    amountCollected?: number;
    paymentBalance?: number;
    excessAmount?: number;
    senderAccountName?: string;
    merchantReference?: string;
    decisionList?: Array<{ decision?: string; paymentMade?: boolean }>;
  }>(config, '/api/payment/get', { payload: { refNo } }, token);

  return {
    refNo: payload.refNo || refNo,
    statusCode: payload.statusCode,
    detail: payload.detail,
    currency: payload.currency,
    amount: payload.amount,
    amountCollected: payload.amountCollected,
    paymentBalance: payload.paymentBalance,
    excessAmount: payload.excessAmount,
    senderAccountName: payload.senderAccountName,
    merchantReference: payload.merchantReference,
    decisionList: payload.decisionList,
  };
}

/** 입금 확인 후 Collection 승인 (지갑 반영) */
export async function approveCurfexPayment(input: {
  refNo: string;
  merchantReference: string;
  description?: string;
}): Promise<{ statusCode: string; detail?: string }> {
  const config = await getCurfexConfig();
  if (config.sandbox === true || config.clientSecret.toUpperCase() === 'SANDBOX') {
    return { statusCode: 'APPROVED', detail: 'Sandbox auto-approve' };
  }
  const token = await requestAccessToken(config);
  const payload = await curfexFetch<{
    refNo: string;
    statusCode: string;
    detail?: string;
  }>(
    config,
    '/api/payment/decision',
    {
      payload: {
        refNo: input.refNo,
        decision: 'APPROVE',
        remark: input.description || 'TINPASS auto-approve on deposit',
        approve: {
          walletName: config.walletName || undefined,
          merchantReference: input.merchantReference,
          description: input.description || `USDT ${input.merchantReference}`,
        },
      },
    },
    token,
  );
  return { statusCode: payload.statusCode, detail: payload.detail };
}

export function verifyCurfexWebhookHmac(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!secret) return false;
  if (!signatureHeader?.trim()) return false;
  const body = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
  const expected = createHmac('sha512', secret).update(body).digest('hex');
  const received = signatureHeader.trim().toLowerCase().replace(/^sha512=/i, '');
  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(received, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return expected.toLowerCase() === received;
  }
}

export function publicCurfexWebhookUrl(): string {
  const base = (
    process.env.PUBLIC_API_URL ||
    process.env.API_PUBLIC_URL ||
    'https://api.tinpass.com'
  ).replace(/\/$/, '');
  return `${base}/api/webhooks/curfex`;
}

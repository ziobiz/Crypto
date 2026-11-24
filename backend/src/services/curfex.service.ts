import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import {
  DEFAULT_CURFEX_CONFIG,
  DEFAULT_CURFEX_LIVE_PROFILE,
  DEFAULT_CURFEX_SANDBOX_PROFILE,
  HQ_CONFIG_KEYS,
  normalizeDirectRemitCurrencies,
  normalizeHqCollectionMode,
  type CurfexCollectionAccount,
  type CurfexEnvCredentials,
  type CurfexEnvironment,
  type HqCurfexConfig,
  type HqDefaultCollectionMode,
} from '../constants/hq-policy';

const DEFAULT_API = 'https://fcol-dashboard-uat1.curfex.com';
const DEFAULT_LIVE_API = 'https://api-collection.fukugu.co.jp';
/** CURFEX↔Dealmai 계약: 웹훅 공개 도메인은 항상 Dealmai (TINPASS 도메인 사용 금지) */
const DEALMAI_CURFEX_WEBHOOK_BASE = 'https://hooks.dealmai.com';

function normalizeCurfexWebhookBase(raw?: string | null): string {
  const base = String(raw || '').trim().replace(/\/$/, '');
  if (!base) return DEALMAI_CURFEX_WEBHOOK_BASE;
  if (/tinpass\.com|localhost|127\.0\.0\.1/i.test(base)) {
    return DEALMAI_CURFEX_WEBHOOK_BASE;
  }
  return base;
}

type TokenCache = { accessToken: string; expiresAt: number; key: string };

const tokenCacheByKey = new Map<string, TokenCache>();

async function getConfigRow<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  if (!row?.value) return fallback;
  return { ...fallback, ...(row.value as object) } as T;
}

/** host 또는 …/api 모두 허용 → 경로 `/api/...` 와 합칠 때 중복 제거 */
export function normalizeCurfexApiBase(raw?: string | null, fallback = DEFAULT_API): string {
  let base = String(raw || '').trim().replace(/\/+$/, '');
  if (!base) base = fallback;
  if (/\/api$/i.test(base)) base = base.replace(/\/api$/i, '');
  return base.replace(/\/+$/, '') || fallback;
}

function normalizeEnvCredentials(
  raw: Partial<CurfexEnvCredentials> | undefined,
  fallback: CurfexEnvCredentials,
  opts?: { allowLocalMock?: boolean },
): CurfexEnvCredentials {
  return {
    clientId: String(raw?.clientId ?? fallback.clientId ?? '').trim(),
    clientSecret: String(raw?.clientSecret ?? fallback.clientSecret ?? '').trim(),
    apiBaseUrl: normalizeCurfexApiBase(
      raw?.apiBaseUrl ?? fallback.apiBaseUrl,
      fallback.apiBaseUrl || DEFAULT_API,
    ),
    walletName: String(raw?.walletName ?? fallback.walletName ?? '').trim(),
    localMock: opts?.allowLocalMock === true ? raw?.localMock === true : false,
  };
}

function pickActiveProfile(
  active: CurfexEnvironment,
  sandboxProfile: CurfexEnvCredentials,
  liveProfile: CurfexEnvCredentials,
): CurfexEnvCredentials {
  return active === 'live' ? liveProfile : sandboxProfile;
}

export function normalizeCurfexConfig(raw: Partial<HqCurfexConfig>): HqCurfexConfig {
  const base = DEFAULT_CURFEX_CONFIG();
  const allowed = new Set<string>(['JPY', 'KRW', 'THB', 'CNY']);
  const currencies = Array.isArray(raw.currencies) && raw.currencies.length
    ? (raw.currencies.filter((c) => allowed.has(String(c))) as NonNullable<HqCurfexConfig['currencies']>)
    : base.currencies;
  const defaultCollectionModeCorporate = normalizeHqCollectionMode(
    raw.defaultCollectionModeCorporate ?? raw.defaultCollectionMode,
    'FIXED',
  );
  const defaultCollectionModeIndividual = normalizeHqCollectionMode(
    raw.defaultCollectionModeIndividual,
    'DIRECT',
  );
  /** 하위호환: legacy 단일 필드는 기업 기본과 동기화 */
  const defaultCollectionMode = defaultCollectionModeCorporate;

  const hasSandboxProfile = Boolean(raw.sandboxProfile && typeof raw.sandboxProfile === 'object');
  const hasLiveProfile = Boolean(raw.liveProfile && typeof raw.liveProfile === 'object');

  /** 레거시 flat → sandbox 프로필로 이전 (프로필 없을 때) */
  const legacyAsSandbox: CurfexEnvCredentials = {
    clientId: String(raw.clientId ?? '').trim(),
    clientSecret: String(raw.clientSecret ?? '').trim(),
    apiBaseUrl: normalizeCurfexApiBase(raw.apiBaseUrl, DEFAULT_API),
    walletName: String(raw.walletName ?? '').trim(),
    localMock: raw.sandbox === true,
  };

  const sandboxProfile = normalizeEnvCredentials(
    hasSandboxProfile ? raw.sandboxProfile : legacyAsSandbox,
    DEFAULT_CURFEX_SANDBOX_PROFILE(),
    { allowLocalMock: true },
  );
  const liveProfile = normalizeEnvCredentials(
    hasLiveProfile ? raw.liveProfile : undefined,
    DEFAULT_CURFEX_LIVE_PROFILE(),
    { allowLocalMock: false },
  );

  const activeEnvironment: CurfexEnvironment =
    raw.activeEnvironment === 'live' || raw.activeEnvironment === 'sandbox'
      ? raw.activeEnvironment
      : /fukugu\.co\.jp|api-collection/i.test(String(raw.apiBaseUrl || ''))
        ? 'live'
        : 'sandbox';

  const active = pickActiveProfile(activeEnvironment, sandboxProfile, liveProfile);
  const sandboxMirror = activeEnvironment === 'sandbox' && active.localMock === true;

  return {
    enabled: raw.enabled === true,
    clientId: active.clientId,
    clientSecret: active.clientSecret,
    apiBaseUrl: active.apiBaseUrl,
    walletName: active.walletName,
    currencies: currencies?.length ? currencies : ['JPY'],
    sandbox: sandboxMirror,
    activeEnvironment,
    sandboxProfile,
    liveProfile,
    webhookSecret: String(raw.webhookSecret ?? '').trim(),
    webhookPublicBaseUrl: normalizeCurfexWebhookBase(
      raw.webhookPublicBaseUrl ?? base.webhookPublicBaseUrl ?? DEALMAI_CURFEX_WEBHOOK_BASE,
    ),
    autoApproveOnDeposit: raw.autoApproveOnDeposit !== false,
    defaultCollectionMode,
    defaultCollectionModeCorporate,
    defaultCollectionModeIndividual,
    directRemitCurrencies: normalizeDirectRemitCurrencies(raw.directRemitCurrencies),
  };
}

export function hqDefaultCollectionModeForCustomer(
  config: HqCurfexConfig,
  customerType?: string | null,
): HqDefaultCollectionMode {
  if (customerType === 'INDIVIDUAL') {
    return normalizeHqCollectionMode(config.defaultCollectionModeIndividual, 'DIRECT');
  }
  return normalizeHqCollectionMode(
    config.defaultCollectionModeCorporate ?? config.defaultCollectionMode,
    'FIXED',
  );
}

function maskCredSecret(profile?: CurfexEnvCredentials): CurfexEnvCredentials | undefined {
  if (!profile) return profile;
  return {
    ...profile,
    clientSecret: profile.clientSecret ? '********' : '',
  };
}

export function maskCurfexSecret(config: HqCurfexConfig): HqCurfexConfig {
  return {
    ...config,
    clientSecret: config.clientSecret ? '********' : '',
    webhookSecret: config.webhookSecret ? '********' : '',
    sandboxProfile: maskCredSecret(config.sandboxProfile),
    liveProfile: maskCredSecret(config.liveProfile),
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

function resolveSecret(incoming: string | undefined, existing: string | undefined): string {
  if (incoming && incoming !== '********') return incoming;
  return existing || '';
}

export async function saveCurfexConfig(
  incoming: Partial<HqCurfexConfig>,
  existingSecret?: string,
  existingWebhookSecret?: string,
): Promise<HqCurfexConfig> {
  const current = await getCurfexConfig();

  const sandboxProfile: CurfexEnvCredentials = {
    ...(current.sandboxProfile || DEFAULT_CURFEX_SANDBOX_PROFILE()),
    ...(incoming.sandboxProfile || {}),
    clientSecret: resolveSecret(
      incoming.sandboxProfile?.clientSecret ??
        (incoming.activeEnvironment !== 'live' ? incoming.clientSecret : undefined),
      current.sandboxProfile?.clientSecret ||
        (current.activeEnvironment !== 'live' ? current.clientSecret : '') ||
        existingSecret,
    ),
  };
  if (incoming.sandboxProfile == null && incoming.activeEnvironment !== 'live') {
    if (incoming.clientId != null) sandboxProfile.clientId = String(incoming.clientId).trim();
    if (incoming.apiBaseUrl != null) {
      sandboxProfile.apiBaseUrl = normalizeCurfexApiBase(incoming.apiBaseUrl, DEFAULT_API);
    }
    if (incoming.walletName != null) sandboxProfile.walletName = String(incoming.walletName).trim();
    if (incoming.sandbox != null) sandboxProfile.localMock = incoming.sandbox === true;
  } else if (incoming.sandboxProfile) {
    sandboxProfile.localMock = incoming.sandboxProfile.localMock === true;
  }

  const liveProfile: CurfexEnvCredentials = {
    ...(current.liveProfile || DEFAULT_CURFEX_LIVE_PROFILE()),
    ...(incoming.liveProfile || {}),
    clientSecret: resolveSecret(
      incoming.liveProfile?.clientSecret ??
        (incoming.activeEnvironment === 'live' ? incoming.clientSecret : undefined),
      current.liveProfile?.clientSecret ||
        (current.activeEnvironment === 'live' ? current.clientSecret : ''),
    ),
    localMock: false,
  };
  if (incoming.liveProfile == null && incoming.activeEnvironment === 'live') {
    if (incoming.clientId != null) liveProfile.clientId = String(incoming.clientId).trim();
    if (incoming.apiBaseUrl != null) {
      liveProfile.apiBaseUrl = normalizeCurfexApiBase(incoming.apiBaseUrl, DEFAULT_LIVE_API);
    }
    if (incoming.walletName != null) liveProfile.walletName = String(incoming.walletName).trim();
  }

  const webhookSecret = resolveSecret(
    incoming.webhookSecret,
    existingWebhookSecret ?? current.webhookSecret,
  );

  const normalized = normalizeCurfexConfig({
    ...current,
    ...incoming,
    sandboxProfile,
    liveProfile,
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
  tokenCacheByKey.clear();
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

/** 로컬 목 계좌만 발급 — 실 UAT/PROD API 미호출 */
export function isCurfexLocalMock(config: HqCurfexConfig): boolean {
  if (config.activeEnvironment === 'live') return false;
  if (config.sandboxProfile?.localMock === true) return true;
  return (
    config.sandbox === true || String(config.clientSecret || '').toUpperCase() === 'SANDBOX'
  );
}

/** UAT·테스트·로컬 목 — 실거래(LIVE)로 취급하지 않음 */
export function isCurfexNonLiveEnvironment(config: HqCurfexConfig): boolean {
  if (config.activeEnvironment === 'live') return false;
  if (isCurfexLocalMock(config)) return true;
  const base = String(config.apiBaseUrl || '').toLowerCase();
  return /uat|sandbox|\.test\.|\/test\b|-test\b|curfex\.com/.test(base);
}

export type UsdtCollectionModeSetting = 'FOLLOW_HQ' | 'FIXED' | 'VIRTUAL' | 'DIRECT';

/**
 * 고객 설정 + 본사 기본 → 실효 모드(FIXED|VIRTUAL|DIRECT).
 * VIRTUAL이어도 해당 통화 CURFEX 미적용이면 FIXED.
 * DIRECT(송금계좌)면 송금거래 on 통화의 플랫폼 수취계좌. CURFEX 미사용.
 * FOLLOW_HQ → 기업/개인 각각 HQ 기본값(개인 초기값 DIRECT).
 */
export function resolveUsdtCollectionProvider(input: {
  customerMode?: UsdtCollectionModeSetting | null;
  config: HqCurfexConfig;
  currency: string;
  customerType?: string | null;
}): 'FIXED' | 'CURFEX' | 'DIRECT' {
  let preferred: 'FIXED' | 'VIRTUAL' | 'DIRECT';
  if (!input.customerMode || input.customerMode === 'FOLLOW_HQ') {
    preferred = hqDefaultCollectionModeForCustomer(input.config, input.customerType);
  } else if (input.customerMode === 'VIRTUAL') {
    preferred = 'VIRTUAL';
  } else if (input.customerMode === 'DIRECT') {
    preferred = 'DIRECT';
  } else {
    preferred = 'FIXED';
  }

  if (preferred === 'DIRECT') {
    return 'DIRECT';
  }
  if (preferred === 'VIRTUAL' && isCurfexCurrencyEnabled(input.config, input.currency)) {
    return 'CURFEX';
  }
  return 'FIXED';
}

export function getDirectRemitCurrencies(config: HqCurfexConfig): string[] {
  return normalizeDirectRemitCurrencies(config.directRemitCurrencies);
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
  return normalizeCurfexApiBase(
    config.apiBaseUrl,
    config.activeEnvironment === 'live' ? DEFAULT_LIVE_API : DEFAULT_API,
  );
}

function tokenCacheKey(config: HqCurfexConfig): string {
  return `${baseUrl(config)}|${config.clientId}`;
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
  const key = tokenCacheKey(config);
  const cached = tokenCacheByKey.get(key);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.accessToken;
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
  tokenCacheByKey.set(key, {
    key,
    accessToken: payload.accessToken,
    expiresAt: Date.now() + Math.max(60, expiresIn - 30) * 1000,
  });
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

  if (isCurfexLocalMock(config)) {
    return sandboxCollection(input);
  }

  const token = await requestAccessToken(config);
  /** CURFEX UAT/API: customerType is C|I (not CORPORATE|INDIVIDUAL), language is ja|en */
  const customerTypeRaw = String(input.customerType || 'INDIVIDUAL').toUpperCase();
  const customerType =
    customerTypeRaw === 'C' ||
    customerTypeRaw === 'CORPORATE' ||
    customerTypeRaw === 'COMPANY' ||
    customerTypeRaw === 'BUSINESS'
      ? 'C'
      : 'I';
  const dueMs = input.paymentDueDateTime
    ? Date.parse(input.paymentDueDateTime)
    : Date.now() + 2 * 60 * 60 * 1000;
  let dueDate = Number.isFinite(dueMs) ? new Date(dueMs) : new Date(Date.now() + 2 * 60 * 60 * 1000);
  /**
   * Live Fukugu rejects near-term due (invalid.value paymentDueDateTime).
   * Keep at least ~24h ahead and send UTC ISO without milliseconds.
   */
  const minDueMs = Date.now() + 24 * 60 * 60 * 1000;
  if (dueDate.getTime() < minDueMs) {
    dueDate = new Date(minDueMs);
  }
  const expiryMs = input.requestExpiryDateTime
    ? Date.parse(input.requestExpiryDateTime)
    : NaN;
  let expiryDate = Number.isFinite(expiryMs) ? new Date(expiryMs) : new Date(dueDate.getTime());
  /** expiry must be after due — same timestamp is rejected by CURFEX */
  if (expiryDate.getTime() <= dueDate.getTime()) {
    expiryDate = new Date(dueDate.getTime() + 24 * 60 * 60 * 1000);
  }
  const due = dueDate.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const expiry = expiryDate.toISOString().replace(/\.\d{3}Z$/, 'Z');
  /** Live API: merchantReference max length 40 */
  const merchantReference = String(input.merchantReference || '').trim().slice(0, 40);

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
        description: input.description || `USDT purchase ${merchantReference}`,
        sendAmount: input.sendAmount,
        currency: input.currency,
        paymentDueDateTime: due,
        requestExpiryDateTime: expiry,
        walletName: config.walletName || undefined,
        merchantReference,
        customerType,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPreferredLanguage: 'ja',
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
  if (isCurfexLocalMock(config)) {
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
  if (isCurfexLocalMock(config)) {
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
  if (isCurfexLocalMock(config)) {
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

/** 환경변수 기준(동기). 가능하면 resolvePublicCurfexWebhookUrl 사용 */
export function publicCurfexWebhookUrl(baseOverride?: string | null): string {
  const base = normalizeCurfexWebhookBase(baseOverride);
  return `${base}/api/webhooks/curfex`;
}

/** HQ 설정 webhookPublicBaseUrl 반영 — CURFEX에는 Dealmai hooks만 노출 */
export async function resolvePublicCurfexWebhookUrl(): Promise<string> {
  const config = await getCurfexConfig();
  return publicCurfexWebhookUrl(config.webhookPublicBaseUrl || null);
}

/** HQ 연결 점검: 토큰 발급 + (있으면) wallet/get */
export async function testCurfexConnection(): Promise<{
  ok: boolean;
  mode: 'LOCAL_MOCK' | 'UAT_OR_TEST' | 'LIVE_API';
  apiBaseUrl: string;
  walletName: string;
  tokenOk: boolean;
  walletOk: boolean | null;
  walletStatus?: string;
  walletCurrency?: string;
  message: string;
}> {
  const config = await getCurfexConfig();
  const mode = isCurfexLocalMock(config)
    ? 'LOCAL_MOCK'
    : isCurfexNonLiveEnvironment(config)
      ? 'UAT_OR_TEST'
      : 'LIVE_API';

  if (isCurfexLocalMock(config)) {
    return {
      ok: true,
      mode,
      apiBaseUrl: baseUrl(config),
      walletName: config.walletName || '',
      tokenOk: false,
      walletOk: null,
      message: 'Local mock mode — API is not called',
    };
  }
  if (!config.clientId || !config.clientSecret) {
    throw new AppError(400, 'CURFEX credentials are not configured', 'CURFEX_NOT_CONFIGURED');
  }

  await requestAccessToken(config);
  let walletOk: boolean | null = null;
  let walletStatus: string | undefined;
  let walletCurrency: string | undefined;
  if (config.walletName) {
    const token = await requestAccessToken(config);
    const wallet = await curfexFetch<{
      walletName?: string;
      statusCode?: string;
      currency?: string;
    }>(config, '/api/wallet/get', { payload: { walletName: config.walletName } }, token);
    walletOk = String(wallet.statusCode || '').toUpperCase() === 'ACTIVE';
    walletStatus = wallet.statusCode;
    walletCurrency = wallet.currency;
  }

  return {
    ok: walletOk !== false,
    mode,
    apiBaseUrl: baseUrl(config),
    walletName: config.walletName || '',
    tokenOk: true,
    walletOk,
    walletStatus,
    walletCurrency,
    message:
      walletOk === false
        ? `Wallet not ACTIVE (${walletStatus || 'unknown'})`
        : walletOk
          ? `Token OK · wallet ${config.walletName} ACTIVE (${walletCurrency || ''})`
          : 'Token OK',
  };
}

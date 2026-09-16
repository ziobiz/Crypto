import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { AdminChangeAction, Prisma, TicketType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import {
  HQ_CONFIG_KEYS,
  HQ_ACCESS_ACTORS,
  HQ_ORG_LEVELS,
  HQ_PAGE_CATALOG,
  HQ_PERMISSION_LEVELS,
  HQ_VIEW_COLUMN_CATALOG,
  type HqAccessActor,
  type HqAccessMatrix,
  type HqCommissionRiskConfig,
  type HqOrgColumnConfig,
  type HqPermissionLevel,
  type HqPlatformConfig,
  type DepositReceivingAccount,
  type HqEmailOtpConfig,
  type HqCardPaymentConfig,
  type HqIcopayConfig,
  type HqCurfexConfig,
  type HqExchangeRateSourcePolicy,
  type IdleTimeoutMinutes,
  IDLE_TIMEOUT_MINUTES_OPTIONS,
  type SymbolFeeTierPolicy,
  type HqOrgSharePolicy,
  defaultOrgSharePolicy,
  normalizeOrgSharePolicy,
  persistableCustomerFeeShare,
  assertEscrowShareTotals,
  defaultGasNetworkPolicy,
  normalizeGasNetworkPolicy,
  type HqGasNetworkPolicy,
  type HqWorkflowDisplayConfig,
  defaultWorkflowDisplay,
  normalizeWorkflowDisplay,
  DEFAULT_JPY_DEPOSIT_RECEIVING_ACCOUNT,
} from '../constants/hq-policy';
import {
  defaultEmailOtpConfig,
  getEmailOtpConfig,
  saveEmailOtpConfig,
} from '../services/otp.service';
import { sendTestEmail } from '../services/email.service';
import {
  getCardPaymentConfig,
  getIcopayConfig,
  getIcopayConfigMasked,
  saveCardPaymentConfig,
  saveIcopayConfig,
} from './card-payment-policy.service';
import {
  getCurfexConfig,
  getCurfexConfigMasked,
  saveCurfexConfig,
} from './curfex.service';
import {
  defaultTransactionFees,
  getSimulatorCommissionRiskConfig,
  getSimulatorSymbolFeeTiers,
  getSymbolFeeTiers,
  normalizeCommissionRisk,
  normalizeSymbolFeeTiers,
} from '../services/transaction-fee.service';
import {
  clearCurrencyAmountDisplayPolicyCache,
  getCurrencyAmountDisplayPolicy,
} from './usdt-fee-breakdown.service';
import {
  normalizeCurrencyAmountDisplayPolicy,
  type HqCurrencyAmountDisplayPolicy,
} from '../lib/currency-amount';
import {
  getExchangeRatePolicyPreview,
  getExchangeRateSourcePolicy,
  saveExchangeRateSourcePolicy,
} from '../services/exchange-rate-policy.service';
import { getAllLocalMarketPremiums } from '../services/local-market-premium.service';
import { getKimchiPremiumAnalysis } from '../services/kimchi-premium.service';
import { DEFAULT_LOGIN_NOTICE_I18N } from '../constants/login-notice-i18n';
import { defaultTransactionLimitsPolicy } from '../lib/transaction-limit-policy';
import {
  logAdminChange,
  type AuditContext,
} from './admin-change-log.service';

const BRANDING_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads', 'branding');

function maskEmailConfig(config: HqEmailOtpConfig): HqEmailOtpConfig {
  return { ...config, smtpPassword: config.smtpPassword ? '********' : '' };
}

async function putConfigWithAudit<T>(
  audit: AuditContext,
  params: {
    key: string;
    value: T;
    description?: string;
    entityType: string;
    summary: string;
  },
): Promise<T> {
  const beforeRow = await prisma.systemConfig.findUnique({ where: { key: params.key } });
  const before = beforeRow?.value ?? null;
  await putConfig(params.key, params.value, params.description);
  await logAdminChange({
    actor: audit.actor,
    action: beforeRow ? AdminChangeAction.UPDATE : AdminChangeAction.CREATE,
    entityType: params.entityType,
    entityId: params.key,
    entityLabel: params.description ?? params.key,
    summary: `${params.summary} (관리자: ${audit.actor.email})`,
    before,
    after: params.value,
    ipAddress: audit.ipAddress,
    userAgent: audit.userAgent,
  });
  return params.value;
}

async function getConfig<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  if (!row) return fallback;
  return row.value as T;
}

async function putConfig<T>(key: string, value: T, description?: string): Promise<T> {
  await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value: value as object, description },
    update: { value: value as object, description },
  });
  return value;
}

const CUSTOMER_DEFAULT_VIEW_PATHS = new Set([
  '/dashboard',
  '/dashboard/simulator',
  '/dashboard/usdt',
  '/dashboard/escrow',
  '/dashboard/wallets',
  '/dashboard/kyc',
  '/dashboard/merchant-users',
  '/dashboard/operation-history',
]);

function defaultAccessMatrix(): HqAccessMatrix {
  const matrix = {} as HqAccessMatrix;
  for (const actor of HQ_ACCESS_ACTORS) {
    matrix[actor] = {};
    for (const page of HQ_PAGE_CATALOG) {
      if (actor === 'CUSTOMER') {
        matrix[actor][page.path] = CUSTOMER_DEFAULT_VIEW_PATHS.has(page.path) ? 'VIEW' : 'NONE';
        continue;
      }
      if (page.group === '본사정책') {
        matrix[actor][page.path] = actor === 'HEAD_OFFICE' ? 'MODIFY' : 'NONE';
      } else if (actor === 'HEAD_OFFICE') {
        matrix[actor][page.path] = 'DELETE';
      } else if (actor === 'SALES_OFFICE' && page.path === '/dashboard/wallets') {
        matrix[actor][page.path] = 'NONE';
      } else {
        matrix[actor][page.path] = 'VIEW';
      }
    }
  }
  return matrix;
}

function defaultOrgColumns(): HqOrgColumnConfig {
  const cfg = {} as HqOrgColumnConfig;
  for (const [pagePath, columns] of Object.entries(HQ_VIEW_COLUMN_CATALOG)) {
    cfg[pagePath] = {} as HqOrgColumnConfig[string];
    const keys = columns.map((c) => c.key);
    for (const org of HQ_ORG_LEVELS) {
      cfg[pagePath][org] = { allowedKeys: [...keys], order: [...keys] };
    }
  }
  return cfg;
}

function defaultCommissionRisk(): HqCommissionRiskConfig {
  const fees = defaultTransactionFees();
  return {
    defaultFxFeePercent: fees.fxFeePercent,
    defaultGasFeeUsdt: fees.gasFeeUsdt,
    defaultTransferFeeUsdt: fees.transferFeeUsdt,
    defaultOtherFeeUsdt: fees.otherFeeUsdt,
    maxTicketAmountKrw: 100_000_000,
    riskEnabled: true,
    maxDailyTicketsPerCustomer: 10,
    transactionLimits: defaultTransactionLimitsPolicy(100_000_000),
    notes: '',
  };
}

function mergeLoginNoticeI18n(
  custom?: Partial<Record<keyof typeof DEFAULT_LOGIN_NOTICE_I18N, { title: string; body: string }>>,
) {
  const merged = { ...DEFAULT_LOGIN_NOTICE_I18N };
  if (!custom) return merged;
  for (const loc of Object.keys(DEFAULT_LOGIN_NOTICE_I18N) as Array<keyof typeof DEFAULT_LOGIN_NOTICE_I18N>) {
    const entry = custom[loc];
    if (entry?.title?.trim()) {
      merged[loc] = { title: entry.title, body: entry.body ?? '' };
    }
  }
  return merged;
}

function normalizeIdleTimeoutMinutes(value?: number): IdleTimeoutMinutes {
  const n = value ?? 30;
  return (IDLE_TIMEOUT_MINUTES_OPTIONS as readonly number[]).includes(n)
    ? (n as IdleTimeoutMinutes)
    : 30;
}

function clampSimulatorRetention(value?: number): number {
  const n = Math.floor(Number(value ?? 3));
  if (!Number.isFinite(n) || n < 1) return 3;
  if (n > 36) return 36;
  return n;
}

function normalizeIanaTimezone(raw: string | undefined, fallback: string): string {
  const v = String(raw ?? '').trim();
  if (!v) return fallback;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: v });
    return v;
  } catch {
    return fallback;
  }
}

function normalizePlatformConfig(raw: Partial<HqPlatformConfig>): HqPlatformConfig {
  const base = defaultPlatform();
  const merged = { ...base, ...raw };
  return {
    ...merged,
    idleTimeoutMinutes: normalizeIdleTimeoutMinutes(merged.idleTimeoutMinutes),
    defaultUsdtFiatCurrency: merged.defaultUsdtFiatCurrency ?? 'JPY',
    simulatorRetentionMonths: clampSimulatorRetention(merged.simulatorRetentionMonths),
    loginNoticeI18n: mergeLoginNoticeI18n(merged.loginNoticeI18n),
    authMainText: String(merged.authMainText ?? ''),
    linkPreviewRevision: Math.max(0, Math.floor(Number(merged.linkPreviewRevision) || 0)),
    depositReceivingAccounts: normalizeDepositReceivingAccounts(merged.depositReceivingAccounts),
    baseTimezone: normalizeIanaTimezone(merged.baseTimezone, 'Asia/Seoul'),
    serviceTimezone: normalizeIanaTimezone(merged.serviceTimezone, 'Asia/Seoul'),
  };
}

function normalizeDepositNoticeI18n(
  raw?: DepositReceivingAccount['noticeI18n'],
  legacyNotice?: string,
): DepositReceivingAccount['noticeI18n'] {
  const out: NonNullable<DepositReceivingAccount['noticeI18n']> = {};
  for (const loc of ['KR', 'US', 'JP', 'CH', 'TH'] as const) {
    const v = raw?.[loc]?.trim();
    if (v) out[loc] = v;
  }
  if (!out.KR && legacyNotice?.trim()) out.KR = legacyNotice.trim();
  return Object.keys(out).length ? out : undefined;
}

function normalizeDepositReceivingAccounts(
  raw?: HqPlatformConfig['depositReceivingAccounts'],
): HqPlatformConfig['depositReceivingAccounts'] {
  const out: NonNullable<HqPlatformConfig['depositReceivingAccounts']> = {};
  for (const cur of ['KRW', 'JPY', 'THB', 'CNY'] as const) {
    const a = raw?.[cur];
    if (!a) continue;
    out[cur] = {
      bankName: a.bankName ?? '',
      accountNumber: a.accountNumber ?? '',
      accountHolder: a.accountHolder ?? '',
      bankAddress: a.bankAddress ?? '',
      bankCode: a.bankCode ?? '',
      branchCode: a.branchCode ?? '',
      branchName: a.branchName ?? '',
      accountType: a.accountType ?? '',
      notice: a.notice ?? '',
      noticeI18n: normalizeDepositNoticeI18n(a.noticeI18n, a.notice),
      transferEnabled: a.transferEnabled !== false,
      cardEnabled: a.cardEnabled !== false,
    };
  }
  return out;
}

export function resolveUsdtCurrencyTradePolicy(
  accounts?: HqPlatformConfig['depositReceivingAccounts'],
): Record<'KRW' | 'JPY' | 'THB' | 'CNY', { transfer: boolean; card: boolean }> {
  return {
    KRW: { transfer: accounts?.KRW?.transferEnabled !== false, card: accounts?.KRW?.cardEnabled !== false },
    JPY: { transfer: accounts?.JPY?.transferEnabled !== false, card: accounts?.JPY?.cardEnabled !== false },
    THB: { transfer: accounts?.THB?.transferEnabled !== false, card: accounts?.THB?.cardEnabled !== false },
    CNY: { transfer: accounts?.CNY?.transferEnabled !== false, card: accounts?.CNY?.cardEnabled !== false },
  };
}

function defaultPlatform(): HqPlatformConfig {
  return {
    primaryDomain: 'api.tinpass.com',
    apiPublicUrl: 'https://api.tinpass.com',
    corsOrigins: [
      'https://api.tinpass.com',
      'https://tinpass.com',
      'https://www.tinpass.com',
    ],
    sslCertPath: '/etc/letsencrypt/live/api.tinpass.com/fullchain.pem',
    redirectRootToPrimary: false,
    siteName: 'Crypto Workflow',
    tabTitle: '',
    footerText: '',
    authMainText: '',
    linkPreviewRevision: 0,
    loginNoticeEnabled: true,
    loginNoticeI18n: { ...DEFAULT_LOGIN_NOTICE_I18N },
    customerRegistrationEnabled: false,
    idleTimeoutMinutes: 30,
    defaultUsdtFiatCurrency: 'JPY',
    simulatorRetentionMonths: 3,
    depositReceivingAccounts: {
      JPY: DEFAULT_JPY_DEPOSIT_RECEIVING_ACCOUNT(),
    },
    baseTimezone: 'Asia/Seoul',
    serviceTimezone: 'Asia/Seoul',
  };
}

type BrandAsset = 'logo' | 'auth-logo' | 'favicon' | 'background' | 'og';

const BRAND_ASSET_URL: Record<BrandAsset, string> = {
  logo: '/api/branding/logo',
  'auth-logo': '/api/branding/auth-logo',
  favicon: '/api/branding/favicon',
  background: '/api/branding/background',
  og: '/api/branding/og',
};

const BRAND_CONFIG_KEY: Record<BrandAsset, keyof HqPlatformConfig> = {
  logo: 'logoUrl',
  'auth-logo': 'authLogoUrl',
  favicon: 'faviconUrl',
  background: 'authBackgroundUrl',
  og: 'ogImageUrl',
};

function ensureBrandingDir() {
  if (!fs.existsSync(BRANDING_DIR)) {
    fs.mkdirSync(BRANDING_DIR, { recursive: true });
  }
}

function getBrandingAssetPath(asset: BrandAsset): string | null {
  if (!fs.existsSync(BRANDING_DIR)) return null;
  const files = fs.readdirSync(BRANDING_DIR).filter((f) => f.startsWith(`${asset}.`));
  if (files.length === 0) return null;
  return path.resolve(BRANDING_DIR, files[0]!);
}

const BRAND_ASSETS: BrandAsset[] = ['logo', 'auth-logo', 'favicon', 'background', 'og'];

/** DB에 URL이 없어도 uploads/branding 파일이 있으면 URL 복원 */
function syncBrandingUrls(config: HqPlatformConfig): HqPlatformConfig {
  const next = { ...config };
  for (const asset of BRAND_ASSETS) {
    if (getBrandingAssetPath(asset)) {
      const key = BRAND_CONFIG_KEY[asset];
      (next as Record<string, unknown>)[key as string] = BRAND_ASSET_URL[asset];
    }
  }
  return next;
}

function withBrandingCacheBust(url: string | null | undefined, asset: BrandAsset): string | null {
  if (!url) return null;
  const filePath = getBrandingAssetPath(asset);
  const base = url.split('?')[0]!;
  if (!filePath) return base;
  const v = fs.statSync(filePath).mtimeMs;
  return `${base}?v=${v}`;
}

function mimeFromExt(ext: string): string | null {
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  return map[ext.toLowerCase()] ?? null;
}

async function saveBrandingAsset(
  audit: AuditContext,
  asset: BrandAsset,
  file: { buffer: Buffer; originalname: string },
) {
  ensureBrandingDir();
  const defaults: Record<BrandAsset, string> = {
    logo: '.png',
    'auth-logo': '.png',
    favicon: '.ico',
    background: '.jpg',
    og: '.png',
  };
  const ext = path.extname(file.originalname) || defaults[asset];
  for (const f of fs.readdirSync(BRANDING_DIR)) {
    if (f.startsWith(`${asset}.`)) {
      fs.unlinkSync(path.join(BRANDING_DIR, f));
    }
  }
  fs.writeFileSync(path.join(BRANDING_DIR, `${asset}${ext}`), file.buffer);
  const config = await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform());
  const key = BRAND_CONFIG_KEY[asset];
  const next = { ...config, [key]: BRAND_ASSET_URL[asset] };
  await putConfig(HQ_CONFIG_KEYS.platform, next, '플랫폼 도메인·SSL');
  await logAdminChange({
    actor: audit.actor,
    action: AdminChangeAction.UPDATE,
    entityType: 'HQ_PLATFORM_BRANDING',
    entityId: asset,
    entityLabel: asset,
    summary: `브랜딩 파일 업로드: ${file.originalname} (관리자: ${audit.actor.email})`,
    before: { [key]: config[key] },
    after: { [key]: BRAND_ASSET_URL[asset], filename: file.originalname },
    ipAddress: audit.ipAddress,
    userAgent: audit.userAgent,
  });
}

function readSslInfo(certPath?: string) {
  if (!certPath || !fs.existsSync(certPath)) {
    return { status: 'N/A', detail: '인증서 파일 없음', daysRemaining: null as number | null };
  }
  try {
    const pem = fs.readFileSync(certPath, 'utf8');
    const out = execSync(`openssl x509 -enddate -noout`, {
      input: pem,
      encoding: 'utf8',
    }).trim();
    const match = out.match(/notAfter=(.+)/);
    if (!match) return { status: 'ERROR', detail: out, daysRemaining: null };
    const notAfter = new Date(match[1]);
    const days = Math.ceil((notAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return {
      status: days > 0 ? 'OK' : 'EXPIRED',
      detail: match[1],
      daysRemaining: days,
      notAfter: notAfter.toISOString(),
    };
  } catch (e) {
    return {
      status: 'ERROR',
      detail: e instanceof Error ? e.message : 'SSL read failed',
      daysRemaining: null,
    };
  }
}

export const hqPolicyService = {
  async getAccessPayload() {
    const stored = await getConfig(HQ_CONFIG_KEYS.accessMatrix, defaultAccessMatrix());
    const defaults = defaultAccessMatrix();
    const matrix = { ...defaults };
    for (const actor of HQ_ACCESS_ACTORS) {
      matrix[actor] = { ...defaults[actor], ...(stored[actor] ?? {}) };
    }
    return {
      pages: HQ_PAGE_CATALOG,
      orgLevels: HQ_ACCESS_ACTORS,
      permissionLevels: HQ_PERMISSION_LEVELS,
      matrix,
    };
  },

  async saveAccessMatrix(audit: AuditContext, matrix: HqAccessMatrix) {
    for (const actor of HQ_ACCESS_ACTORS) {
      if (!matrix[actor]) throw new Error(`조직 단계 누락: ${actor}`);
      for (const page of HQ_PAGE_CATALOG) {
        const level = matrix[actor][page.path];
        if (!HQ_PERMISSION_LEVELS.includes(level as HqPermissionLevel)) {
          throw new Error(`잘못된 권한: ${actor} / ${page.path}`);
        }
      }
    }
    await putConfigWithAudit(audit, {
      key: HQ_CONFIG_KEYS.accessMatrix,
      value: matrix,
      description: '본사권한설정 매트릭스',
      entityType: 'HQ_ACCESS_MATRIX',
      summary: '본사 접근·권한 매트릭스 저장',
    });
    return this.getAccessPayload();
  },

  async getOrgColumnsPayload() {
    const config = await getConfig(HQ_CONFIG_KEYS.orgColumns, defaultOrgColumns());
    return { catalog: HQ_VIEW_COLUMN_CATALOG, orgLevels: HQ_ORG_LEVELS, config };
  },

  async saveOrgColumns(audit: AuditContext, config: HqOrgColumnConfig) {
    await putConfigWithAudit(audit, {
      key: HQ_CONFIG_KEYS.orgColumns,
      value: config,
      description: '조직항목설정',
      entityType: 'HQ_ORG_COLUMNS',
      summary: '조직·화면 항목 설정 저장',
    });
    return this.getOrgColumnsPayload();
  },

  async getCommissionPayload() {
    const raw = await getConfig(HQ_CONFIG_KEYS.commissionRisk, defaultCommissionRisk());
    const risk = normalizeCommissionRisk(raw);
    const feeTiers = await getSymbolFeeTiers();
    const exchangeRateSources = await getExchangeRateSourcePolicy();
    const exchangeRatePreview = await getExchangeRatePolicyPreview();
    const localPremiums = await getAllLocalMarketPremiums();
    const krwPremium = localPremiums.find((p) => p.currency === 'KRW');
    let kimchiPremium = null;
    try {
      kimchiPremium = await getKimchiPremiumAnalysis();
    } catch {
      kimchiPremium = krwPremium
        ? {
            domesticRate: krwPremium.domesticRate,
            fairRate: krwPremium.fairRate,
            premiumPercent: krwPremium.premiumPercent,
            upbitRate: krwPremium.detailRates.upbit ?? null,
            bithumbRate: krwPremium.detailRates.bithumb ?? null,
            usdKrwRate: krwPremium.usdFiatRate,
            usdtUsdRate: krwPremium.usdtUsdRate,
            fetchedAt: krwPremium.fetchedAt,
          }
        : null;
    }
    const rates = await prisma.commissionRate.findMany({
      where: { effectiveTo: null },
      include: { organization: { select: { id: true, code: true, name: true, type: true } } },
      orderBy: [{ ticketType: 'asc' }, { organization: { code: 'asc' } }],
    });
    const { customerFeePolicyService } = await import('./customer-fee-policy.service');
    await customerFeePolicyService.ensureFeeTypeTemplatesSeeded();
    const feeTypes = await customerFeePolicyService.listFeeTypes();
    const defaultType = feeTypes.find((t) => t.isDefault) ?? feeTypes[0];
    const orgShareRaw = await getConfig(HQ_CONFIG_KEYS.orgShare, defaultOrgSharePolicy());
    const orgShare = normalizeOrgSharePolicy(defaultType?.config ?? orgShareRaw);
    return {
      risk,
      feeTiers,
      simulatorRisk: await getSimulatorCommissionRiskConfig(),
      simulatorFeeTiers: await getSimulatorSymbolFeeTiers(),
      exchangeRateSources,
      exchangeRatePreview,
      localPremiums,
      kimchiPremium,
      rates,
      orgShare,
      feeTypes,
      customerFeeShareOverrides: [] as Array<{
        userId: string;
        email: string;
        name: string;
        feeShare: ReturnType<typeof persistableCustomerFeeShare>;
      }>,
      gasNetworks: normalizeGasNetworkPolicy(
        await getConfig(HQ_CONFIG_KEYS.gasNetworks, defaultGasNetworkPolicy()),
      ),
      currencyAmountDisplay: await getCurrencyAmountDisplayPolicy(),
    };
  },

  async saveCurrencyAmountDisplay(audit: AuditContext, policy: HqCurrencyAmountDisplayPolicy) {
    const normalized = normalizeCurrencyAmountDisplayPolicy(policy);
    await putConfigWithAudit(audit, {
      key: HQ_CONFIG_KEYS.currencyAmountDisplay,
      value: normalized,
      description: '통화별 법정화폐 소수점·절상/반올림/버림',
      entityType: 'HQ_CURRENCY_AMOUNT_DISPLAY',
      summary: '통화 금액 표시 규칙 저장',
    });
    clearCurrencyAmountDisplayPolicyCache();
    return this.getCommissionPayload();
  },

  async saveCommissionRisk(audit: AuditContext, risk: HqCommissionRiskConfig) {
    const normalized = normalizeCommissionRisk(risk);
    await putConfigWithAudit(audit, {
      key: HQ_CONFIG_KEYS.commissionRisk,
      value: normalized,
      description: '수수료·리스크 정책',
      entityType: 'HQ_COMMISSION_RISK',
      summary: '수수료·리스크 정책 저장',
    });
    return this.getCommissionPayload();
  },

  async saveGasNetworks(audit: AuditContext, policy: HqGasNetworkPolicy) {
    const normalized = normalizeGasNetworkPolicy(policy);
    await putConfigWithAudit(audit, {
      key: HQ_CONFIG_KEYS.gasNetworks,
      value: normalized,
      description: '네트워크별 가스피',
      entityType: 'HQ_GAS_NETWORKS',
      summary: 'USDT 출금 네트워크별 가스피 저장',
    });
    return this.getCommissionPayload();
  },

  async saveSymbolFeeTiers(audit: AuditContext, tiers: SymbolFeeTierPolicy) {
    const normalized = normalizeSymbolFeeTiers(tiers);
    if (!normalized.length) {
      throw new Error('수수료 구간이 비어 있습니다.');
    }
    await putConfigWithAudit(audit, {
      key: HQ_CONFIG_KEYS.feeTiers,
      value: normalized,
      description: '시볼(티켓) 통화별 수수료 구간',
      entityType: 'HQ_FEE_TIERS',
      summary: '시볼 수수료 구간 저장',
    });
    return this.getCommissionPayload();
  },

  async saveSimulatorCommissionRisk(audit: AuditContext, risk: HqCommissionRiskConfig) {
    const normalized = normalizeCommissionRisk(risk);
    await putConfigWithAudit(audit, {
      key: HQ_CONFIG_KEYS.simulatorCommissionRisk,
      value: normalized,
      description: '시뮬레이터 수수료·리스크 정책',
      entityType: 'HQ_SIMULATOR_COMMISSION_RISK',
      summary: '시뮬레이터 수수료·리스크 정책 저장',
    });
    return this.getCommissionPayload();
  },

  async saveSimulatorSymbolFeeTiers(audit: AuditContext, tiers: SymbolFeeTierPolicy) {
    const normalized = normalizeSymbolFeeTiers(tiers);
    if (!normalized.length) {
      throw new Error('시뮬레이터 수수료 구간이 비어 있습니다.');
    }
    await putConfigWithAudit(audit, {
      key: HQ_CONFIG_KEYS.simulatorFeeTiers,
      value: normalized,
      description: '시뮬레이터 시볼 수수료 구간',
      entityType: 'HQ_SIMULATOR_FEE_TIERS',
      summary: '시뮬레이터 수수료 구간 저장',
    });
    return this.getCommissionPayload();
  },

  async saveExchangeRateSources(audit: AuditContext, policy: HqExchangeRateSourcePolicy) {
    const before = await getExchangeRateSourcePolicy();
    await saveExchangeRateSourcePolicy(policy);
    const after = await getExchangeRateSourcePolicy();
    await logAdminChange({
      actor: audit.actor,
      action: AdminChangeAction.UPDATE,
      entityType: 'HQ_EXCHANGE_RATE_SOURCES',
      entityId: HQ_CONFIG_KEYS.exchangeRateSources,
      entityLabel: '기준가 소스',
      summary: `환율 기준가 소스 정책 저장 (관리자: ${audit.actor.email})`,
      before,
      after,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
    return this.getCommissionPayload();
  },

  async saveOrgSharePolicy(audit: AuditContext, policy: HqOrgSharePolicy) {
    const normalized = normalizeOrgSharePolicy(policy);
    try {
      assertEscrowShareTotals(normalized);
    } catch (e) {
      throw new AppError(400, e instanceof Error ? e.message : 'ESCROW_SHARE_MISMATCH', 'ESCROW_SHARE_MISMATCH');
    }
    await putConfigWithAudit(audit, {
      key: HQ_CONFIG_KEYS.orgShare,
      value: normalized,
      description: '단계별 수수료 배분',
      entityType: 'HQ_ORG_SHARE',
      summary: '조직 단계별 수수료 배분 저장',
    });
    const { customerFeePolicyService } = await import('./customer-fee-policy.service');
    await customerFeePolicyService.syncDefaultFromOrgShare(normalized);
    return this.getCommissionPayload();
  },

  async saveCommissionRates(
    audit: AuditContext,
    rates: Array<{
      organizationId: string;
      ticketType: TicketType;
      ratePercent: number;
      perTicketUsdt?: number;
      useDefault?: boolean;
    }>,
  ) {
    if (!rates.length) {
      throw new Error('수수료 요율이 비어 있습니다.');
    }

    const orgIds = [...new Set(rates.map((r) => r.organizationId))];
    const orgCount = await prisma.organization.count({ where: { id: { in: orgIds } } });
    if (orgCount !== orgIds.length) {
      throw new Error('존재하지 않는 조직이 포함되어 있습니다.');
    }

    for (const item of rates) {
      if (!Object.values(TicketType).includes(item.ticketType)) {
        throw new Error(`잘못된 티켓 유형: ${item.ticketType}`);
      }
      if (item.ratePercent < 0 || item.ratePercent > 100) {
        throw new Error('요율은 0~100% 사이여야 합니다.');
      }
      if ((item.perTicketUsdt ?? 0) < 0) {
        throw new Error('건당 수수료는 0 이상이어야 합니다.');
      }
    }

    const beforeRates = await prisma.commissionRate.findMany({
      where: { effectiveTo: null },
      include: { organization: { select: { code: true, name: true } } },
    });

    await prisma.$transaction(async (tx) => {
      for (const item of rates) {
        const existing = await tx.commissionRate.findFirst({
          where: {
            organizationId: item.organizationId,
            ticketType: item.ticketType,
            effectiveTo: null,
          },
          orderBy: { effectiveFrom: 'desc' },
        });

        const nextRate = Number(item.ratePercent.toFixed(4));
        const nextPer = Number((item.perTicketUsdt ?? 0).toFixed(8));
        const nextDefault = item.useDefault !== false;
        if (
          existing &&
          Number(existing.ratePercent) === nextRate &&
          Number(existing.perTicketUsdt) === nextPer &&
          existing.useDefault === nextDefault
        ) {
          continue;
        }

        if (existing) {
          await tx.commissionRate.update({
            where: { id: existing.id },
            data: { effectiveTo: new Date() },
          });
        }

        await tx.commissionRate.create({
          data: {
            organizationId: item.organizationId,
            ticketType: item.ticketType,
            ratePercent: nextRate,
            perTicketUsdt: nextPer,
            useDefault: nextDefault,
          },
        });
      }
    });

    const afterRates = await prisma.commissionRate.findMany({
      where: { effectiveTo: null },
      include: { organization: { select: { code: true, name: true } } },
    });

    await logAdminChange({
      actor: audit.actor,
      action: AdminChangeAction.UPDATE,
      entityType: 'HQ_COMMISSION_RATES',
      entityLabel: '조직별 수수료 요율',
      summary: `조직별 수수료 요율 저장 (${rates.length}건, 관리자: ${audit.actor.email})`,
      before: beforeRates,
      after: afterRates,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });

    return this.getCommissionPayload();
  },

  async getPlatformPayload() {
    const config = syncBrandingUrls(
      normalizePlatformConfig({
        ...defaultPlatform(),
        ...(await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform())),
      }),
    );
    const emailRaw = await getEmailOtpConfig();
    const email = {
      ...emailRaw,
      smtpPassword: emailRaw.smtpPassword ? '********' : '',
    };
    const ssl = readSslInfo(config.sslCertPath);
    let pm2List: unknown[] = [];
    try {
      const raw = execSync('pm2 jlist', { encoding: 'utf8' });
      pm2List = JSON.parse(raw || '[]');
    } catch {
      pm2List = [];
    }
    return {
      config,
      email,
      ssl,
      server: {
        hostname: os.hostname(),
        uptimeSec: os.uptime(),
        memTotalMb: Math.round(os.totalmem() / 1024 / 1024),
        memFreeMb: Math.round(os.freemem() / 1024 / 1024),
        loadAvg: os.loadavg(),
      },
      pm2: pm2List,
      nginxConfigHint: path.join(
        process.cwd(),
        '../deploy/cafe24-business/nginx/crypto-workflow-tinpass.conf',
      ),
    };
  },

  async savePlatform(audit: AuditContext, config: HqPlatformConfig) {
    const existing = await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform());
    const prevRev = Math.max(0, Math.floor(Number(existing.linkPreviewRevision) || 0));
    const merged = syncBrandingUrls(
      normalizePlatformConfig({
        ...existing,
        ...config,
        // 클라이언트 값이 최신. 미리보기 캐시 무효화를 위해 저장마다 revision 증가
        authMainText: config.authMainText ?? '',
        siteName: config.siteName ?? existing.siteName,
        linkPreviewRevision: prevRev + 1,
      }),
    );
    await putConfigWithAudit(audit, {
      key: HQ_CONFIG_KEYS.platform,
      value: merged,
      description: '플랫폼 도메인·SSL',
      entityType: 'HQ_PLATFORM',
      summary: '플랫폼 설정 저장',
    });
    return this.getPlatformPayload();
  },

  async getSessionPolicy() {
    const config = normalizePlatformConfig({
      ...defaultPlatform(),
      ...(await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform())),
    });
    return {
      idleTimeoutMinutes: config.idleTimeoutMinutes ?? 30,
      defaultUsdtFiatCurrency: config.defaultUsdtFiatCurrency ?? 'JPY',
    };
  },

  async savePlatformEmail(audit: AuditContext, email: HqEmailOtpConfig) {
    const before = maskEmailConfig(await getEmailOtpConfig());
    await saveEmailOtpConfig(email);
    const after = maskEmailConfig(await getEmailOtpConfig());
    await logAdminChange({
      actor: audit.actor,
      action: AdminChangeAction.UPDATE,
      entityType: 'HQ_PLATFORM_EMAIL',
      entityId: HQ_CONFIG_KEYS.emailOtp,
      entityLabel: '이메일·OTP',
      summary: `플랫폼 이메일·OTP 설정 저장 (관리자: ${audit.actor.email})`,
      before,
      after,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
    return this.getPlatformPayload();
  },

  async sendPlatformEmailTest(to: string) {
    const email = await getEmailOtpConfig();
    await sendTestEmail(email, to);
    return { ok: true };
  },

  async savePlatformLogo(audit: AuditContext, file: { buffer: Buffer; originalname: string }) {
    await saveBrandingAsset(audit, 'logo', file);
    return this.getPlatformPayload();
  },

  async savePlatformAuthLogo(audit: AuditContext, file: { buffer: Buffer; originalname: string }) {
    await saveBrandingAsset(audit, 'auth-logo', file);
    return this.getPlatformPayload();
  },

  async savePlatformFavicon(audit: AuditContext, file: { buffer: Buffer; originalname: string }) {
    await saveBrandingAsset(audit, 'favicon', file);
    return this.getPlatformPayload();
  },

  async savePlatformBackground(audit: AuditContext, file: { buffer: Buffer; originalname: string }) {
    await saveBrandingAsset(audit, 'background', file);
    return this.getPlatformPayload();
  },

  async savePlatformOgImage(audit: AuditContext, file: { buffer: Buffer; originalname: string }) {
    await saveBrandingAsset(audit, 'og', file);
    const existing = await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform());
    const prevRev = Math.max(0, Math.floor(Number(existing.linkPreviewRevision) || 0));
    await putConfig(HQ_CONFIG_KEYS.platform, {
      ...existing,
      ogImageUrl: BRAND_ASSET_URL.og,
      linkPreviewRevision: prevRev + 1,
    }, '플랫폼 도메인·SSL');
    return this.getPlatformPayload();
  },

  async getPublicBranding() {
    const config = syncBrandingUrls(
      normalizePlatformConfig({
        ...defaultPlatform(),
        ...(await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform())),
      }),
    );
    return {
      siteName: config.siteName || 'Crypto Workflow',
      tabTitle: (config.tabTitle || config.siteName || '').trim() || config.siteName || 'Crypto Workflow',
      logoUrl: withBrandingCacheBust(config.logoUrl, 'logo'),
      authLogoUrl: withBrandingCacheBust(config.authLogoUrl, 'auth-logo'),
      faviconUrl: withBrandingCacheBust(config.faviconUrl, 'favicon'),
      authBackgroundUrl: withBrandingCacheBust(config.authBackgroundUrl, 'background'),
      authMainText: config.authMainText ?? '',
      footerText: config.footerText ?? '',
      loginNoticeEnabled: config.loginNoticeEnabled !== false,
      loginNoticeI18n: config.loginNoticeI18n ?? {},
      customerRegistrationEnabled: config.customerRegistrationEnabled === true,
      defaultUsdtFiatCurrency: config.defaultUsdtFiatCurrency ?? 'JPY',
      baseTimezone: config.baseTimezone ?? 'Asia/Seoul',
      serviceTimezone: config.serviceTimezone ?? 'Asia/Seoul',
      currencyAmountDisplay: await getCurrencyAmountDisplayPolicy(),
    };
  },

  async isCustomerRegistrationEnabled(): Promise<boolean> {
    const config = await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform());
    return config.customerRegistrationEnabled === true;
  },

  async getDepositReceivingAccounts() {
    const config = normalizePlatformConfig({
      ...defaultPlatform(),
      ...(await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform())),
    });
    return config.depositReceivingAccounts ?? {};
  },

  async getUsdtCurrencyTradePolicy() {
    return resolveUsdtCurrencyTradePolicy(await this.getDepositReceivingAccounts());
  },

  async assertUsdtFiatMethodEnabled(currency: string, method: 'TRANSFER' | 'CARD') {
    const policy = await this.getUsdtCurrencyTradePolicy();
    const flags = policy[currency as keyof typeof policy];
    if (!flags) return;
    const ok = method === 'CARD' ? flags.card : flags.transfer;
    if (!ok) {
      throw new AppError(
        400,
        method === 'CARD'
          ? `Card payment is disabled for ${currency}`
          : `Bank transfer is disabled for ${currency}`,
        method === 'CARD' ? 'FIAT_CARD_DISABLED' : 'FIAT_TRANSFER_DISABLED',
      );
    }
  },

  async saveCardPayment(audit: AuditContext, config: HqCardPaymentConfig) {
    const before = await getCardPaymentConfig();
    const after = await saveCardPaymentConfig(config);
    await logAdminChange({
      actor: audit.actor,
      action: AdminChangeAction.UPDATE,
      entityType: 'HQ_CARD_PAYMENT',
      entityId: HQ_CONFIG_KEYS.cardPayment,
      entityLabel: '카드 결제 정책',
      summary: `카드 결제 정책 저장 (관리자: ${audit.actor.email})`,
      before,
      after,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
    return { config: after };
  },

  async saveIcopay(audit: AuditContext, config: HqIcopayConfig) {
    const before = await getIcopayConfigMasked();
    const current = await getIcopayConfig();
    const after = await saveIcopayConfig(config, current.bracketSecret);
    await logAdminChange({
      actor: audit.actor,
      action: AdminChangeAction.UPDATE,
      entityType: 'HQ_ICOPAY',
      entityId: HQ_CONFIG_KEYS.icopay,
      entityLabel: 'ICOPAY 연동',
      summary: `ICOPAY 연동 설정 저장 (관리자: ${audit.actor.email})`,
      before,
      after,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
    return { config: after };
  },

  async saveCurfex(audit: AuditContext, config: HqCurfexConfig) {
    const before = await getCurfexConfigMasked();
    const current = await getCurfexConfig();
    const after = await saveCurfexConfig(config, current.clientSecret, current.webhookSecret);
    await logAdminChange({
      actor: audit.actor,
      action: AdminChangeAction.UPDATE,
      entityType: 'HQ_CURFEX',
      entityId: HQ_CONFIG_KEYS.curfex,
      entityLabel: 'CURFEX Collection',
      summary: `CURFEX Collection 설정 저장 enabled=${after.enabled} (관리자: ${audit.actor.email})`,
      before,
      after,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
    return { config: after };
  },

  getLogoFilePath(): string | null {
    return getBrandingAssetPath('logo');
  },

  getAuthLogoFilePath(): string | null {
    return getBrandingAssetPath('auth-logo');
  },

  getFaviconFilePath(): string | null {
    return getBrandingAssetPath('favicon');
  },

  getBackgroundFilePath(): string | null {
    return getBrandingAssetPath('background');
  },

  getOgImageFilePath(): string | null {
    return getBrandingAssetPath('og') ?? getBrandingAssetPath('auth-logo');
  },

  /**
   * 링크 미리보기(단일). 로그인이 하나이므로 경로와 무관하게 동일.
   * 제목·설명=배경 브랜드 문구(authMainText). 본문 스크랩 없음.
   */
  async getPublicOpenGraph(): Promise<{
    title: string;
    description: string;
    siteName: string;
    imagePath: string | null;
    imageType: string | null;
    revision: number;
  }> {
    const config = syncBrandingUrls(
      normalizePlatformConfig({
        ...defaultPlatform(),
        ...(await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform())),
      }),
    );
    const siteName = (config.siteName || 'TINPASS').trim() || 'TINPASS';
    // 미리보기에 보이는 핵심 문구 = 배경 브랜드 문구 (없으면 사이트 이름)
    const description = String(config.authMainText || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' ')
      .trim();
    const title = description || siteName;
    const revision = Math.max(0, Math.floor(Number(config.linkPreviewRevision) || 0));
    const ogPath = getBrandingAssetPath('og');
    const authLogoPath = getBrandingAssetPath('auth-logo');
    const filePath = ogPath || authLogoPath;
    const asset: BrandAsset = ogPath ? 'og' : 'auth-logo';
    let imagePath: string | null = null;
    if (filePath) {
      const base = BRAND_ASSET_URL[asset].split('?')[0]!;
      const mtime = fs.statSync(filePath).mtimeMs;
      // LINE 캐시 무효화: revision + mtime + 문구 해시
      const phraseKey = Buffer.from(title).toString('base64url').slice(0, 16);
      imagePath = `${base}?v=${revision}-${Math.floor(mtime)}-${phraseKey}`;
    }
    const imageType = filePath ? mimeFromExt(path.extname(filePath)) : null;
    return {
      title,
      description: description || title,
      siteName,
      imagePath,
      imageType,
      revision,
    };
  },

  /** 저장된 매트릭스 기준 페이지 접근 가능 여부 */
  async canAccessPage(actor: string, pagePath: string, minLevel: HqPermissionLevel): Promise<boolean> {
    if (actor === 'SUPER_ADMIN') return true;
    const payload = await this.getAccessPayload();
    const org = payload.matrix[actor as HqAccessActor];
    if (!org) return false;
    const level = org[pagePath] ?? 'NONE';
    const order = HQ_PERMISSION_LEVELS;
    return order.indexOf(level as HqPermissionLevel) >= order.indexOf(minLevel);
  },

  accessActorForUser(user: { role: string; organizationType?: string | null }): HqAccessActor | 'SUPER_ADMIN' {
    if (user.role === 'SUPER_ADMIN') return 'SUPER_ADMIN';
    if (user.role === 'CUSTOMER' || user.role === 'CUSTOMER_OPERATOR') return 'CUSTOMER';
    return (user.organizationType as HqAccessActor) || 'SALES_OFFICE';
  },

  async getPageAccessForUser(user: {
    role: string;
    organizationType?: string | null;
    /** CUSTOMER — false면 본사 매트릭스보다 우선해 USDT 시뮬레이터 차단 */
    simulatorEnabled?: boolean | null;
    operatorsEnabled?: boolean | null;
  }) {
    const payload = await this.getAccessPayload();
    const actor = this.accessActorForUser(user);
    let levels: Record<string, HqPermissionLevel>;
    if (actor === 'SUPER_ADMIN') {
      levels = {};
      for (const page of HQ_PAGE_CATALOG) levels[page.path] = 'DELETE';
    } else if (user.role === 'ORGANIZER') {
      levels = {};
      for (const page of HQ_PAGE_CATALOG) levels[page.path] = 'NONE';
      const allow: Array<[string, HqPermissionLevel]> = [
        ['/dashboard', 'VIEW'],
        ['/dashboard/simulator', 'MODIFY'],
        ['/dashboard/usdt', 'MODIFY'],
        ['/dashboard/escrow', 'MODIFY'],
        ['/dashboard/ledger', 'VIEW'],
        ['/dashboard/users', 'MODIFY'],
        ['/dashboard/customers', 'MODIFY'],
        ['/dashboard/customers/fees', 'MODIFY'],
        ['/dashboard/simulator-logs', 'VIEW'],
        ['/dashboard/hq-policy/cost-analysis', 'MODIFY'],
        ['/dashboard/hq-policy/profit-analysis', 'MODIFY'],
      ];
      for (const [path, level] of allow) levels[path] = level;
    } else if (user.role === 'SETTLEMENT_ADMIN') {
      levels = {};
      for (const page of HQ_PAGE_CATALOG) levels[page.path] = 'NONE';
      levels['/dashboard'] = 'VIEW';
      levels['/dashboard/ledger'] = 'VIEW';
      levels['/dashboard/users'] = 'MODIFY';
    } else {
      levels = { ...(payload.matrix[actor] ?? {}) };
    }

    // 고객별 시뮬레이터 OFF → 본사권한(CUSTOMER 매트릭스)보다 우선 차단
    // HQ 「기록 시뮬레이터」(/dashboard/simulator-logs)는 고객 플래그와 무관
    if ((user.role === 'CUSTOMER' || user.role === 'CUSTOMER_OPERATOR') && user.simulatorEnabled === false) {
      levels['/dashboard/simulator'] = 'NONE';
    }
    if (user.role === 'CUSTOMER_OPERATOR') {
      levels['/dashboard/wallets'] = 'NONE';
      levels['/dashboard/merchant-users'] = 'NONE';
    }
    if (
      (user.role === 'CUSTOMER' || user.role === 'CUSTOMER_OPERATOR') &&
      user.operatorsEnabled !== true
    ) {
      levels['/dashboard/merchant-users'] = 'NONE';
    }
    return levels;
  },

  async getWorkflowDisplay(): Promise<HqWorkflowDisplayConfig> {
    const raw = await getConfig(HQ_CONFIG_KEYS.workflowDisplay, defaultWorkflowDisplay());
    return normalizeWorkflowDisplay(raw);
  },

  async saveWorkflowDisplay(audit: AuditContext, config: HqWorkflowDisplayConfig) {
    const normalized = normalizeWorkflowDisplay(config);
    await putConfigWithAudit(audit, {
      key: HQ_CONFIG_KEYS.workflowDisplay,
      value: normalized,
      description: '진행상태·처리시한',
      entityType: 'HQ_WORKFLOW_DISPLAY',
      summary: '진행상태 문구·예상완료 시한 저장',
    });
    return normalized;
  },
};

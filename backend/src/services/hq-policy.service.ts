import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { AdminChangeAction, TicketType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  HQ_CONFIG_KEYS,
  HQ_ORG_LEVELS,
  HQ_PAGE_CATALOG,
  HQ_PERMISSION_LEVELS,
  HQ_VIEW_COLUMN_CATALOG,
  type HqAccessMatrix,
  type HqCommissionRiskConfig,
  type HqOrgColumnConfig,
  type HqPermissionLevel,
  type HqPlatformConfig,
  type HqEmailOtpConfig,
  type HqExchangeRateSourcePolicy,
  type IdleTimeoutMinutes,
  IDLE_TIMEOUT_MINUTES_OPTIONS,
  type SymbolFeeTierPolicy,
} from '../constants/hq-policy';
import {
  defaultEmailOtpConfig,
  getEmailOtpConfig,
  saveEmailOtpConfig,
} from '../services/otp.service';
import { sendTestEmail } from '../services/email.service';
import {
  defaultTransactionFees,
  getSymbolFeeTiers,
  normalizeCommissionRisk,
  normalizeSymbolFeeTiers,
} from '../services/transaction-fee.service';
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

function defaultAccessMatrix(): HqAccessMatrix {
  const matrix = {} as HqAccessMatrix;
  for (const org of HQ_ORG_LEVELS) {
    matrix[org] = {};
    for (const page of HQ_PAGE_CATALOG) {
      if (page.group === '본사정책') {
        matrix[org][page.path] = org === 'HEAD_OFFICE' ? 'MODIFY' : 'NONE';
      } else if (org === 'HEAD_OFFICE') {
        matrix[org][page.path] = 'DELETE';
      } else if (org === 'SALES_OFFICE' && page.path === '/dashboard/wallets') {
        matrix[org][page.path] = 'NONE';
      } else {
        matrix[org][page.path] = 'VIEW';
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

function normalizePlatformConfig(raw: Partial<HqPlatformConfig>): HqPlatformConfig {
  const base = defaultPlatform();
  const merged = { ...base, ...raw };
  return {
    ...merged,
    idleTimeoutMinutes: normalizeIdleTimeoutMinutes(merged.idleTimeoutMinutes),
    defaultUsdtFiatCurrency: merged.defaultUsdtFiatCurrency ?? 'JPY',
    loginNoticeI18n: mergeLoginNoticeI18n(merged.loginNoticeI18n),
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
    footerText: '',
    authMainText: '',
    loginNoticeEnabled: true,
    loginNoticeI18n: { ...DEFAULT_LOGIN_NOTICE_I18N },
    customerRegistrationEnabled: false,
    idleTimeoutMinutes: 30,
    defaultUsdtFiatCurrency: 'JPY',
    depositReceivingAccounts: {},
  };
}

type BrandAsset = 'logo' | 'auth-logo' | 'favicon' | 'background';

const BRAND_ASSET_URL: Record<BrandAsset, string> = {
  logo: '/api/branding/logo',
  'auth-logo': '/api/branding/auth-logo',
  favicon: '/api/branding/favicon',
  background: '/api/branding/background',
};

const BRAND_CONFIG_KEY: Record<BrandAsset, keyof HqPlatformConfig> = {
  logo: 'logoUrl',
  'auth-logo': 'authLogoUrl',
  favicon: 'faviconUrl',
  background: 'authBackgroundUrl',
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

const BRAND_ASSETS: BrandAsset[] = ['logo', 'auth-logo', 'favicon', 'background'];

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
    const matrix = await getConfig(HQ_CONFIG_KEYS.accessMatrix, defaultAccessMatrix());
    return {
      pages: HQ_PAGE_CATALOG,
      orgLevels: HQ_ORG_LEVELS,
      permissionLevels: HQ_PERMISSION_LEVELS,
      matrix,
    };
  },

  async saveAccessMatrix(audit: AuditContext, matrix: HqAccessMatrix) {
    for (const org of HQ_ORG_LEVELS) {
      if (!matrix[org]) throw new Error(`조직 단계 누락: ${org}`);
      for (const page of HQ_PAGE_CATALOG) {
        const level = matrix[org][page.path];
        if (!HQ_PERMISSION_LEVELS.includes(level as HqPermissionLevel)) {
          throw new Error(`잘못된 권한: ${org} / ${page.path}`);
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
    return {
      risk,
      feeTiers,
      exchangeRateSources,
      exchangeRatePreview,
      localPremiums,
      kimchiPremium,
      rates,
    };
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

  async saveCommissionRates(
    audit: AuditContext,
    rates: Array<{ organizationId: string; ticketType: TicketType; ratePercent: number }>,
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
        if (existing && Number(existing.ratePercent) === nextRate) continue;

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
    const merged = syncBrandingUrls(
      normalizePlatformConfig({ ...existing, ...config }),
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

  async getPublicBranding() {
    const config = syncBrandingUrls(
      normalizePlatformConfig({
        ...defaultPlatform(),
        ...(await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform())),
      }),
    );
    return {
      siteName: config.siteName || 'Crypto Workflow',
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
    };
  },

  async isCustomerRegistrationEnabled(): Promise<boolean> {
    const config = await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform());
    return config.customerRegistrationEnabled === true;
  },

  async getDepositReceivingAccounts() {
    const config = await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform());
    return config.depositReceivingAccounts ?? {};
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

  /** 저장된 매트릭스 기준 페이지 접근 가능 여부 */
  async canAccessPage(orgType: string, pagePath: string, minLevel: HqPermissionLevel): Promise<boolean> {
    const matrix = await getConfig(HQ_CONFIG_KEYS.accessMatrix, defaultAccessMatrix());
    const org = matrix[orgType as keyof HqAccessMatrix];
    if (!org) return false;
    const level = org[pagePath] ?? 'NONE';
    const order = HQ_PERMISSION_LEVELS;
    return order.indexOf(level as HqPermissionLevel) >= order.indexOf(minLevel);
  },
};

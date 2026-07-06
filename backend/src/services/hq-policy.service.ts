import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { TicketType } from '@prisma/client';
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
} from '../constants/hq-policy';
import {
  defaultEmailOtpConfig,
  getEmailOtpConfig,
  saveEmailOtpConfig,
} from '../services/otp.service';
import { sendTestEmail } from '../services/email.service';
import {
  defaultTransactionFees,
  normalizeCommissionRisk,
} from '../services/transaction-fee.service';
import { DEFAULT_LOGIN_NOTICE_I18N } from '../constants/login-notice-i18n';

const BRANDING_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads', 'branding');

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

  async saveAccessMatrix(matrix: HqAccessMatrix) {
    for (const org of HQ_ORG_LEVELS) {
      if (!matrix[org]) throw new Error(`조직 단계 누락: ${org}`);
      for (const page of HQ_PAGE_CATALOG) {
        const level = matrix[org][page.path];
        if (!HQ_PERMISSION_LEVELS.includes(level as HqPermissionLevel)) {
          throw new Error(`잘못된 권한: ${org} / ${page.path}`);
        }
      }
    }
    await putConfig(HQ_CONFIG_KEYS.accessMatrix, matrix, '본사권한설정 매트릭스');
    return this.getAccessPayload();
  },

  async getOrgColumnsPayload() {
    const config = await getConfig(HQ_CONFIG_KEYS.orgColumns, defaultOrgColumns());
    return { catalog: HQ_VIEW_COLUMN_CATALOG, orgLevels: HQ_ORG_LEVELS, config };
  },

  async saveOrgColumns(config: HqOrgColumnConfig) {
    await putConfig(HQ_CONFIG_KEYS.orgColumns, config, '조직항목설정');
    return this.getOrgColumnsPayload();
  },

  async getCommissionPayload() {
    const raw = await getConfig(HQ_CONFIG_KEYS.commissionRisk, defaultCommissionRisk());
    const risk = normalizeCommissionRisk(raw);
    const rates = await prisma.commissionRate.findMany({
      where: { effectiveTo: null },
      include: { organization: { select: { id: true, code: true, name: true, type: true } } },
      orderBy: [{ ticketType: 'asc' }, { organization: { code: 'asc' } }],
    });
    return { risk, rates };
  },

  async saveCommissionRisk(risk: HqCommissionRiskConfig) {
    const normalized = normalizeCommissionRisk(risk);
    await putConfig(HQ_CONFIG_KEYS.commissionRisk, normalized, '수수료·리스크 정책');
    return this.getCommissionPayload();
  },

  async saveCommissionRates(
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

    return this.getCommissionPayload();
  },

  async getPlatformPayload() {
    const raw = {
      ...defaultPlatform(),
      ...(await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform())),
    };
    const config = syncBrandingUrls({
      ...raw,
      loginNoticeI18n: mergeLoginNoticeI18n(raw.loginNoticeI18n),
    });
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

  async savePlatform(config: HqPlatformConfig) {
    const existing = await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform());
    const merged = syncBrandingUrls({ ...existing, ...config });
    await putConfig(HQ_CONFIG_KEYS.platform, merged, '플랫폼 도메인·SSL');
    return this.getPlatformPayload();
  },

  async savePlatformEmail(email: HqEmailOtpConfig) {
    await saveEmailOtpConfig(email);
    return this.getPlatformPayload();
  },

  async sendPlatformEmailTest(to: string) {
    const email = await getEmailOtpConfig();
    await sendTestEmail(email, to);
    return { ok: true };
  },

  async savePlatformLogo(file: { buffer: Buffer; originalname: string }) {
    await saveBrandingAsset('logo', file);
    return this.getPlatformPayload();
  },

  async savePlatformAuthLogo(file: { buffer: Buffer; originalname: string }) {
    await saveBrandingAsset('auth-logo', file);
    return this.getPlatformPayload();
  },

  async savePlatformFavicon(file: { buffer: Buffer; originalname: string }) {
    await saveBrandingAsset('favicon', file);
    return this.getPlatformPayload();
  },

  async savePlatformBackground(file: { buffer: Buffer; originalname: string }) {
    await saveBrandingAsset('background', file);
    return this.getPlatformPayload();
  },

  async getPublicBranding() {
    const config = syncBrandingUrls({
      ...defaultPlatform(),
      ...(await getConfig(HQ_CONFIG_KEYS.platform, defaultPlatform())),
    });
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
    };
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

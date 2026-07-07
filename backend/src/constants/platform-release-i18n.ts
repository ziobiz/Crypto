import type { AdminChangeAction } from '@prisma/client';
import type { ReleaseChangeLevel } from '@prisma/client';

export type ReleaseLocale = 'KR' | 'US' | 'JP' | 'CH' | 'TH';

export type ReleaseI18nText = Record<ReleaseLocale, { title: string; description: string }>;

/** 본사정책·플랫폼 변경 시 자동 버전 등급 */
export const AUTO_RELEASE_ENTITY_LEVEL: Record<string, ReleaseChangeLevel> = {
  HQ_ACCESS_MATRIX: 'MAJOR',
  HQ_PLATFORM: 'MAJOR',
  HQ_ORG_COLUMNS: 'MINOR',
  HQ_COMMISSION_RISK: 'MINOR',
  HQ_FEE_TIERS: 'MINOR',
  HQ_EXCHANGE_RATE_SOURCES: 'MINOR',
  HQ_COMMISSION_RATES: 'MINOR',
  HQ_PLATFORM_EMAIL: 'MINOR',
  HQ_PLATFORM_BRANDING: 'PATCH',
};

export const AUTO_RELEASE_ENTITY_TYPES = new Set(Object.keys(AUTO_RELEASE_ENTITY_LEVEL));

const ENTITY_LABEL: Record<ReleaseLocale, Record<string, string>> = {
  KR: {
    HQ_ACCESS_MATRIX: '접근·권한',
    HQ_PLATFORM: '플랫폼 설정',
    HQ_ORG_COLUMNS: '조직·화면',
    HQ_COMMISSION_RISK: '수수료·리스크',
    HQ_FEE_TIERS: '수수료 구간',
    HQ_EXCHANGE_RATE_SOURCES: '기준가 소스',
    HQ_COMMISSION_RATES: '조직 수수료 요율',
    HQ_PLATFORM_EMAIL: '이메일·OTP',
    HQ_PLATFORM_BRANDING: '브랜딩',
  },
  US: {
    HQ_ACCESS_MATRIX: 'Access & permissions',
    HQ_PLATFORM: 'Platform settings',
    HQ_ORG_COLUMNS: 'Org columns',
    HQ_COMMISSION_RISK: 'Fees & risk',
    HQ_FEE_TIERS: 'Fee tiers',
    HQ_EXCHANGE_RATE_SOURCES: 'Rate sources',
    HQ_COMMISSION_RATES: 'Commission rates',
    HQ_PLATFORM_EMAIL: 'Email & OTP',
    HQ_PLATFORM_BRANDING: 'Branding',
  },
  JP: {
    HQ_ACCESS_MATRIX: 'アクセス·権限',
    HQ_PLATFORM: 'プラットフォーム設定',
    HQ_ORG_COLUMNS: '組織·画面',
    HQ_COMMISSION_RISK: '手数料·リスク',
    HQ_FEE_TIERS: '手数料区間',
    HQ_EXCHANGE_RATE_SOURCES: '基準価ソース',
    HQ_COMMISSION_RATES: '組織手数料率',
    HQ_PLATFORM_EMAIL: 'メール·OTP',
    HQ_PLATFORM_BRANDING: 'ブランディング',
  },
  CH: {
    HQ_ACCESS_MATRIX: '访问权限',
    HQ_PLATFORM: '平台设置',
    HQ_ORG_COLUMNS: '组织界面',
    HQ_COMMISSION_RISK: '手续费风险',
    HQ_FEE_TIERS: '手续费区间',
    HQ_EXCHANGE_RATE_SOURCES: '基准价来源',
    HQ_COMMISSION_RATES: '组织手续费率',
    HQ_PLATFORM_EMAIL: '邮件OTP',
    HQ_PLATFORM_BRANDING: '品牌',
  },
  TH: {
    HQ_ACCESS_MATRIX: 'การเข้าถึง·สิทธิ์',
    HQ_PLATFORM: 'การตั้งค่าแพลตฟอร์ม',
    HQ_ORG_COLUMNS: 'องค์กร·หน้าจอ',
    HQ_COMMISSION_RISK: 'ค่าธรรมเนียม·ความเสี่ยง',
    HQ_FEE_TIERS: 'ช่วงค่าธรรมเนียม',
    HQ_EXCHANGE_RATE_SOURCES: 'แหล่งอัตรา',
    HQ_COMMISSION_RATES: 'อัตราค่าคอมมิชชัน',
    HQ_PLATFORM_EMAIL: 'อีเมล·OTP',
    HQ_PLATFORM_BRANDING: 'แบรนด์',
  },
};

const ACTION_VERB: Record<
  ReleaseLocale,
  Record<AdminChangeAction, { title: string; desc: string }>
> = {
  KR: {
    CREATE: { title: '등록', desc: '신규 등록' },
    UPDATE: { title: '수정', desc: '설정 변경' },
    DELETE: { title: '삭제', desc: '설정 삭제' },
  },
  US: {
    CREATE: { title: 'Created', desc: 'New configuration' },
    UPDATE: { title: 'Updated', desc: 'Configuration changed' },
    DELETE: { title: 'Deleted', desc: 'Configuration removed' },
  },
  JP: {
    CREATE: { title: '登録', desc: '新規登録' },
    UPDATE: { title: '更新', desc: '設定変更' },
    DELETE: { title: '削除', desc: '設定削除' },
  },
  CH: {
    CREATE: { title: '新增', desc: '新建配置' },
    UPDATE: { title: '修改', desc: '配置变更' },
    DELETE: { title: '删除', desc: '配置删除' },
  },
  TH: {
    CREATE: { title: 'สร้าง', desc: 'การตั้งค่าใหม่' },
    UPDATE: { title: 'แก้ไข', desc: 'เปลี่ยนการตั้งค่า' },
    DELETE: { title: 'ลบ', desc: 'ลบการตั้งค่า' },
  },
};

const LEVEL_LABEL: Record<ReleaseLocale, Record<ReleaseChangeLevel, string>> = {
  KR: { MAJOR: '주요', MINOR: '일반', PATCH: '미세' },
  US: { MAJOR: 'Major', MINOR: 'Minor', PATCH: 'Patch' },
  JP: { MAJOR: 'メジャー', MINOR: 'マイナー', PATCH: 'パッチ' },
  CH: { MAJOR: '主要', MINOR: '一般', PATCH: '微调' },
  TH: { MAJOR: 'หลัก', MINOR: 'ทั่วไป', PATCH: 'เล็กน้อย' },
};

const LOCALES: ReleaseLocale[] = ['KR', 'US', 'JP', 'CH', 'TH'];

export function buildAutoReleaseI18n(input: {
  entityType: string;
  action: AdminChangeAction;
  changeLevel: ReleaseChangeLevel;
  entityLabel?: string | null;
  adminName: string;
  adminEmail: string;
}): ReleaseI18nText {
  const result = {} as ReleaseI18nText;
  for (const loc of LOCALES) {
    const area = ENTITY_LABEL[loc][input.entityType] ?? input.entityType;
    const verb = ACTION_VERB[loc][input.action];
    const level = LEVEL_LABEL[loc][input.changeLevel];
    const target = input.entityLabel?.trim();
    result[loc] = {
      title: `${area} ${verb.title} (${level})`,
      description: target
        ? `${verb.desc}: ${target} — ${input.adminName} (${input.adminEmail})`
        : `${verb.desc} — ${input.adminName} (${input.adminEmail})`,
    };
  }
  return result;
}

export function pickReleaseText(
  i18n: ReleaseI18nText | null | undefined,
  locale: ReleaseLocale,
  fallbackTitle?: string | null,
  fallbackDescription?: string | null,
): { title: string; description: string } {
  const entry = i18n?.[locale] ?? i18n?.KR;
  return {
    title: entry?.title ?? fallbackTitle ?? '—',
    description: entry?.description ?? fallbackDescription ?? '—',
  };
}

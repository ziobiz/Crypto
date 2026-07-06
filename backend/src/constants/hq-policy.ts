/** PG 본사정책 허브와 동일한 메뉴·권한 체계 (Crypto Workflow) */

export const HQ_PERMISSION_LEVELS = ['NONE', 'VIEW', 'MODIFY', 'DELETE'] as const;
export type HqPermissionLevel = (typeof HQ_PERMISSION_LEVELS)[number];

export const HQ_ORG_LEVELS = [
  'HEAD_OFFICE',
  'MASTER_DISTRIBUTOR',
  'REGIONAL_BRANCH',
  'AGENCY',
  'SALES_OFFICE',
] as const;

export type HqOrgLevel = (typeof HQ_ORG_LEVELS)[number];

/** 사이드바·본사권한설정 공통 페이지 카탈로그 */
export const HQ_PAGE_CATALOG = [
  { path: '/dashboard', label: '대시보드', group: '업무' },
  { path: '/dashboard/usdt', label: 'USDT 매입', group: '업무' },
  { path: '/dashboard/escrow', label: '무역 에스크로', group: '업무' },
  { path: '/dashboard/ledger', label: '수수료 장부', group: '업무' },
  { path: '/dashboard/wallets', label: '내 지갑', group: '업무' },
  { path: '/dashboard/users', label: '사용자관리', group: '사용자관리' },
  { path: '/dashboard/hq-policy/access', label: '접근·권한', group: '본사정책' },
  { path: '/dashboard/hq-policy/org-columns', label: '조직·화면', group: '본사정책' },
  { path: '/dashboard/hq-policy/commission', label: '수수료·리스크', group: '본사정책' },
  { path: '/dashboard/hq-policy/platform', label: '플랫폼', group: '본사정책' },
] as const;

/** 그리드 열 카탈로그 (조직항목설정) */
export const HQ_VIEW_COLUMN_CATALOG: Record<
  string,
  { key: string; label: string; fixed?: boolean }[]
> = {
  '/dashboard/usdt': [
    { key: 'ticketNo', label: '티켓번호', fixed: true },
    { key: 'status', label: '상태' },
    { key: 'customer', label: '고객' },
    { key: 'amount', label: '금액' },
    { key: 'currency', label: '통화' },
    { key: 'createdAt', label: '신청일' },
    { key: 'updatedAt', label: '최종변경' },
  ],
  '/dashboard/escrow': [
    { key: 'ticketNo', label: '티켓번호', fixed: true },
    { key: 'status', label: '상태' },
    { key: 'buyer', label: '구매자' },
    { key: 'seller', label: '판매자' },
    { key: 'amount', label: '거래금액' },
    { key: 'commissionPool', label: '수수료 풀' },
    { key: 'createdAt', label: '신청일' },
  ],
  '/dashboard/ledger': [
    { key: 'settledAt', label: '정산일', fixed: true },
    { key: 'organization', label: '조직' },
    { key: 'amount', label: '수수료' },
    { key: 'ratePercent', label: '요율' },
    { key: 'ticketNo', label: '티켓번호' },
  ],
};

export const HQ_CONFIG_KEYS = {
  accessMatrix: 'hq.access.matrix',
  orgColumns: 'hq.org_columns',
  commissionRisk: 'hq.commission.risk',
  platform: 'hq.platform.domains',
  emailOtp: 'hq.platform.email_otp',
} as const;

export type HqAccessMatrix = Record<HqOrgLevel, Record<string, HqPermissionLevel>>;

export type HqOrgColumnConfig = Record<
  string,
  Record<HqOrgLevel, { allowedKeys: string[]; order: string[] }>
>;

export type HqCommissionRiskConfig = {
  defaultGasFeeUsdt: number;
  defaultPlatformFeeUsdt: number;
  maxTicketAmountKrw: number;
  riskEnabled: boolean;
  maxDailyTicketsPerCustomer: number;
  notes?: string;
};

export type HqPlatformConfig = {
  primaryDomain: string;
  apiPublicUrl: string;
  corsOrigins: string[];
  sslCertPath?: string;
  redirectRootToPrimary: boolean;
  /** 브랜드 카드 — 사이트 이름 (로그인·헤더 표시) */
  siteName: string;
  /** 로그인 후 좌측 메뉴 상단 로고 (/api/branding/logo) */
  logoUrl?: string;
  /** 첫화면(로그인) 우측 패널 상단 로고 (/api/branding/auth-logo) — 로그인 후 로고와 별도 */
  authLogoUrl?: string;
  /** 파비콘 (/api/branding/favicon) */
  faviconUrl?: string;
  /** 로그인 첫화면 왼쪽 배경 (/api/branding/background) */
  authBackgroundUrl?: string;
  /** 왼쪽 배경 위 브랜드 문구 (줄바꿈 가능) */
  authMainText?: string;
  /** 첫화면 하단 푸터 문구 */
  footerText?: string;
  /** 로그인 패널 공지 노출 */
  loginNoticeEnabled?: boolean;
  /** 로그인 패널 공지 (다국어) */
  loginNoticeI18n?: Partial<
    Record<'KR' | 'JP' | 'US' | 'CH' | 'TH', { title: string; body: string }>
  >;
};

/** PG 본사정책 → 플랫폼 → 이메일·OTP */
export type HqEmailOtpConfig = {
  otpEnabled: boolean;
  otpForSuperAdmin: boolean;
  otpForHeadOffice: boolean;
  otpForMasterDistributor: boolean;
  otpExpireMinutes: number;
  otpEmailSubject: string;
  otpEmailBody: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromAddress: string;
  fromName: string;
  /** 거래 완료 시 고객에게 거래명세 이메일 자동 발송 */
  tradeReceiptEmailEnabled: boolean;
};

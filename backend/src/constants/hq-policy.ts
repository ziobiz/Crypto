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
  { path: '/dashboard/hq-policy/ops', label: '운영관리', group: '본사정책' },
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
  feeTiers: 'hq.commission.fee_tiers',
  exchangeRateSources: 'hq.commission.exchange_rate_sources',
  platform: 'hq.platform.domains',
  emailOtp: 'hq.platform.email_otp',
} as const;

export type HqAccessMatrix = Record<HqOrgLevel, Record<string, HqPermissionLevel>>;

export type HqOrgColumnConfig = Record<
  string,
  Record<HqOrgLevel, { allowedKeys: string[]; order: string[] }>
>;

export type CurrencyTransactionLimits = {
  /** 1회 거래 최소 금액 (0 = 제한 없음) */
  perTransactionMin: number;
  /** 1회 거래 최대 금액 (0 = 제한 없음) */
  perTransactionMax: number;
  /** 일일 누적 최소 (단일 거래 금액 하한에도 적용) */
  dailyMin: number;
  /** 일일 누적 최대 (0 = 제한 없음) */
  dailyMax: number;
  /** 월간 누적 최소 (단일 거래 금액 하한에도 적용) */
  monthlyMin: number;
  /** 월간 누적 최대 (0 = 제한 없음) */
  monthlyMax: number;
};

export type CustomerTypeLimitKey = 'INDIVIDUAL' | 'CORPORATE';

export type CustomerTransactionLimitsPolicy = Record<
  CustomerTypeLimitKey,
  Record<SymbolFeeCurrency, CurrencyTransactionLimits>
>;

export type HqCommissionRiskConfig = {
  /** FX 환전 수수료 (% — gross USDT 대비) */
  defaultFxFeePercent: number;
  /** 가스피 (USDT) */
  defaultGasFeeUsdt: number;
  /** 송금 수수료 (USDT) */
  defaultTransferFeeUsdt: number;
  /** 기타 수수료 (USDT) */
  defaultOtherFeeUsdt: number;
  /** USDT 매입 수수료·비용 도식 표시 항목 */
  feeDiagramDisplay?: FeeDiagramDisplayConfig;
  /** @deprecated — transactionLimits 로 이전 */
  maxTicketAmountKrw: number;
  riskEnabled: boolean;
  maxDailyTicketsPerCustomer: number;
  /** 개인·법인별 통화 거래 한도 */
  transactionLimits: CustomerTransactionLimitsPolicy;
  notes?: string;
  /** @deprecated — defaultTransferFeeUsdt 로 이전 */
  defaultPlatformFeeUsdt?: number;
};

export type TransactionFees = {
  fxFeePercent: number;
  gasFeeUsdt: number;
  transferFeeUsdt: number;
  otherFeeUsdt: number;
};

/** USDT 매입 수수료·비용 도식 — 항목별 표시 여부 */
export type FeeDiagramDisplayConfig = {
  gross: boolean;
  fxFee: boolean;
  gasFee: boolean;
  transferFee: boolean;
  otherFee: boolean;
  localPremium: boolean;
  net: boolean;
  requiredFiat: boolean;
  /** 도식 중앙 수수료율 열 */
  showRates: boolean;
};

export const DEFAULT_FEE_DIAGRAM_DISPLAY: FeeDiagramDisplayConfig = {
  gross: true,
  fxFee: true,
  gasFee: true,
  transferFee: true,
  otherFee: true,
  localPremium: true,
  net: true,
  requiredFiat: true,
  showRates: true,
};

export const IDLE_TIMEOUT_MINUTES_OPTIONS = [10, 30, 60, 90, 120] as const;
export type IdleTimeoutMinutes = (typeof IDLE_TIMEOUT_MINUTES_OPTIONS)[number];

/** 시볼(티켓) 수수료 — 통화·금액 구간별 (PG 수수료정책 표) */
export const SYMBOL_FEE_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY', 'USD'] as const;
export type SymbolFeeCurrency = (typeof SYMBOL_FEE_CURRENCIES)[number];

export type SymbolFeeTierRow = {
  id: string;
  currency: SymbolFeeCurrency;
  /** 해당 통화 기준 금액 이하 구간 */
  maxAmount: number;
  fxFeePercent: number;
  gasFeeUsdt: number;
  transferFeeUsdt: number;
  otherFeeUsdt: number;
};

export type SymbolFeeTierPolicy = SymbolFeeTierRow[];

/** USDT 매입·표시용 통화별 기준가 소스 (PG 수수료정책 — 기준가) */
export const EXCHANGE_RATE_SOURCES = [
  'coingecko',
  'exchangerate_api',
  'binance_cross',
  'binance_global',
  'binance_th',
  'bybit_cross',
  'kraken_book',
  'upbit',
  'kr_domestic',
] as const;
export type ExchangeRateSourceId = (typeof EXCHANGE_RATE_SOURCES)[number];

export type HqExchangeRateSourcePolicy = Record<SymbolFeeCurrency, ExchangeRateSourceId>;

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
  /** 고객 공개 회원가입 (오프라인 계약 가입만 허용 시 false) */
  customerRegistrationEnabled?: boolean;
  /** 미사용 자동 로그아웃 (분) — 10·30·60·90·120 */
  idleTimeoutMinutes?: number;
  /** USDT 매입 기본 구매 통화 */
  defaultUsdtFiatCurrency?: 'KRW' | 'JPY' | 'THB' | 'CNY';
  /** 고객 입금용 회사 수취 계좌 (통화별) */
  depositReceivingAccounts?: Partial<
    Record<
      'KRW' | 'JPY' | 'THB' | 'CNY',
      { bankName: string; accountNumber: string; accountHolder: string }
    >
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

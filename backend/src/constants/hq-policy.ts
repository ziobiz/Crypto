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

/** 본사권한 열: 조직 단계 + 고객사 */
export const HQ_ACCESS_ACTORS = [...HQ_ORG_LEVELS, 'CUSTOMER'] as const;
export type HqAccessActor = (typeof HQ_ACCESS_ACTORS)[number];

/** 사이드바 대메뉴와 동일한 그룹 키 (본사권한 카드 구분)
 *  main = 단독 메뉴(대시보드·USDT·에스크로·장부) 묶음
 */
export const HQ_PAGE_GROUPS = [
  'main',
  'invoices',
  'ops',
  'hqPolicy',
  'merchant',
] as const;
export type HqPageGroup = (typeof HQ_PAGE_GROUPS)[number];

/** 사이드바·본사권한설정 공통 페이지 카탈로그 */
export const HQ_PAGE_CATALOG = [
  { path: '/dashboard', label: '대시보드', group: 'main' },
  { path: '/dashboard/usdt', label: 'USDT 매입', group: 'main' },
  { path: '/dashboard/escrow', label: '무역 에스크로', group: 'main' },
  { path: '/dashboard/ledger', label: '수수료 장부', group: 'main' },
  { path: '/dashboard/invoices/live', label: '인보이스 실거래', group: 'invoices' },
  { path: '/dashboard/invoices/official', label: '인보이스 공식거래', group: 'invoices' },
  { path: '/dashboard/invoices/simulator', label: '인보이스 시뮬레이터', group: 'invoices' },
  { path: '/dashboard/customers', label: '고객관리', group: 'ops' },
  { path: '/dashboard/customers/fees', label: '수수료관리', group: 'ops' },
  { path: '/dashboard/organizations', label: '조직관리', group: 'ops' },
  { path: '/dashboard/users', label: '사용자관리', group: 'ops' },
  { path: '/dashboard/operation-history', label: '기록관리', group: 'ops' },
  { path: '/dashboard/trade-receipts', label: '명세서관리', group: 'ops' },
  { path: '/dashboard/hq-policy/access', label: '접근·권한', group: 'hqPolicy' },
  { path: '/dashboard/hq-policy/org-columns', label: '조직·화면', group: 'hqPolicy' },
  { path: '/dashboard/hq-policy/commission', label: '수수료·리스크', group: 'hqPolicy' },
  { path: '/dashboard/hq-policy/accounts', label: '계좌관리', group: 'hqPolicy' },
  { path: '/dashboard/hq-policy/platform', label: '플랫폼', group: 'hqPolicy' },
  { path: '/dashboard/hq-policy/ops', label: '운영관리', group: 'hqPolicy' },
  { path: '/dashboard/hq-policy/ops/workflow', label: '진행상태·처리시한', group: 'hqPolicy' },
  { path: '/dashboard/hq-policy/deletion', label: '삭제관리', group: 'hqPolicy' },
  { path: '/dashboard/simulator', label: 'USDT 시뮬레이터', group: 'hqPolicy' },
  { path: '/dashboard/simulator-logs', label: '기록 시뮬레이터', group: 'hqPolicy' },
  { path: '/dashboard/hq-policy/cost-analysis', label: '거래분석', group: 'hqPolicy' },
  { path: '/dashboard/hq-policy/profit-analysis', label: '수익분석', group: 'hqPolicy' },
  { path: '/dashboard/kyc', label: '인증센터', group: 'merchant' },
  { path: '/dashboard/wallets', label: '내 지갑', group: 'merchant' },
  { path: '/dashboard/merchant-users', label: '가맹점 사용자관리', group: 'merchant' },
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
    { key: 'expectedComplete', label: '예상완료일' },
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
    { key: 'expectedComplete', label: '예상완료일' },
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
  icopay: 'hq.platform.icopay',
  cardPayment: 'hq.payment.card',
  /** Fukugu/CURFEX 일본 이체 Collection (고정계좌 대체 옵션) */
  curfex: 'hq.payment.curfex',
  deletion: 'hq.deletion.policy',
  orgShare: 'hq.commission.org_share',
  gasNetworks: 'hq.commission.gas_networks',
  currencyAmountDisplay: 'hq.commission.currency_amount_display',
  /** USDT 시뮬레이터 전용 수수료·리스크 (실거래와 분리) */
  simulatorCommissionRisk: 'hq.commission.simulator_risk',
  simulatorFeeTiers: 'hq.commission.simulator_fee_tiers',
  workflowDisplay: 'hq.workflow.display',
  /** 고정계좌 USDT 견적 응답(자동/수동·대기시간) */
  usdtQuoteResponse: 'hq.usdt.quote_response',
  /** EXPRESS 추가 수수료 (개인/법인) */
  expressFee: 'hq.commission.express_fee',
  /** 회원 등급(개인·법인 공통) EXPRESS 보너스 */
  memberGrade: 'hq.commission.member_grade',
} as const;

/** 자동 확정 지연(분). 0 = 즉시 */
export const USDT_QUOTE_AUTO_DELAY_MINUTES = [
  0, 1, 3, 5, 10, 30, 60, 180, 360, 720, 1440, 2880, 4320,
] as const;
export type UsdtQuoteAutoDelayMinutes = (typeof USDT_QUOTE_AUTO_DELAY_MINUTES)[number];

/** 수동 모드 SLA 목표(시간) */
export const USDT_QUOTE_MANUAL_SLA_HOURS = [3, 6, 12, 24] as const;
export type UsdtQuoteManualSlaHours = (typeof USDT_QUOTE_MANUAL_SLA_HOURS)[number];

export type HqUsdtQuoteResponsePolicy = {
  /** 고정계좌 이체에 견적 확정 흐름 사용 */
  enabled: boolean;
  mode: 'AUTO' | 'MANUAL';
  autoDelayMinutes: UsdtQuoteAutoDelayMinutes;
  manualSlaHours: UsdtQuoteManualSlaHours;
  /** 신청 페이지 무동작(분) → USDT 목록 회귀 */
  applyIdleMinutes: number;
  /** 신청 페이지 최대 체류(분) — 수수료 변동 방지 */
  applyMaxMinutes: number;
  /** 견적 확정 후 유효·처리 기한(분). 초과 시 자동 종료·일일 1회 소진 */
  quoteValidMinutes: number;
};

export function defaultUsdtQuoteResponsePolicy(): HqUsdtQuoteResponsePolicy {
  return {
    enabled: true,
    mode: 'AUTO',
    autoDelayMinutes: 0,
    manualSlaHours: 3,
    applyIdleMinutes: 5,
    applyMaxMinutes: 10,
    quoteValidMinutes: 20,
  };
}

function clampTimerMinutes(n: unknown, fallback: number, min: number, max: number): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

export function normalizeUsdtQuoteResponsePolicy(
  raw: Partial<HqUsdtQuoteResponsePolicy> | null | undefined,
): HqUsdtQuoteResponsePolicy {
  const base = defaultUsdtQuoteResponsePolicy();
  if (!raw) return base;
  const delay = Number(raw.autoDelayMinutes);
  const sla = Number(raw.manualSlaHours);
  return {
    enabled: raw.enabled !== false,
    mode: raw.mode === 'MANUAL' ? 'MANUAL' : 'AUTO',
    autoDelayMinutes: (USDT_QUOTE_AUTO_DELAY_MINUTES as readonly number[]).includes(delay)
      ? (delay as UsdtQuoteAutoDelayMinutes)
      : base.autoDelayMinutes,
    manualSlaHours: (USDT_QUOTE_MANUAL_SLA_HOURS as readonly number[]).includes(sla)
      ? (sla as UsdtQuoteManualSlaHours)
      : base.manualSlaHours,
    applyIdleMinutes: clampTimerMinutes(raw.applyIdleMinutes, base.applyIdleMinutes, 1, 60),
    applyMaxMinutes: clampTimerMinutes(raw.applyMaxMinutes, base.applyMaxMinutes, 1, 120),
    quoteValidMinutes: clampTimerMinutes(raw.quoteValidMinutes, base.quoteValidMinutes, 1, 240),
  };
}

export type HqOrgShareSlice = {
  /** 수수료 풀에서 가져가는 비율 (%) */
  poolPercent: number;
  /** 건당 고정 (USDT) */
  perTicketUsdt: number;
};

export type HqOrgShareByType = Record<HqOrgLevel, HqOrgShareSlice>;

export type HqOrgSharePolicy = {
  /** 에스크로 고객 부담 수수료율 (% of 거래금액). USDT 매입은 티켓 수수료 스냅샷 풀 사용 */
  escrowFeePercent: number;
  escrowPerTicketUsdt: number;
  USDT_PURCHASE: HqOrgShareByType;
  TRADE_ESCROW: HqOrgShareByType;
};

export function defaultOrgShareSlice(): HqOrgShareSlice {
  return { poolPercent: 0, perTicketUsdt: 0 };
}

export function defaultOrgShareByType(): HqOrgShareByType {
  return {
    HEAD_OFFICE: { poolPercent: 40, perTicketUsdt: 0 },
    MASTER_DISTRIBUTOR: { poolPercent: 25, perTicketUsdt: 0 },
    REGIONAL_BRANCH: { poolPercent: 15, perTicketUsdt: 0 },
    AGENCY: { poolPercent: 12, perTicketUsdt: 0 },
    SALES_OFFICE: { poolPercent: 8, perTicketUsdt: 0 },
  };
}

export function defaultOrgSharePolicy(): HqOrgSharePolicy {
  return {
    escrowFeePercent: 1.5,
    escrowPerTicketUsdt: 0,
    USDT_PURCHASE: defaultOrgShareByType(),
    TRADE_ESCROW: {
      HEAD_OFFICE: { poolPercent: 0.6, perTicketUsdt: 0 },
      MASTER_DISTRIBUTOR: { poolPercent: 0.375, perTicketUsdt: 0 },
      REGIONAL_BRANCH: { poolPercent: 0.225, perTicketUsdt: 0 },
      AGENCY: { poolPercent: 0.18, perTicketUsdt: 0 },
      SALES_OFFICE: { poolPercent: 0.12, perTicketUsdt: 0 },
    },
  };
}

/** 운영수수료 = %분 + 고정분 (둘 다 있으면 합산) */
export function computeOperatingFeeUsdt(
  baseAmountUsdt: number,
  percent: number,
  fixedUsdt: number,
): number {
  const fromPct = percent > 0 ? (baseAmountUsdt * percent) / 100 : 0;
  const fromFixed = fixedUsdt > 0 ? fixedUsdt : 0;
  return Number((fromPct + fromFixed).toFixed(8));
}

export function roundShareTotal(n: number): number {
  return Number(n.toFixed(4));
}

export function sumOrgShareTable(byType: HqOrgShareByType): { poolPercent: number; perTicketUsdt: number } {
  let poolPercent = 0;
  let perTicketUsdt = 0;
  for (const level of HQ_ORG_LEVELS) {
    const slice = byType[level] ?? { poolPercent: 0, perTicketUsdt: 0 };
    poolPercent += Number(slice.poolPercent) || 0;
    perTicketUsdt += Number(slice.perTicketUsdt) || 0;
  }
  return { poolPercent: roundShareTotal(poolPercent), perTicketUsdt: roundShareTotal(perTicketUsdt) };
}

export function escrowShareTotalsMatch(share: {
  escrowFeePercent: number;
  escrowPerTicketUsdt: number;
  TRADE_ESCROW: HqOrgShareByType;
}): { ok: boolean; expectedPct: number; actualPct: number; expectedUsdt: number; actualUsdt: number } {
  const expectedPct = roundShareTotal(Number(share.escrowFeePercent) || 0);
  const expectedUsdt = roundShareTotal(Number(share.escrowPerTicketUsdt) || 0);
  const actual = sumOrgShareTable(share.TRADE_ESCROW);
  return {
    ok: actual.poolPercent === expectedPct && actual.perTicketUsdt === expectedUsdt,
    expectedPct,
    actualPct: actual.poolPercent,
    expectedUsdt,
    actualUsdt: actual.perTicketUsdt,
  };
}

export function assertEscrowShareTotals(share: {
  escrowFeePercent: number;
  escrowPerTicketUsdt: number;
  TRADE_ESCROW: HqOrgShareByType;
}): void {
  const check = escrowShareTotalsMatch(share);
  if (check.ok) return;
  throw new Error(
    `ESCROW_SHARE_MISMATCH:${check.expectedPct}:${check.actualPct}:${check.expectedUsdt}:${check.actualUsdt}`,
  );
}

/** 무역거래 단계 배분 합계를 고객 수수료 풀 값으로 맞춤 (타입 그리드 저장용) */
export function syncEscrowPoolFromShares(policy: HqOrgSharePolicy): HqOrgSharePolicy {
  const totals = sumOrgShareTable(policy.TRADE_ESCROW);
  return {
    ...policy,
    escrowFeePercent: totals.poolPercent,
    escrowPerTicketUsdt: totals.perTicketUsdt,
  };
}

export function normalizeOrgSharePolicy(raw: Partial<HqOrgSharePolicy> | null | undefined): HqOrgSharePolicy {
  const base = defaultOrgSharePolicy();
  if (!raw) return base;
  const mergeLevel = (ticket: 'USDT_PURCHASE' | 'TRADE_ESCROW'): HqOrgShareByType => {
    const src = raw[ticket] ?? base[ticket];
    const out = { ...base[ticket] };
    for (const level of HQ_ORG_LEVELS) {
      const slice = src[level];
      out[level] = {
        poolPercent: Number(slice?.poolPercent ?? out[level].poolPercent) || 0,
        perTicketUsdt: Number(slice?.perTicketUsdt ?? out[level].perTicketUsdt) || 0,
      };
    }
    return out;
  };
  return {
    escrowFeePercent: Number(raw.escrowFeePercent ?? base.escrowFeePercent) || 0,
    escrowPerTicketUsdt: Number(raw.escrowPerTicketUsdt ?? base.escrowPerTicketUsdt) || 0,
    USDT_PURCHASE: mergeLevel('USDT_PURCHASE'),
    TRADE_ESCROW: mergeLevel('TRADE_ESCROW'),
  };
}

export type CustomerFeeShare = {
  escrowFeePercent: number;
  escrowPerTicketUsdt: number;
  USDT_PURCHASE: HqOrgShareByType;
  TRADE_ESCROW: HqOrgShareByType;
};

export function defaultCustomerFeeShare(policy?: HqOrgSharePolicy | null): CustomerFeeShare {
  const p = normalizeOrgSharePolicy(policy);
  return {
    escrowFeePercent: p.escrowFeePercent,
    escrowPerTicketUsdt: p.escrowPerTicketUsdt,
    USDT_PURCHASE: { ...p.USDT_PURCHASE },
    TRADE_ESCROW: { ...p.TRADE_ESCROW },
  };
}

export function customerFeeShareEquals(a: CustomerFeeShare, b: CustomerFeeShare): boolean {
  if (Number(a.escrowFeePercent) !== Number(b.escrowFeePercent)) return false;
  if (Number(a.escrowPerTicketUsdt) !== Number(b.escrowPerTicketUsdt)) return false;
  for (const ticket of ['USDT_PURCHASE', 'TRADE_ESCROW'] as const) {
    for (const level of HQ_ORG_LEVELS) {
      const x = a[ticket][level];
      const y = b[ticket][level];
      if (Number(x.poolPercent) !== Number(y.poolPercent)) return false;
      if (Number(x.perTicketUsdt) !== Number(y.perTicketUsdt)) return false;
    }
  }
  return true;
}

export function persistableCustomerFeeShare(
  raw: unknown,
  policy?: HqOrgSharePolicy | null,
): CustomerFeeShare | null {
  const normalized = normalizeCustomerFeeShare(raw, policy);
  const def = defaultCustomerFeeShare(policy);
  return customerFeeShareEquals(normalized, def) ? null : normalized;
}

export function normalizeCustomerFeeShare(
  raw: unknown,
  policy?: HqOrgSharePolicy | null,
): CustomerFeeShare {
  const base = defaultCustomerFeeShare(policy);
  if (!raw || typeof raw !== 'object') return base;
  const src = raw as Partial<CustomerFeeShare>;
  const merge = (ticket: 'USDT_PURCHASE' | 'TRADE_ESCROW'): HqOrgShareByType => {
    const out = { ...base[ticket] };
    const part = src[ticket];
    if (!part) return out;
    for (const level of HQ_ORG_LEVELS) {
      const slice = part[level];
      out[level] = {
        poolPercent: Number(slice?.poolPercent ?? out[level].poolPercent) || 0,
        perTicketUsdt: Number(slice?.perTicketUsdt ?? out[level].perTicketUsdt) || 0,
      };
    }
    return out;
  };
  return {
    escrowFeePercent:
      src.escrowFeePercent === undefined || src.escrowFeePercent === null
        ? base.escrowFeePercent
        : Number(src.escrowFeePercent) || 0,
    escrowPerTicketUsdt:
      src.escrowPerTicketUsdt === undefined || src.escrowPerTicketUsdt === null
        ? base.escrowPerTicketUsdt
        : Number(src.escrowPerTicketUsdt) || 0,
    USDT_PURCHASE: merge('USDT_PURCHASE'),
    TRADE_ESCROW: merge('TRADE_ESCROW'),
  };
}

export type HqDeletionPolicy = {
  userRetentionMonths: number;
  orgRetentionMonths: number;
};

export const DEFAULT_DELETION_POLICY: HqDeletionPolicy = {
  userRetentionMonths: 3,
  orgRetentionMonths: 3,
};

export type HqAccessMatrix = Record<HqAccessActor, Record<string, HqPermissionLevel>>;

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

/** USDT 기준 1회 한도 리스크 타입 (MAX RISK = XR) */
export const USDT_RISK_LIMIT_TIERS = ['LR', 'MR', 'HR', 'XR', 'SR'] as const;
export type UsdtRiskLimitTier = (typeof USDT_RISK_LIMIT_TIERS)[number];
/** 고객 선택: 본사 5종 또는 직접입력(ML) */
export type UsdtRiskLimitCode = UsdtRiskLimitTier | 'ML';

export type UsdtRiskLimitBand = {
  /** 1회 최소 USDT (0 = 제한 없음) */
  minUsdt: number;
  /** 1회 최대 USDT (0 = 제한 없음) */
  maxUsdt: number;
};

export type HqUsdtRiskLimitTiers = Record<UsdtRiskLimitTier, UsdtRiskLimitBand>;

export const DEFAULT_USDT_RISK_LIMIT_TIERS: HqUsdtRiskLimitTiers = {
  LR: { minUsdt: 100, maxUsdt: 3_000 },
  MR: { minUsdt: 100, maxUsdt: 10_000 },
  HR: { minUsdt: 100, maxUsdt: 30_000 },
  XR: { minUsdt: 100, maxUsdt: 100_000 },
  SR: { minUsdt: 100, maxUsdt: 500_000 },
};

export function normalizeUsdtRiskLimitBand(
  raw?: Partial<UsdtRiskLimitBand> | null,
  fallback?: UsdtRiskLimitBand,
): UsdtRiskLimitBand {
  const base = fallback ?? { minUsdt: 0, maxUsdt: 0 };
  const minUsdt = Math.max(0, Number(raw?.minUsdt ?? base.minUsdt) || 0);
  const maxUsdt = Math.max(0, Number(raw?.maxUsdt ?? base.maxUsdt) || 0);
  return {
    minUsdt,
    maxUsdt: maxUsdt > 0 && minUsdt > 0 && maxUsdt < minUsdt ? minUsdt : maxUsdt,
  };
}

export function normalizeHqUsdtRiskLimitTiers(
  raw?: Partial<Record<string, Partial<UsdtRiskLimitBand>>> | null,
): HqUsdtRiskLimitTiers {
  const out = {} as HqUsdtRiskLimitTiers;
  for (const tier of USDT_RISK_LIMIT_TIERS) {
    out[tier] = normalizeUsdtRiskLimitBand(raw?.[tier], DEFAULT_USDT_RISK_LIMIT_TIERS[tier]);
  }
  return out;
}

export function normalizeUsdtRiskLimitCode(raw?: string | null): UsdtRiskLimitCode {
  if (raw === 'ML') return 'ML';
  if ((USDT_RISK_LIMIT_TIERS as readonly string[]).includes(raw ?? '')) {
    return raw as UsdtRiskLimitTier;
  }
  return 'MR';
}

export type FeeMode = 'percent' | 'fixed';

export type HqCommissionRiskConfig = {
  /** FX 환전 수수료 (% — gross USDT 대비) */
  defaultFxFeePercent: number;
  defaultFxFeeUsdt?: number;
  defaultFxFeeMode?: FeeMode;
  /** 가스피 (USDT) */
  defaultGasFeeUsdt: number;
  defaultGasFeePercent?: number;
  defaultGasFeeMode?: FeeMode;
  /** 송금 수수료 (USDT) */
  defaultTransferFeeUsdt: number;
  defaultTransferFeePercent?: number;
  defaultTransferFeeMode?: FeeMode;
  /** 기타 수수료 (USDT) */
  defaultOtherFeeUsdt: number;
  defaultOtherFeePercent?: number;
  defaultOtherFeeMode?: FeeMode;
  /** USDT 매입 수수료·비용 도식 표시 항목 (LIVE) — 고객용 */
  feeDiagramDisplay?: FeeDiagramDisplayConfig;
  /** 시뮬레이터 SAND 전용 도식 (미설정 시 LIVE 복제) — 고객용 */
  sandboxFeeDiagramDisplay?: FeeDiagramDisplayConfig;
  /** 본사·운영자용 LIVE 도식 (기본 전부 전부 ON) */
  hqFeeDiagramDisplay?: FeeDiagramDisplayConfig;
  /** 본사·운영자용 Sandbox 도식 */
  hqSandboxFeeDiagramDisplay?: FeeDiagramDisplayConfig;
  /** 총 수수료(합계·항목) 화면 노출 — LIVE·Sandbox 공통. 기본 true */
  showTotalFee?: boolean;
  /** USDT 기준 리스크 한도 5종 (LR/MR/HR/XR/SR) */
  usdtRiskLimitTiers?: HqUsdtRiskLimitTiers;
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
  fxFeeMode: FeeMode;
  fxFeePercent: number;
  fxFeeUsdt: number;
  gasFeeMode: FeeMode;
  gasFeePercent: number;
  gasFeeUsdt: number;
  transferFeeMode: FeeMode;
  transferFeePercent: number;
  transferFeeUsdt: number;
  otherFeeMode: FeeMode;
  otherFeePercent: number;
  otherFeeUsdt: number;
};

/** USDT 출금 네트워크별 가스피 (고정 USDT) */
export const GAS_NETWORK_CODES = ['TRC20', 'ERC20', 'BEP20', 'POLYGON', 'ARBITRUM', 'SOL'] as const;
export type GasNetworkCode = (typeof GAS_NETWORK_CODES)[number];

export const GAS_FEE_GROUPS = ['DEFAULT', 'A', 'B', 'C'] as const;
export type GasFeeGroupId = (typeof GAS_FEE_GROUPS)[number];

export type HqGasNetworkFees = Record<GasFeeGroupId, number>;

export type HqGasNetworkRow = {
  code: GasNetworkCode;
  fees: HqGasNetworkFees;
};

export type HqGasNetworkPolicy = {
  activeGroup: GasFeeGroupId;
  networks: HqGasNetworkRow[];
};

const DEFAULT_GAS_FEES: Record<GasNetworkCode, number> = {
  TRC20: 1,
  ERC20: 8,
  BEP20: 0.5,
  POLYGON: 0.3,
  ARBITRUM: 0.5,
  SOL: 1,
};

function emptyGroupFees(base: number): HqGasNetworkFees {
  const n = Number.isFinite(base) && base >= 0 ? Number(base.toFixed(8)) : 0;
  return { DEFAULT: n, A: 0, B: 0, C: 0 };
}

function parseFee(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Number(n.toFixed(8));
}

export function defaultGasNetworkPolicy(): HqGasNetworkPolicy {
  return {
    activeGroup: 'DEFAULT',
    networks: GAS_NETWORK_CODES.map((code) => ({
      code,
      fees: emptyGroupFees(DEFAULT_GAS_FEES[code]),
    })),
  };
}

export function normalizeGasNetworkPolicy(raw: unknown): HqGasNetworkPolicy {
  const defaults = defaultGasNetworkPolicy();
  const byCode = new Map(defaults.networks.map((n) => [n.code, n.fees]));
  let activeGroup: GasFeeGroupId = 'DEFAULT';
  if (raw && typeof raw === 'object') {
    const obj = raw as Partial<HqGasNetworkPolicy> & { networks?: unknown[] };
    const ag = String(obj.activeGroup ?? '').toUpperCase();
    if ((GAS_FEE_GROUPS as readonly string[]).includes(ag)) activeGroup = ag as GasFeeGroupId;
    if (Array.isArray(obj.networks)) {
      for (const row of obj.networks) {
        const rec = row as {
          code?: string;
          gasFeeUsdt?: unknown;
          fees?: Partial<HqGasNetworkFees>;
        };
        const code = String(rec?.code ?? '') as GasNetworkCode;
        if (!(GAS_NETWORK_CODES as readonly string[]).includes(code)) continue;
        const legacy = parseFee(rec.gasFeeUsdt, DEFAULT_GAS_FEES[code]);
        const prev = byCode.get(code) ?? emptyGroupFees(legacy);
        byCode.set(code, {
          DEFAULT: parseFee(rec.fees?.DEFAULT, rec.fees ? prev.DEFAULT : legacy),
          A: parseFee(rec.fees?.A, 0),
          B: parseFee(rec.fees?.B, 0),
          C: parseFee(rec.fees?.C, 0),
        });
      }
    }
  }
  return {
    activeGroup,
    networks: GAS_NETWORK_CODES.map((code) => ({
      code,
      fees: byCode.get(code) ?? emptyGroupFees(DEFAULT_GAS_FEES[code]),
    })),
  };
}

export function gasFeeUsdtForNetwork(
  policy: HqGasNetworkPolicy,
  network: string | null | undefined,
  fallback: number,
): number {
  const code = String(network ?? '').toUpperCase();
  const row = policy.networks.find((n) => n.code === code);
  if (!row) return Math.max(0, fallback);
  const fee = row.fees[policy.activeGroup];
  if (Number.isFinite(fee) && fee >= 0) return fee;
  return Math.max(0, fallback);
}

/** HQ 기본 청구방식 (본사설정따름이 가리키는 값) — FOLLOW_HQ 제외 */
export type FeeBillingPresentation = 'INTEGRATED' | 'ITEMIZED' | 'HYBRID';

/** 고객 프로필 청구방식 (FOLLOW_HQ 포함) */
export type FeeBillingMethod = 'FOLLOW_HQ' | FeeBillingPresentation;

/** USDT 매입 수수료·비용 도식 — 항목별 표시 여부 */
export type FeeDiagramDisplayConfig = {
  gross: boolean;
  fxFee: boolean;
  gasFee: boolean;
  transferFee: boolean;
  otherFee: boolean;
  localPremium: boolean;
  /** 운영수수료(합계%+건당) — 표시만 제어, 정산은 항상 적용 */
  operatingFee: boolean;
  /** EXPRESS 추가 수수료 */
  expressFee: boolean;
  net: boolean;
  requiredFiat: boolean;
  /** 도식 중앙 수수료율 열 */
  showRates: boolean;
  /** 총 수수료(합계·항목별) 금액 줄 표시. false면 수령·입금액·환율만 */
  showTotalFee: boolean;
  /** 본사 기본 청구방식 (통합/개별/하이브리드) */
  defaultFeeBillingMethod: FeeBillingPresentation;
  /** 요청에 대해 해석된 청구방식 (API가 고객·본사 기본을 반영해 채움) */
  billingMethod?: FeeBillingPresentation;
};

export const DEFAULT_FEE_DIAGRAM_DISPLAY: FeeDiagramDisplayConfig = {
  gross: true,
  fxFee: true,
  gasFee: true,
  transferFee: true,
  otherFee: true,
  localPremium: true,
  operatingFee: true,
  expressFee: true,
  net: true,
  requiredFiat: true,
  showRates: true,
  showTotalFee: true,
  defaultFeeBillingMethod: 'ITEMIZED',
};

/** EXPRESS 빠른 완료 추가 수수료 등급 */
export const EXPRESS_TIERS = [
  'ULTRA',
  'PRIORITY',
  'HALF',
  'DAY',
  'T1',
  'T2',
  'BASIC',
] as const;
export type ExpressTier = (typeof EXPRESS_TIERS)[number];

export type ExpressFeeMode = 'FOLLOW_HQ' | 'CUSTOM' | 'DISABLED';

/**
 * 등급별 SLA 상한(시간).
 * ULTRA~DAY: 벽시계 시간. T1/T2/BASIC: T+N일 ≈ N×24h (DAY 24h와 구분되도록 T1부터 48h).
 */
export const EXPRESS_TIER_MAX_HOURS: Record<ExpressTier, number> = {
  ULTRA: 1,
  PRIORITY: 6,
  HALF: 12,
  DAY: 24,
  T1: 48,
  T2: 72,
  BASIC: 96,
};

export type ExpressTierFeeConfig = {
  /** null = 미설정. BASIC은 활성 시 0으로 취급(퍼센트도 없으면) */
  feeUsdt: number | null;
  /** null = 미사용. gross USDT 대비 % */
  feePercent: number | null;
  /** 등급별 사용 여부. false면 EXPRESS 전체 활성이어도 신청에 미노출. 수수료 값은 유지 */
  enabled: boolean;
};

export type HqExpressCustomerTypePolicy = {
  enabled: boolean;
  tiers: Record<ExpressTier, ExpressTierFeeConfig>;
};

export type HqExpressPolicy = Record<CustomerTypeLimitKey, HqExpressCustomerTypePolicy>;

export type ExpressTierOption = {
  tier: ExpressTier;
  feeUsdt: number;
  feePercent: number;
  maxHours: number;
};

export type ResolvedExpressSelection = {
  enabled: boolean;
  tier: ExpressTier;
  feeUsdt: number;
  feePercent: number;
  maxHours: number;
  source: 'HQ' | 'CUSTOM' | 'DISABLED';
  customerType: CustomerTypeLimitKey;
  options: ExpressTierOption[];
  policySnapshot: HqExpressCustomerTypePolicy;
};

function hasExpressTierFeeValues(cfg: ExpressTierFeeConfig | undefined, tier: ExpressTier): boolean {
  if (tier === 'BASIC') return true;
  const fixed = cfg?.feeUsdt;
  const pct = cfg?.feePercent;
  const hasFixed = fixed != null && Number.isFinite(fixed) && fixed >= 0;
  const hasPct = pct != null && Number.isFinite(pct) && pct >= 0;
  return hasFixed || hasPct;
}

/** 티어별 사용(관리). 구데이터는 수수료 유무로 추론 */
export function isExpressTierEnabled(
  cfg: ExpressTierFeeConfig | undefined,
  tier: ExpressTier,
): boolean {
  if (cfg && typeof cfg.enabled === 'boolean') return cfg.enabled;
  return hasExpressTierFeeValues(cfg, tier);
}

/** @deprecated isExpressTierEnabled 사용 — 신청 노출 = 티어 사용(관리) */
export function isExpressTierConfigured(
  cfg: ExpressTierFeeConfig | undefined,
  tier: ExpressTier,
): boolean {
  return isExpressTierEnabled(cfg, tier);
}

export function expressMaxHours(tier: ExpressTier): number {
  return EXPRESS_TIER_MAX_HOURS[tier];
}

export function expressDeadlineAt(startedAt: Date, tier: ExpressTier): Date {
  return new Date(startedAt.getTime() + expressMaxHours(tier) * 3_600_000);
}

export function defaultExpressCustomerTypePolicy(): HqExpressCustomerTypePolicy {
  const tiers = {} as Record<ExpressTier, ExpressTierFeeConfig>;
  for (const tier of EXPRESS_TIERS) {
    tiers[tier] = {
      feeUsdt: tier === 'BASIC' ? 0 : null,
      feePercent: null,
      enabled: tier === 'BASIC',
    };
  }
  return { enabled: false, tiers };
}

export function defaultExpressPolicy(): HqExpressPolicy {
  return {
    INDIVIDUAL: defaultExpressCustomerTypePolicy(),
    CORPORATE: defaultExpressCustomerTypePolicy(),
  };
}

export function normalizeExpressTier(raw?: string | null): ExpressTier | null {
  const v = String(raw ?? '').toUpperCase();
  if ((EXPRESS_TIERS as readonly string[]).includes(v)) return v as ExpressTier;
  if (v === 'PIRORITY') return 'PRIORITY';
  return null;
}

export function normalizeExpressFeeMode(raw?: string | null): ExpressFeeMode {
  const v = String(raw ?? 'FOLLOW_HQ').toUpperCase();
  if (v === 'CUSTOM' || v === 'DISABLED' || v === 'FOLLOW_HQ') return v;
  return 'FOLLOW_HQ';
}

function normalizeNonNegOrNull(raw: unknown, emptyAs: number | null): number | null {
  if (raw == null || (typeof raw === 'string' && raw.trim() === '')) return emptyAs;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return emptyAs;
  return Number(n.toFixed(8));
}

export function normalizeExpressCustomerTypePolicy(raw: unknown): HqExpressCustomerTypePolicy {
  const base = defaultExpressCustomerTypePolicy();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Partial<HqExpressCustomerTypePolicy> & {
    tiers?: Partial<
      Record<ExpressTier, { feeUsdt?: unknown; feePercent?: unknown; enabled?: unknown }>
    >;
  };
  const tiers = { ...base.tiers };
  for (const tier of EXPRESS_TIERS) {
    const row = obj.tiers?.[tier];
    const feeUsdt = normalizeNonNegOrNull(row?.feeUsdt, tier === 'BASIC' ? 0 : null);
    const feePercent = normalizeNonNegOrNull(row?.feePercent, null);
    const partial: ExpressTierFeeConfig = { feeUsdt, feePercent, enabled: false };
    const enabled =
      typeof row?.enabled === 'boolean'
        ? row.enabled
        : hasExpressTierFeeValues(partial, tier);
    tiers[tier] = { feeUsdt, feePercent, enabled };
  }
  return {
    enabled: Boolean(obj.enabled),
    tiers,
  };
}

export function normalizeExpressPolicy(raw: unknown): HqExpressPolicy {
  const defaults = defaultExpressPolicy();
  if (!raw || typeof raw !== 'object') return defaults;
  const obj = raw as Partial<Record<CustomerTypeLimitKey, unknown>>;
  return {
    INDIVIDUAL: normalizeExpressCustomerTypePolicy(obj.INDIVIDUAL),
    CORPORATE: normalizeExpressCustomerTypePolicy(obj.CORPORATE),
  };
}

/** 관리자 지정 회원 등급 — EXPRESS 추가 수수료는 법인·개인 각각 설정 */
export const MEMBER_GRADES = [
  'STANDARD',
  'PREMIUM',
  'VIP',
  'VVIP',
  'PRESTIGE',
  'BLACK',
] as const;
export type MemberGrade = (typeof MEMBER_GRADES)[number];

/**
 * 등급별 EXPRESS 추가 수수료(혜택).
 * - tierFees / tierFeePercents[tier]=null → 해당 고객유형 본사 EXPRESS 기본 따름
 * - number → 해당 등급 전용 고정/% (0 허용, 티어 개방 가능)
 * - discountPercent / discountUsdt → 최종 EXPRESS 수수료에서 차감
 */
export type MemberGradeExpressBenefit = {
  tierFees: Record<ExpressTier, number | null>;
  tierFeePercents: Record<ExpressTier, number | null>;
  discountPercent: number;
  discountUsdt: number;
};

export type HqMemberGradeCustomerTypePolicy = {
  grades: Record<MemberGrade, MemberGradeExpressBenefit>;
};

/** 법인·개인 각각 회원등급 EXPRESS 추가 수수료 */
export type HqMemberGradePolicy = {
  INDIVIDUAL: HqMemberGradeCustomerTypePolicy;
  CORPORATE: HqMemberGradeCustomerTypePolicy;
};

export function defaultMemberGradeBenefit(): MemberGradeExpressBenefit {
  const tierFees = {} as Record<ExpressTier, number | null>;
  const tierFeePercents = {} as Record<ExpressTier, number | null>;
  for (const tier of EXPRESS_TIERS) {
    tierFees[tier] = null;
    tierFeePercents[tier] = null;
  }
  return { tierFees, tierFeePercents, discountPercent: 0, discountUsdt: 0 };
}

/** 1차 보수안: % 할인 위주, Black만 ULTRA 0 + 소액 USDT */
export function conservativeMemberGradeBenefit(
  discountPercent: number,
  discountUsdt = 0,
  ultraFeeUsdt: number | null = null,
): MemberGradeExpressBenefit {
  const base = defaultMemberGradeBenefit();
  return {
    ...base,
    tierFees: { ...base.tierFees, ULTRA: ultraFeeUsdt },
    discountPercent: Math.min(100, Math.max(0, discountPercent)),
    discountUsdt: Math.max(0, discountUsdt),
  };
}

export function defaultMemberGradeCustomerTypePolicy(): HqMemberGradeCustomerTypePolicy {
  return {
    grades: {
      STANDARD: conservativeMemberGradeBenefit(0, 0),
      PREMIUM: conservativeMemberGradeBenefit(3, 0),
      VIP: conservativeMemberGradeBenefit(5, 0),
      VVIP: conservativeMemberGradeBenefit(8, 0),
      PRESTIGE: conservativeMemberGradeBenefit(12, 0),
      BLACK: conservativeMemberGradeBenefit(15, 1, 0),
    },
  };
}

export function defaultMemberGradePolicy(): HqMemberGradePolicy {
  // 법인·개인 동일 보수안(1차). 운영에서 유형별 따로 조정 가능.
  return {
    INDIVIDUAL: defaultMemberGradeCustomerTypePolicy(),
    CORPORATE: defaultMemberGradeCustomerTypePolicy(),
  };
}

export function normalizeMemberGrade(raw?: string | null): MemberGrade {
  const v = String(raw ?? 'STANDARD').toUpperCase();
  if ((MEMBER_GRADES as readonly string[]).includes(v)) return v as MemberGrade;
  return 'STANDARD';
}

export function normalizeMemberGradeBenefit(raw: unknown): MemberGradeExpressBenefit {
  const base = defaultMemberGradeBenefit();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Partial<MemberGradeExpressBenefit> & {
    tierFees?: Partial<Record<ExpressTier, unknown>>;
    tierFeePercents?: Partial<Record<ExpressTier, unknown>>;
  };
  const tierFees = { ...base.tierFees };
  const tierFeePercents = { ...base.tierFeePercents };
  for (const tier of EXPRESS_TIERS) {
    tierFees[tier] = normalizeNonNegOrNull(obj.tierFees?.[tier], null);
    tierFeePercents[tier] = normalizeNonNegOrNull(obj.tierFeePercents?.[tier], null);
  }
  const discountPercent = Math.min(100, Math.max(0, Number(obj.discountPercent) || 0));
  const discountUsdt = Math.max(0, Number(obj.discountUsdt) || 0);
  return { tierFees, tierFeePercents, discountPercent, discountUsdt };
}

export function normalizeMemberGradeCustomerTypePolicy(
  raw: unknown,
): HqMemberGradeCustomerTypePolicy {
  const defaults = defaultMemberGradeCustomerTypePolicy();
  if (!raw || typeof raw !== 'object') return defaults;
  const obj = raw as { grades?: Partial<Record<MemberGrade, unknown>> };
  const grades = { ...defaults.grades };
  for (const g of MEMBER_GRADES) {
    if (obj.grades?.[g] != null) {
      grades[g] = normalizeMemberGradeBenefit(obj.grades[g]);
    }
  }
  return { grades };
}

export function normalizeMemberGradePolicy(raw: unknown): HqMemberGradePolicy {
  const defaults = defaultMemberGradePolicy();
  if (!raw || typeof raw !== 'object') return defaults;
  const obj = raw as {
    grades?: Partial<Record<MemberGrade, unknown>>;
    INDIVIDUAL?: unknown;
    CORPORATE?: unknown;
  };
  // 구형식 { grades } → 법인·개인 동일 값으로 이전
  if (obj.grades != null && obj.INDIVIDUAL == null && obj.CORPORATE == null) {
    const migrated = normalizeMemberGradeCustomerTypePolicy({ grades: obj.grades });
    return {
      INDIVIDUAL: normalizeMemberGradeCustomerTypePolicy(migrated),
      CORPORATE: normalizeMemberGradeCustomerTypePolicy(migrated),
    };
  }
  return {
    INDIVIDUAL: normalizeMemberGradeCustomerTypePolicy(obj.INDIVIDUAL ?? defaults.INDIVIDUAL),
    CORPORATE: normalizeMemberGradeCustomerTypePolicy(obj.CORPORATE ?? defaults.CORPORATE),
  };
}

export type ResolvedExpressRates = {
  feeUsdt: number;
  feePercent: number;
};

/**
 * 기본 EXPRESS 고정/% + 회원등급 지정가.
 * - 등급 지정 고정/% 가 있으면 그 값, 없으면 본사 EXPRESS
 * - 둘 다 없으면 BASIC만 0/0, 그 외 null(미제공)
 * - 등급 할인(%·USDT)은 최종 금액에 적용(computeExpressFeeUsdt)
 */
export function resolveExpressRatesWithMemberGrade(
  baseFeeUsdt: number | null,
  baseFeePercent: number | null,
  benefit: MemberGradeExpressBenefit,
  tier: ExpressTier,
): ResolvedExpressRates | null {
  const overrideFixed = benefit.tierFees[tier];
  const overridePct = benefit.tierFeePercents[tier];
  let feeUsdt: number | null =
    overrideFixed != null && Number.isFinite(overrideFixed) && overrideFixed >= 0
      ? Number(overrideFixed)
      : baseFeeUsdt != null && Number.isFinite(baseFeeUsdt) && baseFeeUsdt >= 0
        ? Number(baseFeeUsdt)
        : null;
  let feePercent: number | null =
    overridePct != null && Number.isFinite(overridePct) && overridePct >= 0
      ? Number(overridePct)
      : baseFeePercent != null && Number.isFinite(baseFeePercent) && baseFeePercent >= 0
        ? Number(baseFeePercent)
        : null;
  if (feeUsdt == null && feePercent == null) {
    if (tier !== 'BASIC') return null;
    feeUsdt = 0;
    feePercent = 0;
  }
  return {
    feeUsdt: feeUsdt ?? 0,
    feePercent: feePercent ?? 0,
  };
}

/** 고정 + gross×% 후 등급 할인 적용 */
export function computeExpressFeeUsdt(
  rates: ResolvedExpressRates,
  grossUsdt: number,
  benefit?: MemberGradeExpressBenefit | null,
): number {
  const gross = Math.max(0, Number(grossUsdt) || 0);
  const raw = Math.max(0, rates.feeUsdt) + gross * (Math.max(0, rates.feePercent) / 100);
  const discPct = Math.min(100, Math.max(0, benefit?.discountPercent || 0));
  const discUsdt = Math.max(0, benefit?.discountUsdt || 0);
  return Math.max(0, Number((raw * (1 - discPct / 100) - discUsdt).toFixed(8)));
}

/** @deprecated resolveExpressRatesWithMemberGrade + computeExpressFeeUsdt 사용 */
export function resolveExpressFeeWithMemberGrade(
  baseFeeUsdt: number | null,
  benefit: MemberGradeExpressBenefit,
  tier: ExpressTier,
  baseFeePercent: number | null = null,
  grossUsdt = 0,
): number | null {
  const rates = resolveExpressRatesWithMemberGrade(baseFeeUsdt, baseFeePercent, benefit, tier);
  if (!rates) return null;
  return computeExpressFeeUsdt(rates, grossUsdt, benefit);
}

export type TotalFeeVisibility = 'FOLLOW_HQ' | 'SHOW' | 'HIDE';

export function normalizeTotalFeeVisibility(raw?: string | null): TotalFeeVisibility {
  if (raw === 'SHOW' || raw === 'HIDE' || raw === 'FOLLOW_HQ') return raw;
  return 'FOLLOW_HQ';
}

export function normalizeFeeBillingPresentation(
  raw?: string | null,
): FeeBillingPresentation {
  if (raw === 'INTEGRATED' || raw === 'HYBRID' || raw === 'ITEMIZED') return raw;
  return 'ITEMIZED';
}

export function normalizeFeeBillingMethod(raw?: string | null): FeeBillingMethod {
  if (raw === 'FOLLOW_HQ' || raw === 'INTEGRATED' || raw === 'HYBRID' || raw === 'ITEMIZED') {
    return raw;
  }
  return 'FOLLOW_HQ';
}

export const IDLE_TIMEOUT_MINUTES_OPTIONS = [10, 30, 60, 90, 120] as const;
export type IdleTimeoutMinutes = (typeof IDLE_TIMEOUT_MINUTES_OPTIONS)[number];

/** 시볼(티켓) 수수료 — 통화·금액 구간별 (PG 수수료정책 표) */
export const SYMBOL_FEE_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY', 'USD', 'EUR'] as const;
export type SymbolFeeCurrency = (typeof SYMBOL_FEE_CURRENCIES)[number];

export type SymbolFeeTierRow = {
  id: string;
  currency: SymbolFeeCurrency;
  /** 해당 통화 기준 금액 이하 구간 */
  maxAmount: number;
  fxFeeMode: FeeMode;
  fxFeePercent: number;
  fxFeeUsdt: number;
  gasFeeMode: FeeMode;
  gasFeePercent: number;
  gasFeeUsdt: number;
  transferFeeMode: FeeMode;
  transferFeePercent: number;
  transferFeeUsdt: number;
  otherFeeMode: FeeMode;
  otherFeePercent: number;
  otherFeeUsdt: number;
};

export type SymbolFeeTierPolicy = SymbolFeeTierRow[];

/** 시볼 수수료 구간 — 개인/법인 분리 (기존 단일 배열은 법인으로 마이그레이션) */
export type SymbolFeeTiersByCustomerType = Record<CustomerTypeLimitKey, SymbolFeeTierPolicy>;

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

/** USDT 매입·직접송금 수취 통화 (USD/EUR = 개인고객 직접송금 수신 계좌) */
export const USDT_FIAT_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY', 'USD', 'EUR'] as const;
export type UsdtFiatCurrency = (typeof USDT_FIAT_CURRENCIES)[number];

/** 직접송금 기본 통화 (HQ에서 확장 가능 — THB 등) */
export const DEFAULT_DIRECT_REMIT_CURRENCIES = ['USD', 'EUR'] as const;

export function normalizeDirectRemitCurrencies(
  raw?: string[] | null,
): UsdtFiatCurrency[] {
  const allowed = new Set<string>(USDT_FIAT_CURRENCIES);
  const list = Array.isArray(raw)
    ? raw.map((c) => String(c).toUpperCase()).filter((c) => allowed.has(c))
    : [];
  const uniq = [...new Set(list)] as UsdtFiatCurrency[];
  return uniq.length ? uniq : [...DEFAULT_DIRECT_REMIT_CURRENCIES];
}

export function isDirectRemitCurrency(
  currency: string,
  allowed: readonly string[] = DEFAULT_DIRECT_REMIT_CURRENCIES,
): boolean {
  return allowed.includes(String(currency).toUpperCase());
}

/** HQ·고객 UI 표시명 */
export const USDT_FIAT_CURRENCY_LABELS: Record<UsdtFiatCurrency, string> = {
  KRW: 'KRW',
  JPY: 'JPY',
  THB: 'THB',
  CNY: 'CNY',
  USD: 'USD',
  EUR: 'EUR',
};

/** USD=ACH, EUR=SEPA, 그 외=로컬 은행이체 */
export type DepositPaymentRail = 'ACH' | 'SEPA' | 'LOCAL';

export function depositPaymentRail(currency: UsdtFiatCurrency | string): DepositPaymentRail {
  if (currency === 'USD') return 'ACH';
  if (currency === 'EUR') return 'SEPA';
  return 'LOCAL';
}

export type DepositNoticeLocale = 'KR' | 'US' | 'JP' | 'CH' | 'TH';

export type DepositReceivingAccount = {
  bankName: string;
  /** ACH 계좌번호 또는 SEPA IBAN */
  accountNumber: string;
  accountHolder: string;
  /** 은행 주소 (해외·JPY 등) */
  bankAddress?: string;
  /** 은행 코드 (예: 0005) */
  bankCode?: string;
  /** 지점 코드 (예: 869) */
  branchCode?: string;
  /** 지점명 (선택) */
  branchName?: string;
  /** 계좌 유형 (예: Savings / Futsu, Business) */
  accountType?: string;
  /** 은행 국가 코드 (예: US, MT) — ACH/SEPA */
  bankCountry?: string;
  /** USD ACH routing number */
  routingNumber?: string;
  /** EUR SEPA BIC/SWIFT */
  bic?: string;
  /**
   * @deprecated 단일 언어 안내 — noticeI18n 사용 권장. 있으면 시 KR 폴백.
   */
  notice?: string;
  /** 고객 UI 언어별 중요 안내 (수취인명 복사). 수취인명 자체는 accountHolder 원문 유지 */
  noticeI18n?: Partial<Record<DepositNoticeLocale, string>>;
  /** 계좌이체 USDT 매입. 미지정 시 true */
  transferEnabled?: boolean;
  /** 카드결제 USDT 매입. 미지정 시 true */
  cardEnabled?: boolean;
  /**
   * 송금계좌(DIRECT) 모드에서 이 통화 계좌 사용 가능 여부.
   * 미지정 시 USD·EUR만 true, 그 외 false.
   */
  remittanceEnabled?: boolean;
};

/** 기본 고객 안내 — 언어별 (수취인명은 항상 半角カタカナ 원문) */
export const DEFAULT_DEPOSIT_NOTICE_I18N = (): Record<DepositNoticeLocale, string> => ({
  KR: '금액을 정상적으로 수령하려면, 수취인 이름을 정확히 복사하여 입력해야 합니다. (半角カタカナ 그대로 사용)',
  US: 'To receive the funds correctly, copy and enter the beneficiary name exactly as shown. (Use half-width katakana as-is.)',
  JP: '正常に着金するには、受取人名を表示どおり正確にコピーして入力してください。（半角カタカナのまま使用）',
  CH: '为确保正常入账，请精确复制并输入收款人姓名。（请原样使用半角片假名）',
  TH: 'เพื่อให้รับเงินได้ถูกต้อง ต้องคัดลอกและใส่ชื่อผู้รับให้ตรงตามที่แสดง (ใช้คาตาคานะแบบครึ่งความกว้างตามเดิม)',
});

/** JPY 고정 수취 계좌 기본값 (Payoneer Japan / MUFG) — HQ에서 수정·저장 가능 */
export const DEFAULT_JPY_DEPOSIT_RECEIVING_ACCOUNT = (): DepositReceivingAccount => ({
  bankName: 'MUFG Bank, Ltd.',
  bankAddress: '7-1 Marunouchi 2-Chome, Chiyoda-ku Tokyo, Japan',
  bankCode: '0005',
  branchCode: '869',
  accountType: 'Savings / Futsu',
  accountNumber: '4685448',
  accountHolder: 'ﾍﾟｲｵﾆｱ ｼﾞﾔﾊﾟﾝ(ｶ',
  noticeI18n: DEFAULT_DEPOSIT_NOTICE_I18N(),
  transferEnabled: true,
  cardEnabled: true,
  remittanceEnabled: false,
});

/** USD ACH 수취 계좌 기본값 */
export const DEFAULT_USD_ACH_DEPOSIT_RECEIVING_ACCOUNT = (): DepositReceivingAccount => ({
  bankName: 'LEAD BANK',
  accountNumber: '219202635366',
  accountHolder: 'ONTHELINE CO LTD',
  accountType: 'Business',
  bankCountry: 'US',
  routingNumber: '101019644',
  transferEnabled: true,
  cardEnabled: true,
  remittanceEnabled: true,
});

/** EUR SEPA 수취 계좌 기본값 */
export const DEFAULT_EUR_SEPA_DEPOSIT_RECEIVING_ACCOUNT = (): DepositReceivingAccount => ({
  bankName: 'OpenPayd Financial Services Malta Ltd',
  accountNumber: 'MT03CFTE28004000000000005161666',
  accountHolder: 'ONTHELINE CO LTD',
  accountType: 'Business',
  bankCountry: 'MT',
  bic: 'CFTEMTM1',
  transferEnabled: true,
  cardEnabled: true,
  remittanceEnabled: true,
});

/** 통화별 송금거래(송금계좌 모드) 기본값 — USD·EUR만 true */
export function defaultRemittanceEnabled(currency: string): boolean {
  const c = String(currency).toUpperCase();
  return c === 'USD' || c === 'EUR';
}

/** 입금 수취 계좌의 송금거래 on 통화 목록 */
export function remittanceCurrenciesFromAccounts(
  accounts?: Partial<Record<UsdtFiatCurrency, DepositReceivingAccount>> | null,
): UsdtFiatCurrency[] {
  const list = USDT_FIAT_CURRENCIES.filter((c) => {
    const a = accounts?.[c];
    if (!a) return false;
    if (a.remittanceEnabled === true) return true;
    if (a.remittanceEnabled === false) return false;
    return defaultRemittanceEnabled(c);
  });
  return list.length ? list : [...DEFAULT_DIRECT_REMIT_CURRENCIES];
}

export function resolveDepositNotice(
  account: Pick<DepositReceivingAccount, 'notice' | 'noticeI18n'> | null | undefined,
  locale: string,
  fallback: string,
): string {
  const loc = (String(locale || 'KR').toUpperCase() === 'EN' ? 'US' : String(locale || 'KR').toUpperCase()) as DepositNoticeLocale;
  const fromI18n = account?.noticeI18n?.[loc] || account?.noticeI18n?.KR;
  if (fromI18n?.trim()) return fromI18n.trim();
  if (account?.notice?.trim()) return account.notice.trim();
  return fallback;
}

export type UsdtCurrencyTradeFlags = { transfer: boolean; card: boolean };
export type UsdtCurrencyTradePolicy = Record<UsdtFiatCurrency, UsdtCurrencyTradeFlags>;

export type HqPlatformConfig = {
  primaryDomain: string;
  apiPublicUrl: string;
  corsOrigins: string[];
  sslCertPath?: string;
  redirectRootToPrimary: boolean;
  /** 브랜드 카드 — 사이트 이름 (로그인·헤더 표시) */
  siteName: string;
  /** 브라우저 탭 제목. 비우면 siteName 사용 */
  tabTitle?: string;
  /** LINE·WhatsApp 링크 미리보기 이미지 (/api/branding/og) */
  ogImageUrl?: string;
  /** 링크 미리보기 제목. 비우면 siteName */
  ogTitle?: string;
  /** 링크 미리보기 설명(LINE·WhatsApp). 배경 브랜드 문구와 별도 */
  ogDescription?: string;
  /** 로그인 후 좌측 메뉴 상단 로고 (/api/branding/logo) */
  logoUrl?: string;
  /** 첫화면(로그인) 우측 패널 상단 로고 (/api/branding/auth-logo) — 로그인 후 로고와 별도 */
  authLogoUrl?: string;
  /** 파비콘 (/api/branding/favicon) */
  faviconUrl?: string;
  /** 로그인 첫화면 왼쪽 배경 (/api/branding/background) */
  authBackgroundUrl?: string;
  /** 개인 회원가입 왼쪽 비주얼 (/api/branding/register-background). 없으면 왼쪽 이미지 미표시 */
  registerBackgroundUrl?: string;
  /** 왼쪽 배경 위 브랜드 문구 (줄바꿈 가능). 비우면 화면에 문구 미표시. 메신저 미리보기와 무관 */
  authMainText?: string;
  /** 링크 미리보기 캐시 무효화용 버전 (저장할 때마다 증가) */
  linkPreviewRevision?: number;
  /** 첫화면 하단 푸터 문구 */
  footerText?: string;
  /** 로그인 패널 공지 노출 */
  loginNoticeEnabled?: boolean;
  /** 로그인 패널 공지 (다국어) */
  loginNoticeI18n?: Partial<
    Record<'KR' | 'JP' | 'US' | 'CH' | 'TH', { title: string; body: string }>
  >;
  /** 고객 공개 회원가입 (오프라인 계약 가입만 허용 시 false). 기본 true — 개인만 */
  customerRegistrationEnabled?: boolean;
  /** 로그인 첫화면 비밀번호 / OTP 초기화 메뉴 노출. 기본 true */
  accountRecoveryEnabled?: boolean;
  /** 개인고객 가입 화면 경고 안내 노출 */
  individualRegisterNoticeEnabled?: boolean;
  /** 개인고객 가입 경고 안내 (다국어) — 기업가입 불가·1회 한도 등 */
  individualRegisterNoticeI18n?: Partial<
    Record<'KR' | 'JP' | 'US' | 'CH' | 'TH', { title: string; body: string }>
  >;
  /** 미사용 자동 로그아웃 (분) — 10·30·60·90·120 */
  idleTimeoutMinutes?: number;
  /**
   * 비활성 계정 로그인 시 기본 안내 (다국어).
   * 비활성 사유(관리 로그)가 있으면 사유를 우선하고, 없으면 이 문구를 사용.
   */
  inactiveLoginNoticeI18n?: Partial<Record<'KR' | 'US' | 'JP' | 'CH' | 'TH', string>>;
  /**
   * 비활성 사유 빠른 선택 프리셋 (BASIC / INCONVENIENCE / WARNING).
   * 운영자가 비활성 시 선택하거나 직접 작성 가능.
   */
  inactiveLoginNoticePresets?: Array<{
    id: 'BASIC' | 'INCONVENIENCE' | 'WARNING';
    title?: string;
    bodyI18n?: Partial<Record<'KR' | 'US' | 'JP' | 'CH' | 'TH', string>>;
  }>;
  /** USDT 매입 기본 구매 통화 */
  defaultUsdtFiatCurrency?: UsdtFiatCurrency;
  /** 시뮬레이터 기록 자동 삭제 보관 개월 (기본 3) */
  simulatorRetentionMonths?: number;
  /** 시뮬레이터 실행 시 Invoice(tinpass-sim) 자동 발급 여부 (기본 true) */
  simulatorInvoiceEnabled?: boolean;
  /** 고객 입금용 회사 수취 계좌 (통화별) */
  depositReceivingAccounts?: Partial<Record<UsdtFiatCurrency, DepositReceivingAccount>>;
  /** 기준시간 (IANA TZ) — 플랫폼 도메인·SSL */
  baseTimezone?: string;
  /** 서비스기준시간 (IANA TZ) — 국가 변경 시 목록에서 오버라이드 가능 */
  serviceTimezone?: string;
};

/** ICOPAY 카드 결제 연동 (ziobiz/PG) */
export type HqIcopayConfig = {
  enabled: boolean;
  mid: string;
  bracketSecret: string;
  apiBaseUrl?: string;
  sandbox?: boolean;
};

export type CardCurrencyLimits = {
  min: number;
  max: number;
};

/** 운영관리 — 카드 결제 정책 */
export type HqCardPaymentConfig = {
  enabled: boolean;
  cardFeePercent: number;
  limits: Record<SymbolFeeCurrency, CardCurrencyLimits>;
};

export const DEFAULT_CARD_PAYMENT_CONFIG = (): HqCardPaymentConfig => ({
  enabled: false,
  cardFeePercent: 3.5,
  limits: {
    KRW: { min: 10_000, max: 5_000_000 },
    JPY: { min: 1_000, max: 500_000 },
    THB: { min: 500, max: 200_000 },
    CNY: { min: 100, max: 50_000 },
    USD: { min: 10, max: 10_000 },
    EUR: { min: 10, max: 10_000 },
  },
});

export const DEFAULT_ICOPAY_CONFIG = (): HqIcopayConfig => ({
  enabled: false,
  mid: '',
  bracketSecret: '',
  sandbox: true,
});

/**
 * Fukugu Collection (CURFEX) — 은행이체 수취.
 * enabled=false 이면 기존 고정 수취계좌 사용 (기본).
 * enabled=true 이면 currencies에 포함된 통화의 이체 매입 시 API로 건별 계좌 발급.
 * 선택되지 않은 통화는 CURFEX ON이어도 고정 계좌 + 입금 영수증.
 */
export const CURFEX_CURRENCY_OPTIONS = ['JPY', 'KRW', 'THB', 'CNY'] as const;
export type CurfexCurrency = (typeof CURFEX_CURRENCY_OPTIONS)[number];

/** 본사 기본 입금계좌 방식 (고객 FOLLOW_HQ 시). DIRECT = 송금계좌 */
export type HqDefaultCollectionMode = 'FIXED' | 'VIRTUAL' | 'DIRECT';

export function normalizeHqCollectionMode(
  raw: unknown,
  fallback: HqDefaultCollectionMode,
): HqDefaultCollectionMode {
  if (raw === 'VIRTUAL' || raw === 'DIRECT' || raw === 'FIXED') return raw;
  return fallback;
}

export type HqCurfexConfig = {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  apiBaseUrl?: string;
  walletName?: string;
  /** CURFEX 적용 통화 (기본 JPY). 미선택 통화는 고정계좌 */
  currencies?: CurfexCurrency[];
  /** true면 실 API 대신 샌드박스 계좌 생성 */
  sandbox?: boolean;
  /** 웹훅 HMAC 검증용 공유 비밀 (Partner/Merchant 생성) */
  webhookSecret?: string;
  /**
   * 입금 감지 시 CURFEX /api/payment/decision APPROVE 자동 호출.
   * 금액이 신청액과 일치할 때만 수행 (기본 true).
   */
  autoApproveOnDeposit?: boolean;
  /**
   * @deprecated defaultCollectionModeCorporate 사용. 하위호환(기업 기본으로 migrate).
   */
  defaultCollectionMode?: HqDefaultCollectionMode;
  /** 기업고객 「본사설정따름」 기본 입금계좌 방식 */
  defaultCollectionModeCorporate?: HqDefaultCollectionMode;
  /** 개인고객 「본사설정따름」 기본 입금계좌 방식 (초기값 DIRECT=송금계좌) */
  defaultCollectionModeIndividual?: HqDefaultCollectionMode;
  /**
   * @deprecated 송금 통화는 입금계좌 remittanceEnabled가 단일 소스.
   * 하위호환·표시용으로 유지.
   */
  directRemitCurrencies?: UsdtFiatCurrency[];
};

export const DEFAULT_CURFEX_CONFIG = (): HqCurfexConfig => ({
  enabled: false,
  clientId: '',
  clientSecret: '',
  apiBaseUrl: 'https://fcol-dashboard-uat1.curfex.com',
  walletName: '',
  currencies: ['JPY'],
  sandbox: true,
  webhookSecret: '',
  autoApproveOnDeposit: true,
  defaultCollectionMode: 'FIXED',
  defaultCollectionModeCorporate: 'FIXED',
  defaultCollectionModeIndividual: 'DIRECT',
  directRemitCurrencies: [...DEFAULT_DIRECT_REMIT_CURRENCIES],
});

export type CurfexCollectionAccount = {
  bankName: string;
  branchCode?: string;
  branchName?: string;
  accountType?: string;
  accountNo: string;
  accountName: string;
};

/** PG 본사정책 → 플랫폼 → 이메일·OTP */
export type HqEmailOtpConfig = {
  otpEnabled: boolean;
  otpForSuperAdmin: boolean;
  otpForHeadOffice: boolean;
  otpForMasterDistributor: boolean;
  otpExpireMinutes: number;
  /** 민감작업(step-up) Google OTP 유지 시간. 기본 10분, 1~60 */
  sensitiveOtpExpireMinutes: number;
  otpEmailSubject: string;
  otpEmailBody: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromAddress: string;
  fromName: string;
  /** 거래 완료 시 고객에게 거래명세 이메일 자동 발송 (레거시). mode가 있으면 mode가 우선 */
  tradeReceiptEmailEnabled: boolean;
  /** ENABLED=이메일+본사보관, DISABLED=둘 다 없음, HQ_ONLY=본사 명세서만 */
  tradeReceiptEmailMode?: 'ENABLED' | 'DISABLED' | 'HQ_ONLY';
  /** 관리자 상세 보기·PDF 노출 (활성/본사만일 때). 기본 true */
  tradeReceiptAdminUiEnabled?: boolean;
  /** 가맹점 상세 보기·PDF 노출 (활성/본사만일 때). 기본 false */
  tradeReceiptMerchantUiEnabled?: boolean;
};

export const WORKFLOW_LOCALES = ['KR', 'US', 'JP', 'CH', 'TH'] as const;
export type WorkflowLocale = (typeof WORKFLOW_LOCALES)[number];

export const USDT_WORKFLOW_STATUSES = [
  'QUOTE_PENDING',
  'QUOTE_CONFIRMED',
  'APPLICATION_COMPLETED',
  'CARD_PAYMENT_PENDING',
  'DEPOSIT_PROOF_PENDING',
  'ADMIN_REVIEWING',
  'TRANSFER_IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export const ESCROW_WORKFLOW_STATUSES = [
  'ESCROW_CREATED',
  'CONTRACT_CONFIRMED',
  'BUYER_DEPOSIT_PROOF',
  'ADMIN_DEPOSIT_CONFIRMED',
  'SELLER_FULFILLMENT_PROOF',
  'BUYER_FINAL_APPROVAL',
  'PAYOUT_SCHEDULED',
  'ESCROW_COMPLETED',
  'VOIDED',
  'CANCELLED',
  'DISPUTED',
] as const;

export type LocalizedStatusLabels = Record<WorkflowLocale, string>;

/** 예상완료 등급(이름) — T+N 일수 매핑용 */
export const EXPECTED_COMPLETE_NAMED_TIERS = [
  'REGULAR',
  'PLUS',
  'PRIME',
  'ELITE',
  'SIGNATURE',
] as const;
export type ExpectedCompleteNamedTier = (typeof EXPECTED_COMPLETE_NAMED_TIERS)[number];
export type ExpectedCompleteTier = ExpectedCompleteNamedTier | 'CUSTOM';

export type HqCompletionTierDays = Record<ExpectedCompleteNamedTier, number>;

export type ExpectedCompleteChannel = 'BANK_TRANSFER' | 'CARD';

export type HqSlaConfig = {
  timezone: string;
  /** ISO weekday 1=Mon … 7=Sun */
  businessDays: number[];
  businessStart: string;
  businessEnd: string;
  hoursInBusiness: number;
  hoursAfterHours: number;
  /** 계좌이체 등급별 예상완료 T+N (일). SIGNATURE=0(당일) */
  completionTiers: HqCompletionTierDays;
  /** 카드결제 등급별 예상완료 T+N (일) */
  completionTiersCard: HqCompletionTierDays;
};

export type HqWorkflowDisplayConfig = {
  usdtStatusLabels: Record<string, LocalizedStatusLabels>;
  escrowStatusLabels: Record<string, LocalizedStatusLabels>;
  sla: HqSlaConfig;
};

export type ExpectedCompleteProfile = {
  expectedCompleteTier?: string | null;
  expectedCompleteCustomDays?: number | null;
  expectedCompleteCardTier?: string | null;
  expectedCompleteCardCustomDays?: number | null;
};

export function defaultCompletionTiers(): HqCompletionTierDays {
  return {
    REGULAR: 4,
    PLUS: 3,
    PRIME: 2,
    ELITE: 1,
    SIGNATURE: 0,
  };
}

/** 카드는 통상 이체보다 짧아 기본값을 한 단계 빠르게 둠 (본사에서 수정 가능) */
export function defaultCompletionTiersCard(): HqCompletionTierDays {
  return {
    REGULAR: 2,
    PLUS: 1,
    PRIME: 1,
    ELITE: 0,
    SIGNATURE: 0,
  };
}

export function normalizeExpectedCompleteTier(raw?: string | null): ExpectedCompleteTier {
  const v = String(raw ?? 'REGULAR').toUpperCase();
  if (v === 'CUSTOM') return 'CUSTOM';
  if ((EXPECTED_COMPLETE_NAMED_TIERS as readonly string[]).includes(v)) {
    return v as ExpectedCompleteNamedTier;
  }
  return 'REGULAR';
}

export function resolveExpectedCompletionDays(
  sla: HqSlaConfig,
  profile?: ExpectedCompleteProfile | null,
  channel: ExpectedCompleteChannel = 'BANK_TRANSFER',
): number {
  const isCard = channel === 'CARD';
  const tiers = isCard
    ? (sla.completionTiersCard ?? defaultCompletionTiersCard())
    : (sla.completionTiers ?? defaultCompletionTiers());
  const tier = normalizeExpectedCompleteTier(
    isCard ? profile?.expectedCompleteCardTier : profile?.expectedCompleteTier,
  );
  const customDays = isCard
    ? profile?.expectedCompleteCardCustomDays
    : profile?.expectedCompleteCustomDays;
  if (tier === 'CUSTOM') {
    const d = Number(customDays);
    if (Number.isFinite(d) && d >= 1 && d <= 10) return Math.floor(d);
    return Number(tiers.REGULAR) >= 0 ? Number(tiers.REGULAR) : isCard ? 2 : 4;
  }
  const days = Number(tiers[tier]);
  return Number.isFinite(days) && days >= 0 ? days : Number(tiers.REGULAR) || (isCard ? 2 : 4);
}

function L(kr: string, us: string, jp: string, ch: string, th: string): LocalizedStatusLabels {
  return { KR: kr, US: us, JP: jp, CH: ch, TH: th };
}

export function defaultWorkflowDisplay(): HqWorkflowDisplayConfig {
  return {
    sla: {
      timezone: 'Asia/Seoul',
      businessDays: [1, 2, 3, 4, 5],
      businessStart: '09:00',
      businessEnd: '18:00',
      hoursInBusiness: 3,
      hoursAfterHours: 12,
      completionTiers: defaultCompletionTiers(),
      completionTiersCard: defaultCompletionTiersCard(),
    },
    usdtStatusLabels: {
      QUOTE_PENDING: L('견적대기', 'Quote pending', '見積待ち', '待报价', 'รอใบเสนอราคา'),
      QUOTE_CONFIRMED: L('견적확정', 'Quote confirmed', '見積確定', '报价确认', 'ยืนยันใบเสนอราคา'),
      APPLICATION_COMPLETED: L('접수완료', 'Received', '受付完了', '已受理', 'รับเรื่องแล้ว'),
      CARD_PAYMENT_PENDING: L('카드결제중', 'Card pending', 'カード決済中', '卡支付中', 'รอชำระบัตร'),
      DEPOSIT_PROOF_PENDING: L('입금대기', 'Awaiting deposit', '入金待ち', '待入金', 'รอฝากเงิน'),
      ADMIN_REVIEWING: L('입금확인중', 'Deposit verifying', '入金確認中', '入金确认中', 'กำลังตรวจสอบการฝาก'),
      TRANSFER_IN_PROGRESS: L('송금중', 'Transferring', '送金中', '汇款中', 'กำลังโอน'),
      COMPLETED: L('완료', 'Completed', '完了', '已完成', 'เสร็จสิ้น'),
      CANCELLED: L('취소', 'Cancelled', 'キャンセル', '已取消', 'ยกเลิก'),
    },
    escrowStatusLabels: {
      ESCROW_CREATED: L('접수완료', 'Received', '受付完了', '已受理', 'รับเรื่องแล้ว'),
      CONTRACT_CONFIRMED: L('계약확정', 'Contract confirmed', '契約確定', '合同确认', 'ยืนยันสัญญา'),
      BUYER_DEPOSIT_PROOF: L('입금증빙', 'Deposit proof', '入金証憑', '入金凭证', 'หลักฐานฝาก'),
      ADMIN_DEPOSIT_CONFIRMED: L('심사중', 'Under review', '審査中', '审核中', 'กำลังตรวจสอบ'),
      SELLER_FULFILLMENT_PROOF: L('이행중', 'Fulfillment', '履行中', '履约中', 'กำลังปฏิบัติ'),
      BUYER_FINAL_APPROVAL: L('최종승인대기', 'Final approval', '最終承認待ち', '待最终确认', 'รออนุมัติสุดท้าย'),
      PAYOUT_SCHEDULED: L('송금예약', 'Payout scheduled', '送金予約', '汇款预约', 'นัดโอน'),
      ESCROW_COMPLETED: L('심사완료', 'Completed', '審査完了', '审核完成', 'ตรวจสอบเสร็จ'),
      VOIDED: L('불발', 'Voided', '不成立', '未成立', 'ไม่สำเร็จ'),
      CANCELLED: L('취소', 'Cancelled', 'キャンセル', '已取消', 'ยกเลิก'),
      DISPUTED: L('분쟁', 'Disputed', '紛争', '争议', 'ข้อพิพาท'),
    },
  };
}

export function normalizeWorkflowDisplay(
  raw: Partial<HqWorkflowDisplayConfig> | null | undefined,
): HqWorkflowDisplayConfig {
  const base = defaultWorkflowDisplay();
  if (!raw) return base;
  const mergeLabels = (
    defaults: Record<string, LocalizedStatusLabels>,
    incoming?: Record<string, LocalizedStatusLabels>,
  ) => {
    const out = { ...defaults };
    if (!incoming) return out;
    for (const [code, labels] of Object.entries(incoming)) {
      out[code] = { ...defaults[code], ...labels };
    }
    return out;
  };
  const sla = { ...base.sla, ...(raw.sla ?? {}) };
  sla.businessDays = (sla.businessDays?.length ? sla.businessDays : base.sla.businessDays).map(Number);
  sla.hoursInBusiness = Number(sla.hoursInBusiness) > 0 ? Number(sla.hoursInBusiness) : 3;
  sla.hoursAfterHours = Number(sla.hoursAfterHours) > 0 ? Number(sla.hoursAfterHours) : 12;
  const incomingTiers = (raw.sla as { completionTiers?: Partial<HqCompletionTierDays> } | undefined)
    ?.completionTiers;
  const incomingCardTiers = (
    raw.sla as { completionTiersCard?: Partial<HqCompletionTierDays> } | undefined
  )?.completionTiersCard;
  const baseTiers = defaultCompletionTiers();
  const baseCardTiers = defaultCompletionTiersCard();
  sla.completionTiers = {
    REGULAR: clampTierDays(incomingTiers?.REGULAR ?? baseTiers.REGULAR, 4),
    PLUS: clampTierDays(incomingTiers?.PLUS ?? baseTiers.PLUS, 3),
    PRIME: clampTierDays(incomingTiers?.PRIME ?? baseTiers.PRIME, 2),
    ELITE: clampTierDays(incomingTiers?.ELITE ?? baseTiers.ELITE, 1),
    SIGNATURE: clampTierDays(incomingTiers?.SIGNATURE ?? baseTiers.SIGNATURE, 0),
  };
  sla.completionTiersCard = {
    REGULAR: clampTierDays(incomingCardTiers?.REGULAR ?? baseCardTiers.REGULAR, 2),
    PLUS: clampTierDays(incomingCardTiers?.PLUS ?? baseCardTiers.PLUS, 1),
    PRIME: clampTierDays(incomingCardTiers?.PRIME ?? baseCardTiers.PRIME, 1),
    ELITE: clampTierDays(incomingCardTiers?.ELITE ?? baseCardTiers.ELITE, 0),
    SIGNATURE: clampTierDays(incomingCardTiers?.SIGNATURE ?? baseCardTiers.SIGNATURE, 0),
  };
  return {
    sla,
    usdtStatusLabels: patchLegacyUsdtStatusLabels(mergeLabels(base.usdtStatusLabels, raw.usdtStatusLabels)),
    escrowStatusLabels: mergeLabels(base.escrowStatusLabels, raw.escrowStatusLabels),
  };
}

function clampTierDays(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(30, Math.floor(n));
}

/** DB에 저장된 구 라벨(심사중 등)을 입금확인중으로 정렬 */
function patchLegacyUsdtStatusLabels(
  labels: Record<string, LocalizedStatusLabels>,
): Record<string, LocalizedStatusLabels> {
  const defaults = defaultWorkflowDisplay().usdtStatusLabels;
  const legacyReviewKr = new Set(['심사중', '관리자 확인 중', '審査中', '审核中', 'Under review']);
  const reviewing = labels.ADMIN_REVIEWING;
  if (reviewing && legacyReviewKr.has(reviewing.KR)) {
    return { ...labels, ADMIN_REVIEWING: defaults.ADMIN_REVIEWING };
  }
  return labels;
}

export function isInBusinessHours(at: Date, sla: HqSlaConfig): boolean {
  const tz = sla.timezone || 'Asia/Seoul';
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const wdMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  const day = wdMap[parts.weekday] ?? 0;
  if (!sla.businessDays.includes(day)) return false;
  const hm = `${parts.hour}:${parts.minute}`;
  return hm >= sla.businessStart && hm < sla.businessEnd;
}

export function computeExpectedCompleteAt(
  createdAt: Date,
  sla: HqSlaConfig,
  completionDays?: number,
): Date {
  if (typeof completionDays === 'number' && Number.isFinite(completionDays) && completionDays >= 0) {
    return new Date(createdAt.getTime() + completionDays * 24 * 60 * 60 * 1000);
  }
  const hours = isInBusinessHours(createdAt, sla) ? sla.hoursInBusiness : sla.hoursAfterHours;
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

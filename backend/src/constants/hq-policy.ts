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

/** 사이드바·본사권한설정 공통 페이지 카탈로그 */
export const HQ_PAGE_CATALOG = [
  { path: '/dashboard', label: '대시보드', group: '업무' },
  { path: '/dashboard/simulator', label: 'USDT 시뮬레이터', group: '업무' },
  { path: '/dashboard/simulator-logs', label: '기록 시뮬레이터', group: '본사정책' },
  { path: '/dashboard/hq-policy/cost-analysis', label: '거래분석', group: '본사정책' },
  { path: '/dashboard/hq-policy/profit-analysis', label: '수익분석', group: '본사정책' },
  { path: '/dashboard/usdt', label: 'USDT 매입', group: '업무' },
  { path: '/dashboard/escrow', label: '무역 에스크로', group: '업무' },
  { path: '/dashboard/ledger', label: '수수료 장부', group: '업무' },
  { path: '/dashboard/wallets', label: '내 지갑', group: '업무' },
  { path: '/dashboard/merchant-users', label: '가맹점 사용자관리', group: '업무' },
  { path: '/dashboard/operation-history', label: '기록관리', group: '운영관리' },
  { path: '/dashboard/kyc', label: '인증센터', group: '업무' },
  { path: '/dashboard/users', label: '사용자관리', group: '운영관리' },
  { path: '/dashboard/customers', label: '고객관리', group: '운영관리' },
  { path: '/dashboard/customers/fees', label: '수수료관리', group: '운영관리' },
  { path: '/dashboard/organizations', label: '조직관리', group: '운영관리' },
  { path: '/dashboard/hq-policy/access', label: '접근·권한', group: '본사정책' },
  { path: '/dashboard/hq-policy/org-columns', label: '조직·화면', group: '본사정책' },
  { path: '/dashboard/hq-policy/commission', label: '수수료·리스크', group: '본사정책' },
  { path: '/dashboard/hq-policy/platform', label: '플랫폼', group: '본사정책' },
  { path: '/dashboard/hq-policy/ops', label: '운영관리', group: '본사정책' },
  { path: '/dashboard/hq-policy/ops/workflow', label: '진행상태·처리시한', group: '본사정책' },
  { path: '/dashboard/hq-policy/deletion', label: '삭제관리', group: '본사정책' },
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
} as const;

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
  /** USDT 매입 수수료·비용 도식 표시 항목 (LIVE) */
  feeDiagramDisplay?: FeeDiagramDisplayConfig;
  /** 시뮬레이터 SAND 전용 도식 표시 (미설정 시 LIVE feeDiagramDisplay 복제) */
  sandboxFeeDiagramDisplay?: FeeDiagramDisplayConfig;
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
  net: boolean;
  requiredFiat: boolean;
  /** 도식 중앙 수수료율 열 */
  showRates: boolean;
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
  net: true,
  requiredFiat: true,
  showRates: true,
  defaultFeeBillingMethod: 'ITEMIZED',
};

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
export const SYMBOL_FEE_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY', 'USD'] as const;
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

export const USDT_FIAT_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY'] as const;
export type UsdtFiatCurrency = (typeof USDT_FIAT_CURRENCIES)[number];

export type DepositNoticeLocale = 'KR' | 'US' | 'JP' | 'CH' | 'TH';

export type DepositReceivingAccount = {
  bankName: string;
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
  /** 계좌 유형 (예: Savings / Futsu) */
  accountType?: string;
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
});

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
  /** LINE·WhatsApp 링크 미리보기 이미지 (/api/branding/og). 제목=siteName, 설명=authMainText */
  ogImageUrl?: string;
  /** 로그인 후 좌측 메뉴 상단 로고 (/api/branding/logo) */
  logoUrl?: string;
  /** 첫화면(로그인) 우측 패널 상단 로고 (/api/branding/auth-logo) — 로그인 후 로고와 별도 */
  authLogoUrl?: string;
  /** 파비콘 (/api/branding/favicon) */
  faviconUrl?: string;
  /** 로그인 첫화면 왼쪽 배경 (/api/branding/background) */
  authBackgroundUrl?: string;
  /** 왼쪽 배경 위 브랜드 문구 (줄바꿈 가능) — LINE·WhatsApp 미리보기 설명에도 사용 */
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
  /** 고객 공개 회원가입 (오프라인 계약 가입만 허용 시 false) */
  customerRegistrationEnabled?: boolean;
  /** 미사용 자동 로그아웃 (분) — 10·30·60·90·120 */
  idleTimeoutMinutes?: number;
  /** USDT 매입 기본 구매 통화 */
  defaultUsdtFiatCurrency?: 'KRW' | 'JPY' | 'THB' | 'CNY';
  /** 시뮬레이터 기록 자동 삭제 보관 개월 (기본 3) */
  simulatorRetentionMonths?: number;
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

/** 본사 기본 입금계좌 방식 (고객 FOLLOW_HQ 시). VIRTUAL = 가상계좌 */
export type HqDefaultCollectionMode = 'FIXED' | 'VIRTUAL';

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
   * 고객이 「본사설정따름」일 때 기본 입금계좌 방식.
   * VIRTUAL이어도 해당 통화 CURFEX OFF면 고정계좌로 폴백.
   */
  defaultCollectionMode?: HqDefaultCollectionMode;
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
  /** 거래 완료 시 고객에게 거래명세 이메일 자동 발송 */
  tradeReceiptEmailEnabled: boolean;
};

export const WORKFLOW_LOCALES = ['KR', 'US', 'JP', 'CH', 'TH'] as const;
export type WorkflowLocale = (typeof WORKFLOW_LOCALES)[number];

export const USDT_WORKFLOW_STATUSES = [
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

export type HqSlaConfig = {
  timezone: string;
  /** ISO weekday 1=Mon … 7=Sun */
  businessDays: number[];
  businessStart: string;
  businessEnd: string;
  hoursInBusiness: number;
  hoursAfterHours: number;
};

export type HqWorkflowDisplayConfig = {
  usdtStatusLabels: Record<string, LocalizedStatusLabels>;
  escrowStatusLabels: Record<string, LocalizedStatusLabels>;
  sla: HqSlaConfig;
};

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
    },
    usdtStatusLabels: {
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
  return {
    sla,
    usdtStatusLabels: patchLegacyUsdtStatusLabels(mergeLabels(base.usdtStatusLabels, raw.usdtStatusLabels)),
    escrowStatusLabels: mergeLabels(base.escrowStatusLabels, raw.escrowStatusLabels),
  };
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

export function computeExpectedCompleteAt(createdAt: Date, sla: HqSlaConfig): Date {
  const hours = isInBusinessHours(createdAt, sla) ? sla.hoursInBusiness : sla.hoursAfterHours;
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

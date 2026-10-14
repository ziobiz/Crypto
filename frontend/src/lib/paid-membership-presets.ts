/**
 * 유료회원 정책 프리셋 A/B/C
 * - 쿼터 잔여: EXPRESS 0원(무료)
 * - 쿼터 소진 후: 회원 할인%·할인 크립토
 * - 재구매: 구매일 기준 기간·쿼터 리셋
 * - 한도: 일반 1회 × 배수 → 일=×5, 월=×20
 */
import {
  EXPRESS_QUOTA_TIERS,
  EXPRESS_TIERS,
  MEMBER_GRADES,
  PAID_MEMBER_GRADES,
  createDefaultCatalogItem,
  defaultExpressQuotaByTier,
  defaultPaidMembershipExpressQuotasPolicy,
  type CurrencyTransactionLimits,
  type CustomerTransactionLimitsPolicy,
  type ExpressQuotaByTier,
  type HqMemberGradePolicy,
  type MemberGrade,
  type MemberGradeExpressBenefit,
  type MethodTransactionLimitsPolicy,
  type PaidMemberGrade,
  type PaidMembershipExpressQuotasPolicy,
  type PaidMembershipLimitsPolicy,
  type PaidMembershipProductsPolicy,
  type SymbolFeeCurrency,
} from '@/lib/api';
import { monthsToPeriodDays, MEMBERSHIP_MONTH_MAX } from '@/lib/membership-period';
import { FEE_CURRENCIES } from '@/lib/hq-commission-shared';

export type PaidMembershipPresetId = 'A' | 'B' | 'C';

export type PaidMembershipPresetDef = {
  id: PaidMembershipPresetId;
  /** 연간(12개월) USD — 개인 */
  annualPriceUsd: Record<PaidMemberGrade, number>;
  /** 법인 = 개인 × 배수 */
  corporatePriceMult: number;
  /** 쿼터 소진 후 EXPRESS 할인 % */
  expressDiscountPercent: Record<PaidMemberGrade, number>;
  /** 쿼터 소진 후 할인 크립토 */
  expressDiscountUsdt: Record<PaidMemberGrade, number>;
  /** BLACK ULTRA 청구 지정(null=일반따름). 쿼터 무료와 별개·소진 후용 */
  blackUltraFeeUsdt: number | null;
  /** 일반 1회 한도 대비 배수 */
  limitPerTxMult: Record<PaidMemberGrade, number>;
  /** 기간 총 EXPRESS 무료 횟수 (티어별, 0원) */
  expressQuotas: Record<PaidMemberGrade, ExpressQuotaByTier>;
};

/**
 * 산정용 일반회원 EXPRESS 참고 단가 (USDT).
 * 프리셋이 HQ EXPRESS를 덮어쓰지 않음 — 수수료관리에서 맞출 권장값.
 */
export const REFERENCE_GENERAL_EXPRESS_USDT: Record<
  (typeof EXPRESS_TIERS)[number],
  number
> = {
  ULTRA: 50,
  PRIORITY: 30,
  HALF: 20,
  DAY: 12,
  D1: 8,
  D2: 5,
  BASIC: 0,
};

export function includedExpressValueUsdt(quotas: ExpressQuotaByTier): number {
  let sum = 0;
  for (const tier of EXPRESS_QUOTA_TIERS) {
    const n = Math.max(0, Math.floor(Number(quotas[tier]) || 0));
    sum += n * (REFERENCE_GENERAL_EXPRESS_USDT[tier] ?? 0);
  }
  return sum;
}

/** 심리적 가격: 가장 가까운 끝자리 9 (99, 149, 199 …) */
export function priceEnding9(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  const r = Math.round(n);
  if (r % 10 === 9) return r;
  const mod = r % 10;
  const down = r - mod - 1;
  const up = r + (9 - mod);
  if (down < 9) return up;
  return r - down <= up - r ? down : up;
}

export function corporatePriceFromPreset(
  individualUsd: number,
  corporateMult: number,
): number {
  return priceEnding9(individualUsd * corporateMult);
}

/**
 * A/B/C — 플랫폼 마진 동일: 연회비 ≈ 포함가치의 60~70% (B 기준).
 * 차별점: 절대 규모(A 작음 → C 큼) + 소진 후 할인%·한도 배수.
 */
export const PAID_MEMBERSHIP_PRESETS: Record<PaidMembershipPresetId, PaidMembershipPresetDef> = {
  A: {
    id: 'A',
    annualPriceUsd: {
      PREMIUM: 99,
      VIP: 199,
      VVIP: 359,
      PRESTIGE: 599,
      BLACK: 899,
    },
    corporatePriceMult: 1.5,
    expressDiscountPercent: {
      PREMIUM: 2,
      VIP: 3,
      VVIP: 5,
      PRESTIGE: 7,
      BLACK: 10,
    },
    expressDiscountUsdt: {
      PREMIUM: 0,
      VIP: 0,
      VVIP: 0,
      PRESTIGE: 0,
      BLACK: 0,
    },
    blackUltraFeeUsdt: null,
    limitPerTxMult: {
      PREMIUM: 1.1,
      VIP: 1.25,
      VVIP: 1.5,
      PRESTIGE: 1.75,
      BLACK: 2,
    },
    /** 포함가치 ≈ 154 / 302 / 562 / 922 / 1378 → 연회비 ≈ 가치의 60~70% */
    expressQuotas: {
      PREMIUM: { D2: 10, D1: 6, DAY: 3, HALF: 1, PRIORITY: 0, ULTRA: 0 },
      VIP: { D2: 12, D1: 10, DAY: 6, HALF: 3, PRIORITY: 1, ULTRA: 0 },
      VVIP: { D2: 16, D1: 12, DAY: 8, HALF: 5, PRIORITY: 3, ULTRA: 2 },
      PRESTIGE: { D2: 22, D1: 16, DAY: 12, HALF: 8, PRIORITY: 6, ULTRA: 4 },
      BLACK: { D2: 32, D1: 24, DAY: 18, HALF: 12, PRIORITY: 9, ULTRA: 6 },
    },
  },
  B: {
    id: 'B',
    annualPriceUsd: {
      PREMIUM: 139,
      VIP: 259,
      VVIP: 439,
      PRESTIGE: 699,
      BLACK: 999,
    },
    corporatePriceMult: 1.75,
    expressDiscountPercent: {
      PREMIUM: 3,
      VIP: 5,
      VVIP: 8,
      PRESTIGE: 12,
      BLACK: 15,
    },
    expressDiscountUsdt: {
      PREMIUM: 0,
      VIP: 0,
      VVIP: 0,
      PRESTIGE: 0,
      BLACK: 1,
    },
    blackUltraFeeUsdt: null,
    limitPerTxMult: {
      PREMIUM: 1.25,
      VIP: 1.5,
      VVIP: 2,
      PRESTIGE: 2.5,
      BLACK: 3,
    },
    /** 포함가치 ≈ 212 / 396 / 672 / 1012 / 1472 → 연회비 ≈ 가치의 60~70% */
    expressQuotas: {
      PREMIUM: { D2: 12, D1: 8, DAY: 4, HALF: 2, PRIORITY: 0, ULTRA: 0 },
      VIP: { D2: 16, D1: 10, DAY: 8, HALF: 4, PRIORITY: 2, ULTRA: 0 },
      VVIP: { D2: 20, D1: 14, DAY: 10, HALF: 6, PRIORITY: 4, ULTRA: 2 },
      PRESTIGE: { D2: 24, D1: 18, DAY: 14, HALF: 10, PRIORITY: 6, ULTRA: 4 },
      BLACK: { D2: 32, D1: 24, DAY: 20, HALF: 14, PRIORITY: 10, ULTRA: 6 },
    },
  },
  C: {
    id: 'C',
    annualPriceUsd: {
      PREMIUM: 159,
      VIP: 299,
      VVIP: 459,
      PRESTIGE: 699,
      BLACK: 999,
    },
    corporatePriceMult: 2,
    expressDiscountPercent: {
      PREMIUM: 5,
      VIP: 8,
      VVIP: 12,
      PRESTIGE: 18,
      BLACK: 25,
    },
    expressDiscountUsdt: {
      PREMIUM: 0,
      VIP: 0,
      VVIP: 1,
      PRESTIGE: 1,
      BLACK: 2,
    },
    blackUltraFeeUsdt: null,
    limitPerTxMult: {
      PREMIUM: 1.5,
      VIP: 2,
      VVIP: 3,
      PRESTIGE: 4,
      BLACK: 5,
    },
    /** 포함가치 ≈ 242 / 462 / 710 / 1078 / 1532 → 연회비 ≈ 가치의 60~70% */
    expressQuotas: {
      PREMIUM: { D2: 12, D1: 8, DAY: 4, HALF: 2, PRIORITY: 1, ULTRA: 0 },
      VIP: { D2: 16, D1: 12, DAY: 8, HALF: 4, PRIORITY: 2, ULTRA: 1 },
      VVIP: { D2: 22, D1: 16, DAY: 11, HALF: 6, PRIORITY: 4, ULTRA: 2 },
      PRESTIGE: { D2: 28, D1: 20, DAY: 14, HALF: 10, PRIORITY: 7, ULTRA: 4 },
      BLACK: { D2: 36, D1: 26, DAY: 22, HALF: 14, PRIORITY: 10, ULTRA: 6 },
    },
  },
};

export const PAID_MEMBERSHIP_PRESET_IDS: PaidMembershipPresetId[] = ['A', 'B', 'C'];

function emptyBenefit(): MemberGradeExpressBenefit {
  const tierFees = {} as MemberGradeExpressBenefit['tierFees'];
  const tierFeePercents = {} as MemberGradeExpressBenefit['tierFeePercents'];
  for (const tier of EXPRESS_TIERS) {
    tierFees[tier] = null;
    tierFeePercents[tier] = null;
  }
  return { tierFees, tierFeePercents, discountPercent: 0, discountUsdt: 0 };
}

function benefitForGrade(
  preset: PaidMembershipPresetDef,
  grade: MemberGrade,
): MemberGradeExpressBenefit {
  const base = emptyBenefit();
  if (grade === 'STANDARD') return base;
  const g = grade as PaidMemberGrade;
  const ultra =
    g === 'BLACK' && preset.blackUltraFeeUsdt != null ? preset.blackUltraFeeUsdt : null;
  return {
    ...base,
    tierFees: { ...base.tierFees, ULTRA: ultra },
    discountPercent: preset.expressDiscountPercent[g] ?? 0,
    discountUsdt: preset.expressDiscountUsdt[g] ?? 0,
  };
}

function cloneGrades(
  grades: Record<MemberGrade, MemberGradeExpressBenefit>,
): Record<MemberGrade, MemberGradeExpressBenefit> {
  const out = {} as Record<MemberGrade, MemberGradeExpressBenefit>;
  for (const g of MEMBER_GRADES) {
    const b = grades[g];
    out[g] = {
      discountPercent: b.discountPercent,
      discountUsdt: b.discountUsdt,
      tierFees: { ...b.tierFees },
      tierFeePercents: { ...b.tierFeePercents },
    };
  }
  return out;
}

export function buildMemberGradeFromPreset(presetId: PaidMembershipPresetId): HqMemberGradePolicy {
  const preset = PAID_MEMBERSHIP_PRESETS[presetId];
  const grades = {} as Record<MemberGrade, MemberGradeExpressBenefit>;
  for (const g of MEMBER_GRADES) {
    grades[g] = benefitForGrade(preset, g);
  }
  return {
    INDIVIDUAL: { grades: cloneGrades(grades) },
    CORPORATE: { grades: cloneGrades(grades) },
  };
}

function scaleAmount(n: number, mult: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * mult);
}

/** 1회 한도 × mult → 일일=×5, 월간=×20 */
export function scaleCurrencyLimitsForPaid(
  row: CurrencyTransactionLimits,
  perTxMult: number,
): CurrencyTransactionLimits {
  const perTx = scaleAmount(row.perTransactionMax, perTxMult);
  const daily = perTx > 0 ? perTx * 5 : scaleAmount(row.dailyMax, perTxMult);
  const monthly = perTx > 0 ? perTx * 20 : scaleAmount(row.monthlyMax, perTxMult);
  return {
    enabled: row.enabled !== false,
    perTransactionMin: row.perTransactionMin || 0,
    perTransactionMax: perTx,
    dailyMin: row.dailyMin || 0,
    dailyMax: daily,
    monthlyMin: row.monthlyMin || 0,
    monthlyMax: monthly,
  };
}

function scaleCustomerPolicy(
  policy: CustomerTransactionLimitsPolicy | undefined,
  perTxMult: number,
): CustomerTransactionLimitsPolicy {
  const out = {
    INDIVIDUAL: {} as Record<SymbolFeeCurrency, CurrencyTransactionLimits>,
    CORPORATE: {} as Record<SymbolFeeCurrency, CurrencyTransactionLimits>,
  };
  for (const type of ['INDIVIDUAL', 'CORPORATE'] as const) {
    for (const c of FEE_CURRENCIES) {
      const row = policy?.[type]?.[c] ?? {
        enabled: true,
        perTransactionMin: 0,
        perTransactionMax: 0,
        dailyMin: 0,
        dailyMax: 0,
        monthlyMin: 0,
        monthlyMax: 0,
      };
      out[type][c] = scaleCurrencyLimitsForPaid(row, perTxMult);
    }
  }
  return out;
}

function scaleMethodPolicy(
  general: MethodTransactionLimitsPolicy | null | undefined,
  perTxMult: number,
): MethodTransactionLimitsPolicy {
  const emptyCust = (): CustomerTransactionLimitsPolicy => {
    const make = () => {
      const row = {} as Record<SymbolFeeCurrency, CurrencyTransactionLimits>;
      for (const c of FEE_CURRENCIES) {
        row[c] = {
          enabled: true,
          perTransactionMin: 0,
          perTransactionMax: 0,
          dailyMin: 0,
          dailyMax: 0,
          monthlyMin: 0,
          monthlyMax: 0,
        };
      }
      return row;
    };
    return { INDIVIDUAL: make(), CORPORATE: make() };
  };
  if (!general) {
    return {
      BANK_TRANSFER: emptyCust(),
      REMITTANCE: emptyCust(),
      CARD: emptyCust(),
    };
  }
  return {
    BANK_TRANSFER: scaleCustomerPolicy(general.BANK_TRANSFER, perTxMult),
    REMITTANCE: scaleCustomerPolicy(general.REMITTANCE, perTxMult),
    CARD: scaleCustomerPolicy(general.CARD, perTxMult),
  };
}

export function buildPaidLimitsFromPreset(
  presetId: PaidMembershipPresetId,
  generalLimits: MethodTransactionLimitsPolicy | null | undefined,
): PaidMembershipLimitsPolicy {
  const preset = PAID_MEMBERSHIP_PRESETS[presetId];
  const out = {
    INDIVIDUAL: {} as Record<PaidMemberGrade, MethodTransactionLimitsPolicy>,
    CORPORATE: {} as Record<PaidMemberGrade, MethodTransactionLimitsPolicy>,
  };
  for (const type of ['INDIVIDUAL', 'CORPORATE'] as const) {
    for (const grade of PAID_MEMBER_GRADES) {
      out[type][grade] = scaleMethodPolicy(generalLimits, preset.limitPerTxMult[grade]);
    }
  }
  return out as PaidMembershipLimitsPolicy;
}

export function buildExpressQuotasFromPreset(
  presetId: PaidMembershipPresetId,
): PaidMembershipExpressQuotasPolicy {
  const preset = PAID_MEMBERSHIP_PRESETS[presetId];
  const out = defaultPaidMembershipExpressQuotasPolicy();
  for (const type of ['INDIVIDUAL', 'CORPORATE'] as const) {
    for (const grade of PAID_MEMBER_GRADES) {
      const src = preset.expressQuotas[grade] ?? defaultExpressQuotaByTier();
      const row = defaultExpressQuotaByTier();
      for (const tier of EXPRESS_QUOTA_TIERS) {
        row[tier] = Math.max(0, Math.floor(Number(src[tier]) || 0));
      }
      out[type][grade] = row;
    }
  }
  return out;
}

export function buildProductsFromPreset(
  presetId: PaidMembershipPresetId,
  existing?: PaidMembershipProductsPolicy | null,
): PaidMembershipProductsPolicy {
  const preset = PAID_MEMBERSHIP_PRESETS[presetId];
  const periodDays = monthsToPeriodDays(MEMBERSHIP_MONTH_MAX);
  const existingMap = new Map<string, PaidMembershipProductsPolicy['items'][number]>();
  for (const it of existing?.items ?? []) {
    existingMap.set(`${it.customerType}:${it.grade}`, it);
  }
  const items: PaidMembershipProductsPolicy['items'] = [];
  for (const type of ['INDIVIDUAL', 'CORPORATE'] as const) {
    for (const grade of PAID_MEMBER_GRADES) {
      const baseUsd = preset.annualPriceUsd[grade];
      const price =
        type === 'CORPORATE'
          ? corporatePriceFromPreset(baseUsd, preset.corporatePriceMult)
          : baseUsd;
      const prev = existingMap.get(`${type}:${grade}`);
      items.push(
        createDefaultCatalogItem({
          id: prev?.id,
          name: prev?.name,
          customerType: type,
          grade,
          enabled: true,
          price,
          currency: 'USD',
          periodDays,
          payMeans: prev?.payMeans ?? 'BOTH',
        }),
      );
    }
  }
  return { items };
}

/** UI 요약용 — KRW 1회 한도 예시 (일반 개인 1,000만 원 가정) */
export function exampleLimitKrw(presetId: PaidMembershipPresetId, grade: PaidMemberGrade): {
  perTx: number;
  daily: number;
  monthly: number;
} {
  const base = 10_000_000;
  const mult = PAID_MEMBERSHIP_PRESETS[presetId].limitPerTxMult[grade];
  const perTx = Math.round(base * mult);
  return { perTx, daily: perTx * 5, monthly: perTx * 20 };
}

export function formatQuotaShort(quotas: ExpressQuotaByTier): string {
  const parts: string[] = [];
  for (const tier of EXPRESS_QUOTA_TIERS) {
    const n = Math.floor(Number(quotas[tier]) || 0);
    if (n > 0) parts.push(`${tier}:${n}`);
  }
  return parts.length ? parts.join(' ') : '—';
}

function quotasEqual(a: ExpressQuotaByTier | undefined, b: ExpressQuotaByTier): boolean {
  if (!a) return false;
  for (const tier of EXPRESS_QUOTA_TIERS) {
    if (Math.floor(Number(a[tier]) || 0) !== Math.floor(Number(b[tier]) || 0)) return false;
  }
  return true;
}

/**
 * 현재 저장된 상품·쿼터·할인%가 어느 프리셋과 일치하는지 판별.
 * 하나라도 다르면 null (수동 수정·미적용).
 */
export function detectAppliedPaidMembershipPreset(input: {
  products: PaidMembershipProductsPolicy;
  expressQuotas: PaidMembershipExpressQuotasPolicy;
  memberGrade: HqMemberGradePolicy;
}): PaidMembershipPresetId | null {
  for (const id of PAID_MEMBERSHIP_PRESET_IDS) {
    const preset = PAID_MEMBERSHIP_PRESETS[id];
    let ok = true;
    for (const grade of PAID_MEMBER_GRADES) {
      const item = input.products.items.find(
        (it) => it.customerType === 'INDIVIDUAL' && it.grade === grade,
      );
      if (!item || Number(item.price) !== preset.annualPriceUsd[grade]) {
        ok = false;
        break;
      }
      if (!quotasEqual(input.expressQuotas.INDIVIDUAL?.[grade], preset.expressQuotas[grade])) {
        ok = false;
        break;
      }
      const benefit = input.memberGrade.INDIVIDUAL?.grades?.[grade];
      if (
        Math.round(Number(benefit?.discountPercent) || 0) !==
          preset.expressDiscountPercent[grade] ||
        Math.round(Number(benefit?.discountUsdt) || 0) !== preset.expressDiscountUsdt[grade]
      ) {
        ok = false;
        break;
      }
    }
    if (ok) return id;
  }
  return null;
}

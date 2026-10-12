import { CustomerType, MemberGrade } from '@prisma/client';
import {
  HQ_CONFIG_KEYS,
  MEMBER_GRADES,
  PAID_MEMBER_GRADES,
  type CustomerTypeLimitKey,
  type MemberGrade as HqMemberGrade,
  type MembershipProductPayMeans,
  type MethodTransactionLimitsPolicy,
  type PaidMemberGrade,
  type PaidMembershipCatalogItem,
  type PaidMembershipLimitsPolicy,
  type PaidMembershipProduct,
  type PaidMembershipProductsPolicy,
  isMembershipPriceCurrency,
  normalizeMemberGrade,
  type MembershipPriceCurrency,
} from '../constants/hq-policy';
import {
  defaultMethodTransactionLimitsPolicy,
  normalizeMethodTransactionLimits,
} from '../lib/transaction-limit-policy';
import {
  monthsToPeriodDays,
  normalizeMembershipPeriodDays,
  MEMBERSHIP_MONTH_MAX,
} from '../lib/membership-period';
import { prisma } from '../lib/prisma';
import { randomBytes } from 'crypto';

const DEFAULT_PRICE: Record<PaidMemberGrade, number> = {
  PREMIUM: 29,
  VIP: 59,
  VVIP: 99,
  PRESTIGE: 149,
  BLACK: 299,
};

export function isPaidMemberGrade(grade: string | null | undefined): grade is PaidMemberGrade {
  return (PAID_MEMBER_GRADES as readonly string[]).includes(String(grade ?? '').toUpperCase());
}

export function newMembershipProductId(): string {
  return `mp_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;
}

export function defaultPaidMembershipProduct(grade: PaidMemberGrade): PaidMembershipProduct {
  return {
    enabled: false,
    price: DEFAULT_PRICE[grade],
    currency: 'USD',
    /** 기본 상품군 기간: 12개월(월간) */
    periodDays: monthsToPeriodDays(MEMBERSHIP_MONTH_MAX),
    payMeans: 'CARD',
  };
}

function defaultCatalogName(grade: PaidMemberGrade, customerType: CustomerTypeLimitKey): string {
  const title = grade.charAt(0) + grade.slice(1).toLowerCase();
  return customerType === 'CORPORATE' ? `${title}B` : title;
}

export function createDefaultCatalogItem(
  partial?: Partial<PaidMembershipCatalogItem>,
): PaidMembershipCatalogItem {
  const grade = isPaidMemberGrade(partial?.grade) ? partial!.grade : 'PREMIUM';
  const customerType: CustomerTypeLimitKey =
    String(partial?.customerType).toUpperCase() === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL';
  const base = defaultPaidMembershipProduct(grade);
  return {
    id: partial?.id && String(partial.id).trim() ? String(partial.id) : newMembershipProductId(),
    name:
      typeof partial?.name === 'string' && partial.name.trim()
        ? partial.name.trim().slice(0, 80)
        : defaultCatalogName(grade, customerType),
    customerType,
    grade,
    enabled: partial?.enabled === true,
    price: Math.max(0, Number(partial?.price ?? base.price) || 0),
    currency: isMembershipPriceCurrency(String(partial?.currency ?? base.currency).toUpperCase())
      ? (String(partial?.currency ?? base.currency).toUpperCase() as MembershipPriceCurrency)
      : base.currency,
    periodDays: normalizeMembershipPeriodDays(partial?.periodDays ?? base.periodDays),
    payMeans: normalizePayMeans(partial?.payMeans ?? base.payMeans),
  };
}

export function defaultPaidMembershipProductsPolicy(): PaidMembershipProductsPolicy {
  return { items: [] };
}

function normalizePayMeans(raw: unknown): MembershipProductPayMeans {
  const v = String(raw ?? 'CARD').toUpperCase();
  if (v === 'CRYPTO' || v === 'BOTH') return v;
  return 'CARD';
}

function normalizeProductFields(
  raw: unknown,
  grade: PaidMemberGrade,
): PaidMembershipProduct {
  const d = defaultPaidMembershipProduct(grade);
  if (!raw || typeof raw !== 'object') return d;
  const o = raw as Partial<PaidMembershipProduct>;
  const currencyRaw = String(o.currency ?? d.currency).toUpperCase();
  const okCurrency: MembershipPriceCurrency = isMembershipPriceCurrency(currencyRaw)
    ? currencyRaw
    : d.currency;
  return {
    enabled: o.enabled === true,
    price: Math.max(0, Number(o.price) || 0),
    currency: okCurrency,
    periodDays: normalizeMembershipPeriodDays(o.periodDays ?? d.periodDays),
    payMeans: normalizePayMeans(o.payMeans),
  };
}

function migrateLegacyMatrix(raw: Record<string, unknown>): PaidMembershipCatalogItem[] {
  const items: PaidMembershipCatalogItem[] = [];
  for (const type of ['INDIVIDUAL', 'CORPORATE'] as const) {
    const bucket = raw[type];
    if (!bucket || typeof bucket !== 'object') continue;
    const map = bucket as Record<string, unknown>;
    for (const grade of PAID_MEMBER_GRADES) {
      if (!(grade in map)) continue;
      const fields = normalizeProductFields(map[grade], grade);
      items.push(
        createDefaultCatalogItem({
          ...fields,
          grade,
          customerType: type,
          name: defaultCatalogName(grade, type),
        }),
      );
    }
  }
  return items;
}

function normalizeCatalogItem(raw: unknown): PaidMembershipCatalogItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<PaidMembershipCatalogItem>;
  if (!isPaidMemberGrade(o.grade)) return null;
  return createDefaultCatalogItem(o);
}

export function normalizePaidMembershipProductsPolicy(
  raw?: unknown,
): PaidMembershipProductsPolicy {
  if (!raw || typeof raw !== 'object') return defaultPaidMembershipProductsPolicy();
  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.items)) {
    const items = obj.items
      .map((row) => normalizeCatalogItem(row))
      .filter((x): x is PaidMembershipCatalogItem => Boolean(x));
    /** id 중복 제거 */
    const seen = new Set<string>();
    const unique: PaidMembershipCatalogItem[] = [];
    for (const it of items) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      unique.push(it);
    }
    return { items: unique };
  }

  /** 구형 등급 매트릭스 → 카탈로그 */
  if (obj.INDIVIDUAL || obj.CORPORATE) {
    return { items: migrateLegacyMatrix(obj) };
  }

  return defaultPaidMembershipProductsPolicy();
}

export function listCatalogItems(
  policy: PaidMembershipProductsPolicy,
  customerType?: CustomerType | CustomerTypeLimitKey,
): PaidMembershipCatalogItem[] {
  const typeKey =
    customerType == null
      ? null
      : String(customerType).toUpperCase() === 'CORPORATE'
        ? 'CORPORATE'
        : 'INDIVIDUAL';
  return policy.items.filter((it) => (typeKey ? it.customerType === typeKey : true));
}

export function findCatalogItem(
  policy: PaidMembershipProductsPolicy,
  productId: string,
): PaidMembershipCatalogItem | null {
  return policy.items.find((it) => it.id === productId) ?? null;
}

export function defaultPaidMembershipLimitsPolicy(): PaidMembershipLimitsPolicy {
  const methods = defaultMethodTransactionLimitsPolicy();
  const gradeMap = {} as Record<PaidMemberGrade, MethodTransactionLimitsPolicy>;
  for (const g of PAID_MEMBER_GRADES) {
    gradeMap[g] = {
      BANK_TRANSFER: methods.BANK_TRANSFER,
      REMITTANCE: methods.REMITTANCE,
      CARD: methods.CARD,
    };
  }
  return {
    INDIVIDUAL: { ...gradeMap },
    CORPORATE: { ...gradeMap },
  };
}

export function normalizePaidMembershipLimitsPolicy(
  raw?: unknown,
): PaidMembershipLimitsPolicy {
  const defaults = defaultPaidMembershipLimitsPolicy();
  if (!raw || typeof raw !== 'object') return defaults;
  const obj = raw as Partial<
    Record<CustomerTypeLimitKey, Partial<Record<PaidMemberGrade, unknown>>>
  >;
  const out = defaultPaidMembershipLimitsPolicy();
  for (const type of ['INDIVIDUAL', 'CORPORATE'] as const) {
    for (const grade of PAID_MEMBER_GRADES) {
      const row = obj[type]?.[grade];
      if (row) {
        out[type][grade] = normalizeMethodTransactionLimits(
          row as MethodTransactionLimitsPolicy,
          undefined,
          100_000_000,
        );
      }
    }
  }
  return out;
}

export async function getPaidMembershipProducts(): Promise<PaidMembershipProductsPolicy> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.paidMembershipProducts },
  });
  return normalizePaidMembershipProductsPolicy(row?.value);
}

export async function savePaidMembershipProducts(
  policy: PaidMembershipProductsPolicy,
): Promise<PaidMembershipProductsPolicy> {
  const normalized = normalizePaidMembershipProductsPolicy(policy);
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.paidMembershipProducts },
    create: {
      key: HQ_CONFIG_KEYS.paidMembershipProducts,
      value: normalized as object,
    },
    update: { value: normalized as object },
  });
  return normalized;
}

export async function getPaidMembershipLimits(): Promise<PaidMembershipLimitsPolicy> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.paidMembershipLimits },
  });
  return normalizePaidMembershipLimitsPolicy(row?.value);
}

export async function savePaidMembershipLimits(
  policy: PaidMembershipLimitsPolicy,
): Promise<PaidMembershipLimitsPolicy> {
  const normalized = normalizePaidMembershipLimitsPolicy(policy);
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.paidMembershipLimits },
    create: {
      key: HQ_CONFIG_KEYS.paidMembershipLimits,
      value: normalized as object,
    },
    update: { value: normalized as object },
  });
  return normalized;
}

export type PaidMembershipStatus = {
  active: boolean;
  grade: HqMemberGrade;
  paidMemberUntil: Date | null;
  paidMemberSource: string | null;
  displayCode: string;
};

export function formatMemberGradeDisplayCode(
  grade: string | null | undefined,
  customerType?: CustomerType | string | null,
): string {
  const g = normalizeMemberGrade(grade);
  const title = g.charAt(0) + g.slice(1).toLowerCase();
  const corp = String(customerType).toUpperCase() === 'CORPORATE';
  return corp ? `${title}B` : title;
}

export function isPaidMembershipActive(input: {
  memberGrade?: string | null;
  paidMemberUntil?: Date | string | null;
}): boolean {
  const grade = normalizeMemberGrade(input.memberGrade);
  if (grade === 'STANDARD' || !isPaidMemberGrade(grade)) return false;
  if (!input.paidMemberUntil) return false;
  const until = new Date(input.paidMemberUntil);
  return Number.isFinite(until.getTime()) && until.getTime() > Date.now();
}

export function resolvePaidMembershipStatus(profile: {
  memberGrade?: string | null;
  paidMemberUntil?: Date | string | null;
  paidMemberSource?: string | null;
  customerType?: CustomerType | string | null;
}): PaidMembershipStatus {
  const grade = normalizeMemberGrade(profile.memberGrade);
  const until = profile.paidMemberUntil ? new Date(profile.paidMemberUntil) : null;
  const active = isPaidMembershipActive({
    memberGrade: grade,
    paidMemberUntil: until,
  });
  return {
    active,
    grade,
    paidMemberUntil: until && Number.isFinite(until.getTime()) ? until : null,
    paidMemberSource: profile.paidMemberSource ?? null,
    displayCode: formatMemberGradeDisplayCode(grade, profile.customerType),
  };
}

export async function getPaidGradeLimitsForCustomer(
  customerType: CustomerType | CustomerTypeLimitKey,
  grade: string | null | undefined,
): Promise<MethodTransactionLimitsPolicy | null> {
  if (!isPaidMemberGrade(grade)) return null;
  const typeKey: CustomerTypeLimitKey =
    String(customerType).toUpperCase() === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL';
  const policy = await getPaidMembershipLimits();
  return policy[typeKey][grade] ?? null;
}

export { MEMBER_GRADES };

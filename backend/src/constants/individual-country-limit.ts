import type { SymbolFeeCurrency } from './hq-policy';
import { DEFAULT_USDT_RISK_LIMIT_TIERS, type UsdtRiskLimitTier } from './hq-policy';

/** 개인 한도 산정 국가 (ISO2) — 가입 안내·통화 한도와 정합 */
export const INDIVIDUAL_LIMIT_COUNTRIES = ['JP', 'KR', 'TH', 'US', 'CN'] as const;
export type IndividualLimitCountry = (typeof INDIVIDUAL_LIMIT_COUNTRIES)[number];

export type IndividualCountryLimitBand = {
  country: IndividualLimitCountry;
  /** 현지 통화 1회 최대 */
  homeCurrency: SymbolFeeCurrency;
  maxFiat: number;
  /** USDT/USD 상당 1회 최대 (개인 기본 ≤ 10,000) */
  maxUsd: number;
  /** USDT 1회 최소 (개인 — LIVE 법인용 고액 min과 분리) */
  minUsdt: number;
};

/**
 * 개인고객 국가별 1회 한도 (가입 안내문과 동일 기준).
 * 대부분 약 10,000 USD 이하.
 */
export const INDIVIDUAL_COUNTRY_LIMITS: Record<IndividualLimitCountry, IndividualCountryLimitBand> =
  {
    JP: { country: 'JP', homeCurrency: 'JPY', maxFiat: 1_000_000, maxUsd: 10_000, minUsdt: 100 },
    KR: { country: 'KR', homeCurrency: 'KRW', maxFiat: 10_000_000, maxUsd: 10_000, minUsdt: 100 },
    TH: { country: 'TH', homeCurrency: 'THB', maxFiat: 330_000, maxUsd: 10_000, minUsdt: 100 },
    US: { country: 'US', homeCurrency: 'USD', maxFiat: 10_000, maxUsd: 10_000, minUsdt: 100 },
    CN: { country: 'CN', homeCurrency: 'CNY', maxFiat: 65_000, maxUsd: 10_000, minUsdt: 100 },
  };

const PHONE_TO_COUNTRY: Record<string, IndividualLimitCountry> = {
  '+81': 'JP',
  '+82': 'KR',
  '+66': 'TH',
  '+1': 'US',
  '+86': 'CN',
};

/** 알 수 없는 국가는 USD 10,000 상한으로 보수 적용 */
export const DEFAULT_INDIVIDUAL_LIMIT_COUNTRY: IndividualLimitCountry = 'US';

export function normalizeIndividualLimitCountry(
  raw?: string | null,
): IndividualLimitCountry | null {
  const c = String(raw || '')
    .trim()
    .toUpperCase();
  if ((INDIVIDUAL_LIMIT_COUNTRIES as readonly string[]).includes(c)) {
    return c as IndividualLimitCountry;
  }
  return null;
}

export function countryFromPhoneCode(phoneCountryCode?: string | null): IndividualLimitCountry | null {
  const code = String(phoneCountryCode || '').trim();
  if (!code) return null;
  if (PHONE_TO_COUNTRY[code]) return PHONE_TO_COUNTRY[code];
  const digits = code.startsWith('+') ? code : `+${code.replace(/\D/g, '')}`;
  return PHONE_TO_COUNTRY[digits] ?? null;
}

export function countryFromIpHeader(raw?: string | null): IndividualLimitCountry | null {
  const c = String(raw || '')
    .trim()
    .toUpperCase();
  if (!c || c === 'XX' || c === 'T1') return null;
  return normalizeIndividualLimitCountry(c);
}

export function resolveIndividualCountryLimit(
  country: IndividualLimitCountry,
): IndividualCountryLimitBand {
  return INDIVIDUAL_COUNTRY_LIMITS[country] ?? INDIVIDUAL_COUNTRY_LIMITS[DEFAULT_INDIVIDUAL_LIMIT_COUNTRY];
}

/** 개인 LIVE: 본사 티어 min이 법인용으로 올라간 경우 코드 기본 min으로 되돌림 */
export function individualFriendlyMinUsdt(
  code: UsdtRiskLimitTier,
  liveMinUsdt: number,
  countryMinUsdt: number,
): number {
  const codeDefault = DEFAULT_USDT_RISK_LIMIT_TIERS[code]?.minUsdt ?? 100;
  const candidates = [codeDefault, countryMinUsdt].filter((n) => n > 0);
  const friendly = candidates.length ? Math.min(...candidates) : 100;
  if (liveMinUsdt <= 0) return friendly;
  /** LIVE min이 개인 상한(대략 1만) 이상이면 법인용으로 보고 무시 */
  if (liveMinUsdt >= 3_000) return friendly;
  return Math.min(liveMinUsdt, friendly);
}

export function individualFriendlyMaxUsdt(
  liveMaxUsdt: number,
  countryMaxUsd: number,
): number {
  const caps = [countryMaxUsd > 0 ? countryMaxUsd : 10_000];
  if (liveMaxUsdt > 0) caps.push(liveMaxUsdt);
  return Math.min(...caps);
}

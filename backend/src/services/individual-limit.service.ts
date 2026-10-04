import { CustomerType } from '@prisma/client';
import {
  countryFromIpHeader,
  countryFromPhoneCode,
  DEFAULT_INDIVIDUAL_LIMIT_COUNTRY,
  individualFriendlyMaxUsdt,
  individualFriendlyMinUsdt,
  normalizeIndividualLimitCountry,
  resolveIndividualCountryLimit,
  type IndividualCountryLimitBand,
  type IndividualLimitCountry,
} from '../constants/individual-country-limit';
import {
  DEFAULT_USDT_RISK_LIMIT_TIERS,
  normalizeUsdtRiskLimitCode,
  type UsdtRiskLimitCode,
  type UsdtRiskLimitTier,
} from '../constants/hq-policy';
import { prisma } from '../lib/prisma';

export type ResolvedIndividualLimitContext = {
  country: IndividualLimitCountry;
  source: 'limitCountry' | 'phone' | 'signupIp' | 'wiseSender' | 'default';
  band: IndividualCountryLimitBand;
};

export function pickIndividualLimitCountry(input: {
  limitCountry?: string | null;
  phoneCountryCode?: string | null;
  signupCountry?: string | null;
  wiseSenderCountry?: string | null;
}): ResolvedIndividualLimitContext {
  const fromLimit = normalizeIndividualLimitCountry(input.limitCountry);
  if (fromLimit) {
    return {
      country: fromLimit,
      source: 'limitCountry',
      band: resolveIndividualCountryLimit(fromLimit),
    };
  }
  const fromPhone = countryFromPhoneCode(input.phoneCountryCode);
  if (fromPhone) {
    return {
      country: fromPhone,
      source: 'phone',
      band: resolveIndividualCountryLimit(fromPhone),
    };
  }
  const fromSignup = countryFromIpHeader(input.signupCountry);
  if (fromSignup) {
    return {
      country: fromSignup,
      source: 'signupIp',
      band: resolveIndividualCountryLimit(fromSignup),
    };
  }
  const fromWise = normalizeIndividualLimitCountry(input.wiseSenderCountry);
  if (fromWise) {
    return {
      country: fromWise,
      source: 'wiseSender',
      band: resolveIndividualCountryLimit(fromWise),
    };
  }
  return {
    country: DEFAULT_INDIVIDUAL_LIMIT_COUNTRY,
    source: 'default',
    band: resolveIndividualCountryLimit(DEFAULT_INDIVIDUAL_LIMIT_COUNTRY),
  };
}

export async function resolveCustomerIndividualLimitContext(
  customerProfileId: string,
): Promise<ResolvedIndividualLimitContext | null> {
  const profile = await prisma.customerProfile.findUnique({
    where: { id: customerProfileId },
    select: {
      customerType: true,
      limitCountry: true,
      signupCountry: true,
      wiseSenderCountry: true,
      user: { select: { phoneCountryCode: true } },
    },
  });
  if (!profile || profile.customerType !== CustomerType.INDIVIDUAL) return null;
  return pickIndividualLimitCountry({
    limitCountry: profile.limitCountry,
    phoneCountryCode: profile.user.phoneCountryCode,
    signupCountry: profile.signupCountry,
    wiseSenderCountry: profile.wiseSenderCountry,
  });
}

export function applyIndividualLiveRiskBand(input: {
  code: UsdtRiskLimitCode;
  liveMinUsdt: number;
  liveMaxUsdt: number;
  countryBand: IndividualCountryLimitBand;
}): { minUsdt: number; maxUsdt: number } {
  if (input.code === 'ML') {
    return {
      minUsdt: Math.max(0, input.liveMinUsdt),
      maxUsdt: Math.max(0, input.liveMaxUsdt),
    };
  }
  const tier = input.code as UsdtRiskLimitTier;
  const codeDefault = DEFAULT_USDT_RISK_LIMIT_TIERS[tier] ?? DEFAULT_USDT_RISK_LIMIT_TIERS.MR;
  return {
    minUsdt: individualFriendlyMinUsdt(
      tier,
      input.liveMinUsdt > 0 ? input.liveMinUsdt : codeDefault.minUsdt,
      input.countryBand.minUsdt,
    ),
    maxUsdt: individualFriendlyMaxUsdt(
      input.liveMaxUsdt > 0 ? input.liveMaxUsdt : codeDefault.maxUsdt,
      input.countryBand.maxUsd,
    ),
  };
}

export function clientIpFromRequest(req: {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string | null };
  ip?: string;
}): string | null {
  const header = (name: string) => {
    const v = req.headers[name];
    return Array.isArray(v) ? v[0] : v;
  };
  const cf = header('cf-connecting-ip')?.trim();
  if (cf) return cf;
  const real = header('x-real-ip')?.trim();
  if (real) return real;
  const forwarded = header('x-forwarded-for');
  if (forwarded) {
    const first = String(forwarded).split(',')[0]?.trim();
    if (first) return first;
  }
  const ip = req.ip || req.socket?.remoteAddress || null;
  return ip ? String(ip).replace(/^::ffff:/, '') : null;
}

export function clientCountryFromRequest(req: {
  headers: Record<string, string | string[] | undefined>;
}): IndividualLimitCountry | null {
  const header = (name: string) => {
    const v = req.headers[name];
    return Array.isArray(v) ? v[0] : v;
  };
  return (
    countryFromIpHeader(header('cf-ipcountry')) ||
    countryFromIpHeader(header('x-vercel-ip-country')) ||
    countryFromIpHeader(header('cloudfront-viewer-country')) ||
    null
  );
}

export function resolveLimitCountryForRegister(input: {
  limitCountry?: string | null;
  phoneCountryCode?: string | null;
  signupCountry?: string | null;
}): IndividualLimitCountry {
  return pickIndividualLimitCountry(input).country;
}

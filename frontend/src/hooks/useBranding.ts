'use client';

import { useEffect, useState } from 'react';
import { api, type BrandingResponse } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/api-base';
import { setCurrencyAmountDisplayPolicy } from '@/lib/format';
import type { Locale } from '@/i18n/locales';

export type ResolvedBranding = {
  siteName: string;
  tabTitle: string;
  logoUrl: string | null;
  authLogoUrl: string | null;
  faviconUrl: string | null;
  authBackgroundUrl: string | null;
  registerBackgroundUrl: string | null;
  authMainText: string;
  footerText: string;
  loginNoticeEnabled: boolean;
  loginNoticeI18n: Partial<Record<Locale, { title: string; body: string }>>;
  customerRegistrationEnabled: boolean;
  accountRecoveryEnabled: boolean;
  individualRegisterNoticeEnabled: boolean;
  individualRegisterNoticeI18n: Partial<Record<Locale, { title: string; body: string }>>;
  baseTimezone: string;
  serviceTimezone: string;
  settlementAsset: 'USDT' | 'USDC';
};

function resolveUrls(b: BrandingResponse): ResolvedBranding {
  const base = getApiBaseUrl();
  return {
    siteName: b.siteName || 'Crypto Workflow',
    tabTitle: (b.tabTitle || b.siteName || '').trim() || 'Crypto Workflow',
    logoUrl: b.logoUrl ? `${base}${b.logoUrl}` : null,
    authLogoUrl: b.authLogoUrl ? `${base}${b.authLogoUrl}` : null,
    faviconUrl: b.faviconUrl ? `${base}${b.faviconUrl}` : null,
    authBackgroundUrl: b.authBackgroundUrl ? `${base}${b.authBackgroundUrl}` : null,
    registerBackgroundUrl: b.registerBackgroundUrl ? `${base}${b.registerBackgroundUrl}` : null,
    authMainText: b.authMainText || '',
    footerText: b.footerText || '',
    loginNoticeEnabled: b.loginNoticeEnabled !== false,
    loginNoticeI18n: b.loginNoticeI18n ?? {},
    customerRegistrationEnabled: b.customerRegistrationEnabled !== false,
    accountRecoveryEnabled: b.accountRecoveryEnabled !== false,
    individualRegisterNoticeEnabled: b.individualRegisterNoticeEnabled !== false,
    individualRegisterNoticeI18n: b.individualRegisterNoticeI18n ?? {},
    baseTimezone: b.baseTimezone || 'Asia/Seoul',
    serviceTimezone: b.serviceTimezone || 'Asia/Seoul',
    settlementAsset: b.settlementAsset === 'USDC' ? 'USDC' : 'USDT',
  };
}

const FALLBACK: ResolvedBranding = {
  siteName: 'Crypto Workflow',
  tabTitle: 'Crypto Workflow',
  logoUrl: null,
  authLogoUrl: null,
  faviconUrl: null,
  authBackgroundUrl: null,
  registerBackgroundUrl: null,
  authMainText: '',
  footerText: '',
  loginNoticeEnabled: true,
  loginNoticeI18n: {},
  customerRegistrationEnabled: true,
  accountRecoveryEnabled: true,
  individualRegisterNoticeEnabled: true,
  individualRegisterNoticeI18n: {},
  baseTimezone: 'Asia/Seoul',
  serviceTimezone: 'Asia/Seoul',
  settlementAsset: 'USDT',
};

export function useBranding() {
  const [branding, setBranding] = useState<ResolvedBranding | null>(null);

  useEffect(() => {
    api.branding()
      .then((b) => {
        if (b.currencyAmountDisplay) {
          setCurrencyAmountDisplayPolicy(b.currencyAmountDisplay);
        }
        setBranding(resolveUrls(b));
      })
      .catch(() => setBranding(FALLBACK));
  }, []);

  return branding;
}

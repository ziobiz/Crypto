'use client';

import { useEffect, useState } from 'react';
import { api, type BrandingResponse } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/api-base';
import type { Locale } from '@/i18n/locales';

export type ResolvedBranding = {
  siteName: string;
  tabTitle: string;
  logoUrl: string | null;
  authLogoUrl: string | null;
  faviconUrl: string | null;
  authBackgroundUrl: string | null;
  authMainText: string;
  footerText: string;
  loginNoticeEnabled: boolean;
  loginNoticeI18n: Partial<Record<Locale, { title: string; body: string }>>;
  customerRegistrationEnabled: boolean;
  baseTimezone: string;
  serviceTimezone: string;
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
    authMainText: b.authMainText || '',
    footerText: b.footerText || '',
    loginNoticeEnabled: b.loginNoticeEnabled !== false,
    loginNoticeI18n: b.loginNoticeI18n ?? {},
    customerRegistrationEnabled: b.customerRegistrationEnabled === true,
    baseTimezone: b.baseTimezone || 'Asia/Seoul',
    serviceTimezone: b.serviceTimezone || 'Asia/Seoul',
  };
}

const FALLBACK: ResolvedBranding = {
  siteName: 'Crypto Workflow',
  tabTitle: 'Crypto Workflow',
  logoUrl: null,
  authLogoUrl: null,
  faviconUrl: null,
  authBackgroundUrl: null,
  authMainText: '',
  footerText: '',
  loginNoticeEnabled: true,
  loginNoticeI18n: {},
  customerRegistrationEnabled: false,
  baseTimezone: 'Asia/Seoul',
  serviceTimezone: 'Asia/Seoul',
};

export function useBranding() {
  const [branding, setBranding] = useState<ResolvedBranding | null>(null);

  useEffect(() => {
    api.branding().then((b) => setBranding(resolveUrls(b))).catch(() => setBranding(FALLBACK));
  }, []);

  return branding;
}

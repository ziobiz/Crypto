'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useLocale, useT } from '@/context/LocaleProvider';
import { useBranding } from '@/hooks/useBranding';
import type { MessageKey } from '@/i18n/messages';
import {
  CURRENT_LIVE_VERSION,
  buildManualHtml,
  localeFromApp,
  manualsForRole,
  openManualPlaceholderWindow,
  openManualWindow,
  resolveManualBrandAssets,
  type AppRole,
} from '@/lib/manuals';

const AUDIENCE_LABEL: Record<string, MessageKey> = {
  hq: 'manual.audience.hq',
  org: 'manual.audience.org',
  customer: 'manual.audience.customer',
};

export default function ManualsPage() {
  const { user } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const branding = useBranding();
  const [error, setError] = useState('');

  const role = (user?.role ?? 'CUSTOMER') as AppRole;
  const items = useMemo(() => manualsForRole(role), [role]);

  const grouped = useMemo(() => {
    const order = ['hq', 'org', 'customer'] as const;
    return order
      .map((aud) => ({
        audience: aud,
        rows: items.filter((i) => i.audience === aud),
      }))
      .filter((g) => g.rows.length > 0);
  }, [items]);

  async function openManual(id: string, docVersion: string) {
    setError('');
    let win: Window | null = null;
    try {
      win = openManualPlaceholderWindow();
      const brand = await resolveManualBrandAssets({
        siteName: branding?.siteName ?? t('app.title'),
        // 메뉴얼 커버: 로그인 패널(첫화면) 로고 — 사이드바 로고는 글자가 잘 안 보임
        logoUrl: branding?.authLogoUrl ?? branding?.logoUrl ?? '',
        faviconUrl: branding?.faviconUrl ?? branding?.authLogoUrl ?? branding?.logoUrl ?? '',
        footerText: branding?.footerText ?? undefined,
      });
      const html = buildManualHtml(id, localeFromApp(locale), brand, docVersion);
      openManualWindow(html, win);
    } catch {
      try {
        win?.close();
      } catch {
        /* ignore */
      }
      setError(t('manual.popupBlocked'));
    }
  }

  return (
    <div className="pg-stack">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-bold text-gray-900">{t('manual.title')}</h1>
          <p className="mt-1 text-[13px] text-gray-600">{t('manual.desc')}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-[12px] font-bold text-blue-800">
          {t('manual.liveVersion', { version: CURRENT_LIVE_VERSION })}
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {grouped.length === 0 ? (
        <p className="pg-hint">{t('manual.empty')}</p>
      ) : (
        grouped.map((g) => (
          <div key={g.audience} className="pg-card">
            <div className="pg-card-head">{t(AUDIENCE_LABEL[g.audience]!)}</div>
            <div className="divide-y divide-gray-100">
              {g.rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openManual(row.id, row.docVersion)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="text-[13px] font-semibold text-gray-800">
                    {t(row.titleKey as MessageKey)}
                  </span>
                  <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    V{row.docVersion}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      <p className="text-[11px] text-gray-500">{t('manual.openHint')}</p>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useLocale } from '@/context/LocaleProvider';
import type { ResolvedBranding } from '@/hooks/useBranding';
import { resolveLoginNotice } from '@/lib/login-notice';

export function AuthChrome({
  children,
  branding,
}: {
  children: React.ReactNode;
  branding?: ResolvedBranding | null;
}) {
  const { locale } = useLocale();
  const authLogo = branding?.authLogoUrl ?? branding?.logoUrl;
  const notice = resolveLoginNotice(
    locale,
    branding?.loginNoticeEnabled,
    branding?.loginNoticeI18n,
  );

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col md:flex-row md:overflow-hidden">
      {/* 왼쪽: 배경 + 브랜드 문구 (PG main area) */}
      <div className="relative min-h-[120px] flex-1 bg-[#1a1d21] md:min-h-0">
        {branding?.authBackgroundUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${branding.authBackgroundUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-black/10" />
        {branding?.authMainText ? (
          <div className="absolute left-[8%] top-[38%] z-10 max-w-[48%] -translate-y-1/2 whitespace-pre-line text-2xl font-bold leading-tight tracking-wide text-slate-900 drop-shadow-sm sm:text-3xl md:text-[42px]">
            {branding.authMainText}
          </div>
        ) : null}
      </div>

      {/* 오른쪽: 로그인 패널 (PG login-panel-wrap) */}
      <div className="flex w-full shrink-0 flex-col bg-white md:w-[360px] md:overflow-y-auto">
        <div className="flex flex-1 flex-col px-4 py-5 sm:px-5">
          {authLogo ? (
            <div className="mb-4 flex justify-center">
              <Link
                href="/"
                className="inline-flex rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Home"
              >
                <img
                  src={authLogo}
                  alt=""
                  className="max-h-[52px] max-w-[220px] cursor-pointer object-contain"
                />
              </Link>
            </div>
          ) : null}

          {notice ? (
            <section
              className="mb-4 rounded-lg border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 px-3.5 py-3 text-xs leading-relaxed text-gray-600 shadow-sm"
              role="note"
            >
              <h3 className="mb-2 text-[13px] font-bold tracking-tight text-gray-700">
                {notice.title}
              </h3>
              <div className="space-y-2 whitespace-pre-wrap">{notice.body}</div>
            </section>
          ) : null}

          <div className="flex-1">{children}</div>

          {branding?.footerText ? (
            <p className="mt-6 border-t border-gray-100 pt-4 text-center text-[11px] text-gray-400">
              {branding.footerText}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

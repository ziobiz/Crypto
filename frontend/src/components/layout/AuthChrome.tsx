'use client';

import Link from 'next/link';
import { useLocale } from '@/context/LocaleProvider';
import { LocaleDropdown } from './LocaleDropdown';
import type { ResolvedBranding } from '@/hooks/useBranding';
import { resolveLoginNotice } from '@/lib/login-notice';

export function AuthChrome({
  children,
  branding,
  variant = 'login',
}: {
  children: React.ReactNode;
  branding?: ResolvedBranding | null;
  /** login: 좁은 우측 패널 / register: 넓은 가입창 */
  variant?: 'login' | 'register';
}) {
  const { locale } = useLocale();
  const authLogo = branding?.authLogoUrl ?? branding?.logoUrl;
  const isRegister = variant === 'register';
  const notice = isRegister
    ? null
    : resolveLoginNotice(locale, branding?.loginNoticeEnabled, branding?.loginNoticeI18n);
  /** 가입창: 전용 이미지가 있을 때만 왼쪽 비주얼 표시 (로그인 배경과 분리) */
  const registerVisual = isRegister ? branding?.registerBackgroundUrl : null;
  const showLeftPanel = !isRegister || Boolean(registerVisual);

  return (
    <div
      className={`auth-chrome flex min-h-screen min-h-[100dvh] flex-col md:flex-row ${
        isRegister ? 'md:overflow-y-auto' : 'md:overflow-hidden'
      }`}
    >
      {showLeftPanel ? (
        <div
          className={`relative flex-none bg-[#1a1d21] ${
            isRegister
              ? 'min-h-[120px] sm:min-h-[160px] md:min-h-0 md:w-[240px] md:shrink-0 lg:w-[300px]'
              : 'min-h-[88px] sm:min-h-[120px] md:min-h-0 md:flex-1'
          }`}
        >
          {isRegister && registerVisual ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${registerVisual})` }}
            />
          ) : !isRegister && branding?.authBackgroundUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${branding.authBackgroundUrl})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-black/10" />
          {branding?.authMainText && !isRegister ? (
            <div className="absolute left-[6%] top-1/2 z-10 hidden max-w-[48%] -translate-y-1/2 whitespace-pre-line text-2xl font-bold leading-tight tracking-wide text-slate-900 drop-shadow-sm sm:block sm:text-3xl md:left-[8%] md:text-[42px]">
              {branding.authMainText}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={`flex w-full flex-col bg-white ${
          isRegister
            ? 'min-w-0 flex-1 md:overflow-y-auto'
            : 'shrink-0 md:w-[360px] md:overflow-y-auto'
        }`}
      >
        <div
          className={`flex flex-1 flex-col px-4 py-5 sm:px-5 ${
            isRegister ? 'mx-auto w-full max-w-5xl md:px-8 md:py-6 lg:px-10' : ''
          }`}
        >
          <div
            className={`flex items-center justify-between gap-3 ${
              isRegister ? 'mb-[0.9rem]' : 'mb-3'
            }`}
          >
            {isRegister && authLogo ? (
              <Link
                href="/login"
                className="inline-flex rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Home"
              >
                <img
                  src={authLogo}
                  alt=""
                  className="max-h-[40px] max-w-[160px] object-contain"
                />
              </Link>
            ) : (
              <span />
            )}
            <LocaleDropdown />
          </div>
          {isRegister ? <div className="mb-2" aria-hidden /> : null}

          {!isRegister && authLogo ? (
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

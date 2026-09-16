'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useT } from '@/context/LocaleProvider';

/** Public site key (safe in the browser). Secret stays on the server. */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '0x4AAAAAAE1qKDEv7YAqX0fg';

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function TurnstileWidget({
  onToken,
  resetKey = 0,
}: {
  onToken: (token: string) => void;
  resetKey?: number;
}) {
  const t = useT();
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [status, setStatus] = useState<'wait' | 'ok' | 'err'>('wait');

  useEffect(() => {
    let stopped = false;
    setStatus('wait');
    onTokenRef.current('');

    const destroy = () => {
      if (widgetId.current != null && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* ignore */
        }
      }
      widgetId.current = null;
      if (hostRef.current) hostRef.current.innerHTML = '';
    };

    const tryRender = () => {
      if (stopped) return true;
      if (widgetId.current != null) return true;
      const api = window.turnstile;
      const host = hostRef.current;
      if (!api || !host) return false;
      widgetId.current = api.render(host, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'light',
        size: 'flexible',
        appearance: 'interaction-only',
        callback: (token: string) => {
          setStatus('ok');
          onTokenRef.current(token);
        },
        'expired-callback': () => {
          setStatus('wait');
          onTokenRef.current('');
        },
        'error-callback': () => {
          setStatus('err');
          onTokenRef.current('');
        },
      });
      return widgetId.current != null;
    };

    if (!tryRender()) {
      const timer = window.setInterval(() => {
        if (tryRender()) window.clearInterval(timer);
      }, 120);
      const giveUp = window.setTimeout(() => {
        window.clearInterval(timer);
        if (!stopped && widgetId.current == null) setStatus('err');
      }, 15000);
      return () => {
        stopped = true;
        window.clearInterval(timer);
        window.clearTimeout(giveUp);
        destroy();
      };
    }

    return () => {
      stopped = true;
      destroy();
    };
  }, [resetKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      {status === 'wait' && (
        <p className="rounded-lg border border-[#eadfce] bg-[#fff7ea] px-3.5 py-2.5 text-center text-[13px] leading-snug text-[#5a5146]">
          {t('auth.turnstileWait')}
        </p>
      )}
      {status === 'err' && (
        <p className="text-center text-sm text-red-600">{t('auth.turnstileFailed')}</p>
      )}
      <div
        ref={hostRef}
        className="pointer-events-none h-0 overflow-hidden opacity-0"
        aria-hidden
      />
    </>
  );
}

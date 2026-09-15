'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

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
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    let stopped = false;

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
        size: 'normal',
        appearance: 'always',
        callback: (token: string) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(''),
        'error-callback': () => onTokenRef.current(''),
      });
      return widgetId.current != null;
    };

    if (!tryRender()) {
      const timer = window.setInterval(() => {
        if (tryRender()) window.clearInterval(timer);
      }, 120);
      const giveUp = window.setTimeout(() => window.clearInterval(timer), 15000);
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
      <div ref={hostRef} className="flex min-h-[65px] w-full justify-center" />
    </>
  );
}

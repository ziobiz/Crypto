'use client';

import { useCallback, useEffect, useRef } from 'react';

const CHECK_MS = 60 * 1000;
const STORAGE_KEY = 'crypto_last_activity';
const DEFAULT_IDLE_MINUTES = 30;

export function touchActivity() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
}

export function useIdleTimeout(
  onIdle: () => void,
  enabled: boolean,
  idleMinutes: number = DEFAULT_IDLE_MINUTES,
) {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;
  const idleMs = Math.max(10, idleMinutes) * 60 * 1000;

  const reset = useCallback(() => {
    touchActivity();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    touchActivity();
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
    const handler = () => touchActivity();
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    const timer = window.setInterval(() => {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const last = raw ? Number(raw) : Date.now();
      if (Date.now() - last >= idleMs) {
        onIdleRef.current();
      }
    }, CHECK_MS);

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      window.clearInterval(timer);
    };
  }, [enabled, idleMs]);

  return { reset };
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

function formatMmSs(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * USDT 신규 신청: 최대 체류 + 무동작 타이머.
 * 금액 변경과 무관하게 세션 시계는 유지.
 */
export function useApplySessionTimers(opts: {
  enabled: boolean;
  applyMaxMinutes: number;
  applyIdleMinutes: number;
  onExpire: (reason: 'max' | 'idle') => void;
}) {
  const { enabled, applyMaxMinutes, applyIdleMinutes, onExpire } = opts;
  const sessionEndRef = useRef<number>(0);
  const idleEndRef = useRef<number>(0);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const [sessionLabel, setSessionLabel] = useState('00:00');

  const bumpIdle = useCallback(() => {
    if (!enabled || expiredRef.current) return;
    idleEndRef.current = Date.now() + Math.max(1, applyIdleMinutes) * 60 * 1000;
  }, [enabled, applyIdleMinutes]);

  useEffect(() => {
    if (!enabled) return;
    expiredRef.current = false;
    const now = Date.now();
    sessionEndRef.current = now + Math.max(1, applyMaxMinutes) * 60 * 1000;
    idleEndRef.current = now + Math.max(1, applyIdleMinutes) * 60 * 1000;

    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'touchstart',
      'scroll',
      'mousemove',
    ];
    const onActivity = () => bumpIdle();
    for (const ev of events) {
      window.addEventListener(ev, onActivity, { passive: true });
    }

    const tick = () => {
      if (expiredRef.current) return;
      const nowTick = Date.now();
      const sessionLeft = sessionEndRef.current - nowTick;
      const idleLeft = idleEndRef.current - nowTick;
      setSessionLabel(formatMmSs(sessionLeft));
      if (sessionLeft <= 0) {
        expiredRef.current = true;
        onExpireRef.current('max');
        return;
      }
      if (idleLeft <= 0) {
        expiredRef.current = true;
        onExpireRef.current('idle');
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(id);
      for (const ev of events) {
        window.removeEventListener(ev, onActivity);
      }
    };
  }, [enabled, applyMaxMinutes, applyIdleMinutes, bumpIdle]);

  return { sessionLabel, bumpIdle };
}

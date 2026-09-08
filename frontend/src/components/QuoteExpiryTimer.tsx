'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';

export function QuoteExpiryTimer({
  quotedAt,
  expiresInSeconds,
  onExpired,
}: {
  quotedAt: string | Date | null | undefined;
  expiresInSeconds: number;
  onExpired?: () => void;
}) {
  const t = useT();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!quotedAt || !(expiresInSeconds > 0)) {
      setRemaining(null);
      return;
    }
    const start = new Date(quotedAt).getTime();
    if (!Number.isFinite(start)) {
      setRemaining(null);
      return;
    }

    let expiredFired = false;
    const tick = () => {
      const left = Math.max(0, Math.ceil((start + expiresInSeconds * 1000 - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0 && !expiredFired) {
        expiredFired = true;
        onExpired?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [quotedAt, expiresInSeconds, onExpired]);

  if (remaining == null) return null;

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const urgent = remaining <= 30;

  return (
    <p className={`pg-hint ${urgent ? 'text-rose-600 font-semibold' : ''}`}>
      {t('usdt.quote.timer', {
        time: `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`,
      })}
    </p>
  );
}

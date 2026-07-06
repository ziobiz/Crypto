'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { api, AllExchangeRatesResponse } from '@/lib/api';

const REFRESH_MS = 60_000;

export function UsdtRatePanel({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const [rates, setRates] = useState<AllExchangeRatesResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () => {
      api
        .exchangeRatesAll()
        .then((r) => {
          if (active) {
            setRates(r);
            setError(false);
          }
        })
        .catch(() => {
          if (active) setError(true);
        });
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  if (error && !rates) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {t('dashboard.rateError')}
      </div>
    );
  }

  if (!rates) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">
        {t('dashboard.rateLoading')}
      </div>
    );
  }

  const items = [
    { key: 'KRW', rate: rates.rates.KRW.rate },
    { key: 'USD', rate: rates.rates.USD.rate },
    { key: 'JPY', rate: rates.rates.JPY.rate },
  ];

  return (
    <div className={`rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
          {t('dashboard.usdtLiveRate')}
        </h2>
        <span className="text-xs text-gray-500">
          {new Date(rates.fetchedAt).toLocaleTimeString()}
        </span>
      </div>
      <div className={`mt-3 grid gap-3 ${compact ? 'grid-cols-3' : 'sm:grid-cols-3'}`}>
        {items.map((item) => (
          <div key={item.key} className="rounded-lg bg-white/80 px-3 py-2 shadow-sm">
            <p className="text-xs text-gray-500">USDT / {item.key}</p>
            <p className={`font-bold text-blue-700 ${compact ? 'text-lg' : 'text-xl'}`}>
              {item.rate.toLocaleString(undefined, { maximumFractionDigits: item.key === 'USD' ? 4 : 2 })}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500">{rates.disclaimer}</p>
    </div>
  );
}

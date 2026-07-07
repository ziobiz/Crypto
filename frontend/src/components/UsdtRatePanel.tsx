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
    return <div className="rounded border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">{t('dashboard.rateError')}</div>;
  }

  if (!rates) {
    return <p className="pg-hint">{t('dashboard.rateLoading')}</p>;
  }

  const items = ['KRW', 'JPY', 'THB', 'CNY'].map((key) => ({
    key,
    rate: rates.rates[key]?.rate ?? 0,
    source: rates.rates[key]?.source ?? rates.source,
  }));

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold text-gray-900">{t('dashboard.usdtLiveRate')}</h2>
        <span className="pg-hint">{new Date(rates.fetchedAt).toLocaleTimeString()}</span>
      </div>
      <div className={`grid gap-2 ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'sm:grid-cols-4'}`}>
        {items.map((item) => (
          <div key={item.key} className="rounded border border-blue-100 bg-blue-50/40 px-3 py-2">
            <p className="text-[10px] text-gray-500">USDT / {item.key}</p>
            <p className="text-sm font-bold text-blue-700 tabular-nums">
              {item.rate.toLocaleString(undefined, { maximumFractionDigits: item.key === 'JPY' ? 2 : 0 })}
            </p>
            <p className="text-[9px] text-gray-400">{item.source}</p>
          </div>
        ))}
      </div>
      <p className="pg-hint">{rates.disclaimer}</p>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  type ChartFiatCurrency,
  type ChartRange,
  type DashboardChartsResponse,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

const FIAT_CURRENCIES: ChartFiatCurrency[] = ['KRW', 'JPY', 'THB', 'CNY'];
const RANGE_OPTIONS: ChartRange[] = ['7d', '30d', '12m'];

const CURRENCY_COLORS: Record<ChartFiatCurrency, string> = {
  KRW: '#2563eb',
  JPY: '#7c3aed',
  THB: '#059669',
  CNY: '#dc2626',
};

const RANGE_LABEL_KEYS: Record<ChartRange, MessageKey> = {
  '7d': 'dashboard.chart.range7d',
  '30d': 'dashboard.chart.range30d',
  '12m': 'dashboard.chart.range12m',
};

function formatRate(currency: ChartFiatCurrency, rate: number) {
  return rate.toLocaleString(undefined, {
    maximumFractionDigits: currency === 'JPY' ? 2 : 0,
  });
}

function formatVolume(value: number | null | undefined) {
  if (value == null) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function DashboardCharts() {
  const { user } = useAuth();
  const t = useT();
  const [range, setRange] = useState<ChartRange>('30d');
  const [data, setData] = useState<DashboardChartsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .dashboardCharts(range)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  const flowData = useMemo(
    () =>
      data?.usdtFlow.stages
        .filter((s) => s.status !== 'CANCELLED' || s.count > 0)
        .map((s) => ({
          status: t(`status.${s.status}` as MessageKey),
          count: s.count,
        })) ?? [],
    [data, t],
  );

  const rateSeries = useMemo(() => {
    if (!data) return [];
    const dates = new Set<string>();
    for (const currency of FIAT_CURRENCIES) {
      for (const row of data.marketRates[currency].series) {
        dates.add(row.date);
      }
    }
    return [...dates]
      .sort()
      .map((date) => {
        const row: Record<string, string | number> = { date: date.slice(5) };
        for (const currency of FIAT_CURRENCIES) {
          const hit = data.marketRates[currency].series.find((s) => s.date === date);
          if (hit) row[currency] = hit.rate;
        }
        return row;
      });
  }, [data]);

  if (loading && !data) {
    return <p className="pg-hint">{t('dashboard.chart.loading')}</p>;
  }
  if (!data) {
    return <p className="pg-hint">{t('dashboard.chart.loadError')}</p>;
  }

  const isCustomer = user?.role === 'CUSTOMER';
  const showOurPerformance = Boolean(data.ourPerformance);
  const showOrgBreakdown = data.ourPerformance?.showOrgBreakdown ?? false;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">{t('dashboard.chart.title')}</h2>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setRange(opt)}
              className={`rounded px-2.5 py-1 text-xs ${
                range === opt ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t(RANGE_LABEL_KEYS[opt])}
            </button>
          ))}
        </div>
      </div>

      <div className="pg-card">
        <div className="pg-card-head">
          {isCustomer ? t('dashboard.chart.myUsdtFlow') : t('dashboard.chart.usdtFlow')}
        </div>
          <div className="pg-card-body grid gap-4 lg:grid-cols-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowData} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="status" width={96} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.usdtFlow.timeline} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" name={t('dashboard.chart.txCount')} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="usdtAmount" stroke="#10b981" name="USDT" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>

      <div className="pg-card">
        <div className="pg-card-head">{t('dashboard.chart.marketRates')}</div>
        <div className="pg-card-body">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rateSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                {FIAT_CURRENCIES.map((currency) => (
                  <Line
                    key={currency}
                    type="monotone"
                    dataKey={currency}
                    stroke={CURRENCY_COLORS[currency]}
                    dot={false}
                    name={currency}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FIAT_CURRENCIES.map((currency) => {
          const stat = data.exchangeStats[currency];
          const change = stat?.changePercent24h;
          const changeTone =
            change == null ? 'text-gray-500' : change >= 0 ? 'text-emerald-600' : 'text-rose-600';
          return (
            <div key={currency} className="pg-card">
              <div className="pg-card-body space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">USDT / {currency}</span>
                  <span className="text-[10px] text-gray-400">{stat?.source ?? '—'}</span>
                </div>
                <p className="text-lg font-bold tabular-nums" style={{ color: CURRENCY_COLORS[currency] }}>
                  {stat ? formatRate(currency, stat.rate) : '—'}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <p className="text-gray-500">{t('dashboard.chart.volume24h')}</p>
                    <p className="font-medium tabular-nums">{formatVolume(stat?.volume24hQuote ?? stat?.volume24hUsdt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{t('dashboard.chart.change24h')}</p>
                    <p className={`font-medium tabular-nums ${changeTone}`}>
                      {change == null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}
                    </p>
                  </div>
                </div>
                {data.marketRates[currency].series.length > 1 && (
                  <div className="h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.marketRates[currency].series}>
                        <Line type="monotone" dataKey="rate" stroke={CURRENCY_COLORS[currency]} dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showOurPerformance && data.ourPerformance && (
        <div className="pg-card">
          <div className="pg-card-head">
            {showOrgBreakdown
              ? t('dashboard.chart.ourPerformance')
              : t('dashboard.chart.customerSummary')}
          </div>
          <div className="pg-card-body space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryStat label={t('dashboard.chart.txCount')} value={data.ourPerformance.totals.count} />
              <SummaryStat
                label={t('dashboard.chart.fiatTotal')}
                value={data.ourPerformance.totals.fiatAmount}
              />
              <SummaryStat
                label={t('dashboard.chart.usdtTotal')}
                value={data.ourPerformance.totals.usdtAmount}
                decimals={4}
              />
            </div>

            {showOrgBreakdown && data.ourPerformance.byOrg && data.ourPerformance.byOrg.length > 0 && (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.ourPerformance.byOrg.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="orgName" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={56} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="fiatAmount" fill="#6366f1" name={t('dashboard.chart.fiatTotal')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ourPerformance.byCurrency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="currency" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name={t('dashboard.chart.txCount')} />
                  <Bar dataKey="usdtAmount" fill="#10b981" name="USDT" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {isCustomer && (
        <p className="pg-hint text-center text-xs">{t('dashboard.chart.customerMarketNote')}</p>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  decimals = 0,
}: {
  label: string;
  value: number;
  decimals?: number;
}) {
  return (
    <div className="rounded border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-base font-bold tabular-nums">
        {value.toLocaleString(undefined, { maximumFractionDigits: decimals })}
      </p>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, type SimulatorAnalytics, type SimulatorHqListResponse } from '@/lib/api';
import { ContentCard } from '@/components/layout/ContentCard';
import { HqPolicyHubNav } from '@/components/layout/HqPolicyHubNav';
import { PageSizeBar } from '@/components/PageSizeBar';
import { formatDate } from '@/lib/format';
import type { MessageKey } from '@/i18n/messages';

function isHq(user: { role: string; organization?: { type: string } } | null) {
  return user?.role === 'SUPER_ADMIN' || user?.organization?.type === 'HEAD_OFFICE';
}

export default function SimulatorLogsPage() {
  const { user } = useAuth();
  const t = useT();
  const router = useRouter();
  const [list, setList] = useState<SimulatorHqListResponse | null>(null);
  const [analytics, setAnalytics] = useState<SimulatorAnalytics | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(100);
  const [range, setRange] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    if (user && !isHq(user)) router.replace('/dashboard');
  }, [user, router]);

  useEffect(() => {
    api.simulator.hqList(page, pageSize).then(setList).catch(console.error);
  }, [page, pageSize]);

  useEffect(() => {
    api.simulator.analytics(range).then(setAnalytics).catch(console.error);
  }, [range]);

  const items = list?.items ?? [];

  return (
    <div className="pg-stack">
      <HqPolicyHubNav />
      <ContentCard title={t('simLogs.analysisTitle')}>
        <div className="mb-3 flex flex-wrap gap-2">
          {(['day', 'week', 'month'] as const).map((r) => (
            <button
              key={r}
              type="button"
              className={`pg-btn ${range === r ? 'pg-btn-primary' : ''}`}
              onClick={() => setRange(r)}
            >
              {t(`simLogs.range.${r}` as MessageKey)}
            </button>
          ))}
        </div>
        {analytics && (
          <>
            <p className="pg-callout pg-callout-muted mb-3">
              {t('simLogs.insight', {
                total: analytics.total,
                hour: analytics.peakHour ?? '—',
                currency: analytics.topCurrency ?? '—',
                network: analytics.topNetwork ?? '—',
                avg: analytics.avgNetUsdt,
                months: analytics.retentionMonths,
              })}
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-56">
                <p className="mb-1 text-sm font-medium">{t('simLogs.chartTime')}</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      analytics.byDay.length
                        ? analytics.byDay.map((d) => ({ label: d.date, count: d.count }))
                        : analytics.byHour.map((d) => ({ label: d.hour, count: d.count }))
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-56">
                <p className="mb-1 text-sm font-medium">{t('simLogs.chartCurrency')}</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.byCurrency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="currency" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="pg-card pg-table-wrap mt-4">
              <table className="pg-table">
                <thead>
                  <tr>
                    <th>{t('simLogs.network')}</th>
                    <th>{t('simLogs.count')}</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byNetwork.map((r) => (
                    <tr key={r.network}>
                      <td>{t(`network.${r.network}` as MessageKey)}</td>
                      <td>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pg-card pg-table-wrap mt-3">
              <table className="pg-table">
                <thead>
                  <tr>
                    <th>{t('simLogs.amountBand')}</th>
                    <th>{t('simLogs.count')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t('simLogs.band.lt1k')}</td>
                    <td>{analytics.amountBuckets.lt1k}</td>
                  </tr>
                  <tr>
                    <td>{t('simLogs.band.k1to10')}</td>
                    <td>{analytics.amountBuckets.k1to10}</td>
                  </tr>
                  <tr>
                    <td>{t('simLogs.band.k10to100')}</td>
                    <td>{analytics.amountBuckets.k10to100}</td>
                  </tr>
                  <tr>
                    <td>{t('simLogs.band.over100k')}</td>
                    <td>{analytics.amountBuckets.over100k}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </ContentCard>

      <ContentCard title={t('nav.simulatorLogs')}>
        <p className="pg-hint">{t('simLogs.hint', { months: list?.retentionMonths ?? 3 })}</p>
        <div className="pg-card pg-table-wrap mt-3">
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('simLogs.customer')}</th>
                <th>{t('simLogs.date')}</th>
                <th>{t('simLogs.mode')}</th>
                <th>{t('simLogs.network')}</th>
                <th>{t('simLogs.result')}</th>
                <th>{t('simLogs.rate')}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pg-hint">
                    {t('simLogs.empty')}
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.customerName}
                      <div className="text-xs text-slate-500">{row.customerEmail}</div>
                    </td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>{t(row.mode === 'target' ? 'simulator.modeUsdt' : 'simulator.modeFiat')}</td>
                    <td>{t(`network.${row.network}` as MessageKey)}</td>
                    <td>
                      <div className="font-semibold text-red-600">{Number(row.netUsdt).toFixed(4)} USDT</div>
                      <div className="text-xs text-green-600">
                        {t('simulator.totalFee')}: {Number(row.totalFeeUsdt).toFixed(4)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {Number(row.requiredFiat).toLocaleString()} {row.currency}
                      </div>
                    </td>
                    <td>
                      1 USDT = {Number(row.exchangeRate).toLocaleString()} {row.currency}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PageSizeBar
          total={list?.total ?? 0}
          page={page}
          pageSize={pageSize}
          onPageSize={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          onPage={setPage}
        />
      </ContentCard>
    </div>
  );
}

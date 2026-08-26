'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, type ProfitAnalysisRow } from '@/lib/api';
import { ContentCard } from '@/components/layout/ContentCard';
import { SensitiveOtpGate } from '@/components/SensitiveOtpGate';
import { formatDate } from '@/lib/format';

function canAccess(role?: string) {
  return role === 'SUPER_ADMIN' || role === 'ORGANIZER';
}

export default function ProfitAnalysisPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !canAccess(user.role)) router.replace('/dashboard');
  }, [user, router]);

  return (
    <SensitiveOtpGate>
      <ProfitAnalysisInner />
    </SensitiveOtpGate>
  );
}

function ProfitAnalysisInner() {
  const t = useT();
  const [rows, setRows] = useState<ProfitAnalysisRow[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    api.costAnalysis.profitList().then(setRows).catch(() => setRows([]));
  }, []);

  async function saveBroker(ticketId: string) {
    const amount = Number(draft[ticketId]);
    if (!Number.isFinite(amount) || amount < 0) return;
    const updated = await api.costAnalysis.setBroker(ticketId, amount);
    if (updated) {
      setRows((prev) => prev.map((r) => (r.ticketId === ticketId ? updated : r)));
    }
  }

  return (
    <ContentCard title={t('nav.profitAnalysis')}>
          <p className="pg-hint mb-3">{t('profit.hint')}</p>
          <div className="pg-card pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>{t('usdt.col.ticketNo')}</th>
                  <th>{t('simLogs.customer')}</th>
                  <th>{t('simLogs.date')}</th>
                  <th>{t('profit.expected')}</th>
                  <th>{t('profit.broker')}</th>
                  <th>{t('profit.result')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="pg-hint">{t('profit.empty')}</td></tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.ticketId}>
                      <td>
                        <Link href={`/dashboard/usdt/${row.ticketId}`} className="pg-link">{row.ticketNo}</Link>
                      </td>
                      <td>
                        {row.customerName}
                        <div className="text-xs text-slate-500">{row.customerEmail}</div>
                      </td>
                      <td>{formatDate(row.createdAt)}</td>
                      <td className="font-semibold text-red-600">{row.expectedUsdtAmount.toFixed(4)}</td>
                      <td>
                        <input
                          className="pg-input w-28"
                          value={draft[row.ticketId] ?? (row.brokerUsdtAmount != null ? String(row.brokerUsdtAmount) : '')}
                          onChange={(e) => setDraft((d) => ({ ...d, [row.ticketId]: e.target.value }))}
                        />
                      </td>
                      <td className={row.profitUsdt == null ? '' : row.profitUsdt >= 0 ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>
                        {row.profitUsdt == null ? '—' : row.profitUsdt.toFixed(4)}
                      </td>
                      <td>
                        <button type="button" className="pg-btn pg-btn-primary" onClick={() => saveBroker(row.ticketId)}>
                          {t('common.save')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ContentCard>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';
import { api, type SimulatorRunRow } from '@/lib/api';
import { ContentCard } from '@/components/layout/ContentCard';
import { formatDate } from '@/lib/format';
import type { MessageKey } from '@/i18n/messages';

export function DashboardSimulatorPreview() {
  const t = useT();
  const [rows, setRows] = useState<SimulatorRunRow[]>([]);

  useEffect(() => {
    api.simulator.mine(2).then((rows) => setRows(rows.slice(0, 2))).catch(() => setRows([]));
  }, []);

  if (rows.length === 0) return null;

  return (
    <ContentCard title={t('dashboard.simPreviewTitle')}>
      <p className="pg-hint mb-2">{t('dashboard.simPreviewHint')}</p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded border border-slate-200 px-3 py-2 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <span>{formatDate(row.createdAt)}</span>
              <span>{t(row.mode === 'target' ? 'simulator.modeUsdt' : 'simulator.modeFiat')}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-3">
              <span>{t(`network.${row.network}` as MessageKey)}</span>
              <span className="font-semibold text-red-600">{Number(row.netUsdt).toFixed(4)} USDT</span>
              <span className="font-semibold text-green-600">{Number(row.totalFeeUsdt).toFixed(4)} USDT</span>
              <span>
                1 USDT = {Number(row.exchangeRate).toLocaleString()} {row.currency}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Link href="/dashboard/simulator" className="pg-link mt-2 inline-block text-sm">
        {t('nav.simulator')}
      </Link>
    </ContentCard>
  );
}

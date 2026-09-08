'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, type CostAnalysisPreview, type CostAnalysisRow } from '@/lib/api';
import { ContentCard } from '@/components/layout/ContentCard';
import { SensitiveOtpGate } from '@/components/SensitiveOtpGate';
import { formatDate } from '@/lib/format';

const FIATS = ['KRW', 'JPY', 'THB', 'CNY', 'HKD'] as const;

function canAccess(role?: string) {
  return role === 'SUPER_ADMIN' || role === 'ORGANIZER';
}

export default function CostAnalysisPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !canAccess(user.role)) router.replace('/dashboard');
  }, [user, router]);

  return (
    <SensitiveOtpGate>
      <CostAnalysisInner />
    </SensitiveOtpGate>
  );
}

function CostAnalysisInner() {
  const t = useT();
  const [currency, setCurrency] = useState<(typeof FIATS)[number]>('JPY');
  const [depositFiat, setDepositFiat] = useState('');
  const [receivedUsdt, setReceivedUsdt] = useState('');
  const [correctionUsdt, setCorrectionUsdt] = useState('0');
  const [gasFeeUsdt, setGasFeeUsdt] = useState('0');
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState<CostAnalysisPreview | null>(null);
  const [rows, setRows] = useState<CostAnalysisRow[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.costAnalysis.list().then(setRows).catch(() => setRows([]));
  }, []);

  useEffect(() => {
    const dep = Number(depositFiat);
    const rec = Number(receivedUsdt);
    if (!(dep > 0) || !(rec > 0)) {
      setPreview(null);
      return;
    }
    const timer = window.setTimeout(() => {
      api.costAnalysis
        .preview({
          currency,
          depositFiat: dep,
          receivedUsdt: rec,
          correctionUsdt: Number(correctionUsdt) || 0,
          gasFeeUsdt: Number(gasFeeUsdt) || 0,
        })
        .then(setPreview)
        .catch(() => setPreview(null));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [currency, depositFiat, receivedUsdt, correctionUsdt, gasFeeUsdt]);

  async function save() {
    setMsg('');
    try {
      const row = await api.costAnalysis.create({
        currency,
        depositFiat: Number(depositFiat),
        receivedUsdt: Number(receivedUsdt),
        correctionUsdt: Number(correctionUsdt) || 0,
        gasFeeUsdt: Number(gasFeeUsdt) || 0,
        note,
      });
      setRows((prev) => [row, ...prev]);
      setMsg(t('cost.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('cost.saveFailed'));
    }
  }

  return (
    <>
      <ContentCard title={t('nav.costAnalysis')}>
          <p className="pg-hint mb-3">{t('cost.hint')}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="pg-label">{t('simulator.currency')}</span>
              <select className="pg-input" value={currency} onChange={(e) => setCurrency(e.target.value as (typeof FIATS)[number])}>
                {FIATS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="pg-label">{t('cost.depositFiat')}</span>
              <input className="pg-input" value={depositFiat} onChange={(e) => setDepositFiat(e.target.value)} />
            </label>
            <label className="block">
              <span className="pg-label">{t('cost.receivedUsdt')}</span>
              <input className="pg-input" value={receivedUsdt} onChange={(e) => setReceivedUsdt(e.target.value)} />
            </label>
            <label className="block">
              <span className="pg-label">{t('cost.rate')}</span>
              <input className="pg-input" readOnly value={preview ? `1 USDT = ${preview.exchangeRate.toLocaleString()} ${currency}` : t('cost.rateAuto')} />
            </label>
            <label className="block">
              <span className="pg-label">{t('cost.correction')}</span>
              <input className="pg-input" value={correctionUsdt} onChange={(e) => setCorrectionUsdt(e.target.value)} />
            </label>
            <label className="block">
              <span className="pg-label">{t('cost.gas')}</span>
              <input className="pg-input" value={gasFeeUsdt} onChange={(e) => setGasFeeUsdt(e.target.value)} />
            </label>
          </div>
          {preview && (
            <div className="pg-callout pg-callout-muted mt-3">
              <p>{t('cost.gross')}: {preview.grossUsdt.toFixed(4)} USDT</p>
              <p className="font-semibold text-green-700">{t('cost.fee')}: {preview.feeUsdt.toFixed(4)} USDT</p>
              <p className="pg-hint">{t('cost.formula')}</p>
            </div>
          )}
          <label className="mt-3 block">
            <span className="pg-label">{t('cost.note')}</span>
            <textarea className="pg-input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
          <button type="button" className="pg-btn pg-btn-primary mt-3" disabled={!preview} onClick={save}>
            {t('common.save')}
          </button>
        </ContentCard>

        <ContentCard title={t('cost.listTitle')}>
          <div className="pg-card pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>{t('simLogs.date')}</th>
                  <th>{t('cost.depositFiat')}</th>
                  <th>{t('cost.receivedUsdt')}</th>
                  <th>{t('cost.rate')}</th>
                  <th>{t('cost.correction')}</th>
                  <th>{t('cost.gas')}</th>
                  <th>{t('cost.fee')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="pg-hint">{t('cost.empty')}</td></tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDate(row.createdAt)}</td>
                      <td>{row.depositFiat.toLocaleString()} {row.currency}</td>
                      <td>{row.receivedUsdt.toFixed(4)}</td>
                      <td>{row.exchangeRate.toLocaleString()}</td>
                      <td>{row.correctionUsdt.toFixed(4)}</td>
                      <td>{row.gasFeeUsdt.toFixed(4)}</td>
                      <td className="font-semibold text-green-700">{row.feeUsdt.toFixed(4)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ContentCard>
    </>
  );
}

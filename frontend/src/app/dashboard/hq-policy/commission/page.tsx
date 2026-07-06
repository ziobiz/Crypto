'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import {
  hqPolicyApi,
  type HqCommissionPayload,
  type HqCommissionRiskConfig,
} from '@/lib/api';

export default function HqCommissionPage() {
  const t = useT();
  const [data, setData] = useState<HqCommissionPayload | null>(null);
  const [risk, setRisk] = useState<HqCommissionRiskConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getCommission()
      .then((d) => {
        setData(d);
        setRisk(d.risk);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, []);

  async function save() {
    if (!risk) return;
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.saveCommissionRisk(risk);
      setData(next);
      setRisk(next.risk);
      setMsg(t('hq.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <p className="text-sm text-red-600">{error} — {t('hq.backendHint')}</p>;
  }

  if (!data || !risk) return <p className="text-sm text-gray-500">{t('hq.loading')}</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">{t('hq.commission.riskTitle')}</h2>
        <p className="text-sm text-gray-500">{t('hq.commission.riskDesc')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.commission.gasFee')}</span>
            <input
              type="number"
              step="0.01"
              value={risk.defaultGasFeeUsdt}
              onChange={(e) => setRisk({ ...risk, defaultGasFeeUsdt: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.commission.platformFee')}</span>
            <input
              type="number"
              step="0.01"
              value={risk.defaultPlatformFeeUsdt}
              onChange={(e) => setRisk({ ...risk, defaultPlatformFeeUsdt: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.commission.maxAmount')}</span>
            <input
              type="number"
              value={risk.maxTicketAmountKrw}
              onChange={(e) => setRisk({ ...risk, maxTicketAmountKrw: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.commission.maxDaily')}</span>
            <input
              type="number"
              value={risk.maxDailyTicketsPerCustomer}
              onChange={(e) => setRisk({ ...risk, maxDailyTicketsPerCustomer: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={risk.riskEnabled}
            onChange={(e) => setRisk({ ...risk, riskEnabled: e.target.checked })}
          />
          {t('hq.commission.riskEnabled')}
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">{t('hq.commission.memo')}</span>
          <textarea
            value={risk.notes ?? ''}
            onChange={(e) => setRisk({ ...risk, notes: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            rows={2}
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? t('hq.saving') : t('hq.commission.saveRisk')}
        </button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900">{t('hq.commission.ratesTitle')}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-gray-500">{t('hq.commission.org')}</th>
                <th className="px-3 py-2 text-left text-gray-500">{t('hq.commission.type')}</th>
                <th className="px-3 py-2 text-left text-gray-500">{t('hq.commission.ticket')}</th>
                <th className="px-3 py-2 text-right text-gray-500">{t('hq.commission.rate')}</th>
              </tr>
            </thead>
            <tbody>
              {data.rates.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">{r.organization.name}</td>
                  <td className="px-3 py-2">{r.organization.type}</td>
                  <td className="px-3 py-2">{r.ticketType}</td>
                  <td className="px-3 py-2 text-right">{r.ratePercent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

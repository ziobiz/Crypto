'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  hqPolicyApi,
  type HqCommissionPayload,
  type HqCommissionRiskConfig,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

type OrgRateRow = {
  organizationId: string;
  code: string;
  name: string;
  type: string;
  path: string;
  usdtPurchase: string;
  tradeEscrow: string;
};

function depthFromPath(path: string) {
  return path.split('/').filter(Boolean).length;
}

function buildOrgRows(data: HqCommissionPayload): OrgRateRow[] {
  const byOrg = new Map<string, { USDT_PURCHASE?: string; TRADE_ESCROW?: string }>();
  for (const r of data.rates) {
    const entry = byOrg.get(r.organization.id) ?? {};
    if (r.ticketType === 'USDT_PURCHASE') entry.USDT_PURCHASE = r.ratePercent;
    if (r.ticketType === 'TRADE_ESCROW') entry.TRADE_ESCROW = r.ratePercent;
    byOrg.set(r.organization.id, entry);
  }

  const orgMap = new Map<string, HqCommissionPayload['rates'][number]['organization']>();
  for (const r of data.rates) {
    orgMap.set(r.organization.id, r.organization);
  }

  const orgs = [...orgMap.values()].sort((a, b) => a.code.localeCompare(b.code));

  return orgs.map((org) => {
    const rates = byOrg.get(org.id) ?? {};
    return {
      organizationId: org.id,
      code: org.code,
      name: org.name,
      type: org.type,
      path: '',
      usdtPurchase: rates.USDT_PURCHASE ?? '0',
      tradeEscrow: rates.TRADE_ESCROW ?? '0',
    };
  });
}

function mergeWithOrganizations(
  rows: OrgRateRow[],
  data: HqCommissionPayload,
  allOrgs: Array<{ id: string; code: string; name: string; type: string; path?: string }>,
): OrgRateRow[] {
  const rowMap = new Map(rows.map((r) => [r.organizationId, r]));
  return allOrgs
    .sort((a, b) => (a.path ?? '').localeCompare(b.path ?? ''))
    .map((org) => {
      const existing = rowMap.get(org.id);
      return {
        organizationId: org.id,
        code: org.code,
        name: org.name,
        type: org.type,
        path: org.path ?? '',
        usdtPurchase: existing?.usdtPurchase ?? '0',
        tradeEscrow: existing?.tradeEscrow ?? '0',
      };
    });
}

export default function HqCommissionPage() {
  const t = useT();
  const [data, setData] = useState<HqCommissionPayload | null>(null);
  const [risk, setRisk] = useState<HqCommissionRiskConfig | null>(null);
  const [orgRows, setOrgRows] = useState<OrgRateRow[]>([]);
  const [savingRisk, setSavingRisk] = useState(false);
  const [savingRates, setSavingRates] = useState(false);
  const [msg, setMsg] = useState('');
  const [ratesMsg, setRatesMsg] = useState('');
  const [error, setError] = useState('');

  const orgTypeLabel = (type: string) => t(`org.${type}` as MessageKey);

  useEffect(() => {
    Promise.all([hqPolicyApi.getCommission(), api.organizations()])
      .then(([commission, orgs]) => {
        setData(commission);
        setRisk({
          ...commission.risk,
          defaultFxFeePercent: commission.risk.defaultFxFeePercent ?? 0,
          defaultTransferFeeUsdt:
            commission.risk.defaultTransferFeeUsdt ??
            commission.risk.defaultPlatformFeeUsdt ??
            0,
          defaultOtherFeeUsdt: commission.risk.defaultOtherFeeUsdt ?? 0,
        });
        const baseRows = buildOrgRows(commission);
        setOrgRows(mergeWithOrganizations(baseRows, commission, orgs));
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  const historyRows = useMemo(() => {
    if (!data) return [];
    return [...data.rates].sort((a, b) => {
      const pathA = orgRows.find((o) => o.organizationId === a.organization.id)?.path ?? '';
      const pathB = orgRows.find((o) => o.organizationId === b.organization.id)?.path ?? '';
      if (pathA !== pathB) return pathA.localeCompare(pathB);
      return a.ticketType.localeCompare(b.ticketType);
    });
  }, [data, orgRows]);

  async function saveRisk() {
    if (!risk) return;
    setSavingRisk(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.saveCommissionRisk(risk);
      setData(next);
      setRisk(next.risk);
      setMsg(t('hq.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSavingRisk(false);
    }
  }

  function updateRow(orgId: string, field: 'usdtPurchase' | 'tradeEscrow', value: string) {
    setOrgRows((prev) =>
      prev.map((row) => (row.organizationId === orgId ? { ...row, [field]: value } : row)),
    );
  }

  async function saveRates() {
    setSavingRates(true);
    setRatesMsg('');
    try {
      const rates = orgRows.flatMap((row) => [
        {
          organizationId: row.organizationId,
          ticketType: 'USDT_PURCHASE',
          ratePercent: Number(row.usdtPurchase) || 0,
        },
        {
          organizationId: row.organizationId,
          ticketType: 'TRADE_ESCROW',
          ratePercent: Number(row.tradeEscrow) || 0,
        },
      ]);
      const next = await hqPolicyApi.saveCommissionRates(rates);
      setData(next);
      const baseRows = buildOrgRows(next);
      const orgs = orgRows.map((r) => ({
        id: r.organizationId,
        code: r.code,
        name: r.name,
        type: r.type,
        path: r.path,
      }));
      setOrgRows(mergeWithOrganizations(baseRows, next, orgs));
      setRatesMsg(t('hq.commission.ratesSaved'));
    } catch (e) {
      setRatesMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSavingRates(false);
    }
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {error} ??{t('hq.backendHint')}
      </p>
    );
  }

  if (!data || !risk) return <p className="text-sm text-gray-500">{t('hq.loading')}</p>;

  return (
    <div className="space-y-6">
      <section className="pg-section pg-section-pad space-y-3">
        <h2 className="font-semibold text-gray-900">{t('hq.commission.symbolTitle')}</h2>
        <p className="text-sm text-gray-500">{t('hq.commission.symbolDesc')}</p>
        <h3 className="text-[11px] font-semibold text-gray-700">{t('hq.commission.transactionFeesTitle')}</h3>
        <p className="text-xs text-gray-500">{t('hq.commission.transactionFeesDesc')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.commission.fxFee')}</span>
            <input
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={risk.defaultFxFeePercent}
              onChange={(e) => setRisk({ ...risk, defaultFxFeePercent: Number(e.target.value) })}
              className="pg-input mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.commission.gasFee')}</span>
            <input
              type="number"
              step="0.01"
              value={risk.defaultGasFeeUsdt}
              onChange={(e) => setRisk({ ...risk, defaultGasFeeUsdt: Number(e.target.value) })}
              className="pg-input mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.commission.transferFee')}</span>
            <input
              type="number"
              step="0.01"
              value={risk.defaultTransferFeeUsdt}
              onChange={(e) => setRisk({ ...risk, defaultTransferFeeUsdt: Number(e.target.value) })}
              className="pg-input mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.commission.otherFee')}</span>
            <input
              type="number"
              step="0.01"
              value={risk.defaultOtherFeeUsdt}
              onChange={(e) => setRisk({ ...risk, defaultOtherFeeUsdt: Number(e.target.value) })}
              className="pg-input mt-1"
            />
          </label>
        </div>
        <h3 className="text-[11px] font-semibold text-gray-700 pt-2">{t('hq.commission.riskTitle')}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.commission.maxAmount')}</span>
            <input
              type="number"
              value={risk.maxTicketAmountKrw}
              onChange={(e) => setRisk({ ...risk, maxTicketAmountKrw: Number(e.target.value) })}
              className="pg-input mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">{t('hq.commission.maxDaily')}</span>
            <input
              type="number"
              value={risk.maxDailyTicketsPerCustomer}
              onChange={(e) =>
                setRisk({ ...risk, maxDailyTicketsPerCustomer: Number(e.target.value) })
              }
              className="pg-input mt-1"
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
            className="pg-input mt-1"
            rows={2}
          />
        </label>
        <button
          type="button"
          onClick={saveRisk}
          disabled={savingRisk}
          className="pg-btn pg-btn-primary disabled:opacity-50"
        >
          {savingRisk ? t('hq.saving') : t('hq.commission.saveRisk')}
        </button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </section>

      <section className="pg-section pg-section-pad space-y-3">
        <h2 className="font-semibold text-gray-900">{t('hq.commission.orgRatesTitle')}</h2>
        <p className="text-sm text-gray-500">{t('hq.commission.orgRatesDesc')}</p>
        <p className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-2">{t('hq.commission.totalHint')}</p>

        {orgRows.length === 0 ? (
          <p className="text-sm text-gray-500">{t('hq.commission.noOrgs')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="pg-table">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium">{t('hq.commission.code')}</th>
                  <th className="px-3 py-2.5 text-left font-medium">{t('hq.commission.org')}</th>
                  <th className="px-3 py-2.5 text-left font-medium">{t('hq.commission.type')}</th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    {t('hq.commission.usdtPurchase')}
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    {t('hq.commission.tradeEscrow')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orgRows.map((row) => {
                  const depth = depthFromPath(row.path);
                  return (
                    <tr key={row.organizationId} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs text-gray-600">{row.code}</td>
                      <td className="px-3 py-2" style={{ paddingLeft: `${12 + (depth - 1) * 16}px` }}>
                        {row.name}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{orgTypeLabel(row.type)}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.0001"
                          min={0}
                          max={100}
                          value={row.usdtPurchase}
                          onChange={(e) =>
                            updateRow(row.organizationId, 'usdtPurchase', e.target.value)
                          }
                          className="w-24 rounded border px-2 py-1 text-right ml-auto block"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.0001"
                          min={0}
                          max={100}
                          value={row.tradeEscrow}
                          onChange={(e) =>
                            updateRow(row.organizationId, 'tradeEscrow', e.target.value)
                          }
                          className="w-24 rounded border px-2 py-1 text-right ml-auto block"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <button
          type="button"
          onClick={saveRates}
          disabled={savingRates || orgRows.length === 0}
          className="pg-btn pg-btn-primary disabled:opacity-50"
        >
          {savingRates ? t('hq.saving') : t('hq.commission.saveRates')}
        </button>
        {ratesMsg && <p className="text-sm text-gray-600">{ratesMsg}</p>}
      </section>

      <section className="pg-section pg-section-pad">
        <h2 className="font-semibold text-gray-900">{t('hq.commission.ratesTitle')}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="pg-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-gray-500">{t('hq.commission.org')}</th>
                <th className="px-3 py-2 text-left text-gray-500">{t('hq.commission.type')}</th>
                <th className="px-3 py-2 text-left text-gray-500">{t('hq.commission.ticket')}</th>
                <th className="px-3 py-2 text-right text-gray-500">{t('hq.commission.rate')}</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">{r.organization.name}</td>
                  <td className="px-3 py-2">{orgTypeLabel(r.organization.type)}</td>
                  <td className="px-3 py-2">
                    {t(`ticket.${r.ticketType}` as MessageKey)}
                  </td>
                  <td className="px-3 py-2 text-right">{r.ratePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { LOCALES, type Locale } from '@/i18n/locales';
import {
  hqPolicyApi,
  type HqWorkflowDisplayConfig,
  type LocalizedStatusLabels,
} from '@/lib/api';

const USDT_CODES = [
  'QUOTE_PENDING',
  'QUOTE_CONFIRMED',
  'APPLICATION_COMPLETED',
  'CARD_PAYMENT_PENDING',
  'DEPOSIT_PROOF_PENDING',
  'ADMIN_REVIEWING',
  'TRANSFER_IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

const ESCROW_CODES = [
  'ESCROW_CREATED',
  'CONTRACT_CONFIRMED',
  'BUYER_DEPOSIT_PROOF',
  'ADMIN_DEPOSIT_CONFIRMED',
  'SELLER_FULFILLMENT_PROOF',
  'BUYER_FINAL_APPROVAL',
  'PAYOUT_SCHEDULED',
  'ESCROW_COMPLETED',
  'VOIDED',
  'CANCELLED',
  'DISPUTED',
] as const;

const DOW = [1, 2, 3, 4, 5, 6, 7] as const;

function emptyLabels(): LocalizedStatusLabels {
  return { KR: '', US: '', JP: '', CH: '', TH: '' };
}

function LabelTable({
  codes,
  labels,
  onChange,
}: {
  codes: readonly string[];
  labels: Record<string, LocalizedStatusLabels>;
  onChange: (code: string, locale: Locale, value: string) => void;
}) {
  const t = useT();
  return (
    <div className="pg-table-wrap overflow-x-auto">
      <table className="pg-table text-sm">
        <thead>
          <tr>
            <th>{t('hq.ops.workflow.statusCode')}</th>
            {LOCALES.map((loc) => (
              <th key={loc}>{loc}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {codes.map((code) => {
            const row = labels[code] ?? emptyLabels();
            return (
              <tr key={code}>
                <td className="whitespace-nowrap font-mono text-xs">{code}</td>
                {LOCALES.map((loc) => (
                  <td key={loc}>
                    <input
                      className="pg-input w-full min-w-[7rem]"
                      value={row[loc] ?? ''}
                      onChange={(e) => onChange(code, loc, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function HqWorkflowDisplayPage() {
  const t = useT();
  const [config, setConfig] = useState<HqWorkflowDisplayConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getWorkflowDisplay()
      .then((cfg) => {
        if (!cfg.sla.completionTiers) {
          cfg.sla.completionTiers = {
            REGULAR: 4,
            PLUS: 3,
            PRIME: 2,
            ELITE: 1,
            SIGNATURE: 0,
          };
        }
        if (!cfg.sla.completionTiersCard) {
          cfg.sla.completionTiersCard = {
            REGULAR: 2,
            PLUS: 1,
            PRIME: 1,
            ELITE: 0,
            SIGNATURE: 0,
          };
        }
        setConfig(cfg);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  async function save() {
    if (!config) return;
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.saveWorkflowDisplay(config);
      setConfig(next);
      setMsg(t('hq.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function setUsdtLabel(code: string, locale: Locale, value: string) {
    setConfig((c) => {
      if (!c) return c;
      const prev = c.usdtStatusLabels[code] ?? emptyLabels();
      return {
        ...c,
        usdtStatusLabels: { ...c.usdtStatusLabels, [code]: { ...prev, [locale]: value } },
      };
    });
  }

  function setEscrowLabel(code: string, locale: Locale, value: string) {
    setConfig((c) => {
      if (!c) return c;
      const prev = c.escrowStatusLabels[code] ?? emptyLabels();
      return {
        ...c,
        escrowStatusLabels: { ...c.escrowStatusLabels, [code]: { ...prev, [locale]: value } },
      };
    });
  }

  if (!config) {
    return <p className="pg-hint">{error || t('common.loading')}</p>;
  }

  const sla = config.sla;

  return (
    <div className="pg-stack">
      <p className="text-[13px] text-gray-600">{t('hq.ops.workflowDesc')}</p>
      {msg && <p className="text-sm text-green-700">{msg}</p>}

      <div className="pg-card">
        <div className="pg-card-head">{t('hq.ops.workflow.sla')}</div>
        <div className="pg-card-body grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="pg-label">{t('hq.ops.workflow.hoursInBusiness')}</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              className="pg-input mt-1 w-full"
              value={sla.hoursInBusiness}
              onChange={(e) =>
                setConfig({
                  ...config,
                  sla: { ...sla, hoursInBusiness: Number(e.target.value) },
                })
              }
            />
          </div>
          <div>
            <label className="pg-label">{t('hq.ops.workflow.hoursAfterHours')}</label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              className="pg-input mt-1 w-full"
              value={sla.hoursAfterHours}
              onChange={(e) =>
                setConfig({
                  ...config,
                  sla: { ...sla, hoursAfterHours: Number(e.target.value) },
                })
              }
            />
          </div>
          <div>
            <label className="pg-label">{t('hq.ops.workflow.businessStart')}</label>
            <input
              type="time"
              className="pg-input mt-1 w-full"
              value={sla.businessStart}
              onChange={(e) =>
                setConfig({ ...config, sla: { ...sla, businessStart: e.target.value } })
              }
            />
          </div>
          <div>
            <label className="pg-label">{t('hq.ops.workflow.businessEnd')}</label>
            <input
              type="time"
              className="pg-input mt-1 w-full"
              value={sla.businessEnd}
              onChange={(e) =>
                setConfig({ ...config, sla: { ...sla, businessEnd: e.target.value } })
              }
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="pg-label">{t('hq.ops.workflow.businessDays')}</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {DOW.map((d) => (
                <label key={d} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={sla.businessDays.includes(d)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...sla.businessDays, d].sort()
                        : sla.businessDays.filter((x) => x !== d);
                      setConfig({ ...config, sla: { ...sla, businessDays: next } });
                    }}
                  />
                  {t(`hq.ops.workflow.dow.${d}` as 'hq.ops.workflow.dow.1')}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pg-card">
        <div className="pg-card-head">{t('hq.ops.workflow.completionTiers')}</div>
        <div className="pg-card-body space-y-6">
          <div>
            <p className="mb-1 text-[13px] font-semibold text-gray-800">
              {t('hq.ops.workflow.completionTiersBank')}
            </p>
            <p className="mb-3 text-[13px] text-gray-600">{t('hq.ops.workflow.completionTiersDesc')}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {(['REGULAR', 'PLUS', 'PRIME', 'ELITE', 'SIGNATURE'] as const).map((tier) => (
                <div key={`bank-${tier}`}>
                  <label className="pg-label">
                    {t(`hq.ops.workflow.tier.${tier}` as 'hq.ops.workflow.tier.REGULAR')}
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500">T+</span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      step={1}
                      className="pg-input w-full"
                      value={sla.completionTiers?.[tier] ?? 0}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          sla: {
                            ...sla,
                            completionTiers: {
                              ...sla.completionTiers,
                              [tier]: Number(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {tier === 'SIGNATURE'
                      ? t('hq.ops.workflow.tierSameDayHint')
                      : t('hq.ops.workflow.tierDaysHint')}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[13px] font-semibold text-gray-800">
              {t('hq.ops.workflow.completionTiersCard')}
            </p>
            <p className="mb-3 text-[13px] text-gray-600">
              {t('hq.ops.workflow.completionTiersCardDesc')}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {(['REGULAR', 'PLUS', 'PRIME', 'ELITE', 'SIGNATURE'] as const).map((tier) => (
                <div key={`card-${tier}`}>
                  <label className="pg-label">
                    {t(`hq.ops.workflow.tier.${tier}` as 'hq.ops.workflow.tier.REGULAR')}
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500">T+</span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      step={1}
                      className="pg-input w-full"
                      value={sla.completionTiersCard?.[tier] ?? 0}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          sla: {
                            ...sla,
                            completionTiersCard: {
                              ...sla.completionTiersCard,
                              [tier]: Number(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {tier === 'SIGNATURE' || (sla.completionTiersCard?.[tier] ?? 0) <= 0
                      ? t('hq.ops.workflow.tierSameDayHint')
                      : t('hq.ops.workflow.tierDaysHint')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pg-card">
        <div className="pg-card-head">{t('hq.ops.workflow.usdtLabels')}</div>
        <div className="pg-card-body">
          <LabelTable codes={USDT_CODES} labels={config.usdtStatusLabels} onChange={setUsdtLabel} />
        </div>
      </div>

      <div className="pg-card">
        <div className="pg-card-head">{t('hq.ops.workflow.escrowLabels')}</div>
        <div className="pg-card-body">
          <LabelTable codes={ESCROW_CODES} labels={config.escrowStatusLabels} onChange={setEscrowLabel} />
        </div>
      </div>

      <button type="button" onClick={save} disabled={saving} className="pg-btn pg-btn-primary disabled:opacity-50">
        {saving ? t('hq.saving') : t('hq.save')}
      </button>
    </div>
  );
}

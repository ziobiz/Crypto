'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';
import {
  hqPolicyApi,
  type HqUsdtServiceMatrix,
  type UsdtServiceCustomerType,
  type UsdtServiceFlags,
} from '@/lib/api';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';
import { CUSTOMER_TYPES_UI_ORDER } from '@/constants/ui-display-order';

const CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY', 'USD', 'EUR'] as const;
type FiatCur = (typeof CURRENCIES)[number];

const REMIT_ONLY = new Set<FiatCur>(['USD', 'EUR']);

/** Column order: transfer → remittance → card */
const SERVICE_KEYS: Array<keyof UsdtServiceFlags> = ['transfer', 'remittance', 'card'];

function emptyFlags(): UsdtServiceFlags {
  return { transfer: false, card: false, remittance: false };
}

function defaultMatrix(): HqUsdtServiceMatrix {
  const individual = {} as HqUsdtServiceMatrix['INDIVIDUAL'];
  const corporate = {} as HqUsdtServiceMatrix['CORPORATE'];
  for (const cur of CURRENCIES) {
    const remit = REMIT_ONLY.has(cur);
    individual[cur] = { transfer: false, card: false, remittance: remit };
    corporate[cur] = { transfer: !remit, card: false, remittance: remit };
  }
  return { INDIVIDUAL: individual, CORPORATE: corporate };
}

function serviceLabelKey(
  key: keyof UsdtServiceFlags,
): 'hq.services.transfer' | 'hq.services.remittance' | 'hq.services.card' {
  if (key === 'transfer') return 'hq.services.transfer';
  if (key === 'remittance') return 'hq.services.remittance';
  return 'hq.services.card';
}

type PanelProps = {
  type: UsdtServiceCustomerType;
  title: string;
  rows: Record<FiatCur, UsdtServiceFlags>;
  onChange: (currency: FiatCur, key: keyof UsdtServiceFlags, value: boolean) => void;
  t: ReturnType<typeof useT>;
};

function ServiceTypePanel({ type, title, rows, onChange, t }: PanelProps) {
  return (
    <div className="pg-card pg-table-wrap min-w-0">
      {/* 테이블 밖·왼쪽, 배경색 없음 */}
      <p className="px-3 pt-3 pb-2 text-left text-sm text-gray-800">{title}</p>
      <table className="pg-table">
        <thead>
          <tr>
            <th>{t('hq.services.colCurrency')}</th>
            {SERVICE_KEYS.map((key) => (
              <th key={key}>{t(serviceLabelKey(key))}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CURRENCIES.map((cur) => {
            const flags = rows[cur] ?? emptyFlags();
            const remitLocked = !REMIT_ONLY.has(cur);
            return (
              <tr key={`${type}-${cur}`}>
                <td className="font-mono">{cur}</td>
                {SERVICE_KEYS.map((key) => {
                  const locked = key === 'remittance' && remitLocked;
                  const active = flags[key] === true;
                  return (
                    <td key={key}>
                      <select
                        className={`pg-input mx-auto w-full max-w-[7.5rem] py-1 text-center text-xs ${
                          locked
                            ? 'bg-slate-100 text-slate-400'
                            : active
                              ? 'border-rose-200 bg-rose-100 text-rose-900'
                              : 'bg-white text-slate-600'
                        }`}
                        value={active ? '1' : '0'}
                        disabled={locked}
                        title={locked ? t('hq.services.remitUsdEurOnly') : undefined}
                        aria-label={`${title} ${cur} ${key}`}
                        onChange={(e) => onChange(cur, key, e.target.value === '1')}
                      >
                        <option value="1">{t('hq.services.active')}</option>
                        <option value="0">{t('hq.services.inactive')}</option>
                      </select>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function HqUsdtServicesPage() {
  const t = useT();
  const [config, setConfig] = useState<HqUsdtServiceMatrix>(defaultMatrix);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getUsdtServices()
      .then((r) => setConfig({ ...defaultMatrix(), ...r.config }))
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  function patchFlag(
    type: UsdtServiceCustomerType,
    currency: FiatCur,
    key: keyof UsdtServiceFlags,
    value: boolean,
  ) {
    if (key === 'remittance' && !REMIT_ONLY.has(currency)) return;
    setConfig((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [currency]: {
          ...(prev[type]?.[currency] ?? emptyFlags()),
          [key]: value,
          ...(key === 'remittance' && !REMIT_ONLY.has(currency) ? { remittance: false } : {}),
        },
      },
    }));
  }

  async function save() {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const normalized = defaultMatrix();
      for (const type of CUSTOMER_TYPES_UI_ORDER) {
        for (const cur of CURRENCIES) {
          const src = config[type]?.[cur] ?? emptyFlags();
          normalized[type][cur] = {
            transfer: src.transfer === true,
            card: src.card === true,
            remittance: REMIT_ONLY.has(cur) && src.remittance === true,
          };
        }
      }
      const next = await hqPolicyApi.saveUsdtServices(normalized);
      setConfig({ ...defaultMatrix(), ...next.config });
      setMsg(t('hq.services.saved'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pg-stack">
      <p className="text-[13px] text-gray-600">{t('hq.services.desc')}</p>
      <p className="pg-hint text-sky-900">
        {t('hq.services.accountsLinkHint')}{' '}
        <Link href="/dashboard/hq-policy/accounts" className="underline font-medium">
          {t('hq.hub.accounts')}
        </Link>
      </p>
      <p className="pg-hint text-amber-900">{t('hq.services.remitUsdEurOnly')}</p>
      <p className="pg-hint">{t('hq.services.cardAndHint')}</p>
      <p className="pg-hint">
        <span className="inline-block rounded border border-rose-200 bg-rose-100 px-2 py-0.5 text-[11px] text-rose-900">
          {t('hq.services.active')}
        </span>
        <span className="ml-2 text-[11px] text-slate-600">{t('hq.services.activeHint')}</span>
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}

      <div className="grid gap-4 xl:grid-cols-2">
        {CUSTOMER_TYPES_UI_ORDER.map((type) => (
          <ServiceTypePanel
            key={type}
            type={type}
            title={
              type === 'CORPORATE'
                ? t('hq.services.tabCorporate')
                : t('hq.services.tabIndividual')
            }
            rows={config[type]}
            onChange={(cur, key, value) => patchFlag(type, cur, key, value)}
            t={t}
          />
        ))}
      </div>

      <PolicyTableActions>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="pg-btn pg-btn-primary disabled:opacity-50"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </PolicyTableActions>
    </div>
  );
}

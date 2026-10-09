'use client';

import { useT } from '@/context/LocaleProvider';
import type { HqExpressCustomerTypePolicy, HqExpressPolicy, ExpressTier } from '@/lib/api';
import { EXPRESS_TIERS } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { CUSTOMER_TYPES_UI_ORDER } from '@/constants/ui-display-order';

const CUSTOMER_TYPES = CUSTOMER_TYPES_UI_ORDER;
type CustomerTypeKey = (typeof CUSTOMER_TYPES)[number];

type ExpressFeePolicyEditorProps = {
  value: HqExpressPolicy;
  onChange: (next: HqExpressPolicy) => void;
};

function slaLabelKey(tier: ExpressTier): MessageKey {
  return `express.sla.${tier}` as MessageKey;
}

function typeLabelKey(type: CustomerTypeKey): MessageKey {
  return type === 'INDIVIDUAL'
    ? 'hq.commission.limitsIndividual'
    : 'hq.commission.limitsCorporate';
}

function parseNonNeg(raw: string, emptyAs: number | null): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return emptyAs;
  const n = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : emptyAs;
}

function tierEnabled(cfg: { enabled?: boolean; feeUsdt?: number | null; feePercent?: number | null } | undefined, tier: ExpressTier): boolean {
  if (typeof cfg?.enabled === 'boolean') return cfg.enabled;
  if (tier === 'BASIC') return true;
  return cfg?.feeUsdt != null || cfg?.feePercent != null;
}

export function ExpressFeePolicyEditor({ value, onChange }: ExpressFeePolicyEditorProps) {
  const t = useT();

  function patch(type: CustomerTypeKey, next: Partial<HqExpressCustomerTypePolicy>) {
    const policy = value[type];
    onChange({
      ...value,
      [type]: { ...policy, ...next },
    });
  }

  function setTierField(
    type: CustomerTypeKey,
    tier: ExpressTier,
    field: 'feeUsdt' | 'feePercent' | 'enabled',
    raw: string | boolean,
  ) {
    const policy = value[type];
    const current = policy.tiers[tier] ?? {
      feeUsdt: tier === 'BASIC' ? 0 : null,
      feePercent: null,
      enabled: tier === 'BASIC',
    };
    if (field === 'enabled') {
      onChange({
        ...value,
        [type]: {
          ...policy,
          tiers: {
            ...policy.tiers,
            [tier]: {
              ...current,
              enabled: Boolean(raw),
            },
          },
        },
      });
      return;
    }
    const emptyAs = field === 'feeUsdt' && tier === 'BASIC' ? 0 : null;
    const parsed = parseNonNeg(String(raw), emptyAs);
    onChange({
      ...value,
      [type]: {
        ...policy,
        tiers: {
          ...policy.tiers,
          [tier]: {
            ...current,
            feeUsdt: current.feeUsdt ?? (tier === 'BASIC' ? 0 : null),
            feePercent: current.feePercent ?? null,
            enabled: tierEnabled(current, tier),
            [field]: parsed,
          },
        },
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="pg-card-head">{t('express.hq.title')}</div>
      <p className="pg-hint text-xs">{t('express.hq.desc')}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {CUSTOMER_TYPES.map((type) => {
          const policy = value[type];
          return (
            <label key={`enable-${type}`} className="pg-field">
              <span className="pg-field-label">{t(typeLabelKey(type))}</span>
              <select
                className="pg-input mt-1"
                value={policy.enabled ? 'ENABLED' : 'DISABLED'}
                onChange={(e) => patch(type, { enabled: e.target.value === 'ENABLED' })}
              >
                <option value="ENABLED">{t('express.enabled')}</option>
                <option value="DISABLED">{t('express.disabled')}</option>
              </select>
              <span className="pg-hint mt-1 text-xs">
                {policy.enabled ? t('express.hq.enabledHint') : t('express.hq.disabledHint')}
              </span>
            </label>
          );
        })}
      </div>

      <p className="pg-hint text-xs text-sky-800">{t('express.hq.feeEmptyHint')}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        {CUSTOMER_TYPES.map((type) => {
          const policy = value[type];
          return (
            <div
              key={`fees-${type}`}
              className={`space-y-2 ${policy.enabled ? '' : 'opacity-80'}`}
            >
              <p className="pg-inset-title text-sm">
                {t(typeLabelKey(type))}
                {' · '}
                {policy.enabled ? t('express.enabled') : t('express.disabled')}
              </p>
              <div className="pg-card pg-table-wrap">
                <table className="pg-table">
                  <thead>
                    <tr>
                      <th>{t('express.tier')}</th>
                      <th>{t('express.sla')}</th>
                      <th>{t('express.feeUsdt')}</th>
                      <th>{t('express.feePercent')}</th>
                      <th>{t('express.tierManage')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EXPRESS_TIERS.map((tier) => {
                      const row = policy.tiers[tier];
                      const fee = row?.feeUsdt;
                      const pct = row?.feePercent;
                      const used = tierEnabled(row, tier);
                      return (
                        <tr key={tier} className={used ? '' : 'opacity-70'}>
                          <td className="font-mono font-medium">{tier}</td>
                          <td className="text-xs">{t(slaLabelKey(tier))}</td>
                          <td>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="pg-input w-24 text-xs"
                              placeholder={tier === 'BASIC' ? '0' : t('express.feeEmpty')}
                              defaultValue={fee == null ? '' : String(fee)}
                              key={`${type}-${tier}-f-${fee ?? 'empty'}`}
                              onBlur={(e) => setTierField(type, tier, 'feeUsdt', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="pg-input w-20 text-xs"
                              placeholder={t('express.feeEmpty')}
                              defaultValue={pct == null ? '' : String(pct)}
                              key={`${type}-${tier}-p-${pct ?? 'empty'}`}
                              onBlur={(e) =>
                                setTierField(type, tier, 'feePercent', e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <select
                              className="pg-input text-xs"
                              value={used ? 'ENABLED' : 'DISABLED'}
                              onChange={(e) =>
                                setTierField(type, tier, 'enabled', e.target.value === 'ENABLED')
                              }
                            >
                              <option value="ENABLED">{t('express.tierEnabled')}</option>
                              <option value="DISABLED">{t('express.tierDisabled')}</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

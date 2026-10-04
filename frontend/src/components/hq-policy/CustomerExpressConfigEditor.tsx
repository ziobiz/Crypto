'use client';

import { useT } from '@/context/LocaleProvider';
import type { ExpressTier, HqExpressCustomerTypePolicy } from '@/lib/api';
import { EXPRESS_TIERS, defaultExpressCustomerTypePolicy } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

type CustomerExpressConfigEditorProps = {
  value: unknown;
  onChange: (next: HqExpressCustomerTypePolicy) => void;
};

function slaLabelKey(tier: ExpressTier): MessageKey {
  return `express.sla.${tier}` as MessageKey;
}

function parseNonNeg(raw: string, emptyAs: number | null): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return emptyAs;
  const n = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : emptyAs;
}

function tierEnabled(
  cfg: { enabled?: boolean; feeUsdt?: number | null; feePercent?: number | null } | undefined,
  tier: ExpressTier,
): boolean {
  if (typeof cfg?.enabled === 'boolean') return cfg.enabled;
  if (tier === 'BASIC') return true;
  return cfg?.feeUsdt != null || cfg?.feePercent != null;
}

function normalizeLocal(raw: unknown): HqExpressCustomerTypePolicy {
  const base = defaultExpressCustomerTypePolicy();
  if (!raw || typeof raw !== 'object') return { ...base, enabled: true };
  const obj = raw as Partial<HqExpressCustomerTypePolicy>;
  const tiers = { ...base.tiers };
  for (const tier of EXPRESS_TIERS) {
    const row = obj.tiers?.[tier];
    const feeUsdt = parseNonNeg(
      row?.feeUsdt == null ? '' : String(row.feeUsdt),
      tier === 'BASIC' ? 0 : null,
    );
    const feePercent = parseNonNeg(row?.feePercent == null ? '' : String(row.feePercent), null);
    tiers[tier] = {
      feeUsdt,
      feePercent,
      enabled: tierEnabled(
        { enabled: row?.enabled, feeUsdt, feePercent },
        tier,
      ),
    };
  }
  return { enabled: obj.enabled !== false, tiers };
}

export function CustomerExpressConfigEditor({
  value,
  onChange,
}: CustomerExpressConfigEditorProps) {
  const t = useT();
  const policy = normalizeLocal(value);

  function setTierField(
    tier: ExpressTier,
    field: 'feeUsdt' | 'feePercent' | 'enabled',
    raw: string | boolean,
  ) {
    const current = policy.tiers[tier];
    if (field === 'enabled') {
      onChange({
        ...policy,
        enabled: true,
        tiers: {
          ...policy.tiers,
          [tier]: { ...current, enabled: Boolean(raw) },
        },
      });
      return;
    }
    const emptyAs = field === 'feeUsdt' && tier === 'BASIC' ? 0 : null;
    onChange({
      ...policy,
      enabled: true,
      tiers: {
        ...policy.tiers,
        [tier]: {
          ...current,
          [field]: parseNonNeg(String(raw), emptyAs),
        },
      },
    });
  }

  return (
    <div className="space-y-2">
      <p className="pg-hint text-xs text-amber-800">{t('express.customer.customHint')}</p>
      <div className="pg-card pg-table-wrap">
        <table className="pg-table text-xs">
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
              const fee = policy.tiers[tier]?.feeUsdt;
              const pct = policy.tiers[tier]?.feePercent;
              const used = policy.tiers[tier]?.enabled !== false && tierEnabled(policy.tiers[tier], tier);
              return (
                <tr key={tier} className={used ? '' : 'opacity-70'}>
                  <td className="font-mono font-medium">{tier}</td>
                  <td>{t(slaLabelKey(tier))}</td>
                  <td>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="pg-input w-20 text-xs"
                      placeholder={tier === 'BASIC' ? '0' : t('express.feeEmpty')}
                      defaultValue={fee == null ? '' : String(fee)}
                      key={`${tier}-f-${fee ?? 'empty'}`}
                      onBlur={(e) => setTierField(tier, 'feeUsdt', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="pg-input w-16 text-xs"
                      placeholder={t('express.feeEmpty')}
                      defaultValue={pct == null ? '' : String(pct)}
                      key={`${tier}-p-${pct ?? 'empty'}`}
                      onBlur={(e) => setTierField(tier, 'feePercent', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className="pg-input text-xs"
                      value={used ? 'ENABLED' : 'DISABLED'}
                      onChange={(e) => setTierField(tier, 'enabled', e.target.value === 'ENABLED')}
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
}

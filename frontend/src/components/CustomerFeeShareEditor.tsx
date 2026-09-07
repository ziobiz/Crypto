'use client';

import { useT } from '@/context/LocaleProvider';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';
import type { MessageKey } from '@/i18n/messages';
import type { CustomerFeeShare, HqOrgLevel, HqOrgShareByType, HqOrgSharePolicy } from '@/lib/api';
import {
  escrowShareTotalsMatch,
  sumOrgShareTable,
  usdtShareTotalsMatch,
} from '@/lib/escrow-share-totals';

const LEVELS: HqOrgLevel[] = [
  'HEAD_OFFICE',
  'MASTER_DISTRIBUTOR',
  'REGIONAL_BRANCH',
  'AGENCY',
  'SALES_OFFICE',
];

export function emptyFeeShare(): CustomerFeeShare {
  return {
    usdtOperatingFeePercent: 3.5,
    usdtOperatingFeeUsdt: 0,
    escrowFeePercent: 1.5,
    escrowPerTicketUsdt: 0,
    USDT_PURCHASE: {
      HEAD_OFFICE: { poolPercent: 2, perTicketUsdt: 0 },
      MASTER_DISTRIBUTOR: { poolPercent: 0.7, perTicketUsdt: 0 },
      REGIONAL_BRANCH: { poolPercent: 0.4, perTicketUsdt: 0 },
      AGENCY: { poolPercent: 0.25, perTicketUsdt: 0 },
      SALES_OFFICE: { poolPercent: 0.15, perTicketUsdt: 0 },
    },
    TRADE_ESCROW: {
      HEAD_OFFICE: { poolPercent: 0.6, perTicketUsdt: 0 },
      MASTER_DISTRIBUTOR: { poolPercent: 0.375, perTicketUsdt: 0 },
      REGIONAL_BRANCH: { poolPercent: 0.225, perTicketUsdt: 0 },
      AGENCY: { poolPercent: 0.18, perTicketUsdt: 0 },
      SALES_OFFICE: { poolPercent: 0.12, perTicketUsdt: 0 },
    },
  };
}

export function feeShareFromHq(policy: HqOrgSharePolicy): CustomerFeeShare {
  return {
    usdtOperatingFeePercent: policy.usdtOperatingFeePercent ?? 3.5,
    usdtOperatingFeeUsdt: policy.usdtOperatingFeeUsdt ?? 0,
    escrowFeePercent: policy.escrowFeePercent,
    escrowPerTicketUsdt: policy.escrowPerTicketUsdt,
    USDT_PURCHASE: policy.USDT_PURCHASE,
    TRADE_ESCROW: policy.TRADE_ESCROW,
  };
}

function colKey(level: HqOrgLevel): MessageKey {
  if (level === 'HEAD_OFFICE') return 'feeShare.col.hq';
  return `org.${level}` as MessageKey;
}

export function CustomerFeeShareEditor({
  value,
  onChange,
  canEdit,
  useHqDefault,
  onUseHqDefaultChange,
  hqDefault,
}: {
  value: CustomerFeeShare;
  onChange: (next: CustomerFeeShare) => void;
  canEdit: boolean;
  useHqDefault?: boolean;
  onUseHqDefaultChange?: (useDefault: boolean) => void;
  hqDefault?: CustomerFeeShare | null;
}) {
  const t = useT();
  const locked = Boolean(useHqDefault);
  const editable = canEdit && !locked;

  function patch(
    ticket: 'USDT_PURCHASE' | 'TRADE_ESCROW',
    level: HqOrgLevel,
    field: 'poolPercent' | 'perTicketUsdt',
    n: number,
  ) {
    onChange({
      ...value,
      [ticket]: {
        ...value[ticket],
        [level]: { ...value[ticket][level], [field]: n },
      },
    });
  }

  function shareTable(ticket: 'USDT_PURCHASE' | 'TRADE_ESCROW') {
    const totals = sumOrgShareTable(value[ticket]);
    const usdtCheck = ticket === 'USDT_PURCHASE' ? usdtShareTotalsMatch(value) : null;
    const escrowCheck = ticket === 'TRADE_ESCROW' ? escrowShareTotalsMatch(value) : null;
    const check = usdtCheck ?? escrowCheck;
    return (
      <div className="pg-table-wrap">
        <p className="mb-2 text-[13px] font-bold">{t(`ticket.${ticket}` as MessageKey)}</p>
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('feeShare.row')}</th>
              {LEVELS.map((level) => (
                <th key={level}>{t(colKey(level))}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t('hq.commission.absoluteSharePercent')}</td>
              {LEVELS.map((level) => (
                <td key={level}>
                  {editable ? (
                    <PolicyNumberInput
                      min={0}
                      max={100}
                      step="0.0001"
                      value={value[ticket][level].poolPercent}
                      onChange={(n) => patch(ticket, level, 'poolPercent', n)}
                      className="pg-input w-20"
                    />
                  ) : (
                    <span>{value[ticket][level].poolPercent}</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td>{t('hq.commission.perTicketUsdt')}</td>
              {LEVELS.map((level) => (
                <td key={level}>
                  {editable ? (
                    <PolicyNumberInput
                      min={0}
                      step="0.0001"
                      value={value[ticket][level].perTicketUsdt}
                      onChange={(n) => patch(ticket, level, 'perTicketUsdt', n)}
                      className="pg-input w-20"
                    />
                  ) : (
                    <span>{value[ticket][level].perTicketUsdt}</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        {check && (
          <p className={`mt-2 pg-hint ${check.ok ? '' : 'text-rose-600'}`}>
            {ticket === 'USDT_PURCHASE'
              ? t('hq.commission.usdtShareSum', {
                  actualPct: totals.poolPercent,
                  expectedPct: value.usdtOperatingFeePercent ?? 0,
                  actualUsdt: totals.perTicketUsdt,
                  expectedUsdt: value.usdtOperatingFeeUsdt ?? 0,
                })
              : t('hq.commission.escrowShareSum', {
                  actualPct: totals.poolPercent,
                  expectedPct: value.escrowFeePercent ?? 0,
                  actualUsdt: totals.perTicketUsdt,
                  expectedUsdt: value.escrowPerTicketUsdt ?? 0,
                })}
            {check.exceeds ? ` — ${t('hq.commission.shareExceeds')}` : null}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="pg-hint">{t('feeShare.hint')}</p>
      <p className="pg-hint">{t('hq.commission.vacantShareHint')}</p>
      <p className="pg-hint">{t('hq.commission.absoluteShareHint')}</p>

      {onUseHqDefaultChange && (
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="feeShareMode"
              checked={Boolean(useHqDefault)}
              disabled={!canEdit}
              onChange={() => {
                onUseHqDefaultChange(true);
                if (hqDefault) onChange(hqDefault);
              }}
            />
            {t('feeShare.useHqDefault')}
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="feeShareMode"
              checked={!useHqDefault}
              disabled={!canEdit}
              onChange={() => onUseHqDefaultChange(false)}
            />
            {t('feeShare.useCustom')}
          </label>
        </div>
      )}

      <p className="pg-hint">{t('hq.commission.usdtOperatingHint')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="pg-label">{t('hq.commission.usdtOperatingFeePercent')}</span>
          {editable ? (
            <PolicyNumberInput
              min={0}
              max={100}
              step="0.0001"
              value={value.usdtOperatingFeePercent ?? 0}
              onChange={(n) => onChange({ ...value, usdtOperatingFeePercent: n })}
              className="pg-input mt-1 w-full"
            />
          ) : (
            <p className="mt-1">{value.usdtOperatingFeePercent ?? 0}</p>
          )}
        </label>
        <label className="block">
          <span className="pg-label">{t('hq.commission.usdtOperatingFeeUsdt')}</span>
          {editable ? (
            <PolicyNumberInput
              min={0}
              step="0.0001"
              value={value.usdtOperatingFeeUsdt ?? 0}
              onChange={(n) => onChange({ ...value, usdtOperatingFeeUsdt: n })}
              className="pg-input mt-1 w-full"
            />
          ) : (
            <p className="mt-1">{value.usdtOperatingFeeUsdt ?? 0}</p>
          )}
        </label>
      </div>
      {shareTable('USDT_PURCHASE')}

      <p className="pg-hint">{t('feeShare.escrowPoolHint')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="pg-label">{t('hq.commission.escrowFeePercent')}</span>
          {editable ? (
            <PolicyNumberInput
              min={0}
              max={100}
              step="0.0001"
              value={value.escrowFeePercent ?? 1.5}
              onChange={(n) => onChange({ ...value, escrowFeePercent: n })}
              className="pg-input mt-1 w-full"
            />
          ) : (
            <p className="mt-1">{value.escrowFeePercent ?? 1.5}</p>
          )}
        </label>
        <label className="block">
          <span className="pg-label">{t('hq.commission.escrowPerTicket')}</span>
          {editable ? (
            <PolicyNumberInput
              min={0}
              step="0.0001"
              value={value.escrowPerTicketUsdt ?? 0}
              onChange={(n) => onChange({ ...value, escrowPerTicketUsdt: n })}
              className="pg-input mt-1 w-full"
            />
          ) : (
            <p className="mt-1">{value.escrowPerTicketUsdt ?? 0}</p>
          )}
        </label>
      </div>
      {shareTable('TRADE_ESCROW')}
    </div>
  );
}

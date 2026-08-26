'use client';

import { useT } from '@/context/LocaleProvider';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';
import type { MessageKey } from '@/i18n/messages';
import type { CustomerFeeShare, HqOrgLevel, HqOrgShareByType, HqOrgSharePolicy } from '@/lib/api';
import { sumOrgShareTable } from '@/lib/escrow-share-totals';

const LEVELS: HqOrgLevel[] = [
  'HEAD_OFFICE',
  'MASTER_DISTRIBUTOR',
  'REGIONAL_BRANCH',
  'AGENCY',
  'SALES_OFFICE',
];

export function emptyFeeShare(): CustomerFeeShare {
  const level = (): HqOrgShareByType => ({
    HEAD_OFFICE: { poolPercent: 40, perTicketUsdt: 0 },
    MASTER_DISTRIBUTOR: { poolPercent: 25, perTicketUsdt: 0 },
    REGIONAL_BRANCH: { poolPercent: 15, perTicketUsdt: 0 },
    AGENCY: { poolPercent: 12, perTicketUsdt: 0 },
    SALES_OFFICE: { poolPercent: 8, perTicketUsdt: 0 },
  });
  return {
    escrowFeePercent: 1.5,
    escrowPerTicketUsdt: 0,
    USDT_PURCHASE: level(),
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
}: {
  value: CustomerFeeShare;
  onChange: (next: CustomerFeeShare) => void;
  canEdit: boolean;
}) {
  const t = useT();

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
              <td>{t('hq.commission.poolPercent')}</td>
              {LEVELS.map((level) => (
                <td key={level}>
                  {canEdit ? (
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
                  {canEdit ? (
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
        {ticket === 'TRADE_ESCROW' && (
          <p className="mt-2 pg-hint">
            {t('hq.commission.escrowShareSum', {
              actualPct: totals.poolPercent,
              expectedPct: value.escrowFeePercent ?? 0,
              actualUsdt: totals.perTicketUsdt,
              expectedUsdt: value.escrowPerTicketUsdt ?? 0,
            })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="pg-hint">{t('feeShare.hint')}</p>
      <p className="pg-hint">{t('hq.commission.vacantShareHint')}</p>
      {shareTable('USDT_PURCHASE')}
      <p className="pg-hint">{t('feeShare.escrowPoolHint')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="pg-label">{t('hq.commission.escrowFeePercent')}</span>
          {canEdit ? (
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
          {canEdit ? (
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

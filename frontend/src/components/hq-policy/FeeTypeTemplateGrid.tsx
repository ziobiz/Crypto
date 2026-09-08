'use client';

import { Fragment, useMemo, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';
import {
  hqPolicyApi,
  type FeeTypeTemplate,
  type HqCommissionPayload,
  type HqOrgLevel,
  type HqOrgShareByType,
  type HqOrgSharePolicy,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { sumOrgShareTable } from '@/lib/escrow-share-totals';

const ORG_LEVELS: HqOrgLevel[] = [
  'HEAD_OFFICE',
  'MASTER_DISTRIBUTOR',
  'REGIONAL_BRANCH',
  'AGENCY',
  'SALES_OFFICE',
];

type TicketKind = 'USDT_PURCHASE' | 'TRADE_ESCROW';

type DraftRow = {
  name: string;
  shares: HqOrgShareByType;
};

type CreateDraft = {
  kind: TicketKind;
  name: string;
};

function sharesOf(config: HqOrgSharePolicy, kind: TicketKind): HqOrgShareByType {
  return kind === 'USDT_PURCHASE' ? { ...config.USDT_PURCHASE } : { ...config.TRADE_ESCROW };
}

function emptyShares(): HqOrgShareByType {
  return {
    HEAD_OFFICE: { poolPercent: 0, perTicketUsdt: 0 },
    MASTER_DISTRIBUTOR: { poolPercent: 0, perTicketUsdt: 0 },
    REGIONAL_BRANCH: { poolPercent: 0, perTicketUsdt: 0 },
    AGENCY: { poolPercent: 0, perTicketUsdt: 0 },
    SALES_OFFICE: { poolPercent: 0, perTicketUsdt: 0 },
  };
}

function buildConfig(
  base: HqOrgSharePolicy,
  kind: TicketKind,
  shares: HqOrgShareByType,
): HqOrgSharePolicy {
  if (kind === 'USDT_PURCHASE') {
    return { ...base, USDT_PURCHASE: shares };
  }
  const totals = sumOrgShareTable(shares);
  return {
    ...base,
    TRADE_ESCROW: shares,
    escrowFeePercent: totals.poolPercent,
    escrowPerTicketUsdt: totals.perTicketUsdt,
  };
}

/** 선택한 종류만 기본값에서 복사하고, 다른 종류는 0 */
function initialConfigForKind(base: HqOrgSharePolicy, kind: TicketKind): HqOrgSharePolicy {
  if (kind === 'USDT_PURCHASE') {
    const shares = sharesOf(base, 'USDT_PURCHASE');
    return buildConfig(
      { ...base, TRADE_ESCROW: emptyShares(), escrowFeePercent: 0, escrowPerTicketUsdt: 0 },
      'USDT_PURCHASE',
      shares,
    );
  }
  const shares = sharesOf(base, 'TRADE_ESCROW');
  return buildConfig({ ...base, USDT_PURCHASE: emptyShares() }, 'TRADE_ESCROW', shares);
}

function nextTypeCode(existing: FeeTypeTemplate[]): string {
  const used = new Set(existing.map((f) => f.code.toUpperCase()));
  for (let i = 1; i <= 999; i += 1) {
    const code = `TYPE${i}`;
    if (!used.has(code)) return code;
  }
  return `TYPE${Date.now()}`;
}

type Props = {
  feeTypes: FeeTypeTemplate[];
  onChanged: (payload: HqCommissionPayload) => void;
};

const compactBtn = 'pg-btn pg-btn-secondary text-xs';
const compactBtnPrimary = 'pg-btn pg-btn-primary text-xs';

export function FeeTypeTemplateGrid({ feeTypes, onChanged }: Props) {
  const t = useT();
  const [editing, setEditing] = useState<{ kind: TicketKind; id: string } | null>(null);
  const [draft, setDraft] = useState<DraftRow | null>(null);
  const [create, setCreate] = useState<CreateDraft>({ kind: 'USDT_PURCHASE', name: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const usdtTypes = useMemo(
    () => feeTypes.filter((f) => (f.ticketKind ?? 'USDT_PURCHASE') === 'USDT_PURCHASE'),
    [feeTypes],
  );
  const tradeTypes = useMemo(
    () => feeTypes.filter((f) => f.ticketKind === 'TRADE_ESCROW'),
    [feeTypes],
  );

  function cancelEdit() {
    setEditing(null);
    setDraft(null);
  }

  function startEdit(kind: TicketKind, row: FeeTypeTemplate) {
    setEditing({ kind, id: row.id });
    setDraft({
      name: row.name,
      shares: sharesOf(row.config, kind),
    });
    setMsg('');
  }

  function setShare(level: HqOrgLevel, field: 'poolPercent' | 'perTicketUsdt', value: number) {
    if (!draft) return;
    setDraft({
      ...draft,
      shares: {
        ...draft.shares,
        [level]: {
          ...draft.shares[level],
          [field]: value,
        },
      },
    });
  }

  async function saveRow(kind: TicketKind, row: FeeTypeTemplate) {
    if (!draft) return;
    setSaving(true);
    setMsg('');
    try {
      const config = buildConfig(row.config, kind, draft.shares);
      const next = await hqPolicyApi.updateFeeType(row.id, {
        name: draft.name.trim() || row.name,
        config,
      });
      onChanged(next);
      cancelEdit();
      setMsg(t('hq.commission.feeTypeSaved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function addType() {
    const trimmed = create.name.trim();
    if (!trimmed) {
      setMsg(t('hq.commission.feeTypeNameRequired'));
      return;
    }
    const kindList = create.kind === 'USDT_PURCHASE' ? usdtTypes : tradeTypes;
    const fromName = trimmed
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '')
      .slice(0, 24);
    let code = fromName || nextTypeCode(kindList);
    if (kindList.some((f) => f.code.toUpperCase() === code)) {
      code = nextTypeCode(kindList);
    }
    setSaving(true);
    setMsg('');
    try {
      const base =
        kindList.find((f) => f.isDefault)?.config ??
        kindList[0]?.config ??
        feeTypes.find((f) => f.isDefault)?.config ??
        feeTypes[0]?.config;
      if (!base) {
        setMsg(t('hq.commission.feeTypesEmpty'));
        return;
      }
      const next = await hqPolicyApi.createFeeType({
        code,
        name: trimmed,
        ticketKind: create.kind,
        config: initialConfigForKind(base, create.kind),
      });
      onChanged(next);
      setCreate({ kind: create.kind, name: '' });
      setMsg(t('hq.commission.feeTypeSaved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(row: FeeTypeTemplate) {
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.updateFeeType(row.id, { isDefault: true });
      onChanged(next);
      setMsg(t('hq.commission.feeTypeSaved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function removeType(row: FeeTypeTemplate) {
    if (row.isDefault) return;
    if (!window.confirm(t('hq.commission.deleteFeeType'))) return;
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.deleteFeeType(row.id);
      onChanged(next);
      if (editing?.id === row.id) cancelEdit();
      setMsg(t('hq.commission.feeTypeSaved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function renderTable(kind: TicketKind, rows: FeeTypeTemplate[]) {
    const titleKey = kind === 'USDT_PURCHASE' ? 'ticket.USDT_PURCHASE' : 'ticket.TRADE_ESCROW';
    return (
      <div className="space-y-2">
        <p className="pg-section-head !border-0 !px-0 !py-0 !bg-transparent">{t(titleKey)}</p>
        <p className="pg-hint !text-[11px]">{t('hq.commission.operatingFeeMeaning')}</p>
        <div className="pg-card pg-table-wrap overflow-x-auto">
          <table className="pg-table">
            <thead>
              <tr>
                <th rowSpan={2}>{t('hq.commission.feeTypeCol')}</th>
                {ORG_LEVELS.map((lv) => (
                  <th key={lv} colSpan={2}>
                    {t(`org.${lv}` as MessageKey)}
                  </th>
                ))}
                <th colSpan={2}>{t('hq.commission.operatingFeeTotal')}</th>
                <th rowSpan={2}>{t('customerFees.col.manage')}</th>
              </tr>
              <tr>
                {ORG_LEVELS.flatMap((lv) => [
                  <th key={`${kind}-${lv}-pct`}>%</th>,
                  <th key={`${kind}-${lv}-fix`}>{t('hq.commission.perTicketShort')}</th>,
                ])}
                <th>%</th>
                <th>{t('hq.commission.perTicketShort')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="pg-hint">
                    {t('hq.commission.feeTypesEmpty')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isEditing = editing?.kind === kind && editing.id === row.id && draft;
                  const shares = isEditing ? draft.shares : sharesOf(row.config, kind);
                  const totals = sumOrgShareTable(shares);
                  return (
                    <tr
                      key={`${kind}-${row.id}`}
                      className={row.isDefault ? 'bg-sky-50' : undefined}
                    >
                      <td className={row.isDefault ? 'bg-sky-50' : undefined}>
                        {isEditing ? (
                          <input
                            className="pg-input !w-28 !text-xs"
                            value={draft.name}
                            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          />
                        ) : (
                          <div className="font-medium">{row.name}</div>
                        )}
                      </td>
                      {ORG_LEVELS.map((lv) => (
                        <Fragment key={lv}>
                          <td className={row.isDefault ? 'bg-sky-50' : undefined}>
                            {isEditing ? (
                              <PolicyNumberInput
                                min={0}
                                max={100}
                                step="0.0001"
                                value={shares[lv]?.poolPercent ?? 0}
                                onChange={(n) => setShare(lv, 'poolPercent', n)}
                                className="pg-input !w-14 !text-xs"
                              />
                            ) : (
                              `${Number(shares[lv]?.poolPercent ?? 0)}%`
                            )}
                          </td>
                          <td className={row.isDefault ? 'bg-sky-50' : undefined}>
                            {isEditing ? (
                              <PolicyNumberInput
                                min={0}
                                step="0.0001"
                                value={shares[lv]?.perTicketUsdt ?? 0}
                                onChange={(n) => setShare(lv, 'perTicketUsdt', n)}
                                className="pg-input !w-14 !text-xs"
                              />
                            ) : (
                              Number(shares[lv]?.perTicketUsdt ?? 0)
                            )}
                          </td>
                        </Fragment>
                      ))}
                      <td className={`font-medium${row.isDefault ? ' bg-sky-50' : ''}`}>
                        {totals.poolPercent}%
                      </td>
                      <td className={`font-medium${row.isDefault ? ' bg-sky-50' : ''}`}>
                        {totals.perTicketUsdt}
                      </td>
                      <td className={row.isDefault ? 'bg-sky-50' : undefined}>
                        <div className="pg-table-actions">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className={compactBtnPrimary}
                                disabled={saving}
                                onClick={() => void saveRow(kind, row)}
                              >
                                {t('common.save')}
                              </button>
                              <button
                                type="button"
                                className={compactBtn}
                                disabled={saving}
                                onClick={cancelEdit}
                              >
                                {t('common.cancel')}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={compactBtn}
                                onClick={() => startEdit(kind, row)}
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                type="button"
                                className={compactBtn}
                                disabled={saving || row.isDefault}
                                onClick={() => void setDefault(row)}
                              >
                                {t('hq.commission.setDefault')}
                              </button>
                              <button
                                type="button"
                                className={compactBtn}
                                disabled={saving || row.isDefault}
                                onClick={() => void removeType(row)}
                              >
                                {t('common.delete')}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="pg-hint !text-[11px]">{t('hq.commission.feeTypesGridHint')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="pg-input !w-auto !text-xs"
          value={create.kind}
          disabled={saving}
          onChange={(e) => setCreate({ ...create, kind: e.target.value as TicketKind })}
        >
          <option value="USDT_PURCHASE">{t('ticket.USDT_PURCHASE')}</option>
          <option value="TRADE_ESCROW">{t('ticket.TRADE_ESCROW')}</option>
        </select>
        <input
          className="pg-input !w-40 !text-xs"
          value={create.name}
          disabled={saving}
          placeholder={t('hq.commission.feeTypeNamePlaceholder')}
          onChange={(e) => setCreate({ ...create, name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void addType();
            }
          }}
        />
        <button
          type="button"
          className={compactBtnPrimary}
          disabled={saving}
          onClick={() => void addType()}
        >
          {t('hq.commission.createFeeType')}
        </button>
      </div>
      {renderTable('USDT_PURCHASE', usdtTypes)}
      {renderTable('TRADE_ESCROW', tradeTypes)}
      {msg && <p className="pg-hint !text-[11px]">{msg}</p>}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  customerFeesApi,
  type CustomerFeeGridRow,
  type CustomerFeeHistoryRow,
  type FeeTypeTemplate,
  type HqOrgLevel,
  type HqOrgShareByType,
} from '@/lib/api';
import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';
import {
  formatEscrowShareMismatch,
  formatUsdtShareMismatch,
  sumOrgShareTable,
} from '@/lib/escrow-share-totals';

const ORG_LEVELS: HqOrgLevel[] = [
  'HEAD_OFFICE',
  'MASTER_DISTRIBUTOR',
  'REGIONAL_BRANCH',
  'AGENCY',
  'SALES_OFFICE',
];

type TicketKind = 'USDT_PURCHASE' | 'TRADE_ESCROW';

type EditDraft = {
  feeTypeCode: string;
  operatingPercent: number;
  operatingFixedUsdt: number;
  shares: HqOrgShareByType;
  applyStartDate: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function cloneShares(s: HqOrgShareByType): HqOrgShareByType {
  const out = {} as HqOrgShareByType;
  for (const level of ORG_LEVELS) {
    out[level] = {
      poolPercent: Number(s[level]?.poolPercent) || 0,
      perTicketUsdt: Number(s[level]?.perTicketUsdt) || 0,
    };
  }
  return out;
}

function formatHybrid(pct: number, fixed: number) {
  return `${Number(pct).toFixed(4)}% / ${Number(fixed).toFixed(4)}`;
}

export default function CustomerFeesPage() {
  const t = useT();
  const [ticketKind, setTicketKind] = useState<TicketKind>('USDT_PURCHASE');
  const [rows, setRows] = useState<CustomerFeeGridRow[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeTypeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [history, setHistory] = useState<CustomerFeeHistoryRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await customerFeesApi.list(ticketKind);
      setRows(data.rows);
      setFeeTypes(data.feeTypes);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [ticketKind, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadHistory = useCallback(
    async (customerProfileId: string) => {
      try {
        const data = await customerFeesApi.history(customerProfileId, ticketKind);
        setHistory(data.rows);
      } catch {
        setHistory([]);
      }
    },
    [ticketKind],
  );

  useEffect(() => {
    if (selectedProfileId) void loadHistory(selectedProfileId);
  }, [selectedProfileId, loadHistory]);

  function startEdit(row: CustomerFeeGridRow) {
    setEditingId(row.customerProfileId);
    setSelectedProfileId(row.customerProfileId);
    setDraft({
      feeTypeCode: row.feeTypeCode,
      operatingPercent: row.operatingPercent,
      operatingFixedUsdt: row.operatingFixedUsdt,
      shares: cloneShares(row.shares),
      applyStartDate: row.applyStartDate || todayIso(),
    });
    setMsg('');
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function onTypeChange(code: string) {
    if (!draft) return;
    if (code === 'MANUAL') {
      setDraft({ ...draft, feeTypeCode: 'MANUAL' });
      return;
    }
    const tpl = feeTypes.find((f) => f.code === code);
    if (!tpl) {
      setDraft({ ...draft, feeTypeCode: code });
      return;
    }
    const cfg = tpl.config;
    if (ticketKind === 'TRADE_ESCROW') {
      setDraft({
        ...draft,
        feeTypeCode: code,
        operatingPercent: cfg.escrowFeePercent,
        operatingFixedUsdt: cfg.escrowPerTicketUsdt,
        shares: cloneShares(cfg.TRADE_ESCROW),
      });
    } else {
      setDraft({
        ...draft,
        feeTypeCode: code,
        operatingPercent: cfg.usdtOperatingFeePercent,
        operatingFixedUsdt: cfg.usdtOperatingFeeUsdt,
        shares: cloneShares(cfg.USDT_PURCHASE),
      });
    }
  }

  async function saveRow(row: CustomerFeeGridRow) {
    if (!draft) return;
    const totals = sumOrgShareTable(draft.shares);
    if (
      Math.abs(totals.poolPercent - Number(draft.operatingPercent)) > 0.0001 ||
      Math.abs(totals.perTicketUsdt - Number(draft.operatingFixedUsdt)) > 0.0001
    ) {
      const check = {
      ok: false,
      expectedPct: Number(draft.operatingPercent),
      actualPct: totals.poolPercent,
      expectedUsdt: Number(draft.operatingFixedUsdt),
      actualUsdt: totals.perTicketUsdt,
      exceeds:
        totals.poolPercent > Number(draft.operatingPercent) + 1e-9 ||
        totals.perTicketUsdt > Number(draft.operatingFixedUsdt) + 1e-9,
    };
      const text =
        ticketKind === 'TRADE_ESCROW'
          ? formatEscrowShareMismatch(t, check)
          : formatUsdtShareMismatch(t, check);
      window.alert(text);
      setMsg(text);
      return;
    }

    setSaving(true);
    setMsg('');
    try {
      await customerFeesApi.save({
        customerProfileId: row.customerProfileId,
        ticketKind,
        feeTypeCode: draft.feeTypeCode,
        operatingPercent: draft.operatingPercent,
        operatingFixedUsdt: draft.operatingFixedUsdt,
        shares: draft.shares,
        applyStartDate: draft.applyStartDate,
        forceManual: draft.feeTypeCode === 'MANUAL',
      });
      setMsg(t('customerFees.saved'));
      setEditingId(null);
      setDraft(null);
      await load();
      if (selectedProfileId) await loadHistory(selectedProfileId);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(row: CustomerFeeGridRow) {
    if (!window.confirm(t('customerFees.confirmDelete'))) return;
    setSaving(true);
    try {
      await customerFeesApi.remove({
        customerProfileId: row.customerProfileId,
        ticketKind,
        policyId: row.policyId ?? undefined,
      });
      setMsg(t('customerFees.deleted'));
      await load();
      if (selectedProfileId === row.customerProfileId) await loadHistory(selectedProfileId);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold">{t('customerFees.title')}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className={
              ticketKind === 'USDT_PURCHASE' ? 'pg-btn pg-btn-primary text-xs' : 'pg-btn pg-btn-secondary text-xs'
            }
            onClick={() => {
              setTicketKind('USDT_PURCHASE');
              cancelEdit();
            }}
          >
            {t('ticket.USDT_PURCHASE')}
          </button>
          <button
            type="button"
            className={
              ticketKind === 'TRADE_ESCROW' ? 'pg-btn pg-btn-primary text-xs' : 'pg-btn pg-btn-secondary text-xs'
            }
            onClick={() => {
              setTicketKind('TRADE_ESCROW');
              cancelEdit();
            }}
          >
            {t('ticket.TRADE_ESCROW')}
          </button>
        </div>
      </div>

      <p className="pg-hint">{t('customerFees.hint')}</p>
      {error && <p className="pg-callout pg-callout-danger">{error}</p>}
      {msg && <p className="pg-hint">{msg}</p>}
      {loading ? (
        <p className="pg-hint">{t('common.loading')}</p>
      ) : (
        <div className="pg-card pg-table-wrap overflow-x-auto">
          <table className="pg-table text-xs">
            <thead>
              <tr>
                <th>{t('customerFees.col.customer')}</th>
                <th>{t('customerFees.col.feeType')}</th>
                {ORG_LEVELS.map((level) => (
                  <th key={level}>{t(`org.${level}` as MessageKey)}</th>
                ))}
                <th>{t('customerFees.col.total')}</th>
                <th>{t('customerFees.col.manage')}</th>
                <th>{t('customerFees.col.applyStart')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const editing = editingId === row.customerProfileId && draft;
                const shares = editing ? draft.shares : row.shares;
                const selected = selectedProfileId === row.customerProfileId;
                return (
                  <tr
                    key={row.customerProfileId}
                    className={selected ? 'bg-slate-50' : undefined}
                    onClick={() => setSelectedProfileId(row.customerProfileId)}
                  >
                    <td>
                      <div className="font-medium">{row.customerName}</div>
                      <div className="text-[11px] text-gray-500">{row.customerEmail}</div>
                    </td>
                    <td>
                      {editing ? (
                        <select
                          className="pg-input py-1 text-xs"
                          value={draft.feeTypeCode}
                          onChange={(e) => void onTypeChange(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {feeTypes.map((ft) => (
                            <option key={ft.id} value={ft.code}>
                              {ft.name} ({ft.code})
                              {ft.isDefault ? ` · ${t('customerFees.default')}` : ''}
                            </option>
                          ))}
                          <option value="MANUAL">Manual</option>
                        </select>
                      ) : (
                        <span>
                          {row.feeTypeName || row.feeTypeCode}
                          {row.feeTypeCode === 'MANUAL' ? ' (Manual)' : ''}
                        </span>
                      )}
                    </td>
                    {ORG_LEVELS.map((level) => (
                      <td key={level}>
                        {editing ? (
                          <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              step="0.0001"
                              className="pg-input w-20 py-0.5"
                              value={draft.shares[level].poolPercent}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  feeTypeCode: 'MANUAL',
                                  shares: {
                                    ...draft.shares,
                                    [level]: {
                                      ...draft.shares[level],
                                      poolPercent: Number(e.target.value) || 0,
                                    },
                                  },
                                })
                              }
                            />
                            <input
                              type="number"
                              step="0.0001"
                              className="pg-input w-20 py-0.5"
                              value={draft.shares[level].perTicketUsdt}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  feeTypeCode: 'MANUAL',
                                  shares: {
                                    ...draft.shares,
                                    [level]: {
                                      ...draft.shares[level],
                                      perTicketUsdt: Number(e.target.value) || 0,
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                        ) : (
                          formatHybrid(shares[level]?.poolPercent ?? 0, shares[level]?.perTicketUsdt ?? 0)
                        )}
                      </td>
                    ))}
                    <td>
                      {editing ? (
                        <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="number"
                            step="0.0001"
                            className="pg-input w-20 py-0.5"
                            value={draft.operatingPercent}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                feeTypeCode: 'MANUAL',
                                operatingPercent: Number(e.target.value) || 0,
                              })
                            }
                          />
                          <input
                            type="number"
                            step="0.0001"
                            className="pg-input w-20 py-0.5"
                            value={draft.operatingFixedUsdt}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                feeTypeCode: 'MANUAL',
                                operatingFixedUsdt: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      ) : (
                        formatHybrid(row.operatingPercent, row.operatingFixedUsdt)
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1">
                        {editing ? (
                          <>
                            <button
                              type="button"
                              className="pg-btn pg-btn-primary text-[11px]"
                              disabled={saving}
                              onClick={() => void saveRow(row)}
                            >
                              {t('common.save')}
                            </button>
                            <button
                              type="button"
                              className="pg-btn pg-btn-secondary text-[11px]"
                              onClick={cancelEdit}
                            >
                              {t('common.cancel')}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="pg-btn pg-btn-secondary text-[11px]"
                              onClick={() => startEdit(row)}
                            >
                              {t('common.edit')}
                            </button>
                            <button
                              type="button"
                              className="pg-btn pg-btn-secondary text-[11px]"
                              disabled={saving}
                              onClick={() => void deleteRow(row)}
                            >
                              {t('common.delete')}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {editing ? (
                        <input
                          type="date"
                          className="pg-input py-0.5 text-xs"
                          value={draft.applyStartDate}
                          onChange={(e) => setDraft({ ...draft, applyStartDate: e.target.value })}
                        />
                      ) : (
                        row.applyStartDate
                      )}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <section className="pg-section">
        <div className="pg-section-head">{t('customerFees.historyTitle')}</div>
        <div className="pg-section-pad">
          {!selectedProfileId ? (
            <p className="pg-hint">{t('customerFees.historyHint')}</p>
          ) : (
            <div className="pg-card pg-table-wrap overflow-x-auto">
              <table className="pg-table text-xs">
                <thead>
                  <tr>
                    <th>{t('customerFees.hist.when')}</th>
                    <th>{t('customerFees.hist.action')}</th>
                    <th>{t('customerFees.col.feeType')}</th>
                    <th>{t('customerFees.col.applyStart')}</th>
                    <th>{t('customerFees.hist.changedBy')}</th>
                    <th>{t('customerFees.hist.after')}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => {
                    const after = h.afterJson as {
                      operatingPercent?: number;
                      operatingFixedUsdt?: number;
                      feeTypeCode?: string;
                    } | null;
                    return (
                      <tr key={h.id}>
                        <td>{new Date(h.createdAt).toLocaleString()}</td>
                        <td>{h.action}</td>
                        <td>{h.feeTypeCode}</td>
                        <td>{h.applyStartDate ?? '-'}</td>
                        <td>{h.changedBy?.name || h.changedBy?.email || '-'}</td>
                        <td>
                          {after
                            ? formatHybrid(after.operatingPercent ?? 0, after.operatingFixedUsdt ?? 0)
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {!history.length && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-500">
                        {t('common.noData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  customerFeesApi,
  type CustomerFeeGridRow,
  type CustomerFeeHistoryRow,
  type FeeTicketKind,
  type FeeTypeTemplate,
  type HqOrgLevel,
  type HqOrgShareByType,
  type UsdtQuoteResponseMode,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { sumOrgShareTable } from '@/lib/escrow-share-totals';
import { detailRowProps } from '@/lib/table-row-detail';
import { localizeFeeTypeLabel } from '@/lib/fee-type-label';

const ORG_LEVELS: HqOrgLevel[] = [
  'HEAD_OFFICE',
  'MASTER_DISTRIBUTOR',
  'REGIONAL_BRANCH',
  'AGENCY',
  'SALES_OFFICE',
];

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

function rowKey(row: Pick<CustomerFeeGridRow, 'customerProfileId' | 'ticketKind'>) {
  return `${row.customerProfileId}:${row.ticketKind}`;
}

type EditDraft = {
  feeTypeCode: string;
  shares: HqOrgShareByType;
  applyStartDate: string;
  usdtQuoteResponseMode: UsdtQuoteResponseMode;
};

export default function CustomerFeesPage() {
  const t = useT();
  const [rows, setRows] = useState<CustomerFeeGridRow[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeTypeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [history, setHistory] = useState<CustomerFeeHistoryRow[]>([]);

  const customerGroups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, CustomerFeeGridRow[]>();
    for (const row of rows) {
      if (!map.has(row.customerProfileId)) {
        order.push(row.customerProfileId);
        map.set(row.customerProfileId, []);
      }
      map.get(row.customerProfileId)!.push(row);
    }
    return order.map((profileId, setIndex) => {
      const first = map.get(profileId)?.[0];
      const customerName = (first?.customerName || '').trim();
      const customerEmail = (first?.customerEmail || '').trim();
      return {
        setIndex,
        setRows: map.get(profileId) ?? [],
        name: customerName || customerEmail || profileId,
        email: customerName && customerEmail ? customerEmail : '',
      };
    });
  }, [rows]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usdt, trade] = await Promise.all([
        customerFeesApi.list('USDT_PURCHASE'),
        customerFeesApi.list('TRADE_ESCROW'),
      ]);
      setFeeTypes([...usdt.feeTypes, ...trade.feeTypes]);
      const merged = [...usdt.rows, ...trade.rows].sort((a, b) => {
        const nameCmp = (a.customerName || a.customerEmail).localeCompare(
          b.customerName || b.customerEmail,
          'ko',
        );
        if (nameCmp !== 0) return nameCmp;
        if (a.ticketKind === b.ticketKind) return 0;
        return a.ticketKind === 'USDT_PURCHASE' ? -1 : 1;
      });
      setRows(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedKey) {
      setHistory([]);
      return;
    }
    const [customerProfileId, ticketKind] = selectedKey.split(':') as [string, FeeTicketKind];
    if (!customerProfileId || !ticketKind) {
      setHistory([]);
      return;
    }
    void customerFeesApi
      .history(customerProfileId, ticketKind)
      .then((r) => setHistory(r.rows))
      .catch(() => setHistory([]));
  }, [selectedKey]);

  const startEdit = (row: CustomerFeeGridRow) => {
    const key = rowKey(row);
    setEditingKey(key);
    setSelectedKey(key);
    setDraft({
      feeTypeCode: row.feeTypeCode,
      shares: { ...(row.shares ?? emptyShares()) },
      applyStartDate: row.applyStartDate || todayIso(),
      usdtQuoteResponseMode: (row.usdtQuoteResponseMode ?? 'FOLLOW_HQ') as UsdtQuoteResponseMode,
    });
    setMsg('');
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraft(null);
  };

  const applyType = (row: CustomerFeeGridRow, code: string) => {
    if (!draft) return;
    if (code === 'MANUAL') {
      setDraft({ ...draft, feeTypeCode: 'MANUAL' });
      return;
    }
    const tpl = feeTypes.find(
      (f) => f.code === code && (f.ticketKind ?? 'USDT_PURCHASE') === row.ticketKind,
    );
    if (!tpl) return;
    const cfg = tpl.config;
    const shares =
      row.ticketKind === 'USDT_PURCHASE' ? { ...cfg.USDT_PURCHASE } : { ...cfg.TRADE_ESCROW };
    setDraft({
      ...draft,
      feeTypeCode: code,
      shares,
    });
  };

  const saveRow = async (row: CustomerFeeGridRow) => {
    if (!draft) return;
    setSaving(true);
    setMsg('');
    try {
      const totals = sumOrgShareTable(draft.shares);
      await customerFeesApi.save({
        customerProfileId: row.customerProfileId,
        ticketKind: row.ticketKind,
        feeTypeCode: draft.feeTypeCode,
        operatingPercent: totals.poolPercent,
        operatingFixedUsdt: totals.perTicketUsdt,
        shares: draft.shares,
        applyStartDate: draft.applyStartDate,
        assignTypeOnly: false,
      });
      if (row.ticketKind === 'USDT_PURCHASE') {
        const mode = draft.usdtQuoteResponseMode;
        await api.users.update(row.userId, {
          usdtQuoteResponseMode: mode,
          usdtQuoteAutoDelayMinutes: mode === 'AUTO' ? row.usdtQuoteAutoDelayMinutes ?? 0 : null,
          usdtQuoteManualSlaHours: mode === 'MANUAL' ? row.usdtQuoteManualSlaHours ?? 3 : null,
        });
      }
      setMsg(t('customerFees.saved'));
      cancelEdit();
      await load();
      if (selectedKey === rowKey(row)) {
        const h = await customerFeesApi.history(row.customerProfileId, row.ticketKind);
        setHistory(h.rows);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (row: CustomerFeeGridRow) => {
    if (!window.confirm(t('customerFees.deleteConfirm'))) return;
    setSaving(true);
    try {
      await customerFeesApi.remove({
        customerProfileId: row.customerProfileId,
        ticketKind: row.ticketKind,
        policyId: row.id,
      });
      setMsg(t('customerFees.deleted'));
      cancelEdit();
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const typeOptionsFor = (kind: FeeTicketKind) => {
    const opts = feeTypes
      .filter((f) => (f.ticketKind ?? 'USDT_PURCHASE') === kind)
      .map((f) => ({
        code: f.code,
        name: localizeFeeTypeLabel(f.code, f.name, t),
      }));
    opts.push({ code: 'MANUAL', name: t('customerFees.manual') });
    return opts;
  };

  const tradeLabel = (kind: FeeTicketKind) =>
    kind === 'USDT_PURCHASE' ? t('customerFees.trade.purchase') : t('customerFees.trade.trade');

  const feeTypeLabel = (row: CustomerFeeGridRow) => {
    if (row.feeTypeCode === 'MANUAL') return t('customerFees.manual');
    return localizeFeeTypeLabel(row.feeTypeCode, row.feeTypeName, t);
  };

  const quoteModeLabel = (mode: string | undefined | null) => {
    const m = mode ?? 'FOLLOW_HQ';
    if (m === 'AUTO') return t('quoteResponse.AUTO');
    if (m === 'MANUAL') return t('quoteResponse.MANUAL');
    if (m === 'OFF') return t('quoteResponse.OFF');
    return t('quoteResponse.FOLLOW_HQ');
  };

  return (
    <div className="pg-stack">
      <h1 className="pg-page-title">{t('customerFees.title')}</h1>
      <p className="pg-hint">{t('customerFees.hint')}</p>
      {error && <p className="pg-error">{error}</p>}
      {msg && <p className="pg-hint">{msg}</p>}
      {loading ? (
        <p className="pg-hint">{t('common.loading')}</p>
      ) : (
        <div className="pg-card pg-table-wrap overflow-x-auto">
          <table className="pg-table pg-table-ops pg-table-customer-sets">
            <thead>
              <tr>
                <th rowSpan={2}>{t('customerFees.col.customer')}</th>
                <th rowSpan={2}>{t('customerFees.col.trade')}</th>
                <th rowSpan={2}>{t('customerFees.col.feeType')}</th>
                <th rowSpan={2}>{t('customerFees.col.quoteResponse')}</th>
                {ORG_LEVELS.map((lv) => (
                  <th key={lv} colSpan={2}>
                    {t(`org.${lv}` as MessageKey)}
                  </th>
                ))}
                <th colSpan={2}>{t('hq.commission.operatingFeeTotal')}</th>
                <th rowSpan={2}>{t('customerFees.col.manage')}</th>
                <th rowSpan={2}>{t('customerFees.col.applyStart')}</th>
              </tr>
              <tr>
                {ORG_LEVELS.flatMap((lv) => [
                  <th key={`${lv}-pct`}>%</th>,
                  <th key={`${lv}-fix`}>{t('hq.commission.perTicketShort')}</th>,
                ])}
                <th>%</th>
                <th>{t('hq.commission.perTicketShort')}</th>
              </tr>
            </thead>
            <tbody>
              {customerGroups.length === 0 ? (
                <tr>
                  <td colSpan={17} className="pg-empty">
                    {t('customers.empty')}
                  </td>
                </tr>
              ) : (
                customerGroups.flatMap(({ setIndex, setRows, name, email }) =>
                  setRows.map((row, rowIndex) => {
                    const key = rowKey(row);
                    const editing = editingKey === key && draft;
                    const shares = editing ? draft.shares : row.shares;
                    const totals = editing
                      ? sumOrgShareTable(draft.shares)
                      : { poolPercent: row.totalPercent, perTicketUsdt: row.totalFixedUsdt };
                    const typeOptions = typeOptionsFor(row.ticketKind);
                    const setTone = setIndex % 2 === 0 ? 'pg-fee-set-a' : 'pg-fee-set-b';
                    const quoteMode = editing
                      ? draft.usdtQuoteResponseMode
                      : ((row.usdtQuoteResponseMode ?? 'FOLLOW_HQ') as UsdtQuoteResponseMode);
                    return (
                      <tr
                        key={key}
                        {...detailRowProps(t('customerFees.dblclickEdit'), () => startEdit(row))}
                        className={['pg-row-detail', setTone].join(' ')}
                        onClick={() => setSelectedKey(key)}
                      >
                        {rowIndex === 0 ? (
                          <td className="pg-fee-customer-cell" rowSpan={setRows.length}>
                            <div>{name}</div>
                            {email ? (
                              <div className="text-xs font-normal text-slate-500">{email}</div>
                            ) : null}
                          </td>
                        ) : null}
                        <td>{tradeLabel(row.ticketKind)}</td>
                        <td>
                          {editing ? (
                            <select
                              className="pg-input !text-xs"
                              value={draft.feeTypeCode}
                              onChange={(e) => applyType(row, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {typeOptions.map((o) => (
                                <option key={o.code} value={o.code}>
                                  {o.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-medium">{feeTypeLabel(row)}</span>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {row.ticketKind === 'USDT_PURCHASE' ? (
                            editing ? (
                              <select
                                className="pg-input !text-xs min-w-[7rem]"
                                value={quoteMode}
                                onChange={(e) =>
                                  setDraft({
                                    ...draft,
                                    usdtQuoteResponseMode: e.target
                                      .value as UsdtQuoteResponseMode,
                                  })
                                }
                                aria-label={t('customerFees.col.quoteResponse')}
                              >
                                <option value="FOLLOW_HQ">{t('quoteResponse.FOLLOW_HQ')}</option>
                                <option value="AUTO">{t('quoteResponse.AUTO')}</option>
                                <option value="MANUAL">{t('quoteResponse.MANUAL')}</option>
                                <option value="OFF">{t('quoteResponse.OFF')}</option>
                              </select>
                            ) : (
                              <span className="text-xs">{quoteModeLabel(quoteMode)}</span>
                            )
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        {ORG_LEVELS.map((lv) => (
                          <Fragment key={lv}>
                            <td>
                              {editing ? (
                                <input
                                  type="number"
                                  step="0.0001"
                                  className="pg-input !w-14 !text-xs"
                                  value={shares[lv]?.poolPercent ?? 0}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      feeTypeCode: 'MANUAL',
                                      shares: {
                                        ...draft.shares,
                                        [lv]: {
                                          ...draft.shares[lv],
                                          poolPercent: Number(e.target.value) || 0,
                                        },
                                      },
                                    })
                                  }
                                />
                              ) : (
                                `${Number(shares[lv]?.poolPercent ?? 0)}%`
                              )}
                            </td>
                            <td>
                              {editing ? (
                                <input
                                  type="number"
                                  step="0.0001"
                                  className="pg-input !w-14 !text-xs"
                                  value={shares[lv]?.perTicketUsdt ?? 0}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      feeTypeCode: 'MANUAL',
                                      shares: {
                                        ...draft.shares,
                                        [lv]: {
                                          ...draft.shares[lv],
                                          perTicketUsdt: Number(e.target.value) || 0,
                                        },
                                      },
                                    })
                                  }
                                />
                              ) : (
                                Number(shares[lv]?.perTicketUsdt ?? 0)
                              )}
                            </td>
                          </Fragment>
                        ))}
                        <td className="font-medium">{Number(totals.poolPercent)}%</td>
                        <td className="font-medium">{Number(totals.perTicketUsdt)}</td>
                        <td>
                          <div className="pg-table-actions" onClick={(e) => e.stopPropagation()}>
                            {editing ? (
                              <>
                                <button
                                  type="button"
                                  className="pg-btn pg-btn-primary text-xs"
                                  disabled={saving}
                                  onClick={() => void saveRow(row)}
                                >
                                  {t('common.save')}
                                </button>
                                <button
                                  type="button"
                                  className="pg-btn pg-btn-secondary text-xs"
                                  disabled={saving}
                                  onClick={cancelEdit}
                                >
                                  {t('common.cancel')}
                                </button>
                                <button
                                  type="button"
                                  className="pg-btn pg-btn-secondary text-xs"
                                  disabled={saving}
                                  onClick={() => void deleteRow(row)}
                                >
                                  {t('common.delete')}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="pg-btn pg-btn-secondary text-xs"
                                onClick={() => startEdit(row)}
                              >
                                {t('common.edit')}
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          {editing ? (
                            <input
                              type="date"
                              className="pg-input !text-xs"
                              value={draft.applyStartDate}
                              onChange={(e) =>
                                setDraft({ ...draft, applyStartDate: e.target.value })
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            row.applyStartDate
                          )}
                        </td>
                      </tr>
                    );
                  }),
                )
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="pg-hint">{t('customerFees.dblclickEdit')}</p>

      <section className="pg-section">
        <div className="pg-section-head">{t('customerFees.historyTitle')}</div>
        <div className="pg-section-pad">
          {!selectedKey ? (
            <p className="pg-hint">{t('customerFees.historyPick')}</p>
          ) : history.length === 0 ? (
            <p className="pg-hint">{t('customerFees.historyEmpty')}</p>
          ) : (
            <div className="pg-card pg-table-wrap overflow-x-auto">
              <table className="pg-table pg-table-ops">
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
                      feeTypeName?: string;
                    } | null;
                    return (
                      <tr key={h.id}>
                        <td>{new Date(h.createdAt).toLocaleString()}</td>
                        <td>{h.action}</td>
                        <td>{localizeFeeTypeLabel(after?.feeTypeCode ?? h.feeTypeCode, after?.feeTypeName, t)}</td>
                        <td>{h.applyStartDate}</td>
                        <td>{h.changedBy?.name || h.changedBy?.email || '-'}</td>
                        <td>
                          {after
                            ? `${localizeFeeTypeLabel(after.feeTypeCode, after.feeTypeName, t)} ${after.operatingPercent ?? ''}% +${after.operatingFixedUsdt ?? 0}`
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

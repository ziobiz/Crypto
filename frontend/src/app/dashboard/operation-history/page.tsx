'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, ApiError } from '@/lib/api';

type LogRow = {
  id: string;
  action: string;
  summary: string;
  createdAt: string;
  actor: { id: string; email: string; name: string; role: string };
  merchantAdmin: { id: string; email: string; name: string };
};

export default function OperationHistoryPage() {
  const { user } = useAuth();
  const t = useT();
  const isHq = user?.role === 'SUPER_ADMIN';
  const [rows, setRows] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    api.merchant
      .listOperationLogs({ page, pageSize: 50 })
      .then((r) => {
        setRows(r.rows);
        setTotal(r.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [page, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!isHq) return;
    if (!window.confirm(t('opHistory.deleteConfirm'))) return;
    setError('');
    setMsg('');
    try {
      await api.merchant.deleteOperationLog(id);
      setMsg(t('opHistory.delete'));
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.saveFailed'));
    }
  }

  return (
    <div className="pg-stack">
      <h1 className="pg-page-title">{t('opHistory.title')}</h1>
      <p className="pg-hint">{t('opHistory.hint')}</p>
      {error && <p className="pg-error">{error}</p>}
      {msg && <p className="pg-hint">{msg}</p>}
      <div className="pg-card pg-table-wrap overflow-x-auto">
        <table className="pg-table pg-table-ops">
          <thead>
            <tr>
              <th>{t('opHistory.col.time')}</th>
              {isHq && <th>{t('opHistory.col.merchant')}</th>}
              <th>{t('opHistory.col.actor')}</th>
              <th>{t('opHistory.col.action')}</th>
              <th>{t('opHistory.col.summary')}</th>
              {isHq && <th>{t('common.manage')}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={isHq ? 6 : 4} className="pg-empty">
                  {t('opHistory.empty')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.createdAt).toLocaleString()}</td>
                  {isHq && (
                    <td>
                      <div>{row.merchantAdmin.name}</div>
                      <div className="text-[11px] text-slate-500">{row.merchantAdmin.email}</div>
                    </td>
                  )}
                  <td>
                    <div>{row.actor.name}</div>
                    <div className="text-[11px] text-slate-500">{row.actor.email}</div>
                  </td>
                  <td>{row.action}</td>
                  <td className="text-left">{row.summary}</td>
                  {isHq && (
                    <td>
                      <button
                        type="button"
                        className="pg-btn pg-btn-secondary text-[11px]"
                        onClick={() => remove(row.id)}
                      >
                        {t('opHistory.delete')}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 text-[13px]">
        <button
          type="button"
          className="pg-btn pg-btn-secondary"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          {t('common.prev')}
        </button>
        <span>
          {page} / {Math.max(1, Math.ceil(total / 50))}
        </span>
        <button
          type="button"
          className="pg-btn pg-btn-secondary"
          disabled={page * 50 >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}

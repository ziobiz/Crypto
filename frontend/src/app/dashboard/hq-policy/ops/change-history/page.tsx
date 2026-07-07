'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type AdminChangeLogItem } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

const ENTITY_TYPES = [
  'USER',
  'HQ_ACCESS_MATRIX',
  'HQ_ORG_COLUMNS',
  'HQ_COMMISSION_RISK',
  'HQ_FEE_TIERS',
  'HQ_EXCHANGE_RATE_SOURCES',
  'HQ_COMMISSION_RATES',
  'HQ_PLATFORM',
  'HQ_PLATFORM_EMAIL',
  'HQ_PLATFORM_BRANDING',
  'PLATFORM_RELEASE',
] as const;

function entityTypeLabelKey(type: string): MessageKey | null {
  const key = `hq.ops.entity.${type}` as MessageKey;
  return ENTITY_TYPES.includes(type as (typeof ENTITY_TYPES)[number]) ? key : null;
}

function actionLabelKey(action: string): MessageKey {
  return `hq.ops.action.${action}` as MessageKey;
}

function formatJson(value: unknown): string {
  if (value == null) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function HqChangeHistoryPage() {
  const t = useT();
  const [items, setItems] = useState<AdminChangeLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hqPolicyApi.listChangeLogs({
        page,
        search: search || undefined,
        entityType: entityType || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, search, entityType, t]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / 30));

  return (
    <div className="pg-stack">
      <div className="flex flex-wrap items-end gap-3">
        <label className="pg-field">
          <span className="pg-label">{t('hq.ops.filter.entityType')}</span>
          <select
            className="pg-input"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('common.all')}</option>
            {ENTITY_TYPES.map((type) => {
              const key = entityTypeLabelKey(type);
              return (
                <option key={type} value={type}>
                  {key ? t(key) : type}
                </option>
              );
            })}
          </select>
        </label>
        <label className="pg-field flex-1 min-w-[200px]">
          <span className="pg-label">{t('common.search')}</span>
          <input
            className="pg-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())}
            placeholder={t('hq.ops.searchPlaceholder')}
          />
        </label>
        <button type="button" className="pg-btn pg-btn-primary" onClick={() => (setPage(1), load())}>
          {t('common.search')}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('hq.ops.col.datetime')}</th>
              <th>{t('hq.ops.col.admin')}</th>
              <th>{t('hq.ops.col.action')}</th>
              <th>{t('hq.ops.col.entity')}</th>
              <th>{t('hq.ops.col.summary')}</th>
              <th>{t('hq.ops.col.detail')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-500">
                  {t('hq.ops.empty')}
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const entityKey = entityTypeLabelKey(row.entityType);
                const expanded = expandedId === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr>
                      <td className="whitespace-nowrap text-[12px]">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div className="text-[12px] font-medium">{row.changedBy.name}</div>
                        <div className="text-[11px] text-gray-500">{row.changedBy.email}</div>
                      </td>
                      <td>{t(actionLabelKey(row.action))}</td>
                      <td>
                        <div className="text-[12px]">{entityKey ? t(entityKey) : row.entityType}</div>
                        {row.entityLabel && (
                          <div className="text-[11px] text-gray-500">{row.entityLabel}</div>
                        )}
                      </td>
                      <td className="max-w-xs text-[12px]">{row.summary}</td>
                      <td>
                        <button
                          type="button"
                          className="text-[12px] text-blue-600 hover:underline"
                          onClick={() => setExpandedId(expanded ? null : row.id)}
                        >
                          {expanded ? t('hq.ops.hideDetail') : t('hq.ops.showDetail')}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 p-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <div className="mb-1 text-[11px] font-bold text-gray-600">
                                {t('hq.ops.before')}
                              </div>
                              <pre className="max-h-48 overflow-auto rounded border bg-white p-2 text-[11px]">
                                {formatJson(row.before)}
                              </pre>
                            </div>
                            <div>
                              <div className="mb-1 text-[11px] font-bold text-gray-600">
                                {t('hq.ops.after')}
                              </div>
                              <pre className="max-h-48 overflow-auto rounded border bg-white p-2 text-[11px]">
                                {formatJson(row.after)}
                              </pre>
                            </div>
                          </div>
                          {row.ipAddress && (
                            <p className="mt-2 text-[11px] text-gray-500">
                              IP: {row.ipAddress}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            className="pg-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t('common.prev')}
          </button>
          <span className="text-[13px] text-gray-600">
            {page} / {pages}
          </span>
          <button
            type="button"
            className="pg-btn"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </div>
  );
}

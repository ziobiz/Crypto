'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type PlatformReleaseLogItem } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

function levelLabelKey(level: string): MessageKey {
  return `hq.ops.release.level.${level}` as MessageKey;
}

function sourceLabelKey(source: string): MessageKey {
  return `hq.ops.release.source.${source}` as MessageKey;
}

export default function HqReleaseHistoryPage() {
  const t = useT();
  const { locale } = useLocale();
  const [items, setItems] = useState<PlatformReleaseLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hqPolicyApi.listReleaseLogs({
        page,
        search: search || undefined,
        locale,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, search, locale, t]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / 30));

  return (
    <div className="pg-stack">
      <div className="rounded border border-blue-100 bg-blue-50/60 p-3 text-[12px] text-gray-700">
        <p className="font-bold text-gray-800">{t('hq.ops.releaseAutoTitle')}</p>
        <p className="mt-1">{t('hq.ops.releaseAutoDesc')}</p>
        <ul className="mt-2 list-inside list-disc space-y-0.5">
          <li>{t('hq.ops.releaseAutoMajor')}</li>
          <li>{t('hq.ops.releaseAutoMinor')}</li>
          <li>{t('hq.ops.releaseAutoPatch')}</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="pg-field flex-1 min-w-[200px]">
          <span className="pg-label">{t('common.search')}</span>
          <input
            className="pg-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())}
            placeholder={t('hq.ops.releaseSearchPlaceholder')}
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
              <th>{t('hq.ops.col.deployedAt')}</th>
              <th>{t('hq.ops.release.version')}</th>
              <th>{t('hq.ops.release.level')}</th>
              <th>{t('hq.ops.release.source')}</th>
              <th>{t('hq.ops.release.title')}</th>
              <th>{t('hq.ops.col.admin')}</th>
              <th>{t('hq.ops.release.description')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500">
                  {t('hq.ops.releaseEmpty')}
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-[12px]">
                    {new Date(row.deployedAt).toLocaleString()}
                  </td>
                  <td className="font-medium whitespace-nowrap">{row.version}</td>
                  <td>
                    <span
                      className={`pg-badge ${
                        row.changeLevel === 'MAJOR'
                          ? 'pg-badge-error'
                          : row.changeLevel === 'MINOR'
                            ? 'pg-badge-success'
                            : 'pg-badge-muted'
                      }`}
                    >
                      {t(levelLabelKey(row.changeLevel))}
                    </span>
                  </td>
                  <td className="text-[11px]">{t(sourceLabelKey(row.source))}</td>
                  <td className="max-w-[10rem] text-[12px] font-medium">{row.title ?? '—'}</td>
                  <td>
                    {row.recordedBy ? (
                      <>
                        <div className="text-[12px]">{row.recordedBy.name}</div>
                        <div className="text-[11px] text-gray-500">{row.recordedBy.email}</div>
                      </>
                    ) : (
                      <span className="text-[11px] text-gray-500">{t('hq.ops.release.system')}</span>
                    )}
                  </td>
                  <td className="max-w-xs text-[12px] whitespace-pre-wrap">{row.description ?? '—'}</td>
                </tr>
              ))
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

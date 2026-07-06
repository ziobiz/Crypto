'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqOrgColumnConfig, type HqOrgColumnsPayload } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

function orgKey(org: string): MessageKey {
  return (`org.${org}` as MessageKey);
}

const PAGE_KEYS: Record<string, MessageKey> = {
  '/dashboard/usdt': 'hq.page.usdtList',
  '/dashboard/escrow': 'hq.page.escrowList',
  '/dashboard/ledger': 'hq.page.ledger',
};

export default function HqOrgColumnsPage() {
  const t = useT();
  const [data, setData] = useState<HqOrgColumnsPayload | null>(null);
  const [config, setConfig] = useState<HqOrgColumnConfig>({});
  const [pagePath, setPagePath] = useState('/dashboard/usdt');
  const [orgLevel, setOrgLevel] = useState('HEAD_OFFICE');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getOrgColumns()
      .then((d) => {
        setData(d);
        setConfig(d.config);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, []);

  const columns = data?.catalog[pagePath] ?? [];
  const row = config[pagePath]?.[orgLevel] ?? { allowedKeys: [], order: [] };

  function toggleKey(key: string) {
    const allowed = new Set(row.allowedKeys);
    if (allowed.has(key)) allowed.delete(key);
    else allowed.add(key);
    const order = row.order.filter((k) => allowed.has(k));
    for (const k of allowed) if (!order.includes(k)) order.push(k);
    setConfig((c) => ({
      ...c,
      [pagePath]: {
        ...c[pagePath],
        [orgLevel]: { allowedKeys: [...allowed], order },
      },
    }));
  }

  function moveKey(key: string, dir: -1 | 1) {
    const order = [...row.order];
    const i = order.indexOf(key);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    setConfig((c) => ({
      ...c,
      [pagePath]: {
        ...c[pagePath],
        [orgLevel]: { ...row, order },
      },
    }));
  }

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.saveOrgColumns(config);
      setData(next);
      setConfig(next.config);
      setMsg(t('hq.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <p className="text-sm text-red-600">{error} — {t('hq.backendHint')}</p>;
  }

  if (!data) return <p className="text-sm text-gray-500">{t('hq.loading')}</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{t('hq.orgColumns.desc')}</p>
      <div className="flex flex-wrap gap-3">
        <select
          value={pagePath}
          onChange={(e) => setPagePath(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          {Object.keys(data.catalog).map((p) => (
            <option key={p} value={p}>
              {PAGE_KEYS[p] ? t(PAGE_KEYS[p]) : p}
            </option>
          ))}
        </select>
        <select
          value={orgLevel}
          onChange={(e) => setOrgLevel(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          {data.orgLevels.map((o) => (
            <option key={o} value={o}>
              {t(orgKey(o))}
            </option>
          ))}
        </select>
      </div>
      <ul className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
        {columns.map((col) => {
          const checked = row.allowedKeys.includes(col.key);
          const orderIdx = row.order.indexOf(col.key);
          return (
            <li key={col.key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={checked}
                disabled={col.fixed}
                onChange={() => toggleKey(col.key)}
              />
              <span className="min-w-[8rem] font-medium">{col.label}</span>
              {col.fixed && <span className="text-xs text-gray-400">{t('hq.orgColumns.fixed')}</span>}
              {checked && !col.fixed && (
                <span className="flex gap-1">
                  <button type="button" className="rounded border px-2" onClick={() => moveKey(col.key, -1)}>
                    ↑
                  </button>
                  <button type="button" className="rounded border px-2" onClick={() => moveKey(col.key, 1)}>
                    ↓
                  </button>
                  <span className="text-xs text-gray-400">{t('hq.orgColumns.order')} {orderIdx + 1}</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? t('hq.saving') : t('hq.save')}
        </button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  );
}

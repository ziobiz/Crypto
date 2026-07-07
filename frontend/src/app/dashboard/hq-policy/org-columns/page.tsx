'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqOrgColumnConfig, type HqOrgColumnsPayload } from '@/lib/api';
import { hqColumnLabelKey, hqPageLabelKey } from '@/i18n/page-paths';
import type { MessageKey } from '@/i18n/messages';

function orgKey(org: string): MessageKey {
  return (`org.${org}` as MessageKey);
}

function pageLabel(t: (k: MessageKey) => string, path: string) {
  const key = hqPageLabelKey(path);
  return key ? t(key) : path;
}

function columnLabel(t: (k: MessageKey) => string, pagePath: string, colKey: string, fallback: string) {
  const key = hqColumnLabelKey(pagePath, colKey);
  return key ? t(key) : fallback;
}

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
    return <p className="text-red-600">{error} — {t('hq.backendHint')}</p>;
  }

  if (!data) return <p className="pg-hint">{t('hq.loading')}</p>;

  return (
    <section className="pg-section">
      <div className="pg-section-head">{t('hq.sub.org.columns')}</div>
      <div className="pg-section-pad space-y-3">
        <p className="pg-hint">{t('hq.orgColumns.desc')}</p>
        <div className="flex flex-wrap gap-3">
          <select value={pagePath} onChange={(e) => setPagePath(e.target.value)} className="pg-select w-auto min-w-[12rem]">
            {Object.keys(data.catalog).map((p) => (
              <option key={p} value={p}>
                {pageLabel(t, p)}
              </option>
            ))}
          </select>
          <select value={orgLevel} onChange={(e) => setOrgLevel(e.target.value)} className="pg-select w-auto min-w-[10rem]">
            {data.orgLevels.map((o) => (
              <option key={o} value={o}>
                {t(orgKey(o))}
              </option>
            ))}
          </select>
        </div>
        <ul className="pg-card divide-y">
          {columns.map((col) => {
            const checked = row.allowedKeys.includes(col.key);
            const orderIdx = row.order.indexOf(col.key);
            return (
              <li key={col.key} className="flex flex-wrap items-center gap-3 px-4 py-2">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={col.fixed}
                  onChange={() => toggleKey(col.key)}
                />
                <span className="min-w-[8rem] font-medium">{columnLabel(t, pagePath, col.key, col.label)}</span>
                {col.fixed && <span className="pg-hint">{t('hq.orgColumns.fixed')}</span>}
                {checked && !col.fixed && (
                  <span className="flex items-center gap-1">
                    <button type="button" className="pg-btn pg-btn-secondary px-2" onClick={() => moveKey(col.key, -1)}>
                      ↑
                    </button>
                    <button type="button" className="pg-btn pg-btn-secondary px-2" onClick={() => moveKey(col.key, 1)}>
                      ↓
                    </button>
                    <span className="pg-hint">{t('hq.orgColumns.order')} {orderIdx + 1}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={saving} className="pg-btn pg-btn-primary disabled:opacity-50">
            {saving ? t('hq.saving') : t('hq.save')}
          </button>
          {msg && <span className="pg-hint">{msg}</span>}
        </div>
      </div>
    </section>
  );
}

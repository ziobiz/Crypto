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

export default function HqGridOrderPage() {
  const t = useT();
  const [data, setData] = useState<HqOrgColumnsPayload | null>(null);
  const [config, setConfig] = useState<HqOrgColumnConfig>({});
  const [pagePath, setPagePath] = useState('/dashboard/usdt');
  const [orgLevel, setOrgLevel] = useState('HEAD_OFFICE');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    hqPolicyApi.getOrgColumns().then((d) => {
      setData(d);
      setConfig(d.config);
    }).catch(console.error);
  }, []);

  const columns = data?.catalog[pagePath] ?? [];
  const row = config[pagePath]?.[orgLevel] ?? { allowedKeys: [], order: [] };
  const ordered = row.order.filter((k) => row.allowedKeys.includes(k));

  function moveKey(key: string, dir: -1 | 1) {
    const idx = ordered.indexOf(key);
    if (idx < 0) return;
    const next = [...ordered];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap]!, next[idx]!];
    setConfig((c) => ({
      ...c,
      [pagePath]: {
        ...c[pagePath],
        [orgLevel]: { ...row, order: next },
      },
    }));
  }

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      await hqPolicyApi.saveOrgColumns(config);
      setMsg(t('hq.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="pg-section">
      <div className="pg-section-head">{t('hq.sub.org.order')}</div>
      <div className="pg-section-pad space-y-3">
        <p className="pg-hint">{t('hq.gridOrder.desc')}</p>

        <div className="flex flex-wrap gap-3">
          <select value={pagePath} onChange={(e) => setPagePath(e.target.value)} className="pg-select w-auto min-w-[12rem]">
            {Object.keys(data?.catalog ?? {}).map((path) => (
              <option key={path} value={path}>{pageLabel(t, path)}</option>
            ))}
          </select>
          <select value={orgLevel} onChange={(e) => setOrgLevel(e.target.value)} className="pg-select w-auto min-w-[10rem]">
            {['HEAD_OFFICE', 'MASTER', 'BRANCH', 'AGENCY', 'SALES_OFFICE'].map((o) => (
              <option key={o} value={o}>{t(orgKey(o))}</option>
            ))}
          </select>
        </div>

        <ul className="pg-card divide-y">
          {ordered.map((key) => {
            const col = columns.find((c) => c.key === key);
            return (
              <li key={key} className="flex items-center justify-between px-4 py-2">
                <span>{columnLabel(t, pagePath, key, col?.label ?? key)}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveKey(key, -1)} className="pg-btn pg-btn-secondary px-2">↑</button>
                  <button type="button" onClick={() => moveKey(key, 1)} className="pg-btn pg-btn-secondary px-2">↓</button>
                </div>
              </li>
            );
          })}
          {ordered.length === 0 && (
            <li className="px-4 py-6 text-center pg-hint">{t('hq.gridOrder.empty')}</li>
          )}
        </ul>

        <button onClick={save} disabled={saving} className="pg-btn pg-btn-primary disabled:opacity-50">
          {saving ? t('hq.saving') : t('hq.save')}
        </button>
        {msg && <p className="pg-hint">{msg}</p>}
      </div>
    </section>
  );
}

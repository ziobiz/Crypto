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
    <div className="max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold">{t('hq.sub.org.order')}</h2>
      <p className="text-sm text-gray-600">{t('hq.gridOrder.desc')}</p>

      <div className="flex flex-wrap gap-3">
        <select value={pagePath} onChange={(e) => setPagePath(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          {Object.entries(PAGE_KEYS).map(([path, key]) => (
            <option key={path} value={path}>{t(key)}</option>
          ))}
        </select>
        <select value={orgLevel} onChange={(e) => setOrgLevel(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          {['HEAD_OFFICE', 'MASTER', 'BRANCH', 'AGENCY', 'SALES_OFFICE'].map((o) => (
            <option key={o} value={o}>{t(orgKey(o))}</option>
          ))}
        </select>
      </div>

      <ul className="rounded-xl border bg-white divide-y">
        {ordered.map((key) => {
          const col = columns.find((c) => c.key === key);
          return (
            <li key={key} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{col?.label ?? key}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => moveKey(key, -1)} className="rounded border px-2 py-1">↑</button>
                <button type="button" onClick={() => moveKey(key, 1)} className="rounded border px-2 py-1">↓</button>
              </div>
            </li>
          );
        })}
        {ordered.length === 0 && (
          <li className="px-4 py-6 text-center text-gray-500">{t('hq.gridOrder.empty')}</li>
        )}
      </ul>

      <button onClick={save} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
        {saving ? t('hq.saving') : t('hq.save')}
      </button>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  );
}

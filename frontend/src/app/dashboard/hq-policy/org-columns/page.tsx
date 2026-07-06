'use client';

import { useEffect, useState } from 'react';
import { hqPolicyApi, type HqOrgColumnConfig, type HqOrgColumnsPayload } from '@/lib/api';

const ORG_LABELS: Record<string, string> = {
  HEAD_OFFICE: '본사',
  MASTER_DISTRIBUTOR: '총판',
  BRANCH: '지사',
  AGENCY: '대리점',
  SALES_OFFICE: '영업점',
};

const PAGE_LABELS: Record<string, string> = {
  '/dashboard/usdt': 'USDT 매입 목록',
  '/dashboard/escrow': '무역 에스크로 목록',
  '/dashboard/ledger': '수수료 장부',
};

export default function HqOrgColumnsPage() {
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
      .catch((e) => setError(e instanceof Error ? e.message : '불러오기 실패'));
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
      setMsg('저장되었습니다.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <p className="text-sm text-red-600">{error} — 백엔드 재배포 후 pm2 restart crypto-api</p>;
  }

  if (!data) return <p className="text-sm text-gray-500">불러오는 중…</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">PG 「조직항목설정」— 화면별·조직별 허용 열 및 표시 순서.</p>
      <div className="flex flex-wrap gap-3">
        <select
          value={pagePath}
          onChange={(e) => setPagePath(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          {Object.keys(data.catalog).map((p) => (
            <option key={p} value={p}>
              {PAGE_LABELS[p] ?? p}
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
              {ORG_LABELS[o] ?? o}
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
              {col.fixed && <span className="text-xs text-gray-400">고정</span>}
              {checked && !col.fixed && (
                <span className="flex gap-1">
                  <button type="button" className="rounded border px-2" onClick={() => moveKey(col.key, -1)}>
                    ↑
                  </button>
                  <button type="button" className="rounded border px-2" onClick={() => moveKey(col.key, 1)}>
                    ↓
                  </button>
                  <span className="text-xs text-gray-400">순서 {orderIdx + 1}</span>
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
          {saving ? '저장 중…' : '저장'}
        </button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  );
}

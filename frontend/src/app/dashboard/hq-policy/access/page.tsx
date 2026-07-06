'use client';

import { useEffect, useState } from 'react';
import { hqPolicyApi, type HqAccessMatrix, type HqAccessPayload } from '@/lib/api';

const ORG_LABELS: Record<string, string> = {
  HEAD_OFFICE: '본사',
  MASTER_DISTRIBUTOR: '총판',
  BRANCH: '지사',
  AGENCY: '대리점',
  SALES_OFFICE: '영업점',
};

export default function HqAccessPage() {
  const [data, setData] = useState<HqAccessPayload | null>(null);
  const [matrix, setMatrix] = useState<HqAccessMatrix>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    hqPolicyApi.getAccess().then((d) => {
      setData(d);
      setMatrix(d.matrix);
    });
  }, []);

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.saveAccess(matrix);
      setData(next);
      setMatrix(next.matrix);
      setMsg('저장되었습니다.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <p className="text-sm text-gray-500">불러오는 중…</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        조직 단계별 화면 권한 (NONE / VIEW / MODIFY / DELETE). PG 「본사권한설정」과 동일 개념입니다.
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">화면</th>
              {data.orgLevels.map((org) => (
                <th key={org} className="px-3 py-2 text-left font-medium text-gray-500">
                  {ORG_LABELS[org] ?? org}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.pages.map((page) => (
              <tr key={page.path} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900">{page.label}</div>
                  <div className="text-xs text-gray-400">{page.path}</div>
                </td>
                {data.orgLevels.map((org) => (
                  <td key={org} className="px-3 py-2">
                    <select
                      value={matrix[org]?.[page.path] ?? 'NONE'}
                      onChange={(e) =>
                        setMatrix((m) => ({
                          ...m,
                          [org]: { ...m[org], [page.path]: e.target.value as HqAccessMatrix[string][string] },
                        }))
                      }
                      className="w-full rounded border border-gray-200 px-2 py-1"
                    >
                      {data.permissionLevels.map((lv) => (
                        <option key={lv} value={lv}>
                          {lv}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

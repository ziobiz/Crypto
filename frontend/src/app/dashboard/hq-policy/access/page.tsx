'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqAccessMatrix, type HqAccessPayload } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

function orgKey(org: string): MessageKey {
  return (`org.${org}` as MessageKey);
}

export default function HqAccessPage() {
  const t = useT();
  const [data, setData] = useState<HqAccessPayload | null>(null);
  const [matrix, setMatrix] = useState<HqAccessMatrix>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getAccess()
      .then((d) => {
        setData(d);
        setMatrix(d.matrix);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, []);

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.saveAccess(matrix);
      setData(next);
      setMatrix(next.matrix);
      setMsg(t('hq.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {error} — {t('hq.backendHint')}
      </p>
    );
  }

  if (!data) return <p className="text-sm text-gray-500">{t('hq.loading')}</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{t('hq.access.desc')}</p>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">{t('hq.access.screen')}</th>
              {data.orgLevels.map((org) => (
                <th key={org} className="px-3 py-2 text-left font-medium text-gray-500">
                  {t(orgKey(org))}
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
          {saving ? t('hq.saving') : t('hq.save')}
        </button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  );
}

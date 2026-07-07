'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqAccessMatrix, type HqAccessPayload } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { hqPageLabelKey, permissionLabelKey } from '@/i18n/page-paths';

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
      <p className="text-red-600">
        {error} — {t('hq.backendHint')}
      </p>
    );
  }

  if (!data) return <p className="pg-hint">{t('hq.loading')}</p>;

  return (
    <section className="pg-section">
      <div className="pg-section-head">{t('hq.sub.access.permission')}</div>
      <div className="pg-section-pad space-y-3">
        <p className="pg-hint">{t('hq.access.desc')}</p>
        <div className="pg-card pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('hq.access.screen')}</th>
              {data.orgLevels.map((org) => (
                <th key={org}>{t(orgKey(org))}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.pages.map((page) => {
              const labelKey = hqPageLabelKey(page.path);
              const label = labelKey ? t(labelKey) : page.label;
              return (
                <tr key={page.path}>
                  <td>
                    <div className="font-medium">{label}</div>
                    <div className="pg-hint">{page.path}</div>
                  </td>
                  {data.orgLevels.map((org) => (
                    <td key={org}>
                      <select
                        value={matrix[org]?.[page.path] ?? 'NONE'}
                        onChange={(e) =>
                          setMatrix((m) => ({
                            ...m,
                            [org]: { ...m[org], [page.path]: e.target.value as HqAccessMatrix[string][string] },
                          }))
                        }
                        className="pg-select"
                      >
                        {data.permissionLevels.map((lv) => (
                          <option key={lv} value={lv}>
                            {t(permissionLabelKey(lv))}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="pg-btn pg-btn-primary disabled:opacity-50"
          >
            {saving ? t('hq.saving') : t('hq.save')}
          </button>
          {msg && <span className="pg-hint">{msg}</span>}
        </div>
      </div>
    </section>
  );
}

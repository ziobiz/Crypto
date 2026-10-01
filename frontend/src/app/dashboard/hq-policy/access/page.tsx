'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqAccessMatrix, type HqAccessPayload, type HqPermissionLevel } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { hqPageLabelKey } from '@/i18n/page-paths';
import { PermissionLevelSelect } from '@/components/PermissionLevelSelect';

function orgKey(org: string): MessageKey {
  return (`org.${org}` as MessageKey);
}

function groupLabelKey(group: string): MessageKey {
  const map: Record<string, MessageKey> = {
    main: 'hq.access.group.main',
    invoices: 'nav.invoices',
    ops: 'nav.ops',
    hqPolicy: 'nav.hqPolicy',
    merchant: 'hq.access.group.merchant',
  };
  return map[group] ?? ('hq.access.screen' as MessageKey);
}

const DEFAULT_GROUP_ORDER = ['main', 'invoices', 'ops', 'hqPolicy', 'merchant'];

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
  }, [t]);

  const groupedPages = useMemo(() => {
    if (!data) return [];
    const order = data.pageGroups?.length ? data.pageGroups : DEFAULT_GROUP_ORDER;
    const byGroup = new Map<string, typeof data.pages>();
    for (const page of data.pages) {
      const g = page.group || 'other';
      const list = byGroup.get(g) ?? [];
      list.push(page);
      byGroup.set(g, list);
    }
    const sections = order
      .filter((g) => byGroup.has(g))
      .map((g) => ({ group: g, pages: byGroup.get(g)! }));
    for (const [g, pages] of byGroup) {
      if (!order.includes(g)) sections.push({ group: g, pages });
    }
    return sections;
  }, [data]);

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
      <div className="pg-section-pad space-y-4">
        <p className="pg-hint">{t('hq.access.desc')}</p>

        {groupedPages.map((section) => (
          <div key={section.group} className="pg-card overflow-hidden">
            <div className="pg-access-group-head">
              {t(groupLabelKey(section.group))}
              <span className="ml-2 text-[11px] font-normal text-slate-500">
                {section.pages.length}
              </span>
            </div>
            <div className="pg-table-wrap">
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
                  {section.pages.map((page) => {
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
                            <PermissionLevelSelect
                              value={(matrix[org]?.[page.path] ?? 'NONE') as HqPermissionLevel}
                              levels={data.permissionLevels}
                              onChange={(lv) =>
                                setMatrix((m) => ({
                                  ...m,
                                  [org]: { ...m[org], [page.path]: lv },
                                }))
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

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

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import {
  hqPolicyApi,
  type HqPermissionLevel,
  type HqUserPageAccessDetail,
  type HqUserPageAccessRow,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { hqPageLabelKey } from '@/i18n/page-paths';
import { PermissionLevelSelect } from '@/components/PermissionLevelSelect';

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

export default function HqUserPageAccessPage() {
  const t = useT();
  const [users, setUsers] = useState<HqUserPageAccessRow[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState<HqUserPageAccessDetail | null>(null);
  const [draft, setDraft] = useState<Record<string, HqPermissionLevel>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hqPolicyApi
      .listUserAccess()
      .then((r) => setUsers(r.users))
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  const groupedPages = useMemo(() => {
    if (!detail) return [];
    const byGroup = new Map<string, typeof detail.pages>();
    for (const page of detail.pages) {
      const g = page.group || 'other';
      const list = byGroup.get(g) ?? [];
      list.push(page);
      byGroup.set(g, list);
    }
    const sections = DEFAULT_GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({
      group: g,
      pages: byGroup.get(g)!,
    }));
    for (const [g, pages] of byGroup) {
      if (!DEFAULT_GROUP_ORDER.includes(g)) sections.push({ group: g, pages });
    }
    return sections;
  }, [detail]);

  const loadDetail = useCallback(
    (userId: string) => {
      if (!userId) {
        setDetail(null);
        setDraft({});
        return;
      }
      setError('');
      setMsg('');
      hqPolicyApi
        .getUserAccess(userId)
        .then((d) => {
          setDetail(d);
          const next: Record<string, HqPermissionLevel> = {};
          for (const page of d.pages) {
            next[page.path] = (d.overrides?.[page.path] ?? d.base[page.path] ?? 'NONE') as HqPermissionLevel;
          }
          setDraft(next);
        })
        .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
    },
    [t],
  );

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  async function save() {
    if (!selectedId || !detail || detail.locked) return;
    setSaving(true);
    setMsg('');
    try {
      const overrides: Record<string, string> = {};
      for (const page of detail.pages) {
        const lv = draft[page.path] ?? 'NONE';
        const base = detail.base[page.path] ?? 'NONE';
        if (lv !== base) overrides[page.path] = lv;
      }
      const next = await hqPolicyApi.saveUserAccess(
        selectedId,
        Object.keys(overrides).length ? overrides : null,
      );
      setDetail(next);
      const nextDraft: Record<string, HqPermissionLevel> = {};
      for (const page of next.pages) {
        nextDraft[page.path] = (next.overrides?.[page.path] ?? next.base[page.path] ?? 'NONE') as HqPermissionLevel;
      }
      setDraft(nextDraft);
      setUsers((rows) =>
        rows.map((u) => (u.id === selectedId ? { ...u, hasOverrides: next.overrides != null } : u)),
      );
      setMsg(t('hq.userPageAccess.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function resetToBase() {
    if (!selectedId || !detail || detail.locked) return;
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.saveUserAccess(selectedId, null);
      setDetail(next);
      const nextDraft: Record<string, HqPermissionLevel> = {};
      for (const page of next.pages) {
        nextDraft[page.path] = (next.base[page.path] ?? 'NONE') as HqPermissionLevel;
      }
      setDraft(nextDraft);
      setUsers((rows) =>
        rows.map((u) => (u.id === selectedId ? { ...u, hasOverrides: false } : u)),
      );
      setMsg(t('hq.userPageAccess.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (error && !users.length) {
    return (
      <p className="text-red-600">
        {error} — {t('hq.backendHint')}
      </p>
    );
  }

  return (
    <section className="pg-section">
      <div className="pg-section-head">{t('hq.sub.access.userPageAccess')}</div>
      <div className="pg-section-pad space-y-3">
        <p className="pg-hint">{t('hq.userPageAccess.desc')}</p>
        <label className="pg-field max-w-md block">
          <span className="pg-field-label">{t('hq.userPageAccess.pickUser')}</span>
          <select
            className="pg-input mt-1"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">{t('hq.userPageAccess.pickUser')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email}) · {u.role}
                {u.hasOverrides ? ' ★' : ''}
              </option>
            ))}
          </select>
        </label>
        {users.length === 0 && <p className="pg-hint">{t('hq.userPageAccess.noUsers')}</p>}
        {error && <p className="pg-error">{error}</p>}
        {detail && (
          <>
            {detail.locked && <p className="pg-hint">{t('hq.userPageAccess.lockedSuper')}</p>}
            <div className="space-y-3">
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
                          <th>{t('hq.userPageAccess.pickUser')}</th>
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
                              <td>
                                <PermissionLevelSelect
                                  value={(draft[page.path] ?? 'NONE') as HqPermissionLevel}
                                  levels={detail.permissionLevels}
                                  disabled={detail.locked}
                                  onChange={(lv) => setDraft((d) => ({ ...d, [page.path]: lv }))}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            {!detail.locked && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="pg-btn pg-btn-primary disabled:opacity-50"
                >
                  {saving ? t('hq.saving') : t('hq.save')}
                </button>
                <button
                  type="button"
                  onClick={resetToBase}
                  disabled={saving}
                  className="pg-btn pg-btn-secondary disabled:opacity-50"
                >
                  {t('hq.userPageAccess.reset')}
                </button>
                {msg && <span className="pg-hint">{msg}</span>}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

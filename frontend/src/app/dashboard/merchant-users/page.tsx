'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  ApiError,
  type HqPermissionLevel,
  type MerchantOperatorPageAccess,
} from '@/lib/api';
import { SensitiveOtpGate, useSensitiveOtp } from '@/components/SensitiveOtpGate';
import { PermissionLevelSelect } from '@/components/PermissionLevelSelect';
import { hqPageLabelKey } from '@/i18n/page-paths';

type OperatorRow = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  totpEnabled: boolean;
  createdAt: string;
  hasOverrides?: boolean;
};

export default function MerchantUsersPage() {
  const { user } = useAuth();
  const t = useT();
  const isAdmin = user?.role === 'CUSTOMER' && user.operatorsEnabled === true;

  if (!isAdmin) {
    return (
      <div className="pg-stack">
        <h1 className="pg-page-title">{t('merchantUsers.title')}</h1>
        <p className="pg-error">{t('merchantUsers.adminOnly')}</p>
      </div>
    );
  }

  return (
    <SensitiveOtpGate lockContent={false}>
      <MerchantUsersPanel />
    </SensitiveOtpGate>
  );
}

function MerchantUsersPanel() {
  const t = useT();
  const { runWithOtp } = useSensitiveOtp();
  const [operators, setOperators] = useState<OperatorRow[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [maxActive, setMaxActive] = useState(2);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [accessOpId, setAccessOpId] = useState<string | null>(null);
  const [accessDetail, setAccessDetail] = useState<MerchantOperatorPageAccess | null>(null);
  const [accessDraft, setAccessDraft] = useState<Record<string, HqPermissionLevel>>({});

  const load = useCallback(() => {
    api.merchant
      .listOperators()
      .then((r) => {
        setOperators(r.operators);
        setActiveCount(r.activeCount);
        setMaxActive(r.maxActive);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function createOperator() {
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const result = await runWithOtp(() =>
        api.merchant.createOperator({ email, name, phone: phone || undefined }),
      );
      if (result.cancelled) return;
      setMsg(t('merchantUsers.created'));
      setOpen(false);
      setEmail('');
      setName('');
      setPhone('');
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    setSaving(true);
    setError('');
    try {
      const result = await runWithOtp(() =>
        active ? api.merchant.deactivateOperator(id) : api.merchant.activateOperator(id),
      );
      if (result.cancelled) return;
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function openPageAccess(id: string) {
    setError('');
    setMsg('');
    setAccessOpId(id);
    try {
      const d = await api.merchant.getOperatorPageAccess(id);
      setAccessDetail(d);
      const next: Record<string, HqPermissionLevel> = {};
      for (const page of d.pages) {
        next[page.path] = (d.overrides?.[page.path] ?? d.base[page.path] ?? 'NONE') as HqPermissionLevel;
      }
      setAccessDraft(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
      setAccessOpId(null);
    }
  }

  async function savePageAccess() {
    if (!accessOpId || !accessDetail) return;
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const overrides: Record<string, string> = {};
      for (const page of accessDetail.pages) {
        const lv = accessDraft[page.path] ?? 'NONE';
        const base = accessDetail.base[page.path] ?? 'NONE';
        if (lv !== base) overrides[page.path] = lv;
      }
      const result = await runWithOtp(() =>
        api.merchant.saveOperatorPageAccess(
          accessOpId,
          Object.keys(overrides).length ? overrides : null,
        ),
      );
      if (result.cancelled) return;
      const next = result.value;
      setAccessDetail(next);
      const nextDraft: Record<string, HqPermissionLevel> = {};
      for (const page of next.pages) {
        nextDraft[page.path] = (next.overrides?.[page.path] ?? next.base[page.path] ?? 'NONE') as HqPermissionLevel;
      }
      setAccessDraft(nextDraft);
      setMsg(t('merchantUsers.pageAccessSaved'));
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pg-stack">
      <h1 className="pg-page-title">{t('merchantUsers.title')}</h1>
      <p className="pg-hint">{t('merchantUsers.hint')}</p>
      <p className="pg-hint">
        {t('merchantUsers.activeSlot', { n: String(activeCount), max: String(maxActive) })}
      </p>
      {error && <p className="pg-error">{error}</p>}
      {msg && <p className="pg-hint">{msg}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          className="pg-btn pg-btn-primary"
          disabled={saving || activeCount >= maxActive}
          onClick={() => setOpen(true)}
        >
          {t('merchantUsers.add')}
        </button>
      </div>
      {open && (
        <div className="pg-card p-4 space-y-2 max-w-md">
          <h2 className="font-semibold text-[13px]">{t('merchantUsers.createTitle')}</h2>
          <label className="pg-field">
            <span className="pg-field-label">{t('merchantUsers.col.email')}</span>
            <input className="pg-input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="pg-field">
            <span className="pg-field-label">{t('merchantUsers.col.name')}</span>
            <input className="pg-input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="pg-field">
            <span className="pg-field-label">{t('merchantUsers.col.phone')}</span>
            <input className="pg-input mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <button type="button" className="pg-btn pg-btn-primary" disabled={saving} onClick={createOperator}>
              {t('common.save')}
            </button>
            <button type="button" className="pg-btn pg-btn-secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
      <div className="pg-card pg-table-wrap overflow-x-auto">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('merchantUsers.col.email')}</th>
              <th>{t('merchantUsers.col.name')}</th>
              <th>{t('merchantUsers.col.phone')}</th>
              <th>{t('merchantUsers.col.status')}</th>
              <th>{t('merchantUsers.col.otp')}</th>
              <th>{t('merchantUsers.col.created')}</th>
              <th>{t('common.manage')}</th>
            </tr>
          </thead>
          <tbody>
            {operators.length === 0 ? (
              <tr>
                <td colSpan={7} className="pg-empty">
                  {t('merchantUsers.empty')}
                </td>
              </tr>
            ) : (
              operators.map((op) => (
                <tr key={op.id}>
                  <td>{op.email}</td>
                  <td>{op.name}</td>
                  <td>{op.phone || '—'}</td>
                  <td>{op.isActive ? t('common.active') : t('common.inactive')}</td>
                  <td>{op.totpEnabled ? 'ON' : 'OFF'}</td>
                  <td>{new Date(op.createdAt).toLocaleString()}</td>
                  <td className="space-x-1 whitespace-nowrap">
                    <button
                      type="button"
                      className="pg-btn pg-btn-secondary text-[11px]"
                      disabled={saving}
                      onClick={() => openPageAccess(op.id)}
                    >
                      {t('merchantUsers.pageAccess')}
                    </button>
                    <button
                      type="button"
                      className="pg-btn pg-btn-secondary text-[11px]"
                      disabled={saving}
                      onClick={() => toggle(op.id, op.isActive)}
                    >
                      {op.isActive ? t('merchantUsers.deactivate') : t('merchantUsers.activate')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {accessOpId && accessDetail && (
        <div className="pg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-[13px]">
              {t('merchantUsers.pageAccess')} — {accessDetail.user.name} ({accessDetail.user.email})
            </h2>
            <button
              type="button"
              className="pg-btn pg-btn-secondary text-[11px]"
              onClick={() => {
                setAccessOpId(null);
                setAccessDetail(null);
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
          <p className="pg-hint">{t('merchantUsers.pageAccessHint')}</p>
          <div className="pg-table-wrap overflow-x-auto">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>{t('hq.access.screen')}</th>
                  <th>{t('merchantUsers.pageAccess')}</th>
                </tr>
              </thead>
              <tbody>
                {accessDetail.pages.map((page) => {
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
                          value={(accessDraft[page.path] ?? 'NONE') as HqPermissionLevel}
                          levels={accessDetail.permissionLevels}
                          onChange={(lv) => setAccessDraft((d) => ({ ...d, [page.path]: lv }))}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="pg-btn pg-btn-primary"
            disabled={saving}
            onClick={savePageAccess}
          >
            {saving ? t('common.saving') : t('merchantUsers.pageAccessSave')}
          </button>
        </div>
      )}
    </div>
  );
}

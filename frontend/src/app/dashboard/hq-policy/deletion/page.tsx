'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { DoubleConfirmDialog } from '@/components/DoubleConfirmDialog';
import {
  hqPolicyApi,
  type DeletedUserRow,
  type HqDeletionPayload,
  type Organization,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

export default function HqDeletionPage() {
  const t = useT();
  const [data, setData] = useState<HqDeletionPayload | null>(null);
  const [userMonths, setUserMonths] = useState(3);
  const [orgMonths, setOrgMonths] = useState(3);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [purgeUser, setPurgeUser] = useState<DeletedUserRow | null>(null);
  const [restoreUser, setRestoreUser] = useState<DeletedUserRow | null>(null);
  const [purgeOrg, setPurgeOrg] = useState<Organization | null>(null);

  function applyPayload(next: HqDeletionPayload) {
    setData(next);
    setUserMonths(next.policy.userRetentionMonths);
    setOrgMonths(next.policy.orgRetentionMonths);
  }

  useEffect(() => {
    hqPolicyApi
      .getDeletion()
      .then(applyPayload)
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  async function savePolicy() {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const next = await hqPolicyApi.saveDeletion({
        userRetentionMonths: userMonths,
        orgRetentionMonths: orgMonths,
      });
      applyPayload(next);
      setMsg(t('deletion.saved'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmPurgeUser() {
    if (!purgeUser) return;
    try {
      await hqPolicyApi.purgeDeletedUser(purgeUser.id);
      setPurgeUser(null);
      applyPayload(await hqPolicyApi.getDeletion());
      setMsg(t('deletion.purged'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('deletion.purgeFailed'));
      setPurgeUser(null);
    }
  }

  async function confirmRestoreUser() {
    if (!restoreUser) return;
    try {
      await hqPolicyApi.restoreDeletedUser(restoreUser.id);
      setRestoreUser(null);
      applyPayload(await hqPolicyApi.getDeletion());
      setMsg(t('deletion.restored'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('deletion.restoreFailed'));
      setRestoreUser(null);
    }
  }

  async function confirmPurgeOrg() {
    if (!purgeOrg) return;
    try {
      await hqPolicyApi.purgeDeletedOrg(purgeOrg.id);
      setPurgeOrg(null);
      applyPayload(await hqPolicyApi.getDeletion());
      setMsg(t('deletion.purged'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('deletion.purgeFailed'));
      setPurgeOrg(null);
    }
  }

  function fmt(v?: string | null) {
    return v ? new Date(v).toLocaleString() : '—';
  }

  if (error && !data) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="pg-hint">{t('hq.loading')}</p>;

  return (
    <div className="pg-stack">
      <p className="pg-hint">{t('deletion.desc')}</p>
      {msg && <p className="pg-callout pg-callout-success">{msg}</p>}
      {error && <p className="pg-callout pg-callout-error">{error}</p>}

      <div className="pg-card">
        <div className="pg-card-head">{t('deletion.policyTitle')}</div>
        <div className="pg-card-body grid gap-4 sm:grid-cols-2">
          <label className="pg-field">
            <span className="pg-field-label">{t('deletion.userMonths')}</span>
            <input
              type="number"
              min={1}
              max={36}
              value={userMonths}
              onChange={(e) => setUserMonths(Number(e.target.value))}
              className="pg-input mt-1"
            />
            <p className="pg-hint mt-1">{t('deletion.userMonthsHint')}</p>
          </label>
          <label className="pg-field">
            <span className="pg-field-label">{t('deletion.orgMonths')}</span>
            <input
              type="number"
              min={1}
              max={36}
              value={orgMonths}
              onChange={(e) => setOrgMonths(Number(e.target.value))}
              className="pg-input mt-1"
            />
            <p className="pg-hint mt-1">{t('deletion.orgMonthsHint')}</p>
          </label>
        </div>
        <div className="px-4 pb-4">
          <button type="button" className="pg-btn pg-btn-primary" onClick={savePolicy} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>

      <div className="pg-card pg-table-wrap">
        <div className="pg-card-head">{t('deletion.usersTitle')}</div>
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('users.col.email')}</th>
              <th>{t('users.col.name')}</th>
              <th>{t('users.col.role')}</th>
              <th>{t('deletion.deletedAt')}</th>
              <th>{t('deletion.purgeAt')}</th>
              <th>{t('users.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data.users.length === 0 ? (
              <tr>
                <td colSpan={6} className="pg-empty">
                  {t('deletion.usersEmpty')}
                </td>
              </tr>
            ) : (
              data.users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.name}</td>
                  <td>{t(`role.${u.role}` as MessageKey)}</td>
                  <td>{fmt(u.deletedAt)}</td>
                  <td>{fmt(u.purgeAt)}</td>
                  <td>
                    <div className="pg-table-actions">
                      <button type="button" className="pg-action-chip pg-action-chip-edit" onClick={() => setRestoreUser(u)}>
                        {t('deletion.restore')}
                      </button>
                      <button type="button" className="pg-action-chip pg-action-chip-danger" onClick={() => setPurgeUser(u)}>
                        {t('deletion.purge')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pg-card pg-table-wrap">
        <div className="pg-card-head">{t('deletion.orgsTitle')}</div>
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('orgs.col.name')}</th>
              <th>{t('orgs.col.code')}</th>
              <th>{t('orgs.col.type')}</th>
              <th>{t('deletion.deletedAt')}</th>
              <th>{t('deletion.purgeAt')}</th>
              <th>{t('users.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data.orgs.length === 0 ? (
              <tr>
                <td colSpan={6} className="pg-empty">
                  {t('deletion.orgsEmpty')}
                </td>
              </tr>
            ) : (
              data.orgs.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.code}</td>
                  <td>{t(`org.${o.type}` as MessageKey)}</td>
                  <td>{fmt(o.deletedAt)}</td>
                  <td>{fmt(o.purgeAt)}</td>
                  <td>
                    <button type="button" className="pg-link-danger" onClick={() => setPurgeOrg(o)}>
                      {t('deletion.purge')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {restoreUser && (
        <DoubleConfirmDialog
          title={t('deletion.restoreUserTitle')}
          step1={t('deletion.restoreUserStep1', { email: restoreUser.email })}
          step2={t('deletion.restoreUserStep2', { email: restoreUser.email })}
          confirmLabel={t('deletion.restore')}
          onConfirm={confirmRestoreUser}
          onClose={() => setRestoreUser(null)}
        />
      )}
      {purgeUser && (
        <DoubleConfirmDialog
          title={t('deletion.purgeUserTitle')}
          step1={t('deletion.purgeUserStep1', { email: purgeUser.email })}
          step2={t('deletion.purgeUserStep2', { email: purgeUser.email })}
          confirmLabel={t('deletion.purge')}
          onConfirm={confirmPurgeUser}
          onClose={() => setPurgeUser(null)}
        />
      )}
      {purgeOrg && (
        <DoubleConfirmDialog
          title={t('deletion.purgeOrgTitle')}
          step1={t('deletion.purgeOrgStep1', { name: purgeOrg.name })}
          step2={t('deletion.purgeOrgStep2', { name: purgeOrg.name })}
          confirmLabel={t('deletion.purge')}
          onConfirm={confirmPurgeOrg}
          onClose={() => setPurgeOrg(null)}
        />
      )}
    </div>
  );
}

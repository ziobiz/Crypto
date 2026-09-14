'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, ApiError } from '@/lib/api';
import { SensitiveOtpGate, useSensitiveOtp } from '@/components/SensitiveOtpGate';

type OperatorRow = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  totpEnabled: boolean;
  createdAt: string;
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
                  <td>
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
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import { membershipAdminApi } from '@/lib/api';

export default function MembershipAdminPolicyPage() {
  const t = useT();
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    membershipAdminApi
      .getRefundPolicy()
      .then((r) => setEnabled(r.policy.adminCancelRefundEnabled === true))
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  function save() {
    requestConfirm({
      title: t('membershipAdmin.policy.save'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: async () => {
        setSaving(true);
        setMsg('');
        try {
          const r = await membershipAdminApi.saveRefundPolicy({
            adminCancelRefundEnabled: enabled,
          });
          setEnabled(r.policy.adminCancelRefundEnabled === true);
          setMsg(t('hq.saved'));
        } catch (e) {
          setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setSaving(false);
        }
      },
    });
  }

  if (loading) return <p className="pg-hint">{t('hq.loading')}</p>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;

  return (
    <div className="space-y-4 max-w-xl">
      {doubleConfirmDialog}
      <p className="pg-hint text-sm">{t('membershipAdmin.policy.desc')}</p>
      <p className="pg-callout pg-callout-muted text-xs">{t('paidMembership.noRefund')}</p>
      <label className="flex items-start gap-3 rounded border border-slate-200 bg-white p-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span>
          <span className="font-semibold block">{t('membershipAdmin.policy.adminSwitch')}</span>
          <span className="pg-hint text-xs">{t('membershipAdmin.policy.adminSwitchHint')}</span>
        </span>
      </label>
      <p className="pg-hint text-xs">{t('membershipAdmin.policy.cryptoNote')}</p>
      <button
        type="button"
        className="pg-btn pg-btn-primary text-xs"
        disabled={saving}
        onClick={save}
      >
        {saving ? t('hq.saving') : t('membershipAdmin.policy.save')}
      </button>
      {msg && <p className="pg-hint">{msg}</p>}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, type KycCase, type ManagedUser } from '@/lib/api';
import { KycFileLink } from '@/components/KycFileLink';
import { formatDate } from '@/lib/format';
import type { MessageKey } from '@/i18n/messages';

function statusKey(status: string): MessageKey {
  if (status === 'PENDING') return 'kyc.status.PENDING';
  if (status === 'APPROVED') return 'kyc.status.APPROVED';
  if (status === 'REJECTED') return 'kyc.status.REJECTED';
  return 'kyc.status.NOT_SUBMITTED';
}

function kycBadgeClass(status?: string | null): string {
  if (status === 'APPROVED') return 'pg-badge-kyc-pass';
  if (status === 'PENDING') return 'pg-badge-warn';
  if (status === 'REJECTED') return 'pg-badge-muted';
  return 'pg-badge-info';
}

function purposeKey(purpose: string): MessageKey {
  if (purpose === 'JP_TAX_SUPPORT_DOC') return 'attachment.JP_TAX_SUPPORT_DOC';
  return 'attachment.FUNDING_FORECAST_REPORT';
}

export default function CustomerKycDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const t = useT();
  const [kyc, setKyc] = useState<KycCase | null>(null);
  const [profile, setProfile] = useState<ManagedUser | null>(null);
  const [reason, setReason] = useState('');
  const [hqNote, setHqNote] = useState('');
  const [draftAction, setDraftAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [simEnabled, setSimEnabled] = useState(true);
  const [simRateMode, setSimRateMode] = useState<'LIVE' | 'SAND'>('LIVE');

  const load = () => {
    api.kyc.getByUser(userId).then(setKyc).catch(console.error);
    api.users.get(userId).then(setProfile).catch(console.error);
  };

  useEffect(() => {
    load();
  }, [userId]);

  useEffect(() => {
    if (!profile?.customerProfile) return;
    setSimEnabled(profile.customerProfile.simulatorEnabled !== false);
    setSimRateMode(profile.customerProfile.simulatorRateMode === 'SAND' ? 'SAND' : 'LIVE');
  }, [profile]);

  const simDirty =
    !!profile?.customerProfile &&
    (simEnabled !== (profile.customerProfile.simulatorEnabled !== false) ||
      simRateMode !== (profile.customerProfile.simulatorRateMode === 'SAND' ? 'SAND' : 'LIVE'));

  async function saveSimulatorSettings() {
    if (!profile) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, {
        simulatorEnabled: simEnabled,
        simulatorRateMode: simRateMode,
      });
      setProfile(next);
      setMsg(t('customers.simulator.saved'));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (user?.role === 'CUSTOMER') {
    return <p className="pg-hint">{t('kyc.hqOnly')}</p>;
  }
  if (!kyc) return <p className="pg-hint">{t('common.loading')}</p>;

  const isHq = user?.role === 'SUPER_ADMIN';
  const canEditCustomer = user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_STAFF';

  async function saveReview() {
    if (!draftAction) {
      setMsg(t('kyc.selectActionFirst'));
      return;
    }
    if (draftAction === 'REJECT' && !reason.trim()) {
      setMsg(t('kyc.rejectReasonRequired'));
      return;
    }
    const actionLabel = t(draftAction === 'APPROVE' ? 'kyc.approve' : 'kyc.reject');
    if (!window.confirm(t('kyc.confirmSave', { action: actionLabel }))) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.kyc.reviewByUser(userId, { action: draftAction, reason, hqNote });
      setKyc(next);
      setMsg(t('kyc.reviewSaved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive() {
    if (!profile) return;
    if (!statusReason.trim()) {
      setMsg(t('users.statusReasonRequired'));
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, {
        isActive: !profile.isActive,
        statusReason: statusReason.trim(),
      });
      setProfile(next);
      setStatusReason('');
      setMsg(t('users.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('users.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pg-stack">
      <Link href="/dashboard/customers" className="pg-link text-sm">
        ← {t('nav.customers')}
      </Link>
      <p className="pg-hint">{t('kyc.hqHint')}</p>
      <div className="pg-card">
        <div className="pg-card-body space-y-2 text-sm">
          <p>
            <strong>{kyc.user?.name ?? profile?.name}</strong> ({kyc.user?.email ?? profile?.email})
          </p>
          <p>
            {kyc.user?.customerType === 'CORPORATE' ? t('auth.corporate') : t('auth.individual')}
            {kyc.user?.businessName ? ` · ${kyc.user.businessName}` : ''}
          </p>
          <p>
            {t('users.col.status')}:{' '}
            <span className={`pg-badge ${(profile?.isActive ?? kyc.user?.isActive) ? 'pg-badge-success' : 'pg-badge-muted'}`}>
              {(profile?.isActive ?? kyc.user?.isActive) ? t('users.active') : t('users.inactive')}
            </span>
          </p>
          <p>
            {t('customers.col.kyc')}:{' '}
            <span className={`pg-badge ${kycBadgeClass(kyc.status)}`}>{t(statusKey(kyc.status))}</span>
          </p>
          {profile?.customerProfile && (
            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-3 space-y-3">
              <div>
                <p className="font-medium text-slate-800">{t('customers.simulator.title')}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {t('customers.simulator.hint')}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={simEnabled}
                  disabled={loading || !canEditCustomer}
                  onChange={(e) => setSimEnabled(e.target.checked)}
                />
                <span>
                  {simEnabled ? t('customers.simulator.on') : t('customers.simulator.off')}
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-800">{t('customers.sRate.title')}</span>
                <select
                  className="pg-select h-8 w-[7.5rem] shrink-0 px-2 py-1 text-sm"
                  disabled={loading || !canEditCustomer}
                  value={simRateMode}
                  onChange={(e) => setSimRateMode(e.target.value as 'LIVE' | 'SAND')}
                  aria-label={t('customers.sRate.selectLabel')}
                >
                  <option value="LIVE">{t('customers.sRate.live')}</option>
                  <option value="SAND">{t('customers.sRate.sand')}</option>
                </select>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">{t('customers.sRate.hint')}</p>
              {canEditCustomer && (
                <button
                  type="button"
                  disabled={loading || !simDirty}
                  onClick={saveSimulatorSettings}
                  className="pg-btn pg-btn-primary disabled:opacity-50"
                >
                  {loading ? t('common.saving') : t('customers.simulator.save')}
                </button>
              )}
            </div>
          )}
          {kyc.submittedAt && (
            <p>
              {t('kyc.col.submitted')}: {formatDate(kyc.submittedAt)}
            </p>
          )}
          {kyc.rejectReason && (
            <p className="text-red-600">
              {t('kyc.rejectReason')}: {kyc.rejectReason}
            </p>
          )}
        </div>
      </div>
      <div className="pg-card">
        <div className="pg-card-head">{t('kyc.documents')}</div>
        <div className="pg-card-body space-y-2">
          {kyc.attachments.length === 0 ? (
            <p className="pg-hint">{t('kyc.empty')}</p>
          ) : (
            kyc.attachments.map((a) => (
              <div key={a.id}>
                <KycFileLink id={a.id} fileName={a.fileName} purposeLabel={t(purposeKey(a.purpose))} />
              </div>
            ))
          )}
        </div>
      </div>
      {isHq && (
        <div className="pg-card">
          <div className="pg-card-head">{t('kyc.reviewTitle')}</div>
          <div className="pg-card-body space-y-3">
            <textarea
              className="pg-input w-full"
              rows={2}
              placeholder={t('kyc.rejectReason')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <textarea
              className="pg-input w-full"
              rows={2}
              placeholder={t('kyc.hqNote')}
              value={hqNote}
              onChange={(e) => setHqNote(e.target.value)}
            />
            {msg && <p className={`text-sm ${msg === t('kyc.reviewSaved') ? 'text-green-700' : 'text-red-600'}`}>{msg}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`pg-btn ${draftAction === 'APPROVE' ? 'pg-btn-primary' : 'pg-btn-secondary'}`}
                disabled={loading}
                onClick={() => setDraftAction('APPROVE')}
              >
                {t('kyc.approve')}
              </button>
              <button
                type="button"
                className={`pg-btn ${draftAction === 'REJECT' ? 'pg-btn-primary bg-red-600 text-white' : 'pg-btn-secondary text-red-600'}`}
                disabled={loading}
                onClick={() => setDraftAction('REJECT')}
              >
                {t('kyc.reject')}
              </button>
              <button
                type="button"
                className="pg-btn pg-btn-primary"
                disabled={loading || !draftAction}
                onClick={saveReview}
              >
                {loading ? t('common.saving') : t('kyc.saveReview')}
              </button>
            </div>
            <p className="pg-hint">{t('kyc.saveReviewHint')}</p>
          </div>
        </div>
      )}
      {profile && (
        <div className="pg-card">
          <div className="pg-card-head">{t('feeShare.title')}</div>
          <div className="pg-card-body space-y-3">
            <p className="pg-hint">{t('feeShare.manageInFees')}</p>
            <Link href="/dashboard/customers/fees" className="pg-btn pg-btn-secondary text-sm">
              {t('customers.hub.fees')}
            </Link>
          </div>
        </div>
      )}
      {profile && (
        <div className="pg-card">
          <div className="pg-card-head">{t('users.col.status')}</div>
          <div className="pg-card-body space-y-3">
            <textarea
              className="pg-input w-full"
              rows={2}
              placeholder={t('users.statusReason')}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
            />
            <button type="button" className="pg-btn pg-btn-secondary" disabled={loading} onClick={toggleActive}>
              {profile.isActive ? t('users.inactive') : t('users.active')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

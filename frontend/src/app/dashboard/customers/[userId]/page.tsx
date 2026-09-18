'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useLocale, useT } from '@/context/LocaleProvider';
import {
  api,
  hqPolicyApi,
  USDT_QUOTE_AUTO_DELAY_MINUTES,
  USDT_QUOTE_MANUAL_SLA_HOURS,
  USDT_RISK_LIMIT_CODES,
  type KycCase,
  type ManagedUser,
  type UsdtQuoteResponseMode,
  type UsdtRiskLimitCode,
} from '@/lib/api';
import { KycFileLink } from '@/components/KycFileLink';
import { formatDate } from '@/lib/format';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import { InactiveReasonPresetPicker } from '@/components/InactiveReasonPresetPicker';
import {
  encodeInactivePresetReason,
  formatLoginNoticeDisplay,
  mergeInactiveNoticePresets,
  type InactiveNoticePreset,
  type InactiveNoticePresetId,
} from '@/lib/inactive-notice-presets';
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
  const { locale } = useLocale();
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const [kyc, setKyc] = useState<KycCase | null>(null);
  const [profile, setProfile] = useState<ManagedUser | null>(null);
  const [reason, setReason] = useState('');
  const [hqNote, setHqNote] = useState('');
  const [draftAction, setDraftAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusLoginNotice, setStatusLoginNotice] = useState('');
  const [statusNoticePresetId, setStatusNoticePresetId] = useState<InactiveNoticePresetId | null>(
    null,
  );
  const [inactivePresets, setInactivePresets] = useState<InactiveNoticePreset[]>(
    mergeInactiveNoticePresets(),
  );
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [simEnabled, setSimEnabled] = useState(true);
  const [simRateMode, setSimRateMode] = useState<'LIVE' | 'SAND'>('LIVE');
  const [operatorsEnabled, setOperatorsEnabled] = useState(false);
  const [walletFeesVisible, setWalletFeesVisible] = useState(false);
  const [totalFeeVisibility, setTotalFeeVisibility] = useState<'FOLLOW_HQ' | 'SHOW' | 'HIDE'>(
    'FOLLOW_HQ',
  );
  const [usdtCollectionMode, setUsdtCollectionMode] = useState<'FOLLOW_HQ' | 'FIXED' | 'VIRTUAL'>(
    'FOLLOW_HQ',
  );
  const [usdtQuoteResponseMode, setUsdtQuoteResponseMode] =
    useState<UsdtQuoteResponseMode>('FOLLOW_HQ');
  const [usdtQuoteAutoDelayMinutes, setUsdtQuoteAutoDelayMinutes] = useState<number>(0);
  const [usdtQuoteManualSlaHours, setUsdtQuoteManualSlaHours] = useState<number>(3);
  const [usdtRiskLimitCode, setUsdtRiskLimitCode] = useState<UsdtRiskLimitCode>('MR');
  const [usdtLimitMinUsdt, setUsdtLimitMinUsdt] = useState<number | null>(null);
  const [usdtLimitMaxUsdt, setUsdtLimitMaxUsdt] = useState<number | null>(null);

  const load = () => {
    api.kyc.getByUser(userId).then(setKyc).catch(console.error);
    api.users.get(userId).then(setProfile).catch(console.error);
  };

  useEffect(() => {
    load();
  }, [userId]);

  useEffect(() => {
    hqPolicyApi
      .getPlatform()
      .then((p) => setInactivePresets(mergeInactiveNoticePresets(p.config.inactiveLoginNoticePresets)))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!profile?.customerProfile) return;
    setSimEnabled(profile.customerProfile.simulatorEnabled !== false);
    setSimRateMode(profile.customerProfile.simulatorRateMode === 'SAND' ? 'SAND' : 'LIVE');
    setOperatorsEnabled(profile.customerProfile.operatorsEnabled === true);
    setWalletFeesVisible(profile.customerProfile.walletFeesVisible === true);
    setTotalFeeVisibility(
      profile.customerProfile.totalFeeVisibility === 'SHOW' ||
        profile.customerProfile.totalFeeVisibility === 'HIDE'
        ? profile.customerProfile.totalFeeVisibility
        : 'FOLLOW_HQ',
    );
    setUsdtCollectionMode(
      profile.customerProfile.usdtCollectionMode === 'FIXED' ||
        profile.customerProfile.usdtCollectionMode === 'VIRTUAL'
        ? profile.customerProfile.usdtCollectionMode
        : 'FOLLOW_HQ',
    );
    const qMode = profile.customerProfile.usdtQuoteResponseMode;
    setUsdtQuoteResponseMode(
      qMode === 'AUTO' || qMode === 'MANUAL' || qMode === 'OFF' ? qMode : 'FOLLOW_HQ',
    );
    setUsdtQuoteAutoDelayMinutes(
      typeof profile.customerProfile.usdtQuoteAutoDelayMinutes === 'number'
        ? profile.customerProfile.usdtQuoteAutoDelayMinutes
        : 0,
    );
    setUsdtQuoteManualSlaHours(
      typeof profile.customerProfile.usdtQuoteManualSlaHours === 'number'
        ? profile.customerProfile.usdtQuoteManualSlaHours
        : 3,
    );
    const limitCode = (profile.customerProfile.usdtRiskLimitCode ?? 'MR').toUpperCase();
    setUsdtRiskLimitCode(
      USDT_RISK_LIMIT_CODES.includes(limitCode as UsdtRiskLimitCode)
        ? (limitCode as UsdtRiskLimitCode)
        : 'MR',
    );
    setUsdtLimitMinUsdt(profile.customerProfile.usdtLimitMinUsdt ?? null);
    setUsdtLimitMaxUsdt(profile.customerProfile.usdtLimitMaxUsdt ?? null);
  }, [profile]);

  const simDirty =
    !!profile?.customerProfile &&
    (simEnabled !== (profile.customerProfile.simulatorEnabled !== false) ||
      simRateMode !== (profile.customerProfile.simulatorRateMode === 'SAND' ? 'SAND' : 'LIVE'));

  const opsDirty =
    !!profile?.customerProfile &&
    operatorsEnabled !== (profile.customerProfile.operatorsEnabled === true);

  const feesDirty =
    !!profile?.customerProfile &&
    walletFeesVisible !== (profile.customerProfile.walletFeesVisible === true);

  const totalFeeDirty =
    !!profile?.customerProfile &&
    totalFeeVisibility !== (profile.customerProfile.totalFeeVisibility ?? 'FOLLOW_HQ');

  const collectionDirty =
    !!profile?.customerProfile &&
    usdtCollectionMode !== (profile.customerProfile.usdtCollectionMode ?? 'FOLLOW_HQ');

  const quoteDirty =
    !!profile?.customerProfile &&
    (usdtQuoteResponseMode !== (profile.customerProfile.usdtQuoteResponseMode ?? 'FOLLOW_HQ') ||
      (usdtQuoteResponseMode === 'AUTO' &&
        usdtQuoteAutoDelayMinutes !==
          (profile.customerProfile.usdtQuoteAutoDelayMinutes ?? 0)) ||
      (usdtQuoteResponseMode === 'MANUAL' &&
        usdtQuoteManualSlaHours !== (profile.customerProfile.usdtQuoteManualSlaHours ?? 3)));

  const riskLimitDirty =
    !!profile?.customerProfile &&
    (usdtRiskLimitCode !== (profile.customerProfile.usdtRiskLimitCode ?? 'MR') ||
      (usdtRiskLimitCode === 'ML' &&
        (usdtLimitMinUsdt !== (profile.customerProfile.usdtLimitMinUsdt ?? null) ||
          usdtLimitMaxUsdt !== (profile.customerProfile.usdtLimitMaxUsdt ?? null))));

  async function saveRiskLimitSettings() {
    if (!profile) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, {
        usdtRiskLimitCode,
        usdtLimitMinUsdt: usdtRiskLimitCode === 'ML' ? usdtLimitMinUsdt : null,
        usdtLimitMaxUsdt: usdtRiskLimitCode === 'ML' ? usdtLimitMaxUsdt : null,
      });
      setProfile(next);
      setMsg(t('customers.riskLimit.saved'));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

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

  async function saveOperatorsSettings() {
    if (!profile) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, { operatorsEnabled });
      setProfile(next);
      setMsg(t('customers.operators.saved'));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function saveWalletFeesSettings() {
    if (!profile) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, { walletFeesVisible });
      setProfile(next);
      setMsg(t('customers.walletFees.saved'));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function saveTotalFeeVisibilitySettings() {
    if (!profile) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, { totalFeeVisibility });
      setProfile(next);
      setMsg(t('customers.totalFee.saved'));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function saveCollectionModeSettings() {
    if (!profile) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, { usdtCollectionMode });
      setProfile(next);
      setMsg(t('customers.collectionMode.saved'));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function saveQuoteResponseSettings() {
    if (!profile) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, {
        usdtQuoteResponseMode,
        usdtQuoteAutoDelayMinutes:
          usdtQuoteResponseMode === 'AUTO' ? usdtQuoteAutoDelayMinutes : null,
        usdtQuoteManualSlaHours:
          usdtQuoteResponseMode === 'MANUAL' ? usdtQuoteManualSlaHours : null,
      });
      setProfile(next);
      setMsg(t('customers.quoteResponse.saved'));
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
    const activating = !profile.isActive;
    const noticeForSave =
      !activating && statusNoticePresetId
        ? encodeInactivePresetReason(statusNoticePresetId)
        : statusLoginNotice.trim() || null;
    const noticeLabel = noticeForSave
      ? formatLoginNoticeDisplay(noticeForSave, locale, inactivePresets)
      : t('users.loginNoticeEmptyHint');

    requestConfirm({
      title: activating ? t('users.activateConfirmTitle') : t('users.deactivateConfirmTitle'),
      step1: activating
        ? t('users.activateConfirmStep1', { email: profile.email })
        : t('users.deactivateConfirmStep1', { email: profile.email }),
      step2: activating
        ? t('users.activateConfirmStep2', { reason: statusReason.trim() })
        : t('users.deactivateConfirmStep2Notice', {
            reason: statusReason.trim(),
            notice: noticeLabel,
          }),
      confirmLabel: activating ? t('users.active') : t('users.inactive'),
      onConfirm: async () => {
        setLoading(true);
        setMsg('');
        try {
          const next = await api.users.update(profile.id, {
            isActive: !profile.isActive,
            statusReason: statusReason.trim(),
            statusLoginNotice: activating ? null : noticeForSave,
          });
          setProfile(next);
          setStatusReason('');
          setStatusLoginNotice('');
          setStatusNoticePresetId(null);
          setMsg(t('users.saved'));
        } catch (e) {
          setMsg(e instanceof Error ? e.message : t('users.saveFailed'));
        } finally {
          setLoading(false);
        }
      },
    });
  }

  return (
    <div className="pg-stack">
      {doubleConfirmDialog}
      {msg &&
        msg !== t('customers.simulator.saved') &&
        msg !== t('customers.operators.saved') &&
        msg !== t('customers.walletFees.saved') &&
        msg !== t('customers.totalFee.saved') &&
        msg !== t('customers.collectionMode.saved') &&
        msg !== t('customers.quoteResponse.saved') &&
        msg !== t('customers.riskLimit.saved') &&
        msg !== t('kyc.reviewSaved') &&
        msg !== t('users.saved') && (
          <p className="text-xs text-red-600">{msg}</p>
        )}
      <div className="pg-card">
        <div className="pg-card-body space-y-1.5 text-xs">
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
      {profile?.customerProfile && (
        <div className="pg-card">
          <div className="pg-card-head text-xs">{t('customers.simulator.title')}</div>
          <div className="pg-card-body space-y-2 text-xs">
            <p className="text-[11px] leading-relaxed text-slate-500">{t('customers.simulator.hint')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-800">{t('customers.sRate.title')}</span>
              <select
                className="pg-select h-8 w-[7.5rem] shrink-0 px-2 py-1 text-xs"
                disabled={loading || !canEditCustomer}
                value={simRateMode}
                onChange={(e) => setSimRateMode(e.target.value as 'LIVE' | 'SAND')}
                aria-label={t('customers.sRate.selectLabel')}
              >
                <option value="LIVE">{t('customers.sRate.live')}</option>
                <option value="SAND">{t('customers.sRate.sand')}</option>
              </select>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">{t('customers.sRate.hint')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-800">{t('customers.simulator.enabledLabel')}</span>
              <select
                className="pg-select h-8 w-[7.5rem] shrink-0 px-2 py-1 text-xs"
                disabled={loading || !canEditCustomer}
                value={simEnabled ? 'on' : 'off'}
                onChange={(e) => setSimEnabled(e.target.value === 'on')}
                aria-label={t('customers.simulator.enabledLabel')}
              >
                <option value="on">{t('users.active')}</option>
                <option value="off">{t('users.inactive')}</option>
              </select>
            </div>
            {msg === t('customers.simulator.saved') && (
              <p className="text-green-700">{msg}</p>
            )}
            {canEditCustomer && (
              <button
                type="button"
                disabled={loading || !simDirty}
                onClick={saveSimulatorSettings}
                className="pg-btn pg-btn-primary text-xs disabled:opacity-50"
              >
                {loading ? t('common.saving') : t('customers.simulator.save')}
              </button>
            )}
          </div>
        </div>
      )}
      {profile?.customerProfile && (
        <div className="pg-card">
          <div className="pg-card-head text-xs">{t('customers.riskLimit.title')}</div>
          <div className="pg-card-body space-y-2 text-xs">
            <p className="text-[11px] leading-relaxed text-slate-500">
              {t('customers.riskLimit.hint')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-800">{t('customers.riskLimit.select')}</span>
              <select
                className="pg-select h-8 min-w-[12rem] shrink-0 px-2 py-1 text-xs"
                disabled={loading || !canEditCustomer}
                value={usdtRiskLimitCode}
                onChange={(e) => {
                  const code = e.target.value as UsdtRiskLimitCode;
                  setUsdtRiskLimitCode(code);
                  if (code !== 'ML') {
                    setUsdtLimitMinUsdt(null);
                    setUsdtLimitMaxUsdt(null);
                  } else {
                    setUsdtLimitMinUsdt((v) => v ?? 0);
                    setUsdtLimitMaxUsdt((v) => v ?? 0);
                  }
                }}
                aria-label={t('customers.riskLimit.select')}
              >
                {USDT_RISK_LIMIT_CODES.map((code) => (
                  <option key={code} value={code}>
                    {t(`customers.riskLimit.${code}` as MessageKey)}
                  </option>
                ))}
              </select>
            </div>
            {usdtRiskLimitCode === 'ML' && (
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="font-medium text-slate-800">{t('customers.riskLimit.minUsdt')}</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="pg-input mt-1 h-8 text-xs"
                    disabled={loading || !canEditCustomer}
                    value={usdtLimitMinUsdt ?? ''}
                    onChange={(e) =>
                      setUsdtLimitMinUsdt(e.target.value === '' ? null : Number(e.target.value))
                    }
                  />
                </label>
                <label className="block">
                  <span className="font-medium text-slate-800">{t('customers.riskLimit.maxUsdt')}</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    className="pg-input mt-1 h-8 text-xs"
                    disabled={loading || !canEditCustomer}
                    value={usdtLimitMaxUsdt ?? ''}
                    onChange={(e) =>
                      setUsdtLimitMaxUsdt(e.target.value === '' ? null : Number(e.target.value))
                    }
                  />
                </label>
              </div>
            )}
            {msg === t('customers.riskLimit.saved') && (
              <p className="text-green-700">{msg}</p>
            )}
            {canEditCustomer && (
              <button
                type="button"
                disabled={loading || !riskLimitDirty}
                onClick={() => void saveRiskLimitSettings()}
                className="pg-btn pg-btn-primary text-xs disabled:opacity-50"
              >
                {loading ? t('common.saving') : t('common.save')}
              </button>
            )}
          </div>
        </div>
      )}
      {profile?.customerProfile && (
        <div className="pg-card">
          <div className="pg-card-head text-xs">{t('customers.col.collectionMode')}</div>
          <div className="pg-card-body space-y-2 text-xs">
            <p className="text-[11px] leading-relaxed text-slate-500">
              {t('customers.collectionMode.hint')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-800">{t('customers.col.account')}</span>
              <select
                className="pg-select h-8 min-w-[10rem] shrink-0 px-2 py-1 text-xs"
                disabled={loading || !canEditCustomer}
                value={usdtCollectionMode}
                onChange={(e) =>
                  setUsdtCollectionMode(e.target.value as 'FOLLOW_HQ' | 'FIXED' | 'VIRTUAL')
                }
                aria-label={t('customers.col.collectionMode')}
              >
                <option value="FOLLOW_HQ">{t('collectionMode.FOLLOW_HQ')}</option>
                <option value="FIXED">{t('collectionMode.FIXED')}</option>
                <option value="VIRTUAL">{t('collectionMode.VIRTUAL')}</option>
              </select>
            </div>
            {msg === t('customers.collectionMode.saved') && (
              <p className="text-green-700">{msg}</p>
            )}
            {canEditCustomer && (
              <button
                type="button"
                disabled={loading || !collectionDirty}
                onClick={saveCollectionModeSettings}
                className="pg-btn pg-btn-primary text-xs disabled:opacity-50"
              >
                {loading ? t('common.saving') : t('common.save')}
              </button>
            )}
          </div>
        </div>
      )}
      {profile?.customerProfile && (
        <div className="pg-card">
          <div className="pg-card-head text-xs">{t('customers.quoteResponse.title')}</div>
          <div className="pg-card-body space-y-2 text-xs">
            <p className="text-[11px] leading-relaxed text-slate-500">
              {t('customers.quoteResponse.hint')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-800">{t('customers.quoteResponse.mode')}</span>
              <select
                className="pg-select h-8 min-w-[10rem] shrink-0 px-2 py-1 text-xs"
                disabled={loading || !canEditCustomer}
                value={usdtQuoteResponseMode}
                onChange={(e) =>
                  setUsdtQuoteResponseMode(e.target.value as UsdtQuoteResponseMode)
                }
                aria-label={t('customers.quoteResponse.mode')}
              >
                <option value="FOLLOW_HQ">{t('quoteResponse.FOLLOW_HQ')}</option>
                <option value="AUTO">{t('quoteResponse.AUTO')}</option>
                <option value="MANUAL">{t('quoteResponse.MANUAL')}</option>
                <option value="OFF">{t('quoteResponse.OFF')}</option>
              </select>
            </div>
            {usdtQuoteResponseMode === 'AUTO' && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-slate-800">
                  {t('hq.commission.quoteAutoDelay')}
                </span>
                <select
                  className="pg-select h-8 min-w-[8rem] shrink-0 px-2 py-1 text-xs"
                  disabled={loading || !canEditCustomer}
                  value={usdtQuoteAutoDelayMinutes}
                  onChange={(e) => setUsdtQuoteAutoDelayMinutes(Number(e.target.value))}
                >
                  {USDT_QUOTE_AUTO_DELAY_MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {m === 0
                        ? t('hq.commission.quoteDelayImmediate')
                        : m < 60
                          ? t('hq.commission.quoteDelayMinutes', { n: String(m) })
                          : m < 1440
                            ? t('hq.commission.quoteDelayHours', { n: String(m / 60) })
                            : t('hq.commission.quoteDelayDays', { n: String(m / 1440) })}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {usdtQuoteResponseMode === 'MANUAL' && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-slate-800">
                  {t('hq.commission.quoteManualSla')}
                </span>
                <select
                  className="pg-select h-8 min-w-[8rem] shrink-0 px-2 py-1 text-xs"
                  disabled={loading || !canEditCustomer}
                  value={usdtQuoteManualSlaHours}
                  onChange={(e) => setUsdtQuoteManualSlaHours(Number(e.target.value))}
                >
                  {USDT_QUOTE_MANUAL_SLA_HOURS.map((h) => (
                    <option key={h} value={h}>
                      {t('hq.commission.quoteDelayHours', { n: String(h) })}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {msg === t('customers.quoteResponse.saved') && (
              <p className="text-green-700">{msg}</p>
            )}
            {canEditCustomer && (
              <button
                type="button"
                disabled={loading || !quoteDirty}
                onClick={saveQuoteResponseSettings}
                className="pg-btn pg-btn-primary text-xs disabled:opacity-50"
              >
                {loading ? t('common.saving') : t('common.save')}
              </button>
            )}
          </div>
        </div>
      )}
      {profile?.customerProfile && (
        <div className="pg-card">
          <div className="pg-card-head text-xs">{t('customers.operators.enable')}</div>
          <div className="pg-card-body space-y-2 text-xs">
            <p className="text-[11px] leading-relaxed text-slate-500">{t('customers.operators.hint')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-800">{t('customers.col.multi')}</span>
              <select
                className="pg-select h-8 w-[7.5rem] shrink-0 px-2 py-1 text-xs"
                disabled={loading || !canEditCustomer}
                value={operatorsEnabled ? 'on' : 'off'}
                onChange={(e) => setOperatorsEnabled(e.target.value === 'on')}
                aria-label={t('customers.col.multi')}
              >
                <option value="on">{t('users.active')}</option>
                <option value="off">{t('users.inactive')}</option>
              </select>
            </div>
            {msg === t('customers.operators.saved') && (
              <p className="text-green-700">{msg}</p>
            )}
            {canEditCustomer && (
              <button
                type="button"
                disabled={loading || !opsDirty}
                onClick={saveOperatorsSettings}
                className="pg-btn pg-btn-primary text-xs disabled:opacity-50"
              >
                {loading ? t('common.saving') : t('customers.operators.save')}
              </button>
            )}
          </div>
        </div>
      )}
      {profile?.customerProfile && (
        <div className="pg-card">
          <div className="pg-card-head text-xs">{t('customers.walletFees.title')}</div>
          <div className="pg-card-body space-y-2 text-xs">
            <p className="text-[11px] leading-relaxed text-slate-500">{t('customers.walletFees.hint')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-800">{t('customers.walletFees.title')}</span>
              <select
                className="pg-select h-8 w-[7.5rem] shrink-0 px-2 py-1 text-xs"
                disabled={loading || !canEditCustomer}
                value={walletFeesVisible ? 'on' : 'off'}
                onChange={(e) => setWalletFeesVisible(e.target.value === 'on')}
                aria-label={t('customers.walletFees.title')}
              >
                <option value="on">{t('users.active')}</option>
                <option value="off">{t('users.inactive')}</option>
              </select>
            </div>
            {msg === t('customers.walletFees.saved') && (
              <p className="text-green-700">{msg}</p>
            )}
            {canEditCustomer && (
              <button
                type="button"
                disabled={loading || !feesDirty}
                onClick={saveWalletFeesSettings}
                className="pg-btn pg-btn-primary text-xs disabled:opacity-50"
              >
                {loading ? t('common.saving') : t('customers.walletFees.save')}
              </button>
            )}
          </div>
        </div>
      )}
      {profile?.customerProfile && (
        <div className="pg-card">
          <div className="pg-card-head text-xs">{t('customers.totalFee.title')}</div>
          <div className="pg-card-body space-y-2 text-xs">
            <p className="text-[11px] leading-relaxed text-slate-500">{t('customers.totalFee.hint')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-800">{t('customers.totalFee.title')}</span>
              <select
                className="pg-select h-8 min-w-[9rem] shrink-0 px-2 py-1 text-xs"
                disabled={loading || !canEditCustomer}
                value={totalFeeVisibility}
                onChange={(e) =>
                  setTotalFeeVisibility(e.target.value as 'FOLLOW_HQ' | 'SHOW' | 'HIDE')
                }
                aria-label={t('customers.totalFee.title')}
              >
                <option value="FOLLOW_HQ">{t('totalFee.FOLLOW_HQ')}</option>
                <option value="SHOW">{t('totalFee.SHOW')}</option>
                <option value="HIDE">{t('totalFee.HIDE')}</option>
              </select>
            </div>
            {msg === t('customers.totalFee.saved') && (
              <p className="text-green-700">{msg}</p>
            )}
            {canEditCustomer && (
              <button
                type="button"
                disabled={loading || !totalFeeDirty}
                onClick={saveTotalFeeVisibilitySettings}
                className="pg-btn pg-btn-primary text-xs disabled:opacity-50"
              >
                {loading ? t('common.saving') : t('customers.totalFee.save')}
              </button>
            )}
          </div>
        </div>
      )}
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
          <div className="pg-card-head">{t('nav.wallets')}</div>
          <div className="pg-card-body space-y-3">
            {(profile.wallets ?? []).length === 0 ? (
              <p className="pg-hint">{t('wallets.empty')}</p>
            ) : (
              (profile.wallets ?? []).map((w) => (
                <div key={w.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
                  <div>
                    <p className="font-mono text-xs">{w.address}</p>
                    <p className="pg-muted text-xs">
                      {w.network}
                      {w.isDefault ? ` · ${t('wallets.default')}` : ''}
                      {w.hqRegistered ? ` · ${t('wallets.hqRegistered')}` : ''}
                      {w.approvalStatus ? ` · ${t(`wallets.${w.approvalStatus === 'PENDING' ? 'pending' : w.approvalStatus === 'REJECTED' ? 'rejected' : 'approved'}`)}` : ''}
                    </p>
                  </div>
                  {isHq && w.approvalStatus === 'PENDING' && !w.hqRegistered ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="pg-btn pg-btn-primary text-[11px]"
                        disabled={loading}
                        onClick={async () => {
                          setLoading(true);
                          setMsg('');
                          try {
                            await api.users.reviewWallet(profile.id, w.id, 'APPROVED');
                            load();
                            setMsg(t('wallets.approved'));
                          } catch (e) {
                            setMsg(e instanceof Error ? e.message : t('common.saveFailed'));
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        {t('kyc.approve')}
                      </button>
                      <button
                        type="button"
                        className="pg-btn pg-btn-secondary text-[11px] text-red-600"
                        disabled={loading}
                        onClick={async () => {
                          setLoading(true);
                          setMsg('');
                          try {
                            await api.users.reviewWallet(profile.id, w.id, 'REJECTED');
                            load();
                            setMsg(t('wallets.rejected'));
                          } catch (e) {
                            setMsg(e instanceof Error ? e.message : t('common.saveFailed'));
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        {t('kyc.reject')}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {profile && (
        <div className="pg-card">
          <div className="pg-card-head">{t('users.col.status')}</div>
          <div className="pg-card-body space-y-3">
            <label className="block space-y-1">
              <span className="pg-label text-xs">
                {t('users.statusReason')}
                <span className="text-rose-600"> *</span>
              </span>
              <p className="pg-hint text-[11px]">{t('users.statusReasonInternalHint')}</p>
              <textarea
                className="pg-input w-full"
                rows={2}
                placeholder={t('users.statusReasonInternalPlaceholder')}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </label>
            {profile.isActive && (
              <label className="block space-y-1">
                <span className="pg-label text-xs">{t('users.loginNotice')}</span>
                <p className="pg-hint text-[11px]">{t('users.loginNoticeHint')}</p>
                <InactiveReasonPresetPicker
                  presets={inactivePresets}
                  locale={locale}
                  selectedId={statusNoticePresetId}
                  onSelect={(p) => {
                    setStatusNoticePresetId(p.id);
                    setStatusLoginNotice(p.bodyI18n[locale] || p.bodyI18n.KR);
                  }}
                />
                <textarea
                  className="pg-input mt-2 w-full"
                  rows={3}
                  placeholder={t('users.loginNoticePlaceholder')}
                  value={statusLoginNotice}
                  onChange={(e) => {
                    setStatusLoginNotice(e.target.value);
                    setStatusNoticePresetId(null);
                  }}
                />
              </label>
            )}
            <button type="button" className="pg-btn pg-btn-secondary" disabled={loading} onClick={toggleActive}>
              {profile.isActive ? t('users.inactive') : t('users.active')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

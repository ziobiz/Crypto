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
  type MemberGrade,
  type TradeReceiptEmailMode,
  type TradeReceiptUiMode,
  type UsdtPayMethodAccess,
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
import { CustomerWalletQrCard } from '@/components/ScheduleDelayPanel';
import {
  MemberGradeCard,
  MemberGradeChip,
  normalizeMemberGradeUi,
} from '@/components/MemberGradeCard';
import { LIMIT_COUNTRIES, type LimitCountryCode } from '@/constants/limit-countries';

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
  const [usdtCollectionMode, setUsdtCollectionMode] = useState<
    'FOLLOW_HQ' | 'FIXED' | 'VIRTUAL' | 'DIRECT'
  >('FOLLOW_HQ');
  const [usdtPayBankMode, setUsdtPayBankMode] = useState<UsdtPayMethodAccess>('FOLLOW_HQ');
  const [usdtPayRemittanceMode, setUsdtPayRemittanceMode] =
    useState<UsdtPayMethodAccess>('FOLLOW_HQ');
  const [usdtPayCardMode, setUsdtPayCardMode] = useState<UsdtPayMethodAccess>('FOLLOW_HQ');
  const [usdtQuoteResponseMode, setUsdtQuoteResponseMode] =
    useState<UsdtQuoteResponseMode>('FOLLOW_HQ');
  const [tradeReceiptEmailMode, setTradeReceiptEmailMode] =
    useState<TradeReceiptEmailMode>('FOLLOW_HQ');
  const [tradeReceiptAdminUiMode, setTradeReceiptAdminUiMode] =
    useState<TradeReceiptUiMode>('FOLLOW_HQ');
  const [tradeReceiptMerchantUiMode, setTradeReceiptMerchantUiMode] =
    useState<TradeReceiptUiMode>('FOLLOW_HQ');
  const [usdtQuoteAutoDelayMinutes, setUsdtQuoteAutoDelayMinutes] = useState<number>(0);
  const [usdtQuoteManualSlaHours, setUsdtQuoteManualSlaHours] = useState<number>(3);
  const [usdtRiskLimitCode, setUsdtRiskLimitCode] = useState<UsdtRiskLimitCode>('MR');
  const [usdtLimitMinUsdt, setUsdtLimitMinUsdt] = useState<number | null>(null);
  const [usdtLimitMaxUsdt, setUsdtLimitMaxUsdt] = useState<number | null>(null);
  const [limitCountry, setLimitCountry] = useState<LimitCountryCode | ''>('');
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'CORPORATE'>('INDIVIDUAL');
  const [memberGrade, setMemberGrade] = useState<MemberGrade>('STANDARD');
  const [legalFirstName, setLegalFirstName] = useState('');
  const [legalLastName, setLegalLastName] = useState('');

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
    if (!profile) return;
    setLegalFirstName(profile.legalFirstName ?? '');
    setLegalLastName(profile.legalLastName ?? '');
  }, [profile?.id, profile?.legalFirstName, profile?.legalLastName]);

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
        profile.customerProfile.usdtCollectionMode === 'VIRTUAL' ||
        profile.customerProfile.usdtCollectionMode === 'DIRECT'
        ? profile.customerProfile.usdtCollectionMode
        : 'FOLLOW_HQ',
    );
    setUsdtPayBankMode(
      profile.customerProfile.usdtPayBankMode === 'ENABLED' ||
        profile.customerProfile.usdtPayBankMode === 'DISABLED'
        ? profile.customerProfile.usdtPayBankMode
        : 'FOLLOW_HQ',
    );
    setUsdtPayRemittanceMode(
      profile.customerProfile.usdtPayRemittanceMode === 'ENABLED' ||
        profile.customerProfile.usdtPayRemittanceMode === 'DISABLED'
        ? profile.customerProfile.usdtPayRemittanceMode
        : 'FOLLOW_HQ',
    );
    setUsdtPayCardMode(
      profile.customerProfile.usdtPayCardMode === 'ENABLED' ||
        profile.customerProfile.usdtPayCardMode === 'DISABLED'
        ? profile.customerProfile.usdtPayCardMode
        : 'FOLLOW_HQ',
    );
    const qMode = profile.customerProfile.usdtQuoteResponseMode;
    setUsdtQuoteResponseMode(
      qMode === 'AUTO' || qMode === 'MANUAL' || qMode === 'OFF' ? qMode : 'FOLLOW_HQ',
    );
    const receiptMode = profile.customerProfile.tradeReceiptEmailMode;
    setTradeReceiptEmailMode(
      receiptMode === 'ENABLED' ||
        receiptMode === 'DISABLED' ||
        receiptMode === 'HQ_ONLY' ||
        receiptMode === 'FOLLOW_HQ'
        ? receiptMode
        : 'FOLLOW_HQ',
    );
    const adminUi = profile.customerProfile.tradeReceiptAdminUiMode;
    setTradeReceiptAdminUiMode(
      adminUi === 'ENABLED' || adminUi === 'DISABLED' || adminUi === 'FOLLOW_HQ'
        ? adminUi
        : 'FOLLOW_HQ',
    );
    const merchantUi = profile.customerProfile.tradeReceiptMerchantUiMode;
    setTradeReceiptMerchantUiMode(
      merchantUi === 'ENABLED' || merchantUi === 'DISABLED' || merchantUi === 'FOLLOW_HQ'
        ? merchantUi
        : 'FOLLOW_HQ',
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
    const lc = String(profile.customerProfile.limitCountry ?? '').toUpperCase();
    setLimitCountry(
      LIMIT_COUNTRIES.some((c) => c.code === lc) ? (lc as LimitCountryCode) : '',
    );
    setCustomerType(
      profile.customerProfile.customerType === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL',
    );
    setMemberGrade(normalizeMemberGradeUi(profile.customerProfile.memberGrade));
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

  const payMethodsDirty =
    !!profile?.customerProfile &&
    (usdtPayBankMode !== (profile.customerProfile.usdtPayBankMode ?? 'FOLLOW_HQ') ||
      usdtPayRemittanceMode !== (profile.customerProfile.usdtPayRemittanceMode ?? 'FOLLOW_HQ') ||
      usdtPayCardMode !== (profile.customerProfile.usdtPayCardMode ?? 'FOLLOW_HQ'));

  const quoteDirty =
    !!profile?.customerProfile &&
    (usdtQuoteResponseMode !== (profile.customerProfile.usdtQuoteResponseMode ?? 'FOLLOW_HQ') ||
      (usdtQuoteResponseMode === 'AUTO' &&
        usdtQuoteAutoDelayMinutes !==
          (profile.customerProfile.usdtQuoteAutoDelayMinutes ?? 0)) ||
      (usdtQuoteResponseMode === 'MANUAL' &&
        usdtQuoteManualSlaHours !== (profile.customerProfile.usdtQuoteManualSlaHours ?? 3)));

  const receiptDirty =
    !!profile?.customerProfile &&
    (tradeReceiptEmailMode !== (profile.customerProfile.tradeReceiptEmailMode ?? 'FOLLOW_HQ') ||
      tradeReceiptAdminUiMode !==
        (profile.customerProfile.tradeReceiptAdminUiMode ?? 'FOLLOW_HQ') ||
      tradeReceiptMerchantUiMode !==
        (profile.customerProfile.tradeReceiptMerchantUiMode ?? 'FOLLOW_HQ'));

  const riskLimitDirty =
    !!profile?.customerProfile &&
    (usdtRiskLimitCode !== (profile.customerProfile.usdtRiskLimitCode ?? 'MR') ||
      (usdtRiskLimitCode === 'ML' &&
        (usdtLimitMinUsdt !== (profile.customerProfile.usdtLimitMinUsdt ?? null) ||
          usdtLimitMaxUsdt !== (profile.customerProfile.usdtLimitMaxUsdt ?? null))) ||
      (limitCountry || null) !== (profile.customerProfile.limitCountry ?? null));

  const customerTypeDirty =
    !!profile?.customerProfile &&
    customerType !==
      (profile.customerProfile.customerType === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL');

  const memberGradeDirty =
    !!profile?.customerProfile &&
    memberGrade !== normalizeMemberGradeUi(profile.customerProfile.memberGrade);

  async function saveCustomerTypeSettings() {
    if (!profile) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, { customerType });
      setProfile(next);
      setMsg(t('customers.customerType.saved'));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function saveMemberGradeSettings() {
    if (!profile) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, { memberGrade });
      setProfile(next);
      setMsg(t('memberGrade.customer.saved'));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function saveRiskLimitSettings() {
    if (!profile) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, {
        usdtRiskLimitCode,
        usdtLimitMinUsdt: usdtRiskLimitCode === 'ML' ? usdtLimitMinUsdt : null,
        usdtLimitMaxUsdt: usdtRiskLimitCode === 'ML' ? usdtLimitMaxUsdt : null,
        limitCountry: limitCountry || null,
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

  async function savePayMethodSettings() {
    if (!profile) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, {
        usdtPayBankMode,
        usdtPayRemittanceMode,
        usdtPayCardMode,
      });
      setProfile(next);
      setMsg(t('customers.payMethods.saved'));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function saveReceiptEmailSettings() {
    if (!profile) return;
    setLoading(true);
    setMsg('');
    try {
      const next = await api.users.update(profile.id, {
        tradeReceiptEmailMode,
        tradeReceiptAdminUiMode,
        tradeReceiptMerchantUiMode,
      });
      setProfile(next);
      setMsg(t('customers.receiptEmail.saved'));
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
  const canReviewRegistration =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ORG_STAFF' ||
    user?.role === 'ORGANIZER' ||
    user?.role === 'SETTLEMENT_ADMIN';

  const reviewRegistration = async (status: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    setMsg('');
    try {
      const updated = await api.users.reviewCustomerApproval(userId, status);
      setProfile(updated);
      setMsg(t('customers.approval.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('users.loadError'));
    } finally {
      setLoading(false);
    }
  };

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
        msg !== t('customers.payMethods.saved') &&
        msg !== t('customers.quoteResponse.saved') &&
        msg !== t('customers.riskLimit.saved') &&
        msg !== t('memberGrade.customer.saved') &&
        msg !== t('customers.customerType.saved') &&
        msg !== t('customers.approval.saved') &&
        msg !== t('customers.legalName.saved') &&
        msg !== t('kyc.reviewSaved') &&
        msg !== t('users.saved') && (
          <p className="text-xs text-red-600">{msg}</p>
        )}
      {msg === t('memberGrade.customer.saved') && (
        <p className="text-xs text-emerald-700">{msg}</p>
      )}
      {msg === t('customers.customerType.saved') && (
        <p className="text-xs text-emerald-700">{msg}</p>
      )}
      {msg === t('customers.approval.saved') && (
        <p className="text-xs text-emerald-700">{msg}</p>
      )}
      {msg === t('customers.legalName.saved') && (
        <p className="text-xs text-emerald-700">{msg}</p>
      )}
      <div className="pg-card">
        <div className="pg-card-body space-y-1.5 text-xs">
          <p>
            <strong>{kyc.user?.name ?? profile?.name}</strong> ({kyc.user?.email ?? profile?.email})
          </p>
          {profile && (
            <div className="mt-2 rounded border border-amber-200 bg-amber-50/70 p-2 space-y-2">
              <p className="font-medium text-amber-950">{t('customers.legalName.title')}</p>
              <p className="text-[11px] text-amber-900/90">{t('customers.legalName.hint')}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] text-slate-600">{t('auth.legalFirstName')}</span>
                  <input
                    className="pg-input mt-0.5 w-full"
                    value={legalFirstName}
                    onChange={(e) =>
                      setLegalFirstName(e.target.value.replace(/[^A-Za-z .'-]/g, ''))
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-slate-600">{t('auth.legalLastName')}</span>
                  <input
                    className="pg-input mt-0.5 w-full"
                    value={legalLastName}
                    onChange={(e) =>
                      setLegalLastName(e.target.value.replace(/[^A-Za-z .'-]/g, ''))
                    }
                  />
                </label>
              </div>
              <button
                type="button"
                className="pg-btn pg-btn-secondary text-xs"
                disabled={loading}
                onClick={async () => {
                  if (!profile) return;
                  setLoading(true);
                  setMsg('');
                  try {
                    const next = await api.users.update(profile.id, {
                      legalFirstName: legalFirstName.trim() || null,
                      legalLastName: legalLastName.trim() || null,
                    });
                    setProfile(next);
                    setMsg(t('customers.legalName.saved'));
                  } catch (e) {
                    setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {t('customers.legalName.save')}
              </button>
            </div>
          )}
          <p>
            {(profile?.customerProfile?.customerType ?? kyc.user?.customerType) === 'CORPORATE'
              ? t('auth.corporate')
              : t('auth.individual')}
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
          <p>
            {t('customers.col.approval')}:{' '}
            <span
              className={`pg-badge ${
                profile?.customerProfile?.approvalStatus === 'REJECTED'
                  ? 'pg-badge-muted'
                  : profile?.customerProfile?.approvalStatus === 'PENDING'
                    ? 'pg-badge-warn'
                    : 'pg-badge-success'
              }`}
            >
              {t(
                `customers.approval.${
                  profile?.customerProfile?.approvalStatus === 'PENDING' ||
                  profile?.customerProfile?.approvalStatus === 'REJECTED'
                    ? profile.customerProfile.approvalStatus
                    : 'APPROVED'
                }` as MessageKey,
              )}
            </span>
          </p>
          {profile?.customerProfile && (
            <p className="flex flex-wrap items-center gap-2">
              <span>{t('memberGrade.customer.title')}:</span>
              <MemberGradeChip grade={profile.customerProfile.memberGrade} />
            </p>
          )}
          <p className="text-[11px] text-slate-500">{t('customers.approval.hint')}</p>
          {canReviewRegistration && profile?.customerProfile && (
            <div className="flex flex-wrap gap-2 pt-1">
              {profile.customerProfile.approvalStatus !== 'APPROVED' && (
                <button
                  type="button"
                  className="pg-btn pg-btn-primary"
                  disabled={loading}
                  onClick={() => void reviewRegistration('APPROVED')}
                >
                  {t('customers.approval.approve')}
                </button>
              )}
              {profile.customerProfile.approvalStatus !== 'REJECTED' && (
                <button
                  type="button"
                  className="pg-btn pg-btn-secondary"
                  disabled={loading}
                  onClick={() => void reviewRegistration('REJECTED')}
                >
                  {t('customers.approval.reject')}
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
      {profile?.introducerSettlement && user?.role !== 'CUSTOMER_OPERATOR' && (
          <div className="pg-card">
            <div className="pg-card-head text-xs">{t('customers.introducer.title')}</div>
            <div className="pg-card-body space-y-2 text-xs">
              <p>
                {t('customers.introducer.merchant')}:{' '}
                <strong>{profile.introducerSettlement.introducerName}</strong>
                <span className="text-slate-500"> · {profile.introducerSettlement.introducerEmail}</span>
              </p>
              {profile.introducerSettlement.enabled ? (
                <>
                  <p className="text-slate-600">
                    {t('customers.introducer.formula', {
                      percent: profile.introducerSettlement.percent,
                      fixed: profile.introducerSettlement.fixedUsdt,
                    })}
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    {t('customers.introducer.note')}
                  </p>
                  {profile.introducerSettlement.lines.length === 0 ? (
                    <p className="text-slate-500">{t('customers.introducer.empty')}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-500">
                            <th className="py-1 pr-3 font-medium">{t('customers.introducer.col.ticket')}</th>
                            <th className="py-1 pr-3 font-medium">{t('customers.introducer.col.amount')}</th>
                            <th className="py-1 font-medium">{t('customers.introducer.col.reward')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profile.introducerSettlement.lines.map((line) => (
                            <tr key={line.ticketNo} className="border-t border-slate-100">
                              <td className="py-1 pr-3">{line.ticketNo}</td>
                              <td className="py-1 pr-3">{line.usdtAmount} USDT</td>
                              <td className="py-1">
                                {line.usdtAmount} × {profile.introducerSettlement?.percent}% +{' '}
                                {profile.introducerSettlement?.fixedUsdt} = {line.rewardUsdt} USDT
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p>
                    {t('customers.introducer.total')}:{' '}
                    <strong>{profile.introducerSettlement.totalRewardUsdt} USDT</strong>
                  </p>
                </>
              ) : (
                <p className="text-slate-500">{t('customers.introducer.policyOff')}</p>
              )}
            </div>
          </div>
        )}
      {profile?.customerProfile && (
        <div className="pg-card">
          <div className="pg-card-head text-xs">{t('auth.customerType')}</div>
          <div className="pg-card-body space-y-2 text-xs">
            <p className="text-[11px] leading-relaxed text-slate-500">
              {t('customers.customerType.hint')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-800">{t('auth.customerType')}</span>
              <select
                className="pg-select h-8 min-w-[10rem] shrink-0 px-2 py-1 text-xs"
                disabled={loading || !canEditCustomer}
                value={customerType}
                onChange={(e) =>
                  setCustomerType(e.target.value as 'INDIVIDUAL' | 'CORPORATE')
                }
                aria-label={t('auth.customerType')}
              >
                <option value="INDIVIDUAL">{t('auth.individual')}</option>
                <option value="CORPORATE">{t('auth.corporate')}</option>
              </select>
            </div>
            {canEditCustomer && (
              <button
                type="button"
                className="pg-btn pg-btn-primary"
                disabled={loading || !customerTypeDirty}
                onClick={() => void saveCustomerTypeSettings()}
              >
                {t('customers.customerType.save')}
              </button>
            )}
            {msg === t('customers.customerType.saved') && (
              <p className="text-emerald-700">{msg}</p>
            )}
          </div>
        </div>
      )}
      {profile?.customerProfile && (
        <div className="pg-card">
          <div className="pg-card-head text-xs">{t('memberGrade.customer.title')}</div>
          <div className="pg-card-body space-y-2 text-xs">
            <MemberGradeCard
              value={memberGrade}
              onChange={setMemberGrade}
              disabled={loading || !canEditCustomer}
            />
            {canEditCustomer && (
              <button
                type="button"
                className="pg-btn pg-btn-primary"
                disabled={loading || !memberGradeDirty}
                onClick={() => void saveMemberGradeSettings()}
              >
                {t('memberGrade.customer.save')}
              </button>
            )}
            {msg === t('memberGrade.customer.saved') && (
              <p className="text-emerald-700">{msg}</p>
            )}
          </div>
        </div>
      )}
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
            {profile.customerProfile.customerType !== 'CORPORATE' && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-slate-800">{t('auth.limitCountry')}</span>
                <select
                  className="pg-select h-8 min-w-[12rem] shrink-0 px-2 py-1 text-xs"
                  disabled={loading || !canEditCustomer}
                  value={limitCountry}
                  onChange={(e) => setLimitCountry(e.target.value as LimitCountryCode | '')}
                  aria-label={t('auth.limitCountry')}
                >
                  <option value="">{t('auth.limitCountryAuto')}</option>
                  {LIMIT_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {t(`auth.limitCountry.${c.code}` as MessageKey)}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500">{t('auth.limitCountryHint')}</span>
              </div>
            )}
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
                  setUsdtCollectionMode(
                    e.target.value as 'FOLLOW_HQ' | 'FIXED' | 'VIRTUAL' | 'DIRECT',
                  )
                }
                aria-label={t('customers.col.collectionMode')}
              >
                <option value="FOLLOW_HQ">{t('collectionMode.FOLLOW_HQ')}</option>
                <option value="FIXED">{t('collectionMode.FIXED')}</option>
                <option value="DIRECT">{t('collectionMode.DIRECT')}</option>
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
          <div className="pg-card-head text-xs">{t('customers.payMethods.title')}</div>
          <div className="pg-card-body space-y-2 text-xs">
            <p className="text-[11px] leading-relaxed text-slate-500">
              {t('customers.payMethods.hint')}
            </p>
            {(
              [
                ['bank', usdtPayBankMode, setUsdtPayBankMode] as const,
                ['remittance', usdtPayRemittanceMode, setUsdtPayRemittanceMode] as const,
                ['card', usdtPayCardMode, setUsdtPayCardMode] as const,
              ] as const
            ).map(([key, value, setter]) => (
              <div key={key} className="flex flex-wrap items-center gap-3">
                <span className="min-w-[5.5rem] font-medium text-slate-800">
                  {t(`customers.payMethods.${key}` as MessageKey)}
                </span>
                <select
                  className="pg-select h-8 min-w-[10rem] shrink-0 px-2 py-1 text-xs"
                  disabled={loading || !canEditCustomer}
                  value={value}
                  onChange={(e) => setter(e.target.value as UsdtPayMethodAccess)}
                  aria-label={t(`customers.payMethods.${key}` as MessageKey)}
                >
                  <option value="FOLLOW_HQ">{t('customers.payMethods.FOLLOW_HQ')}</option>
                  <option value="ENABLED">{t('customers.payMethods.ENABLED')}</option>
                  <option value="DISABLED">{t('customers.payMethods.DISABLED')}</option>
                </select>
              </div>
            ))}
            {msg === t('customers.payMethods.saved') && (
              <p className="text-green-700">{msg}</p>
            )}
            {canEditCustomer && (
              <button
                type="button"
                disabled={loading || !payMethodsDirty}
                onClick={() => void savePayMethodSettings()}
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
          <div className="pg-card-head text-xs">{t('customers.receiptEmail.title')}</div>
          <div className="pg-card-body space-y-2 text-xs">
            <p className="text-[11px] leading-relaxed text-slate-500">
              {t('customers.receiptEmail.hint')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-800">{t('customers.receiptEmail.mode')}</span>
              <select
                className="pg-select h-8 min-w-[10rem] shrink-0 px-2 py-1 text-xs"
                disabled={loading || !canEditCustomer}
                value={tradeReceiptEmailMode}
                onChange={(e) =>
                  setTradeReceiptEmailMode(e.target.value as TradeReceiptEmailMode)
                }
                aria-label={t('customers.receiptEmail.mode')}
              >
                <option value="FOLLOW_HQ">{t('receiptEmail.FOLLOW_HQ')}</option>
                <option value="ENABLED">{t('receiptEmail.ENABLED')}</option>
                <option value="DISABLED">{t('receiptEmail.DISABLED')}</option>
                <option value="HQ_ONLY">{t('receiptEmail.HQ_ONLY')}</option>
              </select>
            </div>
            {(tradeReceiptEmailMode === 'ENABLED' || tradeReceiptEmailMode === 'HQ_ONLY') && (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium text-slate-800">
                    {t('customers.receiptEmail.adminUi')}
                  </span>
                  <select
                    className="pg-select h-8 min-w-[8rem] shrink-0 px-2 py-1 text-xs"
                    disabled={loading || !canEditCustomer}
                    value={tradeReceiptAdminUiMode}
                    onChange={(e) =>
                      setTradeReceiptAdminUiMode(e.target.value as TradeReceiptUiMode)
                    }
                  >
                    <option value="FOLLOW_HQ">{t('receiptUi.FOLLOW_HQ')}</option>
                    <option value="ENABLED">{t('receiptUi.ENABLED')}</option>
                    <option value="DISABLED">{t('receiptUi.DISABLED')}</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium text-slate-800">
                    {t('customers.receiptEmail.merchantUi')}
                  </span>
                  <select
                    className="pg-select h-8 min-w-[8rem] shrink-0 px-2 py-1 text-xs"
                    disabled={loading || !canEditCustomer}
                    value={tradeReceiptMerchantUiMode}
                    onChange={(e) =>
                      setTradeReceiptMerchantUiMode(e.target.value as TradeReceiptUiMode)
                    }
                  >
                    <option value="FOLLOW_HQ">{t('receiptUi.FOLLOW_HQ')}</option>
                    <option value="ENABLED">{t('receiptUi.ENABLED')}</option>
                    <option value="DISABLED">{t('receiptUi.DISABLED')}</option>
                  </select>
                </div>
              </div>
            )}
            {msg === t('customers.receiptEmail.saved') && (
              <p className="text-green-700">{msg}</p>
            )}
            {canEditCustomer && (
              <button
                type="button"
                disabled={loading || !receiptDirty}
                onClick={() => void saveReceiptEmailSettings()}
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
                <div key={w.id} className="space-y-2 border-b border-slate-100 pb-3 last:border-0">
                  <CustomerWalletQrCard
                    address={w.address}
                    network={w.network}
                    nickname={w.label}
                    meta={[
                      w.isDefault ? t('wallets.default') : '',
                      w.hqRegistered ? t('wallets.hqRegistered') : '',
                      w.deleteRequestedAt ? t('wallets.deleteRequested') : '',
                      w.approvalStatus
                        ? t(
                            `wallets.${w.approvalStatus === 'PENDING' ? 'pending' : w.approvalStatus === 'REJECTED' ? 'rejected' : 'approved'}`,
                          )
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  />
                  {isHq && w.approvalStatus === 'PENDING' ? (
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
                        {t('wallets.approveAction')}
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
                  {isHq && w.deleteRequestedAt ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="pg-btn pg-btn-primary text-[11px]"
                        disabled={loading}
                        onClick={() =>
                          requestConfirm({
                            title: t('wallets.hqDeleteTitle'),
                            step1: t('wallets.hqDelete1', { address: w.address }),
                            step2: t('wallets.hqDelete2'),
                            confirmLabel: t('wallets.deleteApprove'),
                            onConfirm: async () => {
                              setLoading(true);
                              setMsg('');
                              try {
                                await api.users.reviewWalletDeletion(profile.id, w.id, 'APPROVED');
                                load();
                                setMsg(t('wallets.deleted'));
                              } catch (e) {
                                setMsg(e instanceof Error ? e.message : t('common.saveFailed'));
                              } finally {
                                setLoading(false);
                              }
                            },
                          })
                        }
                      >
                        {t('wallets.deleteApprove')}
                      </button>
                      <button
                        type="button"
                        className="pg-btn pg-btn-secondary text-[11px]"
                        disabled={loading}
                        onClick={async () => {
                          setLoading(true);
                          setMsg('');
                          try {
                            await api.users.reviewWalletDeletion(profile.id, w.id, 'REJECTED');
                            load();
                            setMsg(t('wallets.deleteRejected'));
                          } catch (e) {
                            setMsg(e instanceof Error ? e.message : t('common.saveFailed'));
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        {t('wallets.deleteReject')}
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

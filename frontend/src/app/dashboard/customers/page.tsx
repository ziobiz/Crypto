'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useLocale, useT } from '@/context/LocaleProvider';
import {
  api,
  customerFeesApi,
  hqPolicyApi,
  USDT_RISK_LIMIT_CODES,
  type CreateUserInput,
  type FeeTypeTemplate,
  type ManagedUser,
  type Organization,
  type UpdateUserInput,
  type UsdtRiskLimitCode,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { WALLET_NETWORKS } from '@/constants/wallet-networks';
import { ReferenceClocks } from '@/components/ReferenceClocks';
import { SRateBadge } from '@/components/SRateBadge';
import { detailRowProps } from '@/lib/table-row-detail';
import { localizeFeeTypeLabel } from '@/lib/fee-type-label';
import { formatDateDot } from '@/lib/format';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import { InactiveReasonPresetPicker } from '@/components/InactiveReasonPresetPicker';
import {
  encodeInactivePresetReason,
  formatLoginNoticeDisplay,
  mergeInactiveNoticePresets,
  type InactiveNoticePreset,
  type InactiveNoticePresetId,
} from '@/lib/inactive-notice-presets';

const CUSTOMER_REGISTER_ORG_TYPES = ['HEAD_OFFICE', 'MASTER_DISTRIBUTOR'] as const;

const emptyCreate: CreateUserInput = {
  email: '',
  password: '',
  name: '',
  phone: '',
  role: 'CUSTOMER',
  reason: '',
  recruitingOrgId: '',
  customerType: 'INDIVIDUAL',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  walletAddress: '',
  walletNetwork: 'TRC20',
  walletLabel: '',
  simulatorEnabled: true,
  simulatorRateMode: 'LIVE',
  usdtFeeTypeCode: '',
  tradeFeeTypeCode: '',
  feeBillingMethod: 'FOLLOW_HQ',
  totalFeeVisibility: 'FOLLOW_HQ',
  usdtCollectionMode: 'FOLLOW_HQ',
  usdtQuoteResponseMode: 'FOLLOW_HQ',
  operatorsEnabled: false,
  usdtRiskLimitCode: 'MR',
  usdtLimitMinUsdt: null,
  usdtLimitMaxUsdt: null,
};

function riskLimitLabelKey(code: string | undefined | null): MessageKey {
  const normalized = (code ?? 'MR').toUpperCase();
  if (USDT_RISK_LIMIT_CODES.includes(normalized as UsdtRiskLimitCode)) {
    return `customers.riskLimit.${normalized}` as MessageKey;
  }
  return 'customers.riskLimit.MR';
}

function listLimitDisplay(code: string | undefined | null): string {
  const normalized = (code ?? 'MR').toUpperCase();
  if (normalized === 'ML') return 'ML';
  if (['LR', 'MR', 'HR', 'XR', 'SR'].includes(normalized)) return normalized;
  return 'MR';
}

function kycBadgeClass(status?: string | null): string {
  if (status === 'APPROVED') return 'pg-badge-kyc-pass';
  if (status === 'PENDING') return 'pg-badge-warn';
  if (status === 'REJECTED') return 'pg-badge-muted';
  return 'pg-badge-info';
}

function kycStatusKey(status?: string | null): MessageKey {
  if (status === 'PENDING') return 'kyc.status.PENDING';
  if (status === 'APPROVED') return 'kyc.status.APPROVED';
  if (status === 'REJECTED') return 'kyc.status.REJECTED';
  return 'kyc.status.NOT_SUBMITTED';
}

function effectiveFeeTypeLabel(
  policies:
    | Array<{
        ticketKind: string;
        feeTypeCode: string;
        feeTypeName: string | null;
        applyStartDate: string;
      }>
    | undefined
    | null,
  ticketKind: 'USDT_PURCHASE' | 'TRADE_ESCROW',
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
): string | null {
  if (!policies?.length) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const p of policies) {
    if (p.ticketKind !== ticketKind) continue;
    const start = new Date(p.applyStartDate);
    if (Number.isNaN(start.getTime()) || start > today) continue;
    const label = localizeFeeTypeLabel(p.feeTypeCode, p.feeTypeName, t);
    return label === '—' ? null : label;
  }
  return null;
}

export default function CustomersPage() {
  const { user: me } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const router = useRouter();
  const isSuperAdmin = me?.role === 'SUPER_ADMIN';
  const canRegisterCustomer =
    isSuperAdmin ||
    CUSTOMER_REGISTER_ORG_TYPES.includes(
      (me?.organization?.type ?? '') as (typeof CUSTOMER_REGISTER_ORG_TYPES)[number],
    );

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [kycFilter, setKycFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserInput>({});
  const [newPassword, setNewPassword] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusLoginNotice, setStatusLoginNotice] = useState('');
  const [statusNoticePresetId, setStatusNoticePresetId] = useState<InactiveNoticePresetId | null>(
    null,
  );
  const [inactivePresets, setInactivePresets] = useState<InactiveNoticePreset[]>(
    mergeInactiveNoticePresets(),
  );
  const [initialIsActive, setInitialIsActive] = useState(true);
  const [form, setForm] = useState<CreateUserInput>(emptyCreate);
  const [feeTypes, setFeeTypes] = useState<FeeTypeTemplate[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.users.list({
        page,
        search: search || undefined,
        role: 'CUSTOMER',
        isActive: activeFilter === '' ? undefined : activeFilter === 'true',
        kycStatus: kycFilter || undefined,
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('users.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter, kycFilter, t]);

  useEffect(() => {
    api.organizations().then(setOrgs).catch(console.error);
    hqPolicyApi
      .getPlatform()
      .then((p) => setInactivePresets(mergeInactiveNoticePresets(p.config.inactiveLoginNoticePresets)))
      .catch(console.error);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function salesOfficesForActor() {
    const path = me?.organization?.path;
    return orgs.filter(
      (o) =>
        o.type === 'SALES_OFFICE' &&
        (isSuperAdmin || !path || (o.path && o.path.startsWith(path))),
    );
  }

  async function openEdit(u: ManagedUser) {
    setMsg('');
    setError('');
    try {
      const detail = await api.users.get(u.id);
      setEditing(detail);
      setEditForm({
        name: detail.name,
        phone: detail.phone ?? '',
        recruitingOrgId: detail.customerProfile?.recruitingOrg?.id,
        isActive: detail.isActive,
        simulatorEnabled: detail.customerProfile?.simulatorEnabled !== false,
        simulatorRateMode: detail.customerProfile?.simulatorRateMode ?? 'LIVE',
        feeBillingMethod: detail.customerProfile?.feeBillingMethod ?? 'FOLLOW_HQ',
        totalFeeVisibility: detail.customerProfile?.totalFeeVisibility ?? 'FOLLOW_HQ',
        usdtCollectionMode: detail.customerProfile?.usdtCollectionMode ?? 'FOLLOW_HQ',
        operatorsEnabled: detail.customerProfile?.operatorsEnabled === true,
        usdtRiskLimitCode: (detail.customerProfile?.usdtRiskLimitCode as UsdtRiskLimitCode) ?? 'MR',
        usdtLimitMinUsdt: detail.customerProfile?.usdtLimitMinUsdt ?? null,
        usdtLimitMaxUsdt: detail.customerProfile?.usdtLimitMaxUsdt ?? null,
      });
      setInitialIsActive(detail.isActive);
      setNewPassword('');
      setStatusReason('');
      setStatusLoginNotice('');
      setStatusNoticePresetId(null);
      setModal('edit');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('users.loadError'));
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setMsg('');
    const statusChanging = editForm.isActive !== undefined && editForm.isActive !== initialIsActive;
    if (statusChanging && !statusReason.trim()) {
      setMsg(t('users.statusReasonRequired'));
      return;
    }

    const activating = editForm.isActive === true;
    const noticeForSave =
      statusChanging && !activating && statusNoticePresetId
        ? encodeInactivePresetReason(statusNoticePresetId)
        : statusChanging && !activating
          ? statusLoginNotice.trim() || null
          : null;
    const noticeLabel =
      statusChanging && !activating
        ? noticeForSave
          ? formatLoginNoticeDisplay(noticeForSave, locale, inactivePresets)
          : t('users.loginNoticeEmptyHint')
        : '';

    const runSave = async () => {
      await api.users.update(editing.id, {
        ...editForm,
        statusReason: statusChanging ? statusReason.trim() : undefined,
        statusLoginNotice: statusChanging ? noticeForSave : undefined,
      });
      if (newPassword.length >= 6) {
        await api.users.resetPassword(editing.id, newPassword);
      }
      setModal(null);
      setEditing(null);
      setMsg(t('users.saved'));
      load();
    };

    if (statusChanging) {
      requestConfirm({
        title: activating ? t('users.activateConfirmTitle') : t('users.deactivateConfirmTitle'),
        step1: activating
          ? t('users.activateConfirmStep1', { email: editing.email })
          : t('users.deactivateConfirmStep1', { email: editing.email }),
        step2: activating
          ? t('users.activateConfirmStep2', { reason: statusReason.trim() })
          : t('users.deactivateConfirmStep2Notice', {
              reason: statusReason.trim(),
              notice: noticeLabel,
            }),
        confirmLabel: activating ? t('users.active') : t('users.inactive'),
        onConfirm: async () => {
          try {
            await runSave();
          } catch (err) {
            setMsg(err instanceof Error ? err.message : t('users.saveFailed'));
          }
        },
      });
      return;
    }

    try {
      await runSave();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.saveFailed'));
    }
  }

  async function handleResetPassword(u: ManagedUser) {
    requestConfirm({
      title: t('users.resetPasswordBtn'),
      step1: t('users.resetPasswordConfirm', { email: u.email }),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('users.resetPasswordBtn'),
      onConfirm: async () => {
        setMsg('');
        setError('');
        try {
          const res = await api.users.resetPassword(u.id);
          setMsg(t('users.passwordResetDone', { password: res.initialPassword ?? '' }));
          load();
        } catch (err) {
          setError(err instanceof Error ? err.message : t('users.resetPasswordFailed'));
        }
      },
    });
  }

  async function handleResetOtp(u: ManagedUser) {
    requestConfirm({
      title: t('users.resetOtpBtn'),
      step1: t('users.resetOtpConfirm', { email: u.email }),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('users.resetOtpBtn'),
      onConfirm: async () => {
        setMsg('');
        setError('');
        try {
          await api.users.resetOtp(u.id);
          setMsg(t('users.otpResetDone', { email: u.email }));
          load();
        } catch (err) {
          setError(err instanceof Error ? err.message : t('users.resetOtpFailed'));
        }
      },
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await api.users.create({
        ...form,
        role: 'CUSTOMER',
      });
      setModal(null);
      setForm(emptyCreate);
      setMsg(t('customers.created'));
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.createFailed'));
    }
  }

  const statusChanging =
    editForm.isActive !== undefined && editForm.isActive !== initialIsActive;

  return (
    <div className="pg-stack">
      {doubleConfirmDialog}
      <ReferenceClocks compact />
      <div className="pg-toolbar">
        <p className="pg-hint">{t('customers.subtitle')}</p>
        {canRegisterCustomer && (
          <button
            type="button"
            onClick={() => {
              setForm(emptyCreate);
              setModal('create');
              setMsg('');
              void customerFeesApi
                .listTypes()
                .then((r) => {
                  setFeeTypes(r.feeTypes);
                  const usdtDef =
                    r.feeTypes.find((f) => f.ticketKind === 'USDT_PURCHASE' && f.isDefault)?.code ??
                    r.feeTypes.find((f) => (f.ticketKind ?? 'USDT_PURCHASE') === 'USDT_PURCHASE')
                      ?.code ??
                    '';
                  const tradeDef =
                    r.feeTypes.find((f) => f.ticketKind === 'TRADE_ESCROW' && f.isDefault)?.code ??
                    r.feeTypes.find((f) => f.ticketKind === 'TRADE_ESCROW')?.code ??
                    '';
                  setForm({
                    ...emptyCreate,
                    usdtFeeTypeCode: usdtDef,
                    tradeFeeTypeCode: tradeDef,
                  });
                })
                .catch(() => setFeeTypes([]));
            }}
            className="pg-btn pg-btn-primary"
          >
            {t('customers.add')}
          </button>
        )}
      </div>

      <div className="pg-filter-bar">
        <input
          type="search"
          placeholder={t('users.search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pg-input max-w-xs"
        />
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value as '' | 'true' | 'false');
            setPage(1);
          }}
          className="pg-select w-auto min-w-[8rem]"
        >
          <option value="">{t('users.filter.active')}</option>
          <option value="true">{t('users.active')}</option>
          <option value="false">{t('users.inactive')}</option>
        </select>
        <select
          value={kycFilter}
          onChange={(e) => {
            setKycFilter(e.target.value);
            setPage(1);
          }}
          className="pg-select w-auto min-w-[8rem]"
        >
          <option value="">{t('customers.filter.kyc')}</option>
          <option value="NOT_SUBMITTED">{t('kyc.status.NOT_SUBMITTED')}</option>
          <option value="PENDING">{t('kyc.status.PENDING')}</option>
          <option value="APPROVED">{t('kyc.status.APPROVED')}</option>
          <option value="REJECTED">{t('kyc.status.REJECTED')}</option>
        </select>
      </div>

      {error && <p className="pg-callout pg-callout-error">{error}</p>}
      {msg && !modal && <p className="pg-callout pg-callout-success">{msg}</p>}

      <div className="pg-card pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('users.col.email')}</th>
              <th>{t('users.col.name')}</th>
              <th>{t('customers.col.customer')}</th>
              <th>{t('customers.col.branch')}</th>
              <th>{t('customers.col.createdAt')}</th>
              <th>{t('users.col.status')}</th>
              <th>{t('customers.col.sRate')}</th>
              <th>{t('customers.col.simulator')}</th>
              <th>{t('customers.col.multi')}</th>
              <th>{t('customers.col.fees')}</th>
              <th>{t('customers.col.kyc')}</th>
              <th>{t('customers.col.account')}</th>
              <th>{t('customers.col.limit')}</th>
              <th>{t('customers.col.feeType')}</th>
              <th>{t('customers.col.billingMethod')}</th>
              <th>{t('users.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={16} className="pg-empty">
                  {t('common.loading')}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={16} className="pg-empty">
                  {t('customers.empty')}
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const usdtFee = effectiveFeeTypeLabel(
                  u.customerProfile?.feePolicies,
                  'USDT_PURCHASE',
                  t,
                );
                const tradeFee = effectiveFeeTypeLabel(
                  u.customerProfile?.feePolicies,
                  'TRADE_ESCROW',
                  t,
                );
                return (
                <tr
                  key={u.id}
                  {...detailRowProps(t('table.dblclickHint'), () =>
                    router.push(`/dashboard/customers/${u.id}`),
                  )}
                >
                  <td>{u.email}</td>
                  <td>{u.name}</td>
                  <td>
                    {u.customerProfile?.customerType === 'CORPORATE'
                      ? t('auth.corporate')
                      : t('auth.individual')}
                  </td>
                  <td>{u.customerProfile?.recruitingOrg?.name ?? '—'}</td>
                  <td className="whitespace-nowrap tabular-nums">{formatDateDot(u.createdAt)}</td>
                  <td>
                    <span className={`pg-badge ${u.isActive ? 'pg-badge-success' : 'pg-badge-muted'}`}>
                      {u.isActive ? t('users.active') : t('users.inactive')}
                    </span>
                  </td>
                  <td>
                    <SRateBadge
                      mode={u.customerProfile?.simulatorRateMode}
                      liveLabel={t('customers.sRate.live')}
                      sandLabel={t('customers.sRate.sand')}
                    />
                  </td>
                  <td>
                    <span
                      className={`pg-badge ${
                        u.customerProfile?.simulatorEnabled !== false
                          ? 'pg-badge-success'
                          : 'pg-badge-muted'
                      }`}
                    >
                      {u.customerProfile?.simulatorEnabled !== false
                        ? t('users.active')
                        : t('users.inactive')}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`pg-badge ${
                        u.customerProfile?.operatorsEnabled === true
                          ? 'pg-badge-success'
                          : 'pg-badge-muted'
                      }`}
                    >
                      {u.customerProfile?.operatorsEnabled === true
                        ? t('users.active')
                        : t('users.inactive')}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`pg-badge ${
                        u.customerProfile?.walletFeesVisible === true
                          ? 'pg-badge-success'
                          : 'pg-badge-muted'
                      }`}
                    >
                      {u.customerProfile?.walletFeesVisible === true
                        ? t('users.active')
                        : t('users.inactive')}
                    </span>
                  </td>
                  <td>
                    <span className={`pg-badge ${kycBadgeClass(u.kyc?.status)}`}>
                      {t(kycStatusKey(u.kyc?.status))}
                    </span>
                  </td>
                  <td>
                    <span className="pg-badge pg-badge-info">
                      {t(
                        `collectionMode.short.${u.customerProfile?.usdtCollectionMode ?? 'FOLLOW_HQ'}` as MessageKey,
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs tracking-wide">
                      {listLimitDisplay(u.customerProfile?.usdtRiskLimitCode)}
                    </span>
                  </td>
                  <td>
                    <div className="text-[11px] leading-snug text-gray-700">
                      <div>
                        <span className="text-gray-500">{t('ticket.USDT_PURCHASE')}: </span>
                        {usdtFee ?? '—'}
                      </div>
                      <div>
                        <span className="text-gray-500">{t('ticket.TRADE_ESCROW')}: </span>
                        {tradeFee ?? '—'}
                      </div>
                      <div>
                        <span className="text-gray-500">{t('customers.col.quoteResponse')}: </span>
                        {t(
                          `quoteResponse.${u.customerProfile?.usdtQuoteResponseMode ?? 'FOLLOW_HQ'}` as MessageKey,
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {t(
                      `feeBilling.${u.customerProfile?.feeBillingMethod ?? 'FOLLOW_HQ'}` as MessageKey,
                    )}
                  </td>
                  <td>
                    <div className="pg-table-actions">
                      <button type="button" onClick={() => void openEdit(u)} className="pg-action-chip pg-action-chip-edit">
                        {t('users.edit')}
                      </button>
                      <button type="button" onClick={() => void handleResetPassword(u)} className="pg-action-chip pg-action-chip-warn">
                        {t('users.resetPasswordBtn')}
                      </button>
                      <button type="button" onClick={() => void handleResetOtp(u)} className="pg-action-chip pg-action-chip-otp">
                        {t('users.resetOtpBtn')}
                      </button>
                      <Link
                        href={`/dashboard/customers/${u.id}`}
                        className="pg-action-chip bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        {t('customers.openKyc')}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="pg-hint">{t('users.total', { n: total })} · {t('table.dblclickHint')}</p>

      {modal === 'create' && (
        <div className="pg-modal-overlay">
          <form onSubmit={handleCreate} className="pg-modal">
            <div className="pg-modal-head">
              <h2 className="pg-modal-title">{t('customers.createTitle')}</h2>
            </div>
            <div className="pg-modal-body">
              <div className="mb-3">
                <ReferenceClocks compact />
              </div>
              <label className="pg-field">
                <span className="pg-field-label">
                  {t('auth.email')}
                  <span className="pg-field-required"> *</span>
                </span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pg-input mt-1"
                />
              </label>
              <label className="pg-field">
                <span className="pg-field-label">
                  {t('auth.password')}
                  <span className="pg-field-required"> *</span>
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pg-input mt-1"
                />
              </label>
              <label className="pg-field">
                <span className="pg-field-label">
                  {t('auth.name')}
                  <span className="pg-field-required"> *</span>
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="pg-input mt-1"
                />
              </label>
              <label className="pg-field">
                <span className="pg-field-label">{t('auth.phone')}</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="pg-input mt-1"
                />
              </label>
              <label className="pg-field">
                <span className="pg-field-label">
                  {t('users.recruitOrg')}
                  <span className="pg-field-required"> *</span>
                </span>
                <select
                  required
                  value={form.recruitingOrgId}
                  onChange={(e) => setForm({ ...form, recruitingOrgId: e.target.value })}
                  className="pg-input mt-1"
                >
                  <option value="">{t('users.select')}</option>
                  {salesOfficesForActor().map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pg-field">
                <span className="pg-field-label">{t('auth.customerType')}</span>
                <select
                  value={form.customerType ?? 'INDIVIDUAL'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      customerType: e.target.value as 'INDIVIDUAL' | 'CORPORATE',
                    })
                  }
                  className="pg-input mt-1"
                >
                  <option value="INDIVIDUAL">{t('auth.individual')}</option>
                  <option value="CORPORATE">{t('auth.corporate')}</option>
                </select>
              </label>
              <div className="pg-inset-panel sm:col-span-2">
                <p className="pg-inset-title">{t('customers.riskLimit.title')}</p>
                <p className="mt-1 pg-hint">{t('customers.riskLimit.hint')}</p>
                <label className="pg-field mt-3">
                  <span className="pg-field-label">{t('customers.riskLimit.select')}</span>
                  <select
                    value={form.usdtRiskLimitCode ?? 'MR'}
                    onChange={(e) => {
                      const code = e.target.value as UsdtRiskLimitCode;
                      setForm({
                        ...form,
                        usdtRiskLimitCode: code,
                        usdtLimitMinUsdt: code === 'ML' ? form.usdtLimitMinUsdt ?? 0 : null,
                        usdtLimitMaxUsdt: code === 'ML' ? form.usdtLimitMaxUsdt ?? 0 : null,
                      });
                    }}
                    className="pg-input mt-1"
                  >
                    {USDT_RISK_LIMIT_CODES.map((code) => (
                      <option key={code} value={code}>
                        {t(riskLimitLabelKey(code))}
                      </option>
                    ))}
                  </select>
                </label>
                {form.usdtRiskLimitCode === 'ML' && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="pg-field">
                      <span className="pg-field-label">
                        {t('customers.riskLimit.minUsdt')}
                        <span className="pg-field-required"> *</span>
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        required
                        value={form.usdtLimitMinUsdt ?? ''}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            usdtLimitMinUsdt: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        className="pg-input mt-1"
                      />
                    </label>
                    <label className="pg-field">
                      <span className="pg-field-label">
                        {t('customers.riskLimit.maxUsdt')}
                        <span className="pg-field-required"> *</span>
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        required
                        value={form.usdtLimitMaxUsdt ?? ''}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            usdtLimitMaxUsdt: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        className="pg-input mt-1"
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="pg-inset-panel">
                <p className="pg-inset-title">{t('users.bankSection')}</p>
                <label className="pg-field">
                  <span className="pg-field-label">
                    {t('users.bankName')}
                    <span className="pg-field-required"> *</span>
                  </span>
                  <input
                    required
                    value={form.bankName ?? ''}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    className="pg-input mt-1"
                  />
                </label>
                <label className="pg-field">
                  <span className="pg-field-label">
                    {t('users.accountNumber')}
                    <span className="pg-field-required"> *</span>
                  </span>
                  <input
                    required
                    value={form.accountNumber ?? ''}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    className="pg-input mt-1"
                  />
                </label>
                <label className="pg-field">
                  <span className="pg-field-label">
                    {t('users.accountHolder')}
                    <span className="pg-field-required"> *</span>
                  </span>
                  <input
                    required
                    value={form.accountHolder ?? ''}
                    onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                    className="pg-input mt-1"
                  />
                </label>
              </div>
              <div className="pg-inset-panel">
                <p className="pg-inset-title">{t('users.walletSection')}</p>
                <label className="pg-field">
                  <span className="pg-field-label">{t('wallets.label')}</span>
                  <input
                    value={form.walletLabel ?? ''}
                    onChange={(e) => setForm({ ...form, walletLabel: e.target.value })}
                    className="pg-input mt-1"
                  />
                </label>
                <label className="pg-field">
                  <span className="pg-field-label">
                    {t('wallets.address')}
                    <span className="pg-field-required"> *</span>
                  </span>
                  <input
                    required
                    value={form.walletAddress ?? ''}
                    onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
                    className="pg-input mt-1"
                  />
                </label>
                <label className="pg-field">
                  <span className="pg-field-label">
                    {t('users.walletNetwork')}
                    <span className="pg-field-required"> *</span>
                  </span>
                  <select
                    required
                    value={form.walletNetwork ?? 'TRC20'}
                    onChange={(e) => setForm({ ...form, walletNetwork: e.target.value })}
                    className="pg-input mt-1"
                  >
                    {WALLET_NETWORKS.map((n) => (
                      <option key={n.value} value={n.value}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="pg-inset-panel">
                <p className="pg-inset-title">{t('customers.simulator.title')}</p>
                <label className="mt-2 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.simulatorEnabled !== false}
                    onChange={(e) => setForm({ ...form, simulatorEnabled: e.target.checked })}
                  />
                  <span>
                    <span className="font-medium">{t('customers.simulator.enable')}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {t('customers.simulator.hint')}
                    </span>
                  </span>
                </label>
                <label className="mt-3 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.operatorsEnabled === true}
                    onChange={(e) => setForm({ ...form, operatorsEnabled: e.target.checked })}
                  />
                  <span>
                    <span className="font-medium">{t('customers.operators.enable')}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {t('customers.operators.hint')}
                    </span>
                  </span>
                </label>
                <label className="mt-3 block text-sm">
                  <span className="pg-field-label">{t('customers.sRate.title')}</span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <select
                      className="pg-select h-8 w-[7.5rem] shrink-0 px-2 py-1 text-sm"
                      value={form.simulatorRateMode ?? 'LIVE'}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          simulatorRateMode: e.target.value as 'LIVE' | 'SAND',
                        })
                      }
                      aria-label={t('customers.sRate.selectLabel')}
                    >
                      <option value="LIVE">{t('customers.sRate.live')}</option>
                      <option value="SAND">{t('customers.sRate.sand')}</option>
                    </select>
                    <span className="min-w-0 flex-1 text-xs leading-relaxed text-slate-500">
                      {t('customers.sRate.hint')}
                    </span>
                  </div>
                </label>
              </div>
              <div className="pg-inset-panel">
                <p className="pg-inset-title">{t('customers.col.collectionMode')}</p>
                <p className="mt-1 pg-hint">{t('customers.collectionMode.hint')}</p>
                <label className="pg-field mt-3">
                  <span className="pg-field-label">{t('customers.col.collectionMode')}</span>
                  <select
                    className="pg-input mt-1"
                    value={form.usdtCollectionMode ?? 'FOLLOW_HQ'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        usdtCollectionMode: e.target.value as CreateUserInput['usdtCollectionMode'],
                      })
                    }
                  >
                    <option value="FOLLOW_HQ">{t('collectionMode.FOLLOW_HQ')}</option>
                    <option value="FIXED">{t('collectionMode.FIXED')}</option>
                    <option value="VIRTUAL">{t('collectionMode.VIRTUAL')}</option>
                  </select>
                </label>
              </div>
              <div className="pg-inset-panel">
                <p className="pg-inset-title">{t('customers.hub.fees')}</p>
                <p className="mt-1 pg-hint">{t('customers.feeType.hint')}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="pg-field">
                    <span className="pg-field-label">{t('customers.feeType.usdt')}</span>
                    <select
                      className="pg-input mt-1"
                      value={form.usdtFeeTypeCode ?? ''}
                      onChange={(e) => setForm({ ...form, usdtFeeTypeCode: e.target.value })}
                    >
                      {feeTypes
                        .filter((f) => (f.ticketKind ?? 'USDT_PURCHASE') === 'USDT_PURCHASE')
                        .map((f) => (
                        <option key={f.id} value={f.code}>
                          {localizeFeeTypeLabel(f.code, f.name, t)}
                          {f.isDefault ? ` · ${t('hq.commission.feeTypeDefault')}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="pg-field">
                    <span className="pg-field-label">{t('customers.feeType.trade')}</span>
                    <select
                      className="pg-input mt-1"
                      value={form.tradeFeeTypeCode ?? ''}
                      onChange={(e) => setForm({ ...form, tradeFeeTypeCode: e.target.value })}
                    >
                      {feeTypes
                        .filter((f) => f.ticketKind === 'TRADE_ESCROW')
                        .map((f) => (
                        <option key={f.id} value={f.code}>
                          {localizeFeeTypeLabel(f.code, f.name, t)}
                          {f.isDefault ? ` · ${t('hq.commission.feeTypeDefault')}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="pg-field mt-3">
                  <span className="pg-field-label">{t('customers.col.quoteResponse')}</span>
                  <select
                    className="pg-input mt-1"
                    value={form.usdtQuoteResponseMode ?? 'FOLLOW_HQ'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        usdtQuoteResponseMode: e.target
                          .value as CreateUserInput['usdtQuoteResponseMode'],
                      })
                    }
                  >
                    <option value="FOLLOW_HQ">{t('quoteResponse.FOLLOW_HQ')}</option>
                    <option value="AUTO">{t('quoteResponse.AUTO')}</option>
                    <option value="MANUAL">{t('quoteResponse.MANUAL')}</option>
                    <option value="OFF">{t('quoteResponse.OFF')}</option>
                  </select>
                  <p className="mt-1 pg-hint">{t('customers.quoteResponse.formHint')}</p>
                </label>
                <label className="pg-field mt-3">
                  <span className="pg-field-label">{t('customers.col.billingMethod')}</span>
                  <select
                    className="pg-input mt-1"
                    value={form.feeBillingMethod ?? 'FOLLOW_HQ'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        feeBillingMethod: e.target.value as CreateUserInput['feeBillingMethod'],
                      })
                    }
                  >
                    <option value="FOLLOW_HQ">{t('feeBilling.FOLLOW_HQ')}</option>
                    <option value="INTEGRATED">{t('feeBilling.INTEGRATED')}</option>
                    <option value="ITEMIZED">{t('feeBilling.ITEMIZED')}</option>
                    <option value="HYBRID">{t('feeBilling.HYBRID')}</option>
                  </select>
                  <span className="mt-1 block text-xs text-slate-500">{t('customers.billingMethod.hint')}</span>
                </label>
                <label className="pg-field mt-3">
                  <span className="pg-field-label">{t('customers.totalFee.title')}</span>
                  <select
                    className="pg-input mt-1"
                    value={form.totalFeeVisibility ?? 'FOLLOW_HQ'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        totalFeeVisibility: e.target.value as CreateUserInput['totalFeeVisibility'],
                      })
                    }
                  >
                    <option value="FOLLOW_HQ">{t('totalFee.FOLLOW_HQ')}</option>
                    <option value="SHOW">{t('totalFee.SHOW')}</option>
                    <option value="HIDE">{t('totalFee.HIDE')}</option>
                  </select>
                  <span className="mt-1 block text-xs text-slate-500">{t('customers.totalFee.hint')}</span>
                </label>
                <p className="mt-2 pg-hint text-xs">{t('feeShare.manageInFees')}</p>
              </div>
              <label className="pg-field">
                <span className="pg-field-label">
                  {t('users.registerReason')}
                  <span className="pg-field-required"> *</span>
                </span>
                <textarea
                  required
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="pg-input mt-1 min-h-[72px]"
                />
              </label>
            </div>
            {msg && <p className="pg-callout pg-callout-error mx-6 mb-0">{msg}</p>}
            <div className="pg-modal-foot">
              <button type="button" onClick={() => setModal(null)} className="pg-btn pg-btn-secondary">
                {t('common.cancel')}
              </button>
              <button type="submit" className="pg-btn pg-btn-primary">
                {t('common.register')}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'edit' && editing && (
        <div className="pg-modal-overlay">
          <form onSubmit={handleUpdate} className="pg-modal">
            <div className="pg-modal-head">
              <h2 className="pg-modal-title">{t('customers.editTitle')}</h2>
              <p className="pg-modal-sub">{editing.email}</p>
            </div>
            <div className="pg-modal-body">
              <label className="pg-field">
                <span className="pg-field-label">
                  {t('auth.name')}
                  <span className="pg-field-required"> *</span>
                </span>
                <input
                  required
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="pg-input mt-1"
                />
              </label>
              <label className="pg-field">
                <span className="pg-field-label">{t('auth.phone')}</span>
                <input
                  value={editForm.phone ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="pg-input mt-1"
                />
              </label>
              <label className="pg-field">
                <span className="pg-field-label">
                  {t('users.recruitOrg')}
                  <span className="pg-field-required"> *</span>
                </span>
                <select
                  required
                  value={editForm.recruitingOrgId ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, recruitingOrgId: e.target.value })}
                  className="pg-input mt-1"
                >
                  <option value="">{t('users.select')}</option>
                  {salesOfficesForActor().map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="pg-inset-panel">
                <p className="pg-inset-title">{t('customers.riskLimit.title')}</p>
                <p className="mt-1 pg-hint">{t('customers.riskLimit.hint')}</p>
                <label className="pg-field mt-3">
                  <span className="pg-field-label">{t('customers.riskLimit.select')}</span>
                  <select
                    value={editForm.usdtRiskLimitCode ?? 'MR'}
                    onChange={(e) => {
                      const code = e.target.value as UsdtRiskLimitCode;
                      setEditForm({
                        ...editForm,
                        usdtRiskLimitCode: code,
                        usdtLimitMinUsdt: code === 'ML' ? editForm.usdtLimitMinUsdt ?? 0 : null,
                        usdtLimitMaxUsdt: code === 'ML' ? editForm.usdtLimitMaxUsdt ?? 0 : null,
                      });
                    }}
                    className="pg-input mt-1"
                  >
                    {USDT_RISK_LIMIT_CODES.map((code) => (
                      <option key={code} value={code}>
                        {t(riskLimitLabelKey(code))}
                      </option>
                    ))}
                  </select>
                </label>
                {editForm.usdtRiskLimitCode === 'ML' && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="pg-field">
                      <span className="pg-field-label">
                        {t('customers.riskLimit.minUsdt')}
                        <span className="pg-field-required"> *</span>
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        required
                        value={editForm.usdtLimitMinUsdt ?? ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            usdtLimitMinUsdt: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        className="pg-input mt-1"
                      />
                    </label>
                    <label className="pg-field">
                      <span className="pg-field-label">
                        {t('customers.riskLimit.maxUsdt')}
                        <span className="pg-field-required"> *</span>
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        required
                        value={editForm.usdtLimitMaxUsdt ?? ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            usdtLimitMaxUsdt: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        className="pg-input mt-1"
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="pg-inset-panel">
                <p className="pg-inset-title">{t('customers.col.collectionMode')}</p>
                <p className="mt-1 pg-hint">{t('customers.collectionMode.hint')}</p>
                <label className="pg-field mt-3">
                  <span className="pg-field-label">{t('customers.col.collectionMode')}</span>
                  <select
                    value={editForm.usdtCollectionMode ?? 'FOLLOW_HQ'}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        usdtCollectionMode: e.target.value as UpdateUserInput['usdtCollectionMode'],
                      })
                    }
                    className="pg-input mt-1"
                  >
                    <option value="FOLLOW_HQ">{t('collectionMode.FOLLOW_HQ')}</option>
                    <option value="FIXED">{t('collectionMode.FIXED')}</option>
                    <option value="VIRTUAL">{t('collectionMode.VIRTUAL')}</option>
                  </select>
                </label>
              </div>
              <div className="pg-inset-panel">
                <p className="pg-inset-title">{t('customers.simulator.title')}</p>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.simulatorEnabled !== false}
                    onChange={(e) => setEditForm({ ...editForm, simulatorEnabled: e.target.checked })}
                  />
                  {t('customers.simulator.enable')}
                </label>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.operatorsEnabled === true}
                    onChange={(e) => setEditForm({ ...editForm, operatorsEnabled: e.target.checked })}
                  />
                  {t('customers.operators.enable')}
                </label>
                <label className="pg-field mt-2">
                  <span className="pg-field-label">{t('customers.sRate.title')}</span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <select
                      value={editForm.simulatorRateMode ?? 'LIVE'}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          simulatorRateMode: e.target.value as 'LIVE' | 'SAND',
                        })
                      }
                      className="pg-select h-8 w-[7.5rem] shrink-0 px-2 py-1 text-sm"
                      aria-label={t('customers.sRate.selectLabel')}
                    >
                      <option value="LIVE">{t('customers.sRate.live')}</option>
                      <option value="SAND">{t('customers.sRate.sand')}</option>
                    </select>
                    <span className="min-w-0 flex-1 text-xs leading-relaxed text-slate-500">
                      {t('customers.sRate.hint')}
                    </span>
                  </div>
                </label>
                <label className="pg-field mt-2">
                  <span className="pg-field-label">{t('customers.col.billingMethod')}</span>
                  <select
                    value={editForm.feeBillingMethod ?? 'FOLLOW_HQ'}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        feeBillingMethod: e.target.value as UpdateUserInput['feeBillingMethod'],
                      })
                    }
                    className="pg-input mt-1"
                  >
                    <option value="FOLLOW_HQ">{t('feeBilling.FOLLOW_HQ')}</option>
                    <option value="INTEGRATED">{t('feeBilling.INTEGRATED')}</option>
                    <option value="ITEMIZED">{t('feeBilling.ITEMIZED')}</option>
                    <option value="HYBRID">{t('feeBilling.HYBRID')}</option>
                  </select>
                  <span className="mt-1 block text-xs text-slate-500">{t('customers.billingMethod.hint')}</span>
                </label>
                <label className="pg-field mt-2">
                  <span className="pg-field-label">{t('customers.totalFee.title')}</span>
                  <select
                    value={editForm.totalFeeVisibility ?? 'FOLLOW_HQ'}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        totalFeeVisibility: e.target.value as UpdateUserInput['totalFeeVisibility'],
                      })
                    }
                    className="pg-input mt-1"
                  >
                    <option value="FOLLOW_HQ">{t('totalFee.FOLLOW_HQ')}</option>
                    <option value="SHOW">{t('totalFee.SHOW')}</option>
                    <option value="HIDE">{t('totalFee.HIDE')}</option>
                  </select>
                  <span className="mt-1 block text-xs text-slate-500">{t('customers.totalFee.hint')}</span>
                </label>
              </div>
              <label className="pg-field">
                <span className="pg-field-label">{t('users.col.status')}</span>
                <label className="mt-1 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.isActive ?? true}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  />
                  {t('users.accountActive')}
                </label>
              </label>
              {statusChanging && (
                <label className="pg-field">
                  <span className="pg-field-label">
                    {t('users.statusReason')}
                    <span className="pg-field-required"> *</span>
                  </span>
                  <p className="pg-hint mt-1 text-[11px]">{t('users.statusReasonInternalHint')}</p>
                  <textarea
                    required
                    rows={2}
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="pg-input mt-1 min-h-[56px]"
                    placeholder={t('users.statusReasonInternalPlaceholder')}
                  />
                </label>
              )}
              {statusChanging && editForm.isActive === false && (
                <label className="pg-field">
                  <span className="pg-field-label">{t('users.loginNotice')}</span>
                  <p className="pg-hint mt-1 text-[11px]">{t('users.loginNoticeHint')}</p>
                  <div className="mt-1">
                    <InactiveReasonPresetPicker
                      presets={inactivePresets}
                      locale={locale}
                      selectedId={statusNoticePresetId}
                      onSelect={(p) => {
                        setStatusNoticePresetId(p.id);
                        setStatusLoginNotice(p.bodyI18n[locale] || p.bodyI18n.KR);
                      }}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={statusLoginNotice}
                    onChange={(e) => {
                      setStatusLoginNotice(e.target.value);
                      setStatusNoticePresetId(null);
                    }}
                    className="pg-input mt-2 min-h-[72px]"
                    placeholder={t('users.loginNoticePlaceholder')}
                  />
                </label>
              )}
              <label className="pg-field">
                <span className="pg-field-label">{t('users.resetPassword')}</span>
                <input
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pg-input mt-1"
                />
              </label>
            </div>
            {msg && <p className="pg-callout pg-callout-error mx-6 mb-0">{msg}</p>}
            <div className="pg-modal-foot">
              <button type="button" onClick={() => setModal(null)} className="pg-btn pg-btn-secondary">
                {t('common.cancel')}
              </button>
              <button type="submit" className="pg-btn pg-btn-primary">
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

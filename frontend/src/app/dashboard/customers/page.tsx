'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  type CreateUserInput,
  type ManagedUser,
  type Organization,
  type UpdateUserInput,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { WALLET_NETWORKS } from '@/constants/wallet-networks';
import { ReferenceClocks } from '@/components/ReferenceClocks';
import { SRateBadge } from '@/components/SRateBadge';
import { detailRowProps } from '@/lib/table-row-detail';

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
};

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

export default function CustomersPage() {
  const { user: me } = useAuth();
  const t = useT();
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
  const [initialIsActive, setInitialIsActive] = useState(true);
  const [form, setForm] = useState<CreateUserInput>(emptyCreate);

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
      });
      setInitialIsActive(detail.isActive);
      setNewPassword('');
      setStatusReason('');
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
    try {
      await api.users.update(editing.id, {
        ...editForm,
        statusReason: statusChanging ? statusReason.trim() : undefined,
      });
      if (newPassword.length >= 6) {
        await api.users.resetPassword(editing.id, newPassword);
      }
      setModal(null);
      setEditing(null);
      setMsg(t('users.saved'));
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.saveFailed'));
    }
  }

  async function handleResetPassword(u: ManagedUser) {
    if (!window.confirm(t('users.resetPasswordConfirm', { email: u.email }))) return;
    setMsg('');
    setError('');
    try {
      const res = await api.users.resetPassword(u.id);
      setMsg(t('users.passwordResetDone', { password: res.initialPassword ?? '' }));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.resetPasswordFailed'));
    }
  }

  async function handleResetOtp(u: ManagedUser) {
    if (!window.confirm(t('users.resetOtpConfirm', { email: u.email }))) return;
    setMsg('');
    setError('');
    try {
      await api.users.resetOtp(u.id);
      setMsg(t('users.otpResetDone', { email: u.email }));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.resetOtpFailed'));
    }
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
              <th>{t('auth.customerType')}</th>
              <th>{t('users.recruitOrg')}</th>
              <th>{t('users.col.status')}</th>
              <th>{t('customers.col.sRate')}</th>
              <th>{t('customers.col.simulator')}</th>
              <th>{t('customers.col.kyc')}</th>
              <th>{t('users.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="pg-empty">
                  {t('common.loading')}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={9} className="pg-empty">
                  {t('customers.empty')}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  {...detailRowProps(t('table.dblclickHint'), () => void openEdit(u))}
                >
                  <td>{u.email}</td>
                  <td>{u.name}</td>
                  <td>
                    {u.customerProfile?.customerType === 'CORPORATE'
                      ? t('auth.corporate')
                      : t('auth.individual')}
                  </td>
                  <td>{u.customerProfile?.recruitingOrg?.name ?? '—'}</td>
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
                        ? t('customers.simulator.on')
                        : t('customers.simulator.off')}
                    </span>
                  </td>
                  <td>
                    <span className={`pg-badge ${kycBadgeClass(u.kyc?.status)}`}>
                      {t(kycStatusKey(u.kyc?.status))}
                    </span>
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
              ))
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
                <label className="mt-3 block text-sm">
                  <span className="pg-field-label">{t('customers.sRate.title')}</span>
                  <select
                    className="pg-select mt-1 w-full max-w-xs"
                    value={form.simulatorRateMode ?? 'LIVE'}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        simulatorRateMode: e.target.value as 'LIVE' | 'SAND',
                      })
                    }
                  >
                    <option value="LIVE">{t('customers.sRate.live')}</option>
                    <option value="SAND">{t('customers.sRate.sand')}</option>
                  </select>
                  <span className="mt-1 block text-xs text-slate-500">{t('customers.sRate.hint')}</span>
                </label>
              </div>
              <p className="pg-hint">
                <a href="/dashboard/customers/fees" className="pg-link">
                  {t('customerFees.manageLink')}
                </a>
              </p>
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
                <p className="pg-inset-title">{t('customers.simulator.title')}</p>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.simulatorEnabled !== false}
                    onChange={(e) => setEditForm({ ...editForm, simulatorEnabled: e.target.checked })}
                  />
                  {t('customers.simulator.enable')}
                </label>
                <label className="pg-field mt-2">
                  <span className="pg-field-label">{t('customers.sRate.title')}</span>
                  <select
                    value={editForm.simulatorRateMode ?? 'LIVE'}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        simulatorRateMode: e.target.value as 'LIVE' | 'SAND',
                      })
                    }
                    className="pg-input mt-1"
                  >
                    <option value="LIVE">{t('customers.sRate.live')}</option>
                    <option value="SAND">{t('customers.sRate.sand')}</option>
                  </select>
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
                  <textarea
                    required
                    rows={3}
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="pg-input mt-1 min-h-[72px]"
                    placeholder={
                      editForm.isActive
                        ? t('users.activateReasonPlaceholder')
                        : t('users.deactivateReasonPlaceholder')
                    }
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

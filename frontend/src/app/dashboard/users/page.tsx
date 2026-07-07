'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  type CreateUserInput,
  type ManagedUser,
  type Organization,
  type UpdateUserInput,
  type UserRoleType,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { WALLET_NETWORKS } from '@/constants/wallet-networks';

const CUSTOMER_REGISTER_ORG_TYPES = ['HEAD_OFFICE', 'MASTER_DISTRIBUTOR'] as const;

const emptyCreate: CreateUserInput = {
  email: '',
  password: '',
  name: '',
  phone: '',
  role: 'ORG_STAFF',
  reason: '',
  organizationId: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  walletAddress: '',
  walletNetwork: 'TRC20',
  walletLabel: '',
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const t = useT();
  const isSuperAdmin = me?.role === 'SUPER_ADMIN';
  const canRegisterCustomer =
    isSuperAdmin ||
    CUSTOMER_REGISTER_ORG_TYPES.includes(
      (me?.organization?.type ?? '') as (typeof CUSTOMER_REGISTER_ORG_TYPES)[number],
    );

  const roleLabel = (role: UserRoleType) => t(`role.${role}` as MessageKey);
  const orgTypeLabel = (type: string) => t(`org.${type}` as MessageKey);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRoleType | ''>('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<CreateUserInput>(emptyCreate);
  const [editForm, setEditForm] = useState<UpdateUserInput>({});
  const [newPassword, setNewPassword] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [initialIsActive, setInitialIsActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.users.list({
        page,
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: activeFilter === '' ? undefined : activeFilter === 'true',
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('users.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, activeFilter]);

  useEffect(() => {
    api.organizations().then(setOrgs).catch(console.error);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm({ ...emptyCreate, role: isSuperAdmin ? 'ORG_STAFF' : 'ORG_STAFF' });
    setModal('create');
    setMsg('');
  }

  async function openEdit(u: ManagedUser) {
    setMsg('');
    try {
      const detail = await api.users.get(u.id);
      setEditing(detail);
      setEditForm({
        name: detail.name,
        phone: detail.phone ?? '',
        role: detail.role,
        organizationId: detail.organization?.id ?? null,
        isActive: detail.isActive,
        recruitingOrgId: detail.customerProfile?.recruitingOrg?.id,
      });
      setInitialIsActive(detail.isActive);
      setStatusReason('');
      setNewPassword('');
      setModal('edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.loadError'));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await api.users.create(form);
      setModal(null);
      setMsg(t('users.created'));
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('users.createFailed'));
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

  function salesOfficesForActor() {
    const path = me?.organization?.path;
    return orgs.filter(
      (o) =>
        o.type === 'SALES_OFFICE' &&
        (isSuperAdmin || !path || (o.path && o.path.startsWith(path))),
    );
  }

  function orgLabel(u: ManagedUser) {
    if (u.organization) return `${u.organization.name} (${orgTypeLabel(u.organization.type)})`;
    if (u.customerProfile?.recruitingOrg) {
      return `${t('users.recruitPrefix')}: ${u.customerProfile.recruitingOrg.name}`;
    }
    return '—';
  }

  function adminLabel(admin?: { name: string; email: string } | null) {
    if (!admin) return '—';
    return `${admin.name} (${admin.email})`;
  }

  function mgmtActionLabel(action: string) {
    return t(`users.mgmt.${action}` as MessageKey);
  }

  const statusChanging =
    editForm.isActive !== undefined && editForm.isActive !== initialIsActive;

  return (
    <div className="pg-stack">
      <div className="pg-toolbar">
        <p className="pg-hint">{t('users.subtitle')}</p>
        <button type="button" onClick={openCreate} className="pg-btn pg-btn-primary">
          {t('users.add')}
        </button>
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
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRoleType | '');
            setPage(1);
          }}
          className="pg-select w-auto min-w-[8rem]"
        >
          <option value="">{t('users.filter.role')}</option>
          {isSuperAdmin && <option value="SUPER_ADMIN">{roleLabel('SUPER_ADMIN')}</option>}
          <option value="ORG_STAFF">{roleLabel('ORG_STAFF')}</option>
          <option value="CUSTOMER">{roleLabel('CUSTOMER')}</option>
        </select>
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
      </div>

      {error && <p className="pg-callout pg-callout-error">{error}</p>}
      {msg && !modal && <p className="pg-callout pg-callout-success">{msg}</p>}

      <div className="pg-card pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('users.col.email')}</th>
              <th>{t('users.col.name')}</th>
              <th>{t('users.col.role')}</th>
              <th>{t('users.col.org')}</th>
              <th>{t('users.col.status')}</th>
              <th>{t('users.col.createdBy')}</th>
              <th>{t('users.col.lastLogin')}</th>
              <th>{t('users.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="pg-empty">
                  {t('common.loading')}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="pg-empty">
                  {t('users.empty')}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.name}</td>
                  <td>{roleLabel(u.role)}</td>
                  <td>{orgLabel(u)}</td>
                  <td>
                    <span className={`pg-badge ${u.isActive ? 'pg-badge-success' : 'pg-badge-muted'}`}>
                      {u.isActive ? t('users.active') : t('users.inactive')}
                    </span>
                  </td>
                  <td className="pg-muted text-[11px]">{adminLabel(u.createdBy)}</td>
                  <td className="pg-muted">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ko-KR') : '—'}
                  </td>
                  <td>
                    <div className="pg-table-actions">
                      <button type="button" onClick={() => openEdit(u)} className="pg-link">
                        {t('users.edit')}
                      </button>
                      <span className="pg-muted">|</span>
                      <button type="button" onClick={() => handleResetPassword(u)} className="pg-link-warn">
                        {t('users.resetPasswordBtn')}
                      </button>
                      <span className="pg-muted">|</span>
                      <button type="button" onClick={() => handleResetOtp(u)} className="pg-link-danger">
                        {t('users.resetOtpBtn')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="pg-hint">{t('users.total', { n: total })}</p>

      {modal === 'create' && (
        <div className="pg-modal-overlay">
          <form onSubmit={handleCreate} className="pg-modal">
            <div className="pg-modal-head">
              <h2 className="pg-modal-title">{t('users.createTitle')}</h2>
            </div>
            <div className="pg-modal-body">
              <Field label={t('auth.email')} required>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pg-input"
                />
              </Field>
              <Field label={t('auth.password')} required>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pg-input"
                />
              </Field>
              <Field label={t('auth.name')} required>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="pg-input"
                />
              </Field>
              <Field label={t('auth.phone')}>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="pg-input"
                />
              </Field>
              <Field label={t('users.col.role')} required>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRoleType })}
                  className="pg-input"
                >
                  {isSuperAdmin && <option value="SUPER_ADMIN">{roleLabel('SUPER_ADMIN')}</option>}
                  <option value="ORG_STAFF">{roleLabel('ORG_STAFF')}</option>
                  {canRegisterCustomer && <option value="CUSTOMER">{roleLabel('CUSTOMER')}</option>}
                </select>
              </Field>
              {form.role === 'ORG_STAFF' && (
                <Field label={t('users.orgStaff')} required>
                  <select
                    required
                    value={form.organizationId}
                    onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
                    className="pg-input"
                  >
                    <option value="">{t('users.select')}</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {form.role === 'CUSTOMER' && (
                <>
                  <Field label={t('users.recruitOrg')} required>
                    <select
                      required
                      value={form.recruitingOrgId}
                      onChange={(e) => setForm({ ...form, recruitingOrgId: e.target.value })}
                      className="pg-input"
                    >
                      <option value="">{t('users.select')}</option>
                      {salesOfficesForActor().map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('auth.customerType')}>
                    <select
                      value={form.customerType ?? 'INDIVIDUAL'}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          customerType: e.target.value as 'INDIVIDUAL' | 'CORPORATE',
                        })
                      }
                      className="pg-input"
                    >
                      <option value="INDIVIDUAL">{t('auth.individual')}</option>
                      <option value="CORPORATE">{t('auth.corporate')}</option>
                    </select>
                  </Field>
                  <div className="pg-inset-panel">
                    <p className="pg-inset-title">{t('users.bankSection')}</p>
                    <Field label={t('users.bankName')} required>
                      <input
                        required
                        value={form.bankName ?? ''}
                        onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                        className="pg-input"
                        placeholder={t('users.bankNamePlaceholder')}
                      />
                    </Field>
                    <Field label={t('users.accountNumber')} required>
                      <input
                        required
                        value={form.accountNumber ?? ''}
                        onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                        className="pg-input"
                      />
                    </Field>
                    <Field label={t('users.accountHolder')} required>
                      <input
                        required
                        value={form.accountHolder ?? ''}
                        onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                        className="pg-input"
                      />
                    </Field>
                  </div>
                  <div className="pg-inset-panel">
                    <p className="pg-inset-title">{t('users.walletSection')}</p>
                    <Field label={t('wallets.label')}>
                      <input
                        value={form.walletLabel ?? ''}
                        onChange={(e) => setForm({ ...form, walletLabel: e.target.value })}
                        className="pg-input"
                        placeholder={t('wallets.defaultLabel')}
                      />
                    </Field>
                    <Field label={t('wallets.address')} required>
                      <input
                        required
                        value={form.walletAddress ?? ''}
                        onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
                        className="pg-input"
                      />
                    </Field>
                    <Field label={t('users.walletNetwork')} required>
                      <select
                        required
                        value={form.walletNetwork ?? 'TRC20'}
                        onChange={(e) => setForm({ ...form, walletNetwork: e.target.value })}
                        className="pg-input"
                      >
                        {WALLET_NETWORKS.map((n) => (
                          <option key={n.value} value={n.value}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </>
              )}
              <Field label={t('users.registerReason')} required>
                <textarea
                  required
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="pg-input min-h-[72px]"
                  placeholder={t('users.registerReasonPlaceholder')}
                />
              </Field>
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
              <h2 className="pg-modal-title">{t('users.editTitle')}</h2>
              <p className="pg-modal-sub">{editing.email}</p>
            </div>
            <div className="pg-modal-body">
              {(editing.createdBy || editing.registerReason) && (
                <div className="pg-inset-panel mb-3">
                  <p className="pg-inset-title">{t('users.registrationInfo')}</p>
                  <p className="mt-1 text-[12px]">
                    <span className="font-medium">{t('users.col.createdBy')}: </span>
                    {adminLabel(editing.createdBy)}
                  </p>
                  {editing.registerReason && (
                    <p className="mt-1 text-[12px]">
                      <span className="font-medium">{t('users.registerReason')}: </span>
                      {editing.registerReason}
                    </p>
                  )}
                </div>
              )}
              <Field label={t('auth.name')} required>
                <input
                  required
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="pg-input"
                />
              </Field>
              <Field label={t('auth.phone')}>
                <input
                  value={editForm.phone ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="pg-input"
                />
              </Field>
              {isSuperAdmin && (
                <Field label={t('users.col.role')}>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value as UserRoleType })
                    }
                    className="pg-input"
                  >
                    <option value="SUPER_ADMIN">{roleLabel('SUPER_ADMIN')}</option>
                    <option value="ORG_STAFF">{roleLabel('ORG_STAFF')}</option>
                    <option value="CUSTOMER">{roleLabel('CUSTOMER')}</option>
                  </select>
                </Field>
              )}
              {editForm.role === 'ORG_STAFF' && (
                <Field label={t('users.orgStaff')}>
                  <select
                    value={editForm.organizationId ?? ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, organizationId: e.target.value || null })
                    }
                    className="pg-input"
                  >
                    <option value="">{t('users.select')}</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {editForm.role === 'CUSTOMER' && (
                <>
                  <Field label={t('users.recruitOrg')}>
                    <select
                      value={editForm.recruitingOrgId ?? ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, recruitingOrgId: e.target.value })
                      }
                      className="pg-input"
                    >
                      {salesOfficesForActor().map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {editing.bankAccounts?.[0] && (
                    <div className="pg-inset-panel">
                      <p className="pg-inset-title">{t('users.bankSection')}</p>
                      <p className="mt-1">
                        {editing.bankAccounts[0].bankName} · {editing.bankAccounts[0].accountNumber}
                      </p>
                      <p className="pg-hint">{editing.bankAccounts[0].accountHolder}</p>
                    </div>
                  )}
                  {editing.wallets?.[0] && (
                    <div className="pg-inset-panel">
                      <p className="pg-inset-title">{t('users.walletSection')}</p>
                      <p className="mt-1 font-mono text-[11px]">{editing.wallets[0].address}</p>
                      <p className="pg-hint">{editing.wallets[0].network}</p>
                    </div>
                  )}
                </>
              )}
              <Field label={t('users.col.status')}>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={editForm.isActive ?? true}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  />
                  {t('users.accountActive')}
                </label>
              </Field>
              {statusChanging && (
                <Field label={t('users.statusReason')} required>
                  <textarea
                    required
                    rows={3}
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="pg-input min-h-[72px]"
                    placeholder={
                      editForm.isActive
                        ? t('users.activateReasonPlaceholder')
                        : t('users.deactivateReasonPlaceholder')
                    }
                  />
                </Field>
              )}
              <Field label={t('users.resetPassword')}>
                <input
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pg-input"
                />
              </Field>
              {editing.managementLogs && editing.managementLogs.length > 0 && (
                <div className="pg-inset-panel">
                  <p className="pg-inset-title">{t('users.mgmtHistory')}</p>
                  <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                    {editing.managementLogs.map((log) => (
                      <div key={log.id} className="border-b border-gray-100 pb-2 text-[11px] last:border-0">
                        <div className="flex flex-wrap gap-x-2 font-medium">
                          <span>{mgmtActionLabel(log.action)}</span>
                          <span className="pg-muted">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="pg-muted">{adminLabel(log.changedBy)}</div>
                        <div className="mt-0.5">{log.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="pg-field">
      <span className="pg-field-label">
        {label}
        {required && <span className="pg-field-required"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

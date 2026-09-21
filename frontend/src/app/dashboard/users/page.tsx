'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useLocale, useT } from '@/context/LocaleProvider';
import {
  api,
  hqPolicyApi,
  type CreateUserInput,
  type ManagedUser,
  type Organization,
  type UpdateUserInput,
  type UserRoleType,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { OrgCreateFields } from '@/components/orgs/OrgCreateFields';
import { DoubleConfirmDialog } from '@/components/DoubleConfirmDialog';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import { InactiveReasonPresetPicker } from '@/components/InactiveReasonPresetPicker';
import {
  encodeInactivePresetReason,
  formatLoginNoticeDisplay,
  mergeInactiveNoticePresets,
  type InactiveNoticePreset,
  type InactiveNoticePresetId,
} from '@/lib/inactive-notice-presets';
import { type OrgTypeCode } from '@/lib/org-types';
import { detailRowProps } from '@/lib/table-row-detail';

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
  const { locale } = useLocale();
  const isSuperAdmin = me?.role === 'SUPER_ADMIN';
  const canAssignOrganizer = (me?.email ?? '').toLowerCase() === 'ziobizm@gmail.com' && isSuperAdmin;
  const [passwordConfirm, setPasswordConfirm] = useState('');

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
  const [orgMode, setOrgMode] = useState<'existing' | 'new'>('existing');
  const [newOrgType, setNewOrgType] = useState<OrgTypeCode>('MASTER_DISTRIBUTOR');
  const [newOrgParentId, setNewOrgParentId] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
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
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.users.list({
        page,
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: activeFilter === '' ? undefined : activeFilter === 'true',
        staffOnly: true,
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
    hqPolicyApi
      .getPlatform()
      .then((p) => setInactivePresets(mergeInactiveNoticePresets(p.config.inactiveLoginNoticePresets)))
      .catch(console.error);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm({ ...emptyCreate, role: 'ORG_STAFF' });
    setPasswordConfirm('');
    setOrgMode(orgs.length === 0 ? 'new' : 'existing');
    setNewOrgType(isSuperAdmin ? 'HEAD_OFFICE' : 'REGIONAL_BRANCH');
    setNewOrgParentId('');
    setNewOrgName('');
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
      setStatusLoginNotice('');
      setStatusNoticePresetId(null);
      setNewPassword('');
      setModal('edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.loadError'));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    if (form.password !== passwordConfirm) {
      setMsg(t('users.passwordMismatch'));
      return;
    }
    const needsOrg = form.role === 'ORG_STAFF' || form.role === 'SETTLEMENT_ADMIN' || form.role === 'ORGANIZER';
    try {
      let organizationId = form.organizationId;
      if (needsOrg && form.role !== 'ORGANIZER' && orgMode === 'new') {
        const createdOrg = await api.createOrganization({
          name: newOrgName,
          type: newOrgType,
          parentId: newOrgParentId || null,
        });
        organizationId = createdOrg.id;
        setOrgs((prev) => [...prev, createdOrg]);
      }
      if (needsOrg && form.role === 'ORGANIZER' && !organizationId) {
        organizationId = orgs.find((o) => o.type === 'HEAD_OFFICE')?.id ?? '';
      }
      if (needsOrg && !organizationId) {
        setMsg(t('users.orgRequiredForStaff'));
        return;
      }
      await api.users.create({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        phone: form.phone?.trim() || undefined,
        role: form.role,
        organizationId: organizationId || undefined,
        reason: form.reason.trim(),
      });
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

  async function confirmDeleteUser() {
    if (!deleting) return;
    setMsg('');
    try {
      await api.users.remove(deleting.id);
      setDeleting(null);
      setMsg(t('users.deleted'));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.deleteFailed'));
      setDeleting(null);
    }
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
      {doubleConfirmDialog}
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
          <option value="ORGANIZER">{roleLabel('ORGANIZER')}</option>
          <option value="SETTLEMENT_ADMIN">{roleLabel('SETTLEMENT_ADMIN')}</option>
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
        <table className="pg-table pg-table-ops">
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
              <th>{t('users.col.note')}</th>
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
                  {t('users.empty')}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} {...detailRowProps(t('table.dblclickHint'), () => void openEdit(u))}>
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
                      <button type="button" onClick={() => openEdit(u)} className="pg-action-chip pg-action-chip-edit">
                        {t('users.edit')}
                      </button>
                      <button type="button" onClick={() => handleResetPassword(u)} className="pg-action-chip pg-action-chip-warn">
                        {t('users.resetPasswordBtn')}
                      </button>
                      <button type="button" onClick={() => handleResetOtp(u)} className="pg-action-chip pg-action-chip-otp">
                        {t('users.resetOtpBtn')}
                      </button>
                    </div>
                  </td>
                  <td>
                    {!u.isActive ? (
                      <button type="button" onClick={() => setDeleting(u)} className="pg-action-chip pg-action-chip-danger">
                        {t('users.delete')}
                      </button>
                    ) : (
                      '—'
                    )}
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
          <form onSubmit={handleCreate} className="pg-modal" autoComplete="off">
            <div className="pg-modal-head">
              <h2 className="pg-modal-title">{t('users.createTitle')}</h2>
            </div>
            <div className="pg-modal-body">
              <div className="sr-only" aria-hidden>
                <input type="text" name="prevent_autofill_user" autoComplete="username" tabIndex={-1} />
                <input type="password" name="prevent_autofill_pass" autoComplete="current-password" tabIndex={-1} />
              </div>
              <Field label={t('auth.email')} required>
                <input
                  type="email"
                  name="new_staff_email"
                  required
                  autoComplete="off"
                  readOnly
                  onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pg-input"
                />
              </Field>
              <Field label={t('auth.password')} required>
                <input
                  type="password"
                  name="new_staff_password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  readOnly
                  onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pg-input"
                />
              </Field>
              <Field label={t('auth.confirmPassword')} required>
                <input
                  type="password"
                  name="new_staff_password_confirm"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="pg-input"
                />
                {passwordConfirm.length > 0 && form.password !== passwordConfirm && (
                  <p className="mt-1 text-xs text-red-600">{t('users.passwordMismatch')}</p>
                )}
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
                  onChange={(e) => {
                    const role = e.target.value as UserRoleType;
                    const hq = orgs.find((o) => o.type === 'HEAD_OFFICE');
                    setForm({
                      ...form,
                      role,
                      organizationId:
                        role === 'ORGANIZER' ? (hq?.id ?? '') : form.organizationId,
                    });
                    if (role === 'ORGANIZER') setOrgMode('existing');
                  }}
                  className="pg-input"
                >
                  <option value="ORG_STAFF">{roleLabel('ORG_STAFF')}</option>
                  <option value="SETTLEMENT_ADMIN">{roleLabel('SETTLEMENT_ADMIN')}</option>
                  {canAssignOrganizer && <option value="ORGANIZER">{roleLabel('ORGANIZER')}</option>}
                </select>
              </Field>
              {form.role === 'ORGANIZER' ? (
                <p className="pg-hint">{t('users.organizerHqOnly')}</p>
              ) : null}
              {(form.role === 'ORG_STAFF' ||
                form.role === 'SETTLEMENT_ADMIN' ||
                form.role === 'ORGANIZER') && (
                <>
                  {form.role !== 'ORGANIZER' && (isSuperAdmin || me?.role === 'ORG_STAFF') && (
                    <Field label={t('users.orgStaff')} required>
                      <select
                        value={orgMode}
                        onChange={(e) => setOrgMode(e.target.value as 'existing' | 'new')}
                        className="pg-input"
                      >
                        <option value="existing">{t('users.orgExisting')}</option>
                        <option value="new">{t('users.orgNew')}</option>
                      </select>
                    </Field>
                  )}
                  {orgMode === 'existing' || form.role === 'ORGANIZER' ? (
                    <Field label={t('users.orgSelect')} required>
                      <select
                        required
                        value={form.organizationId}
                        onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
                        className="pg-input"
                      >
                        <option value="">{t('users.select')}</option>
                        {(form.role === 'ORGANIZER'
                          ? orgs.filter((o) => o.type === 'HEAD_OFFICE')
                          : orgs
                        ).map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} ({o.code}) · {orgTypeLabel(o.type)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <div className="pg-inset-panel">
                      <p className="pg-inset-title">{t('orgs.createTitle')}</p>
                      <p className="pg-hint mt-1 mb-2">{t('orgs.hierarchyHint')}</p>
                      <OrgCreateFields
                        orgs={orgs}
                        type={newOrgType}
                        parentId={newOrgParentId}
                        name={newOrgName}
                        onType={setNewOrgType}
                        onParentId={setNewOrgParentId}
                        onName={setNewOrgName}
                        allowRootHq={isSuperAdmin}
                      />
                    </div>
                  )}
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
              <button
                type="submit"
                className="pg-btn pg-btn-primary"
                disabled={form.password !== passwordConfirm}
              >
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
              {editing.role !== 'SUPER_ADMIN' && (
                <Field label={t('users.col.role')}>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value as UserRoleType })
                    }
                    className="pg-input"
                  >
                    <option value="ORG_STAFF">{roleLabel('ORG_STAFF')}</option>
                    <option value="SETTLEMENT_ADMIN">{roleLabel('SETTLEMENT_ADMIN')}</option>
                    {canAssignOrganizer && <option value="ORGANIZER">{roleLabel('ORGANIZER')}</option>}
                  </select>
                </Field>
              )}
              {editing.role === 'SUPER_ADMIN' && (
                <p className="pg-hint">{t('users.cannotCreateSuperAdmin')}</p>
              )}
              {editForm.role !== 'CUSTOMER' && editForm.role !== 'SUPER_ADMIN' && (
                <Field label={t('users.orgSelect')}>
                  <select
                    value={editForm.organizationId ?? ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, organizationId: e.target.value || null })
                    }
                    className="pg-input"
                  >
                    <option value="">{t('users.select')}</option>
                    {(editForm.role === 'ORGANIZER'
                      ? orgs.filter((o) => o.type === 'HEAD_OFFICE')
                      : orgs
                    ).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code}) · {orgTypeLabel(o.type)}
                      </option>
                    ))}
                  </select>
                </Field>
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
                  <p className="pg-hint mb-1 text-[11px]">{t('users.statusReasonInternalHint')}</p>
                  <textarea
                    required
                    rows={2}
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="pg-input min-h-[56px]"
                    placeholder={t('users.statusReasonInternalPlaceholder')}
                  />
                </Field>
              )}
              {statusChanging && editForm.isActive === false && (
                <Field label={t('users.loginNotice')}>
                  <p className="pg-hint mb-1 text-[11px]">{t('users.loginNoticeHint')}</p>
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
                    rows={3}
                    value={statusLoginNotice}
                    onChange={(e) => {
                      setStatusLoginNotice(e.target.value);
                      setStatusNoticePresetId(null);
                    }}
                    className="pg-input mt-2 min-h-[72px]"
                    placeholder={t('users.loginNoticePlaceholder')}
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
                        {log.loginNotice ? (
                          <div className="mt-0.5 text-slate-600">
                            {t('users.loginNotice')}:{' '}
                            {formatLoginNoticeDisplay(log.loginNotice, locale, inactivePresets)}
                          </div>
                        ) : null}
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

      {deleting && (
        <DoubleConfirmDialog
          title={t('users.deleteTitle')}
          step1={t('users.deleteStep1', { email: deleting.email })}
          step2={t('users.deleteStep2', { email: deleting.email })}
          onConfirm={confirmDeleteUser}
          onClose={() => setDeleting(null)}
        />
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

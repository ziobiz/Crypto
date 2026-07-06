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

const emptyCreate: CreateUserInput = {
  email: '',
  password: '',
  name: '',
  phone: '',
  role: 'ORG_STAFF',
  organizationId: '',
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const t = useT();
  const isSuperAdmin = me?.role === 'SUPER_ADMIN';

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

  function openEdit(u: ManagedUser) {
    setEditing(u);
    setEditForm({
      name: u.name,
      phone: u.phone ?? '',
      role: u.role,
      organizationId: u.organization?.id ?? null,
      isActive: u.isActive,
      recruitingOrgId: u.customerProfile?.recruitingOrg?.id,
    });
    setNewPassword('');
    setModal('edit');
    setMsg('');
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
    try {
      await api.users.update(editing.id, editForm);
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

  function orgLabel(u: ManagedUser) {
    if (u.organization) return `${u.organization.name} (${orgTypeLabel(u.organization.type)})`;
    if (u.customerProfile?.recruitingOrg) {
      return `${t('users.recruitPrefix')}: ${u.customerProfile.recruitingOrg.name}`;
    }
    return '—';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-gray-500 sm:text-xs">{t('users.subtitle')}</p>
        <button
          type="button"
          onClick={openCreate}
          className="rounded border border-blue-600 bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700 sm:text-xs"
        >
          {t('users.add')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder={t('users.search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRoleType | '');
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">{t('users.filter.active')}</option>
          <option value="true">{t('users.active')}</option>
          <option value="false">{t('users.inactive')}</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && !modal && <p className="text-sm text-green-700">{msg}</p>}

      <div className="table-scroll overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="pg-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('users.col.email')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('users.col.name')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('users.col.role')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('users.col.org')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('users.col.status')}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t('users.col.lastLogin')}</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">{t('users.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {t('common.loading')}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {t('users.empty')}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{roleLabel(u.role)}</td>
                  <td className="px-4 py-3">{orgLabel(u)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        u.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {u.isActive ? t('users.active') : t('users.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ko-KR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="text-blue-600 hover:underline"
                    >
                      {t('users.edit')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">{t('users.total', { n: total })}</p>

      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleCreate}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
          >
            <h2 className="text-lg font-bold">{t('users.createTitle')}</h2>
            <div className="mt-4 space-y-3">
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
                  <option value="CUSTOMER">{roleLabel('CUSTOMER')}</option>
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
                      {orgs
                        .filter((o) => o.type === 'SALES_OFFICE')
                        .map((o) => (
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
                </>
              )}
            </div>
            {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleUpdate}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
          >
            <h2 className="text-lg font-bold">{t('users.editTitle')}</h2>
            <p className="text-sm text-gray-500">{editing.email}</p>
            <div className="mt-4 space-y-3">
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
                <Field label={t('users.recruitOrg')}>
                  <select
                    value={editForm.recruitingOrgId ?? ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, recruitingOrgId: e.target.value })
                    }
                    className="pg-input"
                  >
                    {orgs
                      .filter((o) => o.type === 'SALES_OFFICE')
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                  </select>
                </Field>
              )}
              <Field label={t('users.col.status')}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.isActive ?? true}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  />
                  {t('users.accountActive')}
                </label>
              </Field>
              <Field label={t('users.resetPassword')}>
                <input
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pg-input"
                />
              </Field>
            </div>
            {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
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
    <label className="block text-sm">
      <span className="text-gray-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

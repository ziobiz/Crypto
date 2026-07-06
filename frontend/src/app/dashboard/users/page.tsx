'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import {
  api,
  type CreateUserInput,
  type ManagedUser,
  type Organization,
  type UpdateUserInput,
  type UserRoleType,
} from '@/lib/api';

const ROLE_LABELS: Record<UserRoleType, string> = {
  SUPER_ADMIN: '총본사 관리자',
  ORG_STAFF: '조직 직원',
  CUSTOMER: '고객',
};

const ORG_TYPE_LABELS: Record<string, string> = {
  HEAD_OFFICE: '본사',
  MASTER_DISTRIBUTOR: '총판',
  REGIONAL_BRANCH: '지사',
  AGENCY: '대리점',
  SALES_OFFICE: '영업점',
};

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
  const isSuperAdmin = me?.role === 'SUPER_ADMIN';

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
      setError(e instanceof Error ? e.message : '목록 불러오기 실패');
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
      setMsg('사용자가 등록되었습니다.');
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '등록 실패');
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
      setMsg('저장되었습니다.');
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '저장 실패');
    }
  }

  function orgLabel(u: ManagedUser) {
    if (u.organization) return `${u.organization.name} (${ORG_TYPE_LABELS[u.organization.type] ?? u.organization.type})`;
    if (u.customerProfile?.recruitingOrg) {
      return `유치: ${u.customerProfile.recruitingOrg.name}`;
    }
    return '—';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사용자관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            PG 사용자관리와 동일 — 계정 등록·수정·비활성화·비밀번호 재설정
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 사용자 등록
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="이메일·이름·연락처 검색"
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
          <option value="">전체 역할</option>
          {isSuperAdmin && <option value="SUPER_ADMIN">총본사 관리자</option>}
          <option value="ORG_STAFF">조직 직원</option>
          <option value="CUSTOMER">고객</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value as '' | 'true' | 'false');
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">전체 상태</option>
          <option value="true">활성</option>
          <option value="false">비활성</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && !modal && <p className="text-sm text-green-700">{msg}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">이메일</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">이름</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">역할</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">조직</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">상태</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">최종 로그인</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  불러오는 중…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  사용자가 없습니다.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[u.role]}</td>
                  <td className="px-4 py-3">{orgLabel(u)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        u.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {u.isActive ? '활성' : '비활성'}
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
                      수정
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">총 {total}명</p>

      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleCreate}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
          >
            <h2 className="text-lg font-bold">사용자 등록</h2>
            <div className="mt-4 space-y-3">
              <Field label="이메일" required>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="비밀번호" required>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="이름" required>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="연락처">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="역할" required>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRoleType })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  {isSuperAdmin && <option value="SUPER_ADMIN">총본사 관리자</option>}
                  <option value="ORG_STAFF">조직 직원</option>
                  <option value="CUSTOMER">고객</option>
                </select>
              </Field>
              {form.role === 'ORG_STAFF' && (
                <Field label="소속 조직" required>
                  <select
                    required
                    value={form.organizationId}
                    onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">선택</option>
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
                  <Field label="유치 영업점" required>
                    <select
                      required
                      value={form.recruitingOrgId}
                      onChange={(e) => setForm({ ...form, recruitingOrgId: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">선택</option>
                      {orgs
                        .filter((o) => o.type === 'SALES_OFFICE')
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="고객 유형">
                    <select
                      value={form.customerType ?? 'INDIVIDUAL'}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          customerType: e.target.value as 'INDIVIDUAL' | 'CORPORATE',
                        })
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="INDIVIDUAL">개인</option>
                      <option value="CORPORATE">기업</option>
                    </select>
                  </Field>
                </>
              )}
            </div>
            {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
                취소
              </button>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                등록
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
            <h2 className="text-lg font-bold">사용자 수정</h2>
            <p className="text-sm text-gray-500">{editing.email}</p>
            <div className="mt-4 space-y-3">
              <Field label="이름" required>
                <input
                  required
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="연락처">
                <input
                  value={editForm.phone ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </Field>
              {isSuperAdmin && (
                <Field label="역할">
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value as UserRoleType })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="SUPER_ADMIN">총본사 관리자</option>
                    <option value="ORG_STAFF">조직 직원</option>
                    <option value="CUSTOMER">고객</option>
                  </select>
                </Field>
              )}
              {editForm.role === 'ORG_STAFF' && (
                <Field label="소속 조직">
                  <select
                    value={editForm.organizationId ?? ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, organizationId: e.target.value || null })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">선택</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              {editForm.role === 'CUSTOMER' && (
                <Field label="유치 영업점">
                  <select
                    value={editForm.recruitingOrgId ?? ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, recruitingOrgId: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
              <Field label="상태">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editForm.isActive ?? true}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  />
                  활성 계정
                </label>
              </Field>
              <Field label="비밀번호 재설정 (6자 이상, 비우면 유지)">
                <input
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </Field>
            </div>
            {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
                취소
              </button>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                저장
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

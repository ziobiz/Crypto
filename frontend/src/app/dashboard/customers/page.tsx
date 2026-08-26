'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  hqPolicyApi,
  type CreateUserInput,
  type CustomerFeeShare,
  type ManagedUser,
  type Organization,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { WALLET_NETWORKS } from '@/constants/wallet-networks';
import { CustomerFeeShareEditor, emptyFeeShare, feeShareFromHq } from '@/components/CustomerFeeShareEditor';
import { escrowShareTotalsMatch, formatEscrowShareMismatch, parseEscrowShareMismatch } from '@/lib/escrow-share-totals';
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
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<CreateUserInput>(emptyCreate);
  const [feeShare, setFeeShare] = useState<CustomerFeeShare>(emptyFeeShare());

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      const check = escrowShareTotalsMatch(feeShare);
      if (!check.ok) {
        const text = formatEscrowShareMismatch(t, check);
        window.alert(text);
        setMsg(text);
        return;
      }
      await api.users.create({ ...form, role: 'CUSTOMER', feeShare });
      setModal(false);
      setForm(emptyCreate);
      setMsg(t('customers.created'));
      load();
    } catch (err) {
      const raw = err instanceof Error ? err.message : t('users.createFailed');
      const parsed = parseEscrowShareMismatch(raw);
      const text = parsed ? formatEscrowShareMismatch(t, parsed) : raw;
      if (parsed) window.alert(text);
      setMsg(text);
    }
  }

  return (
    <div className="pg-stack">
      <div className="pg-toolbar">
        <p className="pg-hint">{t('customers.subtitle')}</p>
        {canRegisterCustomer && (
          <button
            type="button"
            onClick={() => {
              setForm(emptyCreate);
              setFeeShare(emptyFeeShare());
              setModal(true);
              setMsg('');
              hqPolicyApi
                .getCommission()
                .then((c) => setFeeShare(feeShareFromHq(c.orgShare)))
                .catch(console.error);
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
              <th>{t('customers.col.kyc')}</th>
              <th>{t('users.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="pg-empty">
                  {t('common.loading')}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="pg-empty">
                  {t('customers.empty')}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  {...detailRowProps(t('table.dblclickHint'), () => router.push(`/dashboard/customers/${u.id}`))}
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
                    <span className={`pg-badge ${kycBadgeClass(u.kyc?.status)}`}>
                      {t(kycStatusKey(u.kyc?.status))}
                    </span>
                  </td>
                  <td>
                    <Link href={`/dashboard/customers/${u.id}`} className="pg-link">
                      {t('customers.openKyc')}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="pg-hint">{t('users.total', { n: total })} · {t('table.dblclickHint')}</p>

      {modal && (
        <div className="pg-modal-overlay">
          <form onSubmit={handleCreate} className="pg-modal">
            <div className="pg-modal-head">
              <h2 className="pg-modal-title">{t('customers.createTitle')}</h2>
            </div>
            <div className="pg-modal-body">
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
                <p className="pg-inset-title">{t('feeShare.title')}</p>
                <div className="mt-2">
                  <CustomerFeeShareEditor value={feeShare} onChange={setFeeShare} canEdit />
                </div>
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
              <button type="button" onClick={() => setModal(false)} className="pg-btn pg-btn-secondary">
                {t('common.cancel')}
              </button>
              <button type="submit" className="pg-btn pg-btn-primary">
                {t('common.register')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

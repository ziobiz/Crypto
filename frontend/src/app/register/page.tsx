'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, SalesOffice } from '@/lib/api';
import { useT } from '@/context/LocaleProvider';
import { AuthChrome } from '@/components/layout/AuthChrome';
import { useBranding } from '@/hooks/useBranding';
import {
  CustomerBankAccountsForm,
  emptyBankAccounts,
  filledBankAccounts,
} from '@/components/CustomerBankAccountsForm';
import { WALLET_NETWORKS } from '@/constants/wallet-networks';

export default function RegisterPage() {
  const router = useRouter();
  const t = useT();
  const branding = useBranding();
  const [offices, setOffices] = useState<SalesOffice[]>([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [form, setForm] = useState({
    email: '',
    emailCode: '',
    name: '',
    phone: '',
    customerType: 'INDIVIDUAL' as 'INDIVIDUAL' | 'CORPORATE',
    recruitingOrgId: '',
    businessName: '',
    businessNumber: '',
    bankAccounts: emptyBankAccounts(),
    walletAddress: '',
    walletNetwork: 'TRC20',
    walletLabel: '',
  });

  useEffect(() => {
    api.branding().then((b) => {
      if (b.customerRegistrationEnabled !== true) {
        router.replace('/login');
      }
    }).catch(() => router.replace('/login'));
    api.salesOffices().then(setOffices).catch(console.error);
  }, [router]);

  const sendCode = async () => {
    setError('');
    if (!form.email || !form.name) {
      setError(t('auth.registerFailed'));
      return;
    }
    setLoading(true);
    try {
      await api.registerSendCode(form.email, form.name);
      setCodeSent(true);
      setInfo(t('auth.otpEnrollEmailSent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const banks = filledBankAccounts(form.bankAccounts);
    if (banks.length === 0) {
      setError(t('register.bankRequired'));
      return;
    }
    if (!form.walletAddress.trim()) {
      setError(t('register.walletRequired'));
      return;
    }
    setLoading(true);
    try {
      await api.register({
        email: form.email,
        emailCode: form.emailCode,
        name: form.name,
        phone: form.phone || undefined,
        customerType: form.customerType,
        recruitingOrgId: form.recruitingOrgId,
        businessName: form.businessName || undefined,
        businessNumber: form.businessNumber || undefined,
        bankAccounts: banks,
        walletAddress: form.walletAddress.trim(),
        walletNetwork: form.walletNetwork,
        walletLabel: form.walletLabel || undefined,
      });
      setInfo(t('auth.registerComplete'));
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthChrome branding={branding}>
      <div className="w-full">
        <h2 className="text-xl font-bold sm:text-2xl">{t('auth.registerCustomerTitle')}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Field label={t('auth.email')} value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label={t('auth.registerEmailCode')} value={form.emailCode} onChange={(v) => setForm({ ...form, emailCode: v })} />
            </div>
            <button type="button" onClick={sendCode} disabled={loading} className="mt-5 shrink-0 rounded-lg border border-blue-200 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50">
              {t('auth.sendEmailCode')}
            </button>
          </div>
          {codeSent && <p className="text-sm text-green-700">{info}</p>}
          <Field label={t('auth.name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label={t('auth.phone')} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} optional />
          <div>
            <label className="block text-sm font-medium">{t('auth.customerType')}</label>
            <select
              value={form.customerType}
              onChange={(e) => setForm({ ...form, customerType: e.target.value as 'INDIVIDUAL' | 'CORPORATE' })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="INDIVIDUAL">{t('auth.individual')}</option>
              <option value="CORPORATE">{t('auth.corporateMerchant')}</option>
            </select>
          </div>
          {form.customerType === 'CORPORATE' && (
            <>
              <Field label={t('auth.businessName')} value={form.businessName} onChange={(v) => setForm({ ...form, businessName: v })} />
              <Field label={t('auth.businessNumber')} value={form.businessNumber} onChange={(v) => setForm({ ...form, businessNumber: v })} />
            </>
          )}
          <div>
            <label className="block text-sm font-medium">{t('auth.salesOffice')}</label>
            <select
              value={form.recruitingOrgId}
              onChange={(e) => setForm({ ...form, recruitingOrgId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="">{t('users.select')}</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
              ))}
            </select>
          </div>

          <CustomerBankAccountsForm
            accounts={form.bankAccounts}
            accountHolderDefault={form.name}
            onChange={(bankAccounts) => setForm({ ...form, bankAccounts })}
          />

          <div className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
            <p className="text-xs font-semibold text-emerald-900">{t('users.walletSection')}</p>
            <Field label={t('wallets.label')} value={form.walletLabel} onChange={(v) => setForm({ ...form, walletLabel: v })} optional />
            <Field label={t('wallets.address')} value={form.walletAddress} onChange={(v) => setForm({ ...form, walletAddress: v })} />
            <div>
              <label className="block text-sm font-medium">{t('users.walletNetwork')}</label>
              <select
                value={form.walletNetwork}
                onChange={(e) => setForm({ ...form, walletNetwork: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              >
                {WALLET_NETWORKS.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 py-2.5 text-sm text-white disabled:opacity-50">
            {loading ? t('auth.registering') : t('auth.registerSubmit')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline">{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </AuthChrome>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        required={!optional}
      />
    </div>
  );
}

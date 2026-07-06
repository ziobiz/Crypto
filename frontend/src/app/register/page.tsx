'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, SalesOffice } from '@/lib/api';
import { useT } from '@/context/LocaleProvider';
import { AuthChrome } from '@/components/layout/AuthChrome';
import { useBranding } from '@/hooks/useBranding';

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
  });

  useEffect(() => {
    api.salesOffices().then(setOffices).catch(console.error);
  }, []);

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
    setLoading(true);
    try {
      await api.register(form);
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
        <p className="mt-1 text-xs text-gray-500">{t('auth.initialPasswordHint')}</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label={t('auth.email')} value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label={t('auth.registerEmailCode')} value={form.emailCode} onChange={(v) => setForm({ ...form, emailCode: v })} />
            </div>
            <button type="button" onClick={sendCode} disabled={loading} className="mt-6 shrink-0 rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50">
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
              required
            >
              <option value="">{t('users.select')}</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 py-3 text-white disabled:opacity-50">
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
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
        required={!optional}
      />
    </div>
  );
}

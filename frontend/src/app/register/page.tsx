'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, SalesOffice, setToken } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [offices, setOffices] = useState<SalesOffice[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.register(form);
      setToken(res.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">고객 회원가입</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="이메일" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
          <Field label="비밀번호" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
          <Field label="이름" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="연락처" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <div>
            <label className="block text-sm font-medium">고객 유형</label>
            <select
              value={form.customerType}
              onChange={(e) => setForm({ ...form, customerType: e.target.value as 'INDIVIDUAL' | 'CORPORATE' })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="INDIVIDUAL">개인</option>
              <option value="CORPORATE">기업 (가맹점)</option>
            </select>
          </div>
          {form.customerType === 'CORPORATE' && (
            <>
              <Field label="상호명" value={form.businessName} onChange={(v) => setForm({ ...form, businessName: v })} />
              <Field label="사업자번호" value={form.businessNumber} onChange={(v) => setForm({ ...form, businessNumber: v })} />
            </>
          )}
          <div>
            <label className="block text-sm font-medium">유치 영업점</label>
            <select
              value={form.recruitingOrgId}
              onChange={(e) => setForm({ ...form, recruitingOrgId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="">선택</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">로그인으로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required={type !== 'text' || label !== '연락처'} />
    </div>
  );
}

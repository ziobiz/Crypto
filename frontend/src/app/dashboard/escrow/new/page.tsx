'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import { api } from '@/lib/api';

export default function EscrowNewPage() {
  const router = useRouter();
  const t = useT();
  const [form, setForm] = useState({ sellerEmail: 'seller@example.com', title: '', description: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticket = await api.escrow.create({
        sellerEmail: form.sellerEmail,
        title: form.title,
        description: form.description || undefined,
        amount: parseFloat(form.amount),
      });
      router.push(`/dashboard/escrow/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('escrow.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="pg-label">{t('escrow.sellerEmail')}</label>
          <input value={form.sellerEmail} onChange={(e) => setForm({ ...form, sellerEmail: e.target.value })} className="pg-input mt-1" required />
        </div>
        <div>
          <label className="pg-label">{t('escrow.tradeTitle')}</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="pg-input mt-1" required />
        </div>
        <div>
          <label className="pg-label">{t('escrow.tradeDesc')}</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="pg-input mt-1" rows={3} />
        </div>
        <div>
          <label className="pg-label">{t('escrow.tradeAmount')}</label>
          <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="pg-input mt-1" min="1" required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-6 py-2 text-sm text-white disabled:opacity-50">
          {loading ? t('escrow.creating') : t('escrow.createSubmit')}
        </button>
      </form>
    </div>
  );
}

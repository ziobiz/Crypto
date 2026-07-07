'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';
import { api, EscrowFeePreview } from '@/lib/api';
import { ContentCard } from '@/components/layout/ContentCard';
import { formatCurrency } from '@/lib/format';

const ESCROW_CURRENCIES = ['KRW', 'USD', 'JPY', 'THB', 'CNY', 'USDT'] as const;

export default function EscrowNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const retryParentId = searchParams.get('retry');
  const t = useT();
  const [form, setForm] = useState({
    myRole: 'BUYER' as 'BUYER' | 'SELLER',
    counterpartyEmail: '',
    title: '',
    description: '',
    escrowTerms: '',
    amount: '',
    currency: 'KRW',
    deliveryTerms: '',
    deliveryDeadline: '',
  });
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [memberInfo, setMemberInfo] = useState<string | null>(null);
  const [memberError, setMemberError] = useState('');
  const [feePreview, setFeePreview] = useState<EscrowFeePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const amount = parseFloat(form.amount) || 0;

  useEffect(() => {
    if (amount <= 0) {
      setFeePreview(null);
      return;
    }
    api.escrow.previewFees(amount, form.currency).then(setFeePreview).catch(() => setFeePreview(null));
  }, [amount, form.currency]);

  const lookupMember = async () => {
    setMemberError('');
    setMemberInfo(null);
    if (!form.counterpartyEmail) return;
    try {
      const res = await api.escrow.lookupMember(form.counterpartyEmail);
      if (res.found && res.member) {
        const typeLabel = res.member.customerType === 'CORPORATE' ? t('auth.corporate') : t('auth.individual');
        setMemberInfo(`${res.member.name} (${typeLabel})`);
      } else {
        setMemberError(t('escrow.memberNotFound'));
      }
    } catch {
      setMemberError(t('escrow.memberNotFound'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disclaimerAccepted || amount <= 0) return;
    setLoading(true);
    setError('');
    try {
      const ticket = await api.escrow.create({
        counterpartyEmail: form.counterpartyEmail,
        myRole: form.myRole,
        title: form.title,
        description: form.description || undefined,
        escrowTerms: form.escrowTerms || undefined,
        amount,
        currency: form.currency,
        deliveryTerms: form.deliveryTerms || undefined,
        deliveryDeadline: form.deliveryDeadline || undefined,
        disclaimerAccepted: true,
        retryParentTicketId: retryParentId ?? undefined,
      });
      router.push(`/dashboard/escrow/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('escrow.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pg-stack">
      <p className="pg-hint">{t('escrow.flowHint')}</p>
      {retryParentId && <p className="text-sm text-amber-800">{t('escrow.detail.retry')}</p>}

      <div className="pg-callout pg-callout-warn">
        <p className="text-sm">{t('escrow.disclaimerText')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
        <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-3">
          <ContentCard title={t('escrow.newTitle')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="pg-label">{t('escrow.myRole')}</span>
                <select
                  value={form.myRole}
                  onChange={(e) => setForm({ ...form, myRole: e.target.value as 'BUYER' | 'SELLER' })}
                  className="pg-input mt-1 w-full"
                >
                  <option value="BUYER">{t('escrow.roleBuyer')}</option>
                  <option value="SELLER">{t('escrow.roleSeller')}</option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="pg-label">{t('escrow.counterpartyEmail')}</span>
                <div className="mt-1 flex gap-2">
                  <input
                    type="email"
                    value={form.counterpartyEmail}
                    onChange={(e) => {
                      setForm({ ...form, counterpartyEmail: e.target.value });
                      setMemberInfo(null);
                      setMemberError('');
                    }}
                    className="pg-input w-full flex-1"
                    required
                  />
                  <button type="button" onClick={lookupMember} className="pg-btn pg-btn-secondary shrink-0">
                    {t('escrow.memberLookup')}
                  </button>
                </div>
                {memberInfo && <p className="mt-1 text-sm text-green-700">{t('escrow.memberFound', { name: memberInfo })}</p>}
                {memberError && <p className="mt-1 text-sm text-red-600">{memberError}</p>}
              </label>

              <label className="block sm:col-span-2">
                <span className="pg-label">{t('escrow.tradeTitle')}</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="pg-input mt-1 w-full" required />
              </label>

              <label className="block sm:col-span-2">
                <span className="pg-label">{t('escrow.escrowTerms')}</span>
                <textarea value={form.escrowTerms} onChange={(e) => setForm({ ...form, escrowTerms: e.target.value })} className="pg-input mt-1 w-full" rows={3} />
              </label>

              <label className="block sm:col-span-2">
                <span className="pg-label">{t('escrow.tradeDesc')}</span>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="pg-input mt-1 w-full" rows={2} />
              </label>

              <label className="block">
                <span className="pg-label">{t('escrow.tradeCurrency')}</span>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="pg-input mt-1 w-full">
                  {ESCROW_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="pg-label">{t('escrow.tradeAmount')}</span>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="pg-input mt-1 w-full" min="1" step="any" required />
              </label>

              <label className="block sm:col-span-2">
                <span className="pg-label">{t('escrow.deliveryTerms')}</span>
                <input value={form.deliveryTerms} onChange={(e) => setForm({ ...form, deliveryTerms: e.target.value })} className="pg-input mt-1 w-full" />
              </label>

              <label className="block sm:col-span-2">
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={disclaimerAccepted} onChange={(e) => setDisclaimerAccepted(e.target.checked)} className="mt-1" />
                  <span>{t('escrow.disclaimer')}</span>
                </label>
              </label>

              {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}

              <div className="sm:col-span-2">
                <button type="submit" disabled={loading || !disclaimerAccepted || amount <= 0} className="pg-btn pg-btn-primary disabled:opacity-50">
                  {loading ? t('escrow.creating') : t('escrow.createSubmit')}
                </button>
              </div>
            </div>
          </ContentCard>
        </form>

        <ContentCard title={t('escrow.feePreview')} className="lg:col-span-2">
          {feePreview ? (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">{t('escrow.detail.amount')}</dt>
                <dd className="font-medium">{formatCurrency(feePreview.amount, feePreview.currency)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('escrow.netToSeller')}</dt>
                <dd className="font-semibold text-blue-700">{formatCurrency(feePreview.netToSeller, feePreview.currency)}</dd>
              </div>
            </dl>
          ) : (
            <p className="pg-hint">{t('escrow.tradeAmount')}</p>
          )}
        </ContentCard>
      </div>
    </div>
  );
}

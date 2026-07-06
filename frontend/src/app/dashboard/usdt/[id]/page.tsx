'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, UsdtTicket } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { AttachmentLink } from '@/components/AttachmentLink';

export default function UsdtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const t = useT();
  const [ticket, setTicket] = useState<UsdtTicket | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [depositTime, setDepositTime] = useState('');
  const [txId, setTxId] = useState('');
  const [actualUsdt, setActualUsdt] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => api.usdt.get(id).then(setTicket).catch(console.error);
  useEffect(() => { load(); }, [id]);

  if (!ticket) return <p className="text-gray-500">{t('common.loading')}</p>;

  const isOperator = user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_STAFF';
  const isCustomer = user?.role === 'CUSTOMER';

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await api.usdt.uploadDepositProof(id, file, {
        depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
        depositorName: depositorName || undefined,
        depositTransferredAt: depositTime || undefined,
      });
      await load();
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (status: string, extra?: Record<string, string | number>) => {
    setLoading(true);
    try {
      await api.usdt.updateStatus(id, { status, ...extra });
      await load();
    } finally {
      setLoading(false);
    }
  };

  const rateLabel = `1 USDT = ${ticket.exchangeRate.toLocaleString()} ${ticket.fiatCurrency}`;
  const expectedRange =
    ticket.expectedUsdtMin != null && ticket.expectedUsdtMax != null
      ? `${ticket.expectedUsdtMin.toFixed(4)} ~ ${ticket.expectedUsdtMax.toFixed(4)} USDT`
      : `${ticket.expectedUsdtAmount.toFixed(4)} USDT`;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{ticket.ticketNo}</h1>
        <StatusBadge status={ticket.status} />
      </div>

      <dl className="mt-6 grid gap-4 rounded-xl border bg-white p-6 text-sm sm:grid-cols-2">
        <Item label={t('usdt.detail.fiatAmount')} value={formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)} />
        <Item label={t('usdt.detail.rate')} value={rateLabel} />
        <Item label={t('usdt.detail.expected')} value={expectedRange} />
        <Item label={t('usdt.detail.fees')} value={`${ticket.gasFeeSnapshot} / ${ticket.platformFeeSnapshot} USDT`} />
        {ticket.depositAmount != null && (
          <Item label={t('usdt.detail.depositAmount')} value={formatCurrency(ticket.depositAmount, ticket.fiatCurrency)} />
        )}
        {ticket.depositorName && <Item label={t('usdt.detail.depositor')} value={ticket.depositorName} />}
        {ticket.depositTransferredAt && (
          <Item label={t('usdt.detail.depositTime')} value={formatDate(ticket.depositTransferredAt)} />
        )}
        {ticket.usdtTxId && <Item label="TXID" value={ticket.usdtTxId} />}
        {ticket.actualUsdtAmount != null && (
          <Item label={t('usdt.detail.actualUsdt')} value={`${ticket.actualUsdtAmount} USDT`} />
        )}
        {ticket.wallet && <Item label={t('usdt.wallet')} value={`${ticket.wallet.address} (${ticket.wallet.network})`} />}
        <Item label={t('usdt.col.date')} value={formatDate(ticket.createdAt)} />
      </dl>

      {ticket.status === 'COMPLETED' && (
        <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          {t('usdt.detail.receiptSent')}
        </div>
      )}

      {isCustomer && ticket.status === 'DEPOSIT_PROOF_PENDING' && (
        <div className="mt-6 rounded-xl border bg-white p-6">
          <h2 className="font-semibold">{t('usdt.detail.depositInfo')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('usdt.detail.depositInfoDesc')}</p>
          <div className="mt-4 space-y-3">
            <input
              type="number"
              placeholder={t('usdt.detail.depositAmount')}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder={t('usdt.detail.depositor')}
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={depositTime}
              onChange={(e) => setDepositTime(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
            <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </div>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {t('usdt.detail.submitReceipt')}
          </button>
        </div>
      )}

      {isOperator && (
        <div className="mt-6 rounded-xl border bg-white p-6">
          <h2 className="font-semibold">{t('usdt.detail.admin')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('usdt.detail.adminDesc')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ticket.status === 'ADMIN_REVIEWING' && (
              <button
                onClick={() => handleStatus('TRANSFER_IN_PROGRESS')}
                disabled={loading}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white"
              >
                {t('usdt.detail.startTransfer')}
              </button>
            )}
            {ticket.status === 'TRANSFER_IN_PROGRESS' && (
              <>
                <input
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  placeholder="USDT TXID"
                  className="rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  value={actualUsdt}
                  onChange={(e) => setActualUsdt(e.target.value)}
                  placeholder={t('usdt.detail.actualUsdt')}
                  className="rounded-lg border px-3 py-2 text-sm"
                />
                <button
                  onClick={() =>
                    handleStatus('COMPLETED', {
                      usdtTxId: txId,
                      ...(actualUsdt ? { actualUsdtAmount: parseFloat(actualUsdt) } : {}),
                    })
                  }
                  disabled={loading || !txId}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white"
                >
                  {t('usdt.detail.complete')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {ticket.attachments.length > 0 && (
        <div className="mt-6 rounded-xl border bg-white p-6">
          <h2 className="font-semibold">{t('usdt.detail.attachments')}</h2>
          <ul className="mt-3 space-y-2">
            {ticket.attachments.map((a) => (
              <li key={a.id}><AttachmentLink attachment={a} /></li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="font-semibold">{t('usdt.detail.history')}</h2>
        <ol className="mt-3 space-y-3">
          {ticket.statusHistory.map((h) => (
            <li key={h.id} className="border-l-2 border-blue-200 pl-4 text-sm">
              <StatusBadge status={h.toStatus} />
              <p className="mt-1 text-gray-500">{h.changedBy.name} · {formatDate(h.createdAt)}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="mt-1 font-medium break-all">{value}</dd>
    </div>
  );
}

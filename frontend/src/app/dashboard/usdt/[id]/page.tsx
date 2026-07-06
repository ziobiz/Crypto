'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { api, UsdtTicket } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { AttachmentLink } from '@/components/AttachmentLink';

export default function UsdtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<UsdtTicket | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => api.usdt.get(id).then(setTicket).catch(console.error);
  useEffect(() => { load(); }, [id]);

  if (!ticket) return <p className="text-gray-500">로딩 중...</p>;

  const isAdmin = user?.role === 'SUPER_ADMIN';
  const isCustomer = user?.role === 'CUSTOMER';

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await api.usdt.uploadDepositProof(id, file);
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

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{ticket.ticketNo}</h1>
        <StatusBadge status={ticket.status} />
      </div>

      <dl className="mt-6 grid gap-4 rounded-xl border bg-white p-6 text-sm sm:grid-cols-2">
        <Item label="매입 금액" value={formatCurrency(ticket.fiatAmount, ticket.fiatCurrency)} />
        <Item label="환율" value={`1 USDT = ${ticket.exchangeRate.toLocaleString()} KRW`} />
        <Item label="예상 USDT" value={`${ticket.expectedUsdtAmount.toFixed(4)} USDT`} />
        <Item label="가스비/플랫폼" value={`${ticket.gasFeeSnapshot} / ${ticket.platformFeeSnapshot} USDT`} />
        {ticket.usdtTxId && <Item label="TXID" value={ticket.usdtTxId} />}
        {ticket.wallet && <Item label="수령 지갑" value={`${ticket.wallet.address} (${ticket.wallet.network})`} />}
        <Item label="신청일" value={formatDate(ticket.createdAt)} />
      </dl>

      {isCustomer && ticket.status === 'DEPOSIT_PROOF_PENDING' && (
        <div className="mt-6 rounded-xl border bg-white p-6">
          <h2 className="font-semibold">입금 증빙 업로드</h2>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-3 text-sm" />
          <button onClick={handleUpload} disabled={!file || loading} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
            영수증 제출
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="mt-6 rounded-xl border bg-white p-6">
          <h2 className="font-semibold">관리자 처리</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ticket.status === 'ADMIN_REVIEWING' && (
              <button onClick={() => handleStatus('TRANSFER_IN_PROGRESS')} disabled={loading} className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white">
                송금 처리 시작
              </button>
            )}
            {ticket.status === 'TRANSFER_IN_PROGRESS' && (
              <>
                <input value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="USDT TXID" className="rounded-lg border px-3 py-2 text-sm" />
                <button onClick={() => handleStatus('COMPLETED', { usdtTxId: txId })} disabled={loading || !txId} className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white">
                  거래 완료
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {ticket.attachments.length > 0 && (
        <div className="mt-6 rounded-xl border bg-white p-6">
          <h2 className="font-semibold">증빙 파일</h2>
          <ul className="mt-3 space-y-2">
            {ticket.attachments.map((a) => (
              <li key={a.id}><AttachmentLink attachment={a} /></li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="font-semibold">상태 이력</h2>
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
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

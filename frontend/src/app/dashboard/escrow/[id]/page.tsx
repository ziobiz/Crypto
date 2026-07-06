'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { api, EscrowTicket } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { AttachmentLink } from '@/components/AttachmentLink';

export default function EscrowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<EscrowTicket | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [payoutTxId, setPayoutTxId] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => api.escrow.get(id).then(setTicket).catch(console.error);
  useEffect(() => { load(); }, [id]);

  if (!ticket) return <p className="text-gray-500">로딩 중...</p>;

  const isAdmin = user?.role === 'SUPER_ADMIN';
  const isBuyer = user?.id === ticket.buyer.id;
  const isSeller = user?.id === ticket.seller.id;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{ticket.ticketNo}</h1>
        <StatusBadge status={ticket.status} />
      </div>
      <p className="mt-2 text-lg font-medium">{ticket.title}</p>
      {ticket.description && <p className="text-gray-600">{ticket.description}</p>}

      <dl className="mt-6 grid gap-4 rounded-xl border bg-white p-6 text-sm sm:grid-cols-2">
        <Item label="거래 금액" value={formatCurrency(ticket.amount, ticket.currency)} />
        <Item label="구매자" value={`${ticket.buyer.name} (${ticket.buyer.email})`} />
        <Item label="판매자" value={`${ticket.seller.name} (${ticket.seller.email})`} />
        <Item label="수수료 풀" value={formatCurrency(ticket.totalCommissionPool, ticket.currency)} />
        {ticket.payoutTxId && <Item label="송금 TXID" value={ticket.payoutTxId} />}
        <Item label="생성일" value={formatDate(ticket.createdAt)} />
      </dl>

      {isBuyer && ticket.status === 'BUYER_DEPOSIT_PROOF' && (
        <ActionBox title="구매자 입금 증빙">
          <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          <button onClick={async () => { if (!file) return; setLoading(true); await api.escrow.uploadBuyerDeposit(id, file); await load(); setLoading(false); }} disabled={!file || loading} className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
            입금 영수증 제출
          </button>
        </ActionBox>
      )}

      {isAdmin && ticket.status === 'BUYER_DEPOSIT_PROOF' && ticket.attachments.some((a) => a.purpose === 'FIAT_DEPOSIT_RECEIPT') && (
        <ActionBox title="관리자 — 입금 확인">
          <button onClick={async () => { setLoading(true); await api.escrow.updateStatus(id, { status: 'ADMIN_DEPOSIT_CONFIRMED' }); await load(); setLoading(false); }} disabled={loading} className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white">
            입금 확인 완료
          </button>
        </ActionBox>
      )}

      {isSeller && ticket.status === 'ADMIN_DEPOSIT_CONFIRMED' && (
        <ActionBox title="판매자 — 이행 증빙">
          <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          <button onClick={async () => { if (!file) return; setLoading(true); await api.escrow.uploadSellerFulfillment(id, file); await load(); setLoading(false); }} disabled={!file || loading} className="mt-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white">
            발송 증빙 제출
          </button>
        </ActionBox>
      )}

      {isBuyer && ticket.status === 'SELLER_FULFILLMENT_PROOF' && (
        <ActionBox title="구매자 — 수령 확인">
          <button onClick={async () => { setLoading(true); await api.escrow.buyerApproval(id); await load(); setLoading(false); }} disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
            수령 확인 (최종 승인)
          </button>
        </ActionBox>
      )}

      {isAdmin && ticket.status === 'BUYER_FINAL_APPROVAL' && (
        <ActionBox title="관리자 — 에스크로 완료">
          <input value={payoutTxId} onChange={(e) => setPayoutTxId(e.target.value)} placeholder="판매자 송금 TXID" className="rounded-lg border px-3 py-2 text-sm" />
          <button onClick={async () => { setLoading(true); await api.escrow.updateStatus(id, { status: 'ESCROW_COMPLETED', payoutTxId }); await load(); setLoading(false); }} disabled={loading || !payoutTxId} className="mt-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white">
            에스크로 완료
          </button>
        </ActionBox>
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
  return (<div><dt className="text-gray-500">{label}</dt><dd className="mt-0.5 font-medium">{value}</dd></div>);
}

function ActionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div className="mt-6 rounded-xl border bg-white p-6"><h2 className="font-semibold">{title}</h2><div className="mt-3">{children}</div></div>);
}

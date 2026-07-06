const STATUS_LABELS: Record<string, string> = {
  APPLICATION_COMPLETED: '신청 완료',
  DEPOSIT_PROOF_PENDING: '입금 증빙 대기',
  ADMIN_REVIEWING: '관리자 확인 중',
  TRANSFER_IN_PROGRESS: '송금 처리 중',
  COMPLETED: '거래 완료',
  CANCELLED: '취소',
  ESCROW_CREATED: '에스크로 생성',
  BUYER_DEPOSIT_PROOF: '구매자 입금 증빙',
  ADMIN_DEPOSIT_CONFIRMED: '관리자 입금 확인',
  SELLER_FULFILLMENT_PROOF: '판매자 이행 증빙',
  BUYER_FINAL_APPROVAL: '구매자 최종 승인',
  ESCROW_COMPLETED: '에스크로 완료',
  DISPUTED: '분쟁',
};

const STATUS_COLORS: Record<string, string> = {
  APPLICATION_COMPLETED: 'bg-blue-100 text-blue-800',
  DEPOSIT_PROOF_PENDING: 'bg-yellow-100 text-yellow-800',
  ADMIN_REVIEWING: 'bg-orange-100 text-orange-800',
  TRANSFER_IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  ESCROW_CREATED: 'bg-blue-100 text-blue-800',
  BUYER_DEPOSIT_PROOF: 'bg-yellow-100 text-yellow-800',
  ADMIN_DEPOSIT_CONFIRMED: 'bg-orange-100 text-orange-800',
  SELLER_FULFILLMENT_PROOF: 'bg-purple-100 text-purple-800',
  BUYER_FINAL_APPROVAL: 'bg-indigo-100 text-indigo-800',
  ESCROW_COMPLETED: 'bg-green-100 text-green-800',
  DISPUTED: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

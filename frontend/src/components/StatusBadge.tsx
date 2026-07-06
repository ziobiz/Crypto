'use client';

import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';

const STATUS_KEYS: Record<string, MessageKey> = {
  APPLICATION_COMPLETED: 'status.APPLICATION_COMPLETED',
  DEPOSIT_PROOF_PENDING: 'status.DEPOSIT_PROOF_PENDING',
  ADMIN_REVIEWING: 'status.ADMIN_REVIEWING',
  TRANSFER_IN_PROGRESS: 'status.TRANSFER_IN_PROGRESS',
  COMPLETED: 'status.COMPLETED',
  CANCELLED: 'status.CANCELLED',
  ESCROW_CREATED: 'status.ESCROW_CREATED',
  BUYER_DEPOSIT_PROOF: 'status.BUYER_DEPOSIT_PROOF',
  ADMIN_DEPOSIT_CONFIRMED: 'status.ADMIN_DEPOSIT_CONFIRMED',
  SELLER_FULFILLMENT_PROOF: 'status.SELLER_FULFILLMENT_PROOF',
  BUYER_FINAL_APPROVAL: 'status.BUYER_FINAL_APPROVAL',
  ESCROW_COMPLETED: 'status.ESCROW_COMPLETED',
  DISPUTED: 'status.DISPUTED',
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
  const t = useT();
  const key = STATUS_KEYS[status];
  const label = key ? t(key) : status;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {label}
    </span>
  );
}

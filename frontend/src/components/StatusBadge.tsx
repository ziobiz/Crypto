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
  SELLER_ACCEPTED: 'status.SELLER_ACCEPTED',
  CONTRACT_CONFIRMED: 'status.CONTRACT_CONFIRMED',
  SHIPPING_STARTED: 'status.SHIPPING_STARTED',
  PAYOUT_SCHEDULED: 'status.PAYOUT_SCHEDULED',
  VOIDED: 'status.VOIDED',
  BUYER_DEPOSIT_PROOF: 'status.BUYER_DEPOSIT_PROOF',
  ADMIN_DEPOSIT_CONFIRMED: 'status.ADMIN_DEPOSIT_CONFIRMED',
  SELLER_FULFILLMENT_PROOF: 'status.SELLER_FULFILLMENT_PROOF',
  BUYER_FINAL_APPROVAL: 'status.BUYER_FINAL_APPROVAL',
  ESCROW_COMPLETED: 'status.ESCROW_COMPLETED',
  DISPUTED: 'status.DISPUTED',
};

const STATUS_BADGE: Record<string, string> = {
  APPLICATION_COMPLETED: 'pg-badge-info',
  DEPOSIT_PROOF_PENDING: 'pg-badge-warn',
  ADMIN_REVIEWING: 'pg-badge-warn',
  TRANSFER_IN_PROGRESS: 'pg-badge-progress',
  COMPLETED: 'pg-badge-success',
  CANCELLED: 'pg-badge-muted',
  ESCROW_CREATED: 'pg-badge-info',
  SELLER_ACCEPTED: 'pg-badge-info',
  CONTRACT_CONFIRMED: 'pg-badge-warn',
  SHIPPING_STARTED: 'pg-badge-progress',
  PAYOUT_SCHEDULED: 'pg-badge-progress',
  VOIDED: 'pg-badge-muted',
  BUYER_DEPOSIT_PROOF: 'pg-badge-warn',
  ADMIN_DEPOSIT_CONFIRMED: 'pg-badge-warn',
  SELLER_FULFILLMENT_PROOF: 'pg-badge-progress',
  BUYER_FINAL_APPROVAL: 'pg-badge-progress',
  ESCROW_COMPLETED: 'pg-badge-success',
  DISPUTED: 'pg-badge-error',
};

export function StatusBadge({ status }: { status: string }) {
  const t = useT();
  const key = STATUS_KEYS[status];
  const label = key ? t(key) : status;
  const tone = STATUS_BADGE[status] ?? 'pg-badge-muted';

  return <span className={`pg-badge ${tone}`}>{label}</span>;
}

'use client';

import { useT, useLocale } from '@/context/LocaleProvider';
import { useWorkflowDisplay } from '@/context/WorkflowDisplayProvider';
import type { MessageKey } from '@/i18n/messages';

export type UsdtStatusContext = {
  paymentMethod?: string | null;
  collectionProvider?: string | null;
  cancelReason?: string | null;
  cardPaymentStatus?: string | null;
};

const STATUS_KEYS: Record<string, MessageKey> = {
  QUOTE_PENDING: 'status.QUOTE_PENDING',
  QUOTE_CONFIRMED: 'status.QUOTE_CONFIRMED',
  APPLICATION_COMPLETED: 'status.APPLICATION_COMPLETED',
  CARD_PAYMENT_PENDING: 'status.CARD_PAYMENT_PENDING',
  DEPOSIT_PROOF_PENDING: 'status.DEPOSIT_PROOF_PENDING',
  ADMIN_REVIEWING: 'status.ADMIN_REVIEWING',
  TRANSFER_IN_PROGRESS: 'status.TRANSFER_IN_PROGRESS',
  COMPLETED: 'status.COMPLETED',
  CANCELLED: 'status.CANCELLED',
  SCHEDULE_DELAYED: 'status.SCHEDULE_DELAYED',
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
  QUOTE_PENDING: 'pg-badge-warn',
  QUOTE_CONFIRMED: 'pg-badge-info',
  APPLICATION_COMPLETED: 'pg-badge-info',
  CARD_PAYMENT_PENDING: 'pg-badge-warn',
  DEPOSIT_PROOF_PENDING: 'pg-badge-warn',
  ADMIN_REVIEWING: 'pg-badge-warn',
  TRANSFER_IN_PROGRESS: 'pg-badge-progress',
  COMPLETED: 'pg-badge-success',
  CANCELLED: 'pg-badge-muted',
  SCHEDULE_DELAYED: 'pg-badge-warn',
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

export function buildUsdtStatusContext(ticket: {
  paymentMethod?: string | null;
  collectionProvider?: string | null;
  cancelReason?: string | null;
  cardPaymentStatus?: string | null;
}): UsdtStatusContext {
  return {
    paymentMethod: ticket.paymentMethod,
    collectionProvider: ticket.collectionProvider,
    cancelReason: ticket.cancelReason,
    cardPaymentStatus: ticket.cardPaymentStatus,
  };
}

/** ICOPAY 취소 vs 실패 구분 — cancelReason / note 에 CANCELLED·CANCELED 포함 시 거래취소 */
function isCardCancelReason(reason?: string | null): boolean {
  const u = String(reason || '').toUpperCase();
  if (!u) return false;
  if (/\bCANCEL+ED?\b/.test(u) || u.includes('CANCELED') || u.includes('CANCELLED')) return true;
  if (u.includes('거래 취소') || u.includes('결제 취소')) return true;
  return false;
}

function usdtContextualKey(status: string, ctx?: UsdtStatusContext): MessageKey | null {
  if (!ctx || ctx.paymentMethod !== 'CARD') {
    if (status === 'ADMIN_REVIEWING' && ctx) return 'status.DEPOSIT_VERIFYING';
    return null;
  }
  /** 요청(결제 대기) → 결제확인중 */
  if (status === 'CARD_PAYMENT_PENDING') return 'status.CARD_PAYMENT_REQUESTING';
  /** 성공 → 카드성공 (본사 다음 단계 진행 가능) */
  if (status === 'ADMIN_REVIEWING') return 'status.CARD_PAYMENT_SUCCESS';
  if (status === 'CANCELLED') {
    return isCardCancelReason(ctx.cancelReason)
      ? 'status.CARD_TRADE_CANCELLED'
      : 'status.CARD_TRADE_FAILED';
  }
  return null;
}

function contextualTone(key: MessageKey | null, status: string): string {
  if (key === 'status.CARD_PAYMENT_SUCCESS') return 'pg-badge-success';
  if (key === 'status.CARD_TRADE_FAILED') return 'pg-badge-error';
  if (key === 'status.CARD_TRADE_CANCELLED') return 'pg-badge-muted';
  if (key === 'status.CARD_PAYMENT_REQUESTING') return 'pg-badge-warn';
  return STATUS_BADGE[status] ?? 'pg-badge-muted';
}

export function StatusBadge({
  status,
  kind,
  usdtContext,
}: {
  status: string;
  kind?: 'usdt' | 'escrow';
  usdtContext?: UsdtStatusContext;
}) {
  const t = useT();
  const { locale } = useLocale();
  const wf = useWorkflowDisplay();
  const contextualKey = kind === 'usdt' ? usdtContextualKey(status, usdtContext) : null;
  const fromHq =
    kind === 'escrow'
      ? wf?.escrowStatusLabels[status]?.[locale]
      : kind === 'usdt'
        ? wf?.usdtStatusLabels[status]?.[locale]
        : wf?.usdtStatusLabels[status]?.[locale] ?? wf?.escrowStatusLabels[status]?.[locale];
  /** 카드 맥락 라벨은 HQ 커스텀보다 우선 (요청/성공/실패/취소 구분) */
  const key = contextualKey ?? STATUS_KEYS[status];
  const label =
    (contextualKey && t(contextualKey)) ||
    (!contextualKey && fromHq && fromHq.trim()) ||
    (key ? t(key) : status);
  const tone = contextualTone(contextualKey, status);

  return <span className={`pg-badge ${tone}`}>{label}</span>;
}

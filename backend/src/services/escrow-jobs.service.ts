import { TicketType, TradeEscrowStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { settleCommission } from './commission.service';

const VOIDABLE_STATUSES: TradeEscrowStatus[] = [
  TradeEscrowStatus.ESCROW_CREATED,
  TradeEscrowStatus.SELLER_ACCEPTED,
];

/** 당일 양측 미수락 건 → 거래 불발(VOIDED) */
export async function voidExpiredEscrowAcceptances(): Promise<number> {
  const now = new Date();
  const pending = await prisma.tradeEscrowDetail.findMany({
    where: {
      status: { in: VOIDABLE_STATUSES },
      acceptanceDeadlineAt: { lt: now },
    },
    select: { ticketId: true, status: true, buyerId: true },
  });

  let count = 0;
  for (const row of pending) {
    await prisma.$transaction(async (tx) => {
      await tx.tradeEscrowDetail.update({
        where: { ticketId: row.ticketId },
        data: {
          status: TradeEscrowStatus.VOIDED,
          voidReason: '당일 양측 계약 미체결 — 거래 불발',
        },
      });
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: row.ticketId,
          fromStatus: row.status,
          toStatus: TradeEscrowStatus.VOIDED,
          changedById: row.buyerId,
          note: '당일 미체결 자동 파기',
        },
      });
    });
    count++;
  }
  return count;
}

/** 예약 시각 도래 건 USDT 송금 완료 처리 (운영 일괄) */
export async function processScheduledEscrowPayouts(): Promise<number> {
  const now = new Date();
  const due = await prisma.tradeEscrowDetail.findMany({
    where: {
      status: TradeEscrowStatus.PAYOUT_SCHEDULED,
      payoutScheduledAt: { lte: now },
    },
    include: { ticket: true, seller: { select: { id: true } } },
  });

  let count = 0;
  for (const detail of due) {
    const payoutTxId = detail.payoutTxId ?? `BATCH-${detail.ticket.ticketNo}-${Date.now()}`;
    await prisma.$transaction(async (tx) => {
      await tx.tradeEscrowDetail.update({
        where: { ticketId: detail.ticketId },
        data: {
          status: TradeEscrowStatus.ESCROW_COMPLETED,
          payoutTxId,
          payoutProcessedAt: now,
        },
      });
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: detail.ticketId,
          fromStatus: TradeEscrowStatus.PAYOUT_SCHEDULED,
          toStatus: TradeEscrowStatus.ESCROW_COMPLETED,
          changedById: detail.seller.id,
          note: '일괄 USDT 송금 처리',
        },
      });
      if (!detail.ticket.commissionSettled) {
        await settleCommission(tx, {
          ticketId: detail.ticketId,
          ticketType: TicketType.TRADE_ESCROW,
          commissionPool: Number(detail.totalCommissionPool),
          currency: detail.currency,
        });
      }
    });
    count++;
  }
  return count;
}

export function startEscrowJobScheduler(): void {
  const run = async () => {
    try {
      const voided = await voidExpiredEscrowAcceptances();
      const paid = await processScheduledEscrowPayouts();
      if (voided > 0 || paid > 0) {
        console.log(`[escrow-jobs] voided=${voided} payouts=${paid}`);
      }
    } catch (err) {
      console.error('[escrow-jobs]', err);
    }
  };
  run();
  setInterval(run, 5 * 60 * 1000);
}

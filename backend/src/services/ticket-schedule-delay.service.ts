import { Prisma, TicketType, UserRole } from '@prisma/client';
import { AuthUser } from '../types/auth';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { computeExpectedCompleteAt, type HqSlaConfig } from '../constants/hq-policy';

/** 완료일 지연 선택 가능 시간(시간) */
export const SCHEDULE_DELAY_HOUR_OPTIONS = [12, 24, 36, 48, 60, 72, 84, 96] as const;
export type ScheduleDelayHours = (typeof SCHEDULE_DELAY_HOUR_OPTIONS)[number];

export const SCHEDULE_DELAY_INCLUDE = {
  orderBy: { createdAt: 'asc' as const },
  include: {
    createdBy: { select: { id: true, name: true, email: true } },
  },
} satisfies Prisma.TransactionTicket$scheduleDelaysArgs;

export function totalDelayHours(
  delays: { delayHours: number }[] | undefined | null,
): number {
  if (!delays?.length) return 0;
  return delays.reduce((sum, d) => sum + (Number(d.delayHours) || 0), 0);
}

export function computeExpectedCompleteWithDelays(
  createdAt: Date,
  sla: HqSlaConfig,
  delays: { delayHours: number }[] | undefined | null,
): Date {
  const base = computeExpectedCompleteAt(createdAt, sla);
  const hours = totalDelayHours(delays);
  if (hours <= 0) return base;
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

export function serializeScheduleDelays(
  delays:
    | {
        id: string;
        delayHours: number;
        reason: string;
        createdAt: Date;
        createdBy: { id: string; name: string; email: string };
      }[]
    | undefined
    | null,
) {
  return (delays ?? []).map((d) => ({
    id: d.id,
    delayHours: d.delayHours,
    reason: d.reason,
    createdAt: d.createdAt.toISOString(),
    createdBy: d.createdBy,
  }));
}

export function completedAtFromHistory(
  statusHistory: { toStatus: string; createdAt: Date }[] | undefined | null,
  completedStatuses: string[],
): string | null {
  if (!statusHistory?.length) return null;
  const hit = [...statusHistory].reverse().find((h) => completedStatuses.includes(h.toStatus));
  return hit ? hit.createdAt.toISOString() : null;
}

function canAddDelay(user: AuthUser): boolean {
  return (
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.ORG_STAFF ||
    user.role === UserRole.ORGANIZER ||
    user.role === UserRole.SETTLEMENT_ADMIN
  );
}

export async function addTicketScheduleDelay(
  user: AuthUser,
  ticketId: string,
  input: { delayHours: number; reason: string },
  expectedType?: TicketType,
) {
  if (!canAddDelay(user)) {
    throw new AppError(403, 'Operator role required', 'FORBIDDEN');
  }
  const hours = Number(input.delayHours);
  if (!(SCHEDULE_DELAY_HOUR_OPTIONS as readonly number[]).includes(hours)) {
    throw new AppError(400, 'Invalid delay hours', 'VALIDATION');
  }
  const reason = String(input.reason ?? '').trim();
  if (!reason || reason.length > 500) {
    throw new AppError(400, 'Reason required (max 500)', 'VALIDATION');
  }

  const ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId },
    include: {
      usdtPurchase: { select: { status: true } },
      tradeEscrow: { select: { status: true } },
    },
  });
  if (!ticket) throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  if (expectedType && ticket.type !== expectedType) {
    throw new AppError(400, 'Ticket type mismatch', 'VALIDATION');
  }

  let currentStatus: string | null = null;
  if (ticket.type === TicketType.USDT_PURCHASE) {
    const st = ticket.usdtPurchase?.status;
    if (st === 'COMPLETED' || st === 'CANCELLED') {
      throw new AppError(400, 'Cannot delay a finished ticket', 'VALIDATION');
    }
    currentStatus = st ?? null;
  }
  if (ticket.type === TicketType.TRADE_ESCROW) {
    const st = ticket.tradeEscrow?.status;
    if (st === 'ESCROW_COMPLETED' || st === 'CANCELLED' || st === 'VOIDED') {
      throw new AppError(400, 'Cannot delay a finished ticket', 'VALIDATION');
    }
    currentStatus = st ?? null;
  }

  await prisma.$transaction([
    prisma.ticketScheduleDelay.create({
      data: {
        ticketId,
        delayHours: hours,
        reason,
        createdById: user.id,
      },
    }),
    prisma.ticketStatusHistory.create({
      data: {
        ticketId,
        fromStatus: currentStatus,
        toStatus: 'SCHEDULE_DELAYED',
        note: `+${hours}h · ${reason}`,
        changedById: user.id,
      },
    }),
  ]);

  return { ok: true as const, delayHours: hours };
}

import { Prisma, TicketType, UserRole } from '@prisma/client';
import { AuthUser } from '../types/auth';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { isMerchantSide, merchantScopeUserId } from '../lib/merchant-role';

/** 티켓 접근 가능 여부 */
export async function assertTicketAccess(user: AuthUser, ticketId: string): Promise<void> {
  const ticket = await prisma.transactionTicket.findUnique({
    where: { id: ticketId },
    include: {
      customer: {
        select: {
          userId: true,
          recruitingOrg: { select: { path: true } },
        },
      },
      tradeEscrow: {
        select: { buyerId: true, sellerId: true },
      },
    },
  });

  if (!ticket) {
    throw new AppError(404, 'Ticket not found', 'NOT_FOUND');
  }

  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ORGANIZER) return;

  if (isMerchantSide(user)) {
    const ownerId = merchantScopeUserId(user);
    const isOwner = ticket.customer.userId === ownerId;
    const isEscrowParty =
      ticket.tradeEscrow &&
      (ticket.tradeEscrow.buyerId === ownerId ||
        ticket.tradeEscrow.sellerId === ownerId ||
        ticket.tradeEscrow.buyerId === user.id ||
        ticket.tradeEscrow.sellerId === user.id);
    if (!isOwner && !isEscrowParty) {
      throw new AppError(403, 'Access denied', 'FORBIDDEN');
    }
    return;
  }

  if (user.role === UserRole.ORG_STAFF) {
    if (!user.organizationPath) {
      throw new AppError(403, 'Organization not assigned', 'FORBIDDEN');
    }
    const customerOrgPath = ticket.customer.recruitingOrg.path;
    if (!customerOrgPath.startsWith(user.organizationPath)) {
      throw new AppError(403, 'Access denied', 'FORBIDDEN');
    }
    return;
  }

  throw new AppError(403, 'Access denied', 'FORBIDDEN');
}

/** 목록 조회용 where 조건 */
export function buildTicketListFilter(user: AuthUser, type?: TicketType): Prisma.TransactionTicketWhereInput {
  const typeFilter = type ? { type } : {};

  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ORGANIZER) {
    return typeFilter;
  }

  if (isMerchantSide(user)) {
    if (!user.customerProfileId) {
      throw new AppError(403, 'Customer profile required', 'FORBIDDEN');
    }
    const ownerId = merchantScopeUserId(user);
    return {
      ...typeFilter,
      OR: [
        { customerId: user.customerProfileId },
        { tradeEscrow: { buyerId: ownerId } },
        { tradeEscrow: { sellerId: ownerId } },
        { tradeEscrow: { buyerId: user.id } },
        { tradeEscrow: { sellerId: user.id } },
      ],
    };
  }

  if (user.role === UserRole.ORG_STAFF) {
    if (!user.organizationPath) {
      throw new AppError(403, 'Organization not assigned', 'FORBIDDEN');
    }
    return {
      ...typeFilter,
      customer: {
        recruitingOrg: {
          path: { startsWith: user.organizationPath },
        },
      },
    };
  }

  throw new AppError(403, 'Access denied', 'FORBIDDEN');
}

export function canChangeTicketStatus(user: AuthUser): boolean {
  return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ORG_STAFF;
}

export function canOperateUsdtTicket(user: AuthUser): boolean {
  return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ORG_STAFF;
}

export function isEscrowBuyer(user: AuthUser, buyerId: string): boolean {
  return user.id === buyerId || merchantScopeUserId(user) === buyerId;
}

export function isEscrowSeller(user: AuthUser, sellerId: string): boolean {
  return user.id === sellerId || merchantScopeUserId(user) === sellerId;
}

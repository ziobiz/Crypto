import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { resolveIndividualCustomerUserId } from './webauthn.service';

const QR_TTL_MS = 2 * 60 * 1000;

function publicWebOrigin(): string {
  return (process.env.PUBLIC_WEB_URL || 'https://tinpass.com').replace(/\/$/, '');
}

function newTicketId(): string {
  return randomBytes(24).toString('base64url');
}

export async function createBoundQrTicket(userId: string) {
  const individual = await resolveIndividualCustomerUserId(userId);
  if (!individual) {
    throw new AppError(403, 'QR login is for individual customers only', 'QR_INDIVIDUAL_ONLY');
  }
  const id = newTicketId();
  const expiresAt = new Date(Date.now() + QR_TTL_MS);
  await prisma.loginQrTicket.create({
    data: { id, userId, status: 'PENDING', expiresAt },
  });
  return {
    ticket: id,
    expiresAt: expiresAt.toISOString(),
    approveUrl: `${publicWebOrigin()}/login/qr-approve?ticket=${encodeURIComponent(id)}`,
  };
}

/** 폰이 이미 로그인된 경우 PC에서 이메일 없이 QR만으로 로그인 */
export async function createAnonymousQrTicket() {
  const id = newTicketId();
  const expiresAt = new Date(Date.now() + QR_TTL_MS);
  await prisma.loginQrTicket.create({
    data: { id, userId: null, status: 'PENDING', expiresAt },
  });
  return {
    ticket: id,
    expiresAt: expiresAt.toISOString(),
    approveUrl: `${publicWebOrigin()}/login/qr-approve?ticket=${encodeURIComponent(id)}`,
  };
}

export async function getQrTicketStatus(ticketId: string) {
  const row = await prisma.loginQrTicket.findUnique({ where: { id: ticketId } });
  if (!row) {
    throw new AppError(404, 'QR ticket not found', 'QR_NOT_FOUND');
  }
  if (row.status === 'PENDING' && row.expiresAt.getTime() < Date.now()) {
    await prisma.loginQrTicket.update({
      where: { id: ticketId },
      data: { status: 'EXPIRED' },
    });
    return { status: 'EXPIRED' as const, expiresAt: row.expiresAt.toISOString() };
  }
  return {
    status: row.status as 'PENDING' | 'APPROVED' | 'EXPIRED' | 'CONSUMED',
    expiresAt: row.expiresAt.toISOString(),
  };
}

export async function approveQrTicket(ticketId: string, approverUserId: string) {
  const individual = await resolveIndividualCustomerUserId(approverUserId);
  if (!individual) {
    throw new AppError(403, 'QR login is for individual customers only', 'QR_INDIVIDUAL_ONLY');
  }

  const row = await prisma.loginQrTicket.findUnique({ where: { id: ticketId } });
  if (!row) {
    throw new AppError(404, 'QR ticket not found', 'QR_NOT_FOUND');
  }
  if (row.status !== 'PENDING' || row.expiresAt.getTime() < Date.now()) {
    throw new AppError(410, 'QR ticket expired', 'QR_EXPIRED');
  }
  if (row.userId && row.userId !== approverUserId) {
    throw new AppError(403, 'QR ticket belongs to another user', 'QR_USER_MISMATCH');
  }

  await prisma.loginQrTicket.update({
    where: { id: ticketId },
    data: {
      userId: approverUserId,
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  });
  return { ok: true as const };
}

export async function consumeApprovedQrTicket(ticketId: string): Promise<string> {
  const row = await prisma.loginQrTicket.findUnique({ where: { id: ticketId } });
  if (!row) {
    throw new AppError(404, 'QR ticket not found', 'QR_NOT_FOUND');
  }
  if (row.status === 'CONSUMED') {
    throw new AppError(410, 'QR ticket already used', 'QR_CONSUMED');
  }
  if (row.status !== 'APPROVED' || !row.userId) {
    throw new AppError(400, 'QR ticket not approved yet', 'QR_NOT_APPROVED');
  }
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.loginQrTicket.update({
      where: { id: ticketId },
      data: { status: 'EXPIRED' },
    });
    throw new AppError(410, 'QR ticket expired', 'QR_EXPIRED');
  }

  const individual = await resolveIndividualCustomerUserId(row.userId);
  if (!individual) {
    throw new AppError(403, 'QR login is for individual customers only', 'QR_INDIVIDUAL_ONLY');
  }

  await prisma.loginQrTicket.update({
    where: { id: ticketId },
    data: { status: 'CONSUMED', consumedAt: new Date() },
  });

  return row.userId;
}

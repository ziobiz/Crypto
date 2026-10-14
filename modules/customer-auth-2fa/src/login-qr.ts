import { randomBytes } from 'crypto';
import type { CustomerAuth2faAdapters } from './adapters.js';
import {
  CustomerAuth2faError,
  DEFAULT_LOGIN_QR_TTL_MS,
  type QrTicketCreateResult,
} from './types.js';

function newTicketId(): string {
  return randomBytes(24).toString('base64url');
}

function qrTtl(adapters: CustomerAuth2faAdapters) {
  return adapters.qrTtlMs ?? DEFAULT_LOGIN_QR_TTL_MS;
}

export function createLoginQrService(adapters: CustomerAuth2faAdapters) {
  async function createTicket(userId: string | null): Promise<QrTicketCreateResult> {
    if (userId) {
      if (!(await adapters.isIndividualEligible(userId))) {
        throw new CustomerAuth2faError(
          403,
          'QR login is for individual customers only',
          'QR_INDIVIDUAL_ONLY',
        );
      }
    }
    const id = newTicketId();
    const expiresAt = new Date(Date.now() + qrTtl(adapters));
    await adapters.createQrTicket({
      id,
      userId,
      status: 'PENDING',
      expiresAt,
    });
    const origin = adapters.getPublicWebOrigin().replace(/\/$/, '');
    return {
      ticket: id,
      expiresAt: expiresAt.toISOString(),
      approveUrl: `${origin}/login/qr-approve?ticket=${encodeURIComponent(id)}`,
    };
  }

  return {
    createBound: (userId: string) => createTicket(userId),
    createAnonymous: () => createTicket(null),

    async getStatus(ticketId: string) {
      const row = await adapters.findQrTicket(ticketId);
      if (!row) {
        throw new CustomerAuth2faError(404, 'QR ticket not found', 'QR_NOT_FOUND');
      }
      if (row.status === 'PENDING' && row.expiresAt.getTime() < Date.now()) {
        await adapters.updateQrTicket(ticketId, { status: 'EXPIRED' });
        return { status: 'EXPIRED' as const, expiresAt: row.expiresAt.toISOString() };
      }
      return { status: row.status, expiresAt: row.expiresAt.toISOString() };
    },

    async getInfo(ticketId: string) {
      const status = await this.getStatus(ticketId);
      const row = await adapters.findQrTicket(ticketId);
      return { ...status, boundUser: Boolean(row?.userId) };
    },

    async approve(ticketId: string, approverUserId: string) {
      if (!(await adapters.isIndividualEligible(approverUserId))) {
        throw new CustomerAuth2faError(
          403,
          'QR login is for individual customers only',
          'QR_INDIVIDUAL_ONLY',
        );
      }
      const row = await adapters.findQrTicket(ticketId);
      if (!row) {
        throw new CustomerAuth2faError(404, 'QR ticket not found', 'QR_NOT_FOUND');
      }
      if (row.status !== 'PENDING' || row.expiresAt.getTime() < Date.now()) {
        throw new CustomerAuth2faError(410, 'QR ticket expired', 'QR_EXPIRED');
      }
      if (row.userId && row.userId !== approverUserId) {
        throw new CustomerAuth2faError(403, 'QR ticket belongs to another user', 'QR_USER_MISMATCH');
      }
      await adapters.updateQrTicket(ticketId, {
        userId: approverUserId,
        status: 'APPROVED',
        approvedAt: new Date(),
      });
      return { ok: true as const };
    },

    /** returns userId for session issuance */
    async consumeApproved(ticketId: string): Promise<string> {
      const row = await adapters.findQrTicket(ticketId);
      if (!row) {
        throw new CustomerAuth2faError(404, 'QR ticket not found', 'QR_NOT_FOUND');
      }
      if (row.status === 'CONSUMED') {
        throw new CustomerAuth2faError(410, 'QR ticket already used', 'QR_CONSUMED');
      }
      if (row.status !== 'APPROVED' || !row.userId) {
        throw new CustomerAuth2faError(400, 'QR ticket not approved yet', 'QR_NOT_APPROVED');
      }
      if (row.expiresAt.getTime() < Date.now()) {
        await adapters.updateQrTicket(ticketId, { status: 'EXPIRED' });
        throw new CustomerAuth2faError(410, 'QR ticket expired', 'QR_EXPIRED');
      }
      if (!(await adapters.isIndividualEligible(row.userId))) {
        throw new CustomerAuth2faError(
          403,
          'QR login is for individual customers only',
          'QR_INDIVIDUAL_ONLY',
        );
      }
      await adapters.updateQrTicket(ticketId, {
        status: 'CONSUMED',
        consumedAt: new Date(),
      });
      return row.userId;
    },
  };
}

export type LoginQrService = ReturnType<typeof createLoginQrService>;

/**
 * Example Prisma adapter for host apps.
 * Copy and adjust model names / eligibility logic.
 *
 * import { PrismaClient } from '@prisma/client';
 * import type { CustomerAuth2faAdapters } from './adapters';
 */

/*
import type { CustomerAuth2faAdapters } from './adapters.js';

export function createPrismaAdapters(prisma: PrismaClient): CustomerAuth2faAdapters {
  return {
    async isIndividualEligible(userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          isActive: true,
          customerProfile: { select: { customerType: true } },
        },
      });
      return (
        !!user?.isActive &&
        user.role === 'CUSTOMER' &&
        user.customerProfile?.customerType === 'INDIVIDUAL'
      );
    },

    async getUserWebAuthnIdentity(userId) {
      const u = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { email: true, name: true },
      });
      return { userName: u.email, displayName: u.name };
    },

    getRpConfig() {
      const rpID = (process.env.WEBAUTHN_RP_ID || 'localhost').trim();
      const origins = (process.env.WEBAUTHN_ORIGINS || 'http://localhost:3000')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        rpID,
        origins,
        rpName: (process.env.WEBAUTHN_RP_NAME || 'App').trim(),
      };
    },

    getPublicWebOrigin() {
      return (process.env.PUBLIC_WEB_URL || 'http://localhost:3000').replace(/\/$/, '');
    },

    countCredentials: (userId) => prisma.webAuthnCredential.count({ where: { userId } }),

    async listCredentials(userId) {
      const rows = await prisma.webAuthnCredential.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          deviceLabel: true,
          deviceType: true,
          createdAt: true,
          lastUsedAt: true,
        },
      });
      return rows.map((r) => ({
        id: r.id,
        deviceLabel: r.deviceLabel,
        deviceType: r.deviceType,
        createdAt: r.createdAt.toISOString(),
        lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
      }));
    },

    listCredentialsForAuth: (userId) =>
      prisma.webAuthnCredential.findMany({
        where: { userId },
        select: { credentialId: true, transports: true },
      }),

    async findCredential(userId, credentialId) {
      const s = await prisma.webAuthnCredential.findFirst({
        where: { userId, credentialId },
      });
      if (!s) return null;
      return {
        id: s.id,
        userId: s.userId,
        credentialId: s.credentialId,
        publicKey: new Uint8Array(s.publicKey),
        counter: Number(s.counter),
        deviceType: s.deviceType,
        backedUp: s.backedUp,
        transports: s.transports,
        deviceLabel: s.deviceLabel,
      };
    },

    createCredential: (input) =>
      prisma.webAuthnCredential.create({ data: input }).then(() => undefined),

    updateCredentialCounter: (id, counter, lastUsedAt) =>
      prisma.webAuthnCredential
        .update({ where: { id }, data: { counter, lastUsedAt } })
        .then(() => undefined),

    async deleteCredential(userId, id) {
      const r = await prisma.webAuthnCredential.deleteMany({ where: { id, userId } });
      return r.count > 0;
    },

    async saveChallenge(userId, purpose, challenge, expiresAt) {
      await prisma.webAuthnChallenge.deleteMany({ where: { userId, purpose } });
      await prisma.webAuthnChallenge.create({
        data: { userId, purpose, challenge, expiresAt },
      });
    },

    async takeChallenge(userId, purpose) {
      const row = await prisma.webAuthnChallenge.findFirst({
        where: { userId, purpose, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      if (!row) return null;
      await prisma.webAuthnChallenge.deleteMany({ where: { userId, purpose } });
      return row.challenge;
    },

    createQrTicket: (input) => prisma.loginQrTicket.create({ data: input }).then(() => undefined),

    findQrTicket: (id) => prisma.loginQrTicket.findUnique({ where: { id } }),

    updateQrTicket: (id, data) =>
      prisma.loginQrTicket.update({ where: { id }, data }).then(() => undefined),
  };
}
*/

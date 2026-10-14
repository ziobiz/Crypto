import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { CustomerType, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
/** 개인 고객 바이오 credential은 계정당 1개만 허용 */
export const MAX_WEBAUTHN_CREDENTIALS_PER_USER = 1;

function rpConfig() {
  const rpID = (process.env.WEBAUTHN_RP_ID || 'tinpass.com').trim();
  const origins = (
    process.env.WEBAUTHN_ORIGINS ||
    'https://tinpass.com,https://www.tinpass.com'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const rpName = (process.env.WEBAUTHN_RP_NAME || 'TINPASS').trim() || 'TINPASS';
  return { rpID, origins, rpName };
}

/** 개인 고객(CUSTOMER + INDIVIDUAL)만 바이오/QR 대상. 운영자는 관리자 프로필 기준. */
export async function resolveIndividualCustomerUserId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      deletedAt: true,
      merchantAdminUserId: true,
      customerProfile: { select: { customerType: true } },
    },
  });
  if (!user || !user.isActive || user.deletedAt) return null;

  if (user.role === UserRole.CUSTOMER) {
    return user.customerProfile?.customerType === CustomerType.INDIVIDUAL ? user.id : null;
  }

  if (user.role === UserRole.CUSTOMER_OPERATOR && user.merchantAdminUserId) {
    const admin = await prisma.user.findUnique({
      where: { id: user.merchantAdminUserId },
      select: {
        id: true,
        isActive: true,
        deletedAt: true,
        customerProfile: { select: { customerType: true } },
      },
    });
    if (!admin || !admin.isActive || admin.deletedAt) return null;
    return admin.customerProfile?.customerType === CustomerType.INDIVIDUAL ? user.id : null;
  }

  return null;
}

export async function assertIndividualCustomer(userId: string): Promise<void> {
  const ok = await resolveIndividualCustomerUserId(userId);
  if (!ok) {
    throw new AppError(403, 'Biometric login is for individual customers only', 'WEBAUTHN_INDIVIDUAL_ONLY');
  }
}

export async function countWebAuthnCredentials(userId: string): Promise<number> {
  return prisma.webAuthnCredential.count({ where: { userId } });
}

export async function listWebAuthnCredentials(userId: string) {
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
}

async function saveChallenge(userId: string, purpose: 'register' | 'login', challenge: string) {
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  await prisma.webAuthnChallenge.deleteMany({ where: { userId, purpose } });
  await prisma.webAuthnChallenge.create({
    data: { userId, purpose, challenge, expiresAt },
  });
}

async function takeChallenge(userId: string, purpose: 'register' | 'login'): Promise<string> {
  const row = await prisma.webAuthnChallenge.findFirst({
    where: { userId, purpose, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) {
    throw new AppError(401, 'WebAuthn challenge expired', 'WEBAUTHN_CHALLENGE_EXPIRED');
  }
  await prisma.webAuthnChallenge.deleteMany({ where: { userId, purpose } });
  return row.challenge;
}

export async function beginRegistration(userId: string, userName: string, displayName: string) {
  await assertIndividualCustomer(userId);
  const { rpID, rpName } = rpConfig();
  const existing = await prisma.webAuthnCredential.findMany({
    where: { userId },
    select: { credentialId: true, transports: true },
  });
  if (existing.length >= MAX_WEBAUTHN_CREDENTIALS_PER_USER) {
    throw new AppError(
      409,
      'Only one biometric credential is allowed. Delete it with OTP to register again.',
      'WEBAUTHN_LIMIT',
    );
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName,
    userDisplayName: displayName || userName,
    userID: new TextEncoder().encode(userId),
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({
      id: c.credentialId,
      transports: (c.transports as AuthenticatorTransportFuture[] | null) ?? undefined,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
  });

  await saveChallenge(userId, 'register', options.challenge);
  return options;
}

export async function finishRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  deviceLabel?: string,
) {
  await assertIndividualCustomer(userId);
  const count = await prisma.webAuthnCredential.count({ where: { userId } });
  if (count >= MAX_WEBAUTHN_CREDENTIALS_PER_USER) {
    throw new AppError(
      409,
      'Only one biometric credential is allowed. Delete it with OTP to register again.',
      'WEBAUTHN_LIMIT',
    );
  }
  const expectedChallenge = await takeChallenge(userId, 'register');
  const { rpID, origins } = rpConfig();

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origins,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new AppError(401, 'WebAuthn registration failed', 'WEBAUTHN_REGISTER_FAILED');
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const credentialID = credential.id;
  const publicKey = Buffer.from(credential.publicKey);

  await prisma.webAuthnCredential.create({
    data: {
      userId,
      credentialId: credentialID,
      publicKey,
      counter: BigInt(credential.counter ?? 0),
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.transports ?? undefined,
      deviceLabel: deviceLabel?.trim() || null,
    },
  });

  return { ok: true as const };
}

export async function beginAuthentication(userId: string) {
  await assertIndividualCustomer(userId);
  const { rpID } = rpConfig();
  const existing = await prisma.webAuthnCredential.findMany({
    where: { userId },
    select: { credentialId: true, transports: true },
  });
  if (existing.length === 0) {
    throw new AppError(400, 'No biometric credentials registered', 'WEBAUTHN_NOT_REGISTERED');
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: existing.map((c) => ({
      id: c.credentialId,
      transports: (c.transports as AuthenticatorTransportFuture[] | null) ?? undefined,
    })),
    userVerification: 'preferred',
  });

  await saveChallenge(userId, 'login', options.challenge);
  return options;
}

export async function finishAuthentication(userId: string, response: AuthenticationResponseJSON) {
  await assertIndividualCustomer(userId);
  const expectedChallenge = await takeChallenge(userId, 'login');
  const { rpID, origins } = rpConfig();

  const credId = response.id;
  const stored = await prisma.webAuthnCredential.findFirst({
    where: { userId, credentialId: credId },
  });
  if (!stored) {
    throw new AppError(401, 'Unknown biometric credential', 'WEBAUTHN_UNKNOWN_CREDENTIAL');
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origins,
    expectedRPID: rpID,
    credential: {
      id: stored.credentialId,
      publicKey: new Uint8Array(stored.publicKey),
      counter: Number(stored.counter),
      transports: (stored.transports as AuthenticatorTransportFuture[] | null) ?? undefined,
    },
  });

  if (!verification.verified) {
    throw new AppError(401, 'Biometric verification failed', 'WEBAUTHN_VERIFY_FAILED');
  }

  const newCounter = verification.authenticationInfo.newCounter;
  await prisma.webAuthnCredential.update({
    where: { id: stored.id },
    data: {
      counter: BigInt(newCounter),
      lastUsedAt: new Date(),
    },
  });

  return { ok: true as const };
}

export async function deleteCredential(userId: string, credentialId: string) {
  await assertIndividualCustomer(userId);
  const result = await prisma.webAuthnCredential.deleteMany({
    where: { id: credentialId, userId },
  });
  if (result.count === 0) {
    throw new AppError(404, 'Credential not found', 'NOT_FOUND');
  }
  return { ok: true as const };
}

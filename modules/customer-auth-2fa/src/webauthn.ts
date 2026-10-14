import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import type { CustomerAuth2faAdapters } from './adapters.js';
import {
  CustomerAuth2faError,
  DEFAULT_WEBAUTHN_CHALLENGE_TTL_MS,
} from './types.js';

async function assertEligible(adapters: CustomerAuth2faAdapters, userId: string) {
  if (!(await adapters.isIndividualEligible(userId))) {
    throw new CustomerAuth2faError(
      403,
      'Biometric login is for individual customers only',
      'WEBAUTHN_INDIVIDUAL_ONLY',
    );
  }
}

function ttl(adapters: CustomerAuth2faAdapters) {
  return adapters.challengeTtlMs ?? DEFAULT_WEBAUTHN_CHALLENGE_TTL_MS;
}

export function createWebAuthnService(adapters: CustomerAuth2faAdapters) {
  return {
    async secondFactorHints(userId: string) {
      const eligible = await adapters.isIndividualEligible(userId);
      if (!eligible) {
        return { webauthnAvailable: false, qrLoginAvailable: false };
      }
      const count = await adapters.countCredentials(userId);
      return { webauthnAvailable: count > 0, qrLoginAvailable: true };
    },

    listCredentials: (userId: string) => adapters.listCredentials(userId),

    async beginRegistration(userId: string) {
      await assertEligible(adapters, userId);
      const { rpID, rpName } = adapters.getRpConfig();
      const identity = await adapters.getUserWebAuthnIdentity(userId);
      const existing = await adapters.listCredentialsForAuth(userId);
      if (existing.length >= 1) {
        throw new CustomerAuth2faError(
          409,
          'Only one biometric credential is allowed. Delete it with OTP to register again.',
          'WEBAUTHN_LIMIT',
        );
      }

      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: identity.userName,
        userDisplayName: identity.displayName || identity.userName,
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

      await adapters.saveChallenge(
        userId,
        'register',
        options.challenge,
        new Date(Date.now() + ttl(adapters)),
      );
      return options;
    },

    async finishRegistration(
      userId: string,
      response: RegistrationResponseJSON,
      deviceLabel?: string,
    ) {
      await assertEligible(adapters, userId);
      const existingCount = await adapters.countCredentials(userId);
      if (existingCount >= 1) {
        throw new CustomerAuth2faError(
          409,
          'Only one biometric credential is allowed. Delete it with OTP to register again.',
          'WEBAUTHN_LIMIT',
        );
      }
      const expectedChallenge = await adapters.takeChallenge(userId, 'register');
      if (!expectedChallenge) {
        throw new CustomerAuth2faError(401, 'WebAuthn challenge expired', 'WEBAUTHN_CHALLENGE_EXPIRED');
      }
      const { rpID, origins } = adapters.getRpConfig();
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
      });
      if (!verification.verified || !verification.registrationInfo) {
        throw new CustomerAuth2faError(401, 'WebAuthn registration failed', 'WEBAUTHN_REGISTER_FAILED');
      }
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
      await adapters.createCredential({
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter ?? 0),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: credential.transports ?? undefined,
        deviceLabel: deviceLabel?.trim() || null,
      });
      return { ok: true as const };
    },

    async beginAuthentication(userId: string) {
      await assertEligible(adapters, userId);
      const { rpID } = adapters.getRpConfig();
      const existing = await adapters.listCredentialsForAuth(userId);
      if (existing.length === 0) {
        throw new CustomerAuth2faError(400, 'No biometric credentials registered', 'WEBAUTHN_NOT_REGISTERED');
      }
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: existing.map((c) => ({
          id: c.credentialId,
          transports: (c.transports as AuthenticatorTransportFuture[] | null) ?? undefined,
        })),
        userVerification: 'preferred',
      });
      await adapters.saveChallenge(
        userId,
        'login',
        options.challenge,
        new Date(Date.now() + ttl(adapters)),
      );
      return options;
    },

    async finishAuthentication(userId: string, response: AuthenticationResponseJSON) {
      await assertEligible(adapters, userId);
      const expectedChallenge = await adapters.takeChallenge(userId, 'login');
      if (!expectedChallenge) {
        throw new CustomerAuth2faError(401, 'WebAuthn challenge expired', 'WEBAUTHN_CHALLENGE_EXPIRED');
      }
      const { rpID, origins } = adapters.getRpConfig();
      const stored = await adapters.findCredential(userId, response.id);
      if (!stored) {
        throw new CustomerAuth2faError(401, 'Unknown biometric credential', 'WEBAUTHN_UNKNOWN_CREDENTIAL');
      }
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        credential: {
          id: stored.credentialId,
          publicKey: stored.publicKey,
          counter: stored.counter,
          transports: (stored.transports as AuthenticatorTransportFuture[] | null) ?? undefined,
        },
      });
      if (!verification.verified) {
        throw new CustomerAuth2faError(401, 'Biometric verification failed', 'WEBAUTHN_VERIFY_FAILED');
      }
      await adapters.updateCredentialCounter(
        stored.id,
        BigInt(verification.authenticationInfo.newCounter),
        new Date(),
      );
      return { ok: true as const };
    },

    async deleteCredential(userId: string, credentialId: string) {
      await assertEligible(adapters, userId);
      const ok = await adapters.deleteCredential(userId, credentialId);
      if (!ok) {
        throw new CustomerAuth2faError(404, 'Credential not found', 'NOT_FOUND');
      }
      return { ok: true as const };
    },
  };
}

export type WebAuthnService = ReturnType<typeof createWebAuthnService>;

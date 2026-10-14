import type {
  LoginQrStatus,
  LoginQrTicketRow,
  WebAuthnCredentialListItem,
  WebAuthnCredentialRow,
  WebAuthnPurpose,
} from './types.js';

/**
 * Host app must implement this. Wire Prisma / JWT / policy here.
 */
export type CustomerAuth2faAdapters = {
  /** true only for individual customers eligible for bio + QR */
  isIndividualEligible: (userId: string) => Promise<boolean>;

  /** email / display name for WebAuthn userName */
  getUserWebAuthnIdentity: (userId: string) => Promise<{ userName: string; displayName: string }>;

  /** RP config from env or host config */
  getRpConfig: () => {
    rpID: string;
    origins: string[];
    rpName: string;
  };

  /** Absolute web origin for QR approve links (no trailing slash) */
  getPublicWebOrigin: () => string;

  challengeTtlMs?: number;
  qrTtlMs?: number;

  // --- WebAuthn persistence ---
  countCredentials: (userId: string) => Promise<number>;
  listCredentials: (userId: string) => Promise<WebAuthnCredentialListItem[]>;
  listCredentialsForAuth: (
    userId: string,
  ) => Promise<Array<{ credentialId: string; transports: unknown }>>;
  findCredential: (
    userId: string,
    credentialId: string,
  ) => Promise<WebAuthnCredentialRow | null>;
  createCredential: (input: {
    userId: string;
    credentialId: string;
    publicKey: Buffer;
    counter: bigint;
    deviceType: string | null;
    backedUp: boolean;
    transports: unknown;
    deviceLabel: string | null;
  }) => Promise<void>;
  updateCredentialCounter: (
    id: string,
    counter: bigint,
    lastUsedAt: Date,
  ) => Promise<void>;
  deleteCredential: (userId: string, id: string) => Promise<boolean>;

  saveChallenge: (userId: string, purpose: WebAuthnPurpose, challenge: string, expiresAt: Date) => Promise<void>;
  takeChallenge: (userId: string, purpose: WebAuthnPurpose) => Promise<string | null>;

  // --- QR persistence ---
  createQrTicket: (input: {
    id: string;
    userId: string | null;
    status: LoginQrStatus;
    expiresAt: Date;
  }) => Promise<void>;
  findQrTicket: (id: string) => Promise<LoginQrTicketRow | null>;
  updateQrTicket: (
    id: string,
    data: Partial<{
      userId: string | null;
      status: LoginQrStatus;
      approvedAt: Date | null;
      consumedAt: Date | null;
    }>,
  ) => Promise<void>;
};

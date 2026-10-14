/** Public design constants — keep in sync with DESIGN.md */
export const CUSTOMER_AUTH_2FA_VERSION = '1.0.0';

export const DEFAULT_WEBAUTHN_CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_LOGIN_QR_TTL_MS = 2 * 60 * 1000;

export type WebAuthnPurpose = 'register' | 'login';

export type LoginQrStatus = 'PENDING' | 'APPROVED' | 'EXPIRED' | 'CONSUMED';

export type WebAuthnCredentialRow = {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: Uint8Array;
  counter: number;
  deviceType: string | null;
  backedUp: boolean;
  transports: unknown;
  deviceLabel: string | null;
};

export type WebAuthnCredentialListItem = {
  id: string;
  deviceLabel: string | null;
  deviceType: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export type LoginQrTicketRow = {
  id: string;
  userId: string | null;
  status: LoginQrStatus;
  expiresAt: Date;
  approvedAt: Date | null;
  consumedAt: Date | null;
};

export type QrTicketCreateResult = {
  ticket: string;
  expiresAt: string;
  approveUrl: string;
};

export type SecondFactorLoginHints = {
  webauthnAvailable: boolean;
  qrLoginAvailable: boolean;
};

export class CustomerAuth2faError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'CustomerAuth2faError';
  }
}

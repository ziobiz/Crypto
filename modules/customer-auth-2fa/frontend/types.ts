export type SecondFactorLoginHints = {
  webauthnAvailable?: boolean;
  qrLoginAvailable?: boolean;
};

export type WebAuthnCredentialListItem = {
  id: string;
  deviceLabel: string | null;
  deviceType: string | null;
  createdAt: string;
  lastUsedAt: string | null;
};

export type QrTicketCreate = {
  ticket: string;
  expiresAt: string;
  approveUrl: string;
};

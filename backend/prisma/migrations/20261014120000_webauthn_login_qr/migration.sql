-- WebAuthn credentials (individual biometric / passkey)
CREATE TABLE IF NOT EXISTS "webauthn_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "public_key" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "device_type" TEXT,
    "backed_up" BOOLEAN NOT NULL DEFAULT false,
    "transports" JSONB,
    "device_label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "webauthn_credentials_credential_id_key" ON "webauthn_credentials"("credential_id");
CREATE INDEX IF NOT EXISTS "webauthn_credentials_userId_idx" ON "webauthn_credentials"("userId");

ALTER TABLE "webauthn_credentials"
  ADD CONSTRAINT "webauthn_credentials_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Short-lived WebAuthn challenges
CREATE TABLE IF NOT EXISTS "webauthn_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webauthn_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "webauthn_challenges_userId_purpose_expiresAt_idx"
  ON "webauthn_challenges"("userId", "purpose", "expiresAt");

-- PC login QR tickets
CREATE TABLE IF NOT EXISTS "login_qr_tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_qr_tickets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "login_qr_tickets_status_expiresAt_idx" ON "login_qr_tickets"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "login_qr_tickets_userId_idx" ON "login_qr_tickets"("userId");

ALTER TABLE "login_qr_tickets"
  ADD CONSTRAINT "login_qr_tickets_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

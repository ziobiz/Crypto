-- CreateTable
CREATE TABLE IF NOT EXISTS "ticket_schedule_delays" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "delayHours" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_schedule_delays_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ticket_schedule_delays_ticketId_idx" ON "ticket_schedule_delays"("ticketId");
CREATE INDEX IF NOT EXISTS "ticket_schedule_delays_createdAt_idx" ON "ticket_schedule_delays"("createdAt");

DO $$ BEGIN
  ALTER TABLE "ticket_schedule_delays" ADD CONSTRAINT "ticket_schedule_delays_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "transaction_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ticket_schedule_delays" ADD CONSTRAINT "ticket_schedule_delays_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

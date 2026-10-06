-- Legal English first/last name for card payments (customer cannot self-edit)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "legal_first_name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "legal_last_name" TEXT;

-- 기업·개인이 동일 이메일로 각각 가입할 수 있도록 전역 유니크 해제
DROP INDEX IF EXISTS "users_email_key";
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

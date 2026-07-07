/** PG 비밀번호 정책 — 이메일 @ 앞 아이디 + "1!" */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function loginIdFromEmail(email: string): string {
  const local = normalizeEmail(email).split('@')[0];
  return local || email;
}

export function initialPasswordFromEmail(email: string): string {
  return `${loginIdFromEmail(email)}1!`;
}

export function isInitialPassword(email: string, plainPassword: string): boolean {
  return plainPassword === initialPasswordFromEmail(email);
}

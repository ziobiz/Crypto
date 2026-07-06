/** PG 비밀번호 정책 — 이메일 @ 앞 아이디 + "1!" */
export function loginIdFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim();
  return local || email;
}

export function initialPasswordFromEmail(email: string): string {
  return `${loginIdFromEmail(email)}1!`;
}

export function isInitialPassword(email: string, plainPassword: string): boolean {
  return plainPassword === initialPasswordFromEmail(email);
}

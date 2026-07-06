/**
 * Nginx가 같은 도메인에서 /api 를 프록시할 때 빈 문자열 = same-origin.
 * 로컬 개발은 frontend/.env.local 에 NEXT_PUBLIC_API_URL=http://localhost:4000
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined') return '';
  return 'http://localhost:4000';
}

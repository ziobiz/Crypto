/**
 * API 베이스 URL
 * - 운영(api.tinpass.com 등): 항상 same-origin → Nginx /api 프록시
 * - 로컬: frontend/.env.local 의 NEXT_PUBLIC_API_URL 또는 localhost:4000
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return '';
    }
  }

  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  return 'http://localhost:4000';
}

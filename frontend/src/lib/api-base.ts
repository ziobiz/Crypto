/**
 * API 베이스 URL
 * - 통합 서버(운영·로컬 :3000): same-origin → Nginx/Express /api
 * - 분리 개발(프론트만 next dev): frontend/.env.local 에 NEXT_PUBLIC_API_URL=http://localhost:4000
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (!isLocal) {
      return '';
    }
    const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    return '';
  }

  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  return '';
}

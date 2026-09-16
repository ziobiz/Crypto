export const AUTH_SESSION_COOKIE = 'tinpass_sess';
const PATH_KEY = 'tinpass_path';
const NEXT_KEY = 'tinpass_next';

function cookieAttrs(): string {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  const host = typeof location !== 'undefined' ? location.hostname : '';
  const domain = host === 'tinpass.com' || host.endsWith('.tinpass.com') ? '; Domain=.tinpass.com' : '';
  return `; Path=/; SameSite=Lax${secure}${domain}`;
}

export function writeAuthSessionCookie() {
  document.cookie = `${AUTH_SESSION_COOKIE}=1${cookieAttrs()}`;
}

export function clearAuthSessionCookie() {
  document.cookie = `${AUTH_SESSION_COOKIE}=; Max-Age=0${cookieAttrs()}`;
}

export function safeDashboardNext(raw?: string | null): string {
  const next = (raw ?? '').trim();
  if (!next.startsWith('/dashboard')) return '/dashboard';
  if (next.startsWith('//') || next.includes('://')) return '/dashboard';
  return next;
}

export function rememberAppPath(pathname: string, search: string) {
  if (typeof window === 'undefined') return;
  if (pathname.startsWith('/dashboard')) {
    sessionStorage.setItem(PATH_KEY, search ? `${pathname}?${search}` : pathname);
  }
  const next = new URLSearchParams(search).get('next');
  if (next?.startsWith('/dashboard')) {
    sessionStorage.setItem(NEXT_KEY, next);
  }
}

export function readSavedDashboardPath(): string | null {
  if (typeof window === 'undefined') return null;
  const saved = sessionStorage.getItem(PATH_KEY);
  return saved?.startsWith('/dashboard') ? saved : null;
}

export function takeLoginNext(): string | null {
  if (typeof window === 'undefined') return null;
  const fromUrl = new URLSearchParams(window.location.search).get('next');
  const fromStore = sessionStorage.getItem(NEXT_KEY);
  sessionStorage.removeItem(NEXT_KEY);
  if (fromUrl?.startsWith('/dashboard')) return fromUrl;
  if (fromStore?.startsWith('/dashboard')) return fromStore;
  return null;
}

export function clearMaskedPaths() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PATH_KEY);
  sessionStorage.removeItem(NEXT_KEY);
}

export function maskAddressBar() {
  if (typeof window === 'undefined') return;
  const dest = `${window.location.origin}/`;
  if (window.location.href === dest) return;
  window.history.replaceState(window.history.state, '', dest);
}

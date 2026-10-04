'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'tinpass_chunk_reload';

function shouldReloadForError(err: unknown): boolean {
  const msg = String(
    err && typeof err === 'object' && 'message' in err
      ? (err as { message?: unknown }).message
      : err ?? '',
  );
  return (
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    /Failed to find Server Action/i.test(msg) ||
    /Unexpected token '<'/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg)
  );
}

/**
 * 배포 직후 구 빌드 HTML/청크 불일치로 화면이 비는 경우 1회 강제 새로고침.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const bumpReload = () => {
      try {
        const last = sessionStorage.getItem(RELOAD_KEY);
        const now = String(Date.now());
        if (last && Date.now() - Number(last) < 15_000) return;
        sessionStorage.setItem(RELOAD_KEY, now);
        const url = new URL(window.location.href);
        url.searchParams.set('_r', now.slice(-6));
        window.location.replace(url.toString());
      } catch {
        window.location.reload();
      }
    };

    const onError = (event: ErrorEvent) => {
      if (shouldReloadForError(event.error) || shouldReloadForError(event.message)) {
        bumpReload();
      }
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (shouldReloadForError(event.reason)) {
        bumpReload();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}

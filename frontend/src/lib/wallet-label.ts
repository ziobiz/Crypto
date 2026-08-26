import type { MessageKey } from '@/i18n/messages';

const SYSTEM_DEFAULT_LABELS = new Set(['메인 USDT 지갑', 'Main USDT wallet', 'メイン USDT ウォレット']);

export function isSystemDefaultWalletLabel(label: string | null | undefined): boolean {
  const v = (label ?? '').trim();
  return !v || SYSTEM_DEFAULT_LABELS.has(v);
}

export function displayWalletLabel(
  label: string | null | undefined,
  t: (key: MessageKey) => string,
): string {
  if (isSystemDefaultWalletLabel(label)) return t('wallets.systemDefaultLabel');
  return (label ?? '').trim();
}

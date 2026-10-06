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

/** 목록·선택 UI: 닉네임 · 네트워크 */
export function displayWalletTitle(
  wallet: { label?: string | null; network?: string | null },
  t: (key: MessageKey) => string,
): string {
  const name = displayWalletLabel(wallet.label, t);
  const network = String(wallet.network || '').trim();
  return network ? `${name} · ${network}` : name;
}

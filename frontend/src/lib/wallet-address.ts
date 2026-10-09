/**
 * Client-side crypto address format checks (mirrors backend/src/lib/wallet-address.ts).
 */

const BASE58_ALPHABET = /^[1-9A-HJ-NP-Za-km-z]+$/;
const EVM_NETWORKS = new Set([
  'ERC20',
  'BEP20',
  'ETH',
  'POLYGON',
  'ARBITRUM',
  'OPTIMISM',
  'AVAX',
  'BASE',
]);

export type WalletAddressCheck = { ok: true } | { ok: false; reason: 'invalid' };

function hasIllegalChars(address: string): boolean {
  if (!address) return true;
  if (/\s/.test(address)) return true;
  // printable ASCII only — Hangul / fullwidth etc. fail
  // eslint-disable-next-line no-control-regex
  if (/[^\u0021-\u007E]/.test(address)) return true;
  return false;
}

function looksLikeEvm(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function looksLikeTron(address: string): boolean {
  return address.length === 34 && address.startsWith('T') && BASE58_ALPHABET.test(address);
}

function looksLikeSolana(address: string): boolean {
  return (
    address.length >= 32 &&
    address.length <= 44 &&
    !address.startsWith('0x') &&
    BASE58_ALPHABET.test(address)
  );
}

export function validateWalletAddressFormat(
  networkRaw: string,
  addressRaw: string,
): WalletAddressCheck {
  const network = String(networkRaw ?? '').trim().toUpperCase();
  const address = String(addressRaw ?? '').trim();
  if (!address || address.length < 10 || hasIllegalChars(address)) {
    return { ok: false, reason: 'invalid' };
  }
  if (EVM_NETWORKS.has(network)) {
    return looksLikeEvm(address) ? { ok: true } : { ok: false, reason: 'invalid' };
  }
  if (network === 'TRC20' || network === 'TRON') {
    return looksLikeTron(address) ? { ok: true } : { ok: false, reason: 'invalid' };
  }
  if (network === 'SOL' || network === 'SOLANA') {
    return looksLikeSolana(address) ? { ok: true } : { ok: false, reason: 'invalid' };
  }
  return { ok: true };
}

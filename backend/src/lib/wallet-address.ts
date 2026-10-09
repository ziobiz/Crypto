/**
 * Lightweight crypto address format checks (no chain RPC).
 * Catches wrong alphabet (e.g. Hangul), length, and obvious network mismatches.
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

export type WalletAddressValidation =
  | { ok: true; address: string }
  | { ok: false; code: 'WALLET_ADDRESS_INVALID'; message: string };

function normalizeNetwork(network: string): string {
  return String(network ?? '').trim().toUpperCase();
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

/** Reject non-ASCII (Hangul etc.), whitespace, and control chars early. */
function hasIllegalChars(address: string): boolean {
  if (!address) return true;
  if (/\s/.test(address)) return true;
  // eslint-disable-next-line no-control-regex
  if (/[^\u0021-\u007E]/.test(address)) return true;
  return false;
}

export function validateWalletAddressFormat(
  networkRaw: string,
  addressRaw: string,
): WalletAddressValidation {
  const network = normalizeNetwork(networkRaw);
  const address = String(addressRaw ?? '').trim();

  if (!address || address.length < 10) {
    return {
      ok: false,
      code: 'WALLET_ADDRESS_INVALID',
      message: 'Invalid wallet address',
    };
  }
  if (hasIllegalChars(address)) {
    return {
      ok: false,
      code: 'WALLET_ADDRESS_INVALID',
      message: 'Invalid wallet address (unsupported characters)',
    };
  }

  if (EVM_NETWORKS.has(network)) {
    if (!looksLikeEvm(address)) {
      return {
        ok: false,
        code: 'WALLET_ADDRESS_INVALID',
        message: 'Invalid EVM address (expected 0x + 40 hex characters)',
      };
    }
    return { ok: true, address };
  }

  if (network === 'TRC20' || network === 'TRON') {
    if (!looksLikeTron(address)) {
      return {
        ok: false,
        code: 'WALLET_ADDRESS_INVALID',
        message: 'Invalid TRON (TRC20) address',
      };
    }
    return { ok: true, address };
  }

  if (network === 'SOL' || network === 'SOLANA') {
    if (!looksLikeSolana(address)) {
      return {
        ok: false,
        code: 'WALLET_ADDRESS_INVALID',
        message: 'Invalid Solana address',
      };
    }
    return { ok: true, address };
  }

  // Unknown network: still reject illegal chars / empty; accept otherwise
  if (hasIllegalChars(address)) {
    return {
      ok: false,
      code: 'WALLET_ADDRESS_INVALID',
      message: 'Invalid wallet address',
    };
  }
  return { ok: true, address };
}

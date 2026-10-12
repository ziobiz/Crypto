/** 수령 지갑 자산 — 정산(USDT/USDC) + EURC 추가 등록 */
export type WalletReceiveAsset = 'USDT' | 'USDC' | 'EURC';
/** @deprecated alias — 정산은 USDT|USDC만 */
export type SettlementWalletAsset = 'USDT' | 'USDC';

/** UI 표시 순서: 정산 주력 USDC → USDT → EURC */
export const WALLET_RECEIVE_ASSETS_UI_ORDER: WalletReceiveAsset[] = [
  'USDC',
  'USDT',
  'EURC',
];

/** USDT: TRON 주력. USDC/EURC: Circle이 TRON 미지원 → TRC20 제외, Solana/Base 주력 */
export const WALLET_NETWORKS_BY_ASSET = {
  USDT: [
    { value: 'TRC20', label: 'TRC20 (Tron)' },
    { value: 'ERC20', label: 'ERC20 (Ethereum)' },
    { value: 'BEP20', label: 'BEP20 (BSC)' },
    { value: 'POLYGON', label: 'Polygon' },
    { value: 'ARBITRUM', label: 'Arbitrum' },
    { value: 'SOL', label: 'Solana (SPL)' },
    { value: 'OPTIMISM', label: 'Optimism' },
    { value: 'AVAX', label: 'Avalanche C-Chain' },
    { value: 'BASE', label: 'Base (bridged)' },
  ],
  USDC: [
    { value: 'SOL', label: 'Solana (SPL)' },
    { value: 'BASE', label: 'Base (native)' },
    { value: 'ERC20', label: 'ERC20 (Ethereum)' },
    { value: 'BEP20', label: 'BEP20 (BSC)' },
    { value: 'POLYGON', label: 'Polygon' },
    { value: 'ARBITRUM', label: 'Arbitrum' },
    { value: 'OPTIMISM', label: 'Optimism' },
    { value: 'AVAX', label: 'Avalanche C-Chain' },
  ],
  EURC: [
    { value: 'SOL', label: 'Solana (SPL)' },
    { value: 'BASE', label: 'Base (native)' },
    { value: 'ERC20', label: 'ERC20 (Ethereum)' },
    { value: 'BEP20', label: 'BEP20 (BSC)' },
    { value: 'POLYGON', label: 'Polygon' },
    { value: 'ARBITRUM', label: 'Arbitrum' },
    { value: 'OPTIMISM', label: 'Optimism' },
    { value: 'AVAX', label: 'Avalanche C-Chain' },
  ],
} as const;

/** @deprecated use WALLET_NETWORKS_BY_ASSET — kept for union type */
export const WALLET_NETWORKS = [...WALLET_NETWORKS_BY_ASSET.USDT] as const;

export const DEFAULT_NETWORK_BY_ASSET: Record<WalletReceiveAsset, string> = {
  USDT: 'TRC20',
  USDC: 'SOL',
  EURC: 'SOL',
};

/** HQ 가스피 표에 노출하는 네트워크 (자산별) */
export const GAS_FEE_NETWORKS_BY_ASSET = {
  USDT: ['TRC20', 'ERC20', 'BEP20', 'POLYGON', 'ARBITRUM', 'SOL', 'OPTIMISM', 'AVAX', 'BASE'] as const,
  USDC: ['SOL', 'BASE', 'ERC20', 'BEP20', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'AVAX'] as const,
  EURC: ['SOL', 'BASE', 'ERC20', 'BEP20', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'AVAX'] as const,
};

/** @deprecated use GAS_FEE_NETWORKS_BY_ASSET.USDT */
export const GAS_FEE_NETWORKS = GAS_FEE_NETWORKS_BY_ASSET.USDT;

export type WalletNetwork =
  | (typeof WALLET_NETWORKS_BY_ASSET.USDT)[number]['value']
  | (typeof WALLET_NETWORKS_BY_ASSET.USDC)[number]['value']
  | (typeof WALLET_NETWORKS_BY_ASSET.EURC)[number]['value'];

export function normalizeWalletReceiveAsset(
  asset: string | null | undefined,
): WalletReceiveAsset {
  const v = String(asset ?? 'USDT').trim().toUpperCase();
  if (v === 'USDC') return 'USDC';
  if (v === 'EURC') return 'EURC';
  return 'USDT';
}

export function networksForAsset(asset: string | null | undefined) {
  const a = normalizeWalletReceiveAsset(asset);
  return WALLET_NETWORKS_BY_ASSET[a];
}

export function defaultNetworkForAsset(asset: string | null | undefined) {
  return DEFAULT_NETWORK_BY_ASSET[normalizeWalletReceiveAsset(asset)];
}

export function isNetworkAllowedForAsset(
  network: string,
  asset: string | null | undefined,
): boolean {
  const code = String(network ?? '').trim().toUpperCase();
  return networksForAsset(asset).some((n) => n.value === code);
}

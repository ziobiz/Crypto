export type SettlementWalletAsset = 'USDT' | 'USDC';

/** USDT: TRON 주력. USDC: Circle이 TRON 미지원 → TRC20 제외, Solana/Base 주력 */
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
} as const;

/** @deprecated use WALLET_NETWORKS_BY_ASSET — kept for union type */
export const WALLET_NETWORKS = [
  ...WALLET_NETWORKS_BY_ASSET.USDT,
] as const;

export const DEFAULT_NETWORK_BY_ASSET: Record<SettlementWalletAsset, string> = {
  USDT: 'TRC20',
  USDC: 'SOL',
};

/** HQ 가스피 표에 노출하는 네트워크 (자산별) */
export const GAS_FEE_NETWORKS_BY_ASSET = {
  USDT: ['TRC20', 'ERC20', 'BEP20', 'POLYGON', 'ARBITRUM', 'SOL', 'OPTIMISM', 'AVAX', 'BASE'] as const,
  USDC: ['SOL', 'BASE', 'ERC20', 'BEP20', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'AVAX'] as const,
};

/** @deprecated use GAS_FEE_NETWORKS_BY_ASSET.USDT */
export const GAS_FEE_NETWORKS = GAS_FEE_NETWORKS_BY_ASSET.USDT;

export type WalletNetwork =
  | (typeof WALLET_NETWORKS_BY_ASSET.USDT)[number]['value']
  | (typeof WALLET_NETWORKS_BY_ASSET.USDC)[number]['value'];

export function networksForAsset(asset: SettlementWalletAsset | string | null | undefined) {
  return asset === 'USDC' ? WALLET_NETWORKS_BY_ASSET.USDC : WALLET_NETWORKS_BY_ASSET.USDT;
}

export function defaultNetworkForAsset(asset: SettlementWalletAsset | string | null | undefined) {
  return asset === 'USDC' ? DEFAULT_NETWORK_BY_ASSET.USDC : DEFAULT_NETWORK_BY_ASSET.USDT;
}

export function isNetworkAllowedForAsset(
  network: string,
  asset: SettlementWalletAsset | string | null | undefined,
): boolean {
  const code = String(network ?? '').trim().toUpperCase();
  return networksForAsset(asset).some((n) => n.value === code);
}

export const WALLET_NETWORKS = [
  { value: 'TRC20', label: 'TRC20 (Tron)' },
  { value: 'ERC20', label: 'ERC20 (Ethereum)' },
  { value: 'BEP20', label: 'BEP20 (BSC)' },
  { value: 'POLYGON', label: 'Polygon' },
  { value: 'ARBITRUM', label: 'Arbitrum' },
  { value: 'SOL', label: 'Solana (SPL)' },
  { value: 'OPTIMISM', label: 'Optimism' },
  { value: 'AVAX', label: 'Avalanche C-Chain' },
] as const;

export const GAS_FEE_NETWORKS = ['TRC20', 'ERC20', 'BEP20', 'POLYGON', 'ARBITRUM', 'SOL'] as const;

export type WalletNetwork = (typeof WALLET_NETWORKS)[number]['value'];

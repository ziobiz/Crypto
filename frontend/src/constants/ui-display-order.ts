/**
 * Admin / HQ UI display order (unified).
 * - Settlement assets: USDC before USDT
 * - Customer types: CORPORATE before INDIVIDUAL
 */

export const SETTLEMENT_ASSETS_UI_ORDER = ['USDC', 'USDT'] as const;
export type SettlementAssetUi = (typeof SETTLEMENT_ASSETS_UI_ORDER)[number];

export const CUSTOMER_TYPES_UI_ORDER = ['CORPORATE', 'INDIVIDUAL'] as const;
export type CustomerTypeUi = (typeof CUSTOMER_TYPES_UI_ORDER)[number];

/** Alias used by HQ limit / fee tabs */
export const LIMIT_CUSTOMER_TYPES = CUSTOMER_TYPES_UI_ORDER;

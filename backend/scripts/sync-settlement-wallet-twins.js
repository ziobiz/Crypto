/**
 * DISABLED — wallets must be registered separately for USDT and USDC.
 * Kept as a no-op stub so old runbooks do not accidentally mirror.
 */
console.log(
  JSON.stringify({
    ok: false,
    disabled: true,
    message:
      'Wallet mirror/twin sync is disabled. Customers register USDT and USDC wallets separately.',
  }),
);
process.exit(0);

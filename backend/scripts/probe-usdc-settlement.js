/**
 * Production probe: settlement=USDC trading readiness.
 * Run on server: node backend/scripts/probe-usdc-settlement.js
 */
const path = require('path');
process.chdir(path.join(__dirname, '..'));

async function main() {
  const { getSettlementAsset } = require('../dist/services/settlement-asset.service');
  const {
    getExchangeRateDisplay,
    calculateExpectedUsdt,
    calculateFromTargetUsdt,
  } = require('../dist/services/exchange-rate.service');
  const {
    getGasNetworksByAsset,
    getGasNetworkPolicy,
    resolveFeesForAmount,
  } = require('../dist/services/transaction-fee.service');
  const { gasFeeUsdtForNetwork } = require('../dist/constants/hq-policy');
  const {
    assertNetworkForAsset,
    defaultNetworkForAsset,
    WALLET_NETWORKS_BY_ASSET,
  } = require('../dist/services/wallet-policy.service');
  const {
    buildUsdtPurchaseInvoicePayload,
    buildSimulatorInvoicePayload,
  } = require('../dist/services/invoice-webhook.service');
  const { hqPolicyService } = require('../dist/services/hq-policy.service');
  const { prisma } = require('../dist/lib/prisma');

  const out = { ok: true, checks: [], tradeSample: null };
  const check = (name, pass, detail) => {
    out.checks.push({ name, pass: !!pass, detail });
    if (!pass) out.ok = false;
  };

  const asset = await getSettlementAsset();
  check('settlementAsset', asset === 'USDC' || asset === 'USDT', asset);

  const branding = await hqPolicyService.getPublicBranding();
  check('branding.settlementAsset', branding.settlementAsset === asset, branding.settlementAsset);

  for (const c of ['JPY', 'KRW', 'USD', 'THB']) {
    try {
      const r = await getExchangeRateDisplay(c);
      const rateNum = Number(r.usdtFiatRate ?? r.rate);
      check(
        `rate.${c}`,
        rateNum > 0 && (r.settlementAsset === asset || !r.settlementAsset),
        {
          rate: rateNum,
          usdtFiatRate: r.usdtFiatRate,
          settlementAsset: r.settlementAsset,
          source: r.source,
        },
      );
    } catch (e) {
      check(`rate.${c}`, false, e.message);
    }
  }

  const by = await getGasNetworksByAsset();
  const usdcCodes = (by.byAsset.USDC.networks ?? by.byAsset.USDC).map((r) => r.code);
  const usdtCodes = (by.byAsset.USDT.networks ?? by.byAsset.USDT).map((r) => r.code);
  check('gas.usdc.noTRC20', !usdcCodes.includes('TRC20'), usdcCodes.join(','));
  check('gas.usdc.hasSOL', usdcCodes.includes('SOL'), usdcCodes.join(','));
  check('gas.usdc.hasBASE', usdcCodes.includes('BASE'), usdcCodes.join(','));
  check('gas.usdt.hasTRC20', usdtCodes.includes('TRC20'), usdtCodes.join(','));

  const usdcPol = await getGasNetworkPolicy('USDC');
  const trcFee = gasFeeUsdtForNetwork(usdcPol, 'TRC20', 999);
  check('gas.usdc.TRC20.fallback', trcFee === 999, trcFee);

  try {
    assertNetworkForAsset('TRC20', 'USDC');
    check('assert.USDC.rejectTRC20', false, 'should throw');
  } catch (e) {
    check('assert.USDC.rejectTRC20', e.code === 'WALLET_NETWORK_ASSET', e.code);
  }
  check(
    'assert.USDC.acceptSOL',
    assertNetworkForAsset('SOL', 'USDC') === 'SOL',
    'SOL',
  );
  check(
    'networks.USDC.noTRC20',
    !WALLET_NETWORKS_BY_ASSET.USDC.includes('TRC20'),
    WALLET_NETWORKS_BY_ASSET.USDC.join(','),
  );

  const fees = await resolveFeesForAmount(
    {
      fxFeePercent: 0,
      gasFeeAmount: 0,
      transferFeeAmount: 0,
      otherFeeAmount: 0,
      network: defaultNetworkForAsset(asset),
      assetType: asset,
    },
    'JPY',
    100000,
  );
  check('fees.resolve.gasFixed', fees.gasFeeMode === 'fixed' && fees.gasFeeUsdt >= 0, fees);

  const inv = buildUsdtPurchaseInvoicePayload({
    ticketId: 'probe',
    ticketNo: 'PROBE-1',
    fiatAmount: 1000,
    fiatCurrency: 'JPY',
    assetAmount: 10,
    settlementAsset: asset,
  });
  check('invoice.asset', inv.payload.asset === asset, inv.payload.asset);
  check(
    'invoice.productCode',
    inv.payload.productCode === (asset === 'USDC' ? 'USDC-PURCHASE' : 'USDT-PURCHASE'),
    inv.payload.productCode,
  );

  const sim = buildSimulatorInvoicePayload({
    userId: 'u',
    runKey: 'abcdefghijkl',
    fiatAmount: 1000,
    fiatCurrency: 'JPY',
    assetAmount: 10,
    network: defaultNetworkForAsset(asset),
    settlementAsset: asset,
  });
  check('simInvoice.asset', sim.payload.asset === asset, sim.payload.asset);

  // Inventory only — no auto-mirror; customers register USDT/USDC wallets separately
  const wallets = await prisma.wallet.findMany({
    where: { isActive: true },
    select: {
      id: true,
      userId: true,
      assetType: true,
      network: true,
      isDefault: true,
      approvalStatus: true,
    },
    take: 500,
  });
  const matching = wallets.filter((w) => (w.assetType ?? 'USDT') === asset);
  const matchingApproved = matching.filter((w) => w.approvalStatus === 'APPROVED');
  const mismatchDefaults = wallets.filter(
    (w) => w.isDefault && (w.assetType ?? 'USDT') !== asset,
  );
  check('wallets.matching.inventory', true, {
    total: wallets.length,
    matching: matching.length,
    matchingApproved: matchingApproved.length,
    asset,
    note: 'USDT/USDC wallets are registered separately (no mirror)',
  });
  check(
    'wallets.default.perAssetOk',
    matchingApproved.length === 0 ||
      matchingApproved.some((w) => w.isDefault) ||
      mismatchDefaults.length === 0,
    {
      mismatchDefaults: mismatchDefaults.length,
      matchingDefaults: matching.filter((w) => w.isDefault).length,
    },
  );

  const badUsdc = wallets.filter(
    (w) =>
      (w.assetType ?? 'USDT') === 'USDC' && String(w.network).toUpperCase() === 'TRC20',
  );
  check('wallets.usdc.noTRC20', badUsdc.length === 0, badUsdc.map((w) => w.id).slice(0, 5));

  // Formal trade-path math + previewUsdtTransactionFees with a real matching wallet
  const sample = matchingApproved[0];
  if (sample) {
    try {
      const rateInfo = await getExchangeRateDisplay('JPY');
      const rateNum = Number(rateInfo.usdtFiatRate ?? rateInfo.rate);
      const walletRow = await prisma.wallet.findUnique({ where: { id: sample.id } });
      const resolved = await resolveFeesForAmount(
        {
          fxFeePercent: Number(walletRow.fxFeePercent),
          gasFeeAmount: Number(walletRow.gasFeeAmount),
          transferFeeAmount: Number(walletRow.transferFeeAmount),
          otherFeeAmount: Number(walletRow.otherFeeAmount),
          network: walletRow.network,
          assetType: asset,
        },
        'JPY',
        100000,
      );
      const fromFiat = calculateExpectedUsdt(100000, rateNum, resolved);
      const fromTarget = calculateFromTargetUsdt(50, rateNum, resolved);
      out.tradeSample = {
        walletId: sample.id,
        network: sample.network,
        assetType: sample.assetType,
        rate: rateNum,
        fromFiat,
        fromTarget,
        fees: resolved,
      };
      check(
        'trade.quote.fromFiat',
        Number.isFinite(fromFiat) && fromFiat > 0,
        fromFiat,
      );
      check(
        'trade.quote.fromTarget',
        fromTarget.requiredFiat > 0 && fromTarget.netUsdt === 50,
        fromTarget,
      );
      check(
        'trade.wallet.networkOk',
        WALLET_NETWORKS_BY_ASSET[asset].includes(
          String(sample.network).toUpperCase(),
        ),
        sample.network,
      );

      const owner = await prisma.user.findUnique({
        where: { id: sample.userId },
        include: { customerProfile: true },
      });
      if (owner?.customerProfile) {
        const { previewUsdtTransactionFees } = require('../dist/services/usdt-purchase.service');
        const authUser = {
          id: owner.id,
          email: owner.email,
          name: owner.name ?? owner.email,
          role: owner.role,
          organizationId: owner.organizationId,
          organizationPath: null,
          organizationType: null,
          customerProfileId: owner.customerProfile.id,
          merchantAdminUserId: null,
          operatorsEnabled: false,
        };
        const preview = await previewUsdtTransactionFees(authUser, {
          walletId: sample.id,
          fiatCurrency: 'JPY',
          targetUsdtAmount: 50,
          paymentMethod: 'BANK_TRANSFER',
          skipLimitValidation: true,
        });
        out.tradeSample.preview = {
          settlementAsset: preview.settlementAsset ?? null,
          fiatAmount: preview.fiatAmount ?? null,
          exchangeRate: preview.exchangeRate ?? null,
          netUsdt: preview.breakdown?.netUsdt ?? null,
        };
        const previewOk =
          preview.settlementAsset === asset &&
          Number(preview.exchangeRate ?? 0) > 0 &&
          Number(preview.fiatAmount ?? 0) > 0;
        check('trade.preview.service', previewOk, out.tradeSample.preview);
      } else {
        check('trade.preview.service', false, 'owner has no customerProfile');
      }
    } catch (e) {
      check('trade.quote', false, e.message);
    }
  } else {
    check(
      'trade.quote.skipped',
      true,
      'No approved matching wallet yet — customers must register this asset separately',
    );
  }

  if (asset === 'USDC') {
    const withoutUsdc = new Set(
      wallets.filter((w) => (w.assetType ?? 'USDT') !== 'USDC').map((w) => w.userId),
    );
    for (const w of wallets) {
      if ((w.assetType ?? 'USDT') === 'USDC') withoutUsdc.delete(w.userId);
    }
    check('ops.separateRegistration', true, {
      usersWithoutUsdcWallet: withoutUsdc.size,
      note: 'USDT and USDC wallets must be registered separately (mirror disabled)',
    });
  }

  console.log(JSON.stringify(out, null, 2));
  await prisma.$disconnect().catch(() => {});
  process.exit(out.ok ? 0 : 2);
}

main().catch(async (e) => {
  console.error(JSON.stringify({ ok: false, error: e.message, stack: e.stack }));
  process.exit(1);
});

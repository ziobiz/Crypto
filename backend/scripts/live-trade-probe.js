/**
 * Live trade probe: settlement asset swap + preview + create (small) + inspect.
 * Usage: node scripts/live-trade-probe.js [USDC|USDT]
 */
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const TARGET = String(process.argv[2] || 'USDC').toUpperCase() === 'USDT' ? 'USDT' : 'USDC';

async function main() {
  const { prisma } = require('../dist/lib/prisma');
  const { saveSettlementAsset, getSettlementAsset } = require('../dist/services/settlement-asset.service');
  const {
    previewUsdtTransactionFees,
    createUsdtPurchaseTicket,
    transitionUsdtPurchaseStatus,
  } = require('../dist/services/usdt-purchase.service');
  const { getExchangeRateDisplay } = require('../dist/services/exchange-rate.service');
  const { resolveUsdtRiskLimitForCustomer } = require('../dist/services/usdt-risk-limit.service');
  const { UserRole, WalletApprovalStatus, KycStatus, UsdtPurchaseStatus } = require('@prisma/client');

  const out = { target: TARGET, ok: true, steps: [] };
  const step = (name, pass, detail) => {
    out.steps.push({ name, pass: !!pass, detail });
    if (!pass) out.ok = false;
  };

  try {
    const before = await getSettlementAsset();
    if (before !== TARGET) {
      await saveSettlementAsset(TARGET);
    }
    const asset = await getSettlementAsset();
    step('settlement.set', asset === TARGET, { before, asset });

    const rate = await getExchangeRateDisplay('JPY');
    const rateNum = Number(rate.usdtFiatRate ?? rate.rate);
    step('rate.JPY', rateNum > 0 && rate.settlementAsset === TARGET, {
      rate: rateNum,
      settlementAsset: rate.settlementAsset,
      source: rate.source,
    });

    const { isUsdtPayMethodAllowed } = require('../dist/lib/usdt-pay-method-access');
    const { hqPolicyService } = require('../dist/services/hq-policy.service');

    // Prefer bank-enabled approved customer with matching wallet + KYC (CORPORATE first)
    const walletCandidates = await prisma.wallet.findMany({
      where: {
        isActive: true,
        deleteRequestedAt: null,
        approvalStatus: WalletApprovalStatus.APPROVED,
        assetType: TARGET,
        user: {
          role: UserRole.CUSTOMER,
          customerProfile: { isNot: null },
        },
      },
      include: {
        user: {
          include: {
            customerProfile: true,
            kyc: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      take: 40,
    });

    walletCandidates.sort((a, b) => {
      const aCorp = a.user?.customerProfile?.customerType === 'CORPORATE' ? 0 : 1;
      const bCorp = b.user?.customerProfile?.customerType === 'CORPORATE' ? 0 : 1;
      return aCorp - bCorp;
    });

    let wallet = null;
    for (const cand of walletCandidates) {
      const cp = cand.user?.customerProfile;
      if (!cp) continue;
      const kyc = cand.user.kyc;
      const kycOk =
        !!kyc &&
        (kyc.status === KycStatus.APPROVED || String(kyc.status) === 'APPROVED');
      if (!kycOk) continue;
      let hqBankOk = true;
      try {
        hqBankOk = await hqPolicyService.hqServiceMethodEnabled('BANK', cp.customerType);
      } catch {
        hqBankOk = cp.customerType === 'CORPORATE';
      }
      const bankOk = isUsdtPayMethodAllowed({
        mode: cp.usdtPayBankMode,
        method: 'BANK',
        customerType: cp.customerType,
        hqMethodAllowed: hqBankOk,
      });
      if (!bankOk) continue;
      wallet = cand;
      break;
    }

    if (!wallet?.user?.customerProfile) {
      step('wallet.find', false, {
        message: 'no approved matching wallet with bank-enabled customerProfile',
        scanned: walletCandidates.length,
      });
      console.log(JSON.stringify(out, null, 2));
      await prisma.$disconnect().catch(() => {});
      process.exit(2);
    }

    const profile = wallet.user.customerProfile;
    const latestKyc = wallet.user.kyc ?? null;
    const kycOk =
      !latestKyc ||
      latestKyc.status === KycStatus.APPROVED ||
      String(latestKyc.status) === 'APPROVED';
    step('wallet.find', true, {
      walletId: wallet.id,
      network: wallet.network,
      assetType: wallet.assetType,
      userId: wallet.userId,
      email: wallet.user.email,
      customerProfileId: profile.id,
      customerType: profile.customerType,
      bankMode: profile.usdtPayBankMode,
      kyc: latestKyc?.status ?? null,
      kycOk,
    });

    const authUser = {
      id: wallet.user.id,
      email: wallet.user.email,
      name: wallet.user.name ?? wallet.user.email,
      role: UserRole.CUSTOMER,
      organizationId: wallet.user.organizationId,
      organizationPath: null,
      organizationType: null,
      customerProfileId: profile.id,
      merchantAdminUserId: null,
      operatorsEnabled: false,
    };

    let targetAmount = 10;
    try {
      const limit = await resolveUsdtRiskLimitForCustomer(profile.id, {
        paymentMethod: 'BANK_TRANSFER',
      });
      const minUsdt = Number(limit?.minUsdt ?? 0);
      if (minUsdt > targetAmount) targetAmount = minUsdt;
      step('risk.limit', true, { minUsdt, maxUsdt: limit?.maxUsdt, code: limit?.code, targetAmount });
    } catch (e) {
      step('risk.limit', false, { message: e.message });
      targetAmount = 10000;
    }

    let preview;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        preview = await previewUsdtTransactionFees(authUser, {
          walletId: wallet.id,
          fiatCurrency: 'JPY',
          targetUsdtAmount: targetAmount,
          paymentMethod: 'BANK_TRANSFER',
        });
        step('preview.target', Number(preview.exchangeRate) > 0 && Number(preview.fiatAmount) > 0, {
          settlementAsset: preview.settlementAsset,
          targetAmount,
          fiatAmount: preview.fiatAmount,
          exchangeRate: preview.exchangeRate,
          netUsdt: preview.breakdown?.netUsdt,
          gas: preview.fees?.gasFeeUsdt,
          attempt,
        });
        step(
          'preview.settlementAsset',
          preview.settlementAsset === TARGET || preview.settlementAsset == null,
          preview.settlementAsset,
        );
        break;
      } catch (e) {
        const minFromErr = Number(e.details?.minUsdt ?? 0);
        if (e.code === 'USDT_RISK_MIN' && minFromErr > targetAmount) {
          targetAmount = Math.ceil(minFromErr * 1000) / 1000;
          step('preview.retryRiskMin', true, { nextTarget: targetAmount, attempt });
          continue;
        }
        step('preview.target', false, {
          message: e.message,
          code: e.code,
          details: e.details ?? null,
          attempt,
        });
        break;
      }
    }

    let ticket = null;
    if (preview && Number(preview.fiatAmount) > 0) {
      try {
        ticket = await createUsdtPurchaseTicket(authUser, {
          walletId: wallet.id,
          fiatCurrency: 'JPY',
          targetUsdtAmount: targetAmount,
          paymentMethod: 'BANK_TRANSFER',
          expressTier: null,
        });
        const detail = ticket.usdtPurchase || ticket.usdtPurchaseDetail || null;
        const ticketNoOk =
          !!ticket?.ticketNo && String(ticket.ticketNo).startsWith(`${TARGET}-`);
        step('create.ticket', !!ticket?.id, {
          ticketId: ticket?.id,
          ticketNo: ticket?.ticketNo,
          status: ticket?.status,
          type: ticket?.type,
          walletId: detail?.walletId,
          expectedUsdt: detail?.expectedUsdtAmount ?? detail?.targetUsdtAmount,
          fiatAmount: detail?.fiatAmount,
          network: detail?.walletNetworkSnapshot ?? wallet.network,
        });
        step('create.ticketNoPrefix', ticketNoOk, {
          expectedPrefix: `${TARGET}-`,
          ticketNo: ticket?.ticketNo ?? null,
        });

        const full = await prisma.transactionTicket.findUnique({
          where: { id: ticket.id },
          include: { usdtPurchase: { include: { wallet: true } } },
        });
        const up = full?.usdtPurchase;
        step('create.db.walletAsset', (up?.wallet?.assetType ?? '') === TARGET, {
          walletAsset: up?.wallet?.assetType,
          walletId: up?.walletId,
          expectedUsdt: up?.expectedUsdtAmount != null ? String(up.expectedUsdtAmount) : null,
          targetUsdt: up?.targetUsdtAmount != null ? String(up.targetUsdtAmount) : null,
          fiat: up?.fiatAmount != null ? String(up.fiatAmount) : null,
          status: up?.status,
        });

        // Cleanup: cancel probe ticket as HQ admin
        const hq = await prisma.user.findFirst({
          where: {
            role: { in: [UserRole.SUPER_ADMIN, UserRole.ORG_STAFF, UserRole.SETTLEMENT_ADMIN] },
            isActive: true,
          },
          orderBy: { createdAt: 'asc' },
        });
        if (hq && ticket?.id) {
          try {
            const cancelled = await transitionUsdtPurchaseStatus(
              {
                id: hq.id,
                email: hq.email,
                name: hq.name ?? hq.email,
                role: hq.role,
                organizationId: hq.organizationId,
                organizationPath: null,
                organizationType: null,
                customerProfileId: null,
                merchantAdminUserId: null,
                operatorsEnabled: false,
              },
              ticket.id,
              UsdtPurchaseStatus.CANCELLED,
              { cancelReason: `live-trade-probe cleanup ${TARGET}` },
            );
            const st =
              cancelled?.usdtPurchase?.status ??
              cancelled?.status ??
              null;
            step('cleanup.cancel', String(st) === 'CANCELLED', {
              ticketId: ticket.id,
              status: st,
            });
          } catch (e) {
            step('cleanup.cancel', false, { message: e.message, code: e.code });
          }
        } else {
          step('cleanup.cancel', false, 'no HQ user for cancel');
        }
      } catch (e) {
        step('create.ticket', false, {
          message: e.message,
          code: e.code,
          details: e.details ?? e.meta ?? null,
        });
      }
    } else {
      step('create.ticket', false, 'skipped — preview failed');
    }

    out.ticketId = ticket?.id ?? null;
    out.ticketNo = ticket?.ticketNo ?? null;
    out.targetAmount = targetAmount;
  } catch (e) {
    step('fatal', false, { message: e.message, stack: e.stack });
  }

  console.log(JSON.stringify(out, null, 2));
  await prisma.$disconnect().catch(() => {});
  process.exit(out.ok ? 0 : 2);
}

main().catch(async (e) => {
  console.error(JSON.stringify({ ok: false, error: e.message, stack: e.stack }));
  try {
    require('../dist/lib/prisma').prisma.$disconnect();
  } catch {}
  process.exit(1);
});

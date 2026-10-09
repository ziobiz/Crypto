/**
 * List approved USDT wallets with bank-pay eligibility snapshot.
 */
const path = require('path');
process.chdir(path.join(__dirname, '..'));

async function main() {
  const { prisma } = require('../dist/lib/prisma');
  const { isUsdtPayMethodAllowed } = require('../dist/lib/usdt-pay-method-access');
  const { hqPolicyService } = require('../dist/services/hq-policy.service');

  const wallets = await prisma.wallet.findMany({
    where: {
      isActive: true,
      deleteRequestedAt: null,
      approvalStatus: 'APPROVED',
      assetType: 'USDT',
      user: { role: 'CUSTOMER', customerProfile: { isNot: null } },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          customerProfile: {
            select: {
              id: true,
              customerType: true,
              usdtPayBankMode: true,
              usdtPayRemittanceMode: true,
              usdtCollectionMode: true,
            },
          },
          kyc: { select: { status: true } },
        },
      },
    },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    take: 40,
  });

  const rows = [];
  for (const w of wallets) {
    const cp = w.user.customerProfile;
    let hqBankOk = null;
    try {
      hqBankOk = await hqPolicyService.hqServiceMethodEnabled('BANK', cp.customerType);
    } catch (e) {
      hqBankOk = `err:${e.message}`;
    }
    const bankOk =
      typeof hqBankOk === 'boolean'
        ? isUsdtPayMethodAllowed({
            mode: cp.usdtPayBankMode,
            method: 'BANK',
            customerType: cp.customerType,
            hqMethodAllowed: hqBankOk,
          })
        : false;
    rows.push({
      email: w.user.email,
      network: w.network,
      type: cp.customerType,
      bankMode: cp.usdtPayBankMode,
      hqBankOk,
      bankOk,
      kyc: w.user.kyc?.status ?? null,
      walletId: w.id,
    });
  }
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect().catch(() => {});
}

main().catch(async (e) => {
  console.error(e);
  try {
    require('../dist/lib/prisma').prisma.$disconnect();
  } catch {}
  process.exit(1);
});

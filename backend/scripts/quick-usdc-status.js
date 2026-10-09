const path = require('path');
process.chdir(path.join(__dirname, '..'));
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const { getSettlementAsset } = require('../dist/services/settlement-asset.service');
  const asset = await getSettlementAsset();
  const counts = await p.wallet.groupBy({
    by: ['assetType'],
    where: { isActive: true },
    _count: true,
  });
  const usdcApproved = await p.wallet.count({
    where: { isActive: true, assetType: 'USDC', approvalStatus: 'APPROVED', deleteRequestedAt: null },
  });
  console.log(JSON.stringify({ settlementAsset: asset, counts, usdcApproved }, null, 2));
  await p.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await p.$disconnect().catch(() => {});
  process.exit(1);
});

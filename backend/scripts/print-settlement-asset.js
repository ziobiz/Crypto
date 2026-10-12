const path = require('path');
process.chdir(path.join(__dirname, '..'));
async function main() {
  const { getSettlementAsset } = require('../dist/services/settlement-asset.service');
  const asset = await getSettlementAsset();
  console.log(JSON.stringify({ settlementAsset: asset }));
  await require('../dist/lib/prisma').prisma.$disconnect().catch(() => {});
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

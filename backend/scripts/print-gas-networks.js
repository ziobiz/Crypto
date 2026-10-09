const path = require('path');
process.chdir(path.join(__dirname, '..'));
async function main() {
  const { prisma } = require('../dist/lib/prisma');
  const row = await prisma.systemConfig.findUnique({
    where: { key: 'hq.commission.gas_networks' },
  });
  console.log(JSON.stringify(row?.value ?? null, null, 2));
  await prisma.$disconnect().catch(() => {});
}
main().catch(async (e) => {
  console.error(e);
  try {
    require('../dist/lib/prisma').prisma.$disconnect();
  } catch {}
  process.exit(1);
});

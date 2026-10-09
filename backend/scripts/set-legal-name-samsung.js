const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const r = await p.user.updateMany({
    where: { email: 'samsung.th@gmail.com' },
    data: { legalFirstName: 'BYOUNGSUN', legalLastName: 'YI' },
  });
  console.log(JSON.stringify(r));
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

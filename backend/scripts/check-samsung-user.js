const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const EMAIL = 'samsung.th@gmail.com';

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: EMAIL },
    include: {
      customerProfile: true,
      bankAccounts: true,
      wallets: true,
    },
  });
  const cid = user.customerProfile.id;

  const byCurrency = await prisma.usdtPurchaseDetail.groupBy({
    by: ['fiatCurrency'],
    where: { ticket: { customerId: cid }, adminNote: { contains: '[TEST' } },
    _count: true,
  });

  console.log(
    JSON.stringify(
      {
        name: user.name,
        email: user.email,
        banks: user.bankAccounts.map((b) => ({ currency: b.currency, bank: b.bankName, active: b.isActive })),
        testUsdtByCurrency: byCurrency,
      },
      null,
      2,
    ),
  );
}

main()
  .finally(() => prisma.$disconnect());

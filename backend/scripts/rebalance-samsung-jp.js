/**
 * Align samsung.th@gmail.com (primary market: Japan) with JPY profile + test data.
 * - Add/default JPY bank account
 * - Convert [TEST SEED] / [TEST R2] non-JPY tickets to JPY with recalculated USDT
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const EMAIL = 'samsung.th@gmail.com';
const JPY_RATE = 148.5;

function netUsdt(fiat, rate = JPY_RATE) {
  const gross = fiat / rate;
  const fxFee = +(gross * 0.005).toFixed(8);
  return +(gross - fxFee - 1 - 2 - 0.5).toFixed(8);
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: EMAIL, deletedAt: null },
    include: { bankAccounts: true, customerProfile: true },
  });
  if (!user?.customerProfile) throw new Error('user missing');

  const bankUpdates = [];
  let jpyBank = user.bankAccounts.find((b) => b.currency === 'JPY' && b.isActive);
  if (!jpyBank) {
    jpyBank = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        currency: 'JPY',
        bankName: '三菱UFJ銀行',
        branchName: '渋谷支店',
        accountNumber: '1234567',
        accountHolder: user.name,
        isDefault: true,
        isActive: true,
      },
    });
    bankUpdates.push('created JPY bank (三菱UFJ)');
  } else {
    await prisma.bankAccount.update({
      where: { id: jpyBank.id },
      data: { isDefault: true, bankName: jpyBank.bankName || '三菱UFJ銀行' },
    });
    bankUpdates.push('JPY bank set default');
  }

  for (const b of user.bankAccounts) {
    if (b.currency !== 'JPY' && b.isDefault) {
      await prisma.bankAccount.update({ where: { id: b.id }, data: { isDefault: false } });
      bankUpdates.push(`unset default ${b.currency}`);
    }
  }

  const testDetails = await prisma.usdtPurchaseDetail.findMany({
    where: {
      ticket: { customerId: user.customerProfile.id },
      OR: [{ adminNote: { contains: '[TEST SEED' } }, { adminNote: { contains: '[TEST R2' } }],
    },
    include: { ticket: true },
  });

  const converted = [];
  for (const d of testDetails) {
    if (d.fiatCurrency === 'JPY') continue;
    const oldFiat = Number(d.fiatAmount);
    let newFiat;
    switch (d.fiatCurrency) {
      case 'KRW':
        newFiat = Math.round(oldFiat / 9.3); // ~1380/148.5
        break;
      case 'THB':
        newFiat = Math.round(oldFiat * 4.3);
        break;
      case 'CNY':
        newFiat = Math.round(oldFiat * 20.6);
        break;
      case 'USD':
        newFiat = Math.round(oldFiat * JPY_RATE);
        break;
      default:
        newFiat = Math.max(50000, Math.round(oldFiat));
    }
    newFiat = Math.min(5_000_000, Math.max(30_000, newFiat));
    const expected = netUsdt(newFiat);
    await prisma.usdtPurchaseDetail.update({
      where: { id: d.id },
      data: {
        fiatCurrency: 'JPY',
        fiatAmount: newFiat,
        exchangeRate: JPY_RATE,
        exchangeSource: 'jp_rebalance',
        expectedUsdtAmount: expected,
        expectedUsdtMin: +(expected * 0.995).toFixed(8),
        expectedUsdtMax: +(expected * 1.005).toFixed(8),
        actualUsdtAmount:
          d.status === 'COMPLETED' && d.actualUsdtAmount != null ? expected : d.actualUsdtAmount,
        adminNote: `${d.adminNote || ''} [JP rebalance ${d.fiatCurrency}→JPY]`.trim(),
      },
    });
    converted.push({
      ticketNo: d.ticket.ticketNo,
      from: d.fiatCurrency,
      oldFiat,
      newFiat,
    });
  }

  const byCurrency = await prisma.usdtPurchaseDetail.groupBy({
    by: ['fiatCurrency'],
    where: {
      ticket: { customerId: user.customerProfile.id },
      OR: [{ adminNote: { contains: '[TEST SEED' } }, { adminNote: { contains: '[TEST R2' } }],
    },
    _count: true,
  });

  console.log(
    JSON.stringify(
      {
        email: EMAIL,
        bankUpdates,
        convertedCount: converted.length,
        convertedSample: converted.slice(0, 5),
        testUsdtByCurrency: byCurrency,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

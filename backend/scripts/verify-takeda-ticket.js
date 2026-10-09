const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  const t = await p.transactionTicket.findFirst({
    where: { ticketNo: 'USDT-20261005-4589' },
    include: { usdtPurchase: { include: { wallet: true } } },
  });
  const d = t?.usdtPurchase;
  console.log(
    JSON.stringify(
      {
        ticketNo: t?.ticketNo,
        walletId: d?.walletId,
        snapAddr: d?.walletAddressSnapshot,
        snapNet: d?.walletNetworkSnapshot,
        walletLabel: d?.wallet?.label,
        walletNet: d?.wallet?.network,
        walletAddr: d?.wallet?.address,
      },
      null,
      2,
    ),
  );
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

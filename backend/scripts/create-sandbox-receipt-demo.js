/**
 * One-shot: create SAND customer + complete sandbox USDT ticket + trade receipt log.
 * Run on server: cd /var/www/crypto-workflow/backend && node scripts/create-sandbox-receipt-demo.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient, UsdtPurchaseStatus, TicketType, CustomerType } = require('@prisma/client');

const EMAIL = 'sandbox.receipt.demo@tinpass.local';
const PASSWORD = 'sandboxdemo1!';
const NAME = '샌드박스 명세서 데모';

async function main() {
  const prisma = new PrismaClient();
  try {
    const hq =
      (await prisma.organization.findFirst({
        where: { type: 'HEAD_OFFICE', isActive: true },
        orderBy: { createdAt: 'asc' },
      })) ||
      (await prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } }));
    if (!hq) throw new Error('No organization found for recruitingOrg');

    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (!admin) throw new Error('SUPER_ADMIN not found');

    let user = await prisma.user.findFirst({
      where: { email: { equals: EMAIL, mode: 'insensitive' } },
      include: { customerProfile: true, wallets: true },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(PASSWORD, 10);
      user = await prisma.user.create({
        data: {
          email: EMAIL,
          passwordHash,
          name: NAME,
          role: 'CUSTOMER',
          isActive: true,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          passwordMustChange: false,
          customerProfile: {
            create: {
              customerType: CustomerType.CORPORATE,
              businessName: 'Sandbox Receipt Demo Co.',
              recruitingOrgId: hq.id,
              simulatorEnabled: true,
              simulatorRateMode: 'SAND',
              tradeReceiptEmailMode: 'FOLLOW_HQ',
            },
          },
          wallets: {
            create: {
              label: 'Sandbox TRC20',
              address: 'TSandboxReceiptDemo111111111111111',
              network: 'TRC20',
              isDefault: true,
              isActive: true,
              hqRegistered: true,
              approvalStatus: 'APPROVED',
            },
          },
        },
        include: { customerProfile: true, wallets: true },
      });
      console.log('Created customer', EMAIL);
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: NAME,
          isActive: true,
          deletedAt: null,
          passwordMustChange: false,
          passwordHash: await bcrypt.hash(PASSWORD, 10),
        },
      });
      if (user.customerProfile) {
        await prisma.customerProfile.update({
          where: { id: user.customerProfile.id },
          data: {
            simulatorEnabled: true,
            simulatorRateMode: 'SAND',
            tradeReceiptEmailMode: 'FOLLOW_HQ',
            businessName: user.customerProfile.businessName || 'Sandbox Receipt Demo Co.',
          },
        });
      } else {
        await prisma.customerProfile.create({
          data: {
            userId: user.id,
            customerType: CustomerType.CORPORATE,
            businessName: 'Sandbox Receipt Demo Co.',
            recruitingOrgId: hq.id,
            simulatorEnabled: true,
            simulatorRateMode: 'SAND',
            tradeReceiptEmailMode: 'FOLLOW_HQ',
          },
        });
      }
      if (!user.wallets?.length) {
        await prisma.wallet.create({
          data: {
            userId: user.id,
            label: 'Sandbox TRC20',
            address: 'TSandboxReceiptDemo111111111111111',
            network: 'TRC20',
            isDefault: true,
            isActive: true,
            hqRegistered: true,
            approvalStatus: 'APPROVED',
          },
        });
      }
      user = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { customerProfile: true, wallets: true },
      });
      console.log('Updated customer', EMAIL);
    }

    const wallet =
      user.wallets.find((w) => w.isDefault && w.isActive) ||
      user.wallets.find((w) => w.isActive) ||
      user.wallets[0];
    if (!wallet) throw new Error('No wallet');
    if (!user.customerProfile) throw new Error('No customerProfile');

    const fiatAmount = 150000;
    const exchangeRate = 150;
    const expectedUsdt = Number((fiatAmount / exchangeRate).toFixed(8));
    const actualUsdt = expectedUsdt;
    const ticketNo = `USDT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-SBOX`;
    const usdtTxId = `SANDBOX-DEMO-${Date.now()}`;

    const existing = await prisma.transactionTicket.findUnique({ where: { ticketNo } });
    if (existing) {
      await prisma.tradeReceiptEmailLog.deleteMany({ where: { ticketId: existing.id } });
      await prisma.ticketStatusHistory.deleteMany({ where: { ticketId: existing.id } });
      await prisma.usdtPurchaseDetail.deleteMany({ where: { ticketId: existing.id } });
      await prisma.transactionTicket.delete({ where: { id: existing.id } });
    }

    const ticket = await prisma.transactionTicket.create({
      data: {
        ticketNo,
        type: TicketType.USDT_PURCHASE,
        customerId: user.customerProfile.id,
        commissionSettled: true,
        commissionSettledAt: new Date(),
        usdtPurchase: {
          create: {
            status: UsdtPurchaseStatus.COMPLETED,
            fiatAmount,
            fiatCurrency: 'JPY',
            exchangeRate,
            exchangeRateAt: new Date(),
            exchangeSource: 'SANDBOX_DEMO',
            expectedUsdtAmount: expectedUsdt,
            expectedUsdtMin: expectedUsdt,
            expectedUsdtMax: expectedUsdt,
            actualUsdtAmount: actualUsdt,
            usdtTxId,
            walletId: wallet.id,
            collectionProvider: 'FIXED',
            adminNote: '[SANDBOX] Demo trade receipt sample',
            fxFeePercentSnapshot: 0,
            gasFeeSnapshot: 0,
            transferFeeSnapshot: 0,
            otherFeeSnapshot: 0,
            platformFeeSnapshot: 0,
          },
        },
      },
      include: { usdtPurchase: true },
    });

    const statuses = [
      [null, UsdtPurchaseStatus.APPLICATION_COMPLETED, '샌드박스 데모 신청'],
      [
        UsdtPurchaseStatus.APPLICATION_COMPLETED,
        UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
        '샌드박스 입금 대기',
      ],
      [
        UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
        UsdtPurchaseStatus.ADMIN_REVIEWING,
        '샌드박스 입금 확인',
      ],
      [
        UsdtPurchaseStatus.ADMIN_REVIEWING,
        UsdtPurchaseStatus.TRANSFER_IN_PROGRESS,
        '샌드박스 송금 중',
      ],
      [
        UsdtPurchaseStatus.TRANSFER_IN_PROGRESS,
        UsdtPurchaseStatus.COMPLETED,
        '[SANDBOX] Demo completed',
      ],
    ];
    for (const [fromStatus, toStatus, note] of statuses) {
      await prisma.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus,
          toStatus,
          changedById: admin.id,
          note,
        },
      });
    }

    // Prefer service so SMTP/policy/log match production
    let receiptLog = null;
    try {
      const { sendTradeReceiptEmail } = require('../dist/services/trade-email.service');
      receiptLog = await sendTradeReceiptEmail({
        to: EMAIL,
        userName: NAME,
        ticketNo,
        ticketId: ticket.id,
        ticketType: 'USDT_PURCHASE',
        fiatAmount,
        fiatCurrency: 'JPY',
        expectedUsdt,
        actualUsdt,
        usdtTxId,
        customerProfileId: user.customerProfile.id,
      });
    } catch (err) {
      console.warn('sendTradeReceiptEmail failed, writing SKIPPED log:', err?.message || err);
      receiptLog = await prisma.tradeReceiptEmailLog.create({
        data: {
          ticketId: ticket.id,
          ticketNo,
          ticketType: 'USDT_PURCHASE',
          toEmail: EMAIL,
          toName: NAME,
          subject: `[SANDBOX] Trade receipt ${ticketNo}`,
          bodyText: `Sandbox demo receipt\nTicket: ${ticketNo}\nAmount: ${fiatAmount} JPY\nUSDT: ${actualUsdt}\nTx: ${usdtTxId}`,
          bodyHtml: `<p>Sandbox demo receipt</p><p>${ticketNo}</p><p>${fiatAmount} JPY / ${actualUsdt} USDT</p>`,
          status: 'SKIPPED',
          skipReason: 'HQ_ONLY',
          customerProfileId: user.customerProfile.id,
        },
      });
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          customerEmail: EMAIL,
          customerPassword: PASSWORD,
          ticketId: ticket.id,
          ticketNo,
          usdtTxId,
          fiatAmount,
          fiatCurrency: 'JPY',
          expectedUsdt,
          actualUsdt,
          receiptLogId: receiptLog?.id ?? null,
          receiptStatus: receiptLog?.status ?? null,
          detailUrl: `https://tinpass.com/dashboard/usdt/${ticket.id}`,
          receiptsUrl: 'https://tinpass.com/dashboard/trade-receipts',
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

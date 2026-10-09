/**
 * One-off: nickname wallets for h.takeda@onthelinejp.com
 * and retarget ticket USDT-20261005-4589 to MEXC ERC wallet.
 */
const { PrismaClient } = require('@prisma/client');

const EMAIL = 'h.takeda@onthelinejp.com';
const TICKET_NO = 'USDT-20261005-4589';

const NICKS = [
  { address: 'TEFjkyk4tMLpb2onqTWGej44SWTv3crPVa', networkHint: 'TRC', label: 'MEXC TRC' },
  { address: '0xbbb2c3fb0046f6480c39c113b5274475a06e8a35', networkHint: 'BEP', label: 'MEXC BEP' },
  { address: '0xbbb2c3fb0046f6480c39c113b5274475a06e8a35', networkHint: 'ERC', label: 'MEXC ERC' },
  { address: '0xa766A96d8196bAcf41d1dDadDb81671a1b2A94B4', networkHint: 'ERC', label: 'WIREX ERC' },
];

function normAddr(a) {
  return String(a || '').trim();
}
function addrKey(a) {
  const s = normAddr(a);
  if (s.startsWith('0x') || s.startsWith('0X')) return s.toLowerCase();
  return s;
}
function netKey(n) {
  return String(n || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}
function matchNetwork(walletNet, hint) {
  const n = netKey(walletNet);
  const h = netKey(hint);
  if (h === 'TRC') return n.includes('TRC') || n.includes('TRON');
  if (h === 'BEP') return n.includes('BEP') || n.includes('BSC') || n.includes('BNB');
  if (h === 'ERC') return n.includes('ERC') || n.includes('ETH') || n === 'ETHEREUM';
  return n.includes(h);
}

(async () => {
  const p = new PrismaClient();
  const user = await p.user.findFirst({
    where: { email: { equals: EMAIL, mode: 'insensitive' } },
    include: { wallets: { where: { isActive: true }, orderBy: { createdAt: 'asc' } } },
  });
  if (!user) {
    console.log(JSON.stringify({ ok: false, error: 'user not found' }));
    await p.$disconnect();
    return;
  }

  const before = user.wallets.map((w) => ({
    id: w.id,
    label: w.label,
    network: w.network,
    address: w.address,
    isDefault: w.isDefault,
  }));

  const updates = [];
  const used = new Set();
  for (const spec of NICKS) {
    const hit = user.wallets.find((w) => {
      if (used.has(w.id)) return false;
      if (addrKey(w.address) !== addrKey(spec.address)) return false;
      return matchNetwork(w.network, spec.networkHint);
    });
    if (!hit) {
      updates.push({ label: spec.label, action: 'missing', address: spec.address, networkHint: spec.networkHint });
      continue;
    }
    used.add(hit.id);
    const updated = await p.wallet.update({
      where: { id: hit.id },
      data: { label: spec.label },
    });
    updates.push({
      action: 'renamed',
      id: updated.id,
      label: updated.label,
      network: updated.network,
      address: updated.address,
      before: hit.label,
    });
  }

  const ticket = await p.transactionTicket.findFirst({
    where: { ticketNo: TICKET_NO },
    include: { usdtPurchase: true },
  });
  let ticketResult = null;
  if (!ticket?.usdtPurchase) {
    ticketResult = { ok: false, error: 'ticket not found' };
  } else {
    const ercMex = user.wallets.find(
      (w) =>
        addrKey(w.address) === addrKey('0xbbb2c3fb0046f6480c39c113b5274475a06e8a35') &&
        matchNetwork(w.network, 'ERC'),
    );
    // after rename, reload
    const ercAfter =
      ercMex ||
      (await p.wallet.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          label: 'MEXC ERC',
        },
      }));
    if (!ercAfter) {
      ticketResult = { ok: false, error: 'MEXC ERC wallet not found' };
    } else {
      const beforeSnap = {
        walletId: ticket.usdtPurchase.walletId,
        address: ticket.usdtPurchase.walletAddressSnapshot,
        network: ticket.usdtPurchase.walletNetworkSnapshot,
      };
      await p.usdtPurchaseDetail.update({
        where: { ticketId: ticket.id },
        data: {
          walletId: ercAfter.id,
          walletAddressSnapshot: ercAfter.address,
          walletNetworkSnapshot: ercAfter.network,
        },
      });
      const actor =
        user.id ||
        (
          await p.user.findFirst({
            where: { role: 'SUPER_ADMIN', isActive: true },
            select: { id: true },
          })
        )?.id;
      if (actor) {
        await p.ticketStatusHistory.create({
          data: {
            ticketId: ticket.id,
            fromStatus: ticket.usdtPurchase.status,
            toStatus: ticket.usdtPurchase.status,
            changedById: actor,
            note: `USDT_WALLET_CHANGE|${beforeSnap.network || '?'} ${beforeSnap.address || '?'}|MEXC ERC ${ercAfter.network} ${ercAfter.address}`,
          },
        });
      }
      ticketResult = {
        ok: true,
        ticketNo: TICKET_NO,
        before: beforeSnap,
        after: {
          walletId: ercAfter.id,
          label: ercAfter.label,
          address: ercAfter.address,
          network: ercAfter.network,
        },
      };
    }
  }

  const afterWallets = await p.wallet.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, label: true, network: true, address: true, isDefault: true },
  });

  console.log(
    JSON.stringify(
      {
        userId: user.id,
        email: user.email,
        walletsBefore: before,
        nicknameUpdates: updates,
        ticket: ticketResult,
        walletsAfter: afterWallets,
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

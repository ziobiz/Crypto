/**
 * Patch LIVE ICOPAY merchant ids (compId/MID/API/channel) without wiping Broker Secret.
 *
 *   node backend/scripts/patch-icopay-merchant.js
 *   ICOPAY_BROKER_SECRET=... node backend/scripts/patch-icopay-merchant.js   # optional rotate secret
 */
const { PrismaClient } = require('@prisma/client');

const KEY = 'hq.platform.icopay';

const LIVE = {
  enabled: true,
  mid: process.env.ICOPAY_MID || '5f681081-2466-4c1c-9505-5ff960715ec3',
  compId: process.env.ICOPAY_COMP_ID || '6000000064',
  apiBaseUrl: process.env.ICOPAY_API_URL || 'https://api.icopay.co.kr',
  sandbox: process.env.ICOPAY_SANDBOX === '1',
  channel: process.env.ICOPAY_CHANNEL === 'RE' ? 'RE' : 'IN',
};

async function main() {
  const prisma = new PrismaClient();
  const row = await prisma.systemConfig.findUnique({ where: { key: KEY } });
  const prev = row?.value && typeof row.value === 'object' ? row.value : {};
  const secretFromEnv = String(process.env.ICOPAY_BROKER_SECRET || '').trim();
  const bracketSecret = secretFromEnv || String(prev.bracketSecret || '').trim();
  if (!bracketSecret) {
    console.error('No Broker Secret in DB or ICOPAY_BROKER_SECRET — abort (refusing to wipe secret).');
    process.exit(1);
  }

  const config = {
    ...prev,
    ...LIVE,
    bracketSecret,
  };

  await prisma.systemConfig.upsert({
    where: { key: KEY },
    create: {
      key: KEY,
      value: config,
      description: 'ICOPAY LIVE — DEALMAI SERVICE (TINPASS) 6000000064',
    },
    update: {
      value: config,
      description: 'ICOPAY LIVE — DEALMAI SERVICE (TINPASS) 6000000064',
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        merchant: 'DEALMAI SERVICE (TINPASS)',
        compId: config.compId,
        mid: config.mid,
        apiBaseUrl: config.apiBaseUrl,
        channel: config.channel,
        sandbox: config.sandbox,
        enabled: config.enabled,
        secretSet: Boolean(bracketSecret),
        webhookUrl: 'https://api.tinpass.com/api/webhooks/icopay',
        prepare: `${config.apiBaseUrl}/api/middleware/v1/merchant/checkout/prepare`,
        status: `${config.apiBaseUrl}/api/middleware/v1/merchant/checkout/status?compId=${config.compId}&orderNo={orderNo}`,
        embed: `${config.apiBaseUrl}/v1/embed-checkout/${config.compId}`,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

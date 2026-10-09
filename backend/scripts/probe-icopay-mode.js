const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const row = await p.systemConfig.findUnique({ where: { key: 'hq.platform.icopay' } });
  const v = row?.value || {};
  const secret = String(v.brokerSecret ?? '').trim();
  // DB field name is brokerSecret historically? keys showed bracketSecret
  const secret2 = String(v.bracketSecret ?? '').trim();
  const s = secret || secret2;
  let mode = 'NO_SECRET';
  if (s) {
    if (s.toUpperCase() === 'SANDBOX') mode = 'LOCAL_MOCK';
    else if (s.startsWith('ic_')) mode = 'ICOPAY_SANDBOX_SECRET';
    else mode = 'LIVE_OR_OTHER_SECRET';
  }
  console.log(
    JSON.stringify(
      {
        enabled: v.enabled,
        mid: v.mid,
        compId: v.compId,
        apiBaseUrl: v.apiBaseUrl,
        channel: v.channel,
        sandboxCheckbox: v.sandbox === true,
        secretLen: s.length,
        secretPrefix4: s ? s.slice(0, 4) : '',
        mode,
        matchesLiveCompId: String(v.compId) === '6000000064',
        matchesLiveMid: String(v.mid) === '5f681081-2466-4c1c-9505-5ff960715ec3',
      },
      null,
      2,
    ),
  );
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

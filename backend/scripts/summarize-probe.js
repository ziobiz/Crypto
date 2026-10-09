const fs = require('fs');
const d = JSON.parse(fs.readFileSync('/tmp/usdc-probe.json', 'utf8'));
const fails = (d.checks || []).filter((c) => !c.pass);
console.log(
  JSON.stringify(
    {
      ok: d.ok,
      twinSync: d.twinSync,
      tradeSample: d.tradeSample
        ? {
            walletId: d.tradeSample.walletId,
            network: d.tradeSample.network,
            assetType: d.tradeSample.assetType,
            rate: d.tradeSample.rate,
            fromFiat: d.tradeSample.fromFiat,
            fromTarget: d.tradeSample.fromTarget,
            preview: d.tradeSample.preview,
          }
        : null,
      passCount: (d.checks || []).filter((c) => c.pass).length,
      checkCount: (d.checks || []).length,
      fails,
    },
    null,
    2,
  ),
);

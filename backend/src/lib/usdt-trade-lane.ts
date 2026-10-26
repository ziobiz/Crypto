/** LIVE = 실거래. SYNTH = 테스트·샌드박스·실결제가 아닌 결제. */
export const USDT_TRADE_LANE_LIVE = 'LIVE';
export const USDT_TRADE_LANE_SYNTH = 'SYNTH';

const SYNTH_RE = /sandbox|local[-_ ]?mock|simulator|no live acquirer/i;

export function isSynthPaymentBlob(parts: Array<unknown>): boolean {
  const text = parts
    .map((part) => {
      if (part == null) return '';
      if (typeof part === 'string') return part;
      try {
        return JSON.stringify(part);
      } catch {
        return '';
      }
    })
    .join('\n');
  return SYNTH_RE.test(text);
}

export function usdtTradeLaneFromSignals(parts: Array<unknown>): 'LIVE' | 'SYNTH' {
  return isSynthPaymentBlob(parts) ? USDT_TRADE_LANE_SYNTH : USDT_TRADE_LANE_LIVE;
}

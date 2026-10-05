type Translate = (
  key:
    | 'usdt.history.applyQuote'
    | 'usdt.history.applyQuoteRemit'
    | 'usdt.history.apply'
    | 'usdt.history.applyRemit'
    | 'usdt.history.depositProof',
  vars?: Record<string, string | number>,
) => string;

const APPLY_NOTES = {
  USDT_APPLY_QUOTE: 'usdt.history.applyQuote',
  USDT_APPLY_QUOTE_REMIT: 'usdt.history.applyQuoteRemit',
  USDT_APPLY: 'usdt.history.apply',
  USDT_APPLY_REMIT: 'usdt.history.applyRemit',
} as const;

/** 상태 이력 코드는 화면 언어로 바꾸고, 예전 한국어 문장은 그대로 둡니다. */
export function formatUsdtHistoryNote(note: string | null | undefined, t: Translate): string {
  if (!note) return '';
  if (note.startsWith('USDT_DEPOSIT_PROOF|')) {
    return t('usdt.history.depositProof', { deadline: note.slice('USDT_DEPOSIT_PROOF|'.length) });
  }
  const [code, tier] = note.split('|');
  const key = APPLY_NOTES[code as keyof typeof APPLY_NOTES];
  if (!key) return note;
  return t(key, { express: tier ? ` · EXPRESS ${tier}` : '' });
}

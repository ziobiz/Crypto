import { processDueUsdtQuoteConfirmations, processExpiredQuoteValidity } from './usdt-purchase.service';

let quoteTimer: ReturnType<typeof setInterval> | null = null;

export function startUsdtQuoteJobScheduler() {
  if (quoteTimer) return;
  const run = async () => {
    try {
      const n = await processDueUsdtQuoteConfirmations();
      if (n > 0) console.log(`[usdt-quote-jobs] auto-confirmed=${n}`);
    } catch (err) {
      console.error('[usdt-quote-jobs]', err);
    }
    try {
      const expired = await processExpiredQuoteValidity();
      if (expired > 0) console.log(`[usdt-quote-jobs] quote-validity-expired=${expired}`);
    } catch (err) {
      console.error('[usdt-quote-jobs] expire', err);
    }
  };
  void run();
  quoteTimer = setInterval(run, 60 * 1000);
}

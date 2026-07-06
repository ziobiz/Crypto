import { getEmailOtpConfig } from './otp.service';
import { sendGenericEmail } from './email.service';
import { buildMultilingualTradeReceipt } from '../constants/trade-receipt-i18n';

type TradeReceiptPayload = {
  to: string;
  userName: string;
  ticketNo: string;
  fiatAmount: number;
  fiatCurrency: string;
  expectedUsdt: number;
  actualUsdt?: number | null;
  usdtTxId?: string | null;
};

export async function sendTradeReceiptEmail(payload: TradeReceiptPayload): Promise<void> {
  const cfg = await getEmailOtpConfig();

  if (!cfg.tradeReceiptEmailEnabled) {
    console.info(`[trade-email] disabled by HQ policy — skip ${payload.ticketNo} → ${payload.to}`);
    return;
  }

  const { subject, text, html } = buildMultilingualTradeReceipt({
    userName: payload.userName,
    ticketNo: payload.ticketNo,
    fiatAmount: payload.fiatAmount,
    fiatCurrency: payload.fiatCurrency,
    expectedUsdt: payload.expectedUsdt,
    actualUsdt: payload.actualUsdt,
    usdtTxId: payload.usdtTxId,
  });

  await sendGenericEmail(cfg, payload.to, subject, text, html);
}

import { createHmac } from 'node:crypto';

export type InvoiceCompletedPayload = {
  site: string;
  event: 'transaction.completed';
  occurredAt: string;
  transactionId: string;
  ticketNo?: string;
  amount: string;
  currency: string;
  asset?: string;
  assetAmount?: string;
  buyerRef?: string;
  productCode?: string;
  memo?: string;
};

type InvoiceWebhookConfig = {
  baseUrl: string;
  apiKey: string;
  hmacSecret: string;
  siteCode: string;
  enabled: boolean;
};

function readConfig(): InvoiceWebhookConfig {
  const baseUrl = (process.env.INVOICE_BASE_URL || '').trim().replace(/\/+$/, '');
  const apiKey = (process.env.INVOICE_API_KEY || '').trim();
  const hmacSecret = (process.env.INVOICE_HMAC_SECRET || '').trim();
  const siteCode = (process.env.INVOICE_SITE_CODE || 'tinpass').trim() || 'tinpass';
  const enabledFlag = (process.env.INVOICE_WEBHOOK_ENABLED || '').trim().toLowerCase();
  const enabled =
    enabledFlag === '1' ||
    enabledFlag === 'true' ||
    enabledFlag === 'yes' ||
    (enabledFlag === '' && Boolean(baseUrl && apiKey && hmacSecret));

  return { baseUrl, apiKey, hmacSecret, siteCode, enabled };
}

export function isInvoiceWebhookConfigured(): boolean {
  const cfg = readConfig();
  return cfg.enabled && Boolean(cfg.baseUrl && cfg.apiKey && cfg.hmacSecret);
}

/**
 * Fire-and-forget safe: never throws to callers. Retries once on 5xx/network.
 */
export async function notifyInvoiceTransactionCompleted(
  payload: Omit<InvoiceCompletedPayload, 'site' | 'event'> &
    Partial<Pick<InvoiceCompletedPayload, 'site' | 'event'>>,
  idempotencyKey: string,
): Promise<void> {
  const cfg = readConfig();
  if (!cfg.enabled) {
    console.info('[invoice-webhook] disabled — skip', idempotencyKey);
    return;
  }
  if (!cfg.baseUrl || !cfg.apiKey || !cfg.hmacSecret) {
    console.warn('[invoice-webhook] missing INVOICE_* env — skip', idempotencyKey);
    return;
  }

  const bodyObj: InvoiceCompletedPayload = {
    site: payload.site || cfg.siteCode,
    event: 'transaction.completed',
    occurredAt: payload.occurredAt,
    transactionId: payload.transactionId,
    ticketNo: payload.ticketNo,
    amount: payload.amount,
    currency: payload.currency,
    asset: payload.asset,
    assetAmount: payload.assetAmount,
    buyerRef: payload.buyerRef,
    productCode: payload.productCode,
    memo: payload.memo,
  };

  const body = JSON.stringify(bodyObj);
  const signature = createHmac('sha256', cfg.hmacSecret).update(body, 'utf8').digest('hex');
  const ts = Math.floor(Date.now() / 1000).toString();
  const url = `${cfg.baseUrl}/v1/webhooks/transactions/completed`;

  const attempt = async (): Promise<Response> =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': cfg.apiKey,
        'X-Signature': signature,
        'X-Idempotency-Key': idempotencyKey,
        'X-Timestamp': ts,
      },
      body,
    });

  try {
    let res = await attempt();
    if (res.status >= 500 || res.status === 429) {
      await new Promise((r) => setTimeout(r, 800));
      res = await attempt();
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[invoice-webhook] failed', res.status, data, idempotencyKey);
      return;
    }
    console.info(
      '[invoice-webhook] ok',
      idempotencyKey,
      (data as { invoice?: { invoiceNo?: string } })?.invoice?.invoiceNo || '',
      (data as { idempotentReplay?: boolean })?.idempotentReplay ? 'replay' : 'created',
    );
  } catch (err) {
    console.error('[invoice-webhook] network error', idempotencyKey, err);
  }
}

export function buildUsdtPurchaseInvoicePayload(input: {
  ticketId: string;
  ticketNo: string;
  fiatAmount: number | string;
  fiatCurrency: string;
  assetAmount?: number | string | null;
  buyerRef?: string | null;
  usdtTxId?: string | null;
  memo?: string | null;
  /** When true, memo is prefixed with [SANDBOX] and idempotency key is sandbox-scoped. */
  sandbox?: boolean;
}): {
  payload: Omit<InvoiceCompletedPayload, 'site' | 'event'> &
    Partial<Pick<InvoiceCompletedPayload, 'site' | 'event'>>;
  idempotencyKey: string;
} {
  const amount = String(input.fiatAmount);
  const assetAmount =
    input.assetAmount != null && input.assetAmount !== ''
      ? String(input.assetAmount)
      : undefined;
  const memoParts = [
    input.sandbox ? '[SANDBOX]' : '',
    input.memo?.trim() || '',
    input.usdtTxId ? `USDT tx: ${input.usdtTxId}` : '',
  ].filter(Boolean);

  return {
    idempotencyKey: input.sandbox
      ? `tinpass:usdt:${input.ticketId}:sandbox:completed`
      : `tinpass:usdt:${input.ticketId}:completed`,
    payload: {
      occurredAt: new Date().toISOString(),
      transactionId: input.ticketId,
      ticketNo: input.ticketNo,
      amount,
      currency: input.fiatCurrency,
      asset: 'USDT',
      assetAmount,
      buyerRef: input.buyerRef || undefined,
      productCode: 'USDT-PURCHASE',
      memo: memoParts.join(' | ') || undefined,
    },
  };
}

/** Detect sandbox-marked USDT tickets (admin note / CURFEX sandbox account). */
export function detectUsdtSandboxTicket(detail: {
  adminNote?: string | null;
  collectionAccountJson?: unknown;
}): boolean {
  if (detail.adminNote?.includes('[SANDBOX]')) return true;
  const raw = detail.collectionAccountJson as Record<string, unknown> | null | undefined;
  const name = String(raw?.accountName ?? '').toUpperCase();
  if (name.includes('SANDBOX')) return true;
  return false;
}

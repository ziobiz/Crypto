import { createHmac } from 'node:crypto';
import { hqPolicyService } from './hq-policy.service';

export type InvoiceEvent = 'transaction.ordered' | 'transaction.completed';

export type InvoiceCompletedPayload = {
  site: string;
  event: InvoiceEvent;
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

export type InvoiceChannel = 'live' | 'simulator';

type InvoiceWebhookConfig = {
  channel: InvoiceChannel;
  baseUrl: string;
  apiKey: string;
  hmacSecret: string;
  siteCode: string;
  enabled: boolean;
};

function flagTrue(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function flagFalse(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === '0' || v === 'false' || v === 'no' || v === 'off';
}

function readConfig(channel: InvoiceChannel): InvoiceWebhookConfig {
  const baseUrl = (process.env.INVOICE_BASE_URL || '').trim().replace(/\/+$/, '');

  if (channel === 'simulator') {
    const apiKey = (process.env.INVOICE_SIM_API_KEY || '').trim();
    const hmacSecret = (process.env.INVOICE_SIM_HMAC_SECRET || '').trim();
    const siteCode =
      (process.env.INVOICE_SIM_SITE_CODE || 'tinpass-sim').trim() || 'tinpass-sim';
    const envFlag = (process.env.INVOICE_SIM_ENABLED || '').trim();
    const enabled =
      !flagFalse(envFlag) &&
      (flagTrue(envFlag) || (envFlag === '' && Boolean(baseUrl && apiKey && hmacSecret)));
    return { channel, baseUrl, apiKey, hmacSecret, siteCode, enabled };
  }

  const apiKey = (process.env.INVOICE_API_KEY || '').trim();
  const hmacSecret = (process.env.INVOICE_HMAC_SECRET || '').trim();
  const siteCode = (process.env.INVOICE_SITE_CODE || 'tinpass').trim() || 'tinpass';
  const enabledFlag = (process.env.INVOICE_WEBHOOK_ENABLED || '').trim().toLowerCase();
  const enabled =
    enabledFlag === '1' ||
    enabledFlag === 'true' ||
    enabledFlag === 'yes' ||
    (enabledFlag === '' && Boolean(baseUrl && apiKey && hmacSecret));

  return { channel, baseUrl, apiKey, hmacSecret, siteCode, enabled };
}

export function isInvoiceWebhookConfigured(channel: InvoiceChannel = 'live'): boolean {
  const cfg = readConfig(channel);
  return cfg.enabled && Boolean(cfg.baseUrl && cfg.apiKey && cfg.hmacSecret);
}

/** HQ platform toggle (default on) + env INVOICE_SIM_* credentials. */
export async function isSimulatorInvoiceIssueEnabled(): Promise<boolean> {
  if (!isInvoiceWebhookConfigured('simulator')) return false;
  try {
    const platform = await hqPolicyService.getPlatformPayload();
    return platform.config.simulatorInvoiceEnabled !== false;
  } catch {
    return true;
  }
}

export function getInvoiceApiClient(channel: InvoiceChannel = 'live'): {
  baseUrl: string;
  apiKey: string;
  siteCode: string;
} {
  const cfg = readConfig(channel);
  if (!cfg.baseUrl || !cfg.apiKey) {
    throw new Error('INVOICE_NOT_CONFIGURED');
  }
  return { baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, siteCode: cfg.siteCode };
}

/**
 * Fire-and-forget safe by default: returns result, never throws.
 * Retries once on 5xx/network.
 * Live USDT purchase issues at order time (`transaction.ordered`);
 * simulator may still use completed-style payloads.
 */
export async function notifyInvoiceTransactionCompleted(
  payload: Omit<InvoiceCompletedPayload, 'site' | 'event'> &
    Partial<Pick<InvoiceCompletedPayload, 'site' | 'event'>>,
  idempotencyKey: string,
  channel: InvoiceChannel = 'live',
): Promise<{ ok: boolean; invoiceNo?: string; status?: number; error?: string }> {
  const cfg = readConfig(channel);
  if (!cfg.enabled) {
    console.info('[invoice-webhook] disabled — skip', channel, idempotencyKey);
    return { ok: false, error: 'disabled' };
  }
  if (!cfg.baseUrl || !cfg.apiKey || !cfg.hmacSecret) {
    console.warn('[invoice-webhook] missing INVOICE_* env — skip', channel, idempotencyKey);
    return { ok: false, error: 'missing_env' };
  }

  const event: InvoiceEvent =
    payload.event === 'transaction.completed' ? 'transaction.completed' : 'transaction.ordered';
  const bodyObj: InvoiceCompletedPayload = {
    site: payload.site || cfg.siteCode,
    event,
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
  const path =
    event === 'transaction.ordered'
      ? '/v1/webhooks/transactions/ordered'
      : '/v1/webhooks/transactions/completed';
  const url = `${cfg.baseUrl}${path}`;

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
    const data = (await res.json().catch(() => ({}))) as {
      invoice?: { invoiceNo?: string };
      error?: string;
      idempotentReplay?: boolean;
    };
    if (!res.ok) {
      console.error('[invoice-webhook] failed', channel, res.status, data, idempotencyKey);
      return { ok: false, status: res.status, error: data.error || `http_${res.status}` };
    }
    const invoiceNo = data.invoice?.invoiceNo;
    console.info(
      '[invoice-webhook] ok',
      channel,
      idempotencyKey,
      invoiceNo || '',
      data.idempotentReplay ? 'replay' : 'created',
    );
    return { ok: true, status: res.status, invoiceNo };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[invoice-webhook] network', channel, msg, idempotencyKey);
    return { ok: false, error: msg };
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
    // Order-time issue (not completion). Keep stable key so retries / later COMPLETED do not double-issue.
    idempotencyKey: input.sandbox
      ? `tinpass:usdt:${input.ticketId}:sandbox:ordered`
      : `tinpass:usdt:${input.ticketId}:ordered`,
    payload: {
      event: 'transaction.ordered',
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

/** USDT simulator run → Invoice on tinpass-sim site with [SIMULATOR] memo. */
export function buildSimulatorInvoicePayload(input: {
  userId: string;
  runKey: string;
  fiatAmount: number | string;
  fiatCurrency: string;
  assetAmount: number | string;
  network?: string | null;
  feeMode?: string | null;
  buyerRef?: string | null;
}): {
  payload: Omit<InvoiceCompletedPayload, 'site' | 'event'> &
    Partial<Pick<InvoiceCompletedPayload, 'site' | 'event'>>;
  idempotencyKey: string;
} {
  const feeMode = (input.feeMode || '').trim().toUpperCase();
  const memoParts = [
    '[SIMULATOR]',
    input.network ? `network: ${input.network}` : '',
    feeMode ? `feeMode: ${feeMode}` : '',
  ].filter(Boolean);

  return {
    idempotencyKey: `tinpass:sim:${input.userId}:${input.runKey}`,
    payload: {
      occurredAt: new Date().toISOString(),
      transactionId: `sim-${input.userId}-${input.runKey}`,
      ticketNo: `SIM-${input.runKey.slice(0, 12).toUpperCase()}`,
      amount: String(input.fiatAmount),
      currency: input.fiatCurrency,
      asset: 'USDT',
      assetAmount: String(input.assetAmount),
      buyerRef: input.buyerRef || undefined,
      productCode: 'USDT-PURCHASE',
      memo: memoParts.join(' | '),
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

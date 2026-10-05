import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';
import { AppError } from '../lib/errors';
import { isMerchantSide } from '../lib/merchant-role';
import type { AuthUser } from '../types/auth';
import { getInvoiceApiClient, type InvoiceChannel } from '../services/invoice-webhook.service';
import {
  rewriteInvoiceContentDisposition,
  toPublicInvoiceNo,
} from '../lib/invoice-brand';

const router = Router();
router.use(authenticate);

type InvoiceListKind = 'live' | 'official' | 'simulator' | 'sandbox' | 'all';

function invoiceEnv(channel: InvoiceChannel) {
  try {
    return getInvoiceApiClient(channel);
  } catch {
    throw new AppError(503, 'Invoice service is not configured', 'INVOICE_NOT_CONFIGURED');
  }
}

function parseKind(raw: unknown): InvoiceListKind {
  const kindRaw = String(raw || 'live').toLowerCase();
  if (kindRaw === 'simulator' || kindRaw === 'sim') return 'simulator';
  if (kindRaw === 'sandbox') return 'sandbox';
  if (kindRaw === 'official' || kindRaw === 'original') return 'official';
  if (kindRaw === 'all') return 'all';
  return 'live';
}

function channelForKind(kind: InvoiceListKind): InvoiceChannel {
  return kind === 'simulator' ? 'simulator' : 'live';
}

/** Upstream Invoice filter: simulator site uses its own key; pass kind through for live/official. */
function upstreamKind(kind: InvoiceListKind): string {
  if (kind === 'simulator') return 'simulator';
  return kind;
}

function assertHqInvoiceAccess(user: AuthUser | undefined) {
  if (!user || isMerchantSide(user)) {
    throw new AppError(403, 'Invoice menu is available to HQ operators only', 'FORBIDDEN');
  }
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    assertHqInvoiceAccess(req.user);
    const kind = parseKind(req.query.kind);
    const channel = channelForKind(kind);
    const { baseUrl, apiKey } = invoiceEnv(channel);
    const from = String(req.query.from || '');
    const to = String(req.query.to || '');
    const url = new URL(`${baseUrl}/v1/invoices`);
    url.searchParams.set('limit', '100');
    url.searchParams.set('kind', upstreamKind(kind));
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    const upstream = await fetch(url, { headers: { 'X-Api-Key': apiKey, Accept: 'application/json' } });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      throw new AppError(upstream.status, (data as { error?: string }).error || 'Invoice list failed', 'INVOICE_LIST_FAILED');
    }
    const payload = data as { items?: Array<{ invoice_no?: string }> };
    if (Array.isArray(payload.items)) {
      payload.items = payload.items.map((it) => ({
        ...it,
        invoice_no: toPublicInvoiceNo(it.invoice_no),
      }));
    }
    res.json(payload);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    assertHqInvoiceAccess(req.user);
    const kind = parseKind(req.query.kind);
    const channel = channelForKind(kind);
    const { baseUrl, apiKey } = invoiceEnv(channel);
    const upstream = await fetch(
      `${baseUrl}/v1/invoices/${encodeURIComponent(req.params.id)}`,
      {
        method: 'DELETE',
        headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
      },
    );
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      // Fallback: try the other channel once (legacy rows may still live on tinpass)
      const other: InvoiceChannel = channel === 'simulator' ? 'live' : 'simulator';
      try {
        const alt = invoiceEnv(other);
        const retry = await fetch(
          `${alt.baseUrl}/v1/invoices/${encodeURIComponent(req.params.id)}`,
          {
            method: 'DELETE',
            headers: { 'X-Api-Key': alt.apiKey, Accept: 'application/json' },
          },
        );
        const retryData = await retry.json().catch(() => ({}));
        if (retry.ok) {
          res.json(retryData);
          return;
        }
      } catch {
        /* ignore */
      }
      throw new AppError(
        upstream.status,
        (data as { error?: string }).error || 'Invoice delete failed',
        'INVOICE_DELETE_FAILED',
      );
    }
    res.json(data);
  }),
);

router.get(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    assertHqInvoiceAccess(req.user);
    const kind = parseKind(req.query.kind);
    const channel = channelForKind(kind);
    const { baseUrl, apiKey } = invoiceEnv(channel);
    const upstream = await fetch(`${baseUrl}/v1/invoices/${encodeURIComponent(req.params.id)}/pdf`, {
      headers: { 'X-Api-Key': apiKey },
    });
    if (!upstream.ok) {
      // Fallback: try the other channel once (legacy rows may still live on tinpass)
      const other: InvoiceChannel = channel === 'simulator' ? 'live' : 'simulator';
      try {
        const alt = invoiceEnv(other);
        const retry = await fetch(
          `${alt.baseUrl}/v1/invoices/${encodeURIComponent(req.params.id)}/pdf`,
          { headers: { 'X-Api-Key': alt.apiKey } },
        );
        if (retry.ok) {
          res.setHeader('Content-Type', 'application/pdf');
          const disp = rewriteInvoiceContentDisposition(retry.headers.get('content-disposition'));
          if (disp) res.setHeader('Content-Disposition', disp);
          res.send(Buffer.from(await retry.arrayBuffer()));
          return;
        }
      } catch {
        /* ignore */
      }
      const data = await upstream.json().catch(() => ({}));
      throw new AppError(upstream.status, (data as { error?: string }).error || 'PDF download failed', 'INVOICE_PDF_FAILED');
    }
    res.setHeader('Content-Type', 'application/pdf');
    const disp = rewriteInvoiceContentDisposition(upstream.headers.get('content-disposition'));
    if (disp) res.setHeader('Content-Disposition', disp);
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  }),
);

export default router;

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';
import { AppError } from '../lib/errors';
import { isMerchantSide } from '../lib/merchant-role';
import type { AuthUser } from '../types/auth';
import { getInvoiceApiClient, type InvoiceChannel } from '../services/invoice-webhook.service';

const router = Router();
router.use(authenticate);

function invoiceEnv(channel: InvoiceChannel) {
  try {
    return getInvoiceApiClient(channel);
  } catch {
    throw new AppError(503, 'Invoice service is not configured', 'INVOICE_NOT_CONFIGURED');
  }
}

function buyerScope(user: AuthUser): string | null {
  if (!isMerchantSide(user)) return null;
  return [user.email, user.customerProfileId].filter(Boolean).join(',');
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const kindRaw = String(req.query.kind || 'live').toLowerCase();
    const channel: InvoiceChannel =
      kindRaw === 'simulator' || kindRaw === 'sim' ? 'simulator' : 'live';
    const { baseUrl, apiKey } = invoiceEnv(channel);
    const from = String(req.query.from || '');
    const to = String(req.query.to || '');
    const url = new URL(`${baseUrl}/v1/invoices`);
    url.searchParams.set('limit', '100');
    // Each channel uses its own Invoice site key — list all on that site
    url.searchParams.set('kind', 'all');
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    const buyer = buyerScope(req.user!);
    if (buyer) url.searchParams.set('buyer', buyer);
    const upstream = await fetch(url, { headers: { 'X-Api-Key': apiKey, Accept: 'application/json' } });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      throw new AppError(upstream.status, (data as { error?: string }).error || 'Invoice list failed', 'INVOICE_LIST_FAILED');
    }
    res.json(data);
  }),
);

router.get(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    const kindRaw = String(req.query.kind || 'live').toLowerCase();
    const channel: InvoiceChannel =
      kindRaw === 'simulator' || kindRaw === 'sim' ? 'simulator' : 'live';
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
          const disp = retry.headers.get('content-disposition');
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
    const disp = upstream.headers.get('content-disposition');
    if (disp) res.setHeader('Content-Disposition', disp);
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  }),
);

export default router;

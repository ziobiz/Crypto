import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { handleCurfexWebhook } from '../services/curfex-webhook.service';
import { getIcopayConfig } from '../services/card-payment-policy.service';
import { verifyIcopayWebhookSignature } from '../services/icopay.service';
import { handleIcopayWebhook } from '../services/usdt-card-purchase.service';

const router = Router();

/**
 * CURFEX/Fukugu Collection webhook (no JWT).
 *   https://api.tinpass.com/api/webhooks/curfex
 */
router.post(
  '/curfex',
  asyncHandler(async (req, res) => {
    const signature =
      (req.headers['x-hmac-signature'] as string | undefined) ||
      (req.headers['x-hmac-signature'.toUpperCase()] as string | undefined) ||
      (req.headers['x-signature'] as string | undefined);

    const rawBody = (req as { rawBody?: Buffer }).rawBody;
    const result = await handleCurfexWebhook({
      body: req.body,
      rawBody,
      signature,
    });
    res.json(result);
  }),
);

/**
 * ICOPAY merchantNotifyUrls webhook (no JWT).
 * Register in ICOPAY HQ merchantNotifyUrls:
 *   https://api.tinpass.com/api/webhooks/icopay
 */
router.post(
  '/icopay',
  asyncHandler(async (req, res) => {
    const icopay = await getIcopayConfig();
    const rawBody = (req as { rawBody?: Buffer }).rawBody;
    const bodyStr =
      rawBody?.toString('utf8') ||
      (typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {}));
    const signature =
      (req.headers['x-icopay-signature'] as string | undefined) ||
      (req.headers['x-bracket-signature'] as string | undefined) ||
      (req.headers['x-signature'] as string | undefined) ||
      (req.headers['x-hmac-signature'] as string | undefined);

    if (
      icopay.bracketSecret &&
      signature &&
      !verifyIcopayWebhookSignature(bodyStr, signature, icopay.bracketSecret)
    ) {
      res.status(401).json({ success: false, error: 'invalid signature' });
      return;
    }

    const result = await handleIcopayWebhook(req.body);
    res.json(result);
  }),
);

export default router;

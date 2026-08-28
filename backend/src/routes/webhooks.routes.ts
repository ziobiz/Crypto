import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { handleCurfexWebhook } from '../services/curfex-webhook.service';

const router = Router();

/**
 * CURFEX/Fukugu Collection webhook (no JWT).
 * Register this URL in the CURFEX merchant portal:
 *   https://api.tinpass.com/api/webhooks/curfex
 * HMAC: header X-HMAC-SIGNATURE (SHA-512 hex) when webhookSecret is set.
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

export default router;

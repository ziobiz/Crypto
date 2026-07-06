import express, { type Response } from 'express';
import path from 'path';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import usdtPurchaseRoutes from './routes/usdt-purchase.routes';
import tradeEscrowRoutes from './routes/trade-escrow.routes';
import ledgerRoutes from './routes/ledger.routes';
import organizationRoutes from './routes/organization.routes';
import attachmentRoutes from './routes/attachment.routes';
import userRoutes from './routes/user.routes';
import hqPolicyRoutes from './routes/hq-policy.routes';
import { hqPolicyService } from './services/hq-policy.service';
import { errorHandler } from './middleware/errorHandler';
import { asyncHandler } from './middleware/asyncHandler';

const BRAND_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

function sendBrandingFile(res: Response, filePath: string | null): void {
  if (!filePath) {
    res.status(404).end();
    return;
  }
  const abs = path.resolve(filePath);
  const ext = path.extname(abs).toLowerCase();
  if (BRAND_MIME[ext]) res.type(BRAND_MIME[ext]);
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.sendFile(abs);
}

/** API + /health Express 앱 (listen 없음 — 통합 서버에서 마운트) */
export function createApiApp(): express.Application {
  const app = express();
  app.set('trust proxy', 1);

  const corsOrigin = process.env.CORS_ORIGIN;
  app.use(
    cors(
      corsOrigin
        ? { origin: corsOrigin.split(',').map((o) => o.trim()), credentials: true }
        : undefined,
    ),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get(
    '/api/branding',
    asyncHandler(async (_req, res) => {
      res.json(await hqPolicyService.getPublicBranding());
    }),
  );

  app.get('/api/branding/logo', (_req, res) => {
    sendBrandingFile(res, hqPolicyService.getLogoFilePath());
  });

  app.get('/api/branding/auth-logo', (_req, res) => {
    sendBrandingFile(res, hqPolicyService.getAuthLogoFilePath());
  });

  app.get('/api/branding/favicon', (_req, res) => {
    sendBrandingFile(res, hqPolicyService.getFaviconFilePath());
  });

  app.get('/api/branding/background', (_req, res) => {
    sendBrandingFile(res, hqPolicyService.getBackgroundFilePath());
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/wallets', walletRoutes);
  app.use('/api/tickets/usdt-purchase', usdtPurchaseRoutes);
  app.use('/api/tickets/trade-escrow', tradeEscrowRoutes);
  app.use('/api/ledger', ledgerRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/attachments', attachmentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/hq-policy', hqPolicyRoutes);

  app.use(errorHandler);

  return app;
}

import express from 'express';
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

/** API + /health Express 앱 (listen 없음 — 통합 서버에서 마운트) */
export function createApiApp(): express.Application {
  const app = express();

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
    const logoPath = hqPolicyService.getLogoFilePath();
    if (!logoPath) {
      res.status(404).end();
      return;
    }
    res.sendFile(logoPath);
  });

  app.get('/api/branding/auth-logo', (_req, res) => {
    const p = hqPolicyService.getAuthLogoFilePath();
    if (!p) {
      res.status(404).end();
      return;
    }
    res.sendFile(p);
  });

  app.get('/api/branding/favicon', (_req, res) => {
    const faviconPath = hqPolicyService.getFaviconFilePath();
    if (!faviconPath) {
      res.status(404).end();
      return;
    }
    res.sendFile(faviconPath);
  });

  app.get('/api/branding/background', (_req, res) => {
    const bgPath = hqPolicyService.getBackgroundFilePath();
    if (!bgPath) {
      res.status(404).end();
      return;
    }
    res.sendFile(bgPath);
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

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import usdtPurchaseRoutes from './routes/usdt-purchase.routes';
import tradeEscrowRoutes from './routes/trade-escrow.routes';
import ledgerRoutes from './routes/ledger.routes';
import organizationRoutes from './routes/organization.routes';
import attachmentRoutes from './routes/attachment.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 4000;

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

app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/tickets/usdt-purchase', usdtPurchaseRoutes);
app.use('/api/tickets/trade-escrow', tradeEscrowRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/attachments', attachmentRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

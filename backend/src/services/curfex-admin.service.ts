import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import type { CurfexCollectionAccount } from '../constants/hq-policy';
import {
  getCurfexConfig,
  getCurfexPaymentStatus,
  getCurfexPaymentDetail,
  isCurfexLocalMock,
  isCurfexNonLiveEnvironment,
  publicCurfexWebhookUrl,
} from './curfex.service';
import { syncCurfexDepositForTicket } from './curfex-webhook.service';

async function curfexWalletGet(walletName: string) {
  const config = await getCurfexConfig();
  if (isCurfexLocalMock(config)) {
    return {
      walletName,
      statusCode: 'LOCAL_MOCK',
      currency: 'JPY',
      paymentsCollected: null as number | null,
      paymentsPending: null as number | null,
      fundsAvailableForSettlement: null as number | null,
      settlementInterval: null as string | null,
      localMock: true,
    };
  }
  if (!walletName) {
    throw new AppError(400, 'CURFEX walletName is not configured', 'CURFEX_NO_WALLET');
  }
  if (!config.clientId || !config.clientSecret) {
    throw new AppError(503, 'CURFEX credentials are not configured', 'CURFEX_NOT_CONFIGURED');
  }

  const base = (config.apiBaseUrl || '').replace(/\/$/, '');
  const authRes = await fetch(`${base}/api/auth/request-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      payload: { clientId: config.clientId, clientSecret: config.clientSecret },
    }),
  });
  const authJson = (await authRes.json().catch(() => ({}))) as {
    payload?: { accessToken?: string };
    errors?: Array<{ message?: string }>;
  };
  const token = authJson.payload?.accessToken;
  if (!token) {
    throw new AppError(
      502,
      authJson.errors?.[0]?.message || 'CURFEX token failed',
      'CURFEX_AUTH',
    );
  }

  const res = await fetch(`${base}/api/wallet/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ payload: { walletName } }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    errors?: Array<{ message?: string; code?: string }>;
    payload?: Record<string, unknown>;
  };
  if (!res.ok || !json.payload) {
    throw new AppError(
      502,
      json.errors?.[0]?.message || `CURFEX wallet HTTP ${res.status}`,
      'CURFEX_WALLET_ERROR',
    );
  }
  const p = json.payload;
  return {
    walletName: String(p.walletName ?? walletName),
    statusCode: String(p.statusCode ?? ''),
    currency: String(p.currency ?? ''),
    paymentsCollected: p.paymentsCollected != null ? Number(p.paymentsCollected) : null,
    paymentsPending: p.paymentsPending != null ? Number(p.paymentsPending) : null,
    fundsAvailableForSettlement:
      p.fundsAvailableForSettlement != null ? Number(p.fundsAvailableForSettlement) : null,
    settlementInterval: p.settlementInterval != null ? String(p.settlementInterval) : null,
    localMock: false,
  };
}

function accountOf(raw: unknown): CurfexCollectionAccount | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const accountNo = String(o.accountNo ?? '').trim();
  const bankName = String(o.bankName ?? '').trim();
  if (!accountNo || !bankName) return null;
  return {
    bankName,
    branchCode: o.branchCode != null ? String(o.branchCode) : undefined,
    branchName: o.branchName != null ? String(o.branchName) : undefined,
    accountType: o.accountType != null ? String(o.accountType) : undefined,
    accountNo,
    accountName: String(o.accountName ?? bankName),
  };
}

export type CurfexIssuanceRow = {
  ticketId: string;
  ticketNo: string;
  ticketStatus: string;
  purchaseStatus: string;
  tradeLane: string;
  fiatCurrency: string;
  fiatAmount: number | null;
  confirmedFiatAmount: number | null;
  curfexRefNo: string | null;
  curfexStatusCode: string | null;
  curfexDepositDetectedAt: string | null;
  collectionAccount: CurfexCollectionAccount | null;
  customerName: string | null;
  customerEmail: string | null;
  customerType: string | null;
  createdAt: string;
  depositDeadlineAt: string | null;
};

export async function getCurfexAdminOverview() {
  const config = await getCurfexConfig();
  let wallet = null as Awaited<ReturnType<typeof curfexWalletGet>> | null;
  let walletError: string | null = null;
  try {
    if (config.walletName) {
      wallet = await curfexWalletGet(config.walletName);
    }
  } catch (e) {
    walletError = e instanceof Error ? e.message : String(e);
  }

  return {
    config: {
      enabled: config.enabled,
      apiBaseUrl: config.apiBaseUrl,
      walletName: config.walletName,
      currencies: config.currencies,
      localMock: isCurfexLocalMock(config),
      nonLive: isCurfexNonLiveEnvironment(config),
      hasCredentials: Boolean(config.clientId && config.clientSecret),
      hasWebhookSecret: Boolean(config.webhookSecret),
      autoApproveOnDeposit: config.autoApproveOnDeposit !== false,
      defaultCollectionModeCorporate: config.defaultCollectionModeCorporate,
      defaultCollectionModeIndividual: config.defaultCollectionModeIndividual,
    },
    webhookUrl: publicCurfexWebhookUrl(),
    wallet,
    walletError,
  };
}

export async function listCurfexIssuances(opts?: {
  q?: string;
  status?: string;
  take?: number;
}): Promise<{ items: CurfexIssuanceRow[]; total: number }> {
  const take = Math.min(Math.max(Number(opts?.take) || 100, 1), 500);
  const q = String(opts?.q ?? '').trim();
  const status = String(opts?.status ?? '').trim().toUpperCase();

  const where = {
    collectionProvider: 'CURFEX',
    ...(status ? { curfexStatusCode: status } : {}),
    ...(q
      ? {
          OR: [
            { curfexRefNo: { contains: q, mode: 'insensitive' as const } },
            { ticket: { ticketNo: { contains: q, mode: 'insensitive' as const } } },
            {
              ticket: {
                customer: {
                  user: {
                    OR: [
                      { email: { contains: q, mode: 'insensitive' as const } },
                      { name: { contains: q, mode: 'insensitive' as const } },
                    ],
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.usdtPurchaseDetail.count({ where }),
    prisma.usdtPurchaseDetail.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        ticket: {
          select: {
            id: true,
            ticketNo: true,
            createdAt: true,
            customer: {
              select: {
                customerType: true,
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const items: CurfexIssuanceRow[] = rows.map((row) => ({
    ticketId: row.ticketId,
    ticketNo: row.ticket.ticketNo,
    ticketStatus: String(row.status),
    purchaseStatus: String(row.status),
    tradeLane: row.tradeLane || 'LIVE',
    fiatCurrency: row.fiatCurrency,
    fiatAmount: row.fiatAmount != null ? Number(row.fiatAmount) : null,
    confirmedFiatAmount:
      row.confirmedFiatAmount != null ? Number(row.confirmedFiatAmount) : null,
    curfexRefNo: row.curfexRefNo,
    curfexStatusCode: row.curfexStatusCode,
    curfexDepositDetectedAt: row.curfexDepositDetectedAt
      ? row.curfexDepositDetectedAt.toISOString()
      : null,
    collectionAccount: accountOf(row.collectionAccountJson),
    customerName: row.ticket.customer?.user?.name ?? null,
    customerEmail: row.ticket.customer?.user?.email ?? null,
    customerType: row.ticket.customer?.customerType ?? null,
    createdAt: row.ticket.createdAt.toISOString(),
    depositDeadlineAt: row.depositDeadlineAt ? row.depositDeadlineAt.toISOString() : null,
  }));

  return { items, total };
}

/** CURFEX 상태 재조회 (+입금이면 기존 sync 로직) */
export async function refreshCurfexIssuance(ticketId: string) {
  const detail = await prisma.usdtPurchaseDetail.findUnique({
    where: { ticketId },
    select: { collectionProvider: true, curfexRefNo: true },
  });
  if (!detail || detail.collectionProvider !== 'CURFEX') {
    throw new AppError(400, 'Not a CURFEX collection ticket', 'NOT_CURFEX');
  }
  if (!detail.curfexRefNo) {
    throw new AppError(400, 'CURFEX refNo not issued yet', 'CURFEX_NO_REF');
  }

  const config = await getCurfexConfig();
  if (isCurfexLocalMock(config)) {
    return {
      synced: true,
      applied: false,
      statusCode: 'LOCAL_MOCK',
      localMock: true,
    };
  }

  try {
    const synced = await syncCurfexDepositForTicket(ticketId);
    return { ...synced, localMock: false };
  } catch {
    let status;
    try {
      status = await getCurfexPaymentStatus(detail.curfexRefNo);
    } catch {
      status = await getCurfexPaymentDetail(detail.curfexRefNo);
    }
    await prisma.usdtPurchaseDetail.update({
      where: { ticketId },
      data: {
        curfexStatusCode: status.statusCode,
        curfexLastEventJson: status as object,
      },
    });
    return {
      synced: true,
      applied: false,
      statusCode: status.statusCode,
      localMock: false,
    };
  }
}

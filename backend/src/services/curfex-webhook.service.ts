import { UsdtPurchaseStatus, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import {
  approveCurfexPayment,
  getCurfexConfig,
  getCurfexPaymentDetail,
  getCurfexPaymentStatus,
  isCurfexDepositStatus,
  verifyCurfexWebhookHmac,
  type CurfexPaymentStatus,
} from './curfex.service';
import type { AuthUser } from '../types/auth';

async function systemAuthUser(): Promise<AuthUser> {
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN, isActive: true },
    select: { id: true, email: true, name: true, role: true, organizationId: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!admin) {
    throw new AppError(500, 'No system admin for CURFEX sync', 'NO_SYSTEM_USER');
  }
  const org = admin.organizationId
    ? await prisma.organization.findUnique({
        where: { id: admin.organizationId },
        select: { path: true, type: true },
      })
    : null;
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    organizationId: admin.organizationId,
    organizationPath: org?.path ?? null,
    organizationType: org?.type ?? null,
    customerProfileId: null,
    merchantAdminUserId: null,
    operatorsEnabled: false,
  };
}

async function reloadTicket(ticketId: string) {
  const { getUsdtPurchaseTicket } = await import('./usdt-purchase.service');
  return getUsdtPurchaseTicket(await systemAuthUser(), ticketId);
}

export type CurfexWebhookNormalized = {
  refNo?: string;
  merchantReference?: string;
  statusCode?: string;
  detail?: string;
  amount?: number;
  amountCollected?: number;
  paymentBalance?: number;
  excessAmount?: number;
  senderAccountName?: string;
  event?: string;
  raw: Record<string, unknown>;
};

function asNum(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function normalizeCurfexWebhookBody(body: unknown): CurfexWebhookNormalized {
  const root = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const payload =
    (root.payload && typeof root.payload === 'object'
      ? (root.payload as Record<string, unknown>)
      : root.data && typeof root.data === 'object'
        ? (root.data as Record<string, unknown>)
        : root) ?? {};

  return {
    refNo: String(payload.refNo ?? payload.referenceNo ?? root.refNo ?? '').trim() || undefined,
    merchantReference:
      String(payload.merchantReference ?? payload.merchantRef ?? root.merchantReference ?? '').trim() ||
      undefined,
    statusCode: String(payload.statusCode ?? payload.status ?? root.statusCode ?? '').trim() || undefined,
    detail: payload.detail != null ? String(payload.detail) : undefined,
    amount: asNum(payload.amount ?? root.amount),
    amountCollected: asNum(
      payload.amountCollected ?? payload.collectedAmount ?? payload.paymentAmount ?? root.amountCollected,
    ),
    paymentBalance: asNum(payload.paymentBalance ?? root.paymentBalance),
    excessAmount: asNum(payload.excessAmount ?? root.excessAmount),
    senderAccountName:
      String(
        payload.senderAccountName ?? payload.senderName ?? payload.accountName ?? root.senderAccountName ?? '',
      ).trim() || undefined,
    event: String(root.event ?? root.eventType ?? payload.event ?? payload.type ?? '').trim() || undefined,
    raw: root,
  };
}

function depositLooksReceived(n: CurfexWebhookNormalized | CurfexPaymentStatus): boolean {
  if (isCurfexDepositStatus(n.statusCode)) return true;
  const collected = asNum(
    'amountCollected' in n ? n.amountCollected : undefined,
  );
  if (collected != null && collected > 0) return true;
  const balance = asNum('paymentBalance' in n ? n.paymentBalance : undefined);
  // Some APIs put remaining balance; if status is paid-like already covered above.
  if (balance != null && balance === 0 && isCurfexDepositStatus(n.statusCode)) return true;
  return false;
}

async function resolveSystemUserId(): Promise<string> {
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN, isActive: true },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!admin) throw new AppError(500, 'No SUPER_ADMIN for CURFEX automation', 'NO_SYSTEM_USER');
  return admin.id;
}

async function findCurfexTicket(refNo?: string, merchantReference?: string) {
  if (refNo) {
    const byRef = await prisma.usdtPurchaseDetail.findFirst({
      where: { collectionProvider: 'CURFEX', curfexRefNo: refNo },
      include: { ticket: { select: { id: true, ticketNo: true } } },
    });
    if (byRef) return byRef;
  }
  if (merchantReference) {
    const ticket = await prisma.transactionTicket.findFirst({
      where: { ticketNo: merchantReference },
      include: { usdtPurchase: true },
    });
    if (ticket?.usdtPurchase?.collectionProvider === 'CURFEX') {
      return {
        ...ticket.usdtPurchase,
        ticket: { id: ticket.id, ticketNo: ticket.ticketNo },
      };
    }
  }
  return null;
}

/**
 * CURFEX 입금 감지 → 증빙 없이 ADMIN_REVIEWING 전환.
 * 고정계좌(FIXED) 티켓에는 적용하지 않음.
 */
export async function applyCurfexDepositDetected(input: {
  refNo?: string;
  merchantReference?: string;
  statusCode?: string;
  detail?: string;
  amountCollected?: number;
  amount?: number;
  senderAccountName?: string;
  excessAmount?: number;
  source: 'webhook' | 'poll' | 'sandbox';
  eventPayload?: Record<string, unknown>;
  skipApprove?: boolean;
}): Promise<{ applied: boolean; ticketId?: string; reason?: string }> {
  const detail = await findCurfexTicket(input.refNo, input.merchantReference);
  if (!detail) {
    return { applied: false, reason: 'TICKET_NOT_FOUND' };
  }

  if (detail.status !== UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING) {
    // Already past deposit stage — update status snapshot only
    await prisma.usdtPurchaseDetail.update({
      where: { ticketId: detail.ticketId },
      data: {
        ...(input.statusCode && { curfexStatusCode: input.statusCode }),
        ...(input.eventPayload && { curfexLastEventJson: input.eventPayload as object }),
      },
    });
    return { applied: false, ticketId: detail.ticketId, reason: 'ALREADY_PROCESSED' };
  }

  const expected = Number(detail.fiatAmount);
  const collected =
    input.amountCollected ??
    input.amount ??
    expected;
  const amountOk = Math.abs(collected - expected) <= Math.max(1, expected * 0.001);
  const underOrOver = !amountOk;

  const systemUserId = await resolveSystemUserId();
  const noteParts = [
    `CURFEX 입금 자동감지 (${input.source})`,
    input.statusCode ? `status=${input.statusCode}` : null,
    input.detail || null,
    underOrOver ? `금액불일치 collected=${collected} expected=${expected}` : null,
  ].filter(Boolean);

  await prisma.$transaction(async (tx) => {
    await tx.usdtPurchaseDetail.update({
      where: { ticketId: detail.ticketId },
      data: {
        status: UsdtPurchaseStatus.ADMIN_REVIEWING,
        depositAmount: collected,
        depositorName: input.senderAccountName || detail.depositorName || 'CURFEX',
        depositTransferredAt: new Date(),
        curfexStatusCode: input.statusCode || detail.curfexStatusCode || 'PAID',
        curfexDepositDetectedAt: new Date(),
        curfexLastEventJson: (input.eventPayload || {
          source: input.source,
          statusCode: input.statusCode,
          amountCollected: collected,
        }) as object,
        bankMismatch: false,
        ...(underOrOver && {
          adminNote: `CURFEX amount mismatch: collected=${collected}, expected=${expected}`,
        }),
      },
    });
    await tx.ticketStatusHistory.create({
      data: {
        ticketId: detail.ticketId,
        fromStatus: UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
        toStatus: UsdtPurchaseStatus.ADMIN_REVIEWING,
        changedById: systemUserId,
        note: noteParts.join(' · '),
      },
    });
  });

  const config = await getCurfexConfig();
  if (
    !input.skipApprove &&
    config.autoApproveOnDeposit !== false &&
    amountOk &&
    detail.curfexRefNo
  ) {
    try {
      const approved = await approveCurfexPayment({
        refNo: detail.curfexRefNo,
        merchantReference: detail.ticket.ticketNo,
        description: `TINPASS auto-approve ${detail.ticket.ticketNo}`,
      });
      await prisma.usdtPurchaseDetail.update({
        where: { ticketId: detail.ticketId },
        data: {
          curfexStatusCode: approved.statusCode || 'APPROVED',
        },
      });
    } catch (err) {
      console.warn('[CURFEX] auto-approve failed', err);
      await prisma.ticketStatusHistory.create({
        data: {
          ticketId: detail.ticketId,
          fromStatus: UsdtPurchaseStatus.ADMIN_REVIEWING,
          toStatus: UsdtPurchaseStatus.ADMIN_REVIEWING,
          changedById: systemUserId,
          note: `CURFEX decision APPROVE 실패 — 운영 확인 필요: ${
            err instanceof Error ? err.message : String(err)
          }`,
        },
      });
    }
  }

  return { applied: true, ticketId: detail.ticketId };
}

export async function handleCurfexWebhook(opts: {
  body: unknown;
  rawBody?: Buffer | string;
  signature?: string;
}): Promise<{ ok: boolean; applied?: boolean; ticketId?: string; reason?: string }> {
  const config = await getCurfexConfig();
  if (!config.enabled) {
    return { ok: false, reason: 'CURFEX_DISABLED' };
  }

  if (config.webhookSecret) {
    const raw =
      opts.rawBody ??
      Buffer.from(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body ?? {}), 'utf8');
    const valid = verifyCurfexWebhookHmac(raw, opts.signature, config.webhookSecret);
    if (!valid) {
      throw new AppError(401, 'Invalid CURFEX webhook signature', 'CURFEX_HMAC_INVALID');
    }
  } else if (!config.sandbox) {
    console.warn('[CURFEX] webhookSecret empty — accepting without HMAC (configure secret in HQ)');
  }

  const normalized = normalizeCurfexWebhookBody(opts.body);
  const looksPaid = depositLooksReceived(normalized);
  if (!looksPaid) {
    // Still persist status if we can find the ticket
    const detail = await findCurfexTicket(normalized.refNo, normalized.merchantReference);
    if (detail && normalized.statusCode) {
      await prisma.usdtPurchaseDetail.update({
        where: { ticketId: detail.ticketId },
        data: {
          curfexStatusCode: normalized.statusCode,
          curfexLastEventJson: normalized.raw as object,
        },
      });
    }
    return { ok: true, applied: false, reason: 'STATUS_NOT_PAID', ticketId: detail?.ticketId };
  }

  const result = await applyCurfexDepositDetected({
    refNo: normalized.refNo,
    merchantReference: normalized.merchantReference,
    statusCode: normalized.statusCode,
    detail: normalized.detail,
    amountCollected: normalized.amountCollected,
    amount: normalized.amount,
    senderAccountName: normalized.senderAccountName,
    excessAmount: normalized.excessAmount,
    source: 'webhook',
    eventPayload: normalized.raw,
  });

  return { ok: true, ...result };
}

/** 티켓 상세 조회·수동 버튼용: CURFEX 상태 폴링 후 입금이면 자동 전환 */
export async function syncCurfexDepositForTicket(ticketId: string): Promise<{
  synced: boolean;
  applied: boolean;
  statusCode?: string;
  ticket?: Awaited<ReturnType<typeof reloadTicket>>;
}> {
  const detail = await prisma.usdtPurchaseDetail.findUnique({
    where: { ticketId },
    include: { ticket: { select: { ticketNo: true } } },
  });
  if (!detail || detail.collectionProvider !== 'CURFEX' || !detail.curfexRefNo) {
    throw new AppError(400, 'Not a CURFEX collection ticket', 'NOT_CURFEX');
  }

  const config = await getCurfexConfig();
  if (config.sandbox) {
    return {
      synced: true,
      applied: false,
      statusCode: detail.curfexStatusCode ?? 'PENDING',
      ticket: await reloadTicket(ticketId),
    };
  }

  let status: CurfexPaymentStatus;
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

  let applied = false;
  if (depositLooksReceived(status) && detail.status === UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING) {
    const r = await applyCurfexDepositDetected({
      refNo: status.refNo || detail.curfexRefNo,
      merchantReference: status.merchantReference || detail.ticket.ticketNo,
      statusCode: status.statusCode,
      detail: status.detail,
      amountCollected: status.amountCollected,
      amount: status.amount,
      senderAccountName: status.senderAccountName,
      excessAmount: status.excessAmount,
      source: 'poll',
      eventPayload: status as unknown as Record<string, unknown>,
    });
    applied = r.applied;
  }

  return {
    synced: true,
    applied,
    statusCode: status.statusCode,
    ticket: await reloadTicket(ticketId),
  };
}

/** 샌드박스: 입금 웹훅을 시뮬레이션하여 업무 흐름 테스트 */
export async function simulateSandboxCurfexDeposit(ticketId: string) {
  const config = await getCurfexConfig();
  if (!config.sandbox) {
    throw new AppError(400, 'Sandbox simulation only when sandbox is ON', 'NOT_SANDBOX');
  }
  const detail = await prisma.usdtPurchaseDetail.findUnique({
    where: { ticketId },
    include: { ticket: { select: { ticketNo: true } } },
  });
  if (!detail || detail.collectionProvider !== 'CURFEX') {
    throw new AppError(400, 'Not a CURFEX collection ticket', 'NOT_CURFEX');
  }
  if (detail.status !== UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING) {
    throw new AppError(400, 'Ticket is not awaiting deposit', 'INVALID_STATE');
  }

  const result = await applyCurfexDepositDetected({
    refNo: detail.curfexRefNo || undefined,
    merchantReference: detail.ticket.ticketNo,
    statusCode: 'PAID',
    detail: 'Sandbox simulated deposit',
    amountCollected: Number(detail.fiatAmount),
    senderAccountName: 'SANDBOX DEPOSITOR',
    source: 'sandbox',
    eventPayload: { simulated: true, at: new Date().toISOString() },
  });

  return {
    ...result,
    ticket: await reloadTicket(ticketId),
  };
}

/** 대기 중 CURFEX 티켓 주기 폴링 (웹훅 유실 대비) */
export async function pollPendingCurfexDeposits(): Promise<number> {
  const config = await getCurfexConfig();
  if (!config.enabled || config.sandbox) return 0;

  const pending = await prisma.usdtPurchaseDetail.findMany({
    where: {
      collectionProvider: 'CURFEX',
      status: UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
      curfexRefNo: { not: null },
    },
    select: { ticketId: true },
    take: 30,
    orderBy: { updatedAt: 'asc' },
  });

  let applied = 0;
  for (const row of pending) {
    try {
      const r = await syncCurfexDepositForTicket(row.ticketId);
      if (r.applied) applied += 1;
    } catch (err) {
      console.warn('[CURFEX] poll failed', row.ticketId, err);
    }
  }
  return applied;
}

export function startCurfexDepositPoller() {
  const intervalMs = 60_000;
  setInterval(() => {
    pollPendingCurfexDeposits().catch((err) => console.warn('[CURFEX] poller error', err));
  }, intervalMs);
}

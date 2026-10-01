import { prisma } from '../lib/prisma';
import { getEmailOtpConfig, isSmtpConfigured } from './otp.service';
import { sendGenericEmail } from './email.service';
import { buildMultilingualTradeReceipt } from '../constants/trade-receipt-i18n';
import type { TradeReceiptEmailMode, TradeReceiptSendStatus, TradeReceiptUiMode } from '@prisma/client';
import type { HqEmailOtpConfig } from '../constants/hq-policy';

export type TradeReceiptEffect = 'ENABLED' | 'DISABLED' | 'HQ_ONLY';

export type TradeReceiptFlags = {
  /** 본사 명세서 보관 (명세서관리) */
  archive: boolean;
  /** 가맹점 이메일 발송 */
  email: boolean;
  /** 관리자 상세: 거래 명세서 보기·PDF */
  adminUi: boolean;
  /** 가맹점 상세: 거래 명세서 보기·PDF */
  merchantUi: boolean;
};

export type TradeReceiptCustomerModes = {
  tradeReceiptEmailMode?: TradeReceiptEmailMode | null;
  tradeReceiptAdminUiMode?: TradeReceiptUiMode | null;
  tradeReceiptMerchantUiMode?: TradeReceiptUiMode | null;
};

export function hqTradeReceiptMode(
  cfg: Pick<HqEmailOtpConfig, 'tradeReceiptEmailEnabled' | 'tradeReceiptEmailMode'>,
): TradeReceiptEffect {
  const mode = cfg.tradeReceiptEmailMode;
  if (mode === 'ENABLED' || mode === 'DISABLED' || mode === 'HQ_ONLY') return mode;
  // 레거시(모드 없음): 기본은 본사만. enabled=false면 비활성
  return cfg.tradeReceiptEmailEnabled === false ? 'DISABLED' : 'HQ_ONLY';
}

export function resolveTradeReceiptEffect(
  hq: TradeReceiptEffect,
  merchantMode: TradeReceiptEmailMode | null | undefined,
): TradeReceiptEffect {
  const mode = merchantMode ?? 'FOLLOW_HQ';
  if (mode === 'FOLLOW_HQ') return hq;
  if (mode === 'ENABLED' || mode === 'DISABLED' || mode === 'HQ_ONLY') return mode;
  return hq;
}

function resolveUiFlag(
  effect: TradeReceiptEffect,
  hqEnabled: boolean,
  merchantMode: TradeReceiptUiMode | null | undefined,
): boolean {
  if (effect === 'DISABLED') return false;
  const mode = merchantMode ?? 'FOLLOW_HQ';
  if (mode === 'ENABLED') return true;
  if (mode === 'DISABLED') return false;
  return hqEnabled;
}

export function tradeReceiptFlags(
  effect: TradeReceiptEffect,
  cfg: Pick<HqEmailOtpConfig, 'tradeReceiptAdminUiEnabled' | 'tradeReceiptMerchantUiEnabled'>,
  merchant?: TradeReceiptCustomerModes | null,
): TradeReceiptFlags {
  const archive = effect === 'ENABLED' || effect === 'HQ_ONLY';
  const email = effect === 'ENABLED';
  const hqAdminUi = cfg.tradeReceiptAdminUiEnabled !== false;
  const hqMerchantUi = cfg.tradeReceiptMerchantUiEnabled === true;
  return {
    archive,
    email,
    adminUi: resolveUiFlag(effect, hqAdminUi, merchant?.tradeReceiptAdminUiMode),
    merchantUi: resolveUiFlag(effect, hqMerchantUi, merchant?.tradeReceiptMerchantUiMode),
  };
}

export async function resolveTradeReceiptForCustomer(
  merchant?: TradeReceiptCustomerModes | null,
): Promise<TradeReceiptFlags> {
  const cfg = await getEmailOtpConfig();
  const effect = resolveTradeReceiptEffect(hqTradeReceiptMode(cfg), merchant?.tradeReceiptEmailMode);
  return tradeReceiptFlags(effect, cfg, merchant);
}

export type TradeReceiptPayload = {
  to: string;
  userName: string;
  ticketNo: string;
  ticketId?: string;
  ticketType: 'USDT_PURCHASE' | 'TRADE_ESCROW';
  fiatAmount: number;
  fiatCurrency: string;
  expectedUsdt: number;
  actualUsdt?: number | null;
  usdtTxId?: string | null;
  customerProfileId?: string | null;
};

async function createLog(input: {
  ticketId?: string | null;
  ticketNo: string;
  ticketType: string;
  toEmail: string;
  toName?: string | null;
  subject: string;
  bodyText: string;
  bodyHtml?: string | null;
  status: TradeReceiptSendStatus;
  skipReason?: string | null;
  errorMessage?: string | null;
  customerProfileId?: string | null;
}) {
  return prisma.tradeReceiptEmailLog.create({
    data: {
      ticketId: input.ticketId ?? null,
      ticketNo: input.ticketNo,
      ticketType: input.ticketType,
      toEmail: input.toEmail,
      toName: input.toName ?? null,
      subject: input.subject,
      bodyText: input.bodyText,
      bodyHtml: input.bodyHtml ?? null,
      status: input.status,
      skipReason: input.skipReason ?? null,
      errorMessage: input.errorMessage ?? null,
      customerProfileId: input.customerProfileId ?? null,
    },
  });
}

export async function sendTradeReceiptEmail(payload: TradeReceiptPayload) {
  const cfg = await getEmailOtpConfig();
  let merchant: TradeReceiptCustomerModes | null = null;
  if (payload.customerProfileId) {
    const profile = await prisma.customerProfile.findUnique({
      where: { id: payload.customerProfileId },
      select: {
        tradeReceiptEmailMode: true,
        tradeReceiptAdminUiMode: true,
        tradeReceiptMerchantUiMode: true,
      },
    });
    merchant = profile;
  }

  const { subject, text, html } = buildMultilingualTradeReceipt({
    userName: payload.userName,
    ticketNo: payload.ticketNo,
    fiatAmount: payload.fiatAmount,
    fiatCurrency: payload.fiatCurrency,
    expectedUsdt: payload.expectedUsdt,
    actualUsdt: payload.actualUsdt,
    usdtTxId: payload.usdtTxId,
  });

  const flags = tradeReceiptFlags(
    resolveTradeReceiptEffect(hqTradeReceiptMode(cfg), merchant?.tradeReceiptEmailMode),
    cfg,
    merchant,
  );
  if (!flags.archive) {
    console.info(`[trade-email] disabled — no archive ${payload.ticketNo} → ${payload.to}`);
    return null;
  }
  if (!flags.email) {
    console.info(`[trade-email] hq archive only — ${payload.ticketNo} → ${payload.to}`);
    return createLog({
      ticketId: payload.ticketId,
      ticketNo: payload.ticketNo,
      ticketType: payload.ticketType,
      toEmail: payload.to,
      toName: payload.userName,
      subject,
      bodyText: text,
      bodyHtml: html,
      status: 'SKIPPED',
      skipReason: 'HQ_ONLY',
      customerProfileId: payload.customerProfileId,
    });
  }

  if (!isSmtpConfigured(cfg)) {
    console.warn(`[trade-email] SMTP not configured — ${payload.ticketNo} → ${payload.to}`);
    return createLog({
      ticketId: payload.ticketId,
      ticketNo: payload.ticketNo,
      ticketType: payload.ticketType,
      toEmail: payload.to,
      toName: payload.userName,
      subject,
      bodyText: text,
      bodyHtml: html,
      status: 'FAILED',
      errorMessage: 'SMTP_NOT_CONFIGURED',
      customerProfileId: payload.customerProfileId,
    });
  }

  try {
    await sendGenericEmail(cfg, payload.to, subject, text, html);
    console.info(`[trade-email] sent — ${payload.ticketNo} → ${payload.to}`);
    return createLog({
      ticketId: payload.ticketId,
      ticketNo: payload.ticketNo,
      ticketType: payload.ticketType,
      toEmail: payload.to,
      toName: payload.userName,
      subject,
      bodyText: text,
      bodyHtml: html,
      status: 'SENT',
      customerProfileId: payload.customerProfileId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[trade-email] send failed:', err);
    return createLog({
      ticketId: payload.ticketId,
      ticketNo: payload.ticketNo,
      ticketType: payload.ticketType,
      toEmail: payload.to,
      toName: payload.userName,
      subject,
      bodyText: text,
      bodyHtml: html,
      status: 'FAILED',
      errorMessage: message.slice(0, 1000),
      customerProfileId: payload.customerProfileId,
    });
  }
}

export async function listTradeReceiptEmailLogs(input: {
  page?: number;
  pageSize?: number;
  status?: TradeReceiptSendStatus;
  q?: string;
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 50));
  const where: {
    status?: TradeReceiptSendStatus;
    OR?: Array<{
      ticketNo?: { contains: string; mode: 'insensitive' };
      toEmail?: { contains: string; mode: 'insensitive' };
      toName?: { contains: string; mode: 'insensitive' };
    }>;
  } = {};
  if (input.status) where.status = input.status;
  const q = input.q?.trim();
  if (q) {
    where.OR = [
      { ticketNo: { contains: q, mode: 'insensitive' } },
      { toEmail: { contains: q, mode: 'insensitive' } },
      { toName: { contains: q, mode: 'insensitive' } },
    ];
  }
  const [total, rows] = await Promise.all([
    prisma.tradeReceiptEmailLog.count({ where }),
    prisma.tradeReceiptEmailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { total, page, pageSize, rows };
}

export async function getTradeReceiptEmailLog(id: string) {
  return prisma.tradeReceiptEmailLog.findUnique({ where: { id } });
}

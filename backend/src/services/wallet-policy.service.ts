import { Prisma, UsdtPurchaseStatus, WalletApprovalStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { recordMerchantOperation } from './merchant-operation-log.service';

export const MAX_CUSTOMER_WALLETS = 5;

const OPEN_USDT_STATUSES: UsdtPurchaseStatus[] = [
  UsdtPurchaseStatus.QUOTE_PENDING,
  UsdtPurchaseStatus.QUOTE_CONFIRMED,
  UsdtPurchaseStatus.APPLICATION_COMPLETED,
  UsdtPurchaseStatus.CARD_PAYMENT_PENDING,
  UsdtPurchaseStatus.DEPOSIT_PROOF_PENDING,
  UsdtPurchaseStatus.ADMIN_REVIEWING,
  UsdtPurchaseStatus.TRANSFER_IN_PROGRESS,
];

const CASE_INSENSITIVE_NETWORKS = new Set(['ERC20', 'BEP20', 'ETH', 'POLYGON']);

export function normalizeWalletNetwork(network: string): string {
  const net = network.trim().toUpperCase();
  return net || 'TRC20';
}

export function normalizeWalletAddress(network: string, address: string): string {
  const trimmed = address.trim();
  const net = normalizeWalletNetwork(network);
  if (CASE_INSENSITIVE_NETWORKS.has(net)) return trimmed.toLowerCase();
  return trimmed;
}

export async function rememberApprovedAddress(userId: string, network: string, address: string) {
  const net = normalizeWalletNetwork(network);
  const addr = normalizeWalletAddress(net, address);
  await prisma.walletAddressApproval.upsert({
    where: { userId_address_network: { userId, address: addr, network: net } },
    create: { userId, address: addr, network: net },
    update: { approvedAt: new Date() },
  });
}

export async function hasApprovedAddress(userId: string, network: string, address: string) {
  const net = normalizeWalletNetwork(network);
  const want = normalizeWalletAddress(net, address);
  const rows = await prisma.walletAddressApproval.findMany({
    where: { userId, network: net },
    select: { address: true },
  });
  return rows.some((row) => normalizeWalletAddress(net, row.address) === want);
}

export async function assertWalletNotInOpenTrade(walletId: string) {
  const openCount = await prisma.usdtPurchaseDetail.count({
    where: { walletId, status: { in: OPEN_USDT_STATUSES } },
  });
  if (openCount > 0) {
    throw new AppError(
      400,
      '진행 중인 거래가 있어 이 지갑의 주소를 바꾸거나 삭제할 수 없습니다',
      'WALLET_IN_PROGRESS',
    );
  }
}

async function reassignDefault(userId: string, exceptWalletId: string) {
  const next = await prisma.wallet.findFirst({
    where: {
      userId,
      isActive: true,
      id: { not: exceptWalletId },
      approvalStatus: WalletApprovalStatus.APPROVED,
      deleteRequestedAt: null,
    },
    orderBy: { createdAt: 'asc' },
  });
  if (next) {
    await prisma.wallet.update({ where: { id: next.id }, data: { isDefault: true } });
  }
}

type FeeInput = {
  fxFeePercent: number;
  gasFeeAmount: number;
  transferFeeAmount: number;
  otherFeeAmount: number;
  platformFeeAmount: number;
};

type AuditBits = {
  actorId: string;
  ipAddress?: string;
  userAgent?: string;
};

const WALLET_NICKNAME_MAX = 40;

export function normalizeWalletNickname(raw: string | undefined | null): string {
  return String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, WALLET_NICKNAME_MAX);
}

export async function registerMerchantWallet(
  ownerId: string,
  input: {
    label?: string;
    address: string;
    network: string;
    fees: FeeInput;
  } & AuditBits,
) {
  const network = normalizeWalletNetwork(input.network);
  const address = normalizeWalletAddress(network, input.address);
  if (address.length < 10) {
    throw new AppError(400, '지갑 주소가 너무 짧습니다', 'VALIDATION');
  }
  const label = normalizeWalletNickname(input.label);
  if (!label) {
    throw new AppError(
      400,
      'Wallet nickname is required (e.g. Binance, Upbit, MetaMask)',
      'WALLET_NICKNAME_REQUIRED',
    );
  }

  const activeCount = await prisma.wallet.count({ where: { userId: ownerId, isActive: true } });
  const existing = await prisma.wallet.findFirst({
    where: { userId: ownerId, address, network },
  });
  if (existing?.isActive) {
    throw new AppError(400, '이미 등록된 지갑 주소입니다', 'WALLET_DUPLICATE');
  }
  if (activeCount >= MAX_CUSTOMER_WALLETS) {
    throw new AppError(400, '지갑은 최대 5개까지 등록할 수 있습니다', 'WALLET_LIMIT');
  }

  const previouslyApproved = await hasApprovedAddress(ownerId, network, address);
  const approvalStatus = previouslyApproved
    ? WalletApprovalStatus.APPROVED
    : WalletApprovalStatus.PENDING;

  const wallet = existing
    ? await prisma.wallet.update({
        where: { id: existing.id },
        data: {
          label,
          isActive: true,
          isDefault: false,
          approvalStatus,
          deleteRequestedAt: null,
        },
      })
    : await prisma.wallet.create({
        data: {
          userId: ownerId,
          label,
          address,
          network,
          isDefault: false,
          hqRegistered: false,
          approvalStatus,
          fxFeePercent: input.fees.fxFeePercent,
          gasFeeAmount: input.fees.gasFeeAmount,
          transferFeeAmount: input.fees.transferFeeAmount,
          otherFeeAmount: input.fees.otherFeeAmount,
          platformFeeAmount: input.fees.platformFeeAmount,
        },
      });

  await recordMerchantOperation({
    actorId: input.actorId,
    merchantAdminUserId: ownerId,
    action: 'WALLET_CREATE',
    entityType: 'Wallet',
    entityId: wallet.id,
    summary:
      approvalStatus === WalletApprovalStatus.APPROVED
        ? `Register wallet ${network} ${address} (previously approved, no new HQ review)`
        : `Register wallet ${network} ${address} (pending HQ approval)`,
    after: {
      address,
      network,
      approvalStatus,
      previouslyApproved,
    } as Prisma.InputJsonValue,
    otpVerified: true,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return wallet;
}

export async function changeMerchantWalletAddress(
  ownerId: string,
  walletId: string,
  input: { address: string; network: string; label?: string } & AuditBits,
) {
  const existing = await prisma.wallet.findFirst({
    where: { id: walletId, userId: ownerId, isActive: true },
  });
  if (!existing) throw new AppError(404, '지갑을 찾을 수 없습니다', 'NOT_FOUND');
  if (existing.deleteRequestedAt) {
    throw new AppError(400, '삭제 요청 중인 지갑은 주소를 바꿀 수 없습니다', 'WALLET_DELETE_PENDING');
  }

  const network = normalizeWalletNetwork(input.network || existing.network);
  const address = normalizeWalletAddress(network, input.address);
  if (address.length < 10) {
    throw new AppError(400, '지갑 주소가 너무 짧습니다', 'VALIDATION');
  }

  const same =
    normalizeWalletAddress(existing.network, existing.address) === address &&
    normalizeWalletNetwork(existing.network) === network;
  if (same) {
    if (input.label === undefined) return existing;
    const nick = normalizeWalletNickname(input.label);
    if (!nick) {
      throw new AppError(400, 'Wallet nickname is required', 'WALLET_NICKNAME_REQUIRED');
    }
    return prisma.wallet.update({
      where: { id: existing.id },
      data: { label: nick },
    });
  }

  await assertWalletNotInOpenTrade(existing.id);

  const clash = await prisma.wallet.findFirst({
    where: { userId: ownerId, address, network, id: { not: existing.id } },
  });
  if (clash?.isActive) {
    throw new AppError(400, '이미 등록된 지갑 주소입니다', 'WALLET_DUPLICATE');
  }

  const previouslyApproved = await hasApprovedAddress(ownerId, network, address);
  const approvalStatus = previouslyApproved
    ? WalletApprovalStatus.APPROVED
    : WalletApprovalStatus.PENDING;

  const wallet = await prisma.$transaction(async (tx) => {
    if (clash && !clash.isActive) {
      await tx.wallet.update({
        where: { id: clash.id },
        data: { address: `retired:${clash.id}` },
      });
    }
    const updated = await tx.wallet.update({
      where: { id: existing.id },
      data: {
        address,
        network,
        approvalStatus,
        ...(input.label !== undefined ? { label: input.label.trim() || null } : {}),
        ...(approvalStatus !== WalletApprovalStatus.APPROVED ? { isDefault: false } : {}),
      },
    });
    return updated;
  });

  if (existing.isDefault && wallet.approvalStatus !== WalletApprovalStatus.APPROVED) {
    await reassignDefault(ownerId, wallet.id);
  }

  await recordMerchantOperation({
    actorId: input.actorId,
    merchantAdminUserId: ownerId,
    action: 'WALLET_ADDRESS_CHANGE',
    entityType: 'Wallet',
    entityId: wallet.id,
    summary: `Change wallet address ${existing.network} → ${network} (open trades unchanged)`,
    before: {
      address: existing.address,
      network: existing.network,
      approvalStatus: existing.approvalStatus,
    },
    after: {
      address: wallet.address,
      network: wallet.network,
      approvalStatus: wallet.approvalStatus,
      previouslyApproved,
    },
    otpVerified: true,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return wallet;
}

/** 닉네임만 변경 — 주소·승인 상태 불변, OTP 불필요 */
export async function renameMerchantWalletNickname(
  ownerId: string,
  walletId: string,
  labelRaw: string,
  audit: AuditBits,
) {
  const existing = await prisma.wallet.findFirst({
    where: { id: walletId, userId: ownerId, isActive: true },
  });
  if (!existing) throw new AppError(404, '지갑을 찾을 수 없습니다', 'NOT_FOUND');
  if (existing.deleteRequestedAt) {
    throw new AppError(400, '삭제 요청 중인 지갑은 닉네임을 바꿀 수 없습니다', 'WALLET_DELETE_PENDING');
  }
  const label = normalizeWalletNickname(labelRaw);
  if (!label) {
    throw new AppError(400, 'Wallet nickname is required', 'WALLET_NICKNAME_REQUIRED');
  }
  if (existing.label === label) return existing;

  const wallet = await prisma.wallet.update({
    where: { id: existing.id },
    data: { label },
  });

  await recordMerchantOperation({
    actorId: audit.actorId,
    merchantAdminUserId: ownerId,
    action: 'WALLET_NICKNAME_UPDATE',
    entityType: 'Wallet',
    entityId: wallet.id,
    summary: `Rename wallet nickname ${existing.label ?? '—'} → ${label}`,
    before: { label: existing.label },
    after: { label: wallet.label },
    otpVerified: false,
    ipAddress: audit.ipAddress,
    userAgent: audit.userAgent,
  });

  return wallet;
}

export async function requestMerchantWalletDeletion(
  ownerId: string,
  walletId: string,
  audit: AuditBits,
) {
  const existing = await prisma.wallet.findFirst({
    where: { id: walletId, userId: ownerId, isActive: true },
  });
  if (!existing) throw new AppError(404, '지갑을 찾을 수 없습니다', 'NOT_FOUND');
  if (existing.deleteRequestedAt) {
    throw new AppError(400, '이미 삭제 요청된 지갑입니다', 'WALLET_DELETE_PENDING');
  }

  const activeCount = await prisma.wallet.count({ where: { userId: ownerId, isActive: true } });
  if (activeCount <= 1) {
    throw new AppError(400, '마지막 지갑은 삭제 요청할 수 없습니다', 'WALLET_LAST');
  }

  await assertWalletNotInOpenTrade(existing.id);

  const wallet = await prisma.wallet.update({
    where: { id: existing.id },
    data: { deleteRequestedAt: new Date(), isDefault: false },
  });
  if (existing.isDefault) await reassignDefault(ownerId, wallet.id);

  await recordMerchantOperation({
    actorId: audit.actorId,
    merchantAdminUserId: ownerId,
    action: 'WALLET_DELETE_REQUEST',
    entityType: 'Wallet',
    entityId: wallet.id,
    summary: `Request wallet deletion ${wallet.network} ${wallet.address}`,
    before: { address: existing.address, network: existing.network, isDefault: existing.isDefault },
    after: { deleteRequestedAt: wallet.deleteRequestedAt?.toISOString() ?? null },
    otpVerified: true,
    ipAddress: audit.ipAddress,
    userAgent: audit.userAgent,
  });

  return wallet;
}

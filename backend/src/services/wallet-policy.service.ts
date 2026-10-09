import { Prisma, UsdtPurchaseStatus, WalletApprovalStatus, type WalletAssetType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { validateWalletAddressFormat } from '../lib/wallet-address';
import { recordMerchantOperation } from './merchant-operation-log.service';
import type { SettlementAsset } from './settlement-asset.service';

/** 자산(USDT/USDC)별 활성 지갑 상한 */
export const MAX_CUSTOMER_WALLETS = 6;

/** USDT: TRON 주력. USDC: Circle TRON 미지원 → TRC20 불가 */
export const WALLET_NETWORKS_BY_ASSET = {
  USDT: ['TRC20', 'ERC20', 'BEP20', 'POLYGON', 'ARBITRUM', 'SOL', 'OPTIMISM', 'AVAX', 'BASE'],
  USDC: ['SOL', 'BASE', 'ERC20', 'BEP20', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'AVAX'],
} as const;

export function defaultNetworkForAsset(asset: 'USDT' | 'USDC'): string {
  return asset === 'USDC' ? 'SOL' : 'TRC20';
}

export function assertNetworkForAsset(network: string, asset: 'USDT' | 'USDC') {
  const net = normalizeWalletNetwork(network) || defaultNetworkForAsset(asset);
  const allowed = WALLET_NETWORKS_BY_ASSET[asset] as readonly string[];
  if (!allowed.includes(net)) {
    throw new AppError(
      400,
      asset === 'USDC'
        ? 'USDC does not support this network (TRC20/Tron is unavailable for native USDC)'
        : 'Unsupported network for USDT wallet',
      'WALLET_NETWORK_ASSET',
    );
  }
  return net;
}

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

/** Normalize network code. Empty stays empty — callers must supply defaultNetworkForAsset(asset). */
export function normalizeWalletNetwork(network: string): string {
  return String(network ?? '').trim().toUpperCase();
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

async function reassignDefault(
  userId: string,
  exceptWalletId: string,
  assetType?: WalletAssetType | string | null,
) {
  const next = await prisma.wallet.findFirst({
    where: {
      userId,
      isActive: true,
      id: { not: exceptWalletId },
      approvalStatus: WalletApprovalStatus.APPROVED,
      deleteRequestedAt: null,
      ...(assetType ? { assetType: assetType as WalletAssetType } : {}),
    },
    orderBy: { createdAt: 'asc' },
  });
  if (next) {
    await prisma.wallet.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  await ensurePrimaryWalletForAsset(userId, assetType ?? next?.assetType ?? 'USDT');
}

/**
 * 자산별 활성 지갑(삭제요청 제외)이 1개면 자동으로 대표지갑(isDefault).
 * 여러 개인데 대표가 없으면 승인된 가장 오래된 지갑(없으면 가장 오래된 지갑)을 지정.
 */
export async function ensurePrimaryWalletForAsset(
  userId: string,
  assetType?: WalletAssetType | string | null,
) {
  const asset = (assetType === 'USDC' ? 'USDC' : 'USDT') as WalletAssetType;
  const rows = await prisma.wallet.findMany({
    where: {
      userId,
      isActive: true,
      deleteRequestedAt: null,
      assetType: asset,
    },
    select: { id: true, isDefault: true, approvalStatus: true },
    orderBy: { createdAt: 'asc' },
  });
  if (rows.length === 0) return null;

  if (rows.length === 1) {
    const sole = rows[0]!;
    if (!sole.isDefault) {
      await prisma.wallet.update({ where: { id: sole.id }, data: { isDefault: true } });
    }
    return sole.id;
  }

  const currentDefault = rows.find((r) => r.isDefault);
  if (currentDefault) return currentDefault.id;

  const approved = rows.find((r) => r.approvalStatus === WalletApprovalStatus.APPROVED);
  const pick = approved ?? rows[0]!;
  await prisma.wallet.update({ where: { id: pick.id }, data: { isDefault: true } });
  return pick.id;
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
    assetType?: SettlementAsset | WalletAssetType;
    fees: FeeInput;
  } & AuditBits,
) {
  const assetType = (input.assetType === 'USDC' ? 'USDC' : 'USDT') as WalletAssetType;
  const network = assertNetworkForAsset(input.network, assetType);
  const format = validateWalletAddressFormat(network, input.address);
  if (!format.ok) {
    throw new AppError(400, format.message, format.code);
  }
  const address = normalizeWalletAddress(network, format.address);
  const label = normalizeWalletNickname(input.label);
  if (!label) {
    throw new AppError(
      400,
      'Wallet nickname is required (e.g. Binance, Upbit, MetaMask)',
      'WALLET_NICKNAME_REQUIRED',
    );
  }

  /** 자산별 한도(USDT 6 + USDC 6) */
  const activeCount = await prisma.wallet.count({
    where: { userId: ownerId, isActive: true, assetType },
  });
  const existing = await prisma.wallet.findFirst({
    where: { userId: ownerId, address, network, assetType },
  });
  if (existing?.isActive) {
    throw new AppError(400, '이미 등록된 지갑 주소입니다', 'WALLET_DUPLICATE');
  }
  if (activeCount >= MAX_CUSTOMER_WALLETS) {
    throw new AppError(
      400,
      `지갑은 ${assetType} 기준 최대 ${MAX_CUSTOMER_WALLETS}개까지 등록할 수 있습니다`,
      'WALLET_LIMIT',
    );
  }

  const previouslyApproved = await hasApprovedAddress(ownerId, network, address);
  const approvalStatus = previouslyApproved
    ? WalletApprovalStatus.APPROVED
    : WalletApprovalStatus.PENDING;
  /** 해당 자산의 첫 지갑이면 자동 대표지갑 */
  const asPrimary = activeCount === 0;

  const wallet = existing
    ? await prisma.wallet.update({
        where: { id: existing.id },
        data: {
          label,
          isActive: true,
          isDefault: asPrimary,
          approvalStatus,
          deleteRequestedAt: null,
          assetType,
        },
      })
    : await prisma.wallet.create({
        data: {
          userId: ownerId,
          label,
          address,
          network,
          assetType,
          isDefault: asPrimary,
          hqRegistered: false,
          approvalStatus,
          fxFeePercent: input.fees.fxFeePercent,
          gasFeeAmount: input.fees.gasFeeAmount,
          transferFeeAmount: input.fees.transferFeeAmount,
          otherFeeAmount: input.fees.otherFeeAmount,
          platformFeeAmount: input.fees.platformFeeAmount,
          feeCurrency: assetType,
        },
      });

  await ensurePrimaryWalletForAsset(ownerId, assetType);

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
  input: {
    address: string;
    network: string;
    assetType?: SettlementAsset | WalletAssetType;
    label?: string;
  } & AuditBits,
) {
  const existing = await prisma.wallet.findFirst({
    where: { id: walletId, userId: ownerId, isActive: true },
  });
  if (!existing) throw new AppError(404, '지갑을 찾을 수 없습니다', 'NOT_FOUND');
  if (existing.deleteRequestedAt) {
    throw new AppError(400, '삭제 요청 중인 지갑은 주소를 바꿀 수 없습니다', 'WALLET_DELETE_PENDING');
  }

  /** 자산(USDT/USDC)은 등록 후 변경 불가 — 요청 값이 와도 무시하고 기존 고정 */
  const assetType = (existing.assetType === 'USDC' ? 'USDC' : 'USDT') as WalletAssetType;
  if (
    input.assetType === 'USDC' ||
    input.assetType === 'USDT'
  ) {
    if (input.assetType !== assetType) {
      throw new AppError(
        400,
        'Wallet asset (USDT/USDC) cannot be changed after registration',
        'WALLET_ASSET_LOCKED',
      );
    }
  }
  const network = assertNetworkForAsset(input.network || existing.network, assetType);
  const format = validateWalletAddressFormat(network, input.address);
  if (!format.ok) {
    throw new AppError(400, format.message, format.code);
  }
  const address = normalizeWalletAddress(network, format.address);

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
    where: {
      userId: ownerId,
      address,
      network,
      assetType,
      id: { not: existing.id },
    },
  });
  if (clash?.isActive) {
    throw new AppError(400, '이미 등록된 지갑 주소입니다', 'WALLET_DUPLICATE');
  }

  const previouslyApproved = await hasApprovedAddress(ownerId, network, address);
  const approvalStatus = previouslyApproved
    ? WalletApprovalStatus.APPROVED
    : WalletApprovalStatus.PENDING;

  const clearDefault = approvalStatus !== WalletApprovalStatus.APPROVED;
  const wallet = await prisma.$transaction(async (tx) => {
    if (clash && !clash.isActive) {
      /** 비활성 충돌 행만 주소 슬롯 비움 — 과거 거래는 walletAddressSnapshot 유지 */
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
        /** assetType 고정 — 변경하지 않음 */
        approvalStatus,
        ...(input.label !== undefined ? { label: input.label.trim() || null } : {}),
        ...(clearDefault ? { isDefault: false } : {}),
      },
    });
    return updated;
  });

  if (existing.isDefault && clearDefault) {
    await reassignDefault(ownerId, wallet.id, assetType);
  } else {
    await ensurePrimaryWalletForAsset(ownerId, assetType);
  }

  await recordMerchantOperation({
    actorId: input.actorId,
    merchantAdminUserId: ownerId,
    action: 'WALLET_ADDRESS_CHANGE',
    entityType: 'Wallet',
    entityId: wallet.id,
    summary: `Change wallet ${assetType}/${existing.network} → ${assetType}/${network}`,
    before: {
      address: existing.address,
      network: existing.network,
      assetType,
      approvalStatus: existing.approvalStatus,
    },
    after: {
      address: wallet.address,
      network: wallet.network,
      assetType,
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

  const activeSameAsset = await prisma.wallet.count({
    where: {
      userId: ownerId,
      isActive: true,
      assetType: existing.assetType ?? 'USDT',
      deleteRequestedAt: null,
    },
  });
  if (activeSameAsset <= 1) {
    throw new AppError(
      400,
      `마지막 ${existing.assetType ?? 'USDT'} 지갑은 삭제 요청할 수 없습니다`,
      'WALLET_LAST',
    );
  }

  await assertWalletNotInOpenTrade(existing.id);

  const wallet = await prisma.wallet.update({
    where: { id: existing.id },
    data: { deleteRequestedAt: new Date(), isDefault: false },
  });
  if (existing.isDefault) {
    await reassignDefault(ownerId, wallet.id, existing.assetType);
  } else {
    await ensurePrimaryWalletForAsset(ownerId, existing.assetType);
  }

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

import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { validateWalletAddressFormat } from '../lib/wallet-address';
import { HQ_CONFIG_KEYS, type HqPgSettlementWallet, type HqPgSettlementWalletsConfig } from '../constants/hq-policy';
import {
  assertNetworkForAsset,
  defaultNetworkForAsset,
  normalizeReceiveWalletAsset,
  normalizeWalletAddress,
  normalizeWalletNetwork,
  type ReceiveWalletAsset,
} from './wallet-policy.service';

const CONFIG_KEY = HQ_CONFIG_KEYS.pgSettlementWallets;

export function defaultPgSettlementWalletsConfig(): HqPgSettlementWalletsConfig {
  return { items: [] };
}

function normalizeItem(raw: unknown): HqPgSettlementWallet | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const asset = normalizeReceiveWalletAsset(row.asset);
  let network: string;
  try {
    network = assertNetworkForAsset(String(row.network ?? ''), asset);
  } catch {
    network = defaultNetworkForAsset(asset);
  }
  const addressRaw = String(row.address ?? '').trim();
  if (!addressRaw) return null;
  const check = validateWalletAddressFormat(network, addressRaw);
  const address = check.ok
    ? normalizeWalletAddress(network, check.address)
    : normalizeWalletAddress(network, addressRaw);
  const id = String(row.id ?? '').trim() || randomUUID();
  const label = String(row.label ?? '').trim().slice(0, 80);
  const memo = String(row.memo ?? '').trim().slice(0, 200);
  const createdAt = String(row.createdAt ?? '').trim() || new Date().toISOString();
  return {
    id,
    asset,
    network: normalizeWalletNetwork(network),
    address,
    ...(label ? { label } : {}),
    ...(memo ? { memo } : {}),
    createdAt,
  };
}

export function normalizePgSettlementWalletsConfig(
  raw: unknown,
): HqPgSettlementWalletsConfig {
  const itemsIn =
    raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: unknown[] }).items
      : Array.isArray(raw)
        ? raw
        : [];
  const items: HqPgSettlementWallet[] = [];
  const seen = new Set<string>();
  for (const row of itemsIn) {
    const item = normalizeItem(row);
    if (!item) continue;
    const dedupe = `${item.asset}|${item.network}|${item.address.toLowerCase()}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    items.push(item);
  }
  return { items };
}

export async function getPgSettlementWalletsConfig(): Promise<HqPgSettlementWalletsConfig> {
  const row = await prisma.systemConfig.findUnique({ where: { key: CONFIG_KEY } });
  if (!row) return defaultPgSettlementWalletsConfig();
  return normalizePgSettlementWalletsConfig(row.value);
}

export type PgSettlementWalletInput = {
  asset?: string;
  network?: string;
  address?: string;
  label?: string;
  memo?: string;
};

/** 등록: 형식 검증 후 목록에 추가 (PG 연동 없음 · 메모 대장) */
export async function addPgSettlementWallet(
  input: PgSettlementWalletInput,
): Promise<HqPgSettlementWalletsConfig> {
  const asset = normalizeReceiveWalletAsset(input.asset) as ReceiveWalletAsset;
  const network = assertNetworkForAsset(String(input.network ?? ''), asset);
  const addressCheck = validateWalletAddressFormat(network, String(input.address ?? ''));
  if (!addressCheck.ok) {
    throw new AppError(400, addressCheck.message, addressCheck.code);
  }
  const address = normalizeWalletAddress(network, addressCheck.address);
  const label = String(input.label ?? '').trim().slice(0, 80);
  const memo = String(input.memo ?? '').trim().slice(0, 200);

  const current = await getPgSettlementWalletsConfig();
  const dedupe = `${asset}|${network}|${address.toLowerCase()}`;
  if (
    current.items.some(
      (i) => `${i.asset}|${i.network}|${i.address.toLowerCase()}` === dedupe,
    )
  ) {
    throw new AppError(400, 'Already registered (same asset · network · address)', 'DUPLICATE');
  }

  const next: HqPgSettlementWalletsConfig = {
    items: [
      {
        id: randomUUID(),
        asset,
        network,
        address,
        ...(label ? { label } : {}),
        ...(memo ? { memo } : {}),
        createdAt: new Date().toISOString(),
      },
      ...current.items,
    ],
  };

  await prisma.systemConfig.upsert({
    where: { key: CONFIG_KEY },
    create: {
      key: CONFIG_KEY,
      value: next as object,
      description: 'PG 정산 지갑 메모 (연동 없음)',
    },
    update: {
      value: next as object,
      description: 'PG 정산 지갑 메모 (연동 없음)',
    },
  });
  return next;
}

export async function removePgSettlementWallet(id: string): Promise<HqPgSettlementWalletsConfig> {
  const target = String(id ?? '').trim();
  if (!target) throw new AppError(400, 'id required', 'VALIDATION');
  const current = await getPgSettlementWalletsConfig();
  const next: HqPgSettlementWalletsConfig = {
    items: current.items.filter((i) => i.id !== target),
  };
  if (next.items.length === current.items.length) {
    throw new AppError(404, 'Wallet memo not found', 'NOT_FOUND');
  }
  await prisma.systemConfig.upsert({
    where: { key: CONFIG_KEY },
    create: {
      key: CONFIG_KEY,
      value: next as object,
      description: 'PG 정산 지갑 메모 (연동 없음)',
    },
    update: {
      value: next as object,
      description: 'PG 정산 지갑 메모 (연동 없음)',
    },
  });
  return next;
}

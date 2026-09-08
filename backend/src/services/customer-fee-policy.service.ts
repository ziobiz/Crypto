import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import {
  assertEscrowShareTotals,
  assertUsdtShareTotals,
  defaultOrgSharePolicy,
  HQ_CONFIG_KEYS,
  HQ_ORG_LEVELS,
  normalizeCustomerFeeShare,
  normalizeOrgSharePolicy,
  type CustomerFeeShare,
  type HqOrgShareByType,
  type HqOrgSharePolicy,
} from '../constants/hq-policy';

export const MANUAL_FEE_TYPE_CODE = 'MANUAL';
export const DEFAULT_FEE_TYPE_CODE = 'DEFAULT';

export type FeeTicketKind = 'USDT_PURCHASE' | 'TRADE_ESCROW';

export type CustomerFeePolicySnapshot = {
  feeTypeCode: string;
  feeTypeName: string | null;
  operatingPercent: number;
  operatingFixedUsdt: number;
  shares: HqOrgShareByType;
  applyStartDate: string;
};

function toDateOnly(d: Date | string): Date {
  const s = typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10);
  return new Date(`${s}T00:00:00.000Z`);
}

function dateOnlyIso(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeShares(raw: unknown, fallback: HqOrgShareByType): HqOrgShareByType {
  const out = { ...fallback };
  if (!raw || typeof raw !== 'object') return out;
  const src = raw as Partial<HqOrgShareByType>;
  for (const level of HQ_ORG_LEVELS) {
    const slice = src[level];
    out[level] = {
      poolPercent: num(slice?.poolPercent, out[level].poolPercent),
      perTicketUsdt: num(slice?.perTicketUsdt, out[level].perTicketUsdt),
    };
  }
  return out;
}

export function policyConfigFromTemplate(config: HqOrgSharePolicy): HqOrgSharePolicy {
  return normalizeOrgSharePolicy(config);
}

function snapshotFromPolicyRow(row: {
  feeTypeCode: string;
  feeTypeName: string | null;
  operatingPercent: Prisma.Decimal | number;
  operatingFixedUsdt: Prisma.Decimal | number;
  shares: unknown;
  applyStartDate: Date;
}): CustomerFeePolicySnapshot {
  return {
    feeTypeCode: row.feeTypeCode,
    feeTypeName: row.feeTypeName,
    operatingPercent: num(row.operatingPercent),
    operatingFixedUsdt: num(row.operatingFixedUsdt),
    shares: normalizeShares(row.shares, defaultOrgSharePolicy().USDT_PURCHASE),
    applyStartDate: dateOnlyIso(row.applyStartDate),
  };
}

function sliceFromCustomerShare(
  share: CustomerFeeShare,
  ticketKind: FeeTicketKind,
): { operatingPercent: number; operatingFixedUsdt: number; shares: HqOrgShareByType } {
  if (ticketKind === 'TRADE_ESCROW') {
    return {
      operatingPercent: share.escrowFeePercent,
      operatingFixedUsdt: share.escrowPerTicketUsdt,
      shares: share.TRADE_ESCROW,
    };
  }
  return {
    operatingPercent: share.usdtOperatingFeePercent,
    operatingFixedUsdt: share.usdtOperatingFeeUsdt,
    shares: share.USDT_PURCHASE,
  };
}

function assertTicketSlice(
  ticketKind: FeeTicketKind,
  operatingPercent: number,
  operatingFixedUsdt: number,
  shares: HqOrgShareByType,
): void {
  try {
    if (ticketKind === 'TRADE_ESCROW') {
      assertEscrowShareTotals({
        escrowFeePercent: operatingPercent,
        escrowPerTicketUsdt: operatingFixedUsdt,
        TRADE_ESCROW: shares,
      });
    } else {
      assertUsdtShareTotals({
        usdtOperatingFeePercent: operatingPercent,
        usdtOperatingFeeUsdt: operatingFixedUsdt,
        USDT_PURCHASE: shares,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'SHARE_MISMATCH';
    const code = msg.startsWith('USDT_SHARE_MISMATCH') ? 'USDT_SHARE_MISMATCH' : 'ESCROW_SHARE_MISMATCH';
    throw new AppError(400, msg, code);
  }
}

/** Ensure DEFAULT fee type exists; sync from SystemConfig org_share if empty. */
export async function ensureDefaultFeeTypeTemplate(): Promise<{
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
  sortOrder: number;
  config: HqOrgSharePolicy;
}> {
  const existingDefault = await prisma.feeTypeTemplate.findFirst({
    where: { isDefault: true },
    orderBy: { sortOrder: 'asc' },
  });
  if (existingDefault) {
    return {
      ...existingDefault,
      config: normalizeOrgSharePolicy(existingDefault.config as HqOrgSharePolicy),
    };
  }

  const byCode = await prisma.feeTypeTemplate.findUnique({ where: { code: DEFAULT_FEE_TYPE_CODE } });
  if (byCode) {
    const updated = await prisma.feeTypeTemplate.update({
      where: { id: byCode.id },
      data: { isDefault: true },
    });
    return {
      ...updated,
      config: normalizeOrgSharePolicy(updated.config as HqOrgSharePolicy),
    };
  }

  const row = await prisma.systemConfig.findUnique({ where: { key: HQ_CONFIG_KEYS.orgShare } });
  const config = normalizeOrgSharePolicy((row?.value as HqOrgSharePolicy | null) ?? null);
  const created = await prisma.feeTypeTemplate.create({
    data: {
      code: DEFAULT_FEE_TYPE_CODE,
      name: '기본',
      isDefault: true,
      sortOrder: 0,
      config,
    },
  });
  return { ...created, config };
}

export async function listFeeTypeTemplates() {
  await ensureDefaultFeeTypeTemplate();
  const rows = await prisma.feeTypeTemplate.findMany({ orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    isDefault: r.isDefault,
    sortOrder: r.sortOrder,
    config: normalizeOrgSharePolicy(r.config as HqOrgSharePolicy),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function createFeeTypeTemplate(input: {
  code: string;
  name: string;
  config?: HqOrgSharePolicy;
  isDefault?: boolean;
  sortOrder?: number;
}) {
  const code = input.code.trim().toUpperCase();
  if (!code || code === MANUAL_FEE_TYPE_CODE) {
    throw new AppError(400, 'Invalid fee type code', 'VALIDATION');
  }
  const name = input.name.trim();
  if (!name) throw new AppError(400, 'name required', 'VALIDATION');

  const base = input.config
    ? normalizeOrgSharePolicy(input.config)
    : (await ensureDefaultFeeTypeTemplate()).config;
  try {
    const { assertOperatingSharePolicy } = await import('../constants/hq-policy');
    assertOperatingSharePolicy(base);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'SHARE_MISMATCH';
    throw new AppError(400, msg, msg.startsWith('USDT') ? 'USDT_SHARE_MISMATCH' : 'ESCROW_SHARE_MISMATCH');
  }

  if (input.isDefault) {
    await prisma.feeTypeTemplate.updateMany({ data: { isDefault: false } });
  }

  const created = await prisma.feeTypeTemplate.create({
    data: {
      code,
      name,
      isDefault: !!input.isDefault,
      sortOrder: input.sortOrder ?? 0,
      config: base,
    },
  });
  if (created.isDefault) {
    await syncOrgShareConfigFromTemplate(base);
  }
  return {
    ...created,
    config: normalizeOrgSharePolicy(created.config as HqOrgSharePolicy),
  };
}

export async function updateFeeTypeTemplate(
  id: string,
  input: {
    name?: string;
    config?: HqOrgSharePolicy;
    isDefault?: boolean;
    sortOrder?: number;
  },
) {
  const existing = await prisma.feeTypeTemplate.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Fee type not found', 'NOT_FOUND');

  let config = normalizeOrgSharePolicy(existing.config as HqOrgSharePolicy);
  if (input.config) {
    config = normalizeOrgSharePolicy(input.config);
    try {
      const { assertOperatingSharePolicy } = await import('../constants/hq-policy');
      assertOperatingSharePolicy(config);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'SHARE_MISMATCH';
      throw new AppError(400, msg, msg.startsWith('USDT') ? 'USDT_SHARE_MISMATCH' : 'ESCROW_SHARE_MISMATCH');
    }
  }

  if (input.isDefault === true) {
    await prisma.feeTypeTemplate.updateMany({
      where: { id: { not: id } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.feeTypeTemplate.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() || existing.name } : {}),
      ...(input.config ? { config } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });

  const normalized = normalizeOrgSharePolicy(updated.config as HqOrgSharePolicy);
  if (updated.isDefault) {
    await syncOrgShareConfigFromTemplate(normalized);
  }
  return { ...updated, config: normalized };
}

export async function deleteFeeTypeTemplate(id: string) {
  const existing = await prisma.feeTypeTemplate.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Fee type not found', 'NOT_FOUND');
  if (existing.isDefault) {
    throw new AppError(400, 'Cannot delete default fee type', 'VALIDATION');
  }
  await prisma.feeTypeTemplate.delete({ where: { id } });
  return { ok: true };
}

async function syncOrgShareConfigFromTemplate(config: HqOrgSharePolicy) {
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.orgShare },
    create: {
      key: HQ_CONFIG_KEYS.orgShare,
      value: config,
      description: '단계별 수수료 배분 (기본 수수료 타입)',
    },
    update: { value: config },
  });
}

/** Load org share: prefer default FeeTypeTemplate, fallback SystemConfig. */
export async function loadEffectiveOrgSharePolicy(): Promise<HqOrgSharePolicy> {
  try {
    const tpl = await ensureDefaultFeeTypeTemplate();
    return tpl.config;
  } catch {
    const row = await prisma.systemConfig.findUnique({ where: { key: HQ_CONFIG_KEYS.orgShare } });
    return normalizeOrgSharePolicy((row?.value as HqOrgSharePolicy | null) ?? null);
  }
}

function mergeCustomerFeeShareFromSlice(
  base: CustomerFeeShare,
  ticketKind: FeeTicketKind,
  slice: { operatingPercent: number; operatingFixedUsdt: number; shares: HqOrgShareByType },
): CustomerFeeShare {
  if (ticketKind === 'TRADE_ESCROW') {
    return {
      ...base,
      escrowFeePercent: slice.operatingPercent,
      escrowPerTicketUsdt: slice.operatingFixedUsdt,
      TRADE_ESCROW: slice.shares,
    };
  }
  return {
    ...base,
    usdtOperatingFeePercent: slice.operatingPercent,
    usdtOperatingFeeUsdt: slice.operatingFixedUsdt,
    USDT_PURCHASE: slice.shares,
  };
}

export async function resolveCustomerFeeShare(options: {
  customerProfileId: string;
  feeShareRaw?: unknown;
  asOf?: Date;
}): Promise<CustomerFeeShare> {
  const policy = await loadEffectiveOrgSharePolicy();
  const base = normalizeCustomerFeeShare(null, policy);
  const asOf = options.asOf ?? new Date();
  const asOfDate = toDateOnly(asOf);

  let result = base;
  for (const ticketKind of ['USDT_PURCHASE', 'TRADE_ESCROW'] as FeeTicketKind[]) {
    const row = await prisma.customerFeePolicy.findFirst({
      where: {
        customerProfileId: options.customerProfileId,
        ticketKind,
        applyStartDate: { lte: asOfDate },
      },
      orderBy: [{ applyStartDate: 'desc' }, { createdAt: 'desc' }],
    });
    if (row) {
      const snap = snapshotFromPolicyRow(row);
      // Use correct fallback shares per ticket
      const shares = normalizeShares(
        snap.shares,
        ticketKind === 'TRADE_ESCROW' ? base.TRADE_ESCROW : base.USDT_PURCHASE,
      );
      result = mergeCustomerFeeShareFromSlice(result, ticketKind, {
        operatingPercent: snap.operatingPercent,
        operatingFixedUsdt: snap.operatingFixedUsdt,
        shares,
      });
      continue;
    }
    // Legacy feeShare fallback per ticket if no policy row
    if (options.feeShareRaw) {
      const legacy = normalizeCustomerFeeShare(options.feeShareRaw, policy);
      result = mergeCustomerFeeShareFromSlice(result, ticketKind, sliceFromCustomerShare(legacy, ticketKind));
    }
  }
  return result;
}

export async function resolveCustomerFeeShareByUserId(
  userId: string,
  asOf?: Date,
): Promise<CustomerFeeShare> {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: { id: true, feeShare: true },
  });
  if (!profile) {
    return normalizeCustomerFeeShare(null, await loadEffectiveOrgSharePolicy());
  }
  return resolveCustomerFeeShare({
    customerProfileId: profile.id,
    feeShareRaw: profile.feeShare,
    asOf,
  });
}

function templateSlice(
  config: HqOrgSharePolicy,
  ticketKind: FeeTicketKind,
): { operatingPercent: number; operatingFixedUsdt: number; shares: HqOrgShareByType; feeTypeName: string } {
  if (ticketKind === 'TRADE_ESCROW') {
    return {
      operatingPercent: config.escrowFeePercent,
      operatingFixedUsdt: config.escrowPerTicketUsdt,
      shares: config.TRADE_ESCROW,
      feeTypeName: '',
    };
  }
  return {
    operatingPercent: config.usdtOperatingFeePercent,
    operatingFixedUsdt: config.usdtOperatingFeeUsdt,
    shares: config.USDT_PURCHASE,
    feeTypeName: '',
  };
}

export async function seedCustomerFeePolicies(options: {
  customerProfileId: string;
  changedByUserId?: string | null;
  applyStartDate?: Date | string;
}): Promise<void> {
  const tpl = await ensureDefaultFeeTypeTemplate();
  const applyStartDate = toDateOnly(options.applyStartDate ?? new Date());
  for (const ticketKind of ['USDT_PURCHASE', 'TRADE_ESCROW'] as FeeTicketKind[]) {
    const existing = await prisma.customerFeePolicy.findFirst({
      where: { customerProfileId: options.customerProfileId, ticketKind },
    });
    if (existing) continue;
    const slice = templateSlice(tpl.config, ticketKind);
    assertTicketSlice(ticketKind, slice.operatingPercent, slice.operatingFixedUsdt, slice.shares);
    const created = await prisma.customerFeePolicy.create({
      data: {
        customerProfileId: options.customerProfileId,
        ticketKind,
        feeTypeCode: tpl.code,
        feeTypeName: tpl.name,
        operatingPercent: slice.operatingPercent,
        operatingFixedUsdt: slice.operatingFixedUsdt,
        shares: slice.shares,
        applyStartDate,
      },
    });
    await prisma.customerFeeHistory.create({
      data: {
        customerProfileId: options.customerProfileId,
        ticketKind,
        action: 'CREATE',
        feeTypeCode: tpl.code,
        applyStartDate,
        afterJson: snapshotFromPolicyRow(created) as unknown as Prisma.InputJsonValue,
        changedByUserId: options.changedByUserId ?? null,
      },
    });
  }
}

/** One-time migrate legacy feeShare JSON into CustomerFeePolicy MANUAL rows. */
export async function migrateLegacyFeeSharesIfNeeded(): Promise<number> {
  const profiles = await prisma.customerProfile.findMany({
    where: { feeShare: { not: Prisma.JsonNull } },
    select: { id: true, feeShare: true },
  });
  const policy = await loadEffectiveOrgSharePolicy();
  let count = 0;
  for (const p of profiles) {
    const hasAny = await prisma.customerFeePolicy.count({ where: { customerProfileId: p.id } });
    if (hasAny > 0) continue;
    const share = normalizeCustomerFeeShare(p.feeShare, policy);
    const applyStartDate = toDateOnly(new Date());
    for (const ticketKind of ['USDT_PURCHASE', 'TRADE_ESCROW'] as FeeTicketKind[]) {
      const slice = sliceFromCustomerShare(share, ticketKind);
      await prisma.customerFeePolicy.create({
        data: {
          customerProfileId: p.id,
          ticketKind,
          feeTypeCode: MANUAL_FEE_TYPE_CODE,
          feeTypeName: 'Manual',
          operatingPercent: slice.operatingPercent,
          operatingFixedUsdt: slice.operatingFixedUsdt,
          shares: slice.shares,
          applyStartDate,
        },
      });
      await prisma.customerFeeHistory.create({
        data: {
          customerProfileId: p.id,
          ticketKind,
          action: 'CREATE',
          feeTypeCode: MANUAL_FEE_TYPE_CODE,
          applyStartDate,
          afterJson: {
            feeTypeCode: MANUAL_FEE_TYPE_CODE,
            feeTypeName: 'Manual',
            operatingPercent: slice.operatingPercent,
            operatingFixedUsdt: slice.operatingFixedUsdt,
            shares: slice.shares,
            applyStartDate: dateOnlyIso(applyStartDate),
            migratedFrom: 'feeShare',
          },
        },
      });
    }
    count += 1;
  }
  return count;
}

export async function listCustomerFeeGrid(ticketKind: FeeTicketKind) {
  await ensureDefaultFeeTypeTemplate();
  await migrateLegacyFeeSharesIfNeeded();

  const profiles = await prisma.customerProfile.findMany({
    where: { user: { deletedAt: null } },
    select: {
      id: true,
      feeShare: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { user: { name: 'asc' } },
  });

  const asOf = toDateOnly(new Date());
  const types = await listFeeTypeTemplates();
  const rows = [];

  for (const p of profiles) {
    const policyRow = await prisma.customerFeePolicy.findFirst({
      where: {
        customerProfileId: p.id,
        ticketKind,
        applyStartDate: { lte: asOf },
      },
      orderBy: [{ applyStartDate: 'desc' }, { createdAt: 'desc' }],
    });

    let snap: CustomerFeePolicySnapshot | null = policyRow ? snapshotFromPolicyRow(policyRow) : null;
    if (!snap) {
      const share = await resolveCustomerFeeShare({
        customerProfileId: p.id,
        feeShareRaw: p.feeShare,
        asOf,
      });
      const slice = sliceFromCustomerShare(share, ticketKind);
      const def = types.find((t) => t.isDefault) ?? types[0];
      snap = {
        feeTypeCode: def?.code ?? DEFAULT_FEE_TYPE_CODE,
        feeTypeName: def?.name ?? '기본',
        operatingPercent: slice.operatingPercent,
        operatingFixedUsdt: slice.operatingFixedUsdt,
        shares: slice.shares,
        applyStartDate: dateOnlyIso(asOf),
      };
    } else {
      snap.shares = normalizeShares(
        snap.shares,
        ticketKind === 'TRADE_ESCROW'
          ? defaultOrgSharePolicy().TRADE_ESCROW
          : defaultOrgSharePolicy().USDT_PURCHASE,
      );
    }

    rows.push({
      customerProfileId: p.id,
      userId: p.user.id,
      customerName: p.user.name,
      customerEmail: p.user.email,
      policyId: policyRow?.id ?? null,
      feeTypeCode: snap.feeTypeCode,
      feeTypeName: snap.feeTypeName,
      operatingPercent: snap.operatingPercent,
      operatingFixedUsdt: snap.operatingFixedUsdt,
      shares: snap.shares,
      applyStartDate: snap.applyStartDate,
      totalPercent: snap.operatingPercent,
      totalFixedUsdt: snap.operatingFixedUsdt,
    });
  }

  return { ticketKind, feeTypes: types, rows };
}

function sharesEqual(a: HqOrgShareByType, b: HqOrgShareByType): boolean {
  for (const level of HQ_ORG_LEVELS) {
    if (num(a[level]?.poolPercent) !== num(b[level]?.poolPercent)) return false;
    if (num(a[level]?.perTicketUsdt) !== num(b[level]?.perTicketUsdt)) return false;
  }
  return true;
}

export async function saveCustomerFeePolicy(input: {
  customerProfileId: string;
  ticketKind: FeeTicketKind;
  feeTypeCode?: string;
  operatingPercent?: number;
  operatingFixedUsdt?: number;
  shares?: HqOrgShareByType;
  applyStartDate: string;
  changedByUserId?: string | null;
  forceManual?: boolean;
}) {
  const profile = await prisma.customerProfile.findUnique({
    where: { id: input.customerProfileId },
    select: { id: true },
  });
  if (!profile) throw new AppError(404, 'Customer not found', 'NOT_FOUND');

  const applyStartDate = toDateOnly(input.applyStartDate);
  const asOf = applyStartDate;
  const prev = await prisma.customerFeePolicy.findFirst({
    where: {
      customerProfileId: input.customerProfileId,
      ticketKind: input.ticketKind,
      applyStartDate: { lte: asOf },
    },
    orderBy: [{ applyStartDate: 'desc' }, { createdAt: 'desc' }],
  });
  const beforeSnap = prev ? snapshotFromPolicyRow(prev) : null;

  let feeTypeCode = (input.feeTypeCode ?? prev?.feeTypeCode ?? MANUAL_FEE_TYPE_CODE).trim();
  let feeTypeName = prev?.feeTypeName ?? null;
  let operatingPercent = input.operatingPercent ?? num(prev?.operatingPercent);
  let operatingFixedUsdt = input.operatingFixedUsdt ?? num(prev?.operatingFixedUsdt);
  let shares = normalizeShares(
    input.shares ?? prev?.shares,
    input.ticketKind === 'TRADE_ESCROW'
      ? defaultOrgSharePolicy().TRADE_ESCROW
      : defaultOrgSharePolicy().USDT_PURCHASE,
  );

  const typeChanged =
    input.feeTypeCode !== undefined &&
    input.feeTypeCode !== MANUAL_FEE_TYPE_CODE &&
    input.feeTypeCode !== prev?.feeTypeCode;

  // Selecting a template copies rates from template
  if (typeChanged || (input.feeTypeCode && input.feeTypeCode !== MANUAL_FEE_TYPE_CODE && !input.shares && input.operatingPercent === undefined)) {
    if (feeTypeCode !== MANUAL_FEE_TYPE_CODE) {
      const tpl = await prisma.feeTypeTemplate.findUnique({ where: { code: feeTypeCode } });
      if (!tpl) throw new AppError(400, 'Unknown fee type', 'VALIDATION');
      const config = normalizeOrgSharePolicy(tpl.config as HqOrgSharePolicy);
      const slice = templateSlice(config, input.ticketKind);
      operatingPercent = slice.operatingPercent;
      operatingFixedUsdt = slice.operatingFixedUsdt;
      shares = slice.shares;
      feeTypeName = tpl.name;
      feeTypeCode = tpl.code;
    }
  }

  // Value edits force Manual (unless only type assign with template copy)
  const valueEdited =
    input.operatingPercent !== undefined ||
    input.operatingFixedUsdt !== undefined ||
    input.shares !== undefined ||
    input.forceManual === true;

  if (valueEdited && feeTypeCode !== MANUAL_FEE_TYPE_CODE) {
    // If user also changed type in same request without editing values after copy, keep type.
    // But if they edit any rate field, switch to Manual.
    const tpl = await prisma.feeTypeTemplate.findUnique({ where: { code: feeTypeCode } });
    if (tpl) {
      const config = normalizeOrgSharePolicy(tpl.config as HqOrgSharePolicy);
      const slice = templateSlice(config, input.ticketKind);
      const diverged =
        num(operatingPercent) !== num(slice.operatingPercent) ||
        num(operatingFixedUsdt) !== num(slice.operatingFixedUsdt) ||
        !sharesEqual(shares, slice.shares);
      if (diverged || input.forceManual) {
        feeTypeCode = MANUAL_FEE_TYPE_CODE;
        feeTypeName = 'Manual';
      }
    }
  }

  if (feeTypeCode === MANUAL_FEE_TYPE_CODE) {
    feeTypeName = 'Manual';
  }

  assertTicketSlice(input.ticketKind, operatingPercent, operatingFixedUsdt, shares);

  // Upsert same applyStartDate row if exists, else create new versioned row
  const sameDate = prev && dateOnlyIso(prev.applyStartDate) === dateOnlyIso(applyStartDate);
  let saved;
  if (sameDate && prev) {
    saved = await prisma.customerFeePolicy.update({
      where: { id: prev.id },
      data: {
        feeTypeCode,
        feeTypeName,
        operatingPercent,
        operatingFixedUsdt,
        shares,
        applyStartDate,
      },
    });
  } else {
    saved = await prisma.customerFeePolicy.create({
      data: {
        customerProfileId: input.customerProfileId,
        ticketKind: input.ticketKind,
        feeTypeCode,
        feeTypeName,
        operatingPercent,
        operatingFixedUsdt,
        shares,
        applyStartDate,
      },
    });
  }

  const afterSnap = snapshotFromPolicyRow(saved);
  await prisma.customerFeeHistory.create({
    data: {
      customerProfileId: input.customerProfileId,
      ticketKind: input.ticketKind,
      action: beforeSnap ? (typeChanged && !valueEdited ? 'TYPE_ASSIGN' : 'UPDATE') : 'CREATE',
      feeTypeCode,
      applyStartDate,
      beforeJson: beforeSnap as unknown as Prisma.InputJsonValue,
      afterJson: afterSnap as unknown as Prisma.InputJsonValue,
      changedByUserId: input.changedByUserId ?? null,
    },
  });

  return afterSnap;
}

export async function deleteCustomerFeePolicy(input: {
  customerProfileId: string;
  ticketKind: FeeTicketKind;
  policyId?: string;
  changedByUserId?: string | null;
}) {
  const row = input.policyId
    ? await prisma.customerFeePolicy.findFirst({
        where: { id: input.policyId, customerProfileId: input.customerProfileId, ticketKind: input.ticketKind },
      })
    : await prisma.customerFeePolicy.findFirst({
        where: { customerProfileId: input.customerProfileId, ticketKind: input.ticketKind },
        orderBy: [{ applyStartDate: 'desc' }, { createdAt: 'desc' }],
      });

  if (!row) throw new AppError(404, 'Fee policy not found', 'NOT_FOUND');

  const beforeSnap = snapshotFromPolicyRow(row);
  await prisma.customerFeePolicy.delete({ where: { id: row.id } });
  await prisma.customerFeeHistory.create({
    data: {
      customerProfileId: input.customerProfileId,
      ticketKind: input.ticketKind,
      action: 'DELETE',
      feeTypeCode: row.feeTypeCode,
      applyStartDate: row.applyStartDate,
      beforeJson: beforeSnap as unknown as Prisma.InputJsonValue,
      changedByUserId: input.changedByUserId ?? null,
    },
  });

  // Re-seed default if no policies left for this ticket
  const remaining = await prisma.customerFeePolicy.count({
    where: { customerProfileId: input.customerProfileId, ticketKind: input.ticketKind },
  });
  if (remaining === 0) {
    const tpl = await ensureDefaultFeeTypeTemplate();
    const slice = templateSlice(tpl.config, input.ticketKind);
    const applyStartDate = toDateOnly(new Date());
    const created = await prisma.customerFeePolicy.create({
      data: {
        customerProfileId: input.customerProfileId,
        ticketKind: input.ticketKind,
        feeTypeCode: tpl.code,
        feeTypeName: tpl.name,
        operatingPercent: slice.operatingPercent,
        operatingFixedUsdt: slice.operatingFixedUsdt,
        shares: slice.shares,
        applyStartDate,
      },
    });
    await prisma.customerFeeHistory.create({
      data: {
        customerProfileId: input.customerProfileId,
        ticketKind: input.ticketKind,
        action: 'CREATE',
        feeTypeCode: tpl.code,
        applyStartDate,
        afterJson: snapshotFromPolicyRow(created) as unknown as Prisma.InputJsonValue,
        changedByUserId: input.changedByUserId ?? null,
      },
    });
  }

  return { ok: true };
}

export async function listCustomerFeeHistory(options: {
  customerProfileId: string;
  ticketKind?: FeeTicketKind;
  limit?: number;
}) {
  const rows = await prisma.customerFeeHistory.findMany({
    where: {
      customerProfileId: options.customerProfileId,
      ...(options.ticketKind ? { ticketKind: options.ticketKind } : {}),
    },
    include: {
      changedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit ?? 200,
  });
  return rows.map((r) => ({
    id: r.id,
    ticketKind: r.ticketKind,
    action: r.action,
    feeTypeCode: r.feeTypeCode,
    applyStartDate: r.applyStartDate ? dateOnlyIso(r.applyStartDate) : null,
    beforeJson: r.beforeJson,
    afterJson: r.afterJson,
    changedBy: r.changedBy,
    createdAt: r.createdAt,
  }));
}

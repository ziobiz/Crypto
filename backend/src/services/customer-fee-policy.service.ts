import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import {
  assertEscrowShareTotals,
  defaultOrgSharePolicy,
  HQ_CONFIG_KEYS,
  HQ_ORG_LEVELS,
  normalizeCustomerFeeShare,
  normalizeOrgSharePolicy,
  sumOrgShareTable,
  syncEscrowPoolFromShares,
  type CustomerFeeShare,
  type HqOrgShareByType,
  type HqOrgSharePolicy,
} from '../constants/hq-policy';

export const FEE_TYPE_MANUAL = 'MANUAL';
export type FeeTicketKind = 'USDT_PURCHASE' | 'TRADE_ESCROW';

export type FeeTypeTemplateDto = {
  id: string;
  ticketKind: FeeTicketKind;
  code: string;
  name: string;
  isDefault: boolean;
  sortOrder: number;
  config: HqOrgSharePolicy;
};

export type CustomerFeePolicySnapshot = {
  id?: string;
  customerProfileId: string;
  ticketKind: FeeTicketKind;
  feeTypeCode: string;
  feeTypeName: string | null;
  operatingPercent: number;
  operatingFixedUsdt: number;
  shares: HqOrgShareByType;
  applyStartDate: string;
};

function mapFeeTypeRow(row: {
  id: string;
  ticketKind: string;
  code: string;
  name: string;
  isDefault: boolean;
  sortOrder: number;
  config: unknown;
}): FeeTypeTemplateDto {
  return {
    id: row.id,
    ticketKind: (row.ticketKind === 'TRADE_ESCROW' ? 'TRADE_ESCROW' : 'USDT_PURCHASE') as FeeTicketKind,
    code: row.code,
    name: row.name,
    isDefault: row.isDefault,
    sortOrder: row.sortOrder,
    config: normalizeOrgSharePolicy(row.config as HqOrgSharePolicy),
  };
}

async function mergeKindIntoOrgShare(kind: FeeTicketKind, config: HqOrgSharePolicy): Promise<void> {
  const normalized = syncEscrowPoolFromShares(normalizeOrgSharePolicy(config));
  const row = await prisma.systemConfig.findUnique({ where: { key: HQ_CONFIG_KEYS.orgShare } });
  const current = normalizeOrgSharePolicy((row?.value as HqOrgSharePolicy | null) ?? null);
  const merged: HqOrgSharePolicy =
    kind === 'USDT_PURCHASE'
      ? { ...current, USDT_PURCHASE: normalized.USDT_PURCHASE }
      : {
          ...current,
          TRADE_ESCROW: normalized.TRADE_ESCROW,
          escrowFeePercent: normalized.escrowFeePercent,
          escrowPerTicketUsdt: normalized.escrowPerTicketUsdt,
        };
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.orgShare },
    create: { key: HQ_CONFIG_KEYS.orgShare, value: merged, description: '단계별 수수료 배분' },
    update: { value: merged },
  });
}

function todayDateOnly(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function toDateOnly(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  }
  const s = String(input).trim().slice(0, 10);
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) throw new AppError(400, 'Invalid applyStartDate', 'INVALID_APPLY_START');
  return new Date(Date.UTC(y, m - 1, d));
}

function dateToIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function policyFromTemplateConfig(
  config: HqOrgSharePolicy,
  ticketKind: FeeTicketKind,
  feeTypeCode: string,
  feeTypeName: string | null,
  customerProfileId: string,
  applyStartDate: Date,
): CustomerFeePolicySnapshot {
  const normalized = normalizeOrgSharePolicy(config);
  if (ticketKind === 'USDT_PURCHASE') {
    const totals = sumOrgShareTable(normalized.USDT_PURCHASE);
    return {
      customerProfileId,
      ticketKind,
      feeTypeCode,
      feeTypeName,
      operatingPercent: totals.poolPercent,
      operatingFixedUsdt: totals.perTicketUsdt,
      shares: { ...normalized.USDT_PURCHASE },
      applyStartDate: dateToIso(applyStartDate),
    };
  }
  return {
    customerProfileId,
    ticketKind,
    feeTypeCode,
    feeTypeName,
    operatingPercent: normalized.escrowFeePercent,
    operatingFixedUsdt: normalized.escrowPerTicketUsdt,
    shares: { ...normalized.TRADE_ESCROW },
    applyStartDate: dateToIso(applyStartDate),
  };
}

function snapshotToCustomerFeeShare(
  usdt: CustomerFeePolicySnapshot | null,
  escrow: CustomerFeePolicySnapshot | null,
  fallback: HqOrgSharePolicy,
): CustomerFeeShare {
  const base = normalizeCustomerFeeShare(null, fallback);
  return {
    escrowFeePercent: escrow?.operatingPercent ?? base.escrowFeePercent,
    escrowPerTicketUsdt: escrow?.operatingFixedUsdt ?? base.escrowPerTicketUsdt,
    USDT_PURCHASE: usdt?.shares ?? base.USDT_PURCHASE,
    TRADE_ESCROW: escrow?.shares ?? base.TRADE_ESCROW,
  };
}

function assertTicketKindShares(snap: CustomerFeePolicySnapshot): void {
  if (snap.ticketKind === 'TRADE_ESCROW') {
    assertEscrowShareTotals({
      escrowFeePercent: snap.operatingPercent,
      escrowPerTicketUsdt: snap.operatingFixedUsdt,
      TRADE_ESCROW: snap.shares,
    });
  }
}

function rowToSnapshot(row: {
  id: string;
  customerProfileId: string;
  ticketKind: string;
  feeTypeCode: string;
  feeTypeName: string | null;
  operatingPercent: Prisma.Decimal | number;
  operatingFixedUsdt: Prisma.Decimal | number;
  shares: unknown;
  applyStartDate: Date;
}): CustomerFeePolicySnapshot {
  const sharesRaw = (row.shares ?? {}) as HqOrgShareByType;
  const shares = { ...defaultOrgSharePolicy().USDT_PURCHASE };
  for (const level of HQ_ORG_LEVELS) {
    shares[level] = {
      poolPercent: Number(sharesRaw[level]?.poolPercent) || 0,
      perTicketUsdt: Number(sharesRaw[level]?.perTicketUsdt) || 0,
    };
  }
  return {
    id: row.id,
    customerProfileId: row.customerProfileId,
    ticketKind: row.ticketKind as FeeTicketKind,
    feeTypeCode: row.feeTypeCode,
    feeTypeName: row.feeTypeName,
    operatingPercent: Number(row.operatingPercent) || 0,
    operatingFixedUsdt: Number(row.operatingFixedUsdt) || 0,
    shares,
    applyStartDate: dateToIso(row.applyStartDate),
  };
}

function sharesEqual(a: HqOrgShareByType, b: HqOrgShareByType): boolean {
  for (const level of HQ_ORG_LEVELS) {
    if (Number(a[level]?.poolPercent) !== Number(b[level]?.poolPercent)) return false;
    if (Number(a[level]?.perTicketUsdt) !== Number(b[level]?.perTicketUsdt)) return false;
  }
  return true;
}

export const customerFeePolicyService = {
  async ensureFeeTypeTemplatesSeeded(): Promise<void> {
    const count = await prisma.feeTypeTemplate.count();
    if (count > 0) {
      // 마이그레이션 후 종류별 기본이 없으면 보완
      for (const ticketKind of ['USDT_PURCHASE', 'TRADE_ESCROW'] as FeeTicketKind[]) {
        const kindCount = await prisma.feeTypeTemplate.count({ where: { ticketKind } });
        if (kindCount > 0) continue;
        const row = await prisma.systemConfig.findUnique({ where: { key: HQ_CONFIG_KEYS.orgShare } });
        const config = normalizeOrgSharePolicy((row?.value as HqOrgSharePolicy | null) ?? null);
        await prisma.feeTypeTemplate.create({
          data: {
            ticketKind,
            code: 'DEFAULT',
            name: '기본 수수료',
            isDefault: true,
            sortOrder: 0,
            config,
          },
        });
      }
      return;
    }
    const row = await prisma.systemConfig.findUnique({ where: { key: HQ_CONFIG_KEYS.orgShare } });
    const config = normalizeOrgSharePolicy((row?.value as HqOrgSharePolicy | null) ?? null);
    for (const ticketKind of ['USDT_PURCHASE', 'TRADE_ESCROW'] as FeeTicketKind[]) {
      await prisma.feeTypeTemplate.create({
        data: {
          ticketKind,
          code: 'DEFAULT',
          name: '기본 수수료',
          isDefault: true,
          sortOrder: 0,
          config,
        },
      });
    }
  },

  async listFeeTypes(ticketKind?: FeeTicketKind): Promise<FeeTypeTemplateDto[]> {
    await this.ensureFeeTypeTemplatesSeeded();
    const rows = await prisma.feeTypeTemplate.findMany({
      where: ticketKind ? { ticketKind } : undefined,
      orderBy: [{ ticketKind: 'asc' }, { sortOrder: 'asc' }, { code: 'asc' }],
    });
    return rows.map(mapFeeTypeRow);
  },

  async getDefaultFeeType(ticketKind: FeeTicketKind = 'USDT_PURCHASE'): Promise<FeeTypeTemplateDto> {
    const list = await this.listFeeTypes(ticketKind);
    return list.find((t) => t.isDefault) ?? list[0]!;
  },

  async getMergedDefaultConfig(): Promise<HqOrgSharePolicy> {
    const usdt = await this.getDefaultFeeType('USDT_PURCHASE');
    const trade = await this.getDefaultFeeType('TRADE_ESCROW');
    return {
      ...usdt.config,
      USDT_PURCHASE: usdt.config.USDT_PURCHASE,
      TRADE_ESCROW: trade.config.TRADE_ESCROW,
      escrowFeePercent: trade.config.escrowFeePercent,
      escrowPerTicketUsdt: trade.config.escrowPerTicketUsdt,
    };
  },

  async getFeeTypeByCode(code: string, ticketKind: FeeTicketKind): Promise<FeeTypeTemplateDto | null> {
    await this.ensureFeeTypeTemplatesSeeded();
    if (code === FEE_TYPE_MANUAL) return null;
    const row = await prisma.feeTypeTemplate.findUnique({
      where: { ticketKind_code: { ticketKind, code } },
    });
    if (!row) return null;
    return mapFeeTypeRow(row);
  },

  async createFeeType(input: {
    code: string;
    name: string;
    ticketKind: FeeTicketKind;
    config?: HqOrgSharePolicy;
    isDefault?: boolean;
  }): Promise<FeeTypeTemplateDto[]> {
    await this.ensureFeeTypeTemplatesSeeded();
    const ticketKind = input.ticketKind === 'TRADE_ESCROW' ? 'TRADE_ESCROW' : 'USDT_PURCHASE';
    const code = String(input.code || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
    if (!code || code === FEE_TYPE_MANUAL) {
      throw new AppError(400, 'Invalid fee type code', 'INVALID_FEE_TYPE_CODE');
    }
    const name = String(input.name || '').trim() || code;
    const base = input.config ?? (await this.getDefaultFeeType(ticketKind)).config;
    const config = syncEscrowPoolFromShares(normalizeOrgSharePolicy(base));
    try {
      assertEscrowShareTotals(config);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'SHARE_MISMATCH';
      throw new AppError(400, msg, 'ESCROW_SHARE_MISMATCH');
    }
    const dup = await prisma.feeTypeTemplate.findUnique({
      where: { ticketKind_code: { ticketKind, code } },
    });
    if (dup) {
      throw new AppError(400, 'Fee type code already exists for this kind', 'FEE_TYPE_CODE_EXISTS');
    }
    const maxSort = await prisma.feeTypeTemplate.aggregate({
      where: { ticketKind },
      _max: { sortOrder: true },
    });
    await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.feeTypeTemplate.updateMany({
          where: { ticketKind },
          data: { isDefault: false },
        });
      }
      await tx.feeTypeTemplate.create({
        data: {
          ticketKind,
          code,
          name,
          isDefault: !!input.isDefault,
          sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
          config,
        },
      });
    });
    if (input.isDefault) {
      await mergeKindIntoOrgShare(ticketKind, config);
    }
    return this.listFeeTypes();
  },

  async updateFeeType(
    id: string,
    input: { name?: string; config?: HqOrgSharePolicy; isDefault?: boolean; sortOrder?: number },
  ): Promise<FeeTypeTemplateDto[]> {
    await this.ensureFeeTypeTemplatesSeeded();
    const existing = await prisma.feeTypeTemplate.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Fee type not found', 'FEE_TYPE_NOT_FOUND');
    const ticketKind = (existing.ticketKind === 'TRADE_ESCROW' ? 'TRADE_ESCROW' : 'USDT_PURCHASE') as FeeTicketKind;
    const config = input.config
      ? syncEscrowPoolFromShares(normalizeOrgSharePolicy(input.config))
      : normalizeOrgSharePolicy(existing.config as HqOrgSharePolicy);
    if (input.config) {
      try {
        assertEscrowShareTotals(config);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'SHARE_MISMATCH';
        throw new AppError(400, msg, 'ESCROW_SHARE_MISMATCH');
      }
    }
    await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.feeTypeTemplate.updateMany({
          where: { ticketKind },
          data: { isDefault: false },
        });
      }
      await tx.feeTypeTemplate.update({
        where: { id },
        data: {
          ...(input.name != null ? { name: String(input.name).trim() || existing.name } : {}),
          ...(input.config ? { config } : {}),
          ...(input.isDefault != null ? { isDefault: input.isDefault } : {}),
          ...(input.sortOrder != null ? { sortOrder: input.sortOrder } : {}),
        },
      });
    });
    const after = await prisma.feeTypeTemplate.findUnique({ where: { id } });
    if (after?.isDefault) {
      await mergeKindIntoOrgShare(ticketKind, normalizeOrgSharePolicy(after.config as HqOrgSharePolicy));
    }
    return this.listFeeTypes();
  },

  async deleteFeeType(id: string): Promise<FeeTypeTemplateDto[]> {
    await this.ensureFeeTypeTemplatesSeeded();
    const existing = await prisma.feeTypeTemplate.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Fee type not found', 'FEE_TYPE_NOT_FOUND');
    if (existing.isDefault) {
      throw new AppError(400, 'Cannot delete default fee type', 'CANNOT_DELETE_DEFAULT_FEE_TYPE');
    }
    const kindCount = await prisma.feeTypeTemplate.count({ where: { ticketKind: existing.ticketKind } });
    if (kindCount <= 1) {
      throw new AppError(400, 'At least one fee type is required per kind', 'FEE_TYPE_REQUIRED');
    }
    await prisma.feeTypeTemplate.delete({ where: { id } });
    return this.listFeeTypes();
  },

  async syncDefaultFromOrgShare(policy: HqOrgSharePolicy): Promise<void> {
    await this.ensureFeeTypeTemplatesSeeded();
    const normalized = syncEscrowPoolFromShares(normalizeOrgSharePolicy(policy));
    for (const ticketKind of ['USDT_PURCHASE', 'TRADE_ESCROW'] as FeeTicketKind[]) {
      const def = await prisma.feeTypeTemplate.findFirst({
        where: { ticketKind, isDefault: true },
      });
      if (def) {
        await prisma.feeTypeTemplate.update({ where: { id: def.id }, data: { config: normalized } });
      } else {
        await prisma.feeTypeTemplate.create({
          data: {
            ticketKind,
            code: 'DEFAULT',
            name: '기본 수수료',
            isDefault: true,
            sortOrder: 0,
            config: normalized,
          },
        });
      }
    }
  },

  async migrateLegacyFeeShares(): Promise<void> {
    await this.ensureFeeTypeTemplatesSeeded();
    const profiles = await prisma.customerProfile.findMany({
      where: { feeShare: { not: Prisma.JsonNull } },
      select: { id: true, feeShare: true },
    });
    if (!profiles.length) return;
    const fallback = await this.getMergedDefaultConfig();
    const applyStart = todayDateOnly();
    for (const p of profiles) {
      const existing = await prisma.customerFeePolicy.count({ where: { customerProfileId: p.id } });
      if (existing > 0) continue;
      const share = normalizeCustomerFeeShare(p.feeShare, fallback);
      for (const ticketKind of ['USDT_PURCHASE', 'TRADE_ESCROW'] as FeeTicketKind[]) {
        const snap = policyFromTemplateConfig(share, ticketKind, FEE_TYPE_MANUAL, 'Manual', p.id, applyStart);
        await prisma.customerFeePolicy.create({
          data: {
            customerProfileId: p.id,
            ticketKind,
            feeTypeCode: FEE_TYPE_MANUAL,
            feeTypeName: 'Manual',
            operatingPercent: snap.operatingPercent,
            operatingFixedUsdt: snap.operatingFixedUsdt,
            shares: snap.shares,
            applyStartDate: applyStart,
          },
        });
        await prisma.customerFeeHistory.create({
          data: {
            customerProfileId: p.id,
            ticketKind,
            action: 'CREATE',
            feeTypeCode: FEE_TYPE_MANUAL,
            applyStartDate: applyStart,
            afterJson: snap as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }
  },

  async seedDefaultPoliciesForCustomer(
    customerProfileId: string,
    changedByUserId?: string | null,
    typeCodes?: { usdtFeeTypeCode?: string | null; tradeFeeTypeCode?: string | null },
  ): Promise<void> {
    await this.ensureFeeTypeTemplatesSeeded();
    const applyStart = todayDateOnly();
    const picks: { ticketKind: FeeTicketKind; requested?: string | null }[] = [
      { ticketKind: 'USDT_PURCHASE', requested: typeCodes?.usdtFeeTypeCode },
      { ticketKind: 'TRADE_ESCROW', requested: typeCodes?.tradeFeeTypeCode },
    ];
    for (const { ticketKind, requested } of picks) {
      const count = await prisma.customerFeePolicy.count({
        where: { customerProfileId, ticketKind },
      });
      if (count > 0) continue;
      const code = requested?.trim();
      const def = await this.getDefaultFeeType(ticketKind);
      const tpl = (code ? await this.getFeeTypeByCode(code, ticketKind) : null) ?? def;
      const snap = policyFromTemplateConfig(
        tpl.config,
        ticketKind,
        tpl.code,
        tpl.name,
        customerProfileId,
        applyStart,
      );
      await prisma.customerFeePolicy.create({
        data: {
          customerProfileId,
          ticketKind,
          feeTypeCode: tpl.code,
          feeTypeName: tpl.name,
          operatingPercent: snap.operatingPercent,
          operatingFixedUsdt: snap.operatingFixedUsdt,
          shares: snap.shares,
          applyStartDate: applyStart,
        },
      });
      await prisma.customerFeeHistory.create({
        data: {
          customerProfileId,
          ticketKind,
          action: 'CREATE',
          feeTypeCode: tpl.code,
          applyStartDate: applyStart,
          afterJson: snap as unknown as Prisma.InputJsonValue,
          changedByUserId: changedByUserId ?? null,
        },
      });
    }
  },

  async findEffectivePolicy(
    customerProfileId: string,
    ticketKind: FeeTicketKind,
    asOf: Date = new Date(),
  ): Promise<CustomerFeePolicySnapshot | null> {
    const asOfDay = toDateOnly(asOf);
    const row = await prisma.customerFeePolicy.findFirst({
      where: {
        customerProfileId,
        ticketKind,
        applyStartDate: { lte: asOfDay },
      },
      orderBy: [{ applyStartDate: 'desc' }, { createdAt: 'desc' }],
    });
    return row ? rowToSnapshot(row) : null;
  },

  async resolveCustomerFeeShare(opts: {
    customerProfileId?: string | null;
    feeShareRaw?: unknown;
    asOf?: Date;
  }): Promise<{ share: CustomerFeeShare; source: 'policy' | 'legacy' | 'default'; policy?: HqOrgSharePolicy }> {
    await this.ensureFeeTypeTemplatesSeeded();
    const fallback = await this.getMergedDefaultConfig();

    if (opts.customerProfileId) {
      const asOf = opts.asOf ?? new Date();
      const usdt = await this.findEffectivePolicy(opts.customerProfileId, 'USDT_PURCHASE', asOf);
      const escrow = await this.findEffectivePolicy(opts.customerProfileId, 'TRADE_ESCROW', asOf);
      if (usdt || escrow) {
        return {
          share: snapshotToCustomerFeeShare(usdt, escrow, fallback),
          source: 'policy',
          policy: fallback,
        };
      }

      const profile = await prisma.customerProfile.findUnique({
        where: { id: opts.customerProfileId },
        select: { feeShare: true },
      });
      if (profile?.feeShare) {
        return {
          share: normalizeCustomerFeeShare(profile.feeShare, fallback),
          source: 'legacy',
          policy: fallback,
        };
      }
    }

    if (opts.feeShareRaw) {
      return {
        share: normalizeCustomerFeeShare(opts.feeShareRaw, fallback),
        source: 'legacy',
        policy: fallback,
      };
    }

    return {
      share: normalizeCustomerFeeShare(null, fallback),
      source: 'default',
      policy: fallback,
    };
  },

  async listGrid(ticketKind: FeeTicketKind) {
    await this.migrateLegacyFeeShares();
    const profiles = await prisma.customerProfile.findMany({
      where: { user: { deletedAt: null } },
      select: {
        id: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { user: { name: 'asc' } },
      take: 2000,
    });
    const types = await this.listFeeTypes(ticketKind);
    const def = types.find((t) => t.isDefault) ?? types[0]!;
    const rows = [];
    for (const p of profiles) {
      let effective = await this.findEffectivePolicy(p.id, ticketKind);
      if (!effective) {
        effective = policyFromTemplateConfig(
          def.config,
          ticketKind,
          def.code,
          def.name,
          p.id,
          todayDateOnly(),
        );
      }
      rows.push({
        id: effective.id,
        customerProfileId: p.id,
        userId: p.user.id,
        customerName: p.user.name,
        customerEmail: p.user.email,
        ticketKind: effective.ticketKind,
        feeTypeCode: effective.feeTypeCode,
        feeTypeName: effective.feeTypeName,
        operatingPercent: effective.operatingPercent,
        operatingFixedUsdt: effective.operatingFixedUsdt,
        shares: effective.shares,
        applyStartDate: effective.applyStartDate,
        levels: HQ_ORG_LEVELS.map((level) => ({
          level,
          poolPercent: effective!.shares[level]?.poolPercent ?? 0,
          perTicketUsdt: effective!.shares[level]?.perTicketUsdt ?? 0,
        })),
        totalPercent: effective.operatingPercent,
        totalFixedUsdt: effective.operatingFixedUsdt,
      });
    }
    return { ticketKind, feeTypes: types, rows };
  },

  async savePolicy(input: {
    customerProfileId: string;
    ticketKind: FeeTicketKind;
    feeTypeCode?: string;
    operatingPercent?: number;
    operatingFixedUsdt?: number;
    shares?: HqOrgShareByType;
    applyStartDate: string;
    changedByUserId?: string | null;
    assignTypeOnly?: boolean;
  }) {
    await this.ensureFeeTypeTemplatesSeeded();
    const profile = await prisma.customerProfile.findUnique({
      where: { id: input.customerProfileId },
      select: { id: true },
    });
    if (!profile) throw new AppError(404, 'Customer not found', 'CUSTOMER_NOT_FOUND');

    const applyStart = toDateOnly(input.applyStartDate);
    const before = await this.findEffectivePolicy(input.customerProfileId, input.ticketKind, applyStart);

    let feeTypeCode = (input.feeTypeCode || before?.feeTypeCode || FEE_TYPE_MANUAL).trim();
    let feeTypeName: string | null = before?.feeTypeName ?? null;
    let operatingPercent = input.operatingPercent ?? before?.operatingPercent ?? 0;
    let operatingFixedUsdt = input.operatingFixedUsdt ?? before?.operatingFixedUsdt ?? 0;
    let shares = input.shares ?? before?.shares ?? defaultOrgSharePolicy().USDT_PURCHASE;

    const template =
      feeTypeCode !== FEE_TYPE_MANUAL
        ? await this.getFeeTypeByCode(feeTypeCode, input.ticketKind)
        : null;

    if (input.assignTypeOnly && template) {
      const snap = policyFromTemplateConfig(
        template.config,
        input.ticketKind,
        template.code,
        template.name,
        input.customerProfileId,
        applyStart,
      );
      feeTypeCode = snap.feeTypeCode;
      feeTypeName = snap.feeTypeName;
      operatingPercent = snap.operatingPercent;
      operatingFixedUsdt = snap.operatingFixedUsdt;
      shares = snap.shares;
    } else if (template) {
      const typedSnap = policyFromTemplateConfig(
        template.config,
        input.ticketKind,
        template.code,
        template.name,
        input.customerProfileId,
        applyStart,
      );
      if (
        Number(operatingPercent) !== Number(typedSnap.operatingPercent) ||
        Number(operatingFixedUsdt) !== Number(typedSnap.operatingFixedUsdt) ||
        !sharesEqual(shares, typedSnap.shares)
      ) {
        feeTypeCode = FEE_TYPE_MANUAL;
        feeTypeName = 'Manual';
      } else {
        feeTypeName = template.name;
      }
    } else {
      feeTypeCode = FEE_TYPE_MANUAL;
      feeTypeName = 'Manual';
    }

    const totals = sumOrgShareTable(shares);
    operatingPercent = totals.poolPercent;
    operatingFixedUsdt = totals.perTicketUsdt;

    const after: CustomerFeePolicySnapshot = {
      customerProfileId: input.customerProfileId,
      ticketKind: input.ticketKind,
      feeTypeCode,
      feeTypeName,
      operatingPercent: Number(operatingPercent) || 0,
      operatingFixedUsdt: Number(operatingFixedUsdt) || 0,
      shares,
      applyStartDate: dateToIso(applyStart),
    };

    try {
      assertTicketKindShares(after);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'SHARE_MISMATCH';
      throw new AppError(400, msg, 'ESCROW_SHARE_MISMATCH');
    }

    const sameDate = await prisma.customerFeePolicy.findFirst({
      where: {
        customerProfileId: input.customerProfileId,
        ticketKind: input.ticketKind,
        applyStartDate: applyStart,
      },
      orderBy: { createdAt: 'desc' },
    });

    let savedId: string;
    if (sameDate) {
      const updated = await prisma.customerFeePolicy.update({
        where: { id: sameDate.id },
        data: {
          feeTypeCode: after.feeTypeCode,
          feeTypeName: after.feeTypeName,
          operatingPercent: after.operatingPercent,
          operatingFixedUsdt: after.operatingFixedUsdt,
          shares: after.shares,
        },
      });
      savedId = updated.id;
    } else {
      const created = await prisma.customerFeePolicy.create({
        data: {
          customerProfileId: input.customerProfileId,
          ticketKind: input.ticketKind,
          feeTypeCode: after.feeTypeCode,
          feeTypeName: after.feeTypeName,
          operatingPercent: after.operatingPercent,
          operatingFixedUsdt: after.operatingFixedUsdt,
          shares: after.shares,
          applyStartDate: applyStart,
        },
      });
      savedId = created.id;
    }

    const action =
      !before ? 'CREATE' : before.feeTypeCode !== after.feeTypeCode ? 'TYPE_ASSIGN' : 'UPDATE';
    await prisma.customerFeeHistory.create({
      data: {
        customerProfileId: input.customerProfileId,
        ticketKind: input.ticketKind,
        action,
        feeTypeCode: after.feeTypeCode,
        applyStartDate: applyStart,
        beforeJson: before ? (before as unknown as Prisma.InputJsonValue) : undefined,
        afterJson: after as unknown as Prisma.InputJsonValue,
        changedByUserId: input.changedByUserId ?? null,
      },
    });

    return { ...after, id: savedId };
  },

  async deletePolicy(input: {
    customerProfileId: string;
    ticketKind: FeeTicketKind;
    policyId?: string;
    changedByUserId?: string | null;
  }) {
    const before = input.policyId
      ? await prisma.customerFeePolicy.findUnique({ where: { id: input.policyId } })
      : await prisma.customerFeePolicy.findFirst({
          where: {
            customerProfileId: input.customerProfileId,
            ticketKind: input.ticketKind,
          },
          orderBy: [{ applyStartDate: 'desc' }, { createdAt: 'desc' }],
        });
    if (!before || before.customerProfileId !== input.customerProfileId) {
      throw new AppError(404, 'Fee policy not found', 'FEE_POLICY_NOT_FOUND');
    }
    const beforeSnap = rowToSnapshot(before);
    await prisma.customerFeePolicy.delete({ where: { id: before.id } });
    await prisma.customerFeeHistory.create({
      data: {
        customerProfileId: input.customerProfileId,
        ticketKind: input.ticketKind,
        action: 'DELETE',
        feeTypeCode: beforeSnap.feeTypeCode,
        applyStartDate: before.applyStartDate,
        beforeJson: beforeSnap as unknown as Prisma.InputJsonValue,
        changedByUserId: input.changedByUserId ?? null,
      },
    });
    const remaining = await prisma.customerFeePolicy.count({
      where: { customerProfileId: input.customerProfileId, ticketKind: input.ticketKind },
    });
    if (remaining === 0) {
      await this.seedDefaultPoliciesForCustomer(input.customerProfileId, input.changedByUserId);
    }
    return { ok: true };
  },

  async listHistory(customerProfileId: string, ticketKind: FeeTicketKind, take = 200) {
    const rows = await prisma.customerFeeHistory.findMany({
      where: { customerProfileId, ticketKind },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        changedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      ticketKind: r.ticketKind,
      action: r.action,
      feeTypeCode: r.feeTypeCode,
      applyStartDate: r.applyStartDate ? dateToIso(r.applyStartDate) : null,
      beforeJson: r.beforeJson,
      afterJson: r.afterJson,
      changedBy: r.changedBy,
      createdAt: r.createdAt.toISOString(),
    }));
  },
};

import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import {
  DEFAULT_DELETION_POLICY,
  HQ_CONFIG_KEYS,
  type HqDeletionPolicy,
} from '../constants/hq-policy';
import { purgeExpiredSimulatorRuns } from './simulator-log.service';

export function addMonths(from: Date, months: number): Date {
  const next = new Date(from);
  next.setMonth(next.getMonth() + months);
  return next;
}

function clampMonths(n: number): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 1) return 1;
  if (v > 36) return 36;
  return v;
}

export async function getDeletionPolicy(): Promise<HqDeletionPolicy> {
  const row = await prisma.systemConfig.findUnique({ where: { key: HQ_CONFIG_KEYS.deletion } });
  const raw = (row?.value ?? {}) as Partial<HqDeletionPolicy>;
  return {
    userRetentionMonths: clampMonths(raw.userRetentionMonths ?? DEFAULT_DELETION_POLICY.userRetentionMonths),
    orgRetentionMonths: clampMonths(raw.orgRetentionMonths ?? DEFAULT_DELETION_POLICY.orgRetentionMonths),
  };
}

export async function saveDeletionPolicy(input: HqDeletionPolicy): Promise<HqDeletionPolicy> {
  const policy: HqDeletionPolicy = {
    userRetentionMonths: clampMonths(input.userRetentionMonths),
    orgRetentionMonths: clampMonths(input.orgRetentionMonths),
  };
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.deletion },
    create: {
      key: HQ_CONFIG_KEYS.deletion,
      value: policy as object,
      description: '삭제 후 자동 완전삭제 보관 기간(개월)',
    },
    update: { value: policy as object },
  });
  await recomputePurgeDates(policy);
  return policy;
}

export async function recomputePurgeDates(policy?: HqDeletionPolicy): Promise<void> {
  const p = policy ?? (await getDeletionPolicy());
  const deletedUsers = await prisma.user.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, deletedAt: true },
  });
  for (const u of deletedUsers) {
    if (!u.deletedAt) continue;
    await prisma.user.update({
      where: { id: u.id },
      data: { purgeAt: addMonths(u.deletedAt, p.userRetentionMonths) },
    });
  }
  const deletedOrgs = await prisma.organization.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, deletedAt: true },
  });
  for (const o of deletedOrgs) {
    if (!o.deletedAt) continue;
    await prisma.organization.update({
      where: { id: o.id },
      data: { purgeAt: addMonths(o.deletedAt, p.orgRetentionMonths) },
    });
  }
}

export async function nextUserPurgeAt(deletedAt = new Date()): Promise<Date> {
  const p = await getDeletionPolicy();
  return addMonths(deletedAt, p.userRetentionMonths);
}

export async function nextOrgPurgeAt(deletedAt = new Date()): Promise<Date> {
  const p = await getDeletionPolicy();
  return addMonths(deletedAt, p.orgRetentionMonths);
}

export async function purgeDueRecords(): Promise<{ users: number; orgs: number }> {
  const now = new Date();
  let users = 0;
  let orgs = 0;

  const dueUsers = await prisma.user.findMany({
    where: { deletedAt: { not: null }, purgeAt: { lte: now } },
    select: { id: true },
  });
  for (const u of dueUsers) {
    try {
      await hardDeleteUser(u.id);
      users += 1;
    } catch {
      /* 연동 이력이 있으면 보류 */
    }
  }

  const dueOrgs = await prisma.organization.findMany({
    where: { deletedAt: { not: null }, purgeAt: { lte: now } },
    select: { id: true, path: true },
    orderBy: { path: 'desc' },
  });
  for (const o of dueOrgs) {
    try {
      await hardDeleteOrganization(o.id);
      orgs += 1;
    } catch {
      /* 연동 이력이 있으면 보류 */
    }
  }

  return { users, orgs };
}

export async function hardDeleteUser(id: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      customerProfile: { select: { id: true, tickets: { select: { id: true }, take: 1 } } },
      _count: {
        select: {
          statusChanges: true,
          adminChangeLogs: true,
          mgmtActions: true,
          createdUsers: true,
          escrowAsBuyer: true,
          escrowAsSeller: true,
        },
      },
    },
  });
  if (!user?.deletedAt) throw new AppError(400, '삭제 처리된 사용자만 완전 삭제할 수 있습니다', 'VALIDATION');
  if (user.customerProfile?.tickets.length) {
    throw new AppError(409, '거래 이력이 있어 완전 삭제할 수 없습니다', 'CONFLICT');
  }
  if (
    user._count.statusChanges ||
    user._count.adminChangeLogs ||
    user._count.mgmtActions ||
    user._count.escrowAsBuyer ||
    user._count.escrowAsSeller
  ) {
    throw new AppError(409, '처리 이력이 남아 있어 완전 삭제할 수 없습니다', 'CONFLICT');
  }
  if (user._count.createdUsers) {
    await prisma.user.updateMany({ where: { createdById: id }, data: { createdById: null } });
  }
  await prisma.user.delete({ where: { id } });
}

export async function hardDeleteOrganization(id: string): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          children: true,
          users: true,
          customers: true,
          ledgerEntries: true,
        },
      },
    },
  });
  if (!org?.deletedAt) throw new AppError(400, '삭제 처리된 조직만 완전 삭제할 수 있습니다', 'VALIDATION');
  const anyChildren = await prisma.organization.count({ where: { parentId: id } });
  const liveUsers = await prisma.user.count({
    where: { organizationId: id, deletedAt: null },
  });
  const anyUsers = await prisma.user.count({ where: { organizationId: id } });
  if (anyChildren || liveUsers || anyUsers || org._count.customers || org._count.ledgerEntries) {
    throw new AppError(409, '하위 조직·고객·장부 이력이 있어 완전 삭제할 수 없습니다', 'CONFLICT');
  }
  await prisma.commissionRate.deleteMany({ where: { organizationId: id } });
  await prisma.organization.delete({ where: { id } });
}

let purgeTimer: ReturnType<typeof setInterval> | null = null;

export function startDeletionPurgeScheduler(): void {
  if (purgeTimer) return;
  const run = async () => {
    try {
      const result = await purgeDueRecords();
      const sims = await purgeExpiredSimulatorRuns();
      if (result.users || result.orgs || sims) {
        console.log(`[deletion-purge] users=${result.users} orgs=${result.orgs} simulator=${sims}`);
      }
    } catch (err) {
      console.error('[deletion-purge]', err);
    }
  };
  run();
  purgeTimer = setInterval(run, 15 * 60 * 1000);
}

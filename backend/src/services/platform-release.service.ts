import { ReleaseChangeLevel, ReleaseSource, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { AuthUser } from '../types/auth';
import { logAdminChange } from './admin-change-log.service';
import {
  buildAutoReleaseI18n,
  type ReleaseI18nText,
  type ReleaseLocale,
} from '../constants/platform-release-i18n';
import { computeNextVersion, createReleaseEntry } from './auto-platform-release.service';

export async function listPlatformReleases(query: {
  page?: number;
  limit?: number;
  search?: string;
  locale?: ReleaseLocale;
}) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 30));
  const skip = (page - 1) * limit;
  const locale = query.locale ?? 'KR';

  const where: Prisma.PlatformReleaseLogWhereInput = query.search?.trim()
    ? {
        OR: [
          { version: { contains: query.search.trim(), mode: 'insensitive' } },
          { title: { contains: query.search.trim(), mode: 'insensitive' } },
          { description: { contains: query.search.trim(), mode: 'insensitive' } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.platformReleaseLog.findMany({
      where,
      include: {
        recordedBy: { select: { id: true, email: true, name: true, role: true } },
      },
      orderBy: { deployedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.platformReleaseLog.count({ where }),
  ]);

  return {
    items: items.map((row) => mapReleaseRow(row, locale)),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

function mapReleaseRow(
  row: {
    id: string;
    version: string;
    title: string | null;
    description: string | null;
    titleI18n: unknown;
    descriptionI18n: unknown;
    changeLevel: ReleaseChangeLevel;
    source: ReleaseSource;
    entityType: string | null;
    packageSizeMb: number | null;
    status: string;
    deployedAt: Date;
    notes: string | null;
    createdAt: Date;
    recordedBy: { id: string; email: string; name: string; role: string } | null;
  },
  locale: ReleaseLocale,
) {
  const titleI18n = row.titleI18n as Record<string, { title?: string }> | null;
  const descriptionI18n = row.descriptionI18n as Record<string, { description?: string }> | null;
  const localizedTitle =
    titleI18n?.[locale]?.title ?? titleI18n?.KR?.title ?? row.title ?? row.version;
  const localizedDescription =
    descriptionI18n?.[locale]?.description ??
    descriptionI18n?.KR?.description ??
    row.description ??
    '';

  return {
    id: row.id,
    version: row.version,
    title: localizedTitle,
    description: localizedDescription,
    titleI18n,
    descriptionI18n,
    changeLevel: row.changeLevel,
    source: row.source,
    entityType: row.entityType,
    packageSizeMb: row.packageSizeMb,
    status: row.status,
    deployedAt: row.deployedAt,
    notes: row.notes,
    createdAt: row.createdAt,
    recordedBy: row.recordedBy,
  };
}

/** 수동 배포 등록 (자동 정책 변경과 별도) */
export async function createPlatformRelease(
  actor: AuthUser,
  input: {
    version?: string;
    title?: string;
    description?: string;
    packageSizeMb?: number;
    status?: string;
    deployedAt?: string;
    notes?: string;
    changeLevel?: ReleaseChangeLevel;
  },
) {
  const changeLevel = input.changeLevel ?? 'MINOR';
  const version = input.version?.trim() || (await computeNextVersion(changeLevel));

  const release = await createReleaseEntry({
    version,
    changeLevel,
    source: ReleaseSource.MANUAL,
    title: input.title,
    description: input.description,
    packageSizeMb: input.packageSizeMb,
    status: input.status ?? 'SUCCESS',
    deployedAt: input.deployedAt ? new Date(input.deployedAt) : new Date(),
    notes: input.notes,
    recordedById: actor.id,
  });

  await logAdminChange({
    actor,
    action: 'CREATE',
    entityType: 'PLATFORM_RELEASE',
    entityId: release.id,
    entityLabel: release.version,
    summary: `시스템 업데이트 수동 등록: ${release.version}`,
    after: release,
  });

  return release;
}

/** 서버 배포 시 자동 등록 (apply-release.sh) */
export async function recordDeployRelease(input: {
  packageSizeMb?: number;
  notes?: string;
}) {
  const changeLevel: ReleaseChangeLevel = 'MINOR';
  const version = await computeNextVersion(changeLevel);
  const i18n = buildDeployReleaseI18n();
  const titleI18n = Object.fromEntries(
    (['KR', 'US', 'JP', 'CH', 'TH'] as const).map((loc) => [loc, { title: i18n[loc].title }]),
  );
  const descriptionI18n = Object.fromEntries(
    (['KR', 'US', 'JP', 'CH', 'TH'] as const).map((loc) => [
      loc,
      { description: i18n[loc].description },
    ]),
  );

  return createReleaseEntry({
    version,
    changeLevel,
    source: ReleaseSource.DEPLOY,
    entityType: 'DEPLOY',
    titleI18n,
    descriptionI18n,
    title: i18n.KR.title,
    description: i18n.KR.description,
    packageSizeMb: input.packageSizeMb,
    notes: input.notes,
    recordedById: null,
  });
}

function buildDeployReleaseI18n(): ReleaseI18nText {
  return {
    KR: {
      title: '시스템 배포 (일반)',
      description: '운영 서버에 새 릴리스 패키지가 배포되었습니다.',
    },
    US: {
      title: 'System deployment (minor)',
      description: 'A new release package was deployed to production.',
    },
    JP: {
      title: 'システム配布（マイナー）',
      description: '本番サーバーに新しいリリースパッケージが配布されました。',
    },
    CH: {
      title: '系统部署（一般）',
      description: '新的发布包已部署到生产服务器。',
    },
    TH: {
      title: 'การ deploy ระบบ (ทั่วไป)',
      description: 'แพ็กเกจเวอร์ชันใหม่ถูก deploy ไปยังเซิร์ฟเวอร์จริงแล้ว',
    },
  };
}

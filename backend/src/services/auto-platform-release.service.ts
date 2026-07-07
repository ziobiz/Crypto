import {
  ReleaseChangeLevel,
  ReleaseSource,
  type AdminChangeAction,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  AUTO_RELEASE_ENTITY_LEVEL,
  AUTO_RELEASE_ENTITY_TYPES,
  buildAutoReleaseI18n,
  type ReleaseI18nText,
} from '../constants/platform-release-i18n';
import type { ChangeLogActor } from './admin-change-log.service';

type ParsedVersion = { major: number; minor: number; patch: number };

function parseVersion(raw: string): ParsedVersion {
  const cleaned = raw.trim().replace(/^[vV]/, '');
  const parts = cleaned.split('.').map((p) => parseInt(p, 10));
  return {
    major: Number.isFinite(parts[0]) ? parts[0]! : 1,
    minor: Number.isFinite(parts[1]) ? parts[1]! : 0,
    patch: Number.isFinite(parts[2]) ? parts[2]! : 0,
  };
}

function versionScore(v: ParsedVersion): number {
  return v.major * 1_000_000 + v.minor * 1_000 + v.patch;
}

function formatVersion(v: ParsedVersion, level: ReleaseChangeLevel): string {
  if (level === 'MAJOR') return `V${v.major}.0`;
  if (level === 'PATCH') return `${v.major}.${v.minor}.${v.patch}`;
  return `${v.major}.${v.minor}`;
}

function bumpVersion(current: ParsedVersion, level: ReleaseChangeLevel): ParsedVersion {
  if (level === 'MAJOR') {
    return { major: current.major + 1, minor: 0, patch: 0 };
  }
  if (level === 'MINOR') {
    return { major: current.major, minor: current.minor + 1, patch: 0 };
  }
  const patch = current.patch > 0 ? current.patch + 1 : 1;
  return { major: current.major, minor: current.minor, patch };
}

async function getLatestParsedVersion(): Promise<ParsedVersion | null> {
  const rows = await prisma.platformReleaseLog.findMany({
    select: { version: true },
    orderBy: { deployedAt: 'desc' },
    take: 100,
  });
  if (!rows.length) return null;

  let best: ParsedVersion | null = null;
  let bestScore = -1;
  for (const row of rows) {
    const parsed = parseVersion(row.version);
    const score = versionScore(parsed);
    if (score > bestScore) {
      best = parsed;
      bestScore = score;
    }
  }
  return best;
}

function initialVersion(level: ReleaseChangeLevel): ParsedVersion {
  if (level === 'MAJOR') return { major: 1, minor: 0, patch: 0 };
  if (level === 'MINOR') return { major: 1, minor: 1, patch: 0 };
  return { major: 1, minor: 0, patch: 1 };
}

export async function computeNextVersion(level: ReleaseChangeLevel): Promise<string> {
  const latest = await getLatestParsedVersion();
  const base = latest ?? { major: 1, minor: 0, patch: 0 };
  const next = latest ? bumpVersion(base, level) : initialVersion(level);
  return formatVersion(next, level);
}

export async function recordAutoPlatformRelease(input: {
  actor: ChangeLogActor;
  entityType: string;
  action: AdminChangeAction;
  entityLabel?: string | null;
  summary: string;
}): Promise<void> {
  if (!AUTO_RELEASE_ENTITY_TYPES.has(input.entityType)) return;

  const changeLevel = AUTO_RELEASE_ENTITY_LEVEL[input.entityType] ?? 'MINOR';
  const version = await computeNextVersion(changeLevel);
  const i18n = buildAutoReleaseI18n({
    entityType: input.entityType,
    action: input.action,
    changeLevel,
    entityLabel: input.entityLabel,
    adminName: input.actor.name,
    adminEmail: input.actor.email,
  });

  const titleI18n = Object.fromEntries(
    (['KR', 'US', 'JP', 'CH', 'TH'] as const).map((loc) => [loc, { title: i18n[loc].title }]),
  );
  const descriptionI18n = Object.fromEntries(
    (['KR', 'US', 'JP', 'CH', 'TH'] as const).map((loc) => [
      loc,
      { description: i18n[loc].description },
    ]),
  );

  await createReleaseEntry({
    version,
    changeLevel,
    source: ReleaseSource.AUTO,
    entityType: input.entityType,
    titleI18n,
    descriptionI18n,
    title: i18n.KR.title,
    description: i18n.KR.description,
    recordedById: input.actor.id,
    notes: input.summary,
  });
}

export async function createReleaseEntry(input: {
  version: string;
  changeLevel: ReleaseChangeLevel;
  source: ReleaseSource;
  entityType?: string;
  title?: string;
  description?: string;
  titleI18n?: Record<string, { title?: string }>;
  descriptionI18n?: Record<string, { description?: string }>;
  packageSizeMb?: number;
  status?: string;
  deployedAt?: Date;
  notes?: string;
  recordedById?: string | null;
}) {
  return prisma.platformReleaseLog.create({
    data: {
      version: input.version,
      title: input.title,
      description: input.description,
      titleI18n: input.titleI18n as object | undefined,
      descriptionI18n: input.descriptionI18n as object | undefined,
      changeLevel: input.changeLevel,
      source: input.source,
      entityType: input.entityType,
      packageSizeMb: input.packageSizeMb,
      status: input.status ?? 'SUCCESS',
      deployedAt: input.deployedAt ?? new Date(),
      notes: input.notes,
      recordedById: input.recordedById ?? null,
    },
    include: {
      recordedBy: { select: { id: true, email: true, name: true, role: true } },
    },
  });
}

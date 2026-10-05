import { CustomerApprovalStatus, OrgType, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { normalizeEmail } from '../lib/password-policy';
import { canonicalizePhone } from '../lib/phone-number';
import { findUserIdsByPhone } from './phone-lookup.service';

export type ReferrerSearchHit = {
  userId: string;
  email: string;
  /** 조직명. 가맹점 검색이면 그 가맹점의 유치 조직명 */
  displayName: string;
  /** 가맹점 연락처로 찾았으면 소개 가맹점 id. 추천자(수수료)는 아님 */
  introducedByUserId?: string;
  /** 가맹점 검색 시 개인/기업. 동일 전화로 둘 다 나올 때 구분용 */
  customerType?: 'INDIVIDUAL' | 'CORPORATE';
};

const userPick = {
  id: true,
  email: true,
  name: true,
  role: true,
  customerProfile: {
    select: {
      customerType: true,
      businessName: true,
      approvalStatus: true,
      recruitingOrgId: true,
      recruitingOrg: { select: { id: true, name: true, isActive: true, deletedAt: true } },
    },
  },
  organization: { select: { id: true, name: true, isActive: true, deletedAt: true } },
} satisfies Prisma.UserSelect;

type PickedUser = Prisma.UserGetPayload<{ select: typeof userPick }>;

async function officialStaffForOrg(orgId: string): Promise<{ id: string; email: string } | null> {
  const org = await prisma.organization.findFirst({
    where: { id: orgId, isActive: true, deletedAt: null },
    select: { referralUserId: true },
  });
  if (!org) return null;
  if (org.referralUserId) {
    const assigned = await prisma.user.findFirst({
      where: {
        id: org.referralUserId,
        organizationId: orgId,
        role: UserRole.ORG_STAFF,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, email: true },
    });
    if (assigned) return assigned;
  }
  return prisma.user.findFirst({
    where: {
      organizationId: orgId,
      role: UserRole.ORG_STAFF,
      isActive: true,
      deletedAt: null,
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true },
  });
}

async function toReferrerHit(user: PickedUser): Promise<ReferrerSearchHit | null> {
  if (user.role === UserRole.ORG_STAFF) {
    if (!user.organization || !user.organization.isActive || user.organization.deletedAt) return null;
    return {
      userId: user.id,
      email: user.email,
      displayName: user.organization.name.trim(),
    };
  }
  if (user.role !== UserRole.CUSTOMER) return null;
  const profile = user.customerProfile;
  const org = profile?.recruitingOrg;
  if (
    !profile ||
    profile.approvalStatus !== CustomerApprovalStatus.APPROVED ||
    !org ||
    !org.isActive ||
    org.deletedAt
  ) {
    return null;
  }
  const staff = await officialStaffForOrg(org.id);
  return {
    userId: staff?.id ?? user.id,
    email: staff?.email ?? '',
    displayName: org.name.trim(),
    introducedByUserId: user.id,
    customerType: profile.customerType === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL',
  };
}

/** 공개 가입용 추천자 검색. 영업점 이상 직원만 추천자. 가맹점은 유치 조직으로 연결 */
export async function searchReferrers(input: {
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
}): Promise<ReferrerSearchHit[]> {
  const email = input.email?.trim() ?? '';
  const phone = input.phone?.trim() ?? '';
  if (email && phone) {
    throw new AppError(400, 'Search by email or phone', 'VALIDATION');
  }

  let idFilter: Prisma.UserWhereInput;
  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError(400, 'Email is required', 'VALIDATION');
    }
    idFilter = { email: { equals: normalizeEmail(email), mode: 'insensitive' } };
  } else if (phone) {
    if (!input.phoneCountryCode?.trim()) {
      throw new AppError(400, 'Country code and phone are required', 'VALIDATION');
    }
    const canon = canonicalizePhone(input.phoneCountryCode, phone);
    if (!canon || canon.phone.length < 8) {
      throw new AppError(400, 'Country code and phone are required', 'VALIDATION');
    }
    const ids = await findUserIdsByPhone(input.phoneCountryCode, phone);
    if (ids.length === 0) return [];
    idFilter = { id: { in: ids } };
  } else {
    throw new AppError(400, 'Search by email or phone', 'VALIDATION');
  }

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      ...idFilter,
      OR: [
        {
          role: UserRole.CUSTOMER,
          customerProfile: { approvalStatus: CustomerApprovalStatus.APPROVED },
        },
        {
          role: UserRole.ORG_STAFF,
          organizationId: { not: null },
        },
      ],
    },
    select: userPick,
    take: 12,
    orderBy: { email: 'asc' },
  });

  const hits: ReferrerSearchHit[] = [];
  for (const user of users) {
    const hit = await toReferrerHit(user);
    if (hit) hits.push(hit);
  }
  return hits;
}

export async function resolveRecruitingFromReferrer(referrerUserId: string): Promise<{
  recruitingOrgId: string;
  referredByUserId: string | null;
  introducedByUserId: string | null;
}> {
  const referrer = await prisma.user.findFirst({
    where: {
      id: referrerUserId,
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      role: true,
      organizationId: true,
      organization: { select: { id: true, isActive: true, deletedAt: true } },
      customerProfile: {
        select: {
          approvalStatus: true,
          recruitingOrgId: true,
          recruitingOrg: { select: { id: true, isActive: true, deletedAt: true } },
        },
      },
    },
  });

  if (!referrer) {
    throw new AppError(404, 'Referrer not found', 'REFERRER_NOT_FOUND');
  }

  if (referrer.role === UserRole.CUSTOMER) {
    const org = referrer.customerProfile?.recruitingOrg;
    if (
      !referrer.customerProfile ||
      referrer.customerProfile.approvalStatus !== CustomerApprovalStatus.APPROVED ||
      !org ||
      !org.isActive ||
      org.deletedAt
    ) {
      throw new AppError(400, 'Referrer is not available', 'REFERRER_INVALID');
    }
    const staff = await officialStaffForOrg(org.id);
    return {
      recruitingOrgId: org.id,
      referredByUserId: staff?.id ?? null,
      introducedByUserId: referrer.id,
    };
  }

  if (referrer.role === UserRole.ORG_STAFF) {
    if (
      !referrer.organizationId ||
      !referrer.organization ||
      !referrer.organization.isActive ||
      referrer.organization.deletedAt
    ) {
      throw new AppError(400, 'Referrer is not available', 'REFERRER_INVALID');
    }
    return {
      recruitingOrgId: referrer.organizationId,
      referredByUserId: referrer.id,
      introducedByUserId: null,
    };
  }

  throw new AppError(400, 'Referrer is not available', 'REFERRER_INVALID');
}

export async function getHeadOfficeOrgId(): Promise<string> {
  const hq = await prisma.organization.findFirst({
    where: { type: OrgType.HEAD_OFFICE, isActive: true, deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!hq) {
    throw new AppError(500, 'Head office organization missing', 'HQ_ORG_MISSING');
  }
  return hq.id;
}

export async function resolveRecruitingFromOrgCode(orgCode: string): Promise<{
  recruitingOrgId: string;
  referredByUserId: string | null;
  displayName: string;
}> {
  const code = orgCode.trim();
  if (!code) {
    throw new AppError(400, 'Invite organization code required', 'VALIDATION');
  }
  const org = await prisma.organization.findFirst({
    where: { code: { equals: code, mode: 'insensitive' }, isActive: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      referralUserId: true,
      referralUser: {
        select: {
          id: true,
          isActive: true,
          deletedAt: true,
          role: true,
          organizationId: true,
        },
      },
    },
  });
  if (!org) {
    throw new AppError(404, 'Invite organization not found', 'INVITE_ORG_NOT_FOUND');
  }
  const referralOk =
    org.referralUser &&
    org.referralUser.isActive &&
    !org.referralUser.deletedAt &&
    org.referralUser.role === UserRole.ORG_STAFF &&
    org.referralUser.organizationId === org.id;
  return {
    recruitingOrgId: org.id,
    referredByUserId: referralOk ? org.referralUser!.id : null,
    displayName: org.name,
  };
}

/** 가입 링크 미리보기 — 가맹점 ref 는 유치 조직명만 보여 준다 */
export async function getInvitePreview(input: {
  orgCode?: string;
  referrerUserId?: string;
}): Promise<{ displayName: string; email?: string; mode: 'ORG' | 'REFERRER' }> {
  if (input.referrerUserId) {
    const user = await prisma.user.findFirst({
      where: { id: input.referrerUserId, deletedAt: null, isActive: true },
      select: userPick,
    });
    const hit = user ? await toReferrerHit(user) : null;
    if (!hit) {
      throw new AppError(404, 'Referrer not found', 'REFERRER_NOT_FOUND');
    }
    return {
      displayName: hit.displayName,
      email: hit.email || undefined,
      mode: hit.introducedByUserId ? 'ORG' : 'REFERRER',
    };
  }
  if (input.orgCode) {
    const org = await resolveRecruitingFromOrgCode(input.orgCode);
    let email: string | undefined;
    if (org.referredByUserId) {
      const staff = await prisma.user.findUnique({
        where: { id: org.referredByUserId },
        select: { email: true },
      });
      email = staff?.email;
    }
    return { displayName: org.displayName, email, mode: 'ORG' };
  }
  throw new AppError(400, 'Invite parameter required', 'VALIDATION');
}

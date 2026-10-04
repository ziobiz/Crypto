import { CustomerApprovalStatus, OrgType, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { normalizeEmail } from '../lib/password-policy';

export type ReferrerSearchHit = {
  userId: string;
  email: string;
  displayName: string;
};

function displayNameFor(user: {
  name: string;
  role: UserRole;
  customerProfile: { customerType: string; businessName: string | null } | null;
  organization: { name: string } | null;
}): string {
  if (user.role === UserRole.CUSTOMER && user.customerProfile) {
    if (user.customerProfile.customerType === 'CORPORATE') {
      return (user.customerProfile.businessName || user.name).trim();
    }
    return user.name.trim();
  }
  if (user.organization?.name) return user.organization.name.trim();
  return user.name.trim();
}

/** 공개 가입용 추천자 검색 — 이메일↔업체명(개인=성명). 조직 유형은 반환하지 않음 */
export async function searchReferrers(rawQuery: string): Promise<ReferrerSearchHit[]> {
  const q = rawQuery.trim();
  if (q.length < 2) {
    throw new AppError(400, 'Search query too short', 'VALIDATION');
  }

  const looksLikeEmail = q.includes('@');
  const emailQ = looksLikeEmail ? normalizeEmail(q) : q;

  const textMatch: Prisma.UserWhereInput = looksLikeEmail
    ? { email: { contains: emailQ, mode: 'insensitive' } }
    : {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { customerProfile: { businessName: { contains: q, mode: 'insensitive' } } },
          { organization: { name: { contains: q, mode: 'insensitive' } } },
        ],
      };

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      AND: [
        textMatch,
        {
          OR: [
            {
              role: UserRole.CUSTOMER,
              customerProfile: { approvalStatus: CustomerApprovalStatus.APPROVED },
            },
            {
              role: UserRole.ORG_STAFF,
              organizationId: { not: null },
              organization: { isActive: true, deletedAt: null },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      customerProfile: {
        select: { customerType: true, businessName: true },
      },
      organization: { select: { name: true } },
    },
    take: 12,
    orderBy: { email: 'asc' },
  });

  return users.map((u) => ({
    userId: u.id,
    email: u.email,
    displayName: displayNameFor(u),
  }));
}

export async function resolveRecruitingFromReferrer(referrerUserId: string): Promise<{
  recruitingOrgId: string;
  referredByUserId: string;
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
        },
      },
    },
  });

  if (!referrer) {
    throw new AppError(404, 'Referrer not found', 'REFERRER_NOT_FOUND');
  }

  if (referrer.role === UserRole.CUSTOMER) {
    if (
      !referrer.customerProfile ||
      referrer.customerProfile.approvalStatus !== CustomerApprovalStatus.APPROVED
    ) {
      throw new AppError(400, 'Referrer is not available', 'REFERRER_INVALID');
    }
    return {
      recruitingOrgId: referrer.customerProfile.recruitingOrgId,
      referredByUserId: referrer.id,
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

/** 가입 링크 미리보기 — 조직 유형은 반환하지 않음 */
export async function getInvitePreview(input: {
  orgCode?: string;
  referrerUserId?: string;
}): Promise<{ displayName: string; email?: string; mode: 'ORG' | 'REFERRER' }> {
  if (input.referrerUserId) {
    const hits = await searchReferrersByUserId(input.referrerUserId);
    if (!hits) {
      throw new AppError(404, 'Referrer not found', 'REFERRER_NOT_FOUND');
    }
    return { displayName: hits.displayName, email: hits.email, mode: 'REFERRER' };
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

async function searchReferrersByUserId(userId: string): Promise<ReferrerSearchHit | null> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      isActive: true,
      OR: [
        {
          role: UserRole.CUSTOMER,
          customerProfile: { approvalStatus: CustomerApprovalStatus.APPROVED },
        },
        {
          role: UserRole.ORG_STAFF,
          organizationId: { not: null },
          organization: { isActive: true, deletedAt: null },
        },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      customerProfile: { select: { customerType: true, businessName: true } },
      organization: { select: { name: true } },
    },
  });
  if (!user) return null;
  return {
    userId: user.id,
    email: user.email,
    displayName: displayNameFor(user),
  };
}

import {
  HQ_CONFIG_KEYS,
  MEMBER_GRADES,
  type CustomerTypeLimitKey,
  type HqMemberGradePolicy,
  type MemberGrade,
  type MemberGradeExpressBenefit,
  defaultMemberGradeBenefit,
  defaultMemberGradePolicy,
  normalizeMemberGrade,
  normalizeMemberGradePolicy,
} from '../constants/hq-policy';
import { prisma } from '../lib/prisma';

export async function getHqMemberGradePolicy(): Promise<HqMemberGradePolicy> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.memberGrade },
  });
  return normalizeMemberGradePolicy(row?.value);
}

export async function saveHqMemberGradePolicy(
  policy: HqMemberGradePolicy,
): Promise<HqMemberGradePolicy> {
  const normalized = normalizeMemberGradePolicy(policy);
  await prisma.systemConfig.upsert({
    where: { key: HQ_CONFIG_KEYS.memberGrade },
    create: {
      key: HQ_CONFIG_KEYS.memberGrade,
      value: normalized,
      description: '회원등급 EXPRESS 추가 수수료 (개인/법인)',
    },
    update: {
      value: normalized,
      description: '회원등급 EXPRESS 추가 수수료 (개인/법인)',
    },
  });
  return normalized;
}

function toTypeKey(customerType?: string | null): CustomerTypeLimitKey {
  return String(customerType).toUpperCase() === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL';
}

export function benefitForMemberGrade(
  policy: HqMemberGradePolicy,
  grade?: string | null,
  customerType?: string | null,
): { grade: MemberGrade; benefit: MemberGradeExpressBenefit; customerType: CustomerTypeLimitKey } {
  const g = normalizeMemberGrade(grade);
  const typeKey = toTypeKey(customerType);
  const bucket = policy[typeKey] ?? defaultMemberGradePolicy()[typeKey];
  return {
    grade: g,
    customerType: typeKey,
    benefit: bucket.grades[g] ?? defaultMemberGradeBenefit(),
  };
}

export { MEMBER_GRADES, normalizeMemberGrade, normalizeMemberGradePolicy };

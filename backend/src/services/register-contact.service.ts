import { CustomerType, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { normalizeEmail } from '../lib/password-policy';

export function normalizePhoneDigits(phone: string): string {
  return String(phone ?? '').replace(/\D/g, '');
}

/**
 * 동일 유형(개인↔개인, 기업↔기업)의 이메일·전화 중복 가입 차단.
 * 기업 고객이 이미 있어도 개인 회원 가입은 허용 (반대도 허용).
 * 스태프/관리자 이메일은 고객 가입에 재사용 불가.
 */
export async function assertCustomerContactAvailable(input: {
  email: string;
  phone?: string | null;
  phoneCountryCode?: string | null;
  customerType: CustomerType;
  /** 수정 시 본인 제외 */
  excludeUserId?: string;
}) {
  const email = normalizeEmail(input.email);
  const phoneDigits = normalizePhoneDigits(input.phone ?? '');
  const phoneCc = String(input.phoneCountryCode ?? '').trim();

  const emailUsers = await prisma.user.findMany({
    where: {
      deletedAt: null,
      email: { equals: email, mode: 'insensitive' },
      ...(input.excludeUserId ? { id: { not: input.excludeUserId } } : {}),
    },
    select: {
      id: true,
      role: true,
      customerProfile: { select: { customerType: true } },
    },
  });

  for (const u of emailUsers) {
    if (u.role !== UserRole.CUSTOMER) {
      throw new AppError(409, 'Email already registered', 'EMAIL_TAKEN');
    }
    const existingType = u.customerProfile?.customerType;
    if (existingType === input.customerType) {
      throw new AppError(409, 'Email already registered', 'EMAIL_TAKEN');
    }
  }

  if (phoneDigits.length > 0 && phoneCc) {
    const phoneCandidates = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: UserRole.CUSTOMER,
        phoneCountryCode: phoneCc,
        phone: { not: null },
        ...(input.excludeUserId ? { id: { not: input.excludeUserId } } : {}),
        customerProfile: { customerType: input.customerType },
      },
      select: { id: true, phone: true },
    });
    const phoneTaken = phoneCandidates.some(
      (u) => normalizePhoneDigits(u.phone ?? '') === phoneDigits,
    );
    if (phoneTaken) {
      throw new AppError(409, 'Phone already registered', 'PHONE_TAKEN');
    }
  }
}

import { CustomerType, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { normalizeEmail } from '../lib/password-policy';
import { canonicalizePhone } from '../lib/phone-number';
import { findUserIdsByPhone } from './phone-lookup.service';

export function normalizePhoneDigits(phone: string): string {
  return String(phone ?? '').replace(/\D/g, '');
}

/**
 * 이메일은 전역 1회. 전화번호는 고객 유형(개인/기업)당 1회.
 * 같은 번호로 개인 1 + 기업 1은 허용. 스태프 이메일은 고객 가입에 재사용 불가.
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
  const canonPhone = canonicalizePhone(input.phoneCountryCode, input.phone ?? '');

  const emailUsers = await prisma.user.findMany({
    where: {
      deletedAt: null,
      email: { equals: email, mode: 'insensitive' },
      ...(input.excludeUserId ? { id: { not: input.excludeUserId } } : {}),
    },
    select: { id: true },
  });
  const emailTaken = emailUsers.length > 0;

  let phoneTaken = false;
  if (canonPhone && canonPhone.phone.length >= 8) {
    const matchedIds = (await findUserIdsByPhone(canonPhone.phoneCountryCode, canonPhone.phone)).filter(
      (id) => id !== input.excludeUserId,
    );
    phoneTaken =
      matchedIds.length > 0 &&
      (await prisma.user.findFirst({
        where: {
          id: { in: matchedIds },
          deletedAt: null,
          role: UserRole.CUSTOMER,
          customerProfile: { customerType: input.customerType },
        },
        select: { id: true },
      })) != null;
  }

  if (emailTaken && phoneTaken) {
    throw new AppError(409, 'Email and phone already registered', 'CONTACT_TAKEN');
  }
  if (emailTaken) {
    throw new AppError(409, 'Email already registered', 'EMAIL_TAKEN');
  }
  if (phoneTaken) {
    throw new AppError(409, 'Phone already registered for this customer type', 'PHONE_TAKEN');
  }
}

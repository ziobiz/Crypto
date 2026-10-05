import { prisma } from '../lib/prisma';
import { canonicalizePhone, phonesMatch } from '../lib/phone-number';

export async function findUserIdsByPhone(
  countryCode: string,
  phone: string,
): Promise<string[]> {
  const canon = canonicalizePhone(countryCode, phone);
  if (!canon || canon.phone.length < 8) return [];
  const rows = await prisma.$queryRaw<
    Array<{ id: string; phone: string | null; phoneCountryCode: string | null }>
  >`
    SELECT id, phone, "phoneCountryCode"
    FROM users
    WHERE "deletedAt" IS NULL
      AND phone IS NOT NULL
      AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE ${`%${canon.phone}`}
  `;
  return rows
    .filter((row) => phonesMatch(row.phoneCountryCode, row.phone, countryCode, phone))
    .map((row) => row.id);
}

import bcrypt from 'bcryptjs';
import { CustomerType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { normalizeEmail } from '../lib/password-policy';

const loginInclude = {
  organization: { select: { id: true, name: true, type: true, path: true } },
  customerProfile: { select: { id: true, customerType: true } },
} as const;

export async function findUsersByLoginEmail(email: string) {
  const normalized = normalizeEmail(email);

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      email: { equals: normalized, mode: 'insensitive' },
    },
    include: loginInclude,
  });

  for (const user of users) {
    if (user.email !== normalized) {
      await prisma.user.update({
        where: { id: user.id },
        data: { email: normalized },
      });
      user.email = normalized;
    }
  }

  return users;
}

/** 단일 조회 API용 — 여러 계정이면 개인고객 우선 */
export async function findUserByLoginEmail(email: string) {
  const users = await findUsersByLoginEmail(email);
  if (users.length === 0) return null;
  if (users.length === 1) return users[0]!;
  const individual = users.find(
    (u) => u.customerProfile?.customerType === CustomerType.INDIVIDUAL,
  );
  return individual ?? users[0]!;
}

/** 로그인 — 비밀번호가 일치하는 계정 선택(여러 개면 개인 우선) */
export async function findUserByLoginEmailAndPassword(email: string, password: string) {
  const users = await findUsersByLoginEmail(email);
  const matched = [];
  for (const user of users) {
    if (await bcrypt.compare(password, user.passwordHash)) {
      matched.push(user);
    }
  }
  if (matched.length === 0) return null;
  if (matched.length === 1) return matched[0]!;
  const individual = matched.find(
    (u) => u.customerProfile?.customerType === CustomerType.INDIVIDUAL,
  );
  return individual ?? matched[0]!;
}

import { prisma } from '../lib/prisma';
import { normalizeEmail } from '../lib/password-policy';

/** 로그인용 — 소문자 정규화 + 기존 대소문자 불일치 계정 보정 */
export async function findUserByLoginEmail(email: string) {
  const normalized = normalizeEmail(email);

  let user = await prisma.user.findUnique({
    where: { email: normalized },
    include: {
      organization: { select: { id: true, name: true, type: true, path: true } },
      customerProfile: { select: { id: true, customerType: true } },
    },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      where: { email: { equals: normalized, mode: 'insensitive' } },
      include: {
        organization: { select: { id: true, name: true, type: true, path: true } },
        customerProfile: { select: { id: true, customerType: true } },
      },
    });
    if (user && user.email !== normalized) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { email: normalized },
        include: {
          organization: { select: { id: true, name: true, type: true, path: true } },
          customerProfile: { select: { id: true, customerType: true } },
        },
      });
    }
  }

  return user;
}

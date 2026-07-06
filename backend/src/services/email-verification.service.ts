import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import type { HqEmailOtpConfig } from '../constants/hq-policy';
import { sendOtpEmail } from './email.service';

export type EmailVerifyPurpose = 'REGISTER' | 'OTP_ENROLL';

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createEmailVerificationChallenge(
  email: string,
  purpose: EmailVerifyPurpose,
  cfg: HqEmailOtpConfig,
  userName: string,
): Promise<void> {
  const code = generateSixDigitCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.emailVerificationChallenge.updateMany({
    where: { email, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.emailVerificationChallenge.create({
    data: { email, purpose, codeHash, expiresAt },
  });

  await sendOtpEmail(cfg, email, code, userName);
}

export async function verifyEmailVerificationCode(
  email: string,
  purpose: EmailVerifyPurpose,
  code: string,
): Promise<boolean> {
  const challenge = await prisma.emailVerificationChallenge.findFirst({
    where: {
      email,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!challenge) return false;
  const ok = await bcrypt.compare(code.replace(/\D/g, ''), challenge.codeHash);
  if (!ok) return false;
  await prisma.emailVerificationChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });
  return true;
}

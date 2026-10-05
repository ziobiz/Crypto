import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import type { HqEmailOtpConfig } from '../constants/hq-policy';
import { signRegisterEmailProof } from '../lib/jwt';
import { sendOtpEmail } from './email.service';

export type EmailVerifyPurpose = 'REGISTER' | 'OTP_ENROLL' | 'PASSWORD_RESET' | 'OTP_RESET';

/** 신규 가입 인증번호 유효 시간. 메일 문구와 동일하게 5분 */
export const REGISTER_EMAIL_CODE_MINUTES = 5;

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createEmailVerificationChallenge(
  email: string,
  purpose: EmailVerifyPurpose,
  cfg: HqEmailOtpConfig,
  userName: string,
): Promise<{ expiresAt: Date; expiresInSeconds: number }> {
  const minutes =
    purpose === 'REGISTER'
      ? REGISTER_EMAIL_CODE_MINUTES
      : Math.max(1, Number(cfg.otpExpireMinutes) || 5);
  const code = generateSixDigitCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  await prisma.emailVerificationChallenge.updateMany({
    where: { email, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.emailVerificationChallenge.create({
    data: { email, purpose, codeHash, expiresAt },
  });

  await sendOtpEmail(cfg, email, code, userName, minutes);
  return { expiresAt, expiresInSeconds: minutes * 60 };
}

export type ConfirmEmailCodeResult =
  | { ok: true; proof: string }
  | { ok: false; reason: 'EXPIRED' | 'INVALID' };

/** 코드를 확인하고 소모한 뒤, 가입 진행용 증명을 발급한다. */
export async function confirmRegisterEmailCode(
  email: string,
  code: string,
): Promise<ConfirmEmailCodeResult> {
  const digits = code.replace(/\D/g, '');
  if (digits.length < 6) return { ok: false, reason: 'INVALID' };

  const latest = await prisma.emailVerificationChallenge.findFirst({
    where: { email, purpose: 'REGISTER', consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest || latest.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: 'EXPIRED' };
  }
  const match = await bcrypt.compare(digits, latest.codeHash);
  if (!match) return { ok: false, reason: 'INVALID' };

  await prisma.emailVerificationChallenge.update({
    where: { id: latest.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true, proof: signRegisterEmailProof(email, latest.id) };
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

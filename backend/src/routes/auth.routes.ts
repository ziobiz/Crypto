import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  CustomerApprovalStatus,
  CustomerType,
  UserRole,
  TradeEscrowStatus,
  UsdtPurchaseStatus,
} from '@prisma/client';
import { getCustomerTradeAccess } from '../services/customer-access.service';
import {
  getHeadOfficeOrgId,
  getInvitePreview,
  resolveRecruitingFromOrgCode,
  resolveRecruitingFromReferrer,
  searchReferrers,
} from '../services/referrer-search.service';
import { prisma } from '../lib/prisma';
import {
  activateTotp,
  clearUserTotp,
  getEmailOtpConfig,
  isSmtpConfigured,
  issuePendingTotpSecret,
  maskEmail,
  sendOtpEnrollEmail,
  userRequiresOtp,
  verifyOtpEnrollEmail,
  verifyTotpCode,
} from '../services/otp.service';
import {
  confirmRegisterEmailCode,
  createEmailVerificationChallenge,
  verifyEmailVerificationCode,
} from '../services/email-verification.service';
import {
  initialPasswordFromEmail,
  isInitialPassword,
  normalizeEmail,
} from '../lib/password-policy';
import { signFlowToken, signOtpToken, signStepUpToken, signToken, verifyFlowToken, verifyOtpToken, verifyRegisterEmailProof } from '../lib/jwt';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';
import { hqPolicyService } from '../services/hq-policy.service';
import {
  findUserByLoginEmail,
  findUserByLoginEmailAndPassword,
} from '../services/user-lookup.service';
import { assertCustomerContactAvailable } from '../services/register-contact.service';
import {
  clientCountryFromRequest,
  clientIpFromRequest,
  resolveLimitCountryForRegister,
} from '../services/individual-limit.service';
import { canIssueSensitiveOtp } from '../constants/hq-admin';
import { assertTurnstile, clientIp } from '../lib/turnstile';
import { isAllowedRemittanceCountry } from '../constants/remittance-countries';
import { canonicalizePhone } from '../lib/phone-number';

const router = Router();

function localeHintFromReq(req: { headers: Record<string, unknown> }): string {
  return (
    String(req.headers['x-locale'] ?? '').trim() ||
    String(req.headers['accept-language'] ?? '').trim() ||
    ''
  );
}

const loginSchema = z.object({
  email: z.string().email().transform(normalizeEmail),
  password: z.string().min(1).transform((s) => s.trim()),
  turnstileToken: z.string().optional(),
});

function userResponse(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: { id: string; name: string; type: string; path: string } | null;
  customerProfile?: { id: string; customerType: string } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organization: user.organization,
    customerProfile: user.customerProfile,
  };
}

async function issueSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: { select: { id: true, name: true, type: true, path: true } },
      customerProfile: { select: { id: true, customerType: true } },
    },
  });
  if (!user || !user.isActive) {
    throw new AppError(401, 'User not found or inactive', 'UNAUTHORIZED');
  }
  const otpCfg = await getEmailOtpConfig();
  if (userRequiresOtp(user, otpCfg) && !user.totpEnabled) {
    throw new AppError(403, 'Google OTP setup required', 'OTP_SETUP_REQUIRED');
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return { token, user: userResponse(user) };
}

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password, turnstileToken } = loginSchema.parse(req.body);
    await assertTurnstile(turnstileToken, clientIp(req));

    const user = await findUserByLoginEmailAndPassword(email, password);

    if (!user) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      const { resolveInactiveLoginPayload } = await import('../services/inactive-login.service');
      const localeHint =
        String(req.headers['x-locale'] ?? '').toUpperCase() ||
        String(req.headers['accept-language'] ?? '');
      const payload = await resolveInactiveLoginPayload(user.id, localeHint);
      throw new AppError(403, payload.message, 'ACCOUNT_INACTIVE', {
        inactiveNotice: {
          presetId: payload.presetId,
          messages: payload.messages,
        },
      });
    }

    if (user.passwordMustChange) {
      res.json({
        mustChangePassword: true,
        changeToken: signFlowToken(user.id, 'password_change'),
        email: user.email,
      });
      return;
    }

    const otpCfg = await getEmailOtpConfig();
    if (userRequiresOtp(user, otpCfg)) {
      if (!user.totpEnabled || !user.totpSecret) {
        res.json({
          mustSetupOtp: true,
          enrollToken: signFlowToken(user.id, 'otp_enroll'),
          maskedEmail: maskEmail(user.email),
          smtpConfigured: isSmtpConfigured(otpCfg),
        });
        return;
      }

      res.json({
        otpRequired: true,
        otpToken: signOtpToken(user.id),
        otpMethod: 'totp',
        maskedEmail: maskEmail(user.email),
      });
      return;
    }

    res.json(await issueSession(user.id));
  }),
);

const otpVerifySchema = z.object({
  otpToken: z.string().min(1),
  code: z
    .string()
    .min(1)
    .transform((s) => s.replace(/\D/g, ''))
    .pipe(z.string().length(6, 'OTP must be 6 digits')),
});

router.post(
  '/otp/verify',
  asyncHandler(async (req, res) => {
    const { otpToken, code } = otpVerifySchema.parse(req.body);
    const payload = verifyOtpToken(otpToken);

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive || !user.totpSecret) {
      throw new AppError(401, 'Invalid OTP session', 'INVALID_OTP_TOKEN');
    }

    if (!verifyTotpCode(user.totpSecret, code)) {
      throw new AppError(401, 'Invalid OTP code', 'INVALID_OTP_CODE');
    }

    res.json(await issueSession(user.id));
  }),
);

router.post(
  '/password/change',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        changeToken: z.string().min(1),
        newPassword: z.string().min(8),
        confirmPassword: z.string().min(8),
      })
      .parse(req.body);

    if (body.newPassword !== body.confirmPassword) {
      throw new AppError(400, 'Passwords do not match', 'VALIDATION');
    }

    const payload = verifyFlowToken(body.changeToken, 'password_change');
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid session', 'INVALID_FLOW_TOKEN');
    }

    if (isInitialPassword(user.email, body.newPassword)) {
      throw new AppError(400, 'Cannot use initial password', 'VALIDATION');
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordMustChange: false },
    });

    const otpCfg = await getEmailOtpConfig();
    if (userRequiresOtp(user, otpCfg) && !user.totpEnabled) {
      res.json({
        mustSetupOtp: true,
        enrollToken: signFlowToken(user.id, 'otp_enroll'),
        maskedEmail: maskEmail(user.email),
        smtpConfigured: isSmtpConfigured(otpCfg),
      });
      return;
    }

    res.json(await issueSession(user.id));
  }),
);

router.post(
  '/otp/enroll/send-email',
  asyncHandler(async (req, res) => {
    const { enrollToken } = z.object({ enrollToken: z.string().min(1) }).parse(req.body);
    const payload = verifyFlowToken(enrollToken, 'otp_enroll');
    await sendOtpEnrollEmail(payload.sub, localeHintFromReq(req));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    res.json({
      ok: true,
      maskedEmail: maskEmail(user?.email ?? ''),
      smtpConfigured: isSmtpConfigured(await getEmailOtpConfig()),
    });
  }),
);

router.post(
  '/otp/enroll/verify-email',
  asyncHandler(async (req, res) => {
    const { enrollToken, code } = z
      .object({
        enrollToken: z.string().min(1),
        code: z.string().min(6),
      })
      .parse(req.body);
    const payload = verifyFlowToken(enrollToken, 'otp_enroll');

    const ok = await verifyOtpEnrollEmail(payload.sub, code);
    if (!ok) {
      throw new AppError(401, 'Invalid email verification code', 'INVALID_OTP_CODE');
    }

    const { secret, otpauthUrl } = await issuePendingTotpSecret(payload.sub);
    res.json({ secret, otpauthUrl, enrollToken });
  }),
);

router.post(
  '/otp/enroll/activate',
  asyncHandler(async (req, res) => {
    const { enrollToken, code } = z
      .object({
        enrollToken: z.string().min(1),
        code: z.string().min(6),
      })
      .parse(req.body);
    const payload = verifyFlowToken(enrollToken, 'otp_enroll');

    const ok = await activateTotp(payload.sub, code.replace(/\D/g, ''));
    if (!ok) {
      throw new AppError(401, 'Invalid Google OTP code', 'INVALID_OTP_CODE');
    }

    res.json(await issueSession(payload.sub));
  }),
);

router.post(
  '/password/change-authenticated',
  authenticate,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
        confirmPassword: z.string().min(8),
      })
      .parse(req.body);

    if (body.newPassword !== body.confirmPassword) {
      throw new AppError(400, 'Passwords do not match', 'VALIDATION');
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');

    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Current password is incorrect', 'INVALID_CREDENTIALS');
    }

    if (isInitialPassword(user.email, body.newPassword)) {
      throw new AppError(400, 'Cannot use initial password', 'VALIDATION');
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordMustChange: false },
    });

    res.json({ ok: true });
  }),
);

/** 공개가입 OFF → 조직/추천 가입링크(?org·?ref)만 허용 */
async function assertIndividualRegisterAllowed(opts: {
  inviteOrgCode?: string;
  referrerUserId?: string;
  noReferrer?: boolean;
}) {
  if (await hqPolicyService.isCustomerRegistrationEnabled()) return;
  if (opts.noReferrer || (!opts.inviteOrgCode && !opts.referrerUserId)) {
    throw new AppError(
      403,
      'Public registration is disabled. Sign up with an organization invite link.',
      'REGISTRATION_INVITE_ONLY',
    );
  }
}

router.post(
  '/register/send-code',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        email: z.string().email().transform(normalizeEmail),
        name: z.string().min(1),
        inviteOrgCode: z.string().min(1).optional(),
        referrerUserId: z.string().min(1).optional(),
      })
      .parse(req.body);
    await assertIndividualRegisterAllowed({
      inviteOrgCode: body.inviteOrgCode,
      referrerUserId: body.referrerUserId,
    });
    const { email, name } = body;

    await assertCustomerContactAvailable({
      email,
      customerType: CustomerType.INDIVIDUAL,
    });

    const cfg = await getEmailOtpConfig();
    if (!isSmtpConfigured(cfg)) {
      throw new AppError(503, 'Email service is not configured', 'EMAIL_NOT_CONFIGURED');
    }
    const issued = await createEmailVerificationChallenge(
      email,
      'REGISTER',
      cfg,
      name.trim(),
      localeHintFromReq(req),
    );
    res.json({
      ok: true,
      smtpConfigured: true,
      maskedEmail: maskEmail(email),
      expiresAt: issued.expiresAt.toISOString(),
      expiresInSeconds: issued.expiresInSeconds,
    });
  }),
);

/** 신규 가입 — 발송된 인증번호 확인 (5분). 성공 시에만 나머지 가입 진행 */
router.post(
  '/register/verify-code',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        email: z.string().email().transform(normalizeEmail),
        code: z.string().min(6),
        inviteOrgCode: z.string().min(1).optional(),
        referrerUserId: z.string().min(1).optional(),
      })
      .parse(req.body);
    await assertIndividualRegisterAllowed({
      inviteOrgCode: body.inviteOrgCode,
      referrerUserId: body.referrerUserId,
    });

    const result = await confirmRegisterEmailCode(body.email, body.code);
    if (!result.ok) {
      if (result.reason === 'EXPIRED') {
        throw new AppError(400, 'Verification code expired', 'EMAIL_CODE_EXPIRED');
      }
      throw new AppError(400, 'Invalid email verification code', 'INVALID_OTP_CODE');
    }
    res.json({ ok: true, emailProof: result.proof });
  }),
);

async function assertPublicAccountRecoveryAllowed() {
  if (!(await hqPolicyService.isAccountRecoveryEnabled())) {
    throw new AppError(403, 'Account recovery is disabled', 'RECOVERY_DISABLED');
  }
}

/** 비밀번호 분실 — 이메일 코드 발송 (존재 여부 비공개) */
router.post(
  '/password/forgot/send-code',
  asyncHandler(async (req, res) => {
    const { email, turnstileToken } = z
      .object({
        email: z.string().email().transform(normalizeEmail),
        turnstileToken: z.string().optional(),
      })
      .parse(req.body);
    await assertPublicAccountRecoveryAllowed();
    await assertTurnstile(turnstileToken, clientIp(req));

    const user = await findUserByLoginEmail(email);
    const cfg = await getEmailOtpConfig();
    if (user?.isActive) {
      await createEmailVerificationChallenge(
        user.email,
        'PASSWORD_RESET',
        cfg,
        user.name,
        localeHintFromReq(req),
      );
    }
    res.json({
      ok: true,
      maskedEmail: maskEmail(email),
      smtpConfigured: isSmtpConfigured(cfg),
    });
  }),
);

/** 비밀번호 분실 — 코드 확인 후 새 비밀번호 */
router.post(
  '/password/forgot/reset',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        email: z.string().email().transform(normalizeEmail),
        code: z.string().min(6),
        newPassword: z.string().min(8),
        confirmPassword: z.string().min(8),
        turnstileToken: z.string().optional(),
      })
      .parse(req.body);
    await assertPublicAccountRecoveryAllowed();
    await assertTurnstile(body.turnstileToken, clientIp(req));

    if (body.newPassword !== body.confirmPassword) {
      throw new AppError(400, 'Passwords do not match', 'VALIDATION');
    }

    const user = await findUserByLoginEmail(body.email);
    if (!user || !user.isActive) {
      throw new AppError(400, 'Invalid code or email', 'INVALID_RESET');
    }
    if (isInitialPassword(user.email, body.newPassword)) {
      throw new AppError(400, 'Cannot use initial password', 'VALIDATION');
    }

    const ok = await verifyEmailVerificationCode(user.email, 'PASSWORD_RESET', body.code);
    if (!ok) {
      throw new AppError(400, 'Invalid or expired code', 'INVALID_CODE');
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordMustChange: false },
    });

    res.json({ ok: true });
  }),
);

/** OTP 분실 — 이메일 코드 발송 (존재 여부 비공개) */
router.post(
  '/otp/forgot/send-code',
  asyncHandler(async (req, res) => {
    const { email, turnstileToken } = z
      .object({
        email: z.string().email().transform(normalizeEmail),
        turnstileToken: z.string().optional(),
      })
      .parse(req.body);
    await assertPublicAccountRecoveryAllowed();
    await assertTurnstile(turnstileToken, clientIp(req));

    const user = await findUserByLoginEmail(email);
    const cfg = await getEmailOtpConfig();
    if (user?.isActive && user.totpEnabled) {
      await createEmailVerificationChallenge(
        user.email,
        'OTP_RESET',
        cfg,
        user.name,
        localeHintFromReq(req),
      );
    }
    res.json({
      ok: true,
      maskedEmail: maskEmail(email),
      smtpConfigured: isSmtpConfigured(cfg),
    });
  }),
);

/** OTP 분실 — 코드 확인 후 Google OTP 해제 → 재등록 유도 */
router.post(
  '/otp/forgot/reset',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        email: z.string().email().transform(normalizeEmail),
        code: z.string().min(6),
        turnstileToken: z.string().optional(),
      })
      .parse(req.body);
    await assertPublicAccountRecoveryAllowed();
    await assertTurnstile(body.turnstileToken, clientIp(req));

    const user = await findUserByLoginEmail(body.email);
    if (!user || !user.isActive || !user.totpEnabled) {
      throw new AppError(400, 'Invalid code or email', 'INVALID_RESET');
    }

    const ok = await verifyEmailVerificationCode(user.email, 'OTP_RESET', body.code);
    if (!ok) {
      throw new AppError(400, 'Invalid or expired code', 'INVALID_CODE');
    }

    await clearUserTotp(user.id);

    res.json({
      ok: true,
      mustSetupOtp: true,
      enrollToken: signFlowToken(user.id, 'otp_enroll'),
      maskedEmail: maskEmail(user.email),
      smtpConfigured: isSmtpConfigured(await getEmailOtpConfig()),
    });
  }),
);

router.get(
  '/session-info',
  authenticate,
  asyncHandler(async (req, res) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
      req.socket.remoteAddress ||
      '';
    res.json({ ip, serverTime: new Date().toISOString() });
  }),
);

router.post(
  '/step-up/otp',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!canIssueSensitiveOtp(req.user!.role)) {
      throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    }
    const code = String((req.body as { code?: string }).code ?? '').trim();
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.totpEnabled || !user.totpSecret) {
      throw new AppError(400, 'Google OTP is not enabled', 'OTP_NOT_ENABLED');
    }
    if (!verifyTotpCode(user.totpSecret, code)) {
      throw new AppError(401, 'Invalid OTP code', 'INVALID_OTP');
    }
    const cfg = await getEmailOtpConfig();
    res.json({
      sensitiveToken: signStepUpToken(user.id, cfg.sensitiveOtpExpireMinutes ?? 10),
    });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = req.user!;
    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: {
        organization: { select: { id: true, name: true, type: true, path: true } },
        customerProfile: {
          include: {
            recruitingOrg: { select: { id: true, name: true, code: true } },
          },
        },
        wallets: { where: { isActive: true }, orderBy: { isDefault: 'desc' } },
        kyc: { select: { status: true } },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    const isOperator = user.role === UserRole.CUSTOMER_OPERATOR;
    const scopeUserId = isOperator ? (auth.merchantAdminUserId ?? user.merchantAdminUserId) : user.id;

    let customerProfile = user.customerProfile;
    let kycStatus = user.kyc?.status ?? (user.role === 'CUSTOMER' ? 'NOT_SUBMITTED' : 'APPROVED');
    let simulatorEnabled = user.customerProfile?.simulatorEnabled;
    if (isOperator && scopeUserId) {
      const admin = await prisma.user.findUnique({
        where: { id: scopeUserId },
        include: {
          customerProfile: {
            include: { recruitingOrg: { select: { id: true, name: true, code: true } } },
          },
          kyc: { select: { status: true } },
        },
      });
      customerProfile = admin?.customerProfile ?? null;
      kycStatus = admin?.kyc?.status ?? 'NOT_SUBMITTED';
      simulatorEnabled = admin?.customerProfile?.simulatorEnabled;
    }

    const operatorsEnabled = auth.operatorsEnabled === true;
    const wallets = isOperator
      ? (
          await prisma.wallet.findMany({
            where: {
              userId: scopeUserId!,
              isActive: true,
              approvalStatus: 'APPROVED',
            },
            orderBy: { isDefault: 'desc' },
          })
        ).map((w) => ({
          ...w,
          fxFeePercent: Number(w.fxFeePercent),
          gasFeeAmount: Number(w.gasFeeAmount),
          transferFeeAmount: Number(w.transferFeeAmount),
          otherFeeAmount: Number(w.otherFeeAmount),
          platformFeeAmount: Number(w.platformFeeAmount),
        }))
      : user.wallets.map((w) => ({
          ...w,
          fxFeePercent: Number(w.fxFeePercent),
          gasFeeAmount: Number(w.gasFeeAmount),
          transferFeeAmount: Number(w.transferFeeAmount),
          otherFeeAmount: Number(w.otherFeeAmount),
          platformFeeAmount: Number(w.platformFeeAmount),
        }));

    const tradeAccessInfo = await getCustomerTradeAccess(auth);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      legalFirstName: user.legalFirstName ?? null,
      legalLastName: user.legalLastName ?? null,
      role: user.role,
      organization: user.organization,
      customerProfile,
      totpEnabled: user.totpEnabled,
      passwordMustChange: user.passwordMustChange,
      merchantAdminUserId: auth.merchantAdminUserId,
      operatorsEnabled,
      sessionPolicy: await hqPolicyService.getSessionPolicy(),
      pageAccess: await hqPolicyService.getPageAccessForUser({
        role: user.role,
        organizationType: user.organization?.type ?? null,
        simulatorEnabled,
        operatorsEnabled,
        pageAccessOverrides: (user.pageAccessOverrides ?? null) as Record<string, string> | null,
      }),
      kycStatus,
      tradeAccess: tradeAccessInfo.tradeAccess,
      approvalStatus: tradeAccessInfo.approvalStatus,
      wallets,
    });
  }),
);

/** 고객·운영자: 나의 가입 정보 (조회) */
router.get(
  '/account',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = req.user!;
    if (auth.role !== UserRole.CUSTOMER && auth.role !== UserRole.CUSTOMER_OPERATOR) {
      throw new AppError(403, 'Customer account only', 'FORBIDDEN');
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        email: true,
        name: true,
        legalFirstName: true,
        legalLastName: true,
        phone: true,
        phoneCountryCode: true,
        role: true,
        totpEnabled: true,
        createdAt: true,
        bankAccounts: {
          where: { isActive: true },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            currency: true,
            bankName: true,
            accountNumber: true,
            accountHolder: true,
            branchName: true,
            isDefault: true,
          },
        },
        wallets: {
          where: { isActive: true },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            label: true,
            address: true,
            network: true,
            isDefault: true,
            approvalStatus: true,
          },
        },
        customerProfile: {
          select: {
            customerType: true,
            approvalStatus: true,
            limitCountry: true,
            businessName: true,
            recruitingOrg: { select: { id: true, name: true, code: true } },
          },
        },
        kyc: { select: { status: true } },
      },
    });
    if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');

    let profile = user.customerProfile;
    let kycStatus = user.kyc?.status ?? 'NOT_SUBMITTED';
    let bankAccounts = user.bankAccounts;
    let wallets = user.wallets;

    if (auth.role === UserRole.CUSTOMER_OPERATOR && auth.merchantAdminUserId) {
      const admin = await prisma.user.findUnique({
        where: { id: auth.merchantAdminUserId },
        select: {
          bankAccounts: {
            where: { isActive: true },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
            select: {
              id: true,
              currency: true,
              bankName: true,
              accountNumber: true,
              accountHolder: true,
              branchName: true,
              isDefault: true,
            },
          },
          wallets: {
            where: {
              isActive: true,
              approvalStatus: 'APPROVED',
            },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
            select: {
              id: true,
              label: true,
              address: true,
              network: true,
              isDefault: true,
              approvalStatus: true,
            },
          },
          customerProfile: {
            select: {
              customerType: true,
              approvalStatus: true,
              limitCountry: true,
              businessName: true,
              recruitingOrg: { select: { id: true, name: true, code: true } },
            },
          },
          kyc: { select: { status: true } },
        },
      });
      profile = admin?.customerProfile ?? null;
      kycStatus = admin?.kyc?.status ?? 'NOT_SUBMITTED';
      bankAccounts = admin?.bankAccounts ?? [];
      wallets = admin?.wallets ?? [];
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      legalFirstName: user.legalFirstName ?? null,
      legalLastName: user.legalLastName ?? null,
      phone: user.phone ?? null,
      phoneCountryCode: user.phoneCountryCode ?? null,
      role: user.role,
      totpEnabled: user.totpEnabled,
      createdAt: user.createdAt,
      kycStatus,
      customerType: profile?.customerType ?? null,
      approvalStatus: profile?.approvalStatus ?? null,
      limitCountry: profile?.limitCountry ?? null,
      businessName: profile?.businessName ?? null,
      recruitingOrg: profile?.recruitingOrg ?? null,
      bankAccounts,
      wallets,
      canEditNickname: true,
      canChangePassword: true,
      canEditLegalName: false,
      canResetOtp: false,
    });
  }),
);

/** 고객·운영자: 닉네임만 변경 (법적 성명·연락처 등은 불가) */
router.patch(
  '/account',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = req.user!;
    if (auth.role !== UserRole.CUSTOMER && auth.role !== UserRole.CUSTOMER_OPERATOR) {
      throw new AppError(403, 'Customer account only', 'FORBIDDEN');
    }
    const body = z
      .object({
        name: z.string().trim().min(1).max(80),
      })
      .parse(req.body);

    const updated = await prisma.user.update({
      where: { id: auth.id },
      data: { name: body.name.trim() },
      select: { id: true, name: true, email: true },
    });
    res.json({ ok: true, name: updated.name, email: updated.email });
  }),
);

const registerBankAccountSchema = z.object({
  currency: z.enum(['KRW', 'JPY', 'THB', 'CNY']),
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  accountHolder: z.string().min(1),
  branchName: z.string().optional(),
});

const registerSchema = z
  .object({
    email: z.string().email(),
    /** 인증번호 확인 API가 발급한 가입 진행 증명 */
    emailProof: z.string().min(20),
    /** 닉네임·표시명 */
    name: z.string().min(1),
    /** 법적 영문 First / Last — 카드결제용, 가입 후 고객 변경 불가 */
    legalFirstName: z
      .string()
      .min(1)
      .regex(/^[A-Za-z][A-Za-z .'-]*$/, 'Legal first name must be English letters'),
    legalLastName: z
      .string()
      .min(1)
      .regex(/^[A-Za-z][A-Za-z .'-]*$/, 'Legal last name must be English letters'),
    phone: z.string().min(6),
    phoneCountryCode: z.string().min(1),
    /** 개인 한도 산정 국가 (JP/KR/TH/US/CN). 미입력 시 전화·IP로 추정 */
    limitCountry: z.enum(['JP', 'KR', 'TH', 'US', 'CN']).optional(),
    /** 공개 가입은 개인만. 기업은 관리자 등록만 */
    customerType: z.literal(CustomerType.INDIVIDUAL).default(CustomerType.INDIVIDUAL),
    referrerUserId: z.string().min(1).optional(),
    /** 가맹점 연락처로 찾은 경우 소개 가맹점. 추천자(수수료)가 아님 */
    introducedByUserId: z.string().min(1).optional(),
    /** 조직 가입링크 코드 (?org=) */
    inviteOrgCode: z.string().min(1).optional(),
    noReferrer: z.boolean().optional(),
    businessName: z.string().optional(),
    businessNumber: z.string().optional(),
    representative: z.string().optional(),
    businessAddress: z.string().optional(),
    businessCategory: z.string().optional(),
    bankAccounts: z.array(registerBankAccountSchema).min(1),
    walletAddress: z.string().min(1),
    walletNetwork: z.string().optional(),
    walletLabel: z.string().trim().min(1).max(40),
    wiseEnabled: z.boolean().optional(),
    remittanceProvider: z
      .enum([
        'WISE',
        'REMITLY',
        'WORLDREMIT',
        'REVOLUT',
        'WESTERN_UNION',
        'MONEYGRAM',
        'XOOM',
        'RIA',
        'OFX',
        'PAYONEER',
        'OTHER',
      ])
      .optional(),
    remittanceProviderOther: z.string().optional(),
    wiseSenderName: z.string().optional(),
    wiseSenderEmail: z.string().email().optional().or(z.literal('')),
    wiseSenderCountry: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.noReferrer) {
      if (d.referrerUserId || d.inviteOrgCode || d.introducedByUserId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'noReferrer cannot be combined with referrer',
        });
      }
    } else if (!d.referrerUserId && !d.inviteOrgCode && !d.introducedByUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'referrerUserId or inviteOrgCode is required',
      });
    }
    const remittanceOn = d.wiseEnabled === true || Boolean(d.remittanceProvider);
    if (remittanceOn) {
      if (!d.remittanceProvider) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['remittanceProvider'],
          message: 'Remittance provider is required',
        });
      }
      if (d.remittanceProvider === 'OTHER' && !d.remittanceProviderOther?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['remittanceProviderOther'],
          message: 'Remittance method name is required',
        });
      }
      if (!d.wiseSenderName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['wiseSenderName'],
          message: 'Remittance sender name is required',
        });
      }
      if (!d.wiseSenderEmail?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['wiseSenderEmail'],
          message: 'Remittance sender email is required',
        });
      }
      const senderCountry = String(d.wiseSenderCountry || d.limitCountry || '')
        .trim()
        .toUpperCase();
      if (!isAllowedRemittanceCountry(senderCountry)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['wiseSenderCountry'],
          message: 'Remittance sender country is not allowed',
        });
      }
    }
  });

router.get(
  '/register/referrer-search',
  asyncHandler(async (req, res) => {
    if (!(await hqPolicyService.isCustomerRegistrationEnabled())) {
      throw new AppError(403, 'Registration is disabled', 'REGISTRATION_DISABLED');
    }
    res.json({
      items: await searchReferrers({
        email: String(req.query.email ?? ''),
        phone: String(req.query.phone ?? ''),
        phoneCountryCode: String(req.query.phoneCountryCode ?? ''),
      }),
    });
  }),
);

router.get(
  '/register/invite-info',
  asyncHandler(async (req, res) => {
    const orgCode = String(req.query.org ?? '').trim() || undefined;
    const referrerUserId = String(req.query.ref ?? '').trim() || undefined;
    if (!orgCode && !referrerUserId) {
      throw new AppError(400, 'Invite org or ref is required', 'VALIDATION');
    }
    res.json(await getInvitePreview({ orgCode, referrerUserId }));
  }),
);

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.parse(req.body);
    const phoneCanon = canonicalizePhone(parsed.phoneCountryCode, parsed.phone);
    if (!phoneCanon) {
      throw new AppError(400, 'Phone number is invalid', 'VALIDATION');
    }
    const data = {
      ...parsed,
      email: normalizeEmail(parsed.email),
      phone: phoneCanon.phone,
      phoneCountryCode: phoneCanon.phoneCountryCode,
    };
    await assertIndividualRegisterAllowed({
      inviteOrgCode: data.inviteOrgCode,
      referrerUserId: data.referrerUserId,
      noReferrer: data.noReferrer,
    });

    if (data.customerType !== CustomerType.INDIVIDUAL) {
      throw new AppError(403, 'Corporate self-registration is disabled', 'CORPORATE_REGISTER_DISABLED');
    }

    await assertCustomerContactAvailable({
      email: data.email,
      phone: data.phone,
      phoneCountryCode: data.phoneCountryCode,
      customerType: CustomerType.INDIVIDUAL,
    });

    const proof = verifyRegisterEmailProof(data.emailProof);
    if (proof.email !== data.email) {
      throw new AppError(401, 'Email verification is required', 'EMAIL_NOT_VERIFIED');
    }
    const challenge = await prisma.emailVerificationChallenge.findUnique({
      where: { id: proof.challengeId },
    });
    if (
      !challenge ||
      challenge.purpose !== 'REGISTER' ||
      normalizeEmail(challenge.email) !== data.email ||
      !challenge.consumedAt
    ) {
      throw new AppError(401, 'Email verification is required', 'EMAIL_NOT_VERIFIED');
    }

    let recruitingOrgId: string;
    let referredByUserId: string | null = null;
    let introducedByUserId: string | null = null;
    if (data.noReferrer) {
      recruitingOrgId = await getHeadOfficeOrgId();
    } else if (data.introducedByUserId) {
      const resolved = await resolveRecruitingFromReferrer(data.introducedByUserId);
      if (!resolved.introducedByUserId) {
        throw new AppError(400, 'Introducer must be a merchant', 'REFERRER_INVALID');
      }
      recruitingOrgId = resolved.recruitingOrgId;
      introducedByUserId = resolved.introducedByUserId;
      referredByUserId = resolved.referredByUserId;
      if (data.referrerUserId && data.referrerUserId !== introducedByUserId) {
        const staff = await prisma.user.findFirst({
          where: {
            id: data.referrerUserId,
            role: UserRole.ORG_STAFF,
            organizationId: recruitingOrgId,
            isActive: true,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (staff) referredByUserId = staff.id;
      }
    } else if (data.inviteOrgCode) {
      const resolved = await resolveRecruitingFromOrgCode(data.inviteOrgCode);
      recruitingOrgId = resolved.recruitingOrgId;
      referredByUserId = resolved.referredByUserId;
      if (data.referrerUserId) {
        const staff = await prisma.user.findFirst({
          where: {
            id: data.referrerUserId,
            role: UserRole.ORG_STAFF,
            organizationId: recruitingOrgId,
            isActive: true,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (staff) {
          referredByUserId = staff.id;
        } else {
          const asMerchant = await resolveRecruitingFromReferrer(data.referrerUserId).catch(() => null);
          if (asMerchant?.introducedByUserId && asMerchant.recruitingOrgId === recruitingOrgId) {
            introducedByUserId = asMerchant.introducedByUserId;
          }
        }
      }
    } else {
      const resolved = await resolveRecruitingFromReferrer(data.referrerUserId!);
      recruitingOrgId = resolved.recruitingOrgId;
      referredByUserId = resolved.referredByUserId;
      introducedByUserId = resolved.introducedByUserId;
    }

    for (const linkedId of [referredByUserId, introducedByUserId]) {
      if (!linkedId) continue;
      const linked = await prisma.user.findUnique({
        where: { id: linkedId },
        select: { email: true },
      });
      if (linked && normalizeEmail(linked.email) === data.email) {
        throw new AppError(400, 'Cannot refer yourself', 'REFERRER_INVALID');
      }
    }

    const org = await prisma.organization.findFirst({
      where: { id: recruitingOrgId, isActive: true, deletedAt: null },
    });
    if (!org) {
      throw new AppError(404, 'Recruiting organization not found', 'NOT_FOUND');
    }

    const initialPassword = initialPasswordFromEmail(data.email);
    const passwordHash = await bcrypt.hash(initialPassword, 10);
    const hqFees = await import('../services/transaction-fee.service').then((m) =>
      m.getHqTransactionFees(),
    );
    const signupIp = clientIpFromRequest(req);
    const signupCountry = clientCountryFromRequest(req);
    const limitCountry = resolveLimitCountryForRegister({
      limitCountry: data.limitCountry,
      phoneCountryCode: data.phoneCountryCode,
      signupCountry,
    });

    const legalFirst = data.legalFirstName.trim().replace(/\s+/g, ' ');
    const legalLast = data.legalLastName.trim().replace(/\s+/g, ' ');
    const legalFull = `${legalFirst} ${legalLast}`.trim();

    const created = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        legalFirstName: legalFirst,
        legalLastName: legalLast,
        phone: data.phone,
        phoneCountryCode: data.phoneCountryCode,
        role: UserRole.CUSTOMER,
        passwordMustChange: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        customerProfile: {
          create: {
            customerType: data.customerType,
            approvalStatus:
              data.customerType === CustomerType.INDIVIDUAL
                ? CustomerApprovalStatus.PENDING
                : CustomerApprovalStatus.APPROVED,
            recruitingOrgId,
            referredByUserId,
            introducedByUserId,
            limitCountry,
            signupIp,
            signupCountry,
            businessName: data.businessName,
            businessNumber: data.businessNumber,
            representative: data.representative,
            businessAddress: data.businessAddress,
            businessCategory: data.businessCategory,
            wiseEnabled: Boolean(data.remittanceProvider) || data.wiseEnabled === true,
            remittanceProvider: data.remittanceProvider || null,
            remittanceProviderOther:
              data.remittanceProvider === 'OTHER'
                ? data.remittanceProviderOther?.trim() || null
                : null,
            wiseSenderName: data.remittanceProvider ? legalFull : null,
            wiseSenderEmail: data.remittanceProvider
              ? data.wiseSenderEmail?.trim().toLowerCase() || null
              : null,
            wiseSenderCountry: data.remittanceProvider
              ? String(data.wiseSenderCountry || data.limitCountry || '')
                  .trim()
                  .toUpperCase() || null
              : null,
          },
        },
        bankAccounts: {
          create: data.bankAccounts.map((acct, index) => ({
            currency: acct.currency,
            bankName: acct.bankName.trim(),
            accountNumber: acct.accountNumber.trim(),
            accountHolder: acct.accountHolder.trim(),
            branchName: acct.branchName?.trim() || null,
            isDefault: index === 0,
          })),
        },
        wallets: {
          create: {
            label: data.walletLabel.trim().slice(0, 40),
            address: data.walletAddress.trim(),
            network: data.walletNetwork?.trim() || 'TRC20',
            isDefault: true,
            hqRegistered: true,
            approvalStatus: 'APPROVED',
            fxFeePercent: hqFees.fxFeePercent,
            gasFeeAmount: 0,
            transferFeeAmount: hqFees.transferFeeUsdt,
            otherFeeAmount: hqFees.otherFeeUsdt,
          },
        },
      },
      select: { id: true, customerProfile: { select: { id: true } } },
    });
    if (created.customerProfile?.id) {
      const { customerFeePolicyService } = await import('../services/customer-fee-policy.service');
      await customerFeePolicyService.seedDefaultPoliciesForCustomer(
        created.customerProfile.id,
        created.id,
      );
    }
    const { rememberApprovedAddress } = await import('../services/wallet-policy.service');
    await rememberApprovedAddress(
      created.id,
      data.walletNetwork?.trim() || 'TRC20',
      data.walletAddress.trim(),
    );

    res.status(201).json({
      ok: true,
      message: 'Registration complete. Log in with your initial password and change it.',
      initialPasswordHint: `${initialPasswordFromEmail(data.email).replace(/./g, '*').slice(0, 3)}...`,
    });
  }),
);

router.get(
  '/dashboard',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = req.user!;

    if (user.role === UserRole.SUPER_ADMIN) {
      const [usdtPending, escrowPending, usdtCompleted, escrowCompleted, totalLedger] =
        await Promise.all([
          prisma.usdtPurchaseDetail.count({
            where: {
              status: {
                in: [
                  UsdtPurchaseStatus.ADMIN_REVIEWING,
                  UsdtPurchaseStatus.TRANSFER_IN_PROGRESS,
                ],
              },
            },
          }),
          prisma.tradeEscrowDetail.count({
            where: {
              status: {
                in: [
                  TradeEscrowStatus.ESCROW_CREATED,
                  TradeEscrowStatus.SELLER_ACCEPTED,
                  TradeEscrowStatus.CONTRACT_CONFIRMED,
                  TradeEscrowStatus.BUYER_DEPOSIT_PROOF,
                  TradeEscrowStatus.SHIPPING_STARTED,
                  TradeEscrowStatus.ADMIN_DEPOSIT_CONFIRMED,
                  TradeEscrowStatus.SELLER_FULFILLMENT_PROOF,
                  TradeEscrowStatus.BUYER_FINAL_APPROVAL,
                  TradeEscrowStatus.PAYOUT_SCHEDULED,
                  TradeEscrowStatus.DISPUTED,
                ],
              },
            },
          }),
          prisma.usdtPurchaseDetail.count({
            where: { status: UsdtPurchaseStatus.COMPLETED },
          }),
          prisma.tradeEscrowDetail.count({
            where: { status: TradeEscrowStatus.ESCROW_COMPLETED },
          }),
          prisma.ledgerEntry.aggregate({ _sum: { amount: true } }),
        ]);

      res.json({
        role: user.role,
        stats: {
          usdtPendingReview: usdtPending,
          escrowPending,
          usdtCompleted,
          escrowCompleted,
          totalCommissionPaid: Number(totalLedger._sum.amount ?? 0),
        },
      });
      return;
    }

    if (user.role === UserRole.ORG_STAFF && user.organizationId) {
      const { getOrgLedgerSummary } = await import('../services/commission.service');
      const ledger = await getOrgLedgerSummary(user.organizationId);
      const ticketFilter = {
        customer: {
          recruitingOrg: { path: { startsWith: user.organizationPath! } },
        },
      };

      const [usdtCount, escrowCount] = await Promise.all([
        prisma.transactionTicket.count({
          where: { ...ticketFilter, type: 'USDT_PURCHASE' },
        }),
        prisma.transactionTicket.count({
          where: { ...ticketFilter, type: 'TRADE_ESCROW' },
        }),
      ]);

      res.json({
        role: user.role,
        organizationId: user.organizationId,
        stats: {
          usdtTickets: usdtCount,
          escrowTickets: escrowCount,
          totalCommission: ledger.earnedUsdt ?? ledger.totalAmount,
          pendingCommission: ledger.pendingUsdt ?? 0,
          commissionCount: ledger.count,
          pendingCount: ledger.pendingCount ?? 0,
        },
      });
      return;
    }

    if (
      (user.role === UserRole.CUSTOMER || user.role === UserRole.CUSTOMER_OPERATOR) &&
      user.customerProfileId
    ) {
      const [usdtTickets, escrowTickets, wallets, usdtCompleted, escrowCompleted] = await Promise.all([
        prisma.transactionTicket.count({
          where: { customerId: user.customerProfileId, type: 'USDT_PURCHASE' },
        }),
        prisma.transactionTicket.count({
          where: {
            OR: [
              { customerId: user.customerProfileId, type: 'TRADE_ESCROW' },
              { tradeEscrow: { buyerId: user.merchantAdminUserId ?? user.id } },
              { tradeEscrow: { sellerId: user.merchantAdminUserId ?? user.id } },
            ],
          },
        }),
        prisma.wallet.count({
          where: {
            userId: user.role === UserRole.CUSTOMER_OPERATOR ? '__none__' : user.id,
            isActive: true,
          },
        }),
        prisma.usdtPurchaseDetail.count({
          where: {
            ticket: { customerId: user.customerProfileId },
            status: UsdtPurchaseStatus.COMPLETED,
          },
        }),
        prisma.tradeEscrowDetail.count({
          where: {
            status: TradeEscrowStatus.ESCROW_COMPLETED,
            OR: [
              { ticket: { customerId: user.customerProfileId } },
              { buyerId: user.merchantAdminUserId ?? user.id },
              { sellerId: user.merchantAdminUserId ?? user.id },
            ],
          },
        }),
      ]);

      res.json({
        role: user.role,
        stats: { usdtTickets, escrowTickets, wallets, usdtCompleted, escrowCompleted },
      });
      return;
    }

    res.json({ role: user.role, stats: {} });
  }),
);

export default router;

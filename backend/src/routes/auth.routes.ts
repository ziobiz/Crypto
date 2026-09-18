import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  CustomerType,
  UserRole,
  TradeEscrowStatus,
  UsdtPurchaseStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  activateTotp,
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
  createEmailVerificationChallenge,
  verifyEmailVerificationCode,
} from '../services/email-verification.service';
import {
  initialPasswordFromEmail,
  isInitialPassword,
  normalizeEmail,
} from '../lib/password-policy';
import { signFlowToken, signOtpToken, signStepUpToken, signToken, verifyFlowToken, verifyOtpToken } from '../lib/jwt';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';
import { hqPolicyService } from '../services/hq-policy.service';
import { findUserByLoginEmail } from '../services/user-lookup.service';
import { canIssueSensitiveOtp } from '../constants/hq-admin';
import { assertTurnstile, clientIp } from '../lib/turnstile';

const router = Router();

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

    const user = await findUserByLoginEmail(email);

    if (!user) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
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
    await sendOtpEnrollEmail(payload.sub);
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

router.post(
  '/register/send-code',
  asyncHandler(async (req, res) => {
    if (!(await hqPolicyService.isCustomerRegistrationEnabled())) {
      throw new AppError(403, 'Registration is disabled', 'REGISTRATION_DISABLED');
    }

    const { email, name } = z
      .object({ email: z.string().email(), name: z.string().min(1) })
      .parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'Email already registered', 'CONFLICT');
    }

    const cfg = await getEmailOtpConfig();
    await createEmailVerificationChallenge(email, 'REGISTER', cfg, name);
    res.json({ ok: true, smtpConfigured: isSmtpConfigured(cfg) });
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

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
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
      }),
      kycStatus,
      wallets,
    });
  }),
);

const registerBankAccountSchema = z.object({
  currency: z.enum(['KRW', 'JPY', 'THB', 'CNY']),
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  accountHolder: z.string().min(1),
  branchName: z.string().optional(),
});

const registerSchema = z.object({
  email: z.string().email(),
  emailCode: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().min(6),
  phoneCountryCode: z.string().min(1),
  customerType: z.nativeEnum(CustomerType),
  recruitingOrgId: z.string().min(1),
  businessName: z.string().optional(),
  businessNumber: z.string().optional(),
  representative: z.string().optional(),
  businessAddress: z.string().optional(),
  businessCategory: z.string().optional(),
  bankAccounts: z.array(registerBankAccountSchema).min(1),
  walletAddress: z.string().min(1),
  walletNetwork: z.string().optional(),
  walletLabel: z.string().optional(),
});

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    if (!(await hqPolicyService.isCustomerRegistrationEnabled())) {
      throw new AppError(403, 'Registration is disabled', 'REGISTRATION_DISABLED');
    }

    const parsed = registerSchema.parse(req.body);
    const data = { ...parsed, email: normalizeEmail(parsed.email) };

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, 'Email already registered', 'CONFLICT');
    }

    const emailOk = await verifyEmailVerificationCode(data.email, 'REGISTER', data.emailCode);
    if (!emailOk) {
      throw new AppError(401, 'Invalid email verification code', 'INVALID_OTP_CODE');
    }

    const org = await prisma.organization.findFirst({
      where: { id: data.recruitingOrgId, isActive: true },
    });
    if (!org) {
      throw new AppError(404, 'Recruiting organization not found', 'NOT_FOUND');
    }

    const initialPassword = initialPasswordFromEmail(data.email);
    const passwordHash = await bcrypt.hash(initialPassword, 10);
    const hqFees = await import('../services/transaction-fee.service').then((m) =>
      m.getHqTransactionFees(),
    );

    const created = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        phoneCountryCode: data.phoneCountryCode,
        role: UserRole.CUSTOMER,
        passwordMustChange: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        customerProfile: {
          create: {
            customerType: data.customerType,
            recruitingOrgId: data.recruitingOrgId,
            businessName: data.businessName,
            businessNumber: data.businessNumber,
            representative: data.representative,
            businessAddress: data.businessAddress,
            businessCategory: data.businessCategory,
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
            label: data.walletLabel?.trim() || '메인 USDT 지갑',
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

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { AttachmentPurpose, CustomerType, KycStatus, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import type { AuthUser } from '../types/auth';
import { isMerchantAdmin, isMerchantSide, merchantScopeUserId } from '../lib/merchant-role';
import { decodeMulterFilename } from './attachment.service';
import { getKycIdentityOtpHoldMinutes } from './otp.service';
import {
  decryptIdentityDocument,
  encryptIdentityDocument,
  isEncryptedIdentityDocument,
} from '../lib/kyc-id-crypto';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads');

const KYC_INCLUDE = {
  attachments: { orderBy: { createdAt: 'desc' as const } },
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      customerProfile: { select: { customerType: true, businessName: true } },
    },
  },
  reviewedBy: { select: { id: true, name: true, email: true } },
};

function serializeKyc(row: {
  id: string;
  userId: string;
  status: KycStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  rejectReason: string | null;
  hqNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  attachments: {
    id: string;
    purpose: AttachmentPurpose;
    fileName: string;
    mimeType: string;
    fileSize: number;
    createdAt: Date;
  }[];
  user?: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    customerProfile: { customerType: CustomerType; businessName: string | null } | null;
  };
  reviewedBy?: { id: string; name: string; email: string } | null;
}) {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    rejectReason: row.rejectReason,
    hqNote: row.hqNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reviewedBy: row.reviewedBy ?? null,
    user: row.user
      ? {
          id: row.user.id,
          email: row.user.email,
          name: row.user.name,
          isActive: row.user.isActive,
          customerType: row.user.customerProfile?.customerType ?? null,
          businessName: row.user.customerProfile?.businessName ?? null,
        }
      : undefined,
    attachments: row.attachments.map((a) => ({
      id: a.id,
      purpose: a.purpose,
      fileName: a.fileName,
      mimeType: a.mimeType,
      fileSize: a.fileSize,
      createdAt: a.createdAt,
    })),
  };
}

export async function getKycStatusForUser(userId: string): Promise<KycStatus> {
  const row = await prisma.customerKyc.findUnique({ where: { userId }, select: { status: true } });
  return row?.status ?? KycStatus.NOT_SUBMITTED;
}

export async function assertCustomerKycApproved(userId: string): Promise<void> {
  const status = await getKycStatusForUser(userId);
  if (status !== KycStatus.APPROVED) {
    throw new AppError(403, 'KYC verification required', 'KYC_REQUIRED');
  }
}

async function getOrCreateKyc(userId: string) {
  return prisma.customerKyc.upsert({
    where: { userId },
    create: { userId, status: KycStatus.NOT_SUBMITTED },
    update: {},
    include: KYC_INCLUDE,
  });
}

const IDENTITY_EXTS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.heic', '.heif']);

function safeIdentityFileName(original: string): string {
  const decoded = decodeMulterFilename(original).replace(/[\u0000-\u001f]/g, '').trim();
  const ext = path.extname(decoded).toLowerCase();
  const safeExt = IDENTITY_EXTS.has(ext) ? ext : '.pdf';
  const readable =
    decoded.length > 0 &&
    !decoded.includes('\uFFFD') &&
    !(/[ÃÂìíëêåä]/.test(decoded) && !/[\uAC00-\uD7A3\u3040-\u30ff\u4e00-\u9fff]/.test(decoded));
  if (!readable) return `identity-document${safeExt}`;
  return decoded.slice(0, 180);
}

async function sealIdentityAttachments(
  rows: { id: string; purpose: AttachmentPurpose; storageKey: string; fileName: string }[],
): Promise<void> {
  for (const att of rows) {
    if (att.purpose !== AttachmentPurpose.IDENTITY_VERIFICATION_DOC) continue;
    const fullPath = path.join(UPLOAD_DIR, att.storageKey);
    if (fs.existsSync(fullPath)) {
      const blob = fs.readFileSync(fullPath);
      if (!isEncryptedIdentityDocument(blob)) {
        try {
          fs.writeFileSync(fullPath, encryptIdentityDocument(blob));
        } catch (e) {
          if (!(e instanceof AppError) || e.code !== 'KYC_ID_KEY_MISSING') throw e;
        }
      }
    }
    const nextName = safeIdentityFileName(att.fileName);
    if (nextName !== att.fileName) {
      att.fileName = nextName;
      await prisma.customerKycAttachment.update({ where: { id: att.id }, data: { fileName: nextName } });
    }
  }
}

async function withIdentityOtpHold<T extends object>(row: T) {
  return { ...row, identityOtpHoldMinutes: await getKycIdentityOtpHoldMinutes() };
}

function hideIdentityFromMerchant<T extends { attachments: { purpose: AttachmentPurpose }[] }>(row: T): T {
  return {
    ...row,
    attachments: row.attachments.filter((a) => a.purpose !== AttachmentPurpose.IDENTITY_VERIFICATION_DOC),
  };
}

export async function getMyKyc(user: AuthUser) {
  if (!isMerchantSide(user)) {
    throw new AppError(403, 'Customers only', 'FORBIDDEN');
  }
  const row = await getOrCreateKyc(merchantScopeUserId(user));
  await sealIdentityAttachments(row.attachments);
  return hideIdentityFromMerchant(serializeKyc(row));
}

function assertIdentityFile(file: Express.Multer.File): void {
  const name = file.originalname.toLowerCase();
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  const mime = (file.mimetype || '').toLowerCase();
  const okMime =
    mime === 'application/pdf' ||
    mime.startsWith('image/') ||
    mime === 'application/octet-stream' ||
    mime === '';
  if (!IDENTITY_EXTS.has(ext) || !okMime) {
    throw new AppError(400, 'Identity document must be an image or PDF', 'KYC_IDENTITY_TYPE');
  }
}

export async function submitMyKyc(
  user: AuthUser,
  files: { forecast: Express.Multer.File[]; taxSupport: Express.Multer.File[]; identity: Express.Multer.File[] },
) {
  if (!isMerchantAdmin(user) || !user.customerProfileId) {
    throw new AppError(403, 'Customers only', 'FORBIDDEN');
  }
  const profile = await prisma.customerProfile.findUnique({
    where: { id: user.customerProfileId },
    select: { customerType: true },
  });
  if (!profile) throw new AppError(404, 'Customer profile not found', 'NOT_FOUND');

  const current = await getOrCreateKyc(user.id);
  if (current.status === KycStatus.APPROVED) {
    throw new AppError(400, 'KYC already approved', 'KYC_ALREADY_APPROVED');
  }
  if (current.status === KycStatus.PENDING) {
    throw new AppError(400, 'KYC already submitted', 'KYC_PENDING');
  }
  const corporate = profile.customerType === CustomerType.CORPORATE;
  if (corporate && files.forecast.length === 0) {
    throw new AppError(400, '6-month forecast report is required', 'VALIDATION_ERROR');
  }
  if (corporate && files.taxSupport.length === 0) {
    throw new AppError(400, 'Corporate tax documents are required', 'VALIDATION_ERROR');
  }
  if (!corporate && files.identity.length === 0) {
    throw new AppError(400, 'Identity document is required', 'KYC_IDENTITY_REQUIRED');
  }
  for (const file of files.identity) assertIdentityFile(file);

  ensureUploadDir();
  await prisma.customerKycAttachment.deleteMany({ where: { kycId: current.id } });
  if (corporate) {
    for (const file of files.forecast) {
      await saveKycFile(current.id, user.id, file, AttachmentPurpose.FUNDING_FORECAST_REPORT);
    }
    for (const file of files.taxSupport) {
      await saveKycFile(current.id, user.id, file, AttachmentPurpose.JP_TAX_SUPPORT_DOC);
    }
  }
  if (!corporate) {
    for (const file of files.identity) {
      await saveKycFile(current.id, user.id, file, AttachmentPurpose.IDENTITY_VERIFICATION_DOC);
    }
  }
  const updated = await prisma.customerKyc.update({
    where: { id: current.id },
    data: {
      status: KycStatus.PENDING,
      submittedAt: new Date(),
      rejectReason: null,
      reviewedAt: null,
      reviewedById: null,
    },
    include: KYC_INCLUDE,
  });
  await sealIdentityAttachments(updated.attachments);
  return hideIdentityFromMerchant(serializeKyc(updated));
}

export async function listKycCases(status?: KycStatus) {
  const rows = await prisma.customerKyc.findMany({
    where: status ? { status } : { status: { not: KycStatus.NOT_SUBMITTED } },
    include: KYC_INCLUDE,
    orderBy: [{ submittedAt: 'desc' }],
  });
  return rows.map(serializeKyc);
}

export async function getKycByUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      role: true,
      customerProfile: { select: { customerType: true, businessName: true } },
    },
  });
  if (!user || user.role !== UserRole.CUSTOMER) {
    throw new AppError(404, 'Customer not found', 'NOT_FOUND');
  }
  const row = await prisma.customerKyc.findUnique({
    where: { userId },
    include: KYC_INCLUDE,
  });
  if (!row) {
    return withIdentityOtpHold(serializeKyc({
      id: '',
      userId: user.id,
      status: KycStatus.NOT_SUBMITTED,
      submittedAt: null,
      reviewedAt: null,
      rejectReason: null,
      hqNote: null,
      createdAt: user ? new Date() : new Date(),
      updatedAt: new Date(),
      attachments: [],
      user,
      reviewedBy: null,
    }));
  }
  await sealIdentityAttachments(row.attachments);
  return withIdentityOtpHold(serializeKyc(row));
}

type KycReviewAction = 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REVOKE';

function kycStatusFor(action: KycReviewAction): KycStatus {
  if (action === 'APPROVE') return KycStatus.APPROVED;
  if (action === 'SUSPEND') return KycStatus.SUSPENDED;
  if (action === 'REVOKE') return KycStatus.REVOKED;
  return KycStatus.REJECTED;
}

function needsReviewReason(action: KycReviewAction): boolean {
  return action === 'REJECT' || action === 'SUSPEND' || action === 'REVOKE';
}

async function assertIndividualApprovedHold(userId: string, action: KycReviewAction, current: KycStatus | null) {
  if (action !== 'SUSPEND' && action !== 'REVOKE') return;
  const profile = await prisma.customerProfile.findFirst({
    where: { userId },
    select: { customerType: true },
  });
  if (profile?.customerType !== CustomerType.INDIVIDUAL) {
    throw new AppError(400, 'Only individual verification can be held or revoked', 'KYC_INDIVIDUAL_ONLY');
  }
  if (current !== KycStatus.APPROVED) {
    throw new AppError(400, 'Only an approved verification can be held or revoked', 'KYC_NOT_APPROVED');
  }
}

export async function reviewKycByUserId(
  admin: AuthUser,
  userId: string,
  action: KycReviewAction,
  reason?: string,
  hqNote?: string,
) {
  if (admin.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, 'HQ only', 'FORBIDDEN');
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user || user.role !== UserRole.CUSTOMER) {
    throw new AppError(404, 'Customer not found', 'NOT_FOUND');
  }
  if (needsReviewReason(action) && !reason?.trim()) {
    throw new AppError(400, 'Reason required', 'VALIDATION_ERROR');
  }
  const existing = await prisma.customerKyc.findUnique({ where: { userId } });
  await assertIndividualApprovedHold(userId, action, existing?.status ?? null);
  const updated = existing
    ? await prisma.customerKyc.update({
        where: { userId },
        data: {
          status: kycStatusFor(action),
          reviewedAt: new Date(),
          reviewedById: admin.id,
          rejectReason: needsReviewReason(action) ? reason!.trim() : null,
          hqNote: hqNote?.trim() || null,
        },
        include: KYC_INCLUDE,
      })
    : await prisma.customerKyc.create({
        data: {
          userId,
          status: kycStatusFor(action),
          submittedAt: null,
          reviewedAt: new Date(),
          reviewedById: admin.id,
          rejectReason: needsReviewReason(action) ? reason!.trim() : null,
          hqNote: hqNote?.trim() || null,
        },
        include: KYC_INCLUDE,
      });
  return withIdentityOtpHold(serializeKyc(updated));
}

export async function getKycCase(id: string) {
  const row = await prisma.customerKyc.findUnique({
    where: { id },
    include: KYC_INCLUDE,
  });
  if (!row) throw new AppError(404, 'KYC case not found', 'NOT_FOUND');
  await sealIdentityAttachments(row.attachments);
  return withIdentityOtpHold(serializeKyc(row));
}

export async function reviewKyc(
  admin: AuthUser,
  id: string,
  action: KycReviewAction,
  reason?: string,
  hqNote?: string,
) {
  if (admin.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, 'HQ only', 'FORBIDDEN');
  }
  const row = await prisma.customerKyc.findUnique({ where: { id } });
  if (!row) throw new AppError(404, 'KYC case not found', 'NOT_FOUND');
  if (action === 'APPROVE' && row.status === KycStatus.APPROVED) {
    throw new AppError(400, 'KYC already approved', 'KYC_ALREADY_APPROVED');
  }
  if (needsReviewReason(action) && !reason?.trim()) {
    throw new AppError(400, 'Reason required', 'VALIDATION_ERROR');
  }
  await assertIndividualApprovedHold(row.userId, action, row.status);

  const updated = await prisma.customerKyc.update({
    where: { id },
    data: {
      status: kycStatusFor(action),
      reviewedAt: new Date(),
      reviewedById: admin.id,
      rejectReason: needsReviewReason(action) ? reason!.trim() : null,
      hqNote: hqNote?.trim() || null,
    },
    include: KYC_INCLUDE,
  });
  return withIdentityOtpHold(serializeKyc(updated));
}

function readIdentityPlaintext(fullPath: string): Buffer {
  const blob = fs.readFileSync(fullPath);
  if (isEncryptedIdentityDocument(blob)) return decryptIdentityDocument(blob);
  try {
    fs.writeFileSync(fullPath, encryptIdentityDocument(blob));
  } catch (e) {
    if (!(e instanceof AppError) || e.code !== 'KYC_ID_KEY_MISSING') throw e;
  }
  return blob;
}

export async function getKycAttachmentPurpose(attachmentId: string): Promise<AttachmentPurpose | null> {
  const att = await prisma.customerKycAttachment.findUnique({
    where: { id: attachmentId },
    select: { purpose: true },
  });
  return att?.purpose ?? null;
}

export async function getKycAttachmentForDownload(user: AuthUser, attachmentId: string) {
  const att = await prisma.customerKycAttachment.findUnique({
    where: { id: attachmentId },
    include: { kyc: { select: { userId: true } } },
  });
  if (!att) throw new AppError(404, 'File not found', 'NOT_FOUND');
  if (att.purpose === AttachmentPurpose.IDENTITY_VERIFICATION_DOC) {
    throw new AppError(403, 'Identity documents open from HQ with OTP', 'KYC_IDENTITY_HQ_ONLY');
  }
  const isOwner = att.kyc.userId === user.id;
  const isHq = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ORG_STAFF;
  if (!isOwner && !isHq) {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }
  const fullPath = path.join(UPLOAD_DIR, att.storageKey);
  if (!fs.existsSync(fullPath)) {
    throw new AppError(404, 'File not found', 'NOT_FOUND');
  }
  return { path: fullPath, fileName: decodeMulterFilename(att.fileName), mimeType: att.mimeType };
}

export async function openIdentityDocumentForHq(user: AuthUser, attachmentId: string) {
  if (user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, 'Identity documents open from HQ with OTP', 'KYC_IDENTITY_HQ_ONLY');
  }
  const att = await prisma.customerKycAttachment.findUnique({ where: { id: attachmentId } });
  if (!att) throw new AppError(404, 'File not found', 'NOT_FOUND');
  if (att.purpose !== AttachmentPurpose.IDENTITY_VERIFICATION_DOC) {
    throw new AppError(400, 'Not an identity document', 'VALIDATION_ERROR');
  }
  const fullPath = path.join(UPLOAD_DIR, att.storageKey);
  if (!fs.existsSync(fullPath)) {
    throw new AppError(404, 'File not found', 'NOT_FOUND');
  }
  const fileName = safeIdentityFileName(att.fileName);
  if (fileName !== att.fileName) {
    await prisma.customerKycAttachment.update({ where: { id: att.id }, data: { fileName } });
  }
  return {
    buffer: readIdentityPlaintext(fullPath),
    fileName,
    mimeType: att.mimeType || 'application/pdf',
  };
}

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

async function saveKycFile(
  kycId: string,
  userId: string,
  file: Express.Multer.File,
  purpose: AttachmentPurpose,
) {
  const displayName =
    purpose === AttachmentPurpose.IDENTITY_VERIFICATION_DOC
      ? safeIdentityFileName(file.originalname)
      : decodeMulterFilename(file.originalname).replace(/[\u0000-\u001f]/g, '').trim().slice(0, 180) || 'document';
  const extRaw = path.extname(displayName).toLowerCase();
  const ext = purpose === AttachmentPurpose.IDENTITY_VERIFICATION_DOC
    ? (IDENTITY_EXTS.has(extRaw) ? extRaw : '.pdf')
    : extRaw;
  const storageKey = `kyc/${kycId}/${randomUUID()}${ext}`;
  const destPath = path.join(UPLOAD_DIR, storageKey);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const body =
    purpose === AttachmentPurpose.IDENTITY_VERIFICATION_DOC
      ? encryptIdentityDocument(file.buffer)
      : file.buffer;
  fs.writeFileSync(destPath, body);
  await prisma.customerKycAttachment.create({
    data: {
      kycId,
      purpose,
      fileName: displayName,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageKey,
      uploadedById: userId,
    },
  });
}

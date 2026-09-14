import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { AttachmentPurpose, CustomerType, KycStatus, UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import type { AuthUser } from '../types/auth';
import { isMerchantAdmin, isMerchantSide, merchantScopeUserId } from '../lib/merchant-role';

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

export async function getMyKyc(user: AuthUser) {
  if (!isMerchantSide(user)) {
    throw new AppError(403, 'Customers only', 'FORBIDDEN');
  }
  return serializeKyc(await getOrCreateKyc(merchantScopeUserId(user)));
}

export async function submitMyKyc(
  user: AuthUser,
  files: { forecast: Express.Multer.File[]; taxSupport: Express.Multer.File[] },
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
  if (files.forecast.length === 0) {
    throw new AppError(400, '6-month forecast report is required', 'VALIDATION_ERROR');
  }
  if (profile.customerType === CustomerType.CORPORATE && files.taxSupport.length === 0) {
    throw new AppError(400, 'Corporate tax documents are required', 'VALIDATION_ERROR');
  }

  ensureUploadDir();
  await prisma.customerKycAttachment.deleteMany({ where: { kycId: current.id } });
  for (const file of files.forecast) {
    await saveKycFile(current.id, user.id, file, AttachmentPurpose.FUNDING_FORECAST_REPORT);
  }
  for (const file of files.taxSupport) {
    await saveKycFile(current.id, user.id, file, AttachmentPurpose.JP_TAX_SUPPORT_DOC);
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
  return serializeKyc(updated);
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
    return serializeKyc({
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
    });
  }
  return serializeKyc(row);
}

export async function reviewKycByUserId(
  admin: AuthUser,
  userId: string,
  action: 'APPROVE' | 'REJECT',
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
  if (action === 'REJECT' && !reason?.trim()) {
    throw new AppError(400, 'Reject reason required', 'VALIDATION_ERROR');
  }
  const existing = await prisma.customerKyc.findUnique({ where: { userId } });
  const updated = existing
    ? await prisma.customerKyc.update({
        where: { userId },
        data: {
          status: action === 'APPROVE' ? KycStatus.APPROVED : KycStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedById: admin.id,
          rejectReason: action === 'REJECT' ? reason!.trim() : null,
          hqNote: hqNote?.trim() || null,
        },
        include: KYC_INCLUDE,
      })
    : await prisma.customerKyc.create({
        data: {
          userId,
          status: action === 'APPROVE' ? KycStatus.APPROVED : KycStatus.REJECTED,
          submittedAt: null,
          reviewedAt: new Date(),
          reviewedById: admin.id,
          rejectReason: action === 'REJECT' ? reason!.trim() : null,
          hqNote: hqNote?.trim() || null,
        },
        include: KYC_INCLUDE,
      });
  return serializeKyc(updated);
}

export async function getKycCase(id: string) {
  const row = await prisma.customerKyc.findUnique({
    where: { id },
    include: KYC_INCLUDE,
  });
  if (!row) throw new AppError(404, 'KYC case not found', 'NOT_FOUND');
  return serializeKyc(row);
}

export async function reviewKyc(
  admin: AuthUser,
  id: string,
  action: 'APPROVE' | 'REJECT',
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
  if (action === 'REJECT' && !reason?.trim()) {
    throw new AppError(400, 'Reject reason required', 'VALIDATION_ERROR');
  }

  const updated = await prisma.customerKyc.update({
    where: { id },
    data: {
      status: action === 'APPROVE' ? KycStatus.APPROVED : KycStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedById: admin.id,
      rejectReason: action === 'REJECT' ? reason!.trim() : null,
      hqNote: hqNote?.trim() || null,
    },
    include: KYC_INCLUDE,
  });
  return serializeKyc(updated);
}

export async function getKycAttachmentForDownload(user: AuthUser, attachmentId: string) {
  const att = await prisma.customerKycAttachment.findUnique({
    where: { id: attachmentId },
    include: { kyc: { select: { userId: true } } },
  });
  if (!att) throw new AppError(404, 'File not found', 'NOT_FOUND');
  const isOwner = att.kyc.userId === user.id;
  const isHq = user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ORG_STAFF;
  if (!isOwner && !isHq) {
    throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  }
  const fullPath = path.join(UPLOAD_DIR, att.storageKey);
  if (!fs.existsSync(fullPath)) {
    throw new AppError(404, 'File not found', 'NOT_FOUND');
  }
  return { path: fullPath, fileName: att.fileName, mimeType: att.mimeType };
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
  const ext = path.extname(file.originalname) || '';
  const storageKey = `kyc/${kycId}/${randomUUID()}${ext}`;
  const destPath = path.join(UPLOAD_DIR, storageKey);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, file.buffer);
  await prisma.customerKycAttachment.create({
    data: {
      kycId,
      purpose,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageKey,
      uploadedById: userId,
    },
  });
}

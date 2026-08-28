import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { AttachmentPurpose } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { AuthUser } from '../types/auth';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads');

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/** Multer often stores UTF-8 filenames as latin1 — recover when possible. */
export function decodeMulterFilename(originalname: string): string {
  if (!originalname) return originalname;
  try {
    const decoded = Buffer.from(originalname, 'latin1').toString('utf8');
    const looksMojibake = /Ã.|Â.|ì.|í.|ë.|ê.|å.|ä./.test(originalname);
    const decodedHasCjk = /[\u3000-\u9FFF\uAC00-\uD7A3]/.test(decoded);
    if (looksMojibake || decodedHasCjk) return decoded;
  } catch {
    /* keep original */
  }
  return originalname;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** e.g. 2026-08-27_143152 */
export function formatAttachmentTimestamp(d = new Date()): string {
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` +
    `_${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`
  );
}

function sanitizeEmailForFilename(email: string): string {
  const raw = (email || 'user').trim().toLowerCase();
  return raw.replace(/[^a-z0-9._@+-]/g, '_').slice(0, 80) || 'user';
}

/**
 * Forced English display names for USDT funding docs.
 * Certificate of Service Source_EMAIL_yyyy-MM-dd_HHmmss.ext
 * Deposit Receipt_EMAIL_yyyy-MM-dd_HHmmss.ext
 */
export function buildStandardAttachmentFileName(opts: {
  purpose: AttachmentPurpose;
  email: string;
  originalname: string;
  index?: number;
  at?: Date;
}): string | null {
  const ext = path.extname(decodeMulterFilename(opts.originalname)) || '';
  const email = sanitizeEmailForFilename(opts.email);
  const stamp = formatAttachmentTimestamp(opts.at ?? new Date());
  const idx =
    opts.index != null && opts.index > 0 ? `_${opts.index + 1}` : '';

  if (opts.purpose === AttachmentPurpose.SOURCE_OF_FUNDS_DOC) {
    return `Certificate of Service Source_${email}_${stamp}${idx}${ext}`;
  }
  if (opts.purpose === AttachmentPurpose.FIAT_DEPOSIT_RECEIPT) {
    return `Deposit Receipt_${email}_${stamp}${idx}${ext}`;
  }
  return null;
}

export async function saveAttachment(
  user: AuthUser,
  ticketId: string,
  file: Express.Multer.File,
  purpose: AttachmentPurpose,
  description?: string,
  options?: { displayFileName?: string; fileIndex?: number },
) {
  ensureUploadDir();

  const decodedOriginal = decodeMulterFilename(file.originalname);
  const ext = path.extname(decodedOriginal) || path.extname(file.originalname) || '';
  const storageKey = `${ticketId}/${randomUUID()}${ext}`;
  const destPath = path.join(UPLOAD_DIR, storageKey);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, file.buffer);

  const standardized =
    options?.displayFileName ??
    buildStandardAttachmentFileName({
      purpose,
      email: user.email,
      originalname: decodedOriginal,
      index: options?.fileIndex,
    });
  const fileName = standardized ?? decodedOriginal;

  const attachment = await prisma.attachment.create({
    data: {
      ticketId,
      purpose,
      fileName,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageKey,
      uploadedById: user.id,
      description,
    },
  });

  return {
    id: attachment.id,
    purpose: attachment.purpose,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    createdAt: attachment.createdAt,
  };
}

export function getAttachmentPath(storageKey: string): string {
  const fullPath = path.join(UPLOAD_DIR, storageKey);
  if (!fs.existsSync(fullPath)) {
    throw new AppError(404, 'File not found', 'NOT_FOUND');
  }
  return fullPath;
}

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

export async function saveAttachment(
  user: AuthUser,
  ticketId: string,
  file: Express.Multer.File,
  purpose: AttachmentPurpose,
  description?: string,
) {
  ensureUploadDir();

  const ext = path.extname(file.originalname) || '';
  const storageKey = `${ticketId}/${randomUUID()}${ext}`;
  const destPath = path.join(UPLOAD_DIR, storageKey);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, file.buffer);

  const attachment = await prisma.attachment.create({
    data: {
      ticketId,
      purpose,
      fileName: file.originalname,
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

import crypto from 'crypto';
import { AppError } from './errors';

const MAGIC = Buffer.from('TPID1');

function keyFromPassword(password: string, salt: Buffer): Buffer {
  return crypto.scryptSync(password, salt, 32);
}

function password(): string {
  const value = (process.env.KYC_ID_DOC_PASSWORD || '').trim();
  if (!value) {
    throw new AppError(503, 'Identity document encryption is not configured', 'KYC_ID_KEY_MISSING');
  }
  return value;
}

export function isEncryptedIdentityDocument(blob: Buffer): boolean {
  return blob.length >= MAGIC.length && blob.subarray(0, MAGIC.length).equals(MAGIC);
}

/** 개인 본인인증 서류만 저장 시 암호화. 키는 서버 환경변수에만 둔다. */
export function encryptIdentityDocument(plain: Buffer): Buffer {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = keyFromPassword(password(), salt);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([MAGIC, salt, iv, tag, encrypted]);
}

export function decryptIdentityDocument(blob: Buffer): Buffer {
  if (!isEncryptedIdentityDocument(blob) || blob.length < MAGIC.length + 16 + 12 + 16) {
    throw new AppError(500, 'Identity document is not encrypted', 'KYC_ID_DECRYPT_FAILED');
  }
  let offset = MAGIC.length;
  const salt = blob.subarray(offset, offset + 16);
  offset += 16;
  const iv = blob.subarray(offset, offset + 12);
  offset += 12;
  const tag = blob.subarray(offset, offset + 16);
  offset += 16;
  const data = blob.subarray(offset);
  const key = keyFromPassword(password(), salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(data), decipher.final()]);
  } catch {
    throw new AppError(500, 'Identity document could not be opened', 'KYC_ID_DECRYPT_FAILED');
  }
}

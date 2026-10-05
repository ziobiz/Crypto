import { ApiError } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

/** 이미 등록된 이메일·전화번호 묶음에 대한 경고 문구 */
export function contactTakenMessageKey(err: unknown): MessageKey | null {
  if (!(err instanceof ApiError)) return null;
  if (err.code === 'CONTACT_TAKEN') return 'auth.registerContactTaken';
  if (err.code === 'EMAIL_TAKEN' || err.code === 'CONFLICT') return 'auth.registerEmailTaken';
  if (err.code === 'PHONE_TAKEN') return 'auth.registerPhoneTaken';
  return null;
}

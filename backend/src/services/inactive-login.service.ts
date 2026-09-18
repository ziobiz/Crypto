import { UserManagementAction } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { hqPolicyService } from './hq-policy.service';
import {
  mergeInactiveLoginNoticeI18n,
  mergeInactiveNoticePresets,
  normalizeInactiveLoginLocale,
  parseInactivePresetReason,
  resolveInactiveLoginNotice,
  resolvePresetBody,
  type InactiveLoginLocale,
  type InactiveNoticePresetId,
} from '../constants/inactive-login-notice-i18n';

type DeactivateNoticeRow = {
  loginNotice: string | null;
  reason: string;
};

export type InactiveLoginNoticePayload = {
  /** 요청 로케일 기준 즉시 표시 문구 */
  message: string;
  /** 프리셋이면 ID, 아니면 null */
  presetId: InactiveNoticePresetId | null;
  /**
   * 로그인 화면 언어 전환용 다국어 맵.
   * 커스텀 단일 문구면 전 로케일에 동일 문구를 채움.
   */
  messages: Record<InactiveLoginLocale, string>;
};

/** 최근 비활성 로그의 로그인 안내 / 내부 사유 */
export async function getLatestDeactivateNotice(
  userId: string,
): Promise<DeactivateNoticeRow | null> {
  const log = await prisma.userManagementLog.findFirst({
    where: { userId, action: UserManagementAction.DEACTIVATE },
    orderBy: { createdAt: 'desc' },
    select: { loginNotice: true, reason: true },
  });
  return log ?? null;
}

function fillAllLocales(text: string): Record<InactiveLoginLocale, string> {
  return { KR: text, US: text, JP: text, CH: text, TH: text };
}

/**
 * 로그인 실패용 안내 페이로드 (다국어 맵 포함).
 * - 안내문구(loginNotice) 우선
 * - 비어 있으면 HQ 기본 안내
 * - 구버전: reason에 프리셋 마커만 있던 경우 호환
 * - 내부 변경사유(reason 일반 텍스트)는 로그인에 노출하지 않음
 */
export async function resolveInactiveLoginPayload(
  userId: string,
  localeHint?: string,
): Promise<InactiveLoginNoticePayload> {
  const row = await getLatestDeactivateNotice(userId);
  const platform = await hqPolicyService.getPlatformPayload();
  const locale = normalizeInactiveLoginLocale(localeHint);
  const presets = mergeInactiveNoticePresets(platform.config.inactiveLoginNoticePresets);
  const fallback = mergeInactiveLoginNoticeI18n(platform.config.inactiveLoginNoticeI18n);

  const rawNotice =
    row?.loginNotice?.trim() ||
    (row && parseInactivePresetReason(row.reason) ? row.reason.trim() : '') ||
    '';

  if (!rawNotice) {
    return {
      message: fallback[locale] || fallback.KR,
      presetId: null,
      messages: fallback,
    };
  }

  let presetId = parseInactivePresetReason(rawNotice);
  // 커스텀으로 저장된 문구가 프리셋 본문과 동일하면 프리셋으로 취급 → 언어 전환 가능
  if (!presetId) {
    for (const p of presets) {
      for (const loc of ['KR', 'US', 'JP', 'CH', 'TH'] as const) {
        if (p.bodyI18n[loc]?.trim() === rawNotice) {
          presetId = p.id;
          break;
        }
      }
      if (presetId) break;
    }
  }

  if (presetId) {
    const preset =
      presets.find((p) => p.id === presetId) ??
      mergeInactiveNoticePresets().find((p) => p.id === presetId)!;
    return {
      message: resolvePresetBody(presets, presetId, locale),
      presetId,
      messages: { ...preset.bodyI18n },
    };
  }

  // 커스텀 단일 문구 — 언어 전환 시에도 동일 문구 (작성 언어 그대로)
  return {
    message: rawNotice,
    presetId: null,
    messages: fillAllLocales(rawNotice),
  };
}

/** @deprecated 호환 — payload.message 사용 */
export async function resolveInactiveLoginMessage(
  userId: string,
  localeHint?: string,
): Promise<string> {
  const payload = await resolveInactiveLoginPayload(userId, localeHint);
  return payload.message;
}

/** 관리 이력 — 안내문구 표시용 */
export function formatLoginNoticeForDisplay(
  loginNotice: string | null | undefined,
  locale: string | undefined,
  presetsRaw?: Array<{
    id?: string;
    title?: string;
    bodyI18n?: Partial<Record<InactiveLoginLocale, string>>;
  }> | null,
): string {
  const text = loginNotice?.trim() ?? '';
  if (!text) return '';
  const presets = mergeInactiveNoticePresets(presetsRaw);
  const presetId = parseInactivePresetReason(text);
  if (!presetId) return text;
  const preset = presets.find((p) => p.id === presetId)!;
  const body = resolvePresetBody(presets, presetId, locale);
  return `[${preset.title}] ${body}`;
}

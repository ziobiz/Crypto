/** 비활성 로그인 안내 프리셋 (프론트 — 백엔드 기본값과 동기) */
export type InactiveNoticeLocale = 'KR' | 'US' | 'JP' | 'CH' | 'TH';

export const INACTIVE_NOTICE_PRESET_IDS = ['BASIC', 'INCONVENIENCE', 'WARNING'] as const;
export type InactiveNoticePresetId = (typeof INACTIVE_NOTICE_PRESET_IDS)[number];

export type InactiveNoticePreset = {
  id: InactiveNoticePresetId;
  title: string;
  bodyI18n: Record<InactiveNoticeLocale, string>;
};

export const INACTIVE_PRESET_REASON_PREFIX = '__INACTIVE_PRESET__:';

export const DEFAULT_INACTIVE_NOTICE_PRESETS: InactiveNoticePreset[] = [
  {
    id: 'BASIC',
    title: 'BASIC',
    bodyI18n: {
      KR: '현재 접속자가 많아 서비스 이용이 원활하지 않습니다. 잠시 후 다시 시도해 주시기 바랍니다.',
      US: 'High traffic is affecting service availability. Please try again shortly.',
      JP: '現在アクセスが集中しており、サービスをご利用いただけない場合があります。しばらくしてから再度お試しください。',
      CH: '当前访问人数较多，服务暂无法顺畅使用。请稍后再试。',
      TH: 'ผู้ใช้งานจำนวนมากทำให้ใช้บริการได้ไม่สะดวก กรุณาลองใหม่ในภายหลัง',
    },
  },
  {
    id: 'INCONVENIENCE',
    title: 'INCONVENIENCE',
    bodyI18n: {
      KR: '주요 서비스 업데이트 중으로 접속이 제한 됩니다. 잠시 후 이용 바랍니다.',
      US: 'Access is temporarily restricted due to a major service update. Please try again later.',
      JP: '主要サービスのアップデートのため、アクセスを制限しています。しばらくしてからご利用ください。',
      CH: '因主要服务更新，访问受限。请稍后再试。',
      TH: 'กำลังอัปเดตบริการหลัก การเข้าถึงถูกจำกัดชั่วคราว กรุณาลองใหม่ภายหลัง',
    },
  },
  {
    id: 'WARNING',
    title: 'WARNING',
    bodyI18n: {
      KR: '이 계정은 현재 이용이 중지되어 있습니다. 담당자 또는 고객센터로 문의해 주세요.',
      US: 'This account is currently deactivated. Please contact your representative or customer support.',
      JP: 'このアカウントは現在利用停止中です。担当者またはカスタマーセンターにお問い合わせください。',
      CH: '该账户目前已停用。请联系负责人或客服。',
      TH: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลหรือศูนย์บริการลูกค้า',
    },
  },
];

export function encodeInactivePresetReason(id: InactiveNoticePresetId): string {
  return `${INACTIVE_PRESET_REASON_PREFIX}${id}`;
}

export function parseInactivePresetReason(reason: string | null | undefined): InactiveNoticePresetId | null {
  const r = reason?.trim() ?? '';
  if (!r.startsWith(INACTIVE_PRESET_REASON_PREFIX)) return null;
  const id = r.slice(INACTIVE_PRESET_REASON_PREFIX.length) as InactiveNoticePresetId;
  return INACTIVE_NOTICE_PRESET_IDS.includes(id) ? id : null;
}

export function mergeInactiveNoticePresets(
  raw?: Array<{
    id?: string;
    title?: string;
    bodyI18n?: Partial<Record<InactiveNoticeLocale, string>>;
  }> | null,
): InactiveNoticePreset[] {
  return DEFAULT_INACTIVE_NOTICE_PRESETS.map((def) => {
    const found = raw?.find((r) => r?.id === def.id);
    const title = String(found?.title ?? def.title).trim() || def.title;
    const bodyI18n = { ...def.bodyI18n };
    if (found?.bodyI18n) {
      for (const loc of ['KR', 'US', 'JP', 'CH', 'TH'] as const) {
        const v = found.bodyI18n[loc]?.trim();
        if (v) bodyI18n[loc] = v;
      }
    }
    return { id: def.id, title, bodyI18n };
  });
}

export function formatInactiveReasonDisplay(
  reason: string,
  locale: InactiveNoticeLocale,
  presets?: InactiveNoticePreset[],
): string {
  const presetId = parseInactivePresetReason(reason);
  if (!presetId) return reason;
  const list = presets ?? DEFAULT_INACTIVE_NOTICE_PRESETS;
  const preset = list.find((p) => p.id === presetId) ?? DEFAULT_INACTIVE_NOTICE_PRESETS.find((p) => p.id === presetId)!;
  const body = preset.bodyI18n[locale] || preset.bodyI18n.KR;
  return `[${preset.title}] ${body}`;
}

/** 안내문구 표시 (프리셋 마커 → 제목+본문) */
export function formatLoginNoticeDisplay(
  loginNotice: string | null | undefined,
  locale: InactiveNoticeLocale,
  presets?: InactiveNoticePreset[],
): string {
  const text = loginNotice?.trim() ?? '';
  if (!text) return '';
  return formatInactiveReasonDisplay(text, locale, presets);
}

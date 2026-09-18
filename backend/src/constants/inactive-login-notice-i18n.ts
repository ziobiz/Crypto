/** 비활성 계정 로그인 안내 — 프리셋·기본 문구 (본사 사용자설정에서 수정 가능) */

export type InactiveLoginLocale = 'KR' | 'US' | 'JP' | 'CH' | 'TH';

export const INACTIVE_NOTICE_PRESET_IDS = ['BASIC', 'INCONVENIENCE', 'WARNING'] as const;
export type InactiveNoticePresetId = (typeof INACTIVE_NOTICE_PRESET_IDS)[number];

export type InactiveNoticePreset = {
  id: InactiveNoticePresetId;
  /** 표시용 제목 (BASIC / INCONVENIENCE / WARNING) */
  title: string;
  bodyI18n: Record<InactiveLoginLocale, string>;
};

/** 관리 로그 reason에 프리셋 선택 시 저장하는 마커 */
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

/** 사유 없음 시 폴백 — WARNING 본문과 동일 */
export const DEFAULT_INACTIVE_LOGIN_NOTICE_I18N: Record<InactiveLoginLocale, string> = {
  ...DEFAULT_INACTIVE_NOTICE_PRESETS.find((p) => p.id === 'WARNING')!.bodyI18n,
};

export function mergeInactiveLoginNoticeI18n(
  raw?: Partial<Record<InactiveLoginLocale, string>> | null,
): Record<InactiveLoginLocale, string> {
  const out = { ...DEFAULT_INACTIVE_LOGIN_NOTICE_I18N };
  if (!raw) return out;
  for (const loc of ['KR', 'US', 'JP', 'CH', 'TH'] as const) {
    const v = raw[loc]?.trim();
    if (v) out[loc] = v;
  }
  return out;
}

export function mergeInactiveNoticePresets(
  raw?: Array<{
    id?: string;
    title?: string;
    bodyI18n?: Partial<Record<InactiveLoginLocale, string>>;
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

export function encodeInactivePresetReason(id: InactiveNoticePresetId): string {
  return `${INACTIVE_PRESET_REASON_PREFIX}${id}`;
}

export function parseInactivePresetReason(reason: string | null | undefined): InactiveNoticePresetId | null {
  const r = reason?.trim() ?? '';
  if (!r.startsWith(INACTIVE_PRESET_REASON_PREFIX)) return null;
  const id = r.slice(INACTIVE_PRESET_REASON_PREFIX.length) as InactiveNoticePresetId;
  return INACTIVE_NOTICE_PRESET_IDS.includes(id) ? id : null;
}

export function normalizeInactiveLoginLocale(
  locale: InactiveLoginLocale | string | undefined,
): InactiveLoginLocale {
  const raw = String(locale ?? 'KR').trim();
  if (!raw) return 'KR';
  // Accept-Language: ja,en;q=0.9 → 첫 토큰
  const first = raw.split(',')[0]?.trim().split(';')[0]?.trim() ?? raw;
  const u = first.toUpperCase();
  if (u === 'KR' || u === 'KO' || u === 'KOR' || u.startsWith('KO')) return 'KR';
  if (u === 'JP' || u === 'JA' || u === 'JPN' || u.startsWith('JA')) return 'JP';
  if (u === 'US' || u === 'EN' || u.startsWith('EN')) return 'US';
  if (u === 'CH' || u === 'ZH' || u === 'CN' || u.startsWith('ZH')) return 'CH';
  if (u === 'TH' || u.startsWith('TH')) return 'TH';
  if ((['KR', 'US', 'JP', 'CH', 'TH'] as const).includes(u as InactiveLoginLocale)) {
    return u as InactiveLoginLocale;
  }
  return 'KR';
}

export function resolveInactiveLoginNotice(
  locale: InactiveLoginLocale | string | undefined,
  custom?: Partial<Record<InactiveLoginLocale, string>> | null,
): string {
  const loc = normalizeInactiveLoginLocale(locale);
  const merged = mergeInactiveLoginNoticeI18n(custom);
  return merged[loc] || merged.KR;
}

export function resolvePresetBody(
  presets: InactiveNoticePreset[],
  presetId: InactiveNoticePresetId,
  locale: InactiveLoginLocale | string | undefined,
): string {
  const loc = normalizeInactiveLoginLocale(locale);
  const preset = presets.find((p) => p.id === presetId) ?? DEFAULT_INACTIVE_NOTICE_PRESETS.find((p) => p.id === presetId)!;
  return preset.bodyI18n[loc] || preset.bodyI18n.KR;
}

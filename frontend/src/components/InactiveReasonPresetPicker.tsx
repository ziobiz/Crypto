'use client';

import { useT } from '@/context/LocaleProvider';
import {
  type InactiveNoticePreset,
  type InactiveNoticePresetId,
} from '@/lib/inactive-notice-presets';
import type { Locale } from '@/i18n/locales';

type Props = {
  presets: InactiveNoticePreset[];
  locale: Locale;
  selectedId: InactiveNoticePresetId | null;
  onSelect: (preset: InactiveNoticePreset) => void;
  onClearCustom?: () => void;
  disabled?: boolean;
};

/** 비활성 사유 빠른 선택 (BASIC / INCONVENIENCE / WARNING) */
export function InactiveReasonPresetPicker({
  presets,
  locale,
  selectedId,
  onSelect,
  disabled,
}: Props) {
  const t = useT();
  return (
    <div className="space-y-2">
      <p className="pg-hint text-xs">{t('users.loginNoticePresetHint')}</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            title={p.bodyI18n[locale] || p.bodyI18n.KR}
            onClick={() => onSelect(p)}
            className={`pg-btn text-xs ${
              selectedId === p.id ? 'pg-btn-primary' : 'pg-btn-secondary'
            } disabled:opacity-50`}
          >
            {p.title}
          </button>
        ))}
      </div>
    </div>
  );
}

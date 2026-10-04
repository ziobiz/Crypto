'use client';

import { useT } from '@/context/LocaleProvider';
import type { MemberGrade } from '@/lib/api';
import { MEMBER_GRADES } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

export const MEMBER_GRADE_STYLE: Record<
  MemberGrade,
  { panel: string; chip: string; select: string }
> = {
  STANDARD: {
    panel: 'border-slate-300 bg-slate-50',
    chip: 'bg-slate-200 text-slate-800',
    select: 'border-slate-300 bg-white text-slate-800',
  },
  PREMIUM: {
    panel: 'border-sky-400 bg-sky-50',
    chip: 'bg-sky-600 text-white',
    select: 'border-sky-400 bg-white text-sky-900',
  },
  VIP: {
    panel: 'border-emerald-500 bg-emerald-50',
    chip: 'bg-emerald-600 text-white',
    select: 'border-emerald-500 bg-white text-emerald-900',
  },
  VVIP: {
    panel: 'border-amber-400 bg-amber-50',
    chip: 'bg-amber-500 text-amber-950',
    select: 'border-amber-400 bg-white text-amber-950',
  },
  PRESTIGE: {
    panel: 'border-rose-400 bg-rose-50',
    chip: 'bg-rose-600 text-white',
    select: 'border-rose-400 bg-white text-rose-900',
  },
  BLACK: {
    panel: 'border-amber-500 bg-neutral-900',
    chip: 'border border-amber-500 bg-neutral-950 text-amber-300',
    select: 'border-amber-500 bg-neutral-900 text-amber-100',
  },
};

export function normalizeMemberGradeUi(raw?: string | null): MemberGrade {
  const v = String(raw ?? 'STANDARD').toUpperCase();
  if ((MEMBER_GRADES as readonly string[]).includes(v)) return v as MemberGrade;
  return 'STANDARD';
}

/** 목록용 2글자 코드: ST / PR / VI / VV / PR / BL */
export const MEMBER_GRADE_CODE: Record<MemberGrade, string> = {
  STANDARD: 'ST',
  PREMIUM: 'PR',
  VIP: 'VI',
  VVIP: 'VV',
  PRESTIGE: 'PR',
  BLACK: 'BL',
};

export function MemberGradeChip({ grade }: { grade?: string | null }) {
  const t = useT();
  const g = normalizeMemberGradeUi(grade);
  const style = MEMBER_GRADE_STYLE[g];
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${style.chip}`}>
      {t(`memberGrade.${g}` as MessageKey)}
    </span>
  );
}

/** 고객목록용 — 등급색 + 2글자 */
export function MemberGradeCodeChip({ grade }: { grade?: string | null }) {
  const t = useT();
  const g = normalizeMemberGradeUi(grade);
  const style = MEMBER_GRADE_STYLE[g];
  return (
    <span
      className={`inline-flex min-w-[1.75rem] items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide ${style.chip}`}
      title={t(`memberGrade.${g}` as MessageKey)}
    >
      {MEMBER_GRADE_CODE[g]}
    </span>
  );
}

type MemberGradeCardProps = {
  value?: string | null;
  onChange?: (next: MemberGrade) => void;
  disabled?: boolean;
  showHint?: boolean;
  compact?: boolean;
};

/** 고객 정보용 회원등급 카드 — 등급별 색상 */
export function MemberGradeCard({
  value,
  onChange,
  disabled,
  showHint = true,
  compact = false,
}: MemberGradeCardProps) {
  const t = useT();
  const grade = normalizeMemberGradeUi(value);
  const style = MEMBER_GRADE_STYLE[grade];
  const editable = typeof onChange === 'function';

  return (
    <div
      className={`rounded-lg border-2 ${style.panel} ${compact ? 'p-2' : 'p-3'} space-y-2`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={`text-xs font-semibold ${
            grade === 'BLACK' ? 'text-amber-200' : 'text-slate-800'
          }`}
        >
          {t('memberGrade.customer.title')}
        </p>
        <MemberGradeChip grade={grade} />
      </div>
      {showHint && (
        <p
          className={`text-[11px] leading-relaxed ${
            grade === 'BLACK' ? 'text-amber-200/80' : 'text-slate-600'
          }`}
        >
          {t('memberGrade.customer.hint')}
        </p>
      )}
      {editable && (
        <select
          className={`pg-input w-full text-xs font-medium ${style.select}`}
          disabled={disabled}
          value={grade}
          onChange={(e) => onChange(e.target.value as MemberGrade)}
        >
          {MEMBER_GRADES.map((g) => (
            <option key={g} value={g}>
              {t(`memberGrade.${g}` as MessageKey)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

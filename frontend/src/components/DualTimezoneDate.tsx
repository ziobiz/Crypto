'use client';

import {
  formatDualTimezoneLine,
  serviceCountryCode,
  timezoneCountryCode,
  type ServiceCountryKey,
} from '@/lib/reference-time';

/** 신청일·예상완료일: 상단 기준시간 / 하단 서비스기준시간 (본사설정 국가 변경 시 하단만 변경) */
export function DualTimezoneDate({
  value,
  baseTimezone,
  serviceTimezone,
  country,
  empty = '—',
}: {
  value: string | null | undefined;
  baseTimezone: string;
  serviceTimezone: string;
  country: ServiceCountryKey;
  empty?: string;
}) {
  if (!value) {
    return <span className="text-slate-400">{empty}</span>;
  }
  const baseCode = timezoneCountryCode(baseTimezone);
  const svcCode = serviceCountryCode(country, serviceTimezone);
  const top = formatDualTimezoneLine(value, baseCode, baseTimezone);
  const bottom = formatDualTimezoneLine(value, svcCode, serviceTimezone);

  return (
    <div className="flex flex-col gap-0.5 text-[11px] leading-snug tabular-nums">
      <span className="text-slate-800" title={baseTimezone}>
        {top}
      </span>
      <span className="text-sky-800" title={serviceTimezone}>
        {bottom}
      </span>
    </div>
  );
}

export function formatDualTimezonePlain(
  value: string | null | undefined,
  baseTimezone: string,
  serviceTimezone: string,
  country: ServiceCountryKey,
): string {
  if (!value) return '';
  const baseCode = timezoneCountryCode(baseTimezone);
  const svcCode = serviceCountryCode(country, serviceTimezone);
  return [
    formatDualTimezoneLine(value, baseCode, baseTimezone),
    formatDualTimezoneLine(value, svcCode, serviceTimezone),
  ]
    .filter(Boolean)
    .join(' / ');
}

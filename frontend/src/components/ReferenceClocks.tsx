'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { useBranding } from '@/hooks/useBranding';
import {
  formatInTimezone,
  readStoredServiceCountry,
  resolveServiceTimezone,
  writeStoredServiceCountry,
  type ServiceCountryKey,
} from '@/lib/reference-time';
import { LOCALES, type Locale } from '@/i18n/locales';
import type { MessageKey } from '@/i18n/messages';

export function useReferenceTimeState() {
  const branding = useBranding();
  const [now, setNow] = useState(() => new Date());
  const [country, setCountry] = useState<ServiceCountryKey>('');

  useEffect(() => {
    setCountry(readStoredServiceCountry());
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const baseTimezone = branding?.baseTimezone || 'Asia/Seoul';
  const hqServiceTimezone = branding?.serviceTimezone || 'Asia/Seoul';
  const serviceTimezone = resolveServiceTimezone(hqServiceTimezone, country);

  function setServiceCountry(next: ServiceCountryKey) {
    setCountry(next);
    writeStoredServiceCountry(next);
  }

  return {
    now,
    baseTimezone,
    serviceTimezone,
    hqServiceTimezone,
    country,
    setServiceCountry,
    ready: branding != null,
  };
}

/** Live clocks: 기준시간 + 서비스기준시간 */
export function ReferenceClocks({
  compact = false,
  country,
  serviceTimezone: serviceTimezoneProp,
  baseTimezone: baseTimezoneProp,
}: {
  compact?: boolean;
  /** When provided with serviceTimezone/baseTimezone, skips internal country state (parent-controlled) */
  country?: ServiceCountryKey;
  serviceTimezone?: string;
  baseTimezone?: string;
}) {
  const t = useT();
  const internal = useReferenceTimeState();
  const controlled = serviceTimezoneProp != null && baseTimezoneProp != null;

  const now = internal.now;
  const baseTimezone = controlled ? baseTimezoneProp! : internal.baseTimezone;
  const serviceTimezone = controlled
    ? serviceTimezoneProp!
    : resolveServiceTimezone(internal.hqServiceTimezone, country ?? internal.country);
  const ready = internal.ready;

  if (!ready) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${
        compact ? 'text-[11px] text-slate-600' : 'text-xs text-slate-700'
      }`}
    >
      <span>
        <span className="font-medium text-slate-800">{t('time.base')}:</span>{' '}
        <span className="font-mono tabular-nums">{formatInTimezone(now, baseTimezone)}</span>
        <span className="ml-1 text-slate-400">({baseTimezone})</span>
      </span>
      <span className="hidden text-slate-300 sm:inline">|</span>
      <span>
        <span className="font-medium text-slate-800">{t('time.service')}:</span>{' '}
        <span className="font-mono tabular-nums">{formatInTimezone(now, serviceTimezone)}</span>
        <span className="ml-1 text-slate-400">({serviceTimezone})</span>
      </span>
    </div>
  );
}

export function ServiceCountrySelect({
  value,
  onChange,
}: {
  value: ServiceCountryKey;
  onChange: (v: ServiceCountryKey) => void;
}) {
  const t = useT();
  return (
    <select
      className="pg-select border-sky-300 text-[11px] text-sky-900"
      value={value}
      onChange={(e) => onChange(e.target.value as ServiceCountryKey)}
      title={t('filter.hqSettings')}
    >
      <option value="">{t('filter.hqSettings')}</option>
      {(LOCALES as readonly Locale[]).map((loc) => (
        <option key={loc} value={loc}>
          {t(`time.country.${loc}` as MessageKey)}
        </option>
      ))}
    </select>
  );
}

'use client';

import { useLocale, useT } from '@/context/LocaleProvider';
import { CURRENT_LIVE_VERSION, PLATFORM_RELEASE_NOTES, localeFromApp } from '@/lib/manuals';

export default function HqPlatformUpdatesPage() {
  const t = useT();
  const { locale } = useLocale();
  const loc = localeFromApp(locale);

  return (
    <div className="pg-stack">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-blue-100 bg-blue-50/60 p-3">
        <div>
          <p className="text-[13px] font-bold text-gray-900">{t('hq.ops.updatesTitle')}</p>
          <p className="mt-1 text-[12px] text-gray-700">{t('hq.ops.updatesDesc')}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[12px] font-bold text-blue-800 shadow-sm">
          {t('manual.liveVersion', { version: CURRENT_LIVE_VERSION })}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-[12px] text-gray-600">
        <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1">
          {t('hq.ops.updatesMajorRule')}
        </span>
        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">
          {t('hq.ops.updatesMinorRule')}
        </span>
      </div>

      <div className="space-y-3">
        {PLATFORM_RELEASE_NOTES.map((rel) => {
          const items = rel.items[loc] ?? rel.items.KR;
          return (
            <article key={rel.version} className="pg-card overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-slate-50/80 px-4 py-2.5">
                <span className="rounded bg-blue-600 px-2 py-0.5 text-[12px] font-bold text-white">
                  V{rel.version}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                    rel.kind === 'major'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {rel.kind === 'major' ? t('hq.ops.updatesKindMajor') : t('hq.ops.updatesKindMinor')}
                </span>
                <span className="text-[11px] text-gray-500">{rel.date}</span>
              </div>
              <ul className="list-inside list-disc space-y-1.5 px-4 py-3 text-[13px] text-gray-800">
                {items.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}

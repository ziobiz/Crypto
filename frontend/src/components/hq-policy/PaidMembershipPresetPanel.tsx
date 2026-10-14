'use client';

import { useT } from '@/context/LocaleProvider';
import {
  PAID_MEMBERSHIP_PRESETS,
  PAID_MEMBERSHIP_PRESET_IDS,
  REFERENCE_GENERAL_EXPRESS_USDT,
  corporatePriceFromPreset,
  exampleLimitKrw,
  formatQuotaShort,
  includedExpressValueUsdt,
  type PaidMembershipPresetId,
} from '@/lib/paid-membership-presets';
import { PAID_MEMBER_GRADES, type PaidMemberGrade } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';

const PRESET_TITLE: Record<PaidMembershipPresetId, MessageKey> = {
  A: 'paidMembership.preset.A.title',
  B: 'paidMembership.preset.B.title',
  C: 'paidMembership.preset.C.title',
};

const PRESET_DESC: Record<PaidMembershipPresetId, MessageKey> = {
  A: 'paidMembership.preset.A.desc',
  B: 'paidMembership.preset.B.desc',
  C: 'paidMembership.preset.C.desc',
};

type Props = {
  applying: PaidMembershipPresetId | null;
  /** 현재 적용·저장된 프리셋 — 해당 카드만 하늘색 파스텔 */
  appliedId?: PaidMembershipPresetId | null;
  onApply: (id: PaidMembershipPresetId) => void;
};

export function PaidMembershipPresetPanel({ applying, appliedId, onApply }: Props) {
  const t = useT();

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{t('paidMembership.preset.title')}</h2>
        <p className="pg-hint text-xs mt-1">{t('paidMembership.preset.desc')}</p>
        <p className="pg-hint text-xs mt-1">{t('paidMembership.preset.limitRule')}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {PAID_MEMBERSHIP_PRESET_IDS.map((id) => {
          const p = PAID_MEMBERSHIP_PRESETS[id];
          const isApplied = appliedId === id;
          return (
            <div
              key={id}
              className={
                isApplied
                  ? 'flex flex-col gap-2 rounded-md border-2 border-sky-400 bg-sky-100 p-3 shadow-sm'
                  : 'flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3'
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={
                    isApplied
                      ? 'text-sm font-semibold text-sky-950'
                      : 'text-sm font-semibold text-slate-900'
                  }
                >
                  {t(PRESET_TITLE[id])}
                </div>
                {isApplied && (
                  <span className="shrink-0 rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {t('paidMembership.preset.appliedBadge')}
                  </span>
                )}
              </div>
              <p
                className={
                  isApplied
                    ? 'pg-hint text-xs flex-1 text-sky-900/85'
                    : 'pg-hint text-xs flex-1'
                }
              >
                {t(PRESET_DESC[id])}
              </p>
              <div
                className={
                  isApplied
                    ? 'text-[11px] text-sky-950 space-y-1'
                    : 'text-[11px] text-slate-600 space-y-1'
                }
              >
                <div
                  className={
                    isApplied
                      ? 'font-medium text-sky-800'
                      : 'font-medium text-slate-700'
                  }
                >
                  {t('paidMembership.preset.priceCol')}
                </div>
                {PAID_MEMBER_GRADES.map((g) => {
                  const incl = includedExpressValueUsdt(p.expressQuotas[g]);
                  return (
                    <div key={g} className="flex justify-between gap-2">
                      <span>{g}</span>
                      <span className="text-right">
                        ${p.annualPriceUsd[g]}
                        <span className={isApplied ? 'text-sky-700/70' : 'text-slate-400'}>
                          {' '}
                          /$
                          {corporatePriceFromPreset(p.annualPriceUsd[g], p.corporatePriceMult)}B
                        </span>
                        <span
                          className={
                            isApplied
                              ? 'block text-sky-700/70'
                              : 'block text-slate-400'
                          }
                        >
                          {t('paidMembership.preset.inclValue', { value: String(incl) })}
                        </span>
                      </span>
                    </div>
                  );
                })}
                <div
                  className={
                    isApplied
                      ? 'font-medium text-sky-800 pt-1'
                      : 'font-medium text-slate-700 pt-1'
                  }
                >
                  {t('paidMembership.preset.quotaCol')}
                </div>
                {PAID_MEMBER_GRADES.map((g) => (
                  <div key={`q-${g}`} className="flex justify-between gap-2">
                    <span>{g}</span>
                    <span className="text-right max-w-[55%] break-words">
                      {formatQuotaShort(p.expressQuotas[g])}
                    </span>
                  </div>
                ))}
                <div
                  className={
                    isApplied
                      ? 'font-medium text-sky-800 pt-1'
                      : 'font-medium text-slate-700 pt-1'
                  }
                >
                  {t('paidMembership.preset.discountCol')}
                </div>
                {PAID_MEMBER_GRADES.map((g) => (
                  <div key={`d-${g}`} className="flex justify-between gap-2">
                    <span>{g}</span>
                    <span>
                      {p.expressDiscountPercent[g]}%
                      {p.expressDiscountUsdt[g] > 0
                        ? ` −${p.expressDiscountUsdt[g]}U`
                        : ''}
                    </span>
                  </div>
                ))}
                <div
                  className={
                    isApplied
                      ? 'font-medium text-sky-800 pt-1'
                      : 'font-medium text-slate-700 pt-1'
                  }
                >
                  {t('paidMembership.preset.limitCol')}
                </div>
                {PAID_MEMBER_GRADES.map((g: PaidMemberGrade) => {
                  const ex = exampleLimitKrw(id, g);
                  return (
                    <div key={`l-${g}`} className="flex justify-between gap-2">
                      <span>
                        {g} ×{p.limitPerTxMult[g]}
                      </span>
                      <span className="text-right">
                        {(ex.perTx / 1_000_000).toFixed(1)}M / 일
                        {(ex.daily / 1_000_000).toFixed(0)}M
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className={
                  isApplied
                    ? 'pg-btn text-xs mt-1 bg-sky-600 text-white hover:bg-sky-700 border-sky-700'
                    : 'pg-btn pg-btn-primary text-xs mt-1'
                }
                disabled={applying != null}
                onClick={() => onApply(id)}
              >
                {applying === id
                  ? t('hq.saving')
                  : isApplied
                    ? t('paidMembership.preset.reapply', { id })
                    : t('paidMembership.preset.apply', { id })}
              </button>
            </div>
          );
        })}
      </div>

      <details className="text-xs text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-700">
          {t('paidMembership.preset.refExpressTitle')}
        </summary>
        <p className="mt-1 pg-hint">{t('paidMembership.preset.refExpressDesc')}</p>
        <ul className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-1">
          {Object.entries(REFERENCE_GENERAL_EXPRESS_USDT).map(([tier, fee]) => (
            <li key={tier}>
              {tier}: {fee} USDT
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

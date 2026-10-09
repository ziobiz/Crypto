'use client';

import { Fragment } from 'react';
import { useT } from '@/context/LocaleProvider';
import type {
  ExpressTier,
  HqMemberGradeCustomerTypePolicy,
  HqMemberGradePolicy,
  MemberGrade,
  MemberGradeExpressBenefit,
} from '@/lib/api';
import { EXPRESS_TIERS, MEMBER_GRADES, defaultMemberGradePolicy } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { CUSTOMER_TYPES_UI_ORDER } from '@/constants/ui-display-order';

const CUSTOMER_TYPES = CUSTOMER_TYPES_UI_ORDER;
type CustomerTypeKey = (typeof CUSTOMER_TYPES)[number];

type MemberGradePolicyEditorProps = {
  value: HqMemberGradePolicy;
  onChange: (next: HqMemberGradePolicy) => void;
};

function gradeLabelKey(grade: MemberGrade): MessageKey {
  return `memberGrade.${grade}` as MessageKey;
}

function typeLabelKey(type: CustomerTypeKey): MessageKey {
  return type === 'INDIVIDUAL'
    ? 'hq.commission.limitsIndividual'
    : 'hq.commission.limitsCorporate';
}

function emptyBenefit(): MemberGradeExpressBenefit {
  return defaultMemberGradePolicy().INDIVIDUAL.grades.STANDARD;
}

function emptyTypePolicy(): HqMemberGradeCustomerTypePolicy {
  return defaultMemberGradePolicy().INDIVIDUAL;
}

function parseNonNeg(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function MemberGradePolicyEditor({ value, onChange }: MemberGradePolicyEditorProps) {
  const t = useT();

  function typePolicy(type: CustomerTypeKey): HqMemberGradeCustomerTypePolicy {
    const bucket = value[type] ?? emptyTypePolicy();
    return {
      grades: { ...emptyTypePolicy().grades, ...bucket.grades },
    };
  }

  function benefitOf(type: CustomerTypeKey, grade: MemberGrade): MemberGradeExpressBenefit {
    const b = typePolicy(type).grades[grade] ?? emptyBenefit();
    return {
      ...emptyBenefit(),
      ...b,
      tierFees: { ...emptyBenefit().tierFees, ...b.tierFees },
      tierFeePercents: { ...emptyBenefit().tierFeePercents, ...b.tierFeePercents },
    };
  }

  function patchGrade(
    type: CustomerTypeKey,
    grade: MemberGrade,
    next: Partial<MemberGradeExpressBenefit>,
  ) {
    const current = benefitOf(type, grade);
    const bucket = typePolicy(type);
    onChange({
      ...value,
      [type]: {
        grades: {
          ...bucket.grades,
          [grade]: { ...current, ...next },
        },
      },
    });
  }

  function setTierOverride(
    type: CustomerTypeKey,
    grade: MemberGrade,
    tier: ExpressTier,
    field: 'tierFees' | 'tierFeePercents',
    raw: string,
  ) {
    const current = benefitOf(type, grade);
    patchGrade(type, grade, {
      [field]: {
        ...current[field],
        [tier]: parseNonNeg(raw),
      },
    });
  }

  return (
    <div className="space-y-3">
      <div className="pg-card-head">{t('memberGrade.hq.title')}</div>
      <p className="pg-hint text-xs">{t('memberGrade.hq.desc')}</p>
      <p className="pg-hint text-xs text-sky-800">{t('memberGrade.hq.tableHint')}</p>

      {/* 기존 매트릭스 표 방식 유지 · 법인 위 / 개인 아래 */}
      <div className="space-y-6">
        {CUSTOMER_TYPES.map((type) => (
          <section key={type} className="space-y-2">
            <p className="pg-inset-title text-sm">{t(typeLabelKey(type))}</p>
            <div className="pg-card pg-table-wrap overflow-x-auto">
              <table className="pg-table text-xs">
                <thead>
                  <tr>
                    <th
                      rowSpan={2}
                      className="sticky left-0 z-10 bg-[var(--pg-surface,white)] whitespace-nowrap"
                    >
                      {t('memberGrade.customer.title')}
                    </th>
                    {EXPRESS_TIERS.map((tier) => (
                      <th key={tier} colSpan={2} className="whitespace-nowrap font-mono text-center">
                        {tier}
                      </th>
                    ))}
                    <th rowSpan={2} className="whitespace-nowrap">
                      {t('memberGrade.discountPercent')}
                    </th>
                    <th rowSpan={2} className="whitespace-nowrap">
                      {t('memberGrade.discountUsdt')}
                    </th>
                  </tr>
                  <tr>
                    {EXPRESS_TIERS.map((tier) => (
                      <Fragment key={`${type}-${tier}-sub`}>
                        <th className="whitespace-nowrap font-normal">{t('hq.commission.unitCrypto')}</th>
                        <th className="whitespace-nowrap font-normal">%</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MEMBER_GRADES.map((grade) => {
                    const benefit = benefitOf(type, grade);
                    return (
                      <tr key={`${type}-${grade}`}>
                        <td className="sticky left-0 z-10 bg-[var(--pg-surface,white)] whitespace-nowrap font-medium">
                          {t(gradeLabelKey(grade))}
                        </td>
                        {EXPRESS_TIERS.map((tier) => {
                          const fee = benefit.tierFees[tier];
                          const pct = benefit.tierFeePercents[tier];
                          return (
                            <Fragment key={`${type}-${grade}-${tier}`}>
                              <td>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="pg-input w-16 text-xs"
                                  placeholder={t('memberGrade.followExpress')}
                                  defaultValue={fee == null ? '' : String(fee)}
                                  key={`${type}-${grade}-${tier}-f-${fee ?? 'empty'}`}
                                  onBlur={(e) =>
                                    setTierOverride(type, grade, tier, 'tierFees', e.target.value)
                                  }
                                  title={t('memberGrade.hq.overrideHint')}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="pg-input w-14 text-xs"
                                  placeholder={t('memberGrade.followExpress')}
                                  defaultValue={pct == null ? '' : String(pct)}
                                  key={`${type}-${grade}-${tier}-p-${pct ?? 'empty'}`}
                                  onBlur={(e) =>
                                    setTierOverride(
                                      type,
                                      grade,
                                      tier,
                                      'tierFeePercents',
                                      e.target.value,
                                    )
                                  }
                                  title={t('memberGrade.hq.overrideHint')}
                                />
                              </td>
                            </Fragment>
                          );
                        })}
                        <td>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            className="pg-input w-16 text-xs"
                            value={benefit.discountPercent}
                            onChange={(e) =>
                              patchGrade(type, grade, {
                                discountPercent: Math.min(
                                  100,
                                  Math.max(0, Number(e.target.value) || 0),
                                ),
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            className="pg-input w-16 text-xs"
                            value={benefit.discountUsdt}
                            onChange={(e) =>
                              patchGrade(type, grade, {
                                discountUsdt: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
      <p className="pg-hint text-xs">{t('memberGrade.hq.discountHint')}</p>
    </div>
  );
}

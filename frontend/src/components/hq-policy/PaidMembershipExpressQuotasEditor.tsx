'use client';

import { useT } from '@/context/LocaleProvider';
import {
  EXPRESS_QUOTA_TIERS,
  PAID_MEMBER_GRADES,
  formatMemberGradeDisplayCode,
  type ExpressQuotaTier,
  type PaidMemberGrade,
  type PaidMembershipExpressQuotasPolicy,
} from '@/lib/api';
import { CUSTOMER_TYPES_UI_ORDER } from '@/constants/ui-display-order';

type Props = {
  value: PaidMembershipExpressQuotasPolicy;
  onChange: (next: PaidMembershipExpressQuotasPolicy) => void;
};

export function PaidMembershipExpressQuotasEditor({ value, onChange }: Props) {
  const t = useT();

  function setCell(
    type: 'INDIVIDUAL' | 'CORPORATE',
    grade: PaidMemberGrade,
    tier: ExpressQuotaTier,
    raw: string,
  ) {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    onChange({
      ...value,
      [type]: {
        ...value[type],
        [grade]: {
          ...value[type][grade],
          [tier]: n,
        },
      },
    });
  }

  return (
    <div className="space-y-3">
      <div className="pg-card-head">{t('paidMembership.quota.title')}</div>
      <p className="pg-hint text-xs">{t('paidMembership.quota.desc')}</p>
      <div className="space-y-6">
        {CUSTOMER_TYPES_UI_ORDER.map((type) => (
          <section key={type} className="space-y-2">
            <p className="pg-inset-title text-sm">
              {t(
                type === 'INDIVIDUAL'
                  ? 'hq.commission.limitsIndividual'
                  : 'hq.commission.limitsCorporate',
              )}
            </p>
            <div className="pg-card pg-table-wrap overflow-x-auto">
              <table className="pg-table text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-[var(--pg-surface,white)] whitespace-nowrap">
                      {t('memberGrade.customer.title')}
                    </th>
                    {EXPRESS_QUOTA_TIERS.map((tier) => (
                      <th key={tier} className="whitespace-nowrap font-mono text-center">
                        {tier}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PAID_MEMBER_GRADES.map((grade) => (
                    <tr key={`${type}-${grade}`}>
                      <td className="sticky left-0 z-10 bg-[var(--pg-surface,white)] whitespace-nowrap font-medium">
                        {formatMemberGradeDisplayCode(grade, type)}
                      </td>
                      {EXPRESS_QUOTA_TIERS.map((tier) => (
                        <td key={tier}>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            className="pg-input w-16 text-xs"
                            value={Number(value[type][grade]?.[tier] ?? 0)}
                            onChange={(e) => setCell(type, grade, tier, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

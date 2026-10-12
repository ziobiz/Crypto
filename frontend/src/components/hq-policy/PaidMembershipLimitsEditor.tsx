'use client';

import { useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { FEE_CURRENCIES, LIMIT_PAYMENT_METHODS, emptyCurrencyLimits } from '@/lib/hq-commission-shared';
import {
  formatMemberGradeDisplayCode,
  PAID_MEMBER_GRADES,
  type CurrencyTransactionLimits,
  type CustomerTransactionLimitsPolicy,
  type LimitPaymentMethod,
  type MethodTransactionLimitsPolicy,
  type PaidMemberGrade,
  type PaidMembershipLimitsPolicy,
  type SymbolFeeCurrency,
} from '@/lib/api';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import { CUSTOMER_TYPES_UI_ORDER } from '@/constants/ui-display-order';
import type { MessageKey } from '@/i18n/messages';

const LIMIT_METHOD_LABEL: Record<LimitPaymentMethod, MessageKey> = {
  BANK_TRANSFER: 'hq.risk.limitMethod.BANK_TRANSFER',
  REMITTANCE: 'hq.risk.limitMethod.REMITTANCE',
  CARD: 'hq.risk.limitMethod.CARD',
};

const AMOUNT_FIELDS: Array<{
  key: Exclude<keyof CurrencyTransactionLimits, 'enabled'>;
  labelKey: MessageKey;
}> = [
  { key: 'perTransactionMin', labelKey: 'hq.commission.limitPerTxMin' },
  { key: 'perTransactionMax', labelKey: 'hq.commission.limitPerTxMax' },
  { key: 'dailyMin', labelKey: 'hq.commission.limitDailyMin' },
  { key: 'dailyMax', labelKey: 'hq.commission.limitDailyMax' },
  { key: 'monthlyMin', labelKey: 'hq.commission.limitMonthlyMin' },
  { key: 'monthlyMax', labelKey: 'hq.commission.limitMonthlyMax' },
];

type CustomerTypeKey = 'INDIVIDUAL' | 'CORPORATE';

function emptyCustomerPolicy(): CustomerTransactionLimitsPolicy {
  const make = () => {
    const row = {} as Record<SymbolFeeCurrency, CurrencyTransactionLimits>;
    for (const c of FEE_CURRENCIES) row[c] = emptyCurrencyLimits();
    return row;
  };
  return { INDIVIDUAL: make(), CORPORATE: make() };
}

function emptyMethodPolicy(): MethodTransactionLimitsPolicy {
  return {
    BANK_TRANSFER: emptyCustomerPolicy(),
    REMITTANCE: emptyCustomerPolicy(),
    CARD: emptyCustomerPolicy(),
  };
}

function cloneCurrencyRow(row: CurrencyTransactionLimits): CurrencyTransactionLimits {
  return {
    enabled: row.enabled !== false,
    perTransactionMin: Number(row.perTransactionMin) || 0,
    perTransactionMax: Number(row.perTransactionMax) || 0,
    dailyMin: Number(row.dailyMin) || 0,
    dailyMax: Number(row.dailyMax) || 0,
    monthlyMin: Number(row.monthlyMin) || 0,
    monthlyMax: Number(row.monthlyMax) || 0,
  };
}

function cloneCustomerPolicy(
  policy: CustomerTransactionLimitsPolicy | undefined,
): CustomerTransactionLimitsPolicy {
  const out = emptyCustomerPolicy();
  for (const type of ['INDIVIDUAL', 'CORPORATE'] as const) {
    for (const c of FEE_CURRENCIES) {
      const row = policy?.[type]?.[c];
      out[type][c] = row ? cloneCurrencyRow(row) : emptyCurrencyLimits();
    }
  }
  return out;
}

/** 본사 일반 한도(결제수단별) → 유료등급 한도표로 깊은 복사 */
export function cloneMethodLimitsFromGeneral(
  general: MethodTransactionLimitsPolicy | null | undefined,
): MethodTransactionLimitsPolicy {
  if (!general) return emptyMethodPolicy();
  return {
    BANK_TRANSFER: cloneCustomerPolicy(general.BANK_TRANSFER),
    REMITTANCE: cloneCustomerPolicy(general.REMITTANCE),
    CARD: cloneCustomerPolicy(general.CARD),
  };
}

export function defaultPaidMembershipLimitsPolicyUi(): PaidMembershipLimitsPolicy {
  const gradeMap = {} as PaidMembershipLimitsPolicy['INDIVIDUAL'];
  for (const g of PAID_MEMBER_GRADES) gradeMap[g] = emptyMethodPolicy();
  return { INDIVIDUAL: { ...gradeMap }, CORPORATE: { ...gradeMap } };
}

type Props = {
  value: PaidMembershipLimitsPolicy;
  onChange: (next: PaidMembershipLimitsPolicy) => void;
  /** 본사정책 일반 한도(methodTransactionLimits) — 복사 원본 */
  generalLimits?: MethodTransactionLimitsPolicy | null;
  onCopied?: (message: string) => void;
};

export function PaidMembershipLimitsEditor({
  value,
  onChange,
  generalLimits,
  onCopied,
}: Props) {
  const t = useT();
  const [gradeByType, setGradeByType] = useState<Record<CustomerTypeKey, PaidMemberGrade>>({
    CORPORATE: 'PREMIUM',
    INDIVIDUAL: 'PREMIUM',
  });
  const [methodByType, setMethodByType] = useState<Record<CustomerTypeKey, LimitPaymentMethod>>({
    CORPORATE: 'BANK_TRANSFER',
    INDIVIDUAL: 'BANK_TRANSFER',
  });

  const canCopy = Boolean(generalLimits);

  function rowOf(
    customerType: CustomerTypeKey,
    grade: PaidMemberGrade,
    method: LimitPaymentMethod,
    currency: SymbolFeeCurrency,
  ): CurrencyTransactionLimits {
    return (
      value[customerType]?.[grade]?.[method]?.[customerType]?.[currency] ?? emptyCurrencyLimits()
    );
  }

  function patchRow(
    customerType: CustomerTypeKey,
    grade: PaidMemberGrade,
    method: LimitPaymentMethod,
    currency: SymbolFeeCurrency,
    patch: Partial<CurrencyTransactionLimits>,
  ) {
    const current = rowOf(customerType, grade, method, currency);
    const gradeMethods = value[customerType]?.[grade] ?? emptyMethodPolicy();
    const methodPolicy = gradeMethods[method] ?? emptyCustomerPolicy();
    const nextMethodPolicy: CustomerTransactionLimitsPolicy = {
      ...methodPolicy,
      [customerType]: {
        ...methodPolicy[customerType],
        [currency]: { ...current, ...patch },
      },
    };
    onChange({
      ...value,
      [customerType]: {
        ...value[customerType],
        [grade]: {
          ...gradeMethods,
          [method]: nextMethodPolicy,
        },
      },
    });
  }

  function copyGeneralToGrade(customerType: CustomerTypeKey, grade: PaidMemberGrade) {
    if (!generalLimits) return;
    const cloned = cloneMethodLimitsFromGeneral(generalLimits);
    onChange({
      ...value,
      [customerType]: {
        ...value[customerType],
        [grade]: cloned,
      },
    });
    onCopied?.(
      t('paidMembership.limits.copyDoneGrade', {
        grade: formatMemberGradeDisplayCode(grade, customerType),
      }),
    );
  }

  function copyGeneralToAllGrades(customerType: CustomerTypeKey) {
    if (!generalLimits) return;
    const nextGrades = { ...value[customerType] };
    for (const g of PAID_MEMBER_GRADES) {
      nextGrades[g] = cloneMethodLimitsFromGeneral(generalLimits);
    }
    onChange({
      ...value,
      [customerType]: nextGrades,
    });
    onCopied?.(t('paidMembership.limits.copyDoneType'));
  }

  function renderTypeCard(customerType: CustomerTypeKey) {
    const grade = gradeByType[customerType];
    const method = methodByType[customerType];
    const title =
      customerType === 'INDIVIDUAL'
        ? t('hq.commission.limitsIndividual')
        : t('hq.commission.limitsCorporate');

    return (
      <section key={customerType} className="pg-card space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="pg-btn pg-btn-secondary text-xs"
              disabled={!canCopy}
              title={!canCopy ? t('paidMembership.limits.copyUnavailable') : undefined}
              onClick={() => copyGeneralToGrade(customerType, grade)}
            >
              {t('paidMembership.limits.copyGeneralGrade')}
            </button>
            <button
              type="button"
              className="pg-btn pg-btn-secondary text-xs"
              disabled={!canCopy}
              title={!canCopy ? t('paidMembership.limits.copyUnavailable') : undefined}
              onClick={() => copyGeneralToAllGrades(customerType)}
            >
              {t('paidMembership.limits.copyGeneralType')}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PAID_MEMBER_GRADES.map((g) => (
            <button
              key={g}
              type="button"
              className={`pg-btn text-xs ${
                grade === g ? 'pg-btn-primary' : 'pg-btn-secondary'
              }`}
              onClick={() =>
                setGradeByType((prev) => ({ ...prev, [customerType]: g }))
              }
            >
              {formatMemberGradeDisplayCode(g, customerType)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {LIMIT_PAYMENT_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              className={`pg-btn text-xs ${
                method === m ? 'pg-btn-primary' : 'pg-btn-secondary'
              }`}
              onClick={() =>
                setMethodByType((prev) => ({ ...prev, [customerType]: m }))
              }
            >
              {t(LIMIT_METHOD_LABEL[m])}
            </button>
          ))}
        </div>

        <div className="pg-table-wrap overflow-x-auto">
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('hq.commission.tierCurrency')}</th>
                <th>{t('hq.commission.limitStatus')}</th>
                {AMOUNT_FIELDS.map((f) => (
                  <th key={f.key}>{t(f.labelKey)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEE_CURRENCIES.map((currency) => {
                const row = rowOf(customerType, grade, method, currency);
                const active = row.enabled !== false;
                return (
                  <tr
                    key={currency}
                    className={!active ? 'bg-slate-100 text-slate-500' : undefined}
                  >
                    <td className="font-mono font-medium">{currency}</td>
                    <td>
                      <select
                        className="pg-input w-28 text-xs"
                        value={active ? '1' : '0'}
                        onChange={(e) =>
                          patchRow(customerType, grade, method, currency, {
                            enabled: e.target.value === '1',
                          })
                        }
                      >
                        <option value="1">{t('hq.services.active')}</option>
                        <option value="0">{t('hq.services.inactive')}</option>
                      </select>
                    </td>
                    {AMOUNT_FIELDS.map((f) => (
                      <td key={f.key}>
                        <FormattedAmountInput
                          min={0}
                          commitOnBlur
                          className="pg-input w-24 text-xs"
                          value={row[f.key]}
                          onChange={(n) =>
                            patchRow(customerType, grade, method, currency, {
                              [f.key]: Math.max(0, n),
                            })
                          }
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <p className="pg-hint text-xs">{t('paidMembership.limitsDesc')}</p>
      <div className="space-y-4">
        {CUSTOMER_TYPES_UI_ORDER.map((type) => renderTypeCard(type))}
      </div>
    </div>
  );
}

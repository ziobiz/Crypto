'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import {
  createDefaultCatalogItem,
  defaultPaidMembershipProductsPolicy,
  formatMemberGradeDisplayCode,
  hqPolicyApi,
  membershipAdminApi,
  MEMBERSHIP_CRYPTO_PRICE_CURRENCIES,
  MEMBERSHIP_PRICE_CURRENCIES,
  normalizePaidMembershipProductsPolicyUi,
  PAID_MEMBER_GRADES,
  type MembershipPriceCurrency,
  type MembershipProductPayMeans,
  type PaidMemberGrade,
  type PaidMembershipCatalogItem,
  type PaidMembershipProductsPolicy,
} from '@/lib/api';
import { CUSTOMER_TYPES_UI_ORDER } from '@/constants/ui-display-order';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import type { MessageKey } from '@/i18n/messages';
import {
  MEMBERSHIP_DAY_MAX,
  MEMBERSHIP_DAY_MIN,
  MEMBERSHIP_MONTH_MAX,
  MEMBERSHIP_MONTH_MIN,
  monthsToPeriodDays,
  periodDaysToMode,
  type MembershipPeriodMode,
} from '@/lib/membership-period';

const FIAT_CURRENCIES = MEMBERSHIP_PRICE_CURRENCIES.filter(
  (c) => !(MEMBERSHIP_CRYPTO_PRICE_CURRENCIES as readonly string[]).includes(c),
);
const PAY_MEANS: MembershipProductPayMeans[] = ['CARD', 'CRYPTO', 'BOTH'];
const DAY_OPTIONS = Array.from(
  { length: MEMBERSHIP_DAY_MAX - MEMBERSHIP_DAY_MIN + 1 },
  (_, i) => MEMBERSHIP_DAY_MIN + i,
);
const MONTH_OPTIONS = Array.from(
  { length: MEMBERSHIP_MONTH_MAX - MEMBERSHIP_MONTH_MIN + 1 },
  (_, i) => MEMBERSHIP_MONTH_MIN + i,
);

type CustomerTypeKey = 'INDIVIDUAL' | 'CORPORATE';

export default function MembershipAdminProductsPage() {
  const t = useT();
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const [products, setProducts] = useState<PaidMembershipProductsPolicy>(
    defaultPaidMembershipProductsPolicy(),
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [eurcHint, setEurcHint] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getCommission()
      .then((c) => {
        setProducts(
          normalizePaidMembershipProductsPolicyUi(
            c.paidMembershipProducts ?? defaultPaidMembershipProductsPolicy(),
          ),
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  useEffect(() => {
    membershipAdminApi
      .priceQuote({ priceUsd: 1, currency: 'EURC' })
      .then((q) => {
        setEurcHint(
          t('paidMembership.eurcRateHint', {
            rate: String(q.usdToEurcRate),
            source: q.rateSource,
          }),
        );
      })
      .catch(() => setEurcHint(''));
  }, [t]);

  function updateItem(id: string, patch: Partial<PaidMembershipCatalogItem>) {
    setProducts((prev) => ({
      items: prev.items.map((it) => {
        if (it.id !== id) return it;
        const next = { ...it, ...patch };
        if (patch.grade != null || patch.customerType != null) {
          const grade = next.grade;
          const type = next.customerType;
          if (!patch.name) {
            next.name = formatMemberGradeDisplayCode(grade, type);
          }
        }
        return next;
      }),
    }));
  }

  function setPeriodMode(id: string, mode: MembershipPeriodMode) {
    const cur = products.items.find((it) => it.id === id);
    if (!cur) return;
    const parsed = periodDaysToMode(cur.periodDays);
    if (mode === 'days') {
      updateItem(id, {
        periodDays: parsed.mode === 'days' ? parsed.days : MEMBERSHIP_DAY_MAX,
      });
    } else {
      updateItem(id, {
        periodDays: monthsToPeriodDays(
          parsed.mode === 'months' ? parsed.months : MEMBERSHIP_MONTH_MAX,
        ),
      });
    }
  }

  function addProduct(customerType: CustomerTypeKey) {
    setProducts((prev) => ({
      items: [
        ...prev.items,
        createDefaultCatalogItem({
          customerType,
          grade: 'PREMIUM',
          enabled: false,
        }),
      ],
    }));
  }

  function removeProduct(id: string) {
    setProducts((prev) => ({
      items: prev.items.filter((it) => it.id !== id),
    }));
  }

  function stopAllForType(customerType: CustomerTypeKey) {
    setProducts((prev) => ({
      items: prev.items.map((it) =>
        it.customerType === customerType ? { ...it, enabled: false } : it,
      ),
    }));
  }

  function saveProducts() {
    requestConfirm({
      title: t('paidMembership.hq.saveProducts'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: async () => {
        setSaving(true);
        setMsg('');
        try {
          const next = await hqPolicyApi.savePaidMembershipProducts(products);
          setProducts(
            normalizePaidMembershipProductsPolicyUi(
              next.paidMembershipProducts ?? products,
            ),
          );
          setMsg(t('hq.saved'));
        } catch (e) {
          setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setSaving(false);
        }
      },
    });
  }

  function renderTypeCard(customerType: CustomerTypeKey) {
    const rows = products.items.filter((it) => it.customerType === customerType);
    const title =
      customerType === 'INDIVIDUAL'
        ? t('hq.commission.limitsIndividual')
        : t('hq.commission.limitsCorporate');

    return (
      <section key={customerType} className="pg-card space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="pg-btn pg-btn-primary text-xs"
              onClick={() => addProduct(customerType)}
            >
              {t('membershipAdmin.products.add')}
            </button>
            <button
              type="button"
              className="pg-btn pg-btn-secondary text-xs"
              onClick={() => stopAllForType(customerType)}
            >
              {t('membershipAdmin.products.stopAll')}
            </button>
          </div>
        </div>
        <div className="pg-table-wrap overflow-x-auto">
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('membershipAdmin.products.name')}</th>
                <th>{t('paidMembership.grade')}</th>
                <th>{t('paidMembership.sell')}</th>
                <th>{t('paidMembership.priceUsd')}</th>
                <th>{t('paidMembership.cryptoEquiv')}</th>
                <th>{t('paidMembership.chargeUnit')}</th>
                <th>{t('paidMembership.period')}</th>
                <th>{t('paidMembership.payMeans')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="pg-hint text-sm py-6">
                    {t('membershipAdmin.products.empty')}
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const period = periodDaysToMode(row.periodDays);
                const usd = row.price;
                return (
                  <tr key={row.id}>
                    <td>
                      <input
                        className="pg-input w-36 text-xs"
                        value={row.name}
                        maxLength={80}
                        onChange={(e) => updateItem(row.id, { name: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="pg-input w-28 text-xs"
                        value={row.grade}
                        onChange={(e) =>
                          updateItem(row.id, {
                            grade: e.target.value as PaidMemberGrade,
                            name: formatMemberGradeDisplayCode(
                              e.target.value,
                              row.customerType,
                            ),
                          })
                        }
                      >
                        {PAID_MEMBER_GRADES.map((g) => (
                          <option key={g} value={g}>
                            {formatMemberGradeDisplayCode(g, customerType)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="pg-input w-28 text-xs"
                        value={row.enabled ? '1' : '0'}
                        onChange={(e) =>
                          updateItem(row.id, { enabled: e.target.value === '1' })
                        }
                      >
                        <option value="1">{t('hq.services.active')}</option>
                        <option value="0">{t('hq.services.inactive')}</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <FormattedAmountInput
                          min={0}
                          commitOnBlur
                          className="pg-input w-28 text-xs"
                          value={row.price}
                          onChange={(n) => updateItem(row.id, { price: Math.max(0, n) })}
                        />
                        <span className="text-xs font-bold text-sky-800">USD</span>
                      </div>
                    </td>
                    <td className="text-[11px] leading-snug text-slate-600 whitespace-nowrap">
                      <div>USDT {usd}</div>
                      <div>USDC {usd}</div>
                      <div className="text-slate-500">{t('paidMembership.eurcLiveNote')}</div>
                    </td>
                    <td>
                      <select
                        className="pg-input w-40 text-xs"
                        value={row.currency}
                        onChange={(e) =>
                          updateItem(row.id, {
                            currency: e.target.value as MembershipPriceCurrency,
                          })
                        }
                      >
                        <optgroup label={t('paidMembership.currencyGroup.crypto')}>
                          {MEMBERSHIP_CRYPTO_PRICE_CURRENCIES.map((c) => (
                            <option key={c} value={c}>
                              {t(`paidMembership.currencyLabel.${c}` as MessageKey)}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label={t('paidMembership.currencyGroup.fiat')}>
                          {FIAT_CURRENCIES.map((c) => (
                            <option key={c} value={c}>
                              {t(`paidMembership.currencyLabel.${c}` as MessageKey)}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 min-w-[9rem]">
                        <select
                          className="pg-input text-xs"
                          value={period.mode}
                          onChange={(e) =>
                            setPeriodMode(row.id, e.target.value as MembershipPeriodMode)
                          }
                        >
                          <option value="days">{t('paidMembership.periodMode.days')}</option>
                          <option value="months">{t('paidMembership.periodMode.months')}</option>
                        </select>
                        {period.mode === 'days' ? (
                          <select
                            className="pg-input text-xs"
                            value={period.days}
                            onChange={(e) =>
                              updateItem(row.id, {
                                periodDays: Number(e.target.value),
                              })
                            }
                          >
                            {DAY_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                {t('paidMembership.periodDaysOption', { n: String(d) })}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            className="pg-input text-xs"
                            value={period.months}
                            onChange={(e) =>
                              updateItem(row.id, {
                                periodDays: monthsToPeriodDays(Number(e.target.value)),
                              })
                            }
                          >
                            {MONTH_OPTIONS.map((m) => (
                              <option key={m} value={m}>
                                {t('paidMembership.periodMonthsOption', { n: String(m) })}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td>
                      <select
                        className="pg-input w-32 text-xs"
                        value={row.payMeans}
                        onChange={(e) =>
                          updateItem(row.id, {
                            payMeans: e.target.value as MembershipProductPayMeans,
                          })
                        }
                      >
                        {PAY_MEANS.map((m) => (
                          <option key={m} value={m}>
                            {t(`paidMembership.payMeans.${m}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="pg-btn pg-btn-secondary text-xs"
                        onClick={() => removeProduct(row.id)}
                      >
                        {t('membershipAdmin.products.remove')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <p className="text-red-600">
        {error} — {t('hq.backendHint')}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {doubleConfirmDialog}
      <p className="pg-hint text-sm">{t('paidMembership.hq.productsDesc')}</p>
      <p className="pg-callout pg-callout-muted text-xs">{t('paidMembership.noRefund')}</p>
      <p className="pg-hint text-xs">{t('paidMembership.priceUsdBasis')}</p>
      <p className="pg-hint text-xs">{t('paidMembership.periodHint')}</p>
      {eurcHint && <p className="pg-hint text-xs">{eurcHint}</p>}

      <div className="space-y-4">
        {CUSTOMER_TYPES_UI_ORDER.map((type) => renderTypeCard(type))}
      </div>

      <button
        type="button"
        className="pg-btn pg-btn-primary text-xs"
        disabled={saving}
        onClick={saveProducts}
      >
        {saving ? t('hq.saving') : t('paidMembership.hq.saveProducts')}
      </button>
      {msg && <p className="pg-hint">{msg}</p>}
    </div>
  );
}

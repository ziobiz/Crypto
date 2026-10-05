'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import {
  hqPolicyApi,
  type ExchangeRatePreviewRow,
  type ExchangeRateSourceId,
  type HqCommissionPayload,
  type HqCommissionRiskConfig,
  type HqExchangeRateSourcePolicy,
  type CurrencyTransactionLimits,
  type HqCurrencyAmountDisplayPolicy,
  type UsdtRiskLimitTier,
  type SymbolFeeCurrency,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import { formatAmountInput } from '@/lib/format';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';
import { PolicyCellValue } from '@/components/policy/PolicyCellValue';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';
import {
  DEFAULT_CURRENCY_AMOUNT,
  DEFAULT_USDT_RISK_LIMIT_TIERS,
  USDT_RISK_LIMIT_TIERS,
  FEE_CURRENCIES,
  AMOUNT_CURRENCIES,
  withRiskDefaults,
  saveRisk,
} from '@/lib/hq-commission-shared';

const LIMIT_CUSTOMER_TYPES = ['INDIVIDUAL', 'CORPORATE'] as const;
type LimitCustomerType = (typeof LIMIT_CUSTOMER_TYPES)[number];

const RATE_SOURCES: ExchangeRateSourceId[] = [
  'coingecko',
  'exchangerate_api', 
  'binance_cross',
  'binance_global',
  'binance_th',
  'bybit_cross',
  'kraken_book',
  'upbit',
  'kr_domestic',
];

const LIMIT_FIELDS: Array<{ key: keyof CurrencyTransactionLimits; labelKey: MessageKey }> = [
  { key: 'perTransactionMin', labelKey: 'hq.commission.limitPerTxMin' },
  { key: 'perTransactionMax', labelKey: 'hq.commission.limitPerTxMax' },
  { key: 'dailyMin', labelKey: 'hq.commission.limitDailyMin' },
  { key: 'dailyMax', labelKey: 'hq.commission.limitDailyMax' },
  { key: 'monthlyMin', labelKey: 'hq.commission.limitMonthlyMin' },
  { key: 'monthlyMax', labelKey: 'hq.commission.limitMonthlyMax' },
];

const USDT_RISK_TIER_LABEL_KEYS: Record<UsdtRiskLimitTier, MessageKey> = {
  LR: 'hq.commission.usdtRiskTier.LR',
  MR: 'hq.commission.usdtRiskTier.MR',
  HR: 'hq.commission.usdtRiskTier.HR',
  XR: 'hq.commission.usdtRiskTier.XR',
  SR: 'hq.commission.usdtRiskTier.SR',
};

export default function HqRiskPage() {
  const t = useT();
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const [data, setData] = useState<HqCommissionPayload | null>(null);
  const [risk, setRisk] = useState<HqCommissionRiskConfig | null>(null);
  const [exchangeRateSources, setExchangeRateSources] = useState<HqExchangeRateSourcePolicy | null>(null);
  const [exchangeRatePreview, setExchangeRatePreview] = useState<ExchangeRatePreviewRow[]>([]);
  const [savingRateSources, setSavingRateSources] = useState(false);
  const [rateSourcesMsg, setRateSourcesMsg] = useState('');
  const [editingLimitCurrency, setEditingLimitCurrency] = useState<SymbolFeeCurrency | null>(null);
  const [limitDraft, setLimitDraft] = useState<CurrencyTransactionLimits | null>(null);
  const [editingMaxDaily, setEditingMaxDaily] = useState(false);
  const [maxDailyDraft, setMaxDailyDraft] = useState(0);
  const [savingRisk, setSavingRisk] = useState(false);
  const [currencyAmount, setCurrencyAmount] = useState<HqCurrencyAmountDisplayPolicy>(DEFAULT_CURRENCY_AMOUNT);
  const [savingCurrencyAmount, setSavingCurrencyAmount] = useState(false);
  const [currencyAmountMsg, setCurrencyAmountMsg] = useState('');
  const [quoteResponse, setQuoteResponse] = useState({
    enabled: true,
    mode: 'AUTO' as 'AUTO' | 'MANUAL',
    autoDelayMinutes: 0,
    manualSlaHours: 3,
    applyIdleMinutes: 5,
    applyMaxMinutes: 10,
    quoteValidMinutes: 20,
  });
  const [savingQuote, setSavingQuote] = useState(false);
  const [quoteMsg, setQuoteMsg] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [limitCustomerType, setLimitCustomerType] = useState<LimitCustomerType>('INDIVIDUAL');

  const rateSourceLabel = (source: ExchangeRateSourceId | string) =>
    t(`hq.commission.rateSource.${source}` as MessageKey);

  function previewFor(currency: SymbolFeeCurrency) {
    return exchangeRatePreview.find((row) => row.currency === currency);
  }

  function updateRateSource(currency: SymbolFeeCurrency, source: ExchangeRateSourceId) {
    setExchangeRateSources((prev) => (prev ? { ...prev, [currency]: source } : prev));
  }

  async function saveRateSources() {
    if (!exchangeRateSources) return;
    setSavingRateSources(true);
    setRateSourcesMsg('');
    try {
      const next = await hqPolicyApi.saveExchangeRateSources(exchangeRateSources);
      setData(next);
      setExchangeRateSources(next.exchangeRateSources);
      setExchangeRatePreview(next.exchangeRatePreview ?? []);
      setRateSourcesMsg(t('hq.commission.rateSourcesSaved'));
    } catch (e) {
      setRateSourcesMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSavingRateSources(false);
    }
  }

  useEffect(() => {
    hqPolicyApi
      .getCommission()
      .then((commission) => {
        setData(commission);
        setRisk(withRiskDefaults({
          ...commission.risk,
          defaultFxFeePercent: commission.risk.defaultFxFeePercent ?? 0,
          defaultTransferFeeUsdt:
            commission.risk.defaultTransferFeeUsdt ??
            commission.risk.defaultPlatformFeeUsdt ??
            0,
          defaultOtherFeeUsdt: commission.risk.defaultOtherFeeUsdt ?? 0,
        }));
        setExchangeRateSources(commission.exchangeRateSources);
        setExchangeRatePreview(commission.exchangeRatePreview ?? []);
        setCurrencyAmount({
          ...DEFAULT_CURRENCY_AMOUNT,
          ...(commission.currencyAmountDisplay ?? {}),
        });
        if (commission.usdtQuoteResponse) {
          const q = commission.usdtQuoteResponse;
          setQuoteResponse({
            enabled: q.enabled !== false,
            mode: q.mode === 'MANUAL' ? 'MANUAL' : 'AUTO',
            autoDelayMinutes: q.autoDelayMinutes ?? 0,
            manualSlaHours: q.manualSlaHours ?? 3,
            applyIdleMinutes: q.applyIdleMinutes ?? 5,
            applyMaxMinutes: q.applyMaxMinutes ?? 10,
            quoteValidMinutes: q.quoteValidMinutes ?? 20,
          });
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  async function saveCurrencyAmountDisplay() {
    requestConfirm({
      title: t('hq.commission.currencyAmountSave'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: async () => {
        setSavingCurrencyAmount(true);
        setCurrencyAmountMsg('');
        try {
          const next = await hqPolicyApi.saveCurrencyAmountDisplay(currencyAmount);
          setData(next);
          setCurrencyAmount({
            ...DEFAULT_CURRENCY_AMOUNT,
            ...(next.currencyAmountDisplay ?? {}),
          });
          const { setCurrencyAmountDisplayPolicy } = await import('@/lib/format');
          setCurrencyAmountDisplayPolicy(next.currencyAmountDisplay ?? DEFAULT_CURRENCY_AMOUNT);
          setCurrencyAmountMsg(t('hq.saved'));
        } catch (e) {
          setCurrencyAmountMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setSavingCurrencyAmount(false);
        }
      },
    });
  }

  async function saveUsdtQuoteResponse() {
    requestConfirm({
      title: t('hq.commission.quoteResponseSave'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: async () => {
        setSavingQuote(true);
        setQuoteMsg('');
        try {
          const next = await hqPolicyApi.saveUsdtQuoteResponse(quoteResponse);
          setData(next);
          if (next.usdtQuoteResponse) {
            const q = next.usdtQuoteResponse;
            setQuoteResponse({
              enabled: q.enabled !== false,
              mode: q.mode === 'MANUAL' ? 'MANUAL' : 'AUTO',
              autoDelayMinutes: q.autoDelayMinutes ?? 0,
              manualSlaHours: q.manualSlaHours ?? 3,
              applyIdleMinutes: q.applyIdleMinutes ?? 5,
              applyMaxMinutes: q.applyMaxMinutes ?? 10,
              quoteValidMinutes: q.quoteValidMinutes ?? 20,
            });
          }
          setQuoteMsg(t('hq.saved'));
        } catch (e) {
          setQuoteMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setSavingQuote(false);
        }
      },
    });
  }

  function hasPolicyEditInProgress() {
    return editingLimitCurrency !== null || editingMaxDaily;
  }

  function cancelLimitEdit() {
    setEditingLimitCurrency(null);
    setLimitDraft(null);
    setMsg('');
  }

  function startLimitEdit(currency: SymbolFeeCurrency) {
    if (!risk || hasPolicyEditInProgress()) return;
    setEditingLimitCurrency(currency);
    setLimitDraft({ ...risk.transactionLimits[limitCustomerType][currency] });
    setMsg('');
  }

  function updateLimitDraft(field: keyof CurrencyTransactionLimits, value: number) {
    setLimitDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function saveLimitEdit() {
    if (!risk || !editingLimitCurrency || !limitDraft) return;
    setRisk((prev) => {
      if (!prev) return prev;
      const nextLimits = {
        ...prev.transactionLimits,
        [limitCustomerType]: {
          ...prev.transactionLimits[limitCustomerType],
          [editingLimitCurrency]: { ...limitDraft },
        },
      };
      return {
        ...prev,
        transactionLimits: nextLimits,
        maxTicketAmountKrw:
          limitCustomerType === 'INDIVIDUAL' && editingLimitCurrency === 'KRW'
            ? limitDraft.perTransactionMax
            : prev.maxTicketAmountKrw,
      };
    });
    cancelLimitEdit();
  }

  function cancelMaxDailyEdit() {
    setEditingMaxDaily(false);
    setMaxDailyDraft(0);
    setMsg('');
  }

  function startMaxDailyEdit() {
    if (!risk || hasPolicyEditInProgress()) return;
    setEditingMaxDaily(true);
    setMaxDailyDraft(risk.maxDailyTicketsPerCustomer);
    setMsg('');
  }

  function saveMaxDailyEdit() {
    if (!risk) return;
    setRisk({ ...risk, maxDailyTicketsPerCustomer: Math.max(0, maxDailyDraft) });
    cancelMaxDailyEdit();
  }

  async function saveRiskConfig() {
    if (!risk) return;
    if (hasPolicyEditInProgress()) {
      setMsg(t('hq.commission.tierFinishEditFirst'));
      return;
    }
    requestConfirm({
      title: t('hq.commission.saveRisk'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: async () => {
        setSavingRisk(true);
        setMsg('');
        try {
          const next = await saveRisk(risk);
          setData(next);
          setRisk(withRiskDefaults(next.risk));
          setMsg(t('hq.saved'));
        } catch (e) {
          setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setSavingRisk(false);
        }
      },
    });
  }

  if (error) {
    return (
      <p className="text-red-600">
        {error} — {t('hq.backendHint')}
      </p>
    );
  }

  if (!data || !risk || !exchangeRateSources) return <p className="pg-hint">{t('hq.loading')}</p>;

  return (
    <div className="pg-stack">
      {doubleConfirmDialog}
      
      {/* Exchange Rate Sources */}
      <section className="pg-section">
        <div className="pg-section-head">{t('hq.commission.rateSourceTitle')}</div>
        <div className="pg-section-pad space-y-3">
          <p className="pg-hint">{t('hq.commission.rateSourceDesc')}</p>
          <div className="pg-card pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>{t('hq.commission.rateSourceCurrency')}</th>
                  <th>{t('hq.commission.rateSourceSelect')}</th>
                  <th>{t('hq.commission.rateSourcePreview')}</th>
                  <th>{t('hq.commission.rateSourceActual')}</th>
                  <th>{t('hq.commission.rateSourceUpdated')}</th>
                </tr>
              </thead>
              <tbody>
                {FEE_CURRENCIES.map((currency) => {
                  const preview = previewFor(currency);
                  return (
                    <tr key={currency}>
                      <td className="font-mono font-semibold">{currency}</td>
                      <td>
                        <select
                          value={exchangeRateSources[currency]}
                          onChange={(e) =>
                            updateRateSource(currency, e.target.value as ExchangeRateSourceId)
                          }
                          className="pg-input min-w-[12rem]"
                        >
                          {RATE_SOURCES.map((source) => (
                            <option key={source} value={source}>
                              {rateSourceLabel(source)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="tabular-nums font-semibold text-blue-700">
                        {preview?.rate != null
                          ? preview.rate.toLocaleString(undefined, {
                              maximumFractionDigits: currency === 'JPY' ? 2 : 0,
                            })
                          : '—'}
                      </td>
                      <td className="pg-muted text-xs">{preview ? rateSourceLabel(preview.actualSource.replace('_fallback', '')) : '—'}</td>
                      <td className="pg-muted text-xs">
                        {preview?.fetchedAt
                          ? new Date(preview.fetchedAt).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rateSourcesMsg && <p className="text-sm text-green-700">{rateSourcesMsg}</p>}
          {(data.localPremiums?.length ? data.localPremiums : data.kimchiPremium ? [{
            currency: 'KRW' as const,
            domesticRate: data.kimchiPremium.domesticRate,
            fairRate: data.kimchiPremium.fairRate,
            premiumPercent: data.kimchiPremium.premiumPercent,
            domesticSource: 'kr_domestic',
            domesticLabel: 'Upbit·Bithumb',
            usdFiatRate: data.kimchiPremium.usdKrwRate,
            usdtUsdRate: data.kimchiPremium.usdtUsdRate,
            detailRates: {
              upbit: data.kimchiPremium.upbitRate,
              bithumb: data.kimchiPremium.bithumbRate,
            },
            fetchedAt: data.kimchiPremium.fetchedAt,
          }] : []).map((premium) => (
            <div
              key={premium.currency}
              className="rounded border border-rose-100 bg-rose-50/50 p-3 text-xs text-rose-900"
            >
              <p className="font-semibold">
                {t(`hq.commission.localPremium.${premium.currency}.title` as 'hq.commission.localPremium.KRW.title')}
              </p>
              <p className="mt-1">
                {t(`hq.commission.localPremium.${premium.currency}.desc` as 'hq.commission.localPremium.KRW.desc')}
              </p>
              <dl className="mt-2 grid gap-1 sm:grid-cols-2">
                <div>
                  <dt className="text-rose-700">{t('hq.commission.localPremium.percent')}</dt>
                  <dd className="font-bold tabular-nums">{premium.premiumPercent.toFixed(2)}%</dd>
                </div>
                <div>
                  <dt className="text-rose-700">{t('hq.commission.localPremium.domestic')}</dt>
                  <dd className="font-mono tabular-nums">
                    {premium.domesticRate.toLocaleString()} {premium.currency}
                    {premium.currency === 'KRW' && premium.detailRates.upbit != null && premium.detailRates.bithumb != null
                      ? ` (Upbit ${premium.detailRates.upbit.toLocaleString()} / Bithumb ${premium.detailRates.bithumb.toLocaleString()})`
                      : premium.domesticLabel
                        ? ` (${premium.domesticLabel})`
                        : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-rose-700">{t('hq.commission.localPremium.fair')}</dt>
                  <dd className="font-mono tabular-nums">
                    {premium.fairRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} {premium.currency}
                  </dd>
                </div>
                <div>
                  <dt className="text-rose-700">{t('hq.commission.localPremium.fx')}</dt>
                  <dd className="font-mono tabular-nums">
                    USD/{premium.currency} {premium.usdFiatRate.toLocaleString()} × USDT/USD {premium.usdtUsdRate.toFixed(4)}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
          {((data.localPremiums?.length ?? 0) > 0 || data.kimchiPremium) && (
            <p className="text-xs text-rose-800">{t('hq.commission.localPremiumDesc')}</p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveRateSources}
              disabled={savingRateSources}
              className="pg-btn pg-btn-primary"
            >
              {savingRateSources ? t('hq.saving') : t('hq.commission.saveRateSources')}
            </button>
          </div>
        </div>
      </section>

      {/* Currency Amount Display */}
      <section className="pg-section">
        <div className="pg-section-head">{t('hq.commission.currencyAmountTitle')}</div>
        <div className="pg-section-pad space-y-3">
          <div className="pg-card">
            <div className="pg-card-body space-y-3">
              <p className="pg-hint text-xs">{t('hq.commission.currencyAmountDesc')}</p>
              <div className="pg-table-wrap overflow-x-auto">
                <table className="pg-table text-sm">
                  <thead>
                    <tr>
                      <th>{t('hq.commission.currencyAmount.currency')}</th>
                      <th>{t('hq.commission.currencyAmount.decimals')}</th>
                      <th>{t('hq.commission.currencyAmount.mode')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AMOUNT_CURRENCIES.map((ccy) => {
                      const rule = currencyAmount[ccy] ?? currencyAmount.default;
                      return (
                        <tr key={ccy}>
                          <td className="font-mono font-medium">{ccy}</td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              max={8}
                              className="pg-input !w-20 !text-xs"
                              value={rule.decimals}
                              onChange={(e) =>
                                setCurrencyAmount((prev) => ({
                                  ...prev,
                                  [ccy]: {
                                    ...rule,
                                    decimals: Math.max(0, Math.min(8, Number(e.target.value) || 0)),
                                  },
                                }))
                              }
                            />
                          </td>
                          <td>
                            <select
                              className="pg-input !text-xs max-w-[10rem]"
                              value={rule.mode}
                              onChange={(e) =>
                                setCurrencyAmount((prev) => ({
                                  ...prev,
                                  [ccy]: {
                                    ...rule,
                                    mode: e.target.value as 'ROUND' | 'CEIL' | 'FLOOR',
                                  },
                                }))
                              }
                            >
                              <option value="ROUND">{t('hq.commission.currencyAmount.modeRound')}</option>
                              <option value="CEIL">{t('hq.commission.currencyAmount.modeCeil')}</option>
                              <option value="FLOOR">{t('hq.commission.currencyAmount.modeFloor')}</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="pg-btn pg-btn-primary text-xs"
                  disabled={savingCurrencyAmount}
                  onClick={() => void saveCurrencyAmountDisplay()}
                >
                  {savingCurrencyAmount ? t('hq.saving') : t('hq.commission.currencyAmountSave')}
                </button>
                {currencyAmountMsg && <span className="pg-hint">{currencyAmountMsg}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Response Timers */}
      <section className="pg-section">
        <div className="pg-section-head">{t('hq.commission.quoteResponseTitle')}</div>
        <div className="pg-section-pad space-y-3">
          <div className="pg-card">
            <div className="pg-card-body space-y-3">
              <p className="pg-hint text-xs">{t('hq.commission.quoteResponseDesc')}</p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={quoteResponse.enabled}
                  onChange={(e) =>
                    setQuoteResponse((p) => ({ ...p, enabled: e.target.checked }))
                  }
                />
                {t('hq.commission.quoteResponseEnabled')}
              </label>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="quoteMode"
                    checked={quoteResponse.mode === 'AUTO'}
                    onChange={() => setQuoteResponse((p) => ({ ...p, mode: 'AUTO' }))}
                  />
                  {t('hq.commission.quoteModeAuto')}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="quoteMode"
                    checked={quoteResponse.mode === 'MANUAL'}
                    onChange={() => setQuoteResponse((p) => ({ ...p, mode: 'MANUAL' }))}
                  />
                  {t('hq.commission.quoteModeManual')}
                </label>
              </div>
              {quoteResponse.mode === 'AUTO' && (
                <div>
                  <label className="pg-label">{t('hq.commission.quoteAutoDelay')}</label>
                  <select
                    className="pg-input mt-1 max-w-xs"
                    value={quoteResponse.autoDelayMinutes}
                    onChange={(e) =>
                      setQuoteResponse((p) => ({
                        ...p,
                        autoDelayMinutes: Number(e.target.value),
                      }))
                    }
                  >
                    {[0, 1, 3, 5, 10, 30, 60, 180, 360, 720, 1440, 2880, 4320].map((m) => (
                      <option key={m} value={m}>
                        {m === 0
                          ? t('hq.commission.quoteDelayImmediate')
                          : m < 60
                            ? t('hq.commission.quoteDelayMinutes', { n: String(m) })
                            : m < 1440
                              ? t('hq.commission.quoteDelayHours', { n: String(m / 60) })
                              : t('hq.commission.quoteDelayDays', { n: String(m / 1440) })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {quoteResponse.mode === 'MANUAL' && (
                <div>
                  <label className="pg-label">{t('hq.commission.quoteManualSla')}</label>
                  <select
                    className="pg-input mt-1 max-w-xs"
                    value={quoteResponse.manualSlaHours}
                    onChange={(e) =>
                      setQuoteResponse((p) => ({
                        ...p,
                        manualSlaHours: Number(e.target.value),
                      }))
                    }
                  >
                    {[3, 6, 12, 24].map((h) => (
                      <option key={h} value={h}>
                        {t('hq.commission.quoteDelayHours', { n: String(h) })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="rounded border border-slate-100 bg-slate-50/80 p-3 space-y-3">
                <p className="pg-hint text-xs">{t('hq.commission.quoteTimersDesc')}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="pg-field">
                    <span className="pg-label">{t('hq.commission.applyIdleMinutes')}</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      className="pg-input mt-1 w-full"
                      value={quoteResponse.applyIdleMinutes}
                      onChange={(e) =>
                        setQuoteResponse((p) => ({
                          ...p,
                          applyIdleMinutes: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                    />
                  </label>
                  <label className="pg-field">
                    <span className="pg-label">{t('hq.commission.applyMaxMinutes')}</span>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      className="pg-input mt-1 w-full"
                      value={quoteResponse.applyMaxMinutes}
                      onChange={(e) =>
                        setQuoteResponse((p) => ({
                          ...p,
                          applyMaxMinutes: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                    />
                  </label>
                  <label className="pg-field">
                    <span className="pg-label">{t('hq.commission.quoteValidMinutes')}</span>
                    <input
                      type="number"
                      min={1}
                      max={240}
                      className="pg-input mt-1 w-full"
                      value={quoteResponse.quoteValidMinutes}
                      onChange={(e) =>
                        setQuoteResponse((p) => ({
                          ...p,
                          quoteValidMinutes: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="pg-btn pg-btn-primary text-xs"
                  disabled={savingQuote}
                  onClick={() => void saveUsdtQuoteResponse()}
                >
                  {savingQuote ? t('hq.saving') : t('hq.commission.quoteResponseSave')}
                </button>
                {quoteMsg && <span className="pg-hint">{quoteMsg}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction Limits */}
      <section className="pg-section">
        <div className="pg-section-head">{t('hq.commission.limitsTitle')}</div>
        <div className="pg-section-pad space-y-3">
          <div className="pg-card">
            <div className="pg-card-body space-y-4">
              <p className="pg-hint text-xs">{t('hq.commission.limitsDesc')}</p>
              <p className="pg-hint text-xs text-sky-800">{t('hq.commission.limitsApplyLink')}</p>
              <p className="pg-hint text-xs text-sky-800">{t('hq.commission.limitsRemittanceNote')}</p>
              <p className="pg-callout pg-callout-muted">{t('hq.commission.tierEditHint')}</p>
              <div className="flex flex-wrap gap-2">
                {LIMIT_CUSTOMER_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      if (limitCustomerType !== type) cancelLimitEdit();
                      setLimitCustomerType(type);
                    }}
                    className={`pg-btn text-xs ${
                      limitCustomerType === type ? 'pg-btn-primary' : 'pg-btn-secondary'
                    }`}
                  >
                    {type === 'INDIVIDUAL'
                      ? t('hq.commission.limitsIndividual')
                      : t('hq.commission.limitsCorporate')}
                  </button>
                ))}
              </div>
              <div className="pg-card pg-table-wrap">
                <table className="pg-table">
                  <thead>
                    <tr>
                      <th>{t('hq.commission.tierCurrency')}</th>
                      {LIMIT_FIELDS.map((field) => (
                        <th key={field.key}>{t(field.labelKey)}</th>
                      ))}
                      <th>{t('hq.commission.tierActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FEE_CURRENCIES.map((currency) => {
                      const isEditing = editingLimitCurrency === currency;
                      const rowLocked = editingLimitCurrency !== null && !isEditing;
                      const limits = isEditing && limitDraft
                        ? limitDraft
                        : risk.transactionLimits[limitCustomerType][currency];
                      return (
                        <tr
                          key={currency}
                          className={isEditing ? 'pg-row-edit' : undefined}
                        >
                          <td className="font-mono font-medium">{currency}</td>
                          {LIMIT_FIELDS.map((field) => (
                            <td key={field.key}>
                              {isEditing ? (
                                <FormattedAmountInput
                                  min={0}
                                  commitOnBlur
                                  className="pg-input w-28 text-xs"
                                  value={limits[field.key]}
                                  onChange={(n) => updateLimitDraft(field.key, n)}
                                />
                              ) : (
                                <PolicyCellValue>
                                  {formatAmountInput(limits[field.key])}
                                </PolicyCellValue>
                              )}
                            </td>
                          ))}
                          <td>
                            <PolicyTableActions>
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={saveLimitEdit}
                                    className="pg-btn pg-btn-primary text-xs"
                                  >
                                    {t('hq.commission.tierSaveRow')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelLimitEdit}
                                    className="pg-btn pg-btn-secondary text-xs"
                                  >
                                    {t('hq.commission.tierCancelEdit')}
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startLimitEdit(currency)}
                                  disabled={rowLocked || hasPolicyEditInProgress()}
                                  className="pg-btn pg-btn-secondary text-xs disabled:opacity-40"
                                >
                                  {t('hq.commission.tierEdit')}
                                </button>
                              )}
                            </PolicyTableActions>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="pg-hint text-[10px]">{t('hq.commission.limitZeroHint')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Policy */}
      <section className="pg-section">
        <div className="pg-section-head">{t('hq.commission.riskTitle')}</div>
        <div className="pg-section-pad space-y-3">
          <div className="pg-card">
            <div className="pg-card-body space-y-4">
              <p className="pg-hint">{t('hq.commission.riskDesc')}</p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={risk.riskEnabled}
                  onChange={(e) => setRisk({ ...risk, riskEnabled: e.target.checked })}
                />
                <span className="pg-label">{t('hq.commission.riskEnabled')}</span>
              </label>

              <div className="space-y-2">
                <p className="pg-label">{t('hq.commission.usdtRiskTiersTitle')}</p>
                <p className="pg-hint text-xs">{t('hq.commission.usdtRiskTiersDesc')}</p>
                <div className="pg-card pg-table-wrap">
                  <table className="pg-table">
                    <thead>
                      <tr>
                        <th>{t('hq.commission.usdtRiskTierCode')}</th>
                        <th>{t('hq.commission.usdtRiskTierLabel')}</th>
                        <th>{t('hq.commission.usdtRiskTierMin')}</th>
                        <th>{t('hq.commission.usdtRiskTierMax')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {USDT_RISK_LIMIT_TIERS.map((tier) => {
                        const band = risk.usdtRiskLimitTiers?.[tier] ?? DEFAULT_USDT_RISK_LIMIT_TIERS[tier];
                        return (
                          <tr key={tier}>
                            <td className="font-mono font-medium">{tier}</td>
                            <td>{t(USDT_RISK_TIER_LABEL_KEYS[tier])}</td>
                            <td>
                              <FormattedAmountInput
                                min={0}
                                commitOnBlur
                                className="pg-input w-28 text-xs"
                                value={band.minUsdt}
                                onChange={(n) =>
                                  setRisk((prev) => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      usdtRiskLimitTiers: {
                                        ...prev.usdtRiskLimitTiers!,
                                        [tier]: {
                                          ...prev.usdtRiskLimitTiers![tier],
                                          minUsdt: Math.max(0, n),
                                        },
                                      },
                                    };
                                  })
                                }
                              />
                            </td>
                            <td>
                              <FormattedAmountInput
                                min={0}
                                commitOnBlur
                                className="pg-input w-28 text-xs"
                                value={band.maxUsdt}
                                onChange={(n) =>
                                  setRisk((prev) => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      usdtRiskLimitTiers: {
                                        ...prev.usdtRiskLimitTiers!,
                                        [tier]: {
                                          ...prev.usdtRiskLimitTiers![tier],
                                          maxUsdt: Math.max(0, n),
                                        },
                                      },
                                    };
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
                <p className="pg-hint text-[10px]">{t('hq.commission.usdtRiskTierZeroHint')}</p>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[12rem]">
                  <span className="pg-label">{t('hq.commission.maxDaily')}</span>
                  {editingMaxDaily ? (
                    <PolicyNumberInput
                      min={0}
                      value={maxDailyDraft}
                      onChange={setMaxDailyDraft}
                      className="pg-input mt-1 w-full"
                      step="1"
                    />
                  ) : (
                    <p className="mt-1 text-center font-mono tabular-nums text-sm">
                      {risk.maxDailyTicketsPerCustomer}
                    </p>
                  )}
                </div>
                <PolicyTableActions>
                  {editingMaxDaily ? (
                    <>
                      <button
                        type="button"
                        onClick={saveMaxDailyEdit}
                        className="pg-btn pg-btn-primary text-xs"
                      >
                        {t('hq.commission.tierSaveRow')}
                      </button>
                      <button
                        type="button"
                        onClick={cancelMaxDailyEdit}
                        className="pg-btn pg-btn-secondary text-xs"
                      >
                        {t('hq.commission.tierCancelEdit')}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={startMaxDailyEdit}
                      disabled={hasPolicyEditInProgress()}
                      className="pg-btn pg-btn-secondary text-xs disabled:opacity-40"
                    >
                      {t('hq.commission.tierEdit')}
                    </button>
                  )}
                </PolicyTableActions>
              </div>
              <label className="block">
                <span className="pg-label">{t('hq.commission.memo')}</span>
                <textarea
                  value={risk.notes ?? ''}
                  onChange={(e) => setRisk({ ...risk, notes: e.target.value })}
                  className="pg-input mt-1"
                  rows={2}
                />
              </label>
              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-700">
                <p>{t('hq.risk.cardLimitsNote')}</p>
                <Link
                  href="/dashboard/hq-policy/ops/payment"
                  className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline"
                >
                  {t('hq.risk.cardLimitsLink')}
                </Link>
              </div>
              <button
                type="button"
                onClick={saveRiskConfig}
                disabled={savingRisk || hasPolicyEditInProgress()}
                className="pg-btn pg-btn-primary disabled:opacity-50"
              >
                {savingRisk ? t('hq.saving') : t('hq.commission.saveRisk')}
              </button>
              {msg && <p className="pg-hint">{msg}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
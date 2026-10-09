'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import {
  hqPolicyApi,
  type ExchangeRatePreviewRow,
  type ExchangeRateSourceId,
  type HqCommissionPayload,
  type HqCommissionRiskConfig,
  type HqExchangeRateSourcePolicy,
  type HqExchangeRateSourcesByAsset,
  type CurrencyTransactionLimits,
  type HqCurrencyAmountDisplayPolicy,
  type UsdtRiskLimitTier,
  type SymbolFeeCurrency,
  type SettlementAsset,
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
  DEFAULT_INDIVIDUAL_USDT_RISK_LIMIT_TIERS,
  USDT_RISK_LIMIT_TIERS,
  FEE_CURRENCIES,
  AMOUNT_CURRENCIES,
  LIMIT_PAYMENT_METHODS,
  RISK_CUSTOMER_TYPES,
  withRiskDefaults,
  saveRisk,
  saveLimits,
} from '@/lib/hq-commission-shared';
import type { CustomerTypeLimitKey, LimitPaymentMethod } from '@/lib/api';
import {
  CUSTOMER_TYPES_UI_ORDER,
  SETTLEMENT_ASSETS_UI_ORDER,
} from '@/constants/ui-display-order';

const LIMIT_CUSTOMER_TYPES = CUSTOMER_TYPES_UI_ORDER;
type LimitCustomerType = (typeof LIMIT_CUSTOMER_TYPES)[number];

const LIMIT_METHOD_LABEL: Record<LimitPaymentMethod, MessageKey> = {
  BANK_TRANSFER: 'hq.risk.limitMethod.BANK_TRANSFER',
  REMITTANCE: 'hq.risk.limitMethod.REMITTANCE',
  CARD: 'hq.risk.limitMethod.CARD',
};

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

type LimitAmountField = Exclude<keyof CurrencyTransactionLimits, 'enabled'>;

const LIMIT_FIELDS: Array<{ key: LimitAmountField; labelKey: MessageKey }> = [
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
  const [exchangeRateSourcesByAsset, setExchangeRateSourcesByAsset] =
    useState<HqExchangeRateSourcesByAsset | null>(null);
  const [exchangeRatePreviewByAsset, setExchangeRatePreviewByAsset] = useState<{
    USDT: ExchangeRatePreviewRow[];
    USDC: ExchangeRatePreviewRow[];
  }>({ USDT: [], USDC: [] });
  const [savingRateSources, setSavingRateSources] = useState(false);
  const [rateSourcesMsg, setRateSourcesMsg] = useState('');
  const [editingLimitCurrency, setEditingLimitCurrency] = useState<SymbolFeeCurrency | null>(null);
  const [limitDraft, setLimitDraft] = useState<CurrencyTransactionLimits | null>(null);
  const [editingMaxDaily, setEditingMaxDaily] = useState(false);
  const [maxDailyDraft, setMaxDailyDraft] = useState(0);
  const [savingRisk, setSavingRisk] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);
  const [limitsMsg, setLimitsMsg] = useState('');
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
  const [limitCustomerType, setLimitCustomerType] = useState<LimitCustomerType>('CORPORATE');
  const [limitPaymentMethod, setLimitPaymentMethod] =
    useState<LimitPaymentMethod>('BANK_TRANSFER');
  const [riskTierCustomerType, setRiskTierCustomerType] =
    useState<CustomerTypeLimitKey>('CORPORATE');

  const settlementAssetLabel = data?.settlementAsset === 'USDC' ? 'USDC' : 'USDT';
  const rateSourceLabel = (source: ExchangeRateSourceId | string, asset: SettlementAsset) =>
    t(`hq.commission.rateSource.${source}` as MessageKey, { asset });

  function previewFor(asset: SettlementAsset, currency: SymbolFeeCurrency) {
    return exchangeRatePreviewByAsset[asset].find((row) => row.currency === currency);
  }

  function updateRateSource(
    asset: SettlementAsset,
    currency: SymbolFeeCurrency,
    source: ExchangeRateSourceId,
  ) {
    setExchangeRateSourcesByAsset((prev) =>
      prev
        ? {
            ...prev,
            [asset]: { ...prev[asset], [currency]: source },
          }
        : prev,
    );
  }

  async function saveRateSources() {
    if (!exchangeRateSourcesByAsset) return;
    setSavingRateSources(true);
    setRateSourcesMsg('');
    try {
      const next = await hqPolicyApi.saveExchangeRateSources(exchangeRateSourcesByAsset);
      setData(next);
      const byAsset = next.exchangeRateSourcesByAsset ?? {
        USDT: next.exchangeRateSources,
        USDC: next.exchangeRateSources,
      };
      setExchangeRateSourcesByAsset(byAsset);
      setExchangeRatePreviewByAsset(
        next.exchangeRatePreviewByAsset ?? {
          USDT: next.exchangeRatePreview ?? [],
          USDC: next.exchangeRatePreview ?? [],
        },
      );
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
        setExchangeRateSourcesByAsset(
          commission.exchangeRateSourcesByAsset ?? {
            USDT: commission.exchangeRateSources,
            USDC: commission.exchangeRateSources,
          },
        );
        setExchangeRatePreviewByAsset(
          commission.exchangeRatePreviewByAsset ?? {
            USDT: commission.exchangeRatePreview ?? [],
            USDC: commission.exchangeRatePreview ?? [],
          },
        );
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
    const methods = withRiskDefaults(risk).methodTransactionLimits!;
    setEditingLimitCurrency(currency);
    setLimitDraft({ ...methods[limitPaymentMethod][limitCustomerType][currency] });
    setMsg('');
  }

  function updateLimitDraft(field: LimitAmountField, value: number) {
    setLimitDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function saveLimitEdit() {
    if (!risk || !editingLimitCurrency || !limitDraft) return;
    setRisk((prev) => {
      if (!prev) return prev;
      const base = withRiskDefaults(prev);
      const methods = { ...base.methodTransactionLimits! };
      const methodPolicy = {
        ...methods[limitPaymentMethod],
        [limitCustomerType]: {
          ...methods[limitPaymentMethod][limitCustomerType],
          [editingLimitCurrency]: { ...limitDraft },
        },
      };
      methods[limitPaymentMethod] = methodPolicy;
      return {
        ...prev,
        methodTransactionLimits: methods,
        transactionLimits: methods.BANK_TRANSFER,
        maxTicketAmountKrw:
          limitPaymentMethod === 'BANK_TRANSFER' &&
          limitCustomerType === 'INDIVIDUAL' &&
          editingLimitCurrency === 'KRW'
            ? limitDraft.perTransactionMax
            : prev.maxTicketAmountKrw,
      };
    });
    cancelLimitEdit();
  }

  function setLimitRowEnabled(currency: SymbolFeeCurrency, enabled: boolean) {
    if (!risk) return;
    setRisk((prev) => {
      if (!prev) return prev;
      const base = withRiskDefaults(prev);
      const methods = { ...base.methodTransactionLimits! };
      const current = methods[limitPaymentMethod][limitCustomerType][currency];
      methods[limitPaymentMethod] = {
        ...methods[limitPaymentMethod],
        [limitCustomerType]: {
          ...methods[limitPaymentMethod][limitCustomerType],
          [currency]: { ...current, enabled },
        },
      };
      return {
        ...prev,
        methodTransactionLimits: methods,
        transactionLimits: methods.BANK_TRANSFER,
      };
    });
    if (editingLimitCurrency === currency && limitDraft) {
      setLimitDraft({ ...limitDraft, enabled });
    }
  }

  async function saveLimitsConfig() {
    if (!risk) return;
    if (hasPolicyEditInProgress()) {
      setLimitsMsg(t('hq.commission.tierFinishEditFirst'));
      return;
    }
    requestConfirm({
      title: t('hq.commission.saveLimits'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: async () => {
        setSavingLimits(true);
        setLimitsMsg('');
        try {
          const next = await saveLimits(risk);
          setData(next);
          setRisk(withRiskDefaults(next.risk));
          setLimitsMsg(t('hq.saved'));
        } catch (e) {
          setLimitsMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setSavingLimits(false);
        }
      },
    });
  }

  function setRiskEnabledForType(type: CustomerTypeLimitKey, enabled: boolean) {
    setRisk((prev) => {
      if (!prev) return prev;
      const base = withRiskDefaults(prev);
      const byType = {
        ...base.riskEnabledByCustomerType!,
        [type]: enabled,
      };
      return {
        ...prev,
        riskEnabledByCustomerType: byType,
        riskEnabled: byType.CORPORATE,
      };
    });
  }

  function updateRiskTierBand(
    type: CustomerTypeLimitKey,
    tier: UsdtRiskLimitTier,
    field: 'minUsdt' | 'maxUsdt',
    value: number,
  ) {
    setRisk((prev) => {
      if (!prev) return prev;
      const base = withRiskDefaults(prev);
      const byType = {
        ...base.usdtRiskLimitTiersByCustomerType!,
        [type]: {
          ...base.usdtRiskLimitTiersByCustomerType![type],
          [tier]: {
            ...base.usdtRiskLimitTiersByCustomerType![type][tier],
            [field]: Math.max(0, value),
          },
        },
      };
      return {
        ...prev,
        usdtRiskLimitTiersByCustomerType: byType,
        usdtRiskLimitTiers: byType.CORPORATE,
      };
    });
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

  if (!data || !risk || !exchangeRateSourcesByAsset) return <p className="pg-hint">{t('hq.loading')}</p>;

  const rateAssetCards: SettlementAsset[] = [...SETTLEMENT_ASSETS_UI_ORDER];

  return (
    <div className="pg-stack">
      {doubleConfirmDialog}

      {/* Exchange Rate Sources — USDC then USDT cards always visible */}
      <section className="pg-section">
        <div className="pg-section-head">{t('hq.commission.rateSourceSectionTitle')}</div>
        <div className="pg-section-pad space-y-4">
          <p className="pg-hint">{t('hq.commission.rateSourceSectionDesc')}</p>
          <div className="grid gap-4 xl:grid-cols-2">
            {rateAssetCards.map((asset) => (
              <div key={asset} className="pg-card space-y-3 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800">
                    {t('hq.commission.rateSourceTitle', { asset })}
                  </p>
                  {settlementAssetLabel === asset && (
                    <span className="rounded bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800">
                      {t('hq.commission.rateSourceActiveSettlement')}
                    </span>
                  )}
                </div>
                <p className="pg-hint text-xs">{t('hq.commission.rateSourceDesc', { asset })}</p>
                <p className="pg-hint text-[11px] text-slate-500">
                  {t('hq.commission.rateSourceFailHint')}
                </p>
                <div className="pg-table-wrap">
                  <table className="pg-table">
                    <thead>
                      <tr>
                        <th>{t('hq.commission.rateSourceCurrency')}</th>
                        <th>{t('hq.commission.rateSourceSelect')}</th>
                        <th>{t('hq.commission.rateSourcePreview', { asset })}</th>
                        <th>{t('hq.commission.rateSourceActual')}</th>
                        <th>{t('hq.commission.rateSourceUpdated')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FEE_CURRENCIES.map((currency) => {
                        const preview = previewFor(asset, currency);
                        /** 완전 실패(시세 없음)만 회색. USDT 환산·CoinGecko 대체는 정상 행 */
                        const fetchFailed =
                          preview == null ||
                          preview.rate == null ||
                          preview.actualSource === 'error';
                        return (
                          <tr
                            key={`${asset}-${currency}`}
                            className={
                              fetchFailed
                                ? 'bg-slate-100/90 text-slate-500'
                                : undefined
                            }
                          >
                            <td className="font-mono font-semibold">{currency}</td>
                            <td>
                              <select
                                value={exchangeRateSourcesByAsset[asset][currency]}
                                onChange={(e) =>
                                  updateRateSource(
                                    asset,
                                    currency,
                                    e.target.value as ExchangeRateSourceId,
                                  )
                                }
                                className="pg-input min-w-[10rem]"
                              >
                                {RATE_SOURCES.map((source) => (
                                  <option key={source} value={source}>
                                    {rateSourceLabel(source, asset)}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td
                              className={
                                fetchFailed
                                  ? 'tabular-nums font-semibold text-slate-400'
                                  : 'tabular-nums font-semibold text-blue-700'
                              }
                            >
                              {preview?.rate != null
                                ? preview.rate.toLocaleString(undefined, {
                                    maximumFractionDigits: currency === 'JPY' ? 2 : 0,
                                  })
                                : '—'}
                            </td>
                            <td className="pg-muted text-xs">
                              {fetchFailed
                                ? '—'
                                : rateSourceLabel(
                                    preview.actualSource.replace('_fallback', ''),
                                    asset,
                                  )}
                            </td>
                            <td className="pg-muted text-xs">
                              {!fetchFailed && preview?.fetchedAt
                                ? new Date(preview.fetchedAt).toLocaleString()
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
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
                {t(
                  `hq.commission.localPremium.${premium.currency}.desc` as 'hq.commission.localPremium.KRW.desc',
                  { asset: settlementAssetLabel },
                )}
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
                    USD/{premium.currency} {premium.usdFiatRate.toLocaleString()} × {settlementAssetLabel}
                    /USD {premium.usdtUsdRate.toFixed(4)}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
          {((data.localPremiums?.length ?? 0) > 0 || data.kimchiPremium) && (
            <p className="text-xs text-rose-800">
              {t('hq.commission.localPremiumDesc', { asset: settlementAssetLabel })}
            </p>
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

      {/* Agreed apply logic — 한도설정 vs 리스크 티어 */}
      <section className="pg-section">
        <div className="pg-section-head">{t('hq.risk.applyLogicTitle')}</div>
        <div className="pg-section-pad">
          <div className="pg-card">
            <div className="pg-card-body space-y-3 text-sm text-slate-800">
              <p className="font-medium text-slate-900">{t('hq.risk.applyLogicMaster')}</p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>{t('hq.risk.applyLogicLimits')}</li>
                <li>{t('hq.risk.applyLogicTiers')}</li>
                <li>{t('hq.risk.applyLogicCustomer')}</li>
                <li>{t('hq.risk.applyLogicCombine')}</li>
              </ol>
              <p className="pg-hint text-xs">{t('hq.risk.applyLogicScope')}</p>
              <p className="pg-hint text-xs text-amber-800">{t('hq.risk.applyLogicCard')}</p>
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
              <p className="pg-hint text-xs text-sky-900 font-medium">{t('hq.risk.limitsApplyWhere')}</p>
              <p className="pg-hint text-xs text-sky-800">{t('hq.risk.limitsMethodHint')}</p>
              <p className="pg-callout pg-callout-muted">{t('hq.commission.tierEditHint')}</p>
              <div className="flex flex-wrap gap-2">
                {LIMIT_PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      if (limitPaymentMethod !== method) cancelLimitEdit();
                      setLimitPaymentMethod(method);
                    }}
                    className={`pg-btn text-xs ${
                      limitPaymentMethod === method ? 'pg-btn-primary' : 'pg-btn-secondary'
                    }`}
                  >
                    {t(LIMIT_METHOD_LABEL[method])}
                  </button>
                ))}
              </div>
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
              <p className="pg-hint text-[11px] text-slate-600">
                {limitPaymentMethod === 'BANK_TRANSFER'
                  ? t('hq.risk.limitsBankNote')
                  : limitPaymentMethod === 'REMITTANCE'
                    ? t('hq.risk.limitsRemitNote')
                    : t('hq.risk.limitsCardNote')}
              </p>
              <div className="pg-card pg-table-wrap">
                <table className="pg-table">
                  <thead>
                    <tr>
                      <th>{t('hq.commission.tierCurrency')}</th>
                      <th>{t('hq.commission.limitStatus')}</th>
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
                      const methodLimits =
                        withRiskDefaults(risk).methodTransactionLimits![limitPaymentMethod];
                      const limits = isEditing && limitDraft
                        ? limitDraft
                        : methodLimits[limitCustomerType][currency];
                      const rowActive = limits.enabled !== false;
                      return (
                        <tr
                          key={currency}
                          className={[
                            isEditing ? 'pg-row-edit' : '',
                            !rowActive ? 'bg-slate-100 text-slate-500' : '',
                          ]
                            .filter(Boolean)
                            .join(' ') || undefined}
                        >
                          <td className="font-mono font-medium">{currency}</td>
                          <td>
                            <select
                              className="pg-input w-28 text-xs"
                              value={rowActive ? '1' : '0'}
                              onChange={(e) =>
                                setLimitRowEnabled(currency, e.target.value === '1')
                              }
                              aria-label={`${currency} ${t('hq.commission.limitStatus')}`}
                            >
                              <option value="1">{t('hq.services.active')}</option>
                              <option value="0">{t('hq.services.inactive')}</option>
                            </select>
                          </td>
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
              <p className="pg-hint text-[10px]">{t('hq.commission.limitsInactiveHint')}</p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void saveLimitsConfig()}
                  disabled={savingLimits || hasPolicyEditInProgress()}
                  className="pg-btn pg-btn-primary text-xs disabled:opacity-50"
                >
                  {savingLimits ? t('hq.saving') : t('hq.commission.saveLimits')}
                </button>
                {limitsMsg && <span className="pg-hint">{limitsMsg}</span>}
              </div>
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
              <p className="pg-hint text-xs text-sky-900 font-medium">{t('hq.risk.tiersApplyWhere')}</p>

              <div className="flex flex-wrap gap-2">
                {RISK_CUSTOMER_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRiskTierCustomerType(type)}
                    className={`pg-btn text-xs ${
                      riskTierCustomerType === type ? 'pg-btn-primary' : 'pg-btn-secondary'
                    }`}
                  >
                    {type === 'INDIVIDUAL'
                      ? t('hq.commission.limitsIndividual')
                      : t('hq.commission.limitsCorporate')}
                  </button>
                ))}
              </div>

              {(() => {
                const riskDefaults = withRiskDefaults(risk);
                const riskOn =
                  riskDefaults.riskEnabledByCustomerType![riskTierCustomerType] !== false;
                const tierFallback =
                  riskTierCustomerType === 'INDIVIDUAL'
                    ? DEFAULT_INDIVIDUAL_USDT_RISK_LIMIT_TIERS
                    : DEFAULT_USDT_RISK_LIMIT_TIERS;
                const tiers =
                  riskDefaults.usdtRiskLimitTiersByCustomerType![riskTierCustomerType];
                return (
                  <>
                    <div
                      className={`flex flex-wrap items-center gap-3 rounded-md p-3 ${
                        riskOn ? 'bg-white' : 'bg-slate-100'
                      }`}
                    >
                      <label
                        className="pg-label shrink-0"
                        htmlFor={`hq-risk-enabled-${riskTierCustomerType}`}
                      >
                        {t('hq.commission.riskEnabled')}
                        {' · '}
                        {riskTierCustomerType === 'INDIVIDUAL'
                          ? t('hq.commission.limitsIndividual')
                          : t('hq.commission.limitsCorporate')}
                      </label>
                      <select
                        id={`hq-risk-enabled-${riskTierCustomerType}`}
                        className="pg-input w-40"
                        value={riskOn ? '1' : '0'}
                        onChange={(e) =>
                          setRiskEnabledForType(
                            riskTierCustomerType,
                            e.target.value === '1',
                          )
                        }
                        aria-label={t('hq.commission.riskEnabled')}
                      >
                        <option value="1">{t('hq.services.active')}</option>
                        <option value="0">{t('hq.services.inactive')}</option>
                      </select>
                    </div>
                    <p className="pg-hint text-xs">{t('hq.commission.riskEnabledHint')}</p>

                    <div className={`space-y-2 ${riskOn ? '' : 'opacity-60'}`}>
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
                              const band = tiers[tier] ?? tierFallback[tier];
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
                                        updateRiskTierBand(
                                          riskTierCustomerType,
                                          tier,
                                          'minUsdt',
                                          n,
                                        )
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
                                        updateRiskTierBand(
                                          riskTierCustomerType,
                                          tier,
                                          'maxUsdt',
                                          n,
                                        )
                                      }
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <p className="pg-hint text-[10px]">
                        {t('hq.commission.usdtRiskTierZeroHint')}
                      </p>
                    </div>
                  </>
                );
              })()}

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
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  hqPolicyApi,
  type ExchangeRatePreviewRow,
  type ExchangeRateSourceId,
  type HqCommissionPayload,
  type HqCommissionRiskConfig,
  type HqExchangeRateSourcePolicy,
  type CurrencyTransactionLimits,
  type CustomerTransactionLimitsPolicy,
  type FeeDiagramDisplayConfig,
  type SymbolFeeCurrency,
  type SymbolFeeTierRow,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import { formatAmountInput } from '@/lib/format';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';
import { PolicyCellValue } from '@/components/policy/PolicyCellValue';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';

type OrgRateRow = {
  organizationId: string;
  code: string;
  name: string;
  type: string;
  path: string;
  usdtPurchase: string;
  tradeEscrow: string;
};

const FEE_CURRENCIES: SymbolFeeCurrency[] = ['KRW', 'JPY', 'THB', 'CNY', 'USD'];
const LIMIT_CUSTOMER_TYPES = ['INDIVIDUAL', 'CORPORATE'] as const;
type LimitCustomerType = (typeof LIMIT_CUSTOMER_TYPES)[number];

const FEE_DIAGRAM_KEYS: Array<{ key: keyof FeeDiagramDisplayConfig; labelKey: MessageKey }> = [
  { key: 'gross', labelKey: 'hq.commission.feeDiagram.gross' },
  { key: 'fxFee', labelKey: 'hq.commission.feeDiagram.fxFee' },
  { key: 'gasFee', labelKey: 'hq.commission.feeDiagram.gasFee' },
  { key: 'transferFee', labelKey: 'hq.commission.feeDiagram.transferFee' },
  { key: 'otherFee', labelKey: 'hq.commission.feeDiagram.otherFee' },
  { key: 'localPremium', labelKey: 'hq.commission.feeDiagram.localPremium' },
  { key: 'net', labelKey: 'hq.commission.feeDiagram.net' },
  { key: 'requiredFiat', labelKey: 'hq.commission.feeDiagram.requiredFiat' },
  { key: 'showRates', labelKey: 'hq.commission.feeDiagram.showRates' },
];

const DEFAULT_FEE_DIAGRAM: FeeDiagramDisplayConfig = {
  gross: true,
  fxFee: true,
  gasFee: true,
  transferFee: true,
  otherFee: true,
  localPremium: true,
  net: true,
  requiredFiat: true,
  showRates: true,
};

function withFeeDiagramDefaults(risk: HqCommissionRiskConfig): HqCommissionRiskConfig {
  return {
    ...risk,
    feeDiagramDisplay: { ...DEFAULT_FEE_DIAGRAM, ...risk.feeDiagramDisplay },
  };
}

const LIMIT_FIELDS: Array<{ key: keyof CurrencyTransactionLimits; labelKey: MessageKey }> = [
  { key: 'perTransactionMin', labelKey: 'hq.commission.limitPerTxMin' },
  { key: 'perTransactionMax', labelKey: 'hq.commission.limitPerTxMax' },
  { key: 'dailyMin', labelKey: 'hq.commission.limitDailyMin' },
  { key: 'dailyMax', labelKey: 'hq.commission.limitDailyMax' },
  { key: 'monthlyMin', labelKey: 'hq.commission.limitMonthlyMin' },
  { key: 'monthlyMax', labelKey: 'hq.commission.limitMonthlyMax' },
];

function emptyCurrencyLimits(): CurrencyTransactionLimits {
  return {
    perTransactionMin: 0,
    perTransactionMax: 0,
    dailyMin: 0,
    dailyMax: 0,
    monthlyMin: 0,
    monthlyMax: 0,
  };
}

function ensureTransactionLimits(risk: HqCommissionRiskConfig): HqCommissionRiskConfig {
  if (risk.transactionLimits) return risk;
  const policy = {
    INDIVIDUAL: {} as CustomerTransactionLimitsPolicy['INDIVIDUAL'],
    CORPORATE: {} as CustomerTransactionLimitsPolicy['CORPORATE'],
  };
  for (const currency of FEE_CURRENCIES) {
    const row = emptyCurrencyLimits();
    if (currency === 'KRW' && risk.maxTicketAmountKrw > 0) {
      row.perTransactionMax = risk.maxTicketAmountKrw;
      row.dailyMax = risk.maxTicketAmountKrw * 5;
      row.monthlyMax = risk.maxTicketAmountKrw * 20;
    }
    policy.INDIVIDUAL[currency] = { ...row };
    policy.CORPORATE[currency] = {
      ...row,
      perTransactionMax: row.perTransactionMax * 5,
      dailyMax: row.dailyMax * 5,
      monthlyMax: row.monthlyMax * 5,
    };
  }
  return { ...risk, transactionLimits: policy };
}

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

function newTierId() {
  return `tier-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultTierForCurrency(currency: SymbolFeeCurrency, risk: HqCommissionRiskConfig): SymbolFeeTierRow {
  return {
    id: newTierId(),
    currency,
    maxAmount: currency === 'KRW' ? 1_000_000 : currency === 'JPY' ? 100_000 : 10_000,
    fxFeePercent: risk.defaultFxFeePercent,
    gasFeeUsdt: risk.defaultGasFeeUsdt,
    transferFeeUsdt: risk.defaultTransferFeeUsdt,
    otherFeeUsdt: risk.defaultOtherFeeUsdt,
  };
}

function sortedTierIds(currency: SymbolFeeCurrency, tiers: SymbolFeeTierRow[]) {
  return tiers
    .filter((row) => row.currency === currency)
    .sort((a, b) => a.maxAmount - b.maxAmount)
    .map((row) => row.id);
}

function depthFromPath(path: string) {
  return path.split('/').filter(Boolean).length;
}

function buildOrgRows(data: HqCommissionPayload): OrgRateRow[] {
  const byOrg = new Map<string, { USDT_PURCHASE?: string; TRADE_ESCROW?: string }>();
  for (const r of data.rates) {
    const entry = byOrg.get(r.organization.id) ?? {};
    if (r.ticketType === 'USDT_PURCHASE') entry.USDT_PURCHASE = r.ratePercent;
    if (r.ticketType === 'TRADE_ESCROW') entry.TRADE_ESCROW = r.ratePercent;
    byOrg.set(r.organization.id, entry);
  }

  const orgMap = new Map<string, HqCommissionPayload['rates'][number]['organization']>();
  for (const r of data.rates) {
    orgMap.set(r.organization.id, r.organization);
  }

  const orgs = [...orgMap.values()].sort((a, b) => a.code.localeCompare(b.code));

  return orgs.map((org) => {
    const rates = byOrg.get(org.id) ?? {};
    return {
      organizationId: org.id,
      code: org.code,
      name: org.name,
      type: org.type,
      path: '',
      usdtPurchase: rates.USDT_PURCHASE ?? '0',
      tradeEscrow: rates.TRADE_ESCROW ?? '0',
    };
  });
}

function mergeWithOrganizations(
  rows: OrgRateRow[],
  data: HqCommissionPayload,
  allOrgs: Array<{ id: string; code: string; name: string; type: string; path?: string }>,
): OrgRateRow[] {
  const rowMap = new Map(rows.map((r) => [r.organizationId, r]));
  return allOrgs
    .sort((a, b) => (a.path ?? '').localeCompare(b.path ?? ''))
    .map((org) => {
      const existing = rowMap.get(org.id);
      return {
        organizationId: org.id,
        code: org.code,
        name: org.name,
        type: org.type,
        path: org.path ?? '',
        usdtPurchase: existing?.usdtPurchase ?? '0',
        tradeEscrow: existing?.tradeEscrow ?? '0',
      };
    });
}

export default function HqCommissionPage() {
  const t = useT();
  const [data, setData] = useState<HqCommissionPayload | null>(null);
  const [risk, setRisk] = useState<HqCommissionRiskConfig | null>(null);
  const [orgRows, setOrgRows] = useState<OrgRateRow[]>([]);
  const [feeTiers, setFeeTiers] = useState<SymbolFeeTierRow[]>([]);
  const [exchangeRateSources, setExchangeRateSources] = useState<HqExchangeRateSourcePolicy | null>(null);
  const [exchangeRatePreview, setExchangeRatePreview] = useState<ExchangeRatePreviewRow[]>([]);
  const [savingRateSources, setSavingRateSources] = useState(false);
  const [rateSourcesMsg, setRateSourcesMsg] = useState('');
  const [feeCurrency, setFeeCurrency] = useState<SymbolFeeCurrency>('KRW');
  const [savingTiers, setSavingTiers] = useState(false);
  const [tiersMsg, setTiersMsg] = useState('');
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierDraft, setTierDraft] = useState<SymbolFeeTierRow | null>(null);
  const [tierDisplayOrder, setTierDisplayOrder] = useState<string[]>([]);
  const [editingLimitCurrency, setEditingLimitCurrency] = useState<SymbolFeeCurrency | null>(null);
  const [limitDraft, setLimitDraft] = useState<CurrencyTransactionLimits | null>(null);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [orgDraft, setOrgDraft] = useState<{ usdtPurchase: string; tradeEscrow: string } | null>(null);
  const [editingMaxDaily, setEditingMaxDaily] = useState(false);
  const [maxDailyDraft, setMaxDailyDraft] = useState(0);
  const [savingRisk, setSavingRisk] = useState(false);
  const [savingRates, setSavingRates] = useState(false);
  const [msg, setMsg] = useState('');
  const [ratesMsg, setRatesMsg] = useState('');
  const [error, setError] = useState('');
  const [limitCustomerType, setLimitCustomerType] = useState<LimitCustomerType>('INDIVIDUAL');

  const orgTypeLabel = (type: string) => t(`org.${type}` as MessageKey);
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
    Promise.all([hqPolicyApi.getCommission(), api.organizations()])
      .then(([commission, orgs]) => {
        setData(commission);
        setRisk(ensureTransactionLimits(withFeeDiagramDefaults({
          ...commission.risk,
          defaultFxFeePercent: commission.risk.defaultFxFeePercent ?? 0,
          defaultTransferFeeUsdt:
            commission.risk.defaultTransferFeeUsdt ??
            commission.risk.defaultPlatformFeeUsdt ??
            0,
          defaultOtherFeeUsdt: commission.risk.defaultOtherFeeUsdt ?? 0,
        })));
        const baseRows = buildOrgRows(commission);
        setOrgRows(mergeWithOrganizations(baseRows, commission, orgs));
        setFeeTiers(commission.feeTiers ?? []);
        setExchangeRateSources(commission.exchangeRateSources);
        setExchangeRatePreview(commission.exchangeRatePreview ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  const historyRows = useMemo(() => {
    if (!data) return [];
    return [...data.rates].sort((a, b) => {
      const pathA = orgRows.find((o) => o.organizationId === a.organization.id)?.path ?? '';
      const pathB = orgRows.find((o) => o.organizationId === b.organization.id)?.path ?? '';
      if (pathA !== pathB) return pathA.localeCompare(pathB);
      return a.ticketType.localeCompare(b.ticketType);
    });
  }, [data, orgRows]);

  const currencyTiers = useMemo(() => {
    const byId = new Map(
      feeTiers.filter((row) => row.currency === feeCurrency).map((row) => [row.id, row]),
    );
    return tierDisplayOrder
      .map((id) => {
        const row = byId.get(id);
        if (!row) return null;
        if (editingTierId === id && tierDraft) return tierDraft;
        return row;
      })
      .filter((row): row is SymbolFeeTierRow => row != null);
  }, [feeTiers, feeCurrency, tierDisplayOrder, editingTierId, tierDraft]);

  useEffect(() => {
    if (!editingTierId) {
      setTierDisplayOrder(sortedTierIds(feeCurrency, feeTiers));
    }
  }, [feeTiers, feeCurrency, editingTierId]);

  function cancelTierEdit() {
    setEditingTierId(null);
    setTierDraft(null);
    setTiersMsg('');
  }

  function hasPolicyEditInProgress() {
    return (
      editingTierId !== null ||
      editingLimitCurrency !== null ||
      editingOrgId !== null ||
      editingMaxDaily
    );
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
      const base = ensureTransactionLimits(prev);
      const nextLimits = {
        ...base.transactionLimits,
        [limitCustomerType]: {
          ...base.transactionLimits[limitCustomerType],
          [editingLimitCurrency]: { ...limitDraft },
        },
      };
      return {
        ...base,
        transactionLimits: nextLimits,
        maxTicketAmountKrw:
          limitCustomerType === 'INDIVIDUAL' && editingLimitCurrency === 'KRW'
            ? limitDraft.perTransactionMax
            : base.maxTicketAmountKrw,
      };
    });
    cancelLimitEdit();
  }

  function cancelOrgEdit() {
    setEditingOrgId(null);
    setOrgDraft(null);
    setRatesMsg('');
  }

  function startOrgEdit(row: OrgRateRow) {
    if (hasPolicyEditInProgress()) return;
    setEditingOrgId(row.organizationId);
    setOrgDraft({ usdtPurchase: row.usdtPurchase, tradeEscrow: row.tradeEscrow });
    setRatesMsg('');
  }

  function saveOrgEdit() {
    if (!editingOrgId || !orgDraft) return;
    setOrgRows((prev) =>
      prev.map((row) =>
        row.organizationId === editingOrgId
          ? { ...row, usdtPurchase: orgDraft.usdtPurchase, tradeEscrow: orgDraft.tradeEscrow }
          : row,
      ),
    );
    cancelOrgEdit();
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

  function startTierEdit(row: SymbolFeeTierRow) {
    if (hasPolicyEditInProgress()) return;
    setTierDisplayOrder(sortedTierIds(feeCurrency, feeTiers));
    setEditingTierId(row.id);
    setTierDraft({ ...row });
    setTiersMsg('');
  }

  function updateTierDraft(patch: Partial<SymbolFeeTierRow>) {
    setTierDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function saveTierEdit() {
    if (!tierDraft) return;
    if (tierDraft.maxAmount < 1) {
      setTiersMsg(t('hq.commission.tierMaxAmountInvalid'));
      return;
    }
    setFeeTiers((prev) => prev.map((row) => (row.id === tierDraft.id ? tierDraft : row)));
    cancelTierEdit();
  }

  function addTier() {
    if (!risk || editingTierId) return;
    setFeeTiers((prev) => [...prev, defaultTierForCurrency(feeCurrency, risk)]);
  }

  function removeTier(id: string) {
    if (editingTierId) return;
    setFeeTiers((prev) => prev.filter((row) => row.id !== id));
  }

  async function saveFeeTiers() {
    if (editingTierId) {
      setTiersMsg(t('hq.commission.tierFinishEditFirst'));
      return;
    }
    setSavingTiers(true);
    setTiersMsg('');
    try {
      const next = await hqPolicyApi.saveSymbolFeeTiers(feeTiers);
      setData(next);
      setFeeTiers(next.feeTiers);
      setTiersMsg(t('hq.commission.tiersSaved'));
    } catch (e) {
      setTiersMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSavingTiers(false);
    }
  }

  async function saveRisk() {
    if (!risk) return;
    if (hasPolicyEditInProgress()) {
      setMsg(t('hq.commission.tierFinishEditFirst'));
      return;
    }
    setSavingRisk(true);
    setMsg('');
    try {
      const payload = ensureTransactionLimits({
        ...risk,
        maxTicketAmountKrw:
          risk.transactionLimits?.INDIVIDUAL?.KRW?.perTransactionMax ?? risk.maxTicketAmountKrw,
      });
      const next = await hqPolicyApi.saveCommissionRisk(payload);
      setData(next);
      setRisk(ensureTransactionLimits(withFeeDiagramDefaults(next.risk)));
      setMsg(t('hq.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSavingRisk(false);
    }
  }

  async function saveRates() {
    if (hasPolicyEditInProgress()) {
      setRatesMsg(t('hq.commission.tierFinishEditFirst'));
      return;
    }
    setSavingRates(true);
    setRatesMsg('');
    try {
      const rates = orgRows.flatMap((row) => [
        {
          organizationId: row.organizationId,
          ticketType: 'USDT_PURCHASE',
          ratePercent: Number(row.usdtPurchase) || 0,
        },
        {
          organizationId: row.organizationId,
          ticketType: 'TRADE_ESCROW',
          ratePercent: Number(row.tradeEscrow) || 0,
        },
      ]);
      const next = await hqPolicyApi.saveCommissionRates(rates);
      setData(next);
      const baseRows = buildOrgRows(next);
      const orgs = orgRows.map((r) => ({
        id: r.organizationId,
        code: r.code,
        name: r.name,
        type: r.type,
        path: r.path,
      }));
      setOrgRows(mergeWithOrganizations(baseRows, next, orgs));
      setRatesMsg(t('hq.commission.ratesSaved'));
    } catch (e) {
      setRatesMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSavingRates(false);
    }
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

      <section className="pg-section">
        <div className="pg-section-head">{t('hq.commission.symbolTitle')}</div>
        <div className="pg-section-pad space-y-3">
        <p className="pg-hint">{t('hq.commission.symbolDesc')}</p>

        <div className="pg-card">
          <div className="pg-card-head">{t('hq.commission.feeDiagramTitle')}</div>
          <div className="pg-card-body space-y-3">
            <p className="pg-hint text-xs">{t('hq.commission.feeDiagramDesc')}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {FEE_DIAGRAM_KEYS.map(({ key, labelKey }) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={risk.feeDiagramDisplay?.[key] ?? DEFAULT_FEE_DIAGRAM[key]}
                    onChange={() =>
                      setRisk((prev) =>
                        prev
                          ? {
                              ...prev,
                              feeDiagramDisplay: {
                                ...DEFAULT_FEE_DIAGRAM,
                                ...prev.feeDiagramDisplay,
                                [key]: !(prev.feeDiagramDisplay?.[key] ?? DEFAULT_FEE_DIAGRAM[key]),
                              },
                            }
                          : prev,
                      )
                    }
                  />
                  <span>{t(labelKey)}</span>
                </label>
              ))}
            </div>
            <p className="pg-hint text-[10px]">{t('hq.commission.feeDiagramSaveHint')}</p>
          </div>
        </div>

        <div className="pg-segment-bar">
          {FEE_CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                if (feeCurrency !== c) cancelTierEdit();
                setFeeCurrency(c);
              }}
              className={`pg-subtab ${feeCurrency === c ? 'pg-subtab-active' : 'pg-subtab-idle'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="pg-hint">{t('hq.commission.tierTableDesc')}</p>
        <p className="pg-callout pg-callout-muted">{t('hq.commission.tierEditHint')}</p>

        <div className="pg-card pg-table-wrap">
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('hq.commission.tierCurrency')}</th>
                <th>{t('hq.commission.tierMaxAmount')}</th>
                <th>{t('hq.commission.fxFee')}</th>
                <th>{t('hq.commission.gasFee')}</th>
                <th>{t('hq.commission.transferFee')}</th>
                <th>{t('hq.commission.otherFee')}</th>
                <th>{t('hq.commission.tierActions')}</th>
              </tr>
            </thead>
            <tbody>
              {currencyTiers.map((row) => {
                const isEditing = editingTierId === row.id;
                const rowLocked = editingTierId !== null && !isEditing;
                return (
                <tr
                  key={row.id}
                  className={isEditing ? 'pg-row-edit' : undefined}
                >
                  <td className="font-mono">{row.currency}</td>
                  <td>
                    {isEditing ? (
                      <FormattedAmountInput
                        min={1}
                        commitOnBlur
                        value={row.maxAmount}
                        onChange={(maxAmount) => updateTierDraft({ maxAmount })}
                        className="pg-input min-w-[8rem]"
                      />
                    ) : (
                      <PolicyCellValue>{formatAmountInput(row.maxAmount)}</PolicyCellValue>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <PolicyNumberInput
                        min={0}
                        max={100}
                        value={row.fxFeePercent}
                        onChange={(fxFeePercent) => updateTierDraft({ fxFeePercent })}
                        className="pg-input w-24"
                      />
                    ) : (
                      <PolicyCellValue>{row.fxFeePercent}</PolicyCellValue>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <PolicyNumberInput
                        min={0}
                        value={row.gasFeeUsdt}
                        onChange={(gasFeeUsdt) => updateTierDraft({ gasFeeUsdt })}
                        className="pg-input w-24"
                      />
                    ) : (
                      <PolicyCellValue>{row.gasFeeUsdt}</PolicyCellValue>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <PolicyNumberInput
                        min={0}
                        value={row.transferFeeUsdt}
                        onChange={(transferFeeUsdt) => updateTierDraft({ transferFeeUsdt })}
                        className="pg-input w-24"
                      />
                    ) : (
                      <PolicyCellValue>{row.transferFeeUsdt}</PolicyCellValue>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <PolicyNumberInput
                        min={0}
                        value={row.otherFeeUsdt}
                        onChange={(otherFeeUsdt) => updateTierDraft({ otherFeeUsdt })}
                        className="pg-input w-24"
                      />
                    ) : (
                      <PolicyCellValue>{row.otherFeeUsdt}</PolicyCellValue>
                    )}
                  </td>
                  <td>
                    <PolicyTableActions>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={saveTierEdit}
                            className="pg-btn pg-btn-primary text-xs"
                          >
                            {t('hq.commission.tierSaveRow')}
                          </button>
                          <button
                            type="button"
                            onClick={cancelTierEdit}
                            className="pg-btn pg-btn-secondary text-xs"
                          >
                            {t('hq.commission.tierCancelEdit')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startTierEdit(row)}
                            disabled={rowLocked}
                            className="pg-btn pg-btn-secondary text-xs disabled:opacity-40"
                          >
                            {t('hq.commission.tierEdit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeTier(row.id)}
                            disabled={rowLocked}
                            className="pg-btn pg-btn-secondary text-xs text-red-600 disabled:opacity-40"
                          >
                            {t('hq.commission.tierRemove')}
                          </button>
                        </>
                      )}
                    </PolicyTableActions>
                  </td>
                </tr>
              );
              })}
              {currencyTiers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center pg-hint">
                    {t('hq.commission.tierEmpty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addTier}
            disabled={editingTierId !== null}
            className="pg-btn pg-btn-secondary disabled:opacity-40"
          >
            {t('hq.commission.tierAdd')}
          </button>
          <button
            type="button"
            onClick={saveFeeTiers}
            disabled={savingTiers || editingTierId !== null}
            className="pg-btn pg-btn-primary disabled:opacity-50"
          >
            {savingTiers ? t('hq.saving') : t('hq.commission.saveTiers')}
          </button>
          {tiersMsg && <span className="pg-hint">{tiersMsg}</span>}
        </div>

        <div className="pg-card">
          <div className="pg-card-head">{t('hq.commission.riskTitle')}</div>
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
              <p className="pg-label">{t('hq.commission.limitsTitle')}</p>
              <p className="pg-hint text-xs">{t('hq.commission.limitsDesc')}</p>
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
              onClick={saveRisk}
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

      <section className="pg-section">
        <div className="pg-section-head">{t('hq.commission.orgRatesTitle')}</div>
        <div className="pg-section-pad space-y-3">
        <p className="pg-hint">{t('hq.commission.orgRatesDesc')}</p>
        <p className="pg-callout pg-callout-warn">{t('hq.commission.totalHint')}</p>
        <p className="pg-callout pg-callout-muted">{t('hq.commission.tierEditHint')}</p>

        {orgRows.length === 0 ? (
          <p className="pg-hint">{t('hq.commission.noOrgs')}</p>
        ) : (
          <div className="pg-card pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>{t('hq.commission.code')}</th>
                  <th>{t('hq.commission.org')}</th>
                  <th>{t('hq.commission.type')}</th>
                  <th>{t('hq.commission.usdtPurchase')}</th>
                  <th>{t('hq.commission.tradeEscrow')}</th>
                  <th>{t('hq.commission.tierActions')}</th>
                </tr>
              </thead>
              <tbody>
                {orgRows.map((row) => {
                  const isEditing = editingOrgId === row.organizationId;
                  const rowLocked = editingOrgId !== null && !isEditing;
                  const rates = isEditing && orgDraft ? orgDraft : row;
                  return (
                    <tr
                      key={row.organizationId}
                      className={isEditing ? 'pg-row-edit' : undefined}
                    >
                      <td className="font-mono">{row.code}</td>
                      <td>{row.name}</td>
                      <td>{orgTypeLabel(row.type)}</td>
                      <td>
                        {isEditing ? (
                          <PolicyNumberInput
                            min={0}
                            max={100}
                            step="0.0001"
                            value={Number(rates.usdtPurchase) || 0}
                            onChange={(n) =>
                              setOrgDraft((prev) =>
                                prev ? { ...prev, usdtPurchase: String(n) } : prev,
                              )
                            }
                            className="pg-input w-24"
                          />
                        ) : (
                          <PolicyCellValue>{row.usdtPurchase}</PolicyCellValue>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <PolicyNumberInput
                            min={0}
                            max={100}
                            step="0.0001"
                            value={Number(rates.tradeEscrow) || 0}
                            onChange={(n) =>
                              setOrgDraft((prev) =>
                                prev ? { ...prev, tradeEscrow: String(n) } : prev,
                              )
                            }
                            className="pg-input w-24"
                          />
                        ) : (
                          <PolicyCellValue>{row.tradeEscrow}</PolicyCellValue>
                        )}
                      </td>
                      <td>
                        <PolicyTableActions>
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={saveOrgEdit}
                                className="pg-btn pg-btn-primary text-xs"
                              >
                                {t('hq.commission.tierSaveRow')}
                              </button>
                              <button
                                type="button"
                                onClick={cancelOrgEdit}
                                className="pg-btn pg-btn-secondary text-xs"
                              >
                                {t('hq.commission.tierCancelEdit')}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startOrgEdit(row)}
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
        )}

        <button
          type="button"
          onClick={saveRates}
          disabled={savingRates || orgRows.length === 0 || hasPolicyEditInProgress()}
          className="pg-btn pg-btn-primary disabled:opacity-50"
        >
          {savingRates ? t('hq.saving') : t('hq.commission.saveRates')}
        </button>
        {ratesMsg && <p className="pg-hint">{ratesMsg}</p>}
        </div>
      </section>

      <section className="pg-section">
        <div className="pg-section-head">{t('hq.commission.ratesTitle')}</div>
        <div className="pg-section-pad">
        <div className="pg-card pg-table-wrap">
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('hq.commission.org')}</th>
                <th>{t('hq.commission.type')}</th>
                <th>{t('hq.commission.ticket')}</th>
                <th>{t('hq.commission.rate')}</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.organization.name}</td>
                  <td>{orgTypeLabel(r.organization.type)}</td>
                  <td>{t(`ticket.${r.ticketType}` as MessageKey)}</td>
                  <td>{r.ratePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </section>
    </div>
  );
}

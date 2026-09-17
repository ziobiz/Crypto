'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  hqPolicyApi,
  type ExchangeRatePreviewRow,
  type ExchangeRateSourceId,
  type HqCommissionPayload,
  type HqCommissionRiskConfig,
  type HqExchangeRateSourcePolicy,
  type HqGasNetworkPolicy,
  type FeeTypeTemplate,
  type GasFeeGroupId,
  type CurrencyTransactionLimits,
  type CustomerTransactionLimitsPolicy,
  type FeeDiagramDisplayConfig,
  type HqCurrencyAmountDisplayPolicy,
  type SymbolFeeCurrency,
  type SymbolFeeTierRow,
} from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import { formatAmountInput } from '@/lib/format';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';
import { FeeDualInput } from '@/components/policy/FeeDualInput';
import { PolicyCellValue } from '@/components/policy/PolicyCellValue';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';
import { SimulatorCommissionPanel } from '@/components/hq-policy/SimulatorCommissionPanel';
import { FeeTypeTemplateGrid } from '@/components/hq-policy/FeeTypeTemplateGrid';

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

type FeeDiagramToggleKey = Exclude<
  keyof FeeDiagramDisplayConfig,
  'showRates' | 'defaultFeeBillingMethod' | 'billingMethod'
>;

const FEE_DIAGRAM_KEYS: Array<{ key: FeeDiagramToggleKey; labelKey: MessageKey }> = [
  { key: 'gross', labelKey: 'hq.commission.feeDiagram.gross' },
  { key: 'fxFee', labelKey: 'hq.commission.feeDiagram.fxFee' },
  { key: 'gasFee', labelKey: 'hq.commission.feeDiagram.gasFee' },
  { key: 'transferFee', labelKey: 'hq.commission.feeDiagram.transferFee' },
  { key: 'otherFee', labelKey: 'hq.commission.feeDiagram.otherFee' },
  { key: 'localPremium', labelKey: 'hq.commission.feeDiagram.localPremium' },
  { key: 'operatingFee', labelKey: 'hq.commission.feeDiagram.operatingFee' },
  { key: 'net', labelKey: 'hq.commission.feeDiagram.net' },
  { key: 'requiredFiat', labelKey: 'hq.commission.feeDiagram.requiredFiat' },
];

const GAS_GROUPS: GasFeeGroupId[] = ['DEFAULT', 'A', 'B', 'C'];
const GAS_GROUP_LABEL: Record<GasFeeGroupId, MessageKey> = {
  DEFAULT: 'hq.commission.gasGroupDefault',
  A: 'hq.commission.gasGroupA',
  B: 'hq.commission.gasGroupB',
  C: 'hq.commission.gasGroupC',
};

const DEFAULT_GAS_NETWORKS: HqGasNetworkPolicy = {
  activeGroup: 'DEFAULT',
  networks: [
    { code: 'TRC20', fees: { DEFAULT: 1, A: 0, B: 0, C: 0 } },
    { code: 'ERC20', fees: { DEFAULT: 8, A: 0, B: 0, C: 0 } },
    { code: 'BEP20', fees: { DEFAULT: 0.5, A: 0, B: 0, C: 0 } },
    { code: 'POLYGON', fees: { DEFAULT: 0.3, A: 0, B: 0, C: 0 } },
    { code: 'ARBITRUM', fees: { DEFAULT: 0.5, A: 0, B: 0, C: 0 } },
    { code: 'SOL', fees: { DEFAULT: 1, A: 0, B: 0, C: 0 } },
  ],
};

const DEFAULT_CURRENCY_AMOUNT: HqCurrencyAmountDisplayPolicy = {
  default: { decimals: 2, mode: 'ROUND' },
  KRW: { decimals: 0, mode: 'FLOOR' },
  JPY: { decimals: 0, mode: 'FLOOR' },
  THB: { decimals: 2, mode: 'ROUND' },
  CNY: { decimals: 2, mode: 'ROUND' },
  HKD: { decimals: 2, mode: 'ROUND' },
  USD: { decimals: 2, mode: 'ROUND' },
};

const AMOUNT_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY', 'USD'] as const;

const DEFAULT_FEE_DIAGRAM: FeeDiagramDisplayConfig = {
  gross: true,
  fxFee: true,
  gasFee: true,
  transferFee: true,
  otherFee: true,
  localPremium: true,
  operatingFee: true,
  net: true,
  requiredFiat: true,
  showRates: true,
  defaultFeeBillingMethod: 'ITEMIZED',
};

function withFeeDiagramDefaults(risk: HqCommissionRiskConfig): HqCommissionRiskConfig {
  const live = { ...DEFAULT_FEE_DIAGRAM, ...risk.feeDiagramDisplay };
  const sandbox = {
    ...DEFAULT_FEE_DIAGRAM,
    ...live,
    ...risk.sandboxFeeDiagramDisplay,
  };
  return {
    ...risk,
    feeDiagramDisplay: live,
    sandboxFeeDiagramDisplay: sandbox,
  };
}

type FeeDiagramEnv = 'live' | 'sandbox';

function patchFeeDiagramEnv(
  prev: HqCommissionRiskConfig,
  env: FeeDiagramEnv,
  patch: Partial<FeeDiagramDisplayConfig>,
): HqCommissionRiskConfig {
  const key = env === 'live' ? 'feeDiagramDisplay' : 'sandboxFeeDiagramDisplay';
  const current = prev[key] ?? DEFAULT_FEE_DIAGRAM;
  return {
    ...prev,
    [key]: { ...DEFAULT_FEE_DIAGRAM, ...current, ...patch },
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
    fxFeeMode: risk.defaultFxFeeMode ?? 'percent',
    fxFeePercent: risk.defaultFxFeePercent,
    fxFeeUsdt: risk.defaultFxFeeUsdt ?? 0,
    gasFeeMode: risk.defaultGasFeeMode ?? 'fixed',
    gasFeePercent: risk.defaultGasFeePercent ?? 0,
    gasFeeUsdt: risk.defaultGasFeeUsdt,
    transferFeeMode: risk.defaultTransferFeeMode ?? 'fixed',
    transferFeePercent: risk.defaultTransferFeePercent ?? 0,
    transferFeeUsdt: risk.defaultTransferFeeUsdt,
    otherFeeMode: risk.defaultOtherFeeMode ?? 'fixed',
    otherFeePercent: risk.defaultOtherFeePercent ?? 0,
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
  const [feeTypes, setFeeTypes] = useState<FeeTypeTemplate[]>([]);
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
  const [gasNetworks, setGasNetworks] = useState<HqGasNetworkPolicy>(DEFAULT_GAS_NETWORKS);
  const [savingGas, setSavingGas] = useState(false);
  const [gasMsg, setGasMsg] = useState('');
  const [currencyAmount, setCurrencyAmount] = useState<HqCurrencyAmountDisplayPolicy>(DEFAULT_CURRENCY_AMOUNT);
  const [savingCurrencyAmount, setSavingCurrencyAmount] = useState(false);
  const [currencyAmountMsg, setCurrencyAmountMsg] = useState('');
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
        const types = commission.feeTypes ?? [];
        setFeeTypes(types);
        setGasNetworks(commission.gasNetworks ?? DEFAULT_GAS_NETWORKS);
        setFeeTiers(commission.feeTiers ?? []);
        setExchangeRateSources(commission.exchangeRateSources);
        setExchangeRatePreview(commission.exchangeRatePreview ?? []);
        setCurrencyAmount({
          ...DEFAULT_CURRENCY_AMOUNT,
          ...(commission.currencyAmountDisplay ?? {}),
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  async function saveCurrencyAmountDisplay() {
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
  }

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
          useDefault: false,
        },
        {
          organizationId: row.organizationId,
          ticketType: 'TRADE_ESCROW',
          ratePercent: Number(row.tradeEscrow) || 0,
          useDefault: false,
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
          <div className="pg-card-head">{t('hq.commission.showFeeRatesTitle')}</div>
          <div className="pg-card-body space-y-3">
            <p className="pg-hint text-xs">{t('hq.commission.showFeeRatesDesc')}</p>
            <div className="grid gap-4 lg:grid-cols-2">
              {(
                [
                  {
                    env: 'live' as const,
                    titleKey: 'hq.commission.showFeeRatesLive' as MessageKey,
                    cfg: risk.feeDiagramDisplay,
                    radioName: 'showFeeRatesLive',
                  },
                  {
                    env: 'sandbox' as const,
                    titleKey: 'hq.commission.showFeeRatesSandbox' as MessageKey,
                    cfg: risk.sandboxFeeDiagramDisplay,
                    radioName: 'showFeeRatesSandbox',
                  },
                ] as const
              ).map(({ env, titleKey, cfg, radioName }) => {
                const showRates = cfg?.showRates ?? DEFAULT_FEE_DIAGRAM.showRates;
                const billing =
                  cfg?.defaultFeeBillingMethod ?? DEFAULT_FEE_DIAGRAM.defaultFeeBillingMethod;
                return (
                  <div
                    key={env}
                    className="space-y-3 rounded-md border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <p className="text-sm font-semibold text-slate-800">{t(titleKey)}</p>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={radioName}
                          checked={showRates === true}
                          onChange={() =>
                            setRisk((prev) =>
                              prev ? patchFeeDiagramEnv(prev, env, { showRates: true }) : prev,
                            )
                          }
                        />
                        {t('hq.commission.showFeeRatesOn')}
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={radioName}
                          checked={showRates === false}
                          onChange={() =>
                            setRisk((prev) =>
                              prev ? patchFeeDiagramEnv(prev, env, { showRates: false }) : prev,
                            )
                          }
                        />
                        {t('hq.commission.showFeeRatesOff')}
                      </label>
                    </div>
                    <div className="border-t border-slate-200 pt-3 space-y-2">
                      <p className="pg-label text-sm">{t('hq.commission.defaultBillingMethod')}</p>
                      <p className="pg-hint text-xs">
                        {t(
                          env === 'live'
                            ? 'hq.commission.defaultBillingMethodDescLive'
                            : 'hq.commission.defaultBillingMethodDescSandbox',
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          className="pg-input max-w-xs text-sm"
                          value={billing}
                          onChange={(e) =>
                            setRisk((prev) =>
                              prev
                                ? patchFeeDiagramEnv(prev, env, {
                                    defaultFeeBillingMethod: e.target.value as
                                      | 'INTEGRATED'
                                      | 'ITEMIZED'
                                      | 'HYBRID',
                                  })
                                : prev,
                            )
                          }
                        >
                          <option value="ITEMIZED">{t('feeBilling.ITEMIZED')}</option>
                          <option value="INTEGRATED">{t('feeBilling.INTEGRATED')}</option>
                          <option value="HYBRID">{t('feeBilling.HYBRID')}</option>
                        </select>
                        <span className="text-xs text-slate-600">
                          {t('hq.commission.currentDefaultBilling')}:{' '}
                          <strong>{t(`feeBilling.${billing}` as MessageKey)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="pg-hint text-[10px]">{t('hq.commission.feeDiagramSaveHint')}</p>
          </div>
        </div>

        <div className="pg-card">
          <div className="pg-card-head">{t('hq.commission.currencyAmountTitle')}</div>
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
                      setRisk((prev) => {
                        if (!prev) return prev;
                        const nextVal = !(
                          prev.feeDiagramDisplay?.[key] ?? DEFAULT_FEE_DIAGRAM[key]
                        );
                        const live = {
                          ...DEFAULT_FEE_DIAGRAM,
                          ...prev.feeDiagramDisplay,
                          [key]: nextVal,
                        };
                        const sandboxPrev =
                          prev.sandboxFeeDiagramDisplay ?? DEFAULT_FEE_DIAGRAM;
                        return {
                          ...prev,
                          feeDiagramDisplay: live,
                          // 행 표시는 LIVE와 동기화. 노출·청구방식만 Sandbox 독립 유지
                          sandboxFeeDiagramDisplay: {
                            ...DEFAULT_FEE_DIAGRAM,
                            ...sandboxPrev,
                            [key]: nextVal,
                            showRates: sandboxPrev.showRates ?? DEFAULT_FEE_DIAGRAM.showRates,
                            defaultFeeBillingMethod:
                              sandboxPrev.defaultFeeBillingMethod ??
                              DEFAULT_FEE_DIAGRAM.defaultFeeBillingMethod,
                          },
                        };
                      })
                    }
                  />
                  <span>{t(labelKey)}</span>
                </label>
              ))}
            </div>
            <p className="pg-hint text-[10px]">{t('hq.commission.feeDiagramSaveHint')}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={saveRisk}
                disabled={savingRisk || hasPolicyEditInProgress()}
                className="pg-btn pg-btn-primary text-xs disabled:opacity-50"
              >
                {savingRisk ? t('hq.saving') : t('hq.commission.saveRisk')}
              </button>
              {msg && <span className="pg-hint">{msg}</span>}
            </div>
          </div>
        </div>

        <div className="pg-card">
          <div className="pg-card-head">{t('hq.commission.gasNetworksTitle')}</div>
          <div className="pg-card-body space-y-3">
            <p className="pg-hint">{t('hq.commission.gasNetworksDesc')}</p>
            <p className="pg-callout pg-callout-muted">{t('hq.commission.gasGroupHint')}</p>
            <div className="pg-card pg-table-wrap">
              <table className="pg-table">
                <thead>
                  <tr>
                    <th>{t('wallets.col.network')}</th>
                    {GAS_GROUPS.map((group) => {
                      const selected = gasNetworks.activeGroup === group;
                      return (
                        <th key={group} className={selected ? 'bg-sky-100' : undefined}>
                          <button
                            type="button"
                            onClick={() => setGasNetworks((prev) => ({ ...prev, activeGroup: group }))}
                            className={`w-full rounded px-2 py-1 text-left ${
                              selected
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            <span className="block text-sm font-semibold">{t(GAS_GROUP_LABEL[group])}</span>
                            <span className="block text-[10px] font-normal opacity-90">
                              {selected ? t('hq.commission.gasGroupSelected') : t('hq.commission.gasGroupSelect')}
                            </span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {gasNetworks.networks.map((row) => (
                    <tr key={row.code}>
                      <td>{t(`network.${row.code}` as MessageKey)}</td>
                      {GAS_GROUPS.map((group) => {
                        const selected = gasNetworks.activeGroup === group;
                        return (
                          <td key={group} className={selected ? 'bg-sky-50' : undefined}>
                            <PolicyNumberInput
                              step="0.01"
                              min={0}
                              value={row.fees[group]}
                              onChange={(n) =>
                                setGasNetworks((prev) => ({
                                  ...prev,
                                  networks: prev.networks.map((r) =>
                                    r.code === row.code
                                      ? { ...r, fees: { ...r.fees, [group]: n } }
                                      : r,
                                  ),
                                }))
                              }
                              className={`pg-input w-24 ${selected ? 'border-sky-400 ring-1 ring-sky-300' : ''}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={async () => {
                setSavingGas(true);
                setGasMsg('');
                try {
                  const next = await hqPolicyApi.saveGasNetworks(gasNetworks);
                  setData(next);
                  setGasNetworks(next.gasNetworks ?? gasNetworks);
                  setGasMsg(
                    t('hq.commission.gasNetworksSaved', {
                      group: t(GAS_GROUP_LABEL[gasNetworks.activeGroup]),
                    }),
                  );
                } catch (e) {
                  setGasMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
                } finally {
                  setSavingGas(false);
                }
              }}
              disabled={savingGas}
              className="pg-btn pg-btn-primary disabled:opacity-50"
            >
              {savingGas ? t('hq.saving') : t('hq.commission.saveGasNetworks')}
            </button>
            {gasMsg && <p className="pg-hint">{gasMsg}</p>}
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
        <p className="pg-callout pg-callout-muted">{t('hq.commission.feeDualHint')}</p>
        <p className="pg-callout pg-callout-muted">{t('hq.commission.tierEditHint')}</p>

        <div className="pg-card pg-table-wrap">
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('hq.commission.tierCurrency')}</th>
                <th>{t('hq.commission.tierMaxAmount')}</th>
                <th>{t('hq.commission.fxFee')}</th>
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
                    <FeeDualInput
                      feeKey="fx"
                      fees={row}
                      editing={isEditing}
                      onChange={(patch) => updateTierDraft(patch)}
                    />
                  </td>
                  <td>
                    <FeeDualInput
                      feeKey="transfer"
                      fees={row}
                      editing={isEditing}
                      onChange={(patch) => updateTierDraft(patch)}
                    />
                  </td>
                  <td>
                    <FeeDualInput
                      feeKey="other"
                      fees={row}
                      editing={isEditing}
                      onChange={(patch) => updateTierDraft(patch)}
                    />
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
        <div className="pg-section-head">{t('hq.commission.orgShareTitle')}</div>
        <div className="pg-section-pad space-y-3">
          <p className="pg-hint">{t('hq.commission.orgShareDesc')}</p>
          <p className="pg-callout pg-callout-muted">{t('hq.commission.vacantShareHint')}</p>
          <FeeTypeTemplateGrid
            feeTypes={feeTypes}
            onChanged={(next) => {
              setData(next);
              setFeeTypes(next.feeTypes ?? []);
            }}
          />
        </div>
      </section>

      <section className="pg-section">
        <div className="pg-section-head">{t('hq.commission.orgRatesTitle')}</div>
        <div className="pg-section-pad space-y-3">
          <p className="pg-hint">{t('hq.commission.orgRatesMoved')}</p>
          <Link href="/dashboard/customers/fees" className="pg-btn pg-btn-secondary text-sm">
            {t('hq.commission.openCustomerFees')}
          </Link>
        </div>
      </section>

      <SimulatorCommissionPanel />
    </div>
  );
}

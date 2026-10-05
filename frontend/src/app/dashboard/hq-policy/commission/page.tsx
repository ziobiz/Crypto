'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import {
  api,
  hqPolicyApi,
  type HqCommissionPayload,
  type HqCommissionRiskConfig,
  type HqGasNetworkPolicy,
  type FeeTypeTemplate,
  type GasFeeGroupId,
  type FeeDiagramDisplayConfig,
  type SymbolFeeCurrency,
  type SymbolFeeTierRow,
  type SymbolFeeTiersByCustomerType,
  type HqExpressPolicy,
  type HqMemberGradePolicy,
  defaultExpressPolicy,
  defaultMemberGradePolicy,
} from '@/lib/api';
import { ExpressFeePolicyEditor } from '@/components/hq-policy/ExpressFeePolicyEditor';
import { MemberGradePolicyEditor } from '@/components/hq-policy/MemberGradePolicyEditor';
import type { MessageKey } from '@/i18n/messages';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import { formatAmountInput } from '@/lib/format';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';
import { FeeDualInput } from '@/components/policy/FeeDualInput';
import { PolicyCellValue } from '@/components/policy/PolicyCellValue';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';
import { SimulatorCommissionPanel } from '@/components/hq-policy/SimulatorCommissionPanel';
import { FeeTypeTemplateGrid } from '@/components/hq-policy/FeeTypeTemplateGrid';
import {
  DEFAULT_FEE_DIAGRAM,
  FEE_CURRENCIES,
  withFeeDiagramDefaults,
  saveFeeConfig,
} from '@/lib/hq-commission-shared';

type OrgRateRow = {
  organizationId: string;
  code: string;
  name: string;
  type: string;
  path: string;
  usdtPurchase: string;
  tradeEscrow: string;
};

const LIMIT_CUSTOMER_TYPES = ['INDIVIDUAL', 'CORPORATE'] as const;
type LimitCustomerType = (typeof LIMIT_CUSTOMER_TYPES)[number];

function normalizeFeeTiersByCustomerType(payload: HqCommissionPayload): SymbolFeeTiersByCustomerType {
  if (payload.feeTiersByCustomerType) {
    return {
      INDIVIDUAL: [...(payload.feeTiersByCustomerType.INDIVIDUAL ?? [])],
      CORPORATE: [...(payload.feeTiersByCustomerType.CORPORATE ?? payload.feeTiers ?? [])],
    };
  }
  const legacy = [...(payload.feeTiers ?? [])];
  return { INDIVIDUAL: legacy, CORPORATE: legacy.map((row) => ({ ...row })) };
}

type FeeDiagramToggleKey = Exclude<
  keyof FeeDiagramDisplayConfig,
  'showRates' | 'showTotalFee' | 'defaultFeeBillingMethod' | 'billingMethod'
>;

const FEE_DIAGRAM_KEYS: Array<{ key: FeeDiagramToggleKey; labelKey: MessageKey }> = [
  { key: 'gross', labelKey: 'hq.commission.feeDiagram.gross' },
  { key: 'fxFee', labelKey: 'hq.commission.feeDiagram.fxFee' },
  { key: 'gasFee', labelKey: 'hq.commission.feeDiagram.gasFee' },
  { key: 'transferFee', labelKey: 'hq.commission.feeDiagram.transferFee' },
  { key: 'otherFee', labelKey: 'hq.commission.feeDiagram.otherFee' },
  { key: 'localPremium', labelKey: 'hq.commission.feeDiagram.localPremium' },
  { key: 'operatingFee', labelKey: 'hq.commission.feeDiagram.operatingFee' },
  { key: 'expressFee', labelKey: 'hq.commission.feeDiagram.expressFee' },
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

type FeeDiagramEnv = 'live' | 'sandbox';
type FeeDiagramAudience = 'customer' | 'hq';

function patchFeeDiagramEnv(
  prev: HqCommissionRiskConfig,
  env: FeeDiagramEnv,
  patch: Partial<FeeDiagramDisplayConfig>,
  audience: FeeDiagramAudience = 'customer',
): HqCommissionRiskConfig {
  const key =
    audience === 'hq'
      ? env === 'live'
        ? 'hqFeeDiagramDisplay'
        : 'hqSandboxFeeDiagramDisplay'
      : env === 'live'
        ? 'feeDiagramDisplay'
        : 'sandboxFeeDiagramDisplay';
  const current = prev[key] ?? DEFAULT_FEE_DIAGRAM;
  return {
    ...prev,
    [key]: { ...DEFAULT_FEE_DIAGRAM, ...current, ...patch },
  };
}

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
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const [data, setData] = useState<HqCommissionPayload | null>(null);
  const [risk, setRisk] = useState<HqCommissionRiskConfig | null>(null);
  const [orgRows, setOrgRows] = useState<OrgRateRow[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeTypeTemplate[]>([]);
  const [feeTiersByCustomerType, setFeeTiersByCustomerType] = useState<SymbolFeeTiersByCustomerType>({
    INDIVIDUAL: [],
    CORPORATE: [],
  });
  const [feeCustomerType, setFeeCustomerType] = useState<LimitCustomerType>('CORPORATE');
  const [expressFee, setExpressFee] = useState<HqExpressPolicy>(defaultExpressPolicy());
  const [savingExpress, setSavingExpress] = useState(false);
  const [expressMsg, setExpressMsg] = useState('');
  const [memberGrade, setMemberGrade] = useState<HqMemberGradePolicy>(defaultMemberGradePolicy());
  const [savingMemberGrade, setSavingMemberGrade] = useState(false);
  const [memberGradeMsg, setMemberGradeMsg] = useState('');
  const [feeCurrency, setFeeCurrency] = useState<SymbolFeeCurrency>('KRW');
  const [savingTiers, setSavingTiers] = useState(false);
  const [tiersMsg, setTiersMsg] = useState('');
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierDraft, setTierDraft] = useState<SymbolFeeTierRow | null>(null);
  const [tierDisplayOrder, setTierDisplayOrder] = useState<string[]>([]);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [orgDraft, setOrgDraft] = useState<{ usdtPurchase: string; tradeEscrow: string } | null>(null);
  const [savingRisk, setSavingRisk] = useState(false);
  const [gasNetworks, setGasNetworks] = useState<HqGasNetworkPolicy>(DEFAULT_GAS_NETWORKS);
  const [savingGas, setSavingGas] = useState(false);
  const [gasMsg, setGasMsg] = useState('');
  const [savingRates, setSavingRates] = useState(false);
  const [msg, setMsg] = useState('');
  const [ratesMsg, setRatesMsg] = useState('');
  const [error, setError] = useState('');

  const feeTiers = feeTiersByCustomerType[feeCustomerType];

  function updateActiveFeeTiers(updater: (prev: SymbolFeeTierRow[]) => SymbolFeeTierRow[]) {
    setFeeTiersByCustomerType((prev) => ({
      ...prev,
      [feeCustomerType]: updater(prev[feeCustomerType]),
    }));
  }

  const orgTypeLabel = (type: string) => t(`org.${type}` as MessageKey);

  useEffect(() => {
    Promise.all([hqPolicyApi.getCommission(), api.organizations()])
      .then(([commission, orgs]) => {
        setData(commission);
        setRisk(withFeeDiagramDefaults({
          ...commission.risk,
          defaultFxFeePercent: commission.risk.defaultFxFeePercent ?? 0,
          defaultTransferFeeUsdt:
            commission.risk.defaultTransferFeeUsdt ??
            commission.risk.defaultPlatformFeeUsdt ??
            0,
          defaultOtherFeeUsdt: commission.risk.defaultOtherFeeUsdt ?? 0,
        }));
        const baseRows = buildOrgRows(commission);
        setOrgRows(mergeWithOrganizations(baseRows, commission, orgs));
        const types = commission.feeTypes ?? [];
        setFeeTypes(types);
        setGasNetworks(commission.gasNetworks ?? DEFAULT_GAS_NETWORKS);
        setFeeTiersByCustomerType(normalizeFeeTiersByCustomerType(commission));
        setExpressFee(commission.expressFee ?? defaultExpressPolicy());
        setMemberGrade(commission.memberGrade ?? defaultMemberGradePolicy());
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

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
      editingOrgId !== null
    );
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
    updateActiveFeeTiers((prev) => prev.map((row) => (row.id === tierDraft.id ? tierDraft : row)));
    cancelTierEdit();
  }

  function addTier() {
    if (!risk || editingTierId) return;
    updateActiveFeeTiers((prev) => [...prev, defaultTierForCurrency(feeCurrency, risk)]);
  }

  function removeTier(id: string) {
    if (editingTierId) return;
    updateActiveFeeTiers((prev) => prev.filter((row) => row.id !== id));
  }

  async function saveFeeTiers() {
    if (editingTierId) {
      setTiersMsg(t('hq.commission.tierFinishEditFirst'));
      return;
    }
    setSavingTiers(true);
    setTiersMsg('');
    try {
      const next = await hqPolicyApi.saveSymbolFeeTiers(feeTiersByCustomerType);
      setData(next);
      setFeeTiersByCustomerType(normalizeFeeTiersByCustomerType(next));
      setTiersMsg(t('hq.commission.tiersSaved'));
    } catch (e) {
      setTiersMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSavingTiers(false);
    }
  }

  async function saveFeeSettings() {
    if (!risk) return;
    if (hasPolicyEditInProgress()) {
      setMsg(t('hq.commission.tierFinishEditFirst'));
      return;
    }
    requestConfirm({
      title: t('hq.commission.showFeeRatesSave'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: async () => {
        setSavingRisk(true);
        setMsg('');
        try {
          const next = await saveFeeConfig(risk);
          setData(next);
          setRisk(withFeeDiagramDefaults(next.risk));
          setMsg(t('hq.saved'));
        } catch (e) {
          setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setSavingRisk(false);
        }
      },
    });
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

  if (!data || !risk) return <p className="pg-hint">{t('hq.loading')}</p>;

  return (
    <div className="pg-stack">
      {doubleConfirmDialog}
      
      <section className="pg-section">
        <div className="pg-section-head">{t('hq.commission.symbolTitle')}</div>
        <div className="pg-section-pad space-y-3">
          <p className="pg-hint">{t('hq.commission.symbolDesc')}</p>

          <div className="pg-card">
            <div className="pg-card-head">{t('hq.commission.showFeeRatesTitle')}</div>
            <div className="pg-card-body space-y-3">
              <p className="pg-hint text-xs">{t('hq.commission.showFeeRatesDesc')}</p>
              {(
                [
                  {
                    audience: 'customer' as const,
                    audienceTitle: 'hq.commission.showFeeRatesAudienceCustomer' as MessageKey,
                    audienceHint: 'hq.commission.showFeeRatesAudienceCustomerHint' as MessageKey,
                    liveCfg: risk.feeDiagramDisplay,
                    sandCfg: risk.sandboxFeeDiagramDisplay,
                  },
                  {
                    audience: 'hq' as const,
                    audienceTitle: 'hq.commission.showFeeRatesAudienceHq' as MessageKey,
                    audienceHint: 'hq.commission.showFeeRatesAudienceHqHint' as MessageKey,
                    liveCfg: risk.hqFeeDiagramDisplay,
                    sandCfg: risk.hqSandboxFeeDiagramDisplay,
                  },
                ] as const
              ).map(({ audience, audienceTitle, audienceHint, liveCfg, sandCfg }) => (
                <div key={audience} className="space-y-3 rounded-md border border-slate-200 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t(audienceTitle)}</p>
                    <p className="mt-0.5 pg-hint text-xs">{t(audienceHint)}</p>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {(
                      [
                        {
                          env: 'live' as const,
                          titleKey: 'hq.commission.showFeeRatesLive' as MessageKey,
                          cfg: liveCfg,
                          radioName: `showFeeRates-${audience}-live`,
                        },
                        {
                          env: 'sandbox' as const,
                          titleKey: 'hq.commission.showFeeRatesSandbox' as MessageKey,
                          cfg: sandCfg,
                          radioName: `showFeeRates-${audience}-sandbox`,
                        },
                      ] as const
                    ).map(({ env, titleKey, cfg, radioName }) => {
                      const showRates = cfg?.showRates ?? DEFAULT_FEE_DIAGRAM.showRates;
                      const billing =
                        cfg?.defaultFeeBillingMethod ?? DEFAULT_FEE_DIAGRAM.defaultFeeBillingMethod;
                      return (
                        <div
                          key={`${audience}-${env}`}
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
                                    prev
                                      ? patchFeeDiagramEnv(prev, env, { showRates: true }, audience)
                                      : prev,
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
                                    prev
                                      ? patchFeeDiagramEnv(prev, env, { showRates: false }, audience)
                                      : prev,
                                  )
                                }
                              />
                              {t('hq.commission.showFeeRatesOff')}
                            </label>
                          </div>
                          {audience === 'customer' && (
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
                                        ? patchFeeDiagramEnv(
                                            prev,
                                            env,
                                            {
                                              defaultFeeBillingMethod: e.target.value as
                                                | 'INTEGRATED'
                                                | 'ITEMIZED'
                                                | 'HYBRID',
                                            },
                                            'customer',
                                          )
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
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <p className="pg-label text-sm">{t('hq.commission.showTotalFeeTitle')}</p>
                <p className="pg-hint text-xs">{t('hq.commission.showTotalFeeDesc')}</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="showTotalFee"
                      checked={(risk.showTotalFee ?? true) === true}
                      onChange={() =>
                        setRisk((prev) =>
                          prev
                            ? {
                                ...prev,
                                showTotalFee: true,
                                feeDiagramDisplay: {
                                  ...DEFAULT_FEE_DIAGRAM,
                                  ...prev.feeDiagramDisplay,
                                  showTotalFee: true,
                                },
                                sandboxFeeDiagramDisplay: {
                                  ...DEFAULT_FEE_DIAGRAM,
                                  ...prev.sandboxFeeDiagramDisplay,
                                  showTotalFee: true,
                                },
                              }
                            : prev,
                        )
                      }
                    />
                    {t('hq.commission.showFeeRatesOn')}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="showTotalFee"
                      checked={(risk.showTotalFee ?? true) === false}
                      onChange={() =>
                        setRisk((prev) =>
                          prev
                            ? {
                                ...prev,
                                showTotalFee: false,
                                feeDiagramDisplay: {
                                  ...DEFAULT_FEE_DIAGRAM,
                                  ...prev.feeDiagramDisplay,
                                  showTotalFee: false,
                                },
                                sandboxFeeDiagramDisplay: {
                                  ...DEFAULT_FEE_DIAGRAM,
                                  ...prev.sandboxFeeDiagramDisplay,
                                  showTotalFee: false,
                                },
                              }
                            : prev,
                        )
                      }
                    />
                    {t('hq.commission.showFeeRatesOff')}
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={saveFeeSettings}
                  disabled={savingRisk || hasPolicyEditInProgress()}
                  className="pg-btn pg-btn-primary text-xs disabled:opacity-50"
                >
                  {savingRisk ? t('hq.saving') : t('hq.commission.showFeeRatesSave')}
                </button>
                {msg && <span className="pg-hint">{msg}</span>}
              </div>
              <p className="pg-hint text-[10px]">{t('hq.commission.showFeeRatesSaveHint')}</p>
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
                  onClick={saveFeeSettings}
                  disabled={savingRisk || hasPolicyEditInProgress()}
                  className="pg-btn pg-btn-primary text-xs disabled:opacity-50"
                >
                  {savingRisk ? t('hq.saving') : t('hq.commission.showFeeRatesSave')}
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

          <div className="flex flex-wrap gap-2">
            {LIMIT_CUSTOMER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  if (feeCustomerType !== type) cancelTierEdit();
                  setFeeCustomerType(type);
                }}
                className={`pg-btn text-xs ${
                  feeCustomerType === type ? 'pg-btn-primary' : 'pg-btn-secondary'
                }`}
              >
                {type === 'INDIVIDUAL'
                  ? t('hq.commission.limitsIndividual')
                  : t('hq.commission.limitsCorporate')}
              </button>
            ))}
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
          <p className="pg-hint text-xs text-sky-800">{t('hq.commission.tierCustomerTypeHint')}</p>
          {feeCustomerType === 'INDIVIDUAL' && (feeCurrency === 'USD' || feeCurrency === 'EUR') && (
            <p className="pg-hint text-xs text-sky-800">{t('hq.commission.tierIndividualRemitHint')}</p>
          )}
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
            <div className="pg-card-body space-y-4">
              <ExpressFeePolicyEditor value={expressFee} onChange={setExpressFee} />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={savingExpress}
                  className="pg-btn pg-btn-primary disabled:opacity-50"
                  onClick={async () => {
                    setSavingExpress(true);
                    setExpressMsg('');
                    try {
                      const next = await hqPolicyApi.saveExpressFee(expressFee);
                      setData(next);
                      setExpressFee(next.expressFee ?? expressFee);
                      setExpressMsg(t('express.hq.saved'));
                    } catch (e) {
                      setExpressMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
                    } finally {
                      setSavingExpress(false);
                    }
                  }}
                >
                  {savingExpress ? t('hq.saving') : t('express.hq.save')}
                </button>
                {expressMsg && <span className="pg-hint">{expressMsg}</span>}
              </div>
            </div>
          </div>

          <div className="pg-card">
            <div className="pg-card-body space-y-4">
              <MemberGradePolicyEditor value={memberGrade} onChange={setMemberGrade} />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={savingMemberGrade}
                  className="pg-btn pg-btn-primary disabled:opacity-50"
                  onClick={async () => {
                    setSavingMemberGrade(true);
                    setMemberGradeMsg('');
                    try {
                      const next = await hqPolicyApi.saveMemberGrade(memberGrade);
                      setData(next);
                      setMemberGrade(next.memberGrade ?? memberGrade);
                      setMemberGradeMsg(t('memberGrade.hq.saved'));
                    } catch (e) {
                      setMemberGradeMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
                    } finally {
                      setSavingMemberGrade(false);
                    }
                  }}
                >
                  {savingMemberGrade ? t('hq.saving') : t('memberGrade.hq.save')}
                </button>
                {memberGradeMsg && <span className="pg-hint">{memberGradeMsg}</span>}
              </div>
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
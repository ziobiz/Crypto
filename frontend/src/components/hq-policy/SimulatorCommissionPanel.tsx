'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import {
  hqPolicyApi,
  type FeeTypeTemplate,
  type HqCommissionRiskConfig,
  type HqGasNetworkPolicy,
  type SymbolFeeTierRow,
} from '@/lib/api';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';
import { SimulatorSandboxFeePreview } from '@/components/hq-policy/SimulatorSandboxFeePreview';
import { sumOrgShareTable } from '@/lib/escrow-share-totals';
import type { MessageKey } from '@/i18n/messages';

const EMPTY_SANDBOX: HqCommissionRiskConfig = {
  defaultFxFeePercent: 0,
  defaultGasFeeUsdt: 0,
  defaultTransferFeeUsdt: 0,
  defaultOtherFeeUsdt: 0,
  maxTicketAmountKrw: 0,
  riskEnabled: true,
  maxDailyTicketsPerCustomer: 0,
  transactionLimits: {} as HqCommissionRiskConfig['transactionLimits'],
  notes: '',
};

function withSandboxDefaults(risk?: HqCommissionRiskConfig | null): HqCommissionRiskConfig {
  const base = risk ?? EMPTY_SANDBOX;
  return {
    ...EMPTY_SANDBOX,
    ...base,
    defaultFxFeePercent: base.defaultFxFeePercent ?? 0,
    defaultGasFeeUsdt: base.defaultGasFeeUsdt ?? 0,
    defaultTransferFeeUsdt: base.defaultTransferFeeUsdt ?? base.defaultPlatformFeeUsdt ?? 0,
    defaultOtherFeeUsdt: base.defaultOtherFeeUsdt ?? 0,
  };
}

function liveBasicFees(live?: HqCommissionRiskConfig | null) {
  const base = live ?? EMPTY_SANDBOX;
  return {
    defaultFxFeePercent: Number(base.defaultFxFeePercent) || 0,
    defaultGasFeeUsdt: Number(base.defaultGasFeeUsdt) || 0,
    defaultTransferFeeUsdt:
      Number(base.defaultTransferFeeUsdt) || Number(base.defaultPlatformFeeUsdt) || 0,
    defaultOtherFeeUsdt: Number(base.defaultOtherFeeUsdt) || 0,
  };
}

type FeeFieldKey = 'defaultFxFeePercent' | 'defaultGasFeeUsdt' | 'defaultTransferFeeUsdt' | 'defaultOtherFeeUsdt';

const FEE_FIELDS: Array<{
  key: FeeFieldKey;
  labelKey: MessageKey;
  unitKey: MessageKey;
  tone: 'fx' | 'gas' | 'transfer' | 'other';
  step?: string;
}> = [
  { key: 'defaultFxFeePercent', labelKey: 'hq.commission.fxFee', unitKey: 'hq.commission.unitPercent', tone: 'fx', step: '0.01' },
  { key: 'defaultGasFeeUsdt', labelKey: 'hq.commission.gasFee', unitKey: 'hq.commission.unitUsdt', tone: 'gas', step: '0.01' },
  { key: 'defaultTransferFeeUsdt', labelKey: 'hq.commission.transferFee', unitKey: 'hq.commission.unitUsdt', tone: 'transfer', step: '0.01' },
  { key: 'defaultOtherFeeUsdt', labelKey: 'hq.commission.otherFee', unitKey: 'hq.commission.unitUsdt', tone: 'other', step: '0.01' },
];

function defaultUsdtOperatingFee(feeTypes: FeeTypeTemplate[]) {
  const usdtTypes = feeTypes.filter((f) => (f.ticketKind ?? 'USDT_PURCHASE') === 'USDT_PURCHASE');
  const def = usdtTypes.find((f) => f.isDefault) ?? usdtTypes[0] ?? null;
  if (!def) return null;
  const totals = sumOrgShareTable(def.config.USDT_PURCHASE);
  return {
    id: def.id,
    name: def.name || def.code,
    code: def.code,
    poolPercent: totals.poolPercent,
    perTicketUsdt: totals.perTicketUsdt,
  };
}

export function SimulatorCommissionPanel() {
  const t = useT();
  const [risk, setRisk] = useState<HqCommissionRiskConfig | null>(null);
  const [liveRisk, setLiveRisk] = useState<HqCommissionRiskConfig | null>(null);
  const [liveTiers, setLiveTiers] = useState<SymbolFeeTierRow[]>([]);
  const [gasNetworks, setGasNetworks] = useState<HqGasNetworkPolicy | null>(null);
  const [feeTypes, setFeeTypes] = useState<FeeTypeTemplate[]>([]);
  const [savingRisk, setSavingRisk] = useState(false);
  const [riskMsg, setRiskMsg] = useState('');

  const operatingDefault = useMemo(() => defaultUsdtOperatingFee(feeTypes), [feeTypes]);
  const liveBasics = useMemo(() => liveBasicFees(liveRisk), [liveRisk]);

  useEffect(() => {
    Promise.all([hqPolicyApi.getCommission(), hqPolicyApi.listFeeTypes()])
      .then(([c, types]) => {
        setLiveRisk(c.risk ?? null);
        setRisk(withSandboxDefaults(c.simulatorRisk));
        setLiveTiers([...(c.feeTiers ?? [])]);
        setGasNetworks(c.gasNetworks ?? null);
        setFeeTypes(types.feeTypes ?? c.feeTypes ?? []);
      })
      .catch(console.error);
  }, []);

  async function refreshLiveFromHq() {
    const c = await hqPolicyApi.getCommission();
    setLiveRisk(c.risk ?? null);
    setLiveTiers([...(c.feeTiers ?? [])]);
    setGasNetworks(c.gasNetworks ?? null);
    if (c.feeTypes?.length) setFeeTypes(c.feeTypes);
    return c;
  }

  async function saveRiskOnly() {
    if (!risk) return;
    setSavingRisk(true);
    setRiskMsg('');
    try {
      const payload = withSandboxDefaults(risk);
      const next = await hqPolicyApi.saveSimulatorCommissionRisk(payload);
      setRisk(withSandboxDefaults(next.simulatorRisk));
      setLiveRisk(next.risk ?? liveRisk);
      setLiveTiers([...(next.feeTiers ?? liveTiers)]);
      setGasNetworks(next.gasNetworks ?? gasNetworks);
      if (next.feeTypes?.length) setFeeTypes(next.feeTypes);
      setRiskMsg(t('hq.saved'));
    } catch (e) {
      setRiskMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSavingRisk(false);
    }
  }

  function resetBasics() {
    setRisk((prev) =>
      prev
        ? {
            ...prev,
            defaultFxFeePercent: 0,
            defaultGasFeeUsdt: 0,
            defaultTransferFeeUsdt: 0,
            defaultOtherFeeUsdt: 0,
          }
        : prev,
    );
    setRiskMsg(t('hq.commission.simulatorBasicsReset'));
  }

  async function applyLiveBasics() {
    try {
      const c = await refreshLiveFromHq();
      const next = liveBasicFees(c.risk);
      setRisk((prev) => (prev ? { ...prev, ...next } : prev));
      setRiskMsg(t('hq.commission.simulatorBasicsAppliedLive'));
    } catch (e) {
      setRiskMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    }
  }

  function resetGasAddon() {
    setRisk((prev) => (prev ? { ...prev, defaultGasFeeUsdt: 0 } : prev));
    setRiskMsg(t('hq.commission.simulatorGasReset'));
  }

  async function applyLiveGasAddon() {
    try {
      const c = await refreshLiveFromHq();
      const gas = Number(c.risk?.defaultGasFeeUsdt) || 0;
      setRisk((prev) => (prev ? { ...prev, defaultGasFeeUsdt: gas } : prev));
      setRiskMsg(t('hq.commission.simulatorGasAppliedLive'));
    } catch (e) {
      setRiskMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    }
  }

  if (!risk) return null;

  const operatingLabel = operatingDefault
    ? `${operatingDefault.name} · ${operatingDefault.poolPercent}% + ${operatingDefault.perTicketUsdt} USDT`
    : t('hq.commission.simulatorOperatingFeeEmpty');

  return (
    <div className="pg-card">
      <div className="pg-card-head">{t('hq.commission.simulatorTitle')}</div>
      <div className="pg-card-body space-y-6">
        <p className="pg-hint">{t('hq.commission.simulatorDesc')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="pg-btn pg-btn-secondary" onClick={resetBasics}>
            {t('hq.commission.simulatorResetBasics')}
          </button>
          <button type="button" className="pg-btn pg-btn-secondary" onClick={() => void applyLiveBasics()}>
            {t('hq.commission.simulatorApplyLiveBasics')}
          </button>
        </div>
        <p className="pg-hint text-xs">{t('hq.commission.simulatorApplyLiveBasicsHint')}</p>

        <div className="space-y-3">
          <p className="pg-label">{t('hq.commission.simulatorDefaultSection')}</p>
          <p className="pg-hint text-xs">{t('hq.commission.simulatorDefaultDesc')}</p>
          <p className="pg-callout pg-callout-muted text-xs">
            {t('hq.commission.simulatorLiveBasicsRef', {
              fx: liveBasics.defaultFxFeePercent,
              gas: liveBasics.defaultGasFeeUsdt,
              transfer: liveBasics.defaultTransferFeeUsdt,
              other: liveBasics.defaultOtherFeeUsdt,
            })}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FEE_FIELDS.map((field) => (
              <div key={field.key} className="pg-sim-fee-field">
                <span className="pg-sim-fee-field-label">
                  {t(field.labelKey)} {t(field.unitKey)}
                </span>
                <PolicyNumberInput
                  className={`pg-sim-fee-input pg-sim-fee-input--${field.tone}`}
                  value={risk[field.key] ?? 0}
                  step={field.step}
                  min={0}
                  onChange={(v) => setRisk({ ...risk, [field.key]: v })}
                />
              </div>
            ))}
            <div className="pg-sim-fee-field">
              <span className="pg-sim-fee-field-label">{t('hq.commission.operatingFeeTotal')}</span>
              <select className="pg-input pg-sim-fee-input pg-sim-fee-input--other w-full text-xs" value={operatingDefault?.id ?? ''} disabled>
                <option value={operatingDefault?.id ?? ''}>{operatingLabel}</option>
              </select>
              <p className="mt-1 text-[10px] text-slate-500">{t('hq.commission.simulatorOperatingFeeHint')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="pg-btn pg-btn-primary"
              disabled={savingRisk}
              onClick={() => void saveRiskOnly()}
            >
              {savingRisk ? t('hq.saving') : t('hq.commission.saveSimulatorRisk')}
            </button>
            {riskMsg && <span className="pg-hint">{riskMsg}</span>}
          </div>
        </div>

        <SimulatorSandboxFeePreview
          liveTiers={liveTiers}
          sandboxRisk={risk}
          gasNetworks={gasNetworks}
          operatingFee={operatingDefault}
          onResetGasAddon={resetGasAddon}
          onApplyLiveGasAddon={() => void applyLiveGasAddon()}
        />
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqCommissionRiskConfig, type HqGasNetworkPolicy, type SymbolFeeTierRow } from '@/lib/api';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';
import { SimulatorSandboxFeePreview } from '@/components/hq-policy/SimulatorSandboxFeePreview';
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

export function SimulatorCommissionPanel() {
  const t = useT();
  const [risk, setRisk] = useState<HqCommissionRiskConfig | null>(null);
  const [liveTiers, setLiveTiers] = useState<SymbolFeeTierRow[]>([]);
  const [gasNetworks, setGasNetworks] = useState<HqGasNetworkPolicy | null>(null);
  const [savingRisk, setSavingRisk] = useState(false);
  const [riskMsg, setRiskMsg] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getCommission()
      .then((c) => {
        setRisk(withSandboxDefaults(c.simulatorRisk));
        setLiveTiers([...(c.feeTiers ?? [])]);
        setGasNetworks(c.gasNetworks ?? null);
      })
      .catch(console.error);
  }, []);

  async function saveRiskOnly() {
    if (!risk) return;
    setSavingRisk(true);
    setRiskMsg('');
    try {
      const payload = withSandboxDefaults(risk);
      const next = await hqPolicyApi.saveSimulatorCommissionRisk(payload);
      setRisk(withSandboxDefaults(next.simulatorRisk));
      setLiveTiers([...(next.feeTiers ?? liveTiers)]);
      setGasNetworks(next.gasNetworks ?? gasNetworks);
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

  if (!risk) return null;

  return (
    <div className="pg-card">
      <div className="pg-card-head">{t('hq.commission.simulatorTitle')}</div>
      <div className="pg-card-body space-y-6">
        <p className="pg-hint">{t('hq.commission.simulatorDesc')}</p>
        <button type="button" className="pg-btn pg-btn-secondary" onClick={resetBasics}>
          {t('hq.commission.simulatorResetBasics')}
        </button>

        <div className="space-y-3">
          <p className="pg-label">{t('hq.commission.simulatorDefaultSection')}</p>
          <p className="pg-hint text-xs">{t('hq.commission.simulatorDefaultDesc')}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        />
      </div>
    </div>
  );
}

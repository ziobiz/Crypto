'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqCommissionRiskConfig, type SymbolFeeTierRow } from '@/lib/api';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';

function withDefaults(risk: HqCommissionRiskConfig): HqCommissionRiskConfig {
  return {
    ...risk,
    defaultTransferFeeUsdt: risk.defaultTransferFeeUsdt ?? risk.defaultPlatformFeeUsdt ?? 0,
    defaultOtherFeeUsdt: risk.defaultOtherFeeUsdt ?? 0,
  };
}

export function SimulatorCommissionPanel() {
  const t = useT();
  const [risk, setRisk] = useState<HqCommissionRiskConfig | null>(null);
  const [tiers, setTiers] = useState<SymbolFeeTierRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getCommission()
      .then((c) => {
        setRisk(withDefaults(c.simulatorRisk ?? c.risk));
        setTiers(c.simulatorFeeTiers?.length ? [...c.simulatorFeeTiers] : [...(c.feeTiers ?? [])]);
      })
      .catch(console.error);
  }, []);

  async function saveAll() {
    if (!risk) return;
    setSaving(true);
    setMsg('');
    try {
      await hqPolicyApi.saveSimulatorCommissionRisk(risk);
      const next = await hqPolicyApi.saveSimulatorSymbolFeeTiers(tiers);
      setRisk(withDefaults(next.simulatorRisk ?? next.risk));
      setTiers([...(next.simulatorFeeTiers ?? next.feeTiers)]);
      setMsg(t('hq.saved'));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  function copyFromLive() {
    hqPolicyApi.getCommission().then((c) => {
      setRisk(withDefaults(c.risk));
      setTiers([...(c.feeTiers ?? [])]);
      setMsg(t('hq.commission.simulatorCopied'));
    });
  }

  if (!risk) return null;

  return (
    <div className="pg-card">
      <div className="pg-card-head">{t('hq.commission.simulatorTitle')}</div>
      <div className="pg-card-body space-y-4">
        <p className="pg-hint">{t('hq.commission.simulatorDesc')}</p>
        <button type="button" className="pg-btn pg-btn-secondary" onClick={copyFromLive}>
          {t('hq.commission.simulatorCopyLive')}
        </button>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="pg-field">
            <span className="pg-field-label">{t('hq.commission.fxFee')} (%)</span>
            <PolicyNumberInput
              value={risk.defaultFxFeePercent}
              onChange={(v) => setRisk({ ...risk, defaultFxFeePercent: v })}
            />
          </label>
          <label className="pg-field">
            <span className="pg-field-label">{t('hq.commission.gasFee')} (USDT)</span>
            <PolicyNumberInput
              value={risk.defaultGasFeeUsdt}
              onChange={(v) => setRisk({ ...risk, defaultGasFeeUsdt: v })}
            />
          </label>
          <label className="pg-field">
            <span className="pg-field-label">{t('hq.commission.transferFee')} (USDT)</span>
            <PolicyNumberInput
              value={risk.defaultTransferFeeUsdt}
              onChange={(v) => setRisk({ ...risk, defaultTransferFeeUsdt: v })}
            />
          </label>
          <label className="pg-field">
            <span className="pg-field-label">{t('hq.commission.otherFee')} (USDT)</span>
            <PolicyNumberInput
              value={risk.defaultOtherFeeUsdt}
              onChange={(v) => setRisk({ ...risk, defaultOtherFeeUsdt: v })}
            />
          </label>
        </div>
        <p className="pg-hint text-xs">
          {t('hq.commission.simulatorTierCount', { n: tiers.length })}
        </p>
        <button type="button" className="pg-btn pg-btn-primary" disabled={saving} onClick={saveAll}>
          {saving ? t('hq.saving') : t('hq.commission.saveSimulatorRisk')}
        </button>
        {msg && <p className="pg-hint">{msg}</p>}
      </div>
    </div>
  );
}

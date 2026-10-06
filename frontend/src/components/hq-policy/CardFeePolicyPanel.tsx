'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';
import {
  hqPolicyApi,
  type CardFeeBrand,
  type CardFeeMode,
  type HqCardPaymentConfig,
} from '@/lib/api';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';
import { PolicyTableActions } from '@/components/policy/PolicyTableActions';

const BRANDS: CardFeeBrand[] = ['VISA', 'MASTERCARD', 'AMEX', 'JCB', 'UNIONPAY', 'OTHER'];

const EMPTY_BRANDS = (): Record<CardFeeBrand, number> => ({
  VISA: 3.5,
  MASTERCARD: 3.5,
  AMEX: 3.5,
  JCB: 3.5,
  UNIONPAY: 3.5,
  OTHER: 3.5,
});

function uniformBrands(pct: number): Record<CardFeeBrand, number> {
  return Object.fromEntries(BRANDS.map((b) => [b, pct])) as Record<CardFeeBrand, number>;
}

function normalizeConfig(raw?: Partial<HqCardPaymentConfig> | null): HqCardPaymentConfig {
  const pct = Number(raw?.cardFeePercent ?? 3.5) || 0;
  const brands = { ...EMPTY_BRANDS(), ...(raw?.cardFeeByBrand ?? {}) };
  const mode: CardFeeMode = raw?.cardFeeMode === 'BY_BRAND' ? 'BY_BRAND' : 'UNIFORM';
  return {
    enabled: raw?.enabled === true,
    cardFeeMode: mode,
    cardFeePercent: pct,
    cardFeeByBrand: mode === 'UNIFORM' ? uniformBrands(pct) : brands,
    limits: raw?.limits ?? ({} as HqCardPaymentConfig['limits']),
  };
}

export function CardFeePolicyPanel() {
  const t = useT();
  const [config, setConfig] = useState<HqCardPaymentConfig>(() => normalizeConfig());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getCardPayment()
      .then((r) => setConfig(normalizeConfig(r.config)))
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  function setMode(mode: CardFeeMode) {
    setConfig((c) => {
      if (mode === 'UNIFORM') {
        const pct = c.cardFeePercent;
        return {
          ...c,
          cardFeeMode: 'UNIFORM',
          cardFeeByBrand: Object.fromEntries(BRANDS.map((b) => [b, pct])) as Record<
            CardFeeBrand,
            number
          >,
        };
      }
      return { ...c, cardFeeMode: 'BY_BRAND' };
    });
  }

  function setUniformPercent(pct: number) {
    setConfig((c) => ({
      ...c,
      cardFeePercent: pct,
      cardFeeByBrand: Object.fromEntries(BRANDS.map((b) => [b, pct])) as Record<
        CardFeeBrand,
        number
      >,
    }));
  }

  async function save() {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const current = await hqPolicyApi.getCardPayment();
      const next = await hqPolicyApi.saveCardPayment({
        ...current.config,
        ...config,
        enabled: current.config.enabled,
        limits: current.config.limits,
        cardFeeMode: config.cardFeeMode,
        cardFeePercent: config.cardFeePercent,
        cardFeeByBrand:
          config.cardFeeMode === 'UNIFORM'
            ? (Object.fromEntries(
                BRANDS.map((b) => [b, config.cardFeePercent]),
              ) as Record<CardFeeBrand, number>)
            : config.cardFeeByBrand,
      });
      setConfig(normalizeConfig(next.config));
      setMsg(t('hq.cardFee.saved'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('hq.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pg-card" id="card-fee">
      <div className="pg-card-head">{t('hq.cardFee.title')}</div>
      <div className="pg-card-body space-y-3">
        <p className="pg-hint text-xs">{t('hq.cardFee.desc')}</p>
        <p className="pg-hint text-xs text-sky-800">
          {t('hq.cardFee.paymentLinkHint')}{' '}
          <Link href="/dashboard/hq-policy/ops/payment" className="underline font-medium">
            {t('hq.ops.paymentManagement')}
          </Link>
        </p>

        <label className="block max-w-sm">
          <span className="pg-label">{t('hq.cardFee.mode')}</span>
          <select
            className="pg-input mt-1 w-full"
            value={config.cardFeeMode}
            onChange={(e) =>
              setMode(e.target.value === 'BY_BRAND' ? 'BY_BRAND' : 'UNIFORM')
            }
          >
            <option value="UNIFORM">{t('hq.cardFee.modeUniform')}</option>
            <option value="BY_BRAND">{t('hq.cardFee.modeByBrand')}</option>
          </select>
        </label>

        {config.cardFeeMode === 'UNIFORM' ? (
          <div className="max-w-xs">
            <label className="pg-label">{t('hq.cardFee.uniformPercent')}</label>
            <PolicyNumberInput
              value={config.cardFeePercent}
              onChange={setUniformPercent}
              className="pg-input mt-1 w-full"
            />
            <p className="pg-hint mt-1 text-[11px]">{t('hq.cardFee.uniformHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>{t('hq.cardFee.colBrand')}</th>
                  <th>{t('hq.cardFee.colPercent')}</th>
                </tr>
              </thead>
              <tbody>
                {BRANDS.map((brand) => (
                  <tr key={brand}>
                    <td>{t(`hq.cardFee.brand.${brand}` as 'hq.cardFee.brand.VISA')}</td>
                    <td>
                      <PolicyNumberInput
                        value={config.cardFeeByBrand?.[brand] ?? config.cardFeePercent}
                        onChange={(v) =>
                          setConfig((c) => {
                            const nextBrands = {
                              ...EMPTY_BRANDS(),
                              ...c.cardFeeByBrand,
                              [brand]: v,
                            };
                            return {
                              ...c,
                              cardFeeByBrand: nextBrands,
                              cardFeePercent: brand === 'OTHER' ? v : c.cardFeePercent,
                            };
                          })
                        }
                        className="pg-input mx-auto w-28 text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="pg-hint mt-2 text-[11px]">{t('hq.cardFee.byBrandHint')}</p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <PolicyTableActions>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="pg-btn pg-btn-primary disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('hq.cardFee.save')}
          </button>
        </PolicyTableActions>
      </div>
    </div>
  );
}

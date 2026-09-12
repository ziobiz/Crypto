'use client';

import { useT } from '@/context/LocaleProvider';
import type { FeeDiagramDisplayConfig, TransactionFees } from '@/lib/api';
import { formatFeeComponentLabel } from '@/lib/fee-component';
import { formatFiatAmount } from '@/lib/format';

const LOCAL_PREMIUM_CURRENCIES = ['KRW', 'THB', 'JPY'] as const;

export type UsdtFeeBreakdown = {
  targetUsdt: number;
  grossUsdt: number;
  fxFeeUsdt: number;
  gasFeeUsdt: number;
  transferFeeUsdt: number;
  otherFeeUsdt: number;
  netUsdt: number;
  requiredFiat: number;
  baseOtherFeeUsdt?: number;
  localPremiumFeeUsdt?: number;
  localPremiumPercent?: number;
  kimchiPremiumFeeUsdt?: number;
  kimchiPremiumPercent?: number;
  operatingFeeUsdt?: number;
  fairExchangeRate?: number;
};

type FeeRates = Partial<TransactionFees> & {
  baseOtherFeeUsdt?: number;
  localPremiumPercent?: number;
  kimchiPremiumPercent?: number;
  operatingFeePercent?: number;
  operatingFeeFixedUsdt?: number;
};

type FeeStep = {
  key: string;
  label: string;
  rate?: string;
  value: string;
  tone: string;
};

function isLocalPremiumCurrency(currency: string) {
  return (LOCAL_PREMIUM_CURRENCIES as readonly string[]).includes(currency);
}

function formatOperatingFeeRate(fees?: FeeRates): string {
  const pct = fees?.operatingFeePercent ?? 0;
  const fixed = fees?.operatingFeeFixedUsdt ?? 0;
  const parts: string[] = [];
  if (pct > 0) parts.push(`${pct}%`);
  if (fixed > 0) parts.push(`${fixed} USDT`);
  return parts.length > 0 ? parts.join(' + ') : '—';
}

const DEFAULT_DISPLAY: FeeDiagramDisplayConfig = {
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

export function UsdtFeeBreakdownPanel({
  breakdown,
  currency,
  exchangeRate,
  source,
  fees,
  display = DEFAULT_DISPLAY,
  cardFeeFiat,
  cardChargeFiat,
  cardFeePercent,
  isCardPayment,
}: {
  breakdown: UsdtFeeBreakdown;
  currency: string;
  exchangeRate: number;
  source?: string;
  fees?: FeeRates;
  display?: FeeDiagramDisplayConfig;
  cardFeeFiat?: number;
  cardChargeFiat?: number;
  cardFeePercent?: number;
  isCardPayment?: boolean;
}) {
  const t = useT();
  const cfg = { ...DEFAULT_DISPLAY, ...display };
  const billingMethod = cfg.billingMethod ?? cfg.defaultFeeBillingMethod ?? 'ITEMIZED';
  const premiumPct = breakdown.localPremiumPercent ?? breakdown.kimchiPremiumPercent ?? 0;
  const premiumFee = breakdown.localPremiumFeeUsdt ?? breakdown.kimchiPremiumFeeUsdt ?? 0;
  const showLocalPremium = isLocalPremiumCurrency(currency) && premiumPct > 0;
  const baseOther = breakdown.baseOtherFeeUsdt ?? fees?.baseOtherFeeUsdt ?? breakdown.otherFeeUsdt;
  const operatingFeeUsdt = breakdown.operatingFeeUsdt ?? 0;

  const premiumFeeLabel =
    currency === 'KRW'
      ? t('usdt.kimchiPremiumFee', { pct: premiumPct.toFixed(2) })
      : t('usdt.localPremiumFee', { currency, pct: premiumPct.toFixed(2) });

  const itemizedFeeParts: Array<{ key: string; amount: number; rate?: string; label: string; tone: string }> = [];
  if (cfg.fxFee) {
    itemizedFeeParts.push({
      key: 'fxFee',
      amount: breakdown.fxFeeUsdt,
      rate: fees ? formatFeeComponentLabel(fees, 'fx') : '—',
      label: t('usdt.fxFee'),
      tone: 'bg-amber-50',
    });
  }
  if (cfg.gasFee) {
    itemizedFeeParts.push({
      key: 'gasFee',
      amount: breakdown.gasFeeUsdt,
      rate: fees ? formatFeeComponentLabel(fees, 'gas') : '—',
      label: t('usdt.gasFee'),
      tone: 'bg-orange-50',
    });
  }
  if (cfg.transferFee) {
    itemizedFeeParts.push({
      key: 'transferFee',
      amount: breakdown.transferFeeUsdt,
      rate: fees ? formatFeeComponentLabel(fees, 'transfer') : '—',
      label: t('usdt.transferFee'),
      tone: 'bg-orange-50',
    });
  }
  if (cfg.otherFee) {
    if (showLocalPremium) {
      itemizedFeeParts.push({
        key: 'otherFeeBase',
        amount: baseOther,
        rate: fees ? formatFeeComponentLabel(fees, 'other') : '—',
        label: t('usdt.otherFeeBase'),
        tone: 'bg-orange-50',
      });
      if (cfg.localPremium) {
        itemizedFeeParts.push({
          key: 'localPremium',
          amount: premiumFee,
          rate: `${premiumPct.toFixed(2)}%`,
          label: premiumFeeLabel,
          tone: 'bg-rose-50',
        });
      }
    } else {
      itemizedFeeParts.push({
        key: 'otherFee',
        amount: breakdown.otherFeeUsdt,
        rate: fees ? formatFeeComponentLabel(fees, 'other') : '—',
        label: t('usdt.otherFee'),
        tone: 'bg-orange-50',
      });
    }
  } else if (cfg.localPremium && showLocalPremium) {
    itemizedFeeParts.push({
      key: 'localPremium',
      amount: premiumFee,
      rate: `${premiumPct.toFixed(2)}%`,
      label: premiumFeeLabel,
      tone: 'bg-rose-50',
    });
  }
  if (cfg.operatingFee) {
    itemizedFeeParts.push({
      key: 'operatingFee',
      amount: operatingFeeUsdt,
      rate: formatOperatingFeeRate(fees),
      label: t('usdt.operatingFee'),
      tone: 'bg-sky-50',
    });
  }

  const integratedTotal = itemizedFeeParts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const integratedRate = cfg.showRates
    ? itemizedFeeParts
        .map((p) => p.rate)
        .filter((r) => r && r !== '—')
        .join(' · ') || '—'
    : undefined;

  const allSteps: FeeStep[] = [];
  if (cfg.gross) {
    allSteps.push({
      key: 'gross',
      label: t('usdt.fee.gross'),
      rate: '—',
      value: `${breakdown.grossUsdt.toFixed(4)} USDT`,
      tone: 'bg-slate-100',
    });
  }

  const showIntegrated = billingMethod === 'INTEGRATED' || billingMethod === 'HYBRID';
  const showItemized = billingMethod === 'ITEMIZED' || billingMethod === 'HYBRID';

  if (showIntegrated) {
    allSteps.push({
      key: 'integratedFee',
      label: t('usdt.fee.integratedTotal'),
      rate: integratedRate,
      value: `− ${integratedTotal.toFixed(4)} USDT`,
      tone: 'bg-violet-50',
    });
  }

  if (showItemized) {
    for (const p of itemizedFeeParts) {
      allSteps.push({
        key: p.key,
        label: p.label,
        rate: p.rate,
        value: `− ${Number(p.amount).toFixed(4)} USDT`,
        tone: p.tone,
      });
    }
  }

  if (cfg.net) {
    allSteps.push({
      key: 'net',
      label: t('usdt.fee.net'),
      rate: '—',
      value: `${breakdown.netUsdt.toFixed(4)} USDT`,
      tone: 'bg-emerald-50 border-emerald-200',
    });
  }

  const steps = allSteps;

  const premiumNoteKey = `usdt.localPremiumNote.${currency}` as
    | 'usdt.localPremiumNote.KRW'
    | 'usdt.localPremiumNote.THB'
    | 'usdt.localPremiumNote.JPY';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-gray-900">{t('usdt.fee.diagramTitle')}</h3>
        <span className="text-[10px] text-gray-500">
          1 USDT = {exchangeRate.toLocaleString()} {currency}
          {source ? ` · ${source}` : ''}
          {` · ${t(`feeBilling.${billingMethod}` as 'feeBilling.INTEGRATED' | 'feeBilling.ITEMIZED' | 'feeBilling.HYBRID')}`}
        </span>
      </div>
      {showLocalPremium && breakdown.fairExchangeRate && cfg.localPremium && showItemized && (
        <p className="mt-2 text-[10px] text-rose-700">
          {currency === 'KRW'
            ? t('usdt.kimchiPremiumNote', {
                pct: premiumPct.toFixed(2),
                fair: breakdown.fairExchangeRate.toLocaleString(undefined, { maximumFractionDigits: 0 }),
                domestic: exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 0 }),
              })
            : t(premiumNoteKey, {
                pct: premiumPct.toFixed(2),
                fair: breakdown.fairExchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                domestic: exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 2 }),
              })}
        </p>
      )}
      {steps.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {cfg.showRates && (
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-3 text-[11px] font-medium text-gray-500">
              <span>{t('usdt.fee.colItem')}</span>
              <span className="text-center min-w-[5rem]">{t('usdt.fee.colRate')}</span>
              <span className="text-right">{t('usdt.fee.colAmount')}</span>
            </div>
          )}
          {steps.map((s) => (
            <div
              key={s.key}
              className={`rounded border border-transparent px-3 py-2 ${s.tone} ${
                cfg.showRates
                  ? 'grid grid-cols-[1fr_auto_1fr] gap-2 items-center'
                  : 'flex items-center justify-between'
              }`}
            >
              <span className="text-[11px] text-gray-600">{s.label}</span>
              {cfg.showRates && (
                <span className="text-center text-[11px] text-gray-500 tabular-nums min-w-[5rem] break-all">
                  {s.rate}
                </span>
              )}
              <span className="text-[11px] font-medium tabular-nums text-right">{s.value}</span>
            </div>
          ))}
        </div>
      )}
      {cfg.requiredFiat && (
        <div className="mt-3 rounded border border-blue-100 bg-blue-50/60 px-3 py-2">
          <p className="text-gray-600">
            {isCardPayment ? t('usdt.fee.fiatForConversion') : t('usdt.fee.requiredFiat')}
          </p>
          <p className="text-lg font-bold text-blue-800 tabular-nums text-center">
            {formatFiatAmount(breakdown.requiredFiat, currency)}
          </p>
        </div>
      )}
      {isCardPayment && cardChargeFiat != null && cardChargeFiat > 0 && (
        <div className="mt-3 space-y-2">
          {cardFeeFiat != null && cardFeeFiat > 0 && (
            <div className="rounded border border-violet-100 bg-violet-50/60 px-3 py-2">
              <p className="text-gray-600">
                {t('usdt.cardFee', { pct: (cardFeePercent ?? 0).toFixed(2) })}
              </p>
              <p className="text-base font-semibold text-violet-900 tabular-nums text-center">
                + {cardFeeFiat.toLocaleString()} {currency}
              </p>
            </div>
          )}
          <div className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2">
            <p className="text-gray-700 font-medium">{t('usdt.fee.cardChargeTotal')}</p>
            <p className="text-xl font-bold text-indigo-900 tabular-nums text-center">
              {cardChargeFiat.toLocaleString()} {currency}
            </p>
          </div>
        </div>
      )}
      <p className="mt-2 text-[10px] text-gray-500">
        {isCardPayment ? t('usdt.fee.cardNote') : t('usdt.fee.manualNote')}
      </p>
    </div>
  );
}

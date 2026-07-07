'use client';

import { useT } from '@/context/LocaleProvider';
import type { FeeDiagramDisplayConfig } from '@/lib/api';

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
  fairExchangeRate?: number;
};

type FeeRates = {
  fxFeePercent: number;
  gasFeeUsdt: number;
  transferFeeUsdt: number;
  otherFeeUsdt: number;
  baseOtherFeeUsdt?: number;
  localPremiumPercent?: number;
  kimchiPremiumPercent?: number;
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

const DEFAULT_DISPLAY: FeeDiagramDisplayConfig = {
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

export function UsdtFeeBreakdownPanel({
  breakdown,
  currency,
  exchangeRate,
  source,
  fees,
  display = DEFAULT_DISPLAY,
}: {
  breakdown: UsdtFeeBreakdown;
  currency: string;
  exchangeRate: number;
  source?: string;
  fees?: FeeRates;
  display?: FeeDiagramDisplayConfig;
}) {
  const t = useT();
  const cfg = { ...DEFAULT_DISPLAY, ...display };
  const premiumPct = breakdown.localPremiumPercent ?? breakdown.kimchiPremiumPercent ?? 0;
  const premiumFee = breakdown.localPremiumFeeUsdt ?? breakdown.kimchiPremiumFeeUsdt ?? 0;
  const showLocalPremium = isLocalPremiumCurrency(currency) && premiumPct > 0;
  const baseOther = breakdown.baseOtherFeeUsdt ?? fees?.baseOtherFeeUsdt ?? breakdown.otherFeeUsdt;

  const premiumFeeLabel =
    currency === 'KRW'
      ? t('usdt.kimchiPremiumFee', { pct: premiumPct.toFixed(2) })
      : t('usdt.localPremiumFee', { currency, pct: premiumPct.toFixed(2) });

  const allSteps: FeeStep[] = [
    {
      key: 'gross',
      label: t('usdt.fee.gross'),
      rate: '—',
      value: `${breakdown.grossUsdt.toFixed(4)} USDT`,
      tone: 'bg-slate-100',
    },
    {
      key: 'fxFee',
      label: t('usdt.fxFee'),
      rate: fees ? `${fees.fxFeePercent}%` : '—',
      value: `− ${breakdown.fxFeeUsdt.toFixed(4)} USDT`,
      tone: 'bg-amber-50',
    },
    {
      key: 'gasFee',
      label: t('usdt.gasFee'),
      rate: fees ? `${fees.gasFeeUsdt} USDT` : '—',
      value: `− ${breakdown.gasFeeUsdt.toFixed(4)} USDT`,
      tone: 'bg-orange-50',
    },
    {
      key: 'transferFee',
      label: t('usdt.transferFee'),
      rate: fees ? `${fees.transferFeeUsdt} USDT` : '—',
      value: `− ${breakdown.transferFeeUsdt.toFixed(4)} USDT`,
      tone: 'bg-orange-50',
    },
    ...(showLocalPremium
      ? [
          {
            key: 'otherFeeBase',
            label: t('usdt.otherFeeBase'),
            rate: fees ? `${baseOther} USDT` : '—',
            value: `− ${baseOther.toFixed(4)} USDT`,
            tone: 'bg-orange-50',
          },
          {
            key: 'localPremium',
            label: premiumFeeLabel,
            rate: `${premiumPct.toFixed(2)}%`,
            value: `− ${premiumFee.toFixed(4)} USDT`,
            tone: 'bg-rose-50',
          },
        ]
      : [
          {
            key: 'otherFee',
            label: t('usdt.otherFee'),
            rate: fees ? `${fees.otherFeeUsdt} USDT` : '—',
            value: `− ${breakdown.otherFeeUsdt.toFixed(4)} USDT`,
            tone: 'bg-orange-50',
          },
        ]),
    {
      key: 'net',
      label: t('usdt.fee.net'),
      rate: '—',
      value: `${breakdown.netUsdt.toFixed(4)} USDT`,
      tone: 'bg-emerald-50 border-emerald-200',
    },
  ];

  const visibleKeys = new Set<string>();
  if (cfg.gross) visibleKeys.add('gross');
  if (cfg.fxFee) visibleKeys.add('fxFee');
  if (cfg.gasFee) visibleKeys.add('gasFee');
  if (cfg.transferFee) visibleKeys.add('transferFee');
  if (cfg.otherFee) {
    visibleKeys.add('otherFee');
    visibleKeys.add('otherFeeBase');
  }
  if (cfg.localPremium) visibleKeys.add('localPremium');
  if (cfg.net) visibleKeys.add('net');

  const steps = allSteps.filter((s) => visibleKeys.has(s.key));

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
        </span>
      </div>
      {showLocalPremium && breakdown.fairExchangeRate && cfg.localPremium && (
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
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-3 text-[10px] font-medium text-gray-500">
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
              <span className="text-gray-600">{s.label}</span>
              {cfg.showRates && (
                <span className="text-center text-xs text-gray-500 tabular-nums min-w-[5rem]">
                  {s.rate}
                </span>
              )}
              <span className="font-medium tabular-nums text-right">{s.value}</span>
            </div>
          ))}
        </div>
      )}
      {cfg.requiredFiat && (
        <div className="mt-3 rounded border border-blue-100 bg-blue-50/60 px-3 py-2">
          <p className="text-gray-600">{t('usdt.fee.requiredFiat')}</p>
          <p className="text-lg font-bold text-blue-800 tabular-nums text-center">
            {breakdown.requiredFiat.toLocaleString()} {currency}
          </p>
        </div>
      )}
      <p className="mt-2 text-[10px] text-gray-500">{t('usdt.fee.manualNote')}</p>
    </div>
  );
}

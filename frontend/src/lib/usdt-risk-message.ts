import type { ApiError } from '@/lib/api';

type Translate = (key: 'usdt.riskMin' | 'usdt.riskMinPlain' | 'usdt.riskMax' | 'usdt.riskMaxPlain', vars?: Record<string, string | number>) => string;

type RiskDetails = {
  minUsdt?: number;
  maxUsdt?: number;
  fiatApprox?: number;
  currency?: string;
  limitCode?: string;
  country?: string;
};

export function formatUsdtRiskError(err: ApiError, t: Translate): string | null {
  if (err.code !== 'USDT_RISK_MIN' && err.code !== 'USDT_RISK_MAX') return null;
  const details = (err.details ?? {}) as RiskDetails;
  const amount = err.code === 'USDT_RISK_MIN' ? details.minUsdt : details.maxUsdt;
  const shown = Number(amount ?? 0).toLocaleString();
  const code = details.limitCode ?? '';
  const country = details.country ?? '';
  const fiat = Number(details.fiatApprox ?? 0);
  if (fiat > 0 && details.currency) {
    const key = err.code === 'USDT_RISK_MIN' ? 'usdt.riskMin' : 'usdt.riskMax';
    return t(key, {
      min: shown,
      max: shown,
      fiat: fiat.toLocaleString(),
      currency: details.currency,
      code,
      country,
    });
  }
  const plain = err.code === 'USDT_RISK_MIN' ? 'usdt.riskMinPlain' : 'usdt.riskMaxPlain';
  return t(plain, { min: shown, max: shown, code, country });
}

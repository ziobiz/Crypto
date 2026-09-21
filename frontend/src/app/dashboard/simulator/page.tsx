'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, ApiError, type SimulatorRunRow, type UsdtFeePreview } from '@/lib/api';
import { WALLET_NETWORKS, type WalletNetwork } from '@/constants/wallet-networks';
import type { MessageKey } from '@/i18n/messages';
import { UsdtRatePanel } from '@/components/UsdtRatePanel';
import { UsdtFeeBreakdownPanel } from '@/components/UsdtFeeBreakdown';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import { ContentCard } from '@/components/layout/ContentCard';
import { formatDate, formatFiatAmount, setCurrencyAmountDisplayPolicy } from '@/lib/format';

const FIAT_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY'] as const;
type FiatCurrency = (typeof FIAT_CURRENCIES)[number];
type InputMode = 'fiat' | 'target';
type SimulatorFeeMode = 'LIVE' | 'SAND';

type SimHistoryItem = {
  at: string;
  currency: FiatCurrency;
  mode: InputMode;
  fiatAmount: number;
  targetUsdt: number;
  exchangeRate: number;
  requiredFiat: number;
  netUsdt: number;
  totalFeeUsdt: number;
  grossUsdt: number;
  fxFeeUsdt: number;
  gasFeeUsdt: number;
  transferFeeUsdt: number;
  otherFeeUsdt: number;
  network: string;
  fees?: UsdtFeePreview['fees'];
  feeDiagramDisplay?: UsdtFeePreview['feeDiagramDisplay'];
  /** 고객 시뮬 ±N% (계산 결과와 동일하게 기록에도 적용) */
  amountRangePct?: number | null;
};

const HISTORY_LIMIT = 3;

function historyKey(userId: string) {
  return `crypto-sim-history:${userId}`;
}

function loadHistory(userId: string): SimHistoryItem[] {
  try {
    const raw = localStorage.getItem(historyKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SimHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

function saveHistory(userId: string, items: SimHistoryItem[]) {
  localStorage.setItem(historyKey(userId), JSON.stringify(items.slice(0, HISTORY_LIMIT)));
}

function runToHistory(
  row: SimulatorRunRow,
  display?: {
    feeDiagramDisplay?: UsdtFeePreview['feeDiagramDisplay'];
    amountRangePct?: number | null;
  },
): SimHistoryItem {
  const currency = FIAT_CURRENCIES.includes(row.currency as FiatCurrency) ? (row.currency as FiatCurrency) : 'JPY';
  return {
    at: row.createdAt,
    currency,
    mode: row.mode === 'target' ? 'target' : 'fiat',
    fiatAmount: row.mode === 'fiat' ? Number(row.inputAmount) : Number(row.requiredFiat),
    targetUsdt: Number(row.netUsdt),
    exchangeRate: Number(row.exchangeRate),
    requiredFiat: Number(row.requiredFiat),
    netUsdt: Number(row.netUsdt),
    totalFeeUsdt: Number(row.totalFeeUsdt),
    grossUsdt: Number(row.netUsdt) + Number(row.totalFeeUsdt),
    fxFeeUsdt: 0,
    gasFeeUsdt: 0,
    transferFeeUsdt: 0,
    otherFeeUsdt: 0,
    network: row.network,
    feeDiagramDisplay: display?.feeDiagramDisplay ?? row.feeDiagramDisplay,
    amountRangePct:
      display?.amountRangePct !== undefined
        ? display.amountRangePct
        : (row.amountRangePct ?? null),
  };
}

function n(value: unknown, digits?: number): number {
  const x = Number(value);
  if (!Number.isFinite(x)) return 0;
  return digits == null ? x : Number(x.toFixed(digits));
}

function totalFeeUsdt(preview: UsdtFeePreview): number {
  const b = preview.breakdown;
  if (!b) return 0;
  return n(n(b.fxFeeUsdt) + n(b.gasFeeUsdt) + n(b.transferFeeUsdt) + n(b.otherFeeUsdt), 8);
}

function fingerprint(
  item: Pick<SimHistoryItem, 'currency' | 'mode' | 'fiatAmount' | 'targetUsdt' | 'exchangeRate' | 'netUsdt'> & {
    network?: string;
  },
) {
  return [
    item.currency,
    item.network ?? '',
    item.mode,
    n(item.fiatAmount).toFixed(2),
    n(item.targetUsdt).toFixed(4),
    n(item.exchangeRate).toFixed(6),
    n(item.netUsdt).toFixed(4),
  ].join('|');
}

function isHqViewer(user: { role: string; organization?: { type: string } } | null): boolean {
  if (!user) return false;
  return user.role === 'SUPER_ADMIN' || user.organization?.type === 'HEAD_OFFICE';
}

export default function UsdtSimulatorPage() {
  const { user } = useAuth();
  const t = useT();
  const router = useRouter();
  const hq = isHqViewer(user);
  const [feeMode, setFeeMode] = useState<SimulatorFeeMode>('LIVE');
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>('JPY');
  const [network, setNetwork] = useState<WalletNetwork>('TRC20');
  const [inputMode, setInputMode] = useState<InputMode>('fiat');
  const [fiatAmount, setFiatAmount] = useState(0);
  const [targetUsdt, setTargetUsdt] = useState(0);
  const [preview, setPreview] = useState<UsdtFeePreview | null>(null);
  const [previewAt, setPreviewAt] = useState<string | null>(null);
  /** 입력 변경으로 preview가 비워져도 기록 표시 규칙은 유지 */
  const [displayPolicy, setDisplayPolicy] = useState<{
    feeDiagramDisplay?: UsdtFeePreview['feeDiagramDisplay'];
    amountRangePct?: number | null;
  } | null>(null);
  const [history, setHistory] = useState<SimHistoryItem[]>([]);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [invoiceMsg, setInvoiceMsg] = useState('');
  const [invoiceErr, setInvoiceErr] = useState('');
  const lastSaved = useRef('');

  useEffect(() => {
    if (user && user.pageAccess?.['/dashboard/simulator'] === 'NONE') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'CUSTOMER' || user.role === 'CUSTOMER_OPERATOR') {
      api.simulator
        .mine(HISTORY_LIMIT)
        .then((rows) => {
          const mapped = rows.slice(0, HISTORY_LIMIT).map((r) => runToHistory(r));
          const first = mapped[0];
          if (first?.feeDiagramDisplay || first?.amountRangePct != null) {
            setDisplayPolicy({
              feeDiagramDisplay: first.feeDiagramDisplay,
              amountRangePct: first.amountRangePct ?? null,
            });
          }
          setHistory(mapped.length ? mapped : loadHistory(user.id));
        })
        .catch(() => setHistory(loadHistory(user.id)));
      return;
    }
    setHistory(loadHistory(user.id));
  }, [user]);

  useEffect(() => {
    const def = user?.sessionPolicy?.defaultUsdtFiatCurrency;
    if (def && FIAT_CURRENCIES.includes(def)) setFiatCurrency(def);
  }, [user?.sessionPolicy?.defaultUsdtFiatCurrency]);

  // 금액·조건 변경 시 자동계산하지 않음 — 결과만 초기화
  useEffect(() => {
    setPreview(null);
    setPreviewAt(null);
    setError('');
  }, [inputMode, fiatAmount, targetUsdt, fiatCurrency, network, feeMode]);

  const ready = Boolean(network) && (inputMode === 'fiat' ? fiatAmount > 0 : targetUsdt > 0);

  async function runSimulation() {
    setError('');
    setInvoiceMsg('');
    setInvoiceErr('');
    if (!network) {
      setError(t('simulator.networkRequired'));
      return;
    }
    if (!ready) {
      setError(t('simulator.amountRequired'));
      return;
    }
    setRunning(true);
    try {
      const params =
        inputMode === 'fiat'
          ? { fiatCurrency, fiatAmount, network, ...(hq ? { feeMode } : {}) }
          : { fiatCurrency, targetUsdtAmount: targetUsdt, network, ...(hq ? { feeMode } : {}) };
      const p = await api.usdt.simulate(params);
      if (!p.breakdown) {
        setPreview(null);
        setError(t('simulator.targetFailed'));
        return;
      }
      if (p.currencyAmountDisplay) {
        setCurrencyAmountDisplayPolicy(p.currencyAmountDisplay);
      }
      setPreview(p);
      setPreviewAt(new Date().toISOString());
      setDisplayPolicy({
        feeDiagramDisplay: p.feeDiagramDisplay,
        amountRangePct: p.amountRangePct ?? null,
      });
      setError('');

      try {
        const issued = await api.simulator.issueInvoice({
          mode: inputMode,
          currency: fiatCurrency,
          network,
          requiredFiat: p.breakdown.requiredFiat,
          netUsdt: p.breakdown.netUsdt,
          exchangeRate: p.exchangeRate,
          ...(hq ? { feeMode } : {}),
        });
        setInvoiceMsg(
          t('simulator.invoiceIssued', {
            ticketNo: issued.invoiceNo || issued.ticketNo || '—',
            amount: String(issued.amount || p.breakdown.requiredFiat),
            currency: issued.currency || fiatCurrency,
          }),
        );
      } catch (ie) {
        const code = ie instanceof ApiError ? ie.code : undefined;
        if (code === 'INVOICE_NOT_CONFIGURED') {
          setInvoiceErr(t('simulator.invoiceNotConfigured'));
        } else {
          setInvoiceErr(ie instanceof Error ? ie.message : t('simulator.invoiceFailed'));
        }
      }
    } catch (e) {
      setPreview(null);
      const code = e instanceof ApiError ? e.code : undefined;
      if (code === 'NETWORK_REQUIRED') setError(t('simulator.networkRequired'));
      else if (code === 'USDT_RISK_MIN' || code === 'USDT_RISK_MAX') {
        setError(e instanceof Error ? e.message : t('usdt.riskLimitBlocked'));
      } else setError(e instanceof Error ? e.message : t('common.loadFailed'));
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    if (!user || !preview?.breakdown || !previewAt) return;
    const b = preview.breakdown;
    const item: SimHistoryItem = {
      at: previewAt,
      currency: fiatCurrency,
      mode: inputMode,
      fiatAmount: inputMode === 'fiat' ? fiatAmount : b.requiredFiat,
      targetUsdt: inputMode === 'target' ? targetUsdt : b.netUsdt,
      exchangeRate: preview.exchangeRate,
      requiredFiat: b.requiredFiat,
      netUsdt: b.netUsdt,
      totalFeeUsdt: totalFeeUsdt(preview),
      grossUsdt: b.grossUsdt,
      fxFeeUsdt: b.fxFeeUsdt,
      gasFeeUsdt: b.gasFeeUsdt,
      transferFeeUsdt: b.transferFeeUsdt,
      otherFeeUsdt: b.otherFeeUsdt,
      network,
      fees: preview.fees,
      feeDiagramDisplay: preview.feeDiagramDisplay,
      amountRangePct: preview.amountRangePct ?? null,
    };
    const fp = fingerprint(item);
    const timer = window.setTimeout(() => {
      if (lastSaved.current === fp) return;
      lastSaved.current = fp;
      setHistory((prev) => {
        const next = [item, ...prev.filter((h) => fingerprint(h) !== fp)].slice(0, HISTORY_LIMIT);
        saveHistory(user.id, next);
        return next;
      });
      if (user.role === 'CUSTOMER' || user.role === 'CUSTOMER_OPERATOR') {
        const displaySnap = {
          feeDiagramDisplay: preview.feeDiagramDisplay,
          amountRangePct: preview.amountRangePct ?? null,
        };
        api.simulator
          .log({
            mode: inputMode,
            currency: fiatCurrency,
            network,
            inputAmount: inputMode === 'fiat' ? fiatAmount : targetUsdt,
            requiredFiat: b.requiredFiat,
            netUsdt: b.netUsdt,
            totalFeeUsdt: totalFeeUsdt(preview),
            exchangeRate: preview.exchangeRate,
          })
          .then(() => api.simulator.mine(HISTORY_LIMIT))
          .then((rows) =>
            setHistory(
              rows.slice(0, HISTORY_LIMIT).map((r) => runToHistory(r, displaySnap)),
            ),
          )
          .catch(() => undefined);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [user, preview, previewAt, fiatCurrency, network, inputMode, fiatAmount, targetUsdt]);

  const historyRows = history.slice(0, HISTORY_LIMIT);
  /** 계산 결과와 동일: preview → displayPolicy → 항목 저장값 */
  const historyShowTotalFee =
    (preview?.feeDiagramDisplay ?? displayPolicy?.feeDiagramDisplay)?.showTotalFee !== false;
  const historyRangePct =
    preview?.amountRangePct ?? displayPolicy?.amountRangePct ?? null;

  const breakdown = preview?.breakdown ?? null;
  const rate = preview?.exchangeRate ?? 0;

  return (
    <div className="pg-stack">
      <ContentCard>
        <UsdtRatePanel compact />
      </ContentCard>

      <ContentCard title={t('simulator.title')}>
        <p className="pg-hint mb-3">{t('simulator.hint')}</p>
        <div className="pg-callout pg-callout-muted mb-3 text-xs">{t('simulator.disclaimer')}</div>
        {hq && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`pg-btn ${feeMode === 'LIVE' ? 'pg-btn-primary' : 'pg-btn-secondary'}`}
              onClick={() => setFeeMode('LIVE')}
            >
              {t('simulator.tabLive')}
            </button>
            <button
              type="button"
              className={`pg-btn ${feeMode === 'SAND' ? 'pg-btn-primary' : 'pg-btn-secondary'}`}
              onClick={() => setFeeMode('SAND')}
            >
              {t('simulator.tabSandbox')}
            </button>
          </div>
        )}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`pg-btn ${inputMode === 'fiat' ? 'pg-btn-primary' : ''}`}
            onClick={() => setInputMode('fiat')}
          >
            {t('simulator.modeFiat')}
          </button>
          <span className="text-slate-400" aria-hidden>
            |
          </span>
          <button
            type="button"
            className={`pg-btn ${inputMode === 'target' ? 'pg-btn-primary' : ''}`}
            onClick={() => setInputMode('target')}
          >
            {t('simulator.modeUsdt')}
          </button>
          <span className="text-slate-400" aria-hidden>
            |
          </span>
          <button
            type="button"
            className="pg-btn pg-btn-secondary"
            onClick={() => {
              setFiatAmount(0);
              setTargetUsdt(0);
              setPreview(null);
              setPreviewAt(null);
              setError('');
              lastSaved.current = '';
            }}
          >
            {t('simulator.reset')}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="pg-label">{t('simulator.currency')}</span>
            <select
              className="pg-select w-full"
              value={fiatCurrency}
              onChange={(e) => setFiatCurrency(e.target.value as FiatCurrency)}
            >
              {FIAT_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="pg-label">{t('simulator.network')} *</span>
            <select
              className="pg-select w-full"
              value={network}
              onChange={(e) => setNetwork(e.target.value as WalletNetwork)}
            >
              {WALLET_NETWORKS.map((n) => (
                <option key={n.value} value={n.value}>
                  {t(`network.${n.value}` as MessageKey)}
                </option>
              ))}
            </select>
            <span className="pg-hint mt-1 block">{t('simulator.networkHint')}</span>
          </label>
        </div>

        {inputMode === 'fiat' ? (
          <label className="mt-3 block">
            <span className="pg-label">{t('simulator.fiatAmount', { currency: fiatCurrency })}</span>
            <FormattedAmountInput
              className="pg-input w-full"
              value={fiatAmount}
              min={0}
              onChange={setFiatAmount}
            />
          </label>
        ) : (
          <label className="mt-3 block">
            <span className="pg-label">{t('simulator.targetUsdt')}</span>
            <FormattedAmountInput
              className="pg-input w-full"
              value={targetUsdt}
              min={0}
              allowDecimal
              onChange={setTargetUsdt}
            />
            <span className="pg-hint mt-1 block">{t('simulator.targetHint')}</span>
          </label>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {invoiceMsg && <p className="mt-2 text-sm text-emerald-700">{invoiceMsg}</p>}
        {invoiceErr && <p className="mt-2 text-sm text-amber-700">{invoiceErr}</p>}

        <button
          type="button"
          className="pg-btn pg-btn-primary mt-4 w-full sm:w-auto"
          disabled={running || !ready}
          onClick={() => void runSimulation()}
        >
          {running ? t('simulator.running') : t('simulator.run')}
        </button>
        <p className="pg-hint mt-2">{t('simulator.runHint')}</p>
        <p className="pg-hint mt-1">{t('simulator.invoiceHint')}</p>
      </ContentCard>

      {breakdown && (
        <ContentCard title={t('simulator.result')}>
          <SimpleSimSummary
            at={previewAt}
            currency={fiatCurrency}
            network={network}
            rate={rate}
            requiredFiat={breakdown.requiredFiat}
            netUsdt={breakdown.netUsdt}
            totalFeeUsdt={totalFeeUsdt(preview!)}
            showTotalFee={preview?.feeDiagramDisplay?.showTotalFee !== false}
            rangePct={preview?.amountRangePct}
          />
          {hq && (
            <div className="mt-3">
              <UsdtFeeBreakdownPanel
                breakdown={breakdown}
                currency={fiatCurrency}
                exchangeRate={rate}
                fees={preview?.fees}
                display={preview?.feeDiagramDisplay}
                amountRangePct={preview?.amountRangePct}
                showExactWithRange={Boolean(preview?.amountRangePct)}
              />
            </div>
          )}
        </ContentCard>
      )}

      <ContentCard title={t('simulator.history')}>
        {historyRows.length === 0 ? (
          <p className="pg-hint">{t('simulator.historyEmpty')}</p>
        ) : (
          <div className="space-y-3">
            {historyRows.map((item) => (
              <div key={`${item.at}-${fingerprint(item)}`} className="rounded border border-slate-200 p-3">
                <SimpleSimSummary
                  at={item.at}
                  currency={item.currency}
                  network={item.network}
                  rate={item.exchangeRate}
                  requiredFiat={item.requiredFiat}
                  netUsdt={item.netUsdt}
                  totalFeeUsdt={item.totalFeeUsdt}
                  showTotalFee={
                    item.feeDiagramDisplay?.showTotalFee !== undefined
                      ? item.feeDiagramDisplay.showTotalFee !== false
                      : historyShowTotalFee
                  }
                  rangePct={
                    item.amountRangePct != null ? item.amountRangePct : historyRangePct
                  }
                />
                {hq && (
                  <div className="mt-3">
                    <UsdtFeeBreakdownPanel
                      breakdown={{
                        targetUsdt: item.netUsdt,
                        grossUsdt: item.grossUsdt,
                        fxFeeUsdt: item.fxFeeUsdt,
                        gasFeeUsdt: item.gasFeeUsdt,
                        transferFeeUsdt: item.transferFeeUsdt,
                        otherFeeUsdt: item.otherFeeUsdt,
                        netUsdt: item.netUsdt,
                        requiredFiat: item.requiredFiat,
                      }}
                      currency={item.currency}
                      exchangeRate={item.exchangeRate}
                      fees={item.fees}
                      display={item.feeDiagramDisplay ?? preview?.feeDiagramDisplay}
                      amountRangePct={
                        item.amountRangePct != null ? item.amountRangePct : historyRangePct
                      }
                      showExactWithRange={Boolean(
                        (item.amountRangePct != null ? item.amountRangePct : historyRangePct) ??
                          0,
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ContentCard>
    </div>
  );
}

function SimpleSimSummary({
  at,
  currency,
  network,
  rate,
  requiredFiat,
  netUsdt,
  totalFeeUsdt,
  showTotalFee = true,
  rangePct,
}: {
  at: string | null;
  currency: string;
  network?: string;
  rate: number;
  requiredFiat: number;
  netUsdt: number;
  totalFeeUsdt: number;
  showTotalFee?: boolean;
  /** 고객 시뮬 ±N%. 본사는 미전달 → 정확 금액만 */
  rangePct?: number | null;
}) {
  const t = useT();
  const showRange = rangePct != null && rangePct > 0;
  const fiatDelta = showRange ? n(requiredFiat) * (rangePct / 100) : 0;
  const usdtDelta = showRange ? n(netUsdt) * (rangePct / 100) : 0;
  const fiatLow = Math.max(0, n(requiredFiat) - fiatDelta);
  const fiatHigh = n(requiredFiat) + fiatDelta;
  const usdtLow = Math.max(0, n(netUsdt) - usdtDelta);
  const usdtHigh = n(netUsdt) + usdtDelta;
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <div className="pg-hint">{t('simulator.at')}</div>
        <div className="font-semibold">{at ? formatDate(at) : '—'}</div>
      </div>
      <div>
        <div className="pg-hint">{t('simulator.rate')}</div>
        <div className="font-semibold">
          1 USDT = {n(rate).toLocaleString()} {currency}
        </div>
      </div>
      <div>
        <div className="pg-hint">{t('simulator.network')}</div>
        <div className="font-semibold">
          {network ? t(`network.${network}` as MessageKey) : '—'}
        </div>
      </div>
      <div>
        <div className="pg-hint">{t('simulator.needFiat')}</div>
        {showRange ? (
          <div className="space-y-0.5">
            <div className="text-lg font-bold tabular-nums text-blue-700">
              {formatFiatAmount(fiatLow, currency)} ~ {formatFiatAmount(fiatHigh, currency)}
            </div>
            <div className="text-lg font-bold tabular-nums text-blue-700">
              {t('usdt.fee.refExact')}: {formatFiatAmount(n(requiredFiat), currency)}
            </div>
          </div>
        ) : (
          <div className="text-lg font-bold tabular-nums text-blue-700">
            {formatFiatAmount(n(requiredFiat), currency)}
          </div>
        )}
      </div>
      <div>
        <div className="pg-hint">{t('simulator.receiveUsdt')}</div>
        {showRange ? (
          <div className="space-y-0.5">
            <div className="text-lg font-bold tabular-nums text-red-600">
              {usdtLow.toFixed(4)} ~ {usdtHigh.toFixed(4)} USDT
            </div>
            <div className="text-lg font-bold tabular-nums text-red-600">
              {t('usdt.fee.refExact')}: {n(netUsdt).toFixed(4)} USDT
            </div>
          </div>
        ) : (
          <div className="text-lg font-bold tabular-nums text-red-600">{n(netUsdt).toFixed(4)} USDT</div>
        )}
      </div>
      {showTotalFee && (
        <div>
          <div className="pg-hint">{t('simulator.totalFee')}</div>
          <div className="text-lg font-bold tabular-nums text-green-600">{n(totalFeeUsdt).toFixed(4)} USDT</div>
        </div>
      )}
    </div>
  );
}

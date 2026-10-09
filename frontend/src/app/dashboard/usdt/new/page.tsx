'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  ApiError,
  ExchangeRateResponse,
  UsdtCardPaymentContext,
  UsdtDepositContext,
  UsdtFeePreview,
  Wallet,
} from '@/lib/api';
import { UsdtRatePanel } from '@/components/UsdtRatePanel';
import { UsdtFeeBreakdownPanel } from '@/components/UsdtFeeBreakdown';
import { FormattedAmountInput } from '@/components/FormattedAmountInput';
import { ContentCard } from '@/components/layout/ContentCard';
import {
  CardPaymentForm,
  emptyCardForm,
  isEnglishName,
  type CardFormState,
} from '@/components/CardPaymentForm';
import { LocalizedFileInput } from '@/components/LocalizedFileInput';
import { ReferenceClocks } from '@/components/ReferenceClocks';
import { CopyableMono } from '@/components/CopyButton';
import { displayWalletTitle } from '@/lib/wallet-label';
import { isKycApproved } from '@/lib/kyc';
import { formatUsdtRiskError } from '@/lib/usdt-risk-message';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import { useApplySessionTimers } from '@/hooks/useApplySessionTimers';
import {
  FIAT_CURRENCIES,
  FIAT_CURRENCY_LABELS,
  depositPaymentRail,
  type FiatCurrency,
} from '@/lib/fiat-currency';

const FIAT_LABELS = FIAT_CURRENCY_LABELS;
const ALL_CURRENCY_TRADE: Record<FiatCurrency, { transfer: boolean; card: boolean }> = {
  KRW: { transfer: true, card: true },
  JPY: { transfer: true, card: true },
  THB: { transfer: true, card: true },
  CNY: { transfer: true, card: true },
  USD: { transfer: true, card: true },
  EUR: { transfer: true, card: true },
};
type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'REMITTANCE';
type InputMode = 'target' | 'fiat' | 'cardCharge';

export default function UsdtNewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useT();
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const kycOk = isKycApproved(user);
  const tradeAllowed = user?.tradeAccess !== 'VIEW_ONLY';
  const canApply = kycOk && tradeAllowed;
  const [wallets, setWallets] = useState<Wallet[]>([]);
  /** 정산 자산과 같지만 HQ 승인 대기 중 — 선택 불가, 안내용 */
  const [pendingWallets, setPendingWallets] = useState<Wallet[]>([]);
  /** 다른 자산으로만 등록된 승인 지갑 수 (정산 자산과 불일치) */
  const [otherAssetApprovedCount, setOtherAssetApprovedCount] = useState(0);
  const [rate, setRate] = useState<ExchangeRateResponse | null>(null);
  const [cardContext, setCardContext] = useState<UsdtCardPaymentContext | null>(null);
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>('USD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [inputMode, setInputMode] = useState<InputMode>('target');
  const [targetUsdt, setTargetUsdt] = useState('');
  const [fiatAmount, setFiatAmount] = useState(0);
  const [cardChargeFiat, setCardChargeFiat] = useState(0);
  const [walletId, setWalletId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feePreview, setFeePreview] = useState<UsdtFeePreview | null>(null);
  const [expressTier, setExpressTier] = useState<string>('BASIC');
  const [cardForm, setCardForm] = useState<CardFormState>(emptyCardForm());
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [depositReceiptFiles, setDepositReceiptFiles] = useState<File[]>([]);
  const [depositCtx, setDepositCtx] = useState<UsdtDepositContext | null>(null);
  const dailyBlocked = !!depositCtx?.dailyTicketLimitReached;

  const onSessionExpire = useCallback(
    (reason: 'max' | 'idle') => {
      window.alert(
        reason === 'idle' ? t('usdt.applyIdleExpired') : t('usdt.applySessionExpired'),
      );
      router.replace('/dashboard/usdt');
    },
    [router, t],
  );

  const { sessionLabel } = useApplySessionTimers({
    enabled: !dailyBlocked && depositCtx != null,
    applyMaxMinutes: depositCtx?.applyMaxMinutes ?? 10,
    applyIdleMinutes: depositCtx?.applyIdleMinutes ?? 5,
    onExpire: onSessionExpire,
  });

  useEffect(() => {
    if (!depositCtx) return;
    const home = depositCtx.preferredBankCurrency;
    if (home && FIAT_CURRENCIES.includes(home as FiatCurrency)) {
      setPaymentMethod('BANK_TRANSFER');
      setFiatCurrency(home as FiatCurrency);
      return;
    }
    const def = user?.sessionPolicy?.defaultUsdtFiatCurrency;
    if (def && FIAT_CURRENCIES.includes(def)) {
      setFiatCurrency(def);
    }
  }, [
    user?.sessionPolicy?.defaultUsdtFiatCurrency,
    depositCtx?.preferredBankCurrency,
  ]);

  useEffect(() => {
    const applySettlementWallets = (
      settlementRows: Wallet[],
      allRows: Wallet[],
      settlement?: string,
    ) => {
      const asset = settlement === 'USDC' ? 'USDC' : 'USDT';
      const otherAsset = asset === 'USDC' ? 'USDT' : 'USDC';
      const matchAsset = (x: Wallet) => (x.assetType ?? 'USDT') === asset;
      const notDeleted = (x: Wallet) => !x.deleteRequestedAt;
      const usable = settlementRows
        .filter(
          (x) =>
            matchAsset(x) &&
            notDeleted(x) &&
            x.approvalStatus !== 'PENDING' &&
            x.approvalStatus !== 'REJECTED',
        )
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      const pending = settlementRows
        .filter((x) => matchAsset(x) && notDeleted(x) && x.approvalStatus === 'PENDING')
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      const otherApproved = allRows.filter(
        (x) =>
          (x.assetType ?? 'USDT') === otherAsset &&
          notDeleted(x) &&
          x.approvalStatus !== 'PENDING' &&
          x.approvalStatus !== 'REJECTED',
      ).length;
      setWallets(usable);
      setPendingWallets(pending);
      setOtherAssetApprovedCount(otherApproved);
      const def = usable.find((x) => x.isDefault) ?? usable[0];
      if (def) setWalletId(def.id);
      else setWalletId('');
    };
    api.usdt
      .depositContext()
      .then((ctx) => {
        setDepositCtx(ctx);
        const asset = ctx.settlementAsset === 'USDC' ? 'USDC' : 'USDT';
        /** 운영자도 /api/wallets 로 최신·정산자산 필터 목록 사용 (세션 user.wallets 의존 제거) */
        Promise.all([
          api.wallets.list({ forApply: true }),
          api.wallets.list(),
        ])
          .then(([settlementRows, allRows]) =>
            applySettlementWallets(settlementRows, allRows, asset),
          )
          .catch(console.error);
      })
      .catch(console.error);
    api.usdt.cardContext().then((ctx) => {
      setCardContext(ctx);
      const first = (ctx.legalFirstName ?? '').trim();
      const last = (ctx.legalLastName ?? '').trim();
      setCardForm(
        emptyCardForm({
          email: ctx.userEmail ?? '',
          phone: ctx.userPhone ?? '',
          phoneCountryCode: ctx.userPhoneCountryCode ?? '+82',
          firstName: first,
          lastName: last,
          cardholderName: [first, last].filter(Boolean).join(' '),
          nameLocked: true,
        }),
      );
    }).catch(() => setCardContext({
      cardPaymentEnabled: false,
      enabled: false,
      cardFeePercent: 0,
      limits: {} as UsdtCardPaymentContext['limits'],
      currencyTrade: ALL_CURRENCY_TRADE,
      icopayConfigured: false,
      userPhone: null,
      userPhoneCountryCode: null,
      userEmail: null,
      userName: null,
      legalFirstName: null,
      legalLastName: null,
      legalNameLocked: false,
    }));
  }, [user?.id, user?.role]);

  const isCard = paymentMethod === 'CARD';
  const isRemittance = paymentMethod === 'REMITTANCE';
  const trade = {
    ...ALL_CURRENCY_TRADE,
    ...(depositCtx?.currencyTrade ?? cardContext?.currencyTrade ?? {}),
  };
  const remitFiats = (
    depositCtx?.remittancePaymentCurrencies ??
    depositCtx?.directRemitCurrencies ??
    []
  ).filter((c): c is FiatCurrency => FIAT_CURRENCIES.includes(c as FiatCurrency));
  /** 계좌이체 = 로컬 고정/가상(송금통화 제외). 송금거래 = USD/EUR 등 */
  const transferFiats = FIAT_CURRENCIES.filter(
    (c) => trade[c].transfer && !remitFiats.includes(c),
  );
  const cardFiats = FIAT_CURRENCIES.filter((c) => trade[c].card);
  const cardPaymentEnabled = cardContext?.cardPaymentEnabled === true;
  const cardOperational = cardContext?.enabled === true;
  const cardMethodAvailable =
    cardPaymentEnabled &&
    cardFiats.length > 0 &&
    depositCtx?.cardPaymentCustomerAllowed !== false;
  const bankMethodAvailable =
    transferFiats.length > 0 && depositCtx?.bankPaymentAvailable !== false;
  const remittanceMethodAvailable =
    depositCtx?.remittancePaymentAvailable !== false && remitFiats.length > 0;
  const methodFiats = isCard ? cardFiats : isRemittance ? remitFiats : transferFiats;
  const isCurfexCurrency =
    !isCard &&
    !isRemittance &&
    (depositCtx?.curfexEnabledCurrencies ?? []).includes(
      fiatCurrency as 'KRW' | 'JPY' | 'THB' | 'CNY',
    );
  const fixedReceiving =
    !isCard && !isCurfexCurrency
      ? depositCtx?.receivingAccounts?.[fiatCurrency] ?? null
      : null;

  useEffect(() => {
    if (cardContext && !cardMethodAvailable && paymentMethod === 'CARD') {
      setPaymentMethod(remittanceMethodAvailable ? 'REMITTANCE' : 'BANK_TRANSFER');
      setInputMode('target');
    }
  }, [cardContext, cardMethodAvailable, paymentMethod, remittanceMethodAvailable]);

  useEffect(() => {
    if (paymentMethod === 'BANK_TRANSFER' && !bankMethodAvailable) {
      if (remittanceMethodAvailable) {
        setPaymentMethod('REMITTANCE');
        setInputMode('target');
      } else if (cardMethodAvailable) {
        setPaymentMethod('CARD');
        setInputMode('cardCharge');
      }
    }
  }, [bankMethodAvailable, cardMethodAvailable, remittanceMethodAvailable, paymentMethod]);

  useEffect(() => {
    if (paymentMethod === 'REMITTANCE' && !remittanceMethodAvailable) {
      if (bankMethodAvailable) {
        setPaymentMethod('BANK_TRANSFER');
        setInputMode('target');
      } else {
        setPaymentMethod('CARD');
        setInputMode('cardCharge');
      }
    }
  }, [remittanceMethodAvailable, bankMethodAvailable, paymentMethod]);

  useEffect(() => {
    const list = isCard ? cardFiats : isRemittance ? remitFiats : transferFiats;
    if (list.length > 0 && !list.includes(fiatCurrency)) {
      const home = depositCtx?.preferredBankCurrency as FiatCurrency | undefined;
      setFiatCurrency(home && list.includes(home) ? home : list[0]);
    }
  }, [
    isCard,
    isRemittance,
    fiatCurrency,
    transferFiats.join('|'),
    cardFiats.join('|'),
    remitFiats.join('|'),
    depositCtx?.preferredBankCurrency,
  ]);

  useEffect(() => {
    api.exchangeRateFor(fiatCurrency).then(setRate).catch(console.error);
  }, [fiatCurrency]);

  const settlementAssetLabel =
    depositCtx?.settlementAsset === 'USDC' || user?.sessionPolicy?.settlementAsset === 'USDC'
      ? 'USDC'
      : 'USDT';
  const usdtAmount = parseFloat(targetUsdt) || 0;
  const canPreview =
    walletId &&
    (inputMode === 'target'
      ? usdtAmount > 0
      : inputMode === 'cardCharge'
        ? cardChargeFiat > 0
        : fiatAmount > 0);

  // 금액·수단 변경 시 잠정 견적 초기화
  useEffect(() => {
    setFeePreview(null);
  }, [
    walletId,
    fiatCurrency,
    inputMode,
    usdtAmount,
    fiatAmount,
    cardChargeFiat,
    isCard,
    isRemittance,
    cardForm.cardBrand,
    cardContext?.cardFeeMode,
  ]);

  const fiatRate = rate?.usdtFiatRate ?? rate?.usdtKrwRate ?? 0;
  const cardLimitBand = isCard ? cardContext?.limits?.[fiatCurrency] : null;
  const cardLimitMin = Number(cardLimitBand?.min) || 0;
  const cardLimitMax = Number(cardLimitBand?.max) || 0;
  const cardLimitBannerText =
    cardLimitBand && (cardLimitMin > 0 || cardLimitMax > 0)
      ? cardLimitMin > 0 && cardLimitMax > 0
        ? t('usdt.cardLimitBanner', {
            currency: fiatCurrency,
            min: cardLimitMin.toLocaleString(),
            max: cardLimitMax.toLocaleString(),
          })
        : cardLimitMax > 0
          ? t('usdt.cardLimitBannerMaxOnly', {
              currency: fiatCurrency,
              max: cardLimitMax.toLocaleString(),
            })
          : t('usdt.cardLimitBannerMinOnly', {
              currency: fiatCurrency,
              min: cardLimitMin.toLocaleString(),
            })
      : null;
  const breakdown = feePreview?.breakdown ?? null;
  /** 이체·송금 + 견적정책 ON → 신청 후 상세에서 확정·거래 */
  const useQuoteFlow = !isCard && depositCtx?.quoteResponse?.enabled !== false;

  const buildFeeParams = () => {
    const base = {
      walletId,
      fiatCurrency,
      paymentMethod: isCard
        ? ('CARD' as const)
        : isRemittance
          ? ('REMITTANCE' as const)
          : undefined,
      expressTier: isCard ? undefined : expressTier,
      cardBrand:
        isCard && cardContext?.cardFeeMode === 'BY_BRAND' ? cardForm.cardBrand : undefined,
    };
    if (inputMode === 'target') return { ...base, targetUsdtAmount: usdtAmount };
    if (inputMode === 'cardCharge') return { ...base, cardChargeFiat };
    return { ...base, fiatAmount };
  };

  const expressOptions =
    feePreview?.express?.options ?? depositCtx?.express?.options ?? [];
  const expressEnabled =
    !isCard &&
    !!(feePreview?.express?.enabled ?? depositCtx?.express?.enabled) &&
    expressOptions.length > 0;

  useEffect(() => {
    if (!expressOptions.length) return;
    if (!expressOptions.some((o) => o.tier === expressTier)) {
      const basic = expressOptions.find((o) => o.tier === 'BASIC');
      setExpressTier(basic?.tier ?? expressOptions[expressOptions.length - 1]!.tier);
    }
  }, [expressOptions, expressTier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (dailyBlocked) {
      setError(
        t('usdt.dailyLimitReached', {
          max: depositCtx?.maxDailyTicketsPerCustomer ?? 0,
        }),
      );
      return;
    }
    if (useQuoteFlow) {
      if (!canApply) {
        setError(!tradeAllowed ? t('tradeAccess.requiredToTrade') : t('kyc.requiredToTrade'));
        return;
      }
      if (!canPreview) {
        setError(t('usdt.amountRequired'));
        return;
      }
      if (isRemittance ? !remittanceMethodAvailable : !bankMethodAvailable) {
        setError(
          isRemittance
            ? t('usdt.paymentRemittanceDisabledHint')
            : t('usdt.fiatTransferDisabled', { currency: fiatCurrency }),
        );
        return;
      }

      // 1차: 수수료 미리보기만 (일일 건수 미소진)
      if (!feePreview?.breakdown) {
        setLoading(true);
        try {
          const preview = await api.usdt.fees(buildFeeParams());
          setFeePreview(preview);
        } catch (err) {
          if (err instanceof ApiError && err.code === 'FIAT_TRANSFER_DISABLED') {
            setError(t('usdt.fiatTransferDisabled', { currency: fiatCurrency }));
          } else if (
            err instanceof ApiError &&
            (err.code === 'USDT_RISK_MIN' || err.code === 'USDT_RISK_MAX')
          ) {
            setError(formatUsdtRiskError(err, t) ?? err.message);
            setFeePreview(null);
          } else {
            setError(err instanceof Error ? err.message : t('usdt.submitFailed'));
          }
        } finally {
          setLoading(false);
        }
        return;
      }

      // 2차: 더블확인 후 티켓 생성 → 일일 건수 카운팅
      const limits = feePreview.transactionLimits;
      const maxDaily = limits?.maxDailyTicketsPerCustomer ?? 0;
      const nextN = (limits?.dailyTicketCount ?? 0) + 1;
      const step1 =
        maxDaily > 0
          ? t('usdt.quoteDailyConfirmStep1', { n: nextN, max: maxDaily })
          : t('usdt.quoteDailyConfirmUnlimited');

      requestConfirm({
        title: t('usdt.quoteDailyConfirmTitle'),
        step1,
        step2: t('usdt.quoteDailyConfirmStep2'),
        confirmLabel: t('usdt.requestQuote'),
        onConfirm: async () => {
          setLoading(true);
          setError('');
          try {
            const ticket = await api.usdt.create(
              inputMode === 'target'
                ? {
                    targetUsdtAmount: usdtAmount,
                    walletId,
                    fiatCurrency,
                    paymentMethod: isRemittance ? 'REMITTANCE' : 'BANK_TRANSFER',
                    expressTier,
                  }
                : {
                    fiatAmount,
                    walletId,
                    fiatCurrency,
                    paymentMethod: isRemittance ? 'REMITTANCE' : 'BANK_TRANSFER',
                    expressTier,
                  },
            );
            router.push(`/dashboard/usdt/${ticket.id}`);
          } catch (err) {
            if (err instanceof ApiError && err.code === 'FIAT_TRANSFER_DISABLED') {
              setError(t('usdt.fiatTransferDisabled', { currency: fiatCurrency }));
            } else if (
              err instanceof ApiError &&
              (err.code === 'USDT_RISK_MIN' || err.code === 'USDT_RISK_MAX')
            ) {
              setError(formatUsdtRiskError(err, t) ?? err.message);
              setFeePreview(null);
            } else {
              setError(err instanceof Error ? err.message : t('usdt.submitFailed'));
            }
          } finally {
            setLoading(false);
          }
        },
      });
      return;
    }
    if (isCard && !cardMethodAvailable) {
      setError(t('usdt.fiatCardDisabled', { currency: fiatCurrency }));
      return;
    }
    if (!isCard && !bankMethodAvailable) {
      setError(t('usdt.fiatTransferDisabled', { currency: fiatCurrency }));
      return;
    }
    if (isCard && !cardPaymentEnabled) {
      setError(t('usdt.paymentCardDisabled'));
      return;
    }
    if (isCard && !cardOperational) {
      setError(t('usdt.paymentCardNotReady'));
      return;
    }
    if (isCard && !cardForm.waiverAccepted) {
      setError(t('usdt.cardWaiverRequired'));
      return;
    }
    if (!isCard) {
      if (sourceFiles.length === 0) {
        setError(t('usdt.funding.sourceRequired'));
        return;
      }
      if (!isCurfexCurrency && depositReceiptFiles.length === 0) {
        setError(t('usdt.funding.depositRequired'));
        return;
      }
    }
    if (!canApply) {
      setError(!tradeAllowed ? t('tradeAccess.requiredToTrade') : t('kyc.requiredToTrade'));
      return;
    }
    if (!canPreview) {
      setError(t('usdt.amountRequired'));
      return;
    }

    setLoading(true);
    try {
      if (!feePreview?.breakdown) {
        const preview = await api.usdt.fees(buildFeeParams());
        setFeePreview(preview);
        setLoading(false);
        return;
      }

      if (isCard) {
        const firstName = (cardContext?.legalFirstName || cardForm.firstName || '').trim();
        const lastName = (cardContext?.legalLastName || cardForm.lastName || '').trim();
        if (!firstName || !lastName) {
          setError(t('usdt.cardLegalNameMissing'));
          return;
        }
        if (
          !cardForm.email.trim() ||
          !cardForm.phone.trim() ||
          !cardForm.phoneCountryCode.trim() ||
          !isEnglishName(firstName) ||
          !isEnglishName(lastName)
        ) {
          setError(t('usdt.cardBuyerRequired'));
          setLoading(false);
          return;
        }
        const ticket = await api.usdt.create({
          walletId,
          fiatCurrency,
          paymentMethod: 'CARD',
          cardWaiverAccepted: true,
          targetUsdtAmount: inputMode === 'target' ? usdtAmount : undefined,
          cardChargeFiat: inputMode === 'cardCharge' ? cardChargeFiat : undefined,
          cardBrand:
            cardContext?.cardFeeMode === 'BY_BRAND' ? cardForm.cardBrand : undefined,
          card: {
            firstName,
            lastName,
            cardholderName: `${firstName} ${lastName}`,
            email: cardForm.email.trim(),
            phone: cardForm.phone.trim(),
            phoneCountryCode: cardForm.phoneCountryCode.trim(),
          },
        });
        const checkout = ticket.icopayCheckout as
          | { payUrl?: string; sandbox?: boolean; integrationMode?: string; orderNo?: string }
          | undefined;
        const payUrl = checkout?.payUrl;
        const sandbox =
          checkout?.sandbox === true ||
          String(checkout?.integrationMode || '').toUpperCase() === 'SANDBOX';
        // Sandbox: never open hosted payUrl (live EP). Ticket already completed via complete API.
        if (payUrl && !sandbox) {
          const { saveIcopayPendingReturn } = await import('@/lib/icopay-return');
          saveIcopayPendingReturn(
            ticket.id,
            checkout?.orderNo || ticket.ticketNo || '',
          );
          window.location.href = payUrl;
          return;
        }
        router.push(`/dashboard/usdt/${ticket.id}`);
        return;
      }
      const ticket = await api.usdt.create(
        inputMode === 'target'
          ? {
              targetUsdtAmount: usdtAmount,
              walletId,
              fiatCurrency,
              paymentMethod: isRemittance ? 'REMITTANCE' : 'BANK_TRANSFER',
              expressTier,
            }
          : {
              fiatAmount,
              walletId,
              fiatCurrency,
              paymentMethod: isRemittance ? 'REMITTANCE' : 'BANK_TRANSFER',
              expressTier,
            },
      );
      await api.usdt.uploadApplicationDocs(ticket.id, {
        sourceOfFunds: sourceFiles,
        depositReceipt: isCurfexCurrency ? [] : depositReceiptFiles,
      });
      router.push(`/dashboard/usdt/${ticket.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'FIAT_TRANSFER_DISABLED') {
        setError(t('usdt.fiatTransferDisabled', { currency: fiatCurrency }));
      } else if (err instanceof ApiError && err.code === 'FIAT_CARD_DISABLED') {
        setError(t('usdt.fiatCardDisabled', { currency: fiatCurrency }));
      } else if (err instanceof ApiError && (err.code === 'USDT_RISK_MIN' || err.code === 'USDT_RISK_MAX')) {
        setError(formatUsdtRiskError(err, t) ?? err.message);
        setFeePreview(null);
      } else {
        setError(err instanceof Error ? err.message : t('usdt.submitFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pg-stack">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 rounded border border-rose-300 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
          <span>{t('usdt.applySessionLabel')}</span>
          <span className="font-mono tabular-nums tracking-wide">{sessionLabel}</span>
        </span>
        <ReferenceClocks compact />
      </div>
      <p className="pg-hint">
        {isCard ? t('usdt.cardFlowHint') : t('usdt.manualFlowHint')}
      </p>
      {depositCtx?.individualCountryLimit && (
        <div className="pg-callout pg-callout-muted text-sm">
          {t('usdt.individualLimitHint', {
            country: depositCtx.individualCountryLimit.country,
            min: depositCtx.individualCountryLimit.minUsdt.toLocaleString(),
            max: depositCtx.individualCountryLimit.maxUsdt.toLocaleString(),
            homeMax: depositCtx.individualCountryLimit.maxFiat.toLocaleString(),
            homeCurrency: depositCtx.individualCountryLimit.homeCurrency,
          })}
        </div>
      )}
      {(() => {
        if (!depositCtx?.applicationLimits) return null;
        const methodKey = isCard
          ? 'CARD'
          : isRemittance
            ? 'REMITTANCE'
            : 'BANK_TRANSFER';
        const band =
          depositCtx.applicationLimits.byMethod?.[methodKey]?.[fiatCurrency] ??
          depositCtx.applicationLimits.byCurrency[fiatCurrency];
        if (!band || band.enabled === false) return null;
        /**
         * 리스크 활성 + 이체/송금 → 1회는 크립토 티어가 담당 → FIAT 1회 힌트 생략.
         * 카드·리스크 비활성 → 한도 설정 1회 표시.
         */
        const riskOn =
          depositCtx.applicationLimits.riskTierEnabled ??
          depositCtx.applicationLimits.enabled;
        const skipPerTx = Boolean(riskOn) && !isCard;
        const min = skipPerTx ? 0 : band.perTransactionMin;
        const max = skipPerTx ? 0 : band.perTransactionMax;
        if (min <= 0 && max <= 0) return null;
        const hint =
          min > 0 && max > 0
            ? t('usdt.hqLimitHint', {
                currency: fiatCurrency,
                min: min.toLocaleString(),
                max: max.toLocaleString(),
              })
            : max > 0
              ? t('usdt.hqLimitHintMaxOnly', {
                  currency: fiatCurrency,
                  max: max.toLocaleString(),
                })
              : t('usdt.hqLimitHintMinOnly', {
                  currency: fiatCurrency,
                  min: min.toLocaleString(),
                });
        return (
          <div className="pg-callout pg-callout-muted text-sm">
            {hint}
          </div>
        );
      })()}
      {dailyBlocked && (
        <div className="pg-callout pg-callout-error text-sm">
          {t('usdt.dailyLimitReached', {
            max: depositCtx?.maxDailyTicketsPerCustomer ?? 0,
          })}
        </div>
      )}
      {!tradeAllowed && (
        <div className="pg-callout pg-callout-warn text-sm">{t('tradeAccess.requiredToTrade')}</div>
      )}
      {tradeAllowed && !kycOk && (
        <div className="pg-callout pg-callout-warn text-sm">
          {t('kyc.requiredToTrade')}{' '}
          <a href="/dashboard/kyc" className="pg-link">{t('nav.kyc')}</a>
        </div>
      )}

      <ContentCard>
        <UsdtRatePanel compact />
      </ContentCard>

      <div className={`grid gap-6 lg:grid-cols-5 lg:items-start ${dailyBlocked ? 'pointer-events-none opacity-50' : ''}`}>
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
          <ContentCard>
            <div className="mb-5">
              <p className="pg-label">{t('usdt.paymentMethod')}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={!bankMethodAvailable}
                  onClick={() => {
                    if (!bankMethodAvailable) return;
                    setPaymentMethod('BANK_TRANSFER');
                    setInputMode('target');
                  }}
                  className={`pg-choice ${
                    !bankMethodAvailable
                      ? 'pg-choice-idle'
                      : paymentMethod === 'BANK_TRANSFER'
                        ? 'pg-choice-active'
                        : ''
                  }`}
                >
                  {t('usdt.paymentBank')}
                </button>
                <button
                  type="button"
                  disabled={!remittanceMethodAvailable}
                  onClick={() => {
                    if (!remittanceMethodAvailable) return;
                    setPaymentMethod('REMITTANCE');
                    setInputMode('target');
                  }}
                  className={`pg-choice ${
                    !remittanceMethodAvailable
                      ? 'pg-choice-idle'
                      : paymentMethod === 'REMITTANCE'
                        ? 'pg-choice-active'
                        : ''
                  }`}
                  title={
                    !remittanceMethodAvailable ? t('usdt.paymentRemittanceDisabledHint') : undefined
                  }
                >
                  {t('usdt.paymentRemittance')}
                </button>
                <button
                  type="button"
                  disabled={!cardMethodAvailable}
                  onClick={() => {
                    if (!cardMethodAvailable) return;
                    setPaymentMethod('CARD');
                    setInputMode('cardCharge');
                  }}
                  className={`pg-choice ${
                    !cardMethodAvailable
                      ? 'pg-choice-idle'
                      : paymentMethod === 'CARD'
                        ? 'pg-choice-active'
                        : ''
                  }`}
                  title={!cardMethodAvailable ? t('usdt.paymentCardDisabledHint') : undefined}
                >
                  {t('usdt.paymentCard')}
                </button>
              </div>
              {!bankMethodAvailable && !remittanceMethodAvailable && !cardMethodAvailable && (
                <p className="mt-1.5 text-[11px] text-amber-800">{t('usdt.paymentNoneAvailable')}</p>
              )}
              {isRemittance && (
                <p className="mt-1.5 text-[11px] text-sky-800">{t('usdt.paymentRemittanceHint')}</p>
              )}
              {!cardMethodAvailable && (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  {cardPaymentEnabled ? t('usdt.noEnabledFiatCard') : t('usdt.paymentCardDisabledHint')}
                </p>
              )}
              {!bankMethodAvailable && !isRemittance && (
                <p className="mt-1.5 text-[11px] text-gray-500">{t('usdt.noEnabledFiatTransfer')}</p>
              )}
              {!remittanceMethodAvailable && (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  {t('usdt.paymentRemittanceDisabledHint')}
                </p>
              )}
            </div>

            <div>
              <label className="pg-label">{t('usdt.fiatCurrency')}</label>
              <select
                value={methodFiats.includes(fiatCurrency) ? fiatCurrency : (methodFiats[0] ?? fiatCurrency)}
                onChange={(e) => setFiatCurrency(e.target.value as FiatCurrency)}
                className="pg-input mt-1 w-full"
                disabled={methodFiats.length === 0}
              >
                {methodFiats.map((c) => (
                  <option key={c} value={c}>{FIAT_LABELS[c]}</option>
                ))}
              </select>
              {isRemittance && (
                <p className="mt-1 pg-hint text-sky-800">{t('usdt.remittanceAmountHint')}</p>
              )}
              {rate && fiatRate > 0 && (
                <p className="mt-1 pg-hint">
                  {t('usdt.rateRefCurrency', {
                    rate: fiatRate.toLocaleString(),
                    currency: fiatCurrency,
                    asset: settlementAssetLabel,
                  })}
                  {rate.source ? ` (${rate.source})` : ''}
                </p>
              )}
              {isRemittance &&
                feePreview?.transactionLimits?.enabled &&
                feePreview.transactionLimits.effectiveMax != null && (
                  <p className="mt-1 pg-hint text-amber-800">
                    {t('usdt.remittanceMaxHint', {
                      max: feePreview.transactionLimits.effectiveMax.toLocaleString(),
                      currency: fiatCurrency,
                    })}
                  </p>
                )}
            </div>

            <div className="mt-5">
              <p className="pg-label">{t('usdt.inputModeTitle')}</p>
              <div className={`mt-2 grid gap-2 ${isCard ? 'grid-cols-2' : 'grid-cols-2'}`}>
                <button
                  type="button"
                  onClick={() => setInputMode('target')}
                  className={`pg-choice ${inputMode === 'target' ? 'pg-choice-active' : ''}`}
                >
                  <span className="block font-semibold">
                    {t('usdt.inputModeTarget', { asset: settlementAssetLabel })}
                  </span>
                  <span className="mt-0.5 block text-[10px] opacity-80 sm:text-xs">
                    {t(isCard ? 'usdt.targetUsdtDescCard' : 'usdt.targetUsdtDesc', {
                      asset: settlementAssetLabel,
                    })}
                  </span>
                </button>
                {isCard ? (
                  <button
                    type="button"
                    onClick={() => setInputMode('cardCharge')}
                    className={`pg-choice ${inputMode === 'cardCharge' ? 'pg-choice-active' : ''}`}
                  >
                    <span className="block font-semibold">{t('usdt.inputModeCardCharge')}</span>
                    <span className="mt-0.5 block text-[10px] opacity-80 sm:text-xs">
                      {t('usdt.cardChargeDesc', { asset: settlementAssetLabel })}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setInputMode('fiat')}
                    className={`pg-choice ${inputMode === 'fiat' ? 'pg-choice-active' : ''}`}
                  >
                    <span className="block font-semibold">{t('usdt.inputModeFiat')}</span>
                    <span className="mt-0.5 block text-[10px] opacity-80 sm:text-xs">
                      {t('usdt.fiatAmountDesc', { asset: settlementAssetLabel })}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {inputMode === 'target' ? (
              <div className="mt-5">
                {isCard && cardLimitBannerText && (
                  <div className="mb-2 rounded-md border border-rose-200/80 bg-gradient-to-r from-rose-50 to-amber-50 px-3 py-2 text-sm font-medium text-rose-800">
                    {cardLimitBannerText}
                  </div>
                )}
                <label className="pg-label">{t('usdt.targetUsdt')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetUsdt}
                  onChange={(e) => setTargetUsdt(e.target.value.replace(/[^\d.]/g, ''))}
                  className="pg-input mt-1 w-full"
                  placeholder="0.0000"
                  required
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
            ) : inputMode === 'cardCharge' ? (
              <div className="mt-5">
                {cardLimitBannerText && (
                  <div className="mb-2 rounded-md border border-rose-200/80 bg-gradient-to-r from-rose-50 to-amber-50 px-3 py-2 text-sm font-medium text-rose-800">
                    {cardLimitBannerText}
                  </div>
                )}
                <label className="pg-label">{t('usdt.cardChargeLabel', { currency: fiatCurrency })}</label>
                <FormattedAmountInput
                  min={1}
                  value={cardChargeFiat}
                  onChange={setCardChargeFiat}
                  className="pg-input mt-1 w-full"
                />
              </div>
            ) : (
              <div className="mt-5">
                <label className="pg-label">{t('usdt.fiatAmountLabel', { currency: fiatCurrency })}</label>
                <FormattedAmountInput
                  min={1}
                  value={fiatAmount}
                  onChange={setFiatAmount}
                  className="pg-input mt-1 w-full"
                />
              </div>
            )}

            <div className="mt-5">
              <label className="pg-label">{t('usdt.wallet')}</label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="pg-input mt-1 w-full"
                required={wallets.length > 0}
                disabled={wallets.length === 0}
              >
                {wallets.length === 0 && (
                  <option value="">{t('usdt.walletSelectEmpty')}</option>
                )}
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {displayWalletTitle(w, t)} — {w.address}
                  </option>
                ))}
                {pendingWallets.map((w) => (
                  <option key={`pending-${w.id}`} value="" disabled>
                    [{t('wallets.pending')}] {displayWalletTitle(w, t)} — {w.address}
                  </option>
                ))}
              </select>
              {wallets.length === 0 && (
                <div className="mt-1 space-y-1">
                  {pendingWallets.length > 0 ? (
                    <p className="text-sm text-amber-800">
                      {t('usdt.noWalletPending', {
                        asset: settlementAssetLabel,
                        count: String(pendingWallets.length),
                      })}
                    </p>
                  ) : otherAssetApprovedCount > 0 ? (
                    <p className="text-sm text-amber-800">
                      {t('usdt.noWalletWrongAsset', {
                        asset: settlementAssetLabel,
                        other:
                          settlementAssetLabel === 'USDC' ? 'USDT' : 'USDC',
                        count: String(otherAssetApprovedCount),
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">
                      {t('usdt.noWallet', { asset: settlementAssetLabel })}
                    </p>
                  )}
                  {settlementAssetLabel === 'USDC' && (
                    <p className="text-xs text-amber-700">{t('wallets.networkHintUsdc')}</p>
                  )}
                  <a href="/dashboard/wallets" className="inline-block text-xs font-medium text-sky-700 underline">
                    {t('account.manageWallets')}
                  </a>
                </div>
              )}
              {wallets.length > 0 && pendingWallets.length > 0 && (
                <p className="mt-1 text-xs text-amber-700">
                  {t('usdt.walletPendingHint', { count: String(pendingWallets.length) })}
                </p>
              )}
              <p className="pg-hint mt-1">{t('usdt.walletPickHint')}</p>
            </div>

            {isCard && cardPaymentEnabled && (
              <CardPaymentForm
                value={cardForm}
                onChange={setCardForm}
                feeMode={cardContext?.cardFeeMode === 'BY_BRAND' ? 'BY_BRAND' : 'UNIFORM'}
              />
            )}

            {useQuoteFlow && (
              <div className="mt-6 space-y-2 border-t border-slate-200 pt-5">
                <p className="pg-label">{t('usdt.applyQuote')}</p>
                <p className="pg-hint">{t('usdt.applyQuoteHint')}</p>
              </div>
            )}

            {!isCard && !useQuoteFlow && (
              <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
                <p className="pg-label">{t('usdt.funding.applyTitle')}</p>
                <p className="pg-hint">
                  {isCurfexCurrency
                    ? t('usdt.funding.applyHintCurfex')
                    : t('usdt.funding.applyHint')}
                </p>
                {fixedReceiving && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 space-y-2 text-xs">
                    <p className="font-semibold text-rose-950">
                      {t('usdt.companyAccount')}
                      {(depositPaymentRail(fiatCurrency) === 'ACH' ||
                        depositPaymentRail(fiatCurrency) === 'SEPA') && (
                        <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {depositPaymentRail(fiatCurrency)}
                        </span>
                      )}
                    </p>
                    <p className="text-rose-900/80">{t('usdt.funding.fixedAccountPreviewHint')}</p>
                    <dl className="grid gap-1 sm:grid-cols-[6.5rem_1fr]">
                      {depositPaymentRail(fiatCurrency) === 'ACH' ||
                      depositPaymentRail(fiatCurrency) === 'SEPA' ? (
                        <>
                          <dt className="text-rose-700/70">{t('usdt.deposit.bankAccountCurrency')}</dt>
                          <dd className="font-mono font-semibold">{fiatCurrency}</dd>
                          {depositPaymentRail(fiatCurrency) === 'ACH' &&
                          fixedReceiving.routingNumber ? (
                            <>
                              <dt className="text-rose-700/70">{t('usdt.deposit.routingNumber')}</dt>
                              <CopyableMono
                                value={fixedReceiving.routingNumber}
                                copyLabel={t('usdt.deposit.copyRoutingNumber')}
                                copiedLabel={t('common.copied')}
                                strong
                              />
                            </>
                          ) : null}
                          <dt className="text-rose-700/70">
                            {depositPaymentRail(fiatCurrency) === 'SEPA'
                              ? t('usdt.deposit.iban')
                              : t('usdt.deposit.accountNumber')}
                          </dt>
                          <CopyableMono
                            value={fixedReceiving.accountNumber}
                            copyLabel={
                              depositPaymentRail(fiatCurrency) === 'SEPA'
                                ? t('usdt.deposit.copyIban')
                                : t('usdt.deposit.copyAccountNumber')
                            }
                            copiedLabel={t('common.copied')}
                            strong
                          />
                          {depositPaymentRail(fiatCurrency) === 'SEPA' && fixedReceiving.bic ? (
                            <>
                              <dt className="text-rose-700/70">{t('usdt.deposit.bic')}</dt>
                              <CopyableMono
                                value={fixedReceiving.bic}
                                copyLabel={t('usdt.deposit.copyBic')}
                                copiedLabel={t('common.copied')}
                                strong
                              />
                            </>
                          ) : null}
                          <dt className="text-rose-700/70">{t('usdt.deposit.accountHolder')}</dt>
                          <CopyableMono
                            value={fixedReceiving.accountHolder}
                            copyLabel={t('usdt.deposit.copyHolder')}
                            copiedLabel={t('common.copied')}
                            strong
                          />
                          {fixedReceiving.accountType ? (
                            <>
                              <dt className="text-rose-700/70">{t('usdt.deposit.accountType')}</dt>
                              <dd>{fixedReceiving.accountType}</dd>
                            </>
                          ) : null}
                          {fixedReceiving.bankCountry ? (
                            <>
                              <dt className="text-rose-700/70">{t('usdt.deposit.bankCountry')}</dt>
                              <dd className="font-mono">{fixedReceiving.bankCountry}</dd>
                            </>
                          ) : null}
                          <dt className="text-rose-700/70">{t('usdt.deposit.bankName')}</dt>
                          <CopyableMono
                            value={fixedReceiving.bankName}
                            copyLabel={t('common.copy')}
                            copiedLabel={t('common.copied')}
                          />
                        </>
                      ) : (
                        <>
                          <dt className="text-rose-700/70">{t('usdt.deposit.bankName')}</dt>
                          <CopyableMono
                            value={fixedReceiving.bankName}
                            copyLabel={t('common.copy')}
                            copiedLabel={t('common.copied')}
                          />
                          <dt className="text-rose-700/70">{t('usdt.deposit.accountNumber')}</dt>
                          <CopyableMono
                            value={fixedReceiving.accountNumber}
                            copyLabel={t('usdt.deposit.copyAccountNumber')}
                            copiedLabel={t('common.copied')}
                            strong
                          />
                          <dt className="text-rose-700/70">{t('usdt.deposit.accountHolder')}</dt>
                          <CopyableMono
                            value={fixedReceiving.accountHolder}
                            copyLabel={t('usdt.deposit.copyHolder')}
                            copiedLabel={t('common.copied')}
                            strong
                          />
                        </>
                      )}
                    </dl>
                  </div>
                )}
                {!isCurfexCurrency && !fixedReceiving && (
                  <p className="text-xs text-amber-800">{t('usdt.funding.fixedAccountMissing')}</p>
                )}
                <div>
                  <label className="pg-label">{t('usdt.funding.sourceFiles')}</label>
                  <div className="mt-1">
                    <LocalizedFileInput
                      accept=".xlsx,.xls,.pdf,image/*"
                      multiple
                      files={sourceFiles}
                      onFiles={setSourceFiles}
                    />
                  </div>
                </div>
                {!isCurfexCurrency && (
                  <div>
                    <label className="pg-label">
                      {t('usdt.funding.depositReceipt')}
                      <span className="ml-1 text-rose-600">*</span>
                    </label>
                    <p className="mt-0.5 pg-hint">{t('usdt.funding.depositReceiptHint')}</p>
                    <div className="mt-1">
                      <LocalizedFileInput
                        accept=".pdf,image/*"
                        multiple
                        files={depositReceiptFiles}
                        onFiles={setDepositReceiptFiles}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {!canApply && (
              <p className="mt-4 text-sm text-amber-800">
                {!tradeAllowed ? t('tradeAccess.requiredToTrade') : t('kyc.requiredToTrade')}
              </p>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            {expressEnabled && (
              <div className="mt-5 rounded-lg border border-violet-200 bg-violet-50/80 p-4 space-y-2">
                <p className="text-sm font-semibold text-violet-900">{t('express.apply.title')}</p>
                <p className="text-[11px] text-violet-800/80">{t('express.apply.hint')}</p>
                <select
                  className="pg-input w-full text-sm border-violet-200 bg-white"
                  value={expressTier}
                  onChange={(e) => {
                    setExpressTier(e.target.value);
                    setFeePreview(null);
                  }}
                >
                  {expressOptions.map((opt) => {
                    const pct = opt.feePercent ?? 0;
                    const asset = depositCtx?.settlementAsset === 'USDC' ? 'USDC' : 'USDT';
                    const parts = [
                      opt.tier,
                      t(`express.sla.${opt.tier}` as 'express.sla.BASIC'),
                    ];
                    if (opt.feeUsdt > 0) parts.push(`${opt.feeUsdt} ${asset}`);
                    if (pct > 0) parts.push(`${pct}%`);
                    if (opt.feeUsdt <= 0 && pct <= 0) parts.push(`0 ${asset}`);
                    return (
                      <option key={opt.tier} value={opt.tier}>
                        {parts.join(' · ')}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={
                dailyBlocked || loading || wallets.length === 0 || !canPreview || !canApply
              }
              className={`pg-btn mt-5 w-full disabled:opacity-50 ${
                useQuoteFlow && !breakdown ? 'pg-btn-info' : 'pg-btn-primary'
              }`}
            >
              {loading
                ? t('usdt.processing')
                : useQuoteFlow
                  ? breakdown
                    ? t('usdt.requestQuote')
                    : t('usdt.applyQuote')
                  : breakdown
                    ? isCard
                      ? t('usdt.submitCard')
                      : t('usdt.submitConfirm')
                    : t('usdt.submitCheck')}
            </button>
          </ContentCard>
        </form>

        <div className="space-y-4 lg:col-span-3">
          {breakdown ? (
            <UsdtFeeBreakdownPanel
              breakdown={breakdown}
              currency={fiatCurrency}
              exchangeRate={fiatRate}
              source={rate?.source}
              fees={feePreview?.fees}
              display={feePreview?.feeDiagramDisplay}
              isCardPayment={isCard}
              settlementAsset={depositCtx?.settlementAsset === 'USDC' ? 'USDC' : 'USDT'}
              cardFeeFiat={feePreview?.cardFeeFiat}
              cardChargeFiat={feePreview?.cardChargeFiat}
              cardFeePercent={feePreview?.cardFeePercent}
              amountRangePct={undefined}
              showExactWithRange={false}
            />
          ) : (
            <div className="pg-card border-dashed">
              <div className="pg-card-body py-12 text-center pg-hint">
                {useQuoteFlow ? t('usdt.previewHintApply') : t('usdt.previewHintSubmit')}
              </div>
            </div>
          )}

          {feePreview?.transactionLimits?.enabled && (
            <div className="pg-card">
              <div className="pg-card-body pg-callout pg-callout-warn">
                <p className="font-semibold">{t('usdt.limits.title')}</p>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  {feePreview.transactionLimits.effectiveMin > 0 && (
                    <div>
                      <dt>{t('usdt.limits.min')}</dt>
                      <dd className="font-mono tabular-nums">
                        {feePreview.transactionLimits.effectiveMin.toLocaleString()} {fiatCurrency}
                      </dd>
                    </div>
                  )}
                  {feePreview.transactionLimits.effectiveMax != null && (
                    <div>
                      <dt>{t('usdt.limits.max')}</dt>
                      <dd className="font-mono tabular-nums">
                        {feePreview.transactionLimits.effectiveMax.toLocaleString()} {fiatCurrency}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
      {doubleConfirmDialog}
    </div>
  );
}

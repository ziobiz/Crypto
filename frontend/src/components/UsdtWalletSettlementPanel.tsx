'use client';

import { useMemo, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';

/** 네트워크별 파스텔 배지 색 */
const NETWORK_BADGE: Record<string, { bg: string; border: string; text: string }> = {
  TRC20: { bg: '#ffe4e6', border: '#fda4af', text: '#9f1239' },
  ERC20: { bg: '#e0e7ff', border: '#a5b4fc', text: '#3730a3' },
  BEP20: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  POLYGON: { bg: '#f3e8ff', border: '#d8b4fe', text: '#6b21a8' },
  ARBITRUM: { bg: '#cffafe', border: '#67e8f9', text: '#155e75' },
  SOL: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
  OPTIMISM: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  AVAX: { bg: '#ffe4e6', border: '#fb7185', text: '#9f1239' },
};

function networkStyle(network: string) {
  return NETWORK_BADGE[network.toUpperCase()] ?? {
    bg: '#f1f5f9',
    border: '#cbd5e1',
    text: '#475569',
  };
}

function networkLabelKey(network: string): MessageKey | null {
  const key = `network.${network.toUpperCase()}` as MessageKey;
  return key;
}

/** 주소만 QR에 넣음 — 네트워크 표기·공백·괄호 절대 포함하지 않음 */
export function walletAddressForQr(address: string): string {
  return address.trim();
}

export function walletQrImageUrl(address: string, size = 160): string | null {
  const raw = walletAddressForQr(address);
  if (!raw) return null;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(raw)}`;
}

type Props = {
  address: string;
  network: string;
  /** QR 크기(px) */
  qrSize?: number;
};

/**
 * USDT 정산용 수령 지갑: QR(주소만) · 주소+복사 · 네트워크 배지
 */
export function UsdtWalletSettlementPanel({ address, network, qrSize = 148 }: Props) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const cleanAddress = useMemo(() => walletAddressForQr(address), [address]);
  const qrUrl = useMemo(() => walletQrImageUrl(cleanAddress, qrSize), [cleanAddress, qrSize]);
  const badge = networkStyle(network);
  const netKey = networkLabelKey(network);
  const netLabel = netKey ? t(netKey) : network;

  async function copyAddress() {
    if (!cleanAddress) return;
    try {
      await navigator.clipboard.writeText(cleanAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  if (!cleanAddress) return <span>—</span>;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
      {qrUrl && (
        <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <img
            src={qrUrl}
            alt={t('usdt.walletQr')}
            width={qrSize}
            height={qrSize}
            className="block rounded"
          />
          <p className="mt-1 text-center text-[10px] text-slate-400">{t('usdt.walletQr')}</p>
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-2.5">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-slate-500">{t('usdt.walletAddress')}</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="break-all font-mono text-xs font-medium text-slate-800">{cleanAddress}</span>
            <button
              type="button"
              onClick={() => void copyAddress()}
              title={copied ? t('common.copied') : t('wallets.copyAddress')}
              aria-label={copied ? t('common.copied') : t('wallets.copyAddress')}
              className="pg-copy-icon-btn"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect
                    x="9"
                    y="9"
                    width="11"
                    height="11"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M5 15V5a2 2 0 0 1 2-2h10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <span className="text-[10px] font-bold tracking-wide">
                {copied ? t('common.copied') : 'COPY'}
              </span>
            </button>
          </div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold text-slate-500">{t('usdt.walletNetwork')}</div>
          <span
            className="inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold"
            style={{
              backgroundColor: badge.bg,
              borderColor: badge.border,
              color: badge.text,
            }}
          >
            {netLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

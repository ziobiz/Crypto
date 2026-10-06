'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useT } from '@/context/LocaleProvider';
import { DualTimezoneDate } from '@/components/DualTimezoneDate';
import { DetailRow } from '@/components/DetailKvTable';
import {
  walletAddressForQr,
  walletQrImageUrl,
} from '@/components/UsdtWalletSettlementPanel';
import type { ServiceCountryKey } from '@/lib/reference-time';

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
  return (
    NETWORK_BADGE[network.toUpperCase()] ?? {
      bg: '#f1f5f9',
      border: '#cbd5e1',
      text: '#475569',
    }
  );
}

/** 고객관리·인증 화면용 지갑 카드 (닉네임 + QR + 주소 COPY + 네트워크) */
export function CustomerWalletQrCard({
  address,
  network,
  nickname,
  meta,
  qrSize = 112,
}: {
  address: string;
  network: string;
  /** 지갑 닉네임 (예: MEXC ERC) */
  nickname?: string | null;
  meta?: string;
  qrSize?: number;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const clean = useMemo(() => walletAddressForQr(address), [address]);
  const qrUrl = useMemo(() => walletQrImageUrl(clean, qrSize), [clean, qrSize]);
  const badge = networkStyle(network);
  const nick = String(nickname || '').trim();

  async function copy() {
    if (!clean) return;
    try {
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  if (!clean) return null;

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-md border border-slate-100 bg-slate-50/60 p-2.5">
      {qrUrl && (
        <div className="shrink-0 rounded border border-slate-200 bg-white p-1">
          <img src={qrUrl} alt={t('usdt.walletQr')} width={qrSize} height={qrSize} className="block" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1.5">
        {nick ? (
          <p className="text-sm font-semibold text-slate-900">
            {nick}
            <span className="ml-1.5 text-[11px] font-medium text-slate-500">· {network}</span>
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="break-all font-mono text-xs font-medium">{clean}</span>
          <button type="button" className="pg-copy-icon-btn" onClick={() => void copy()}>
            <span className="text-[10px] font-bold">{copied ? t('common.copied') : 'COPY'}</span>
          </button>
        </div>
        <span
          className="inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: badge.bg, borderColor: badge.border, color: badge.text }}
        >
          {network}
        </span>
        {meta ? <p className="pg-muted text-[11px]">{meta}</p> : null}
      </div>
    </div>
  );
}

export type ScheduleDelayRow = {
  id: string;
  delayHours: number;
  reason: string;
  createdAt: string;
  createdBy?: { id: string; name: string; email: string };
};

export const SCHEDULE_DELAY_OPTIONS = [12, 24, 36, 48, 60, 72, 84, 96] as const;

type ScheduleDelayPanelProps = {
  canEdit: boolean;
  finished: boolean;
  /** 본사 화면: +Nh 배지·등록자 표시 / 가맹점: 일자·사유만 */
  showHqMeta?: boolean;
  /** SLA 초기 예상완료일 (지연 미포함) */
  expectedCompleteBaseAt?: string | null;
  /** 지연 반영 예상일 (base + 누적 지연) */
  expectedDelayedAt?: string | null;
  completedAt?: string | null;
  delays: ScheduleDelayRow[];
  delayHoursTotal?: number;
  baseTimezone: string;
  serviceTimezone: string;
  country: ServiceCountryKey;
  onSubmit: (input: { delayHours: number; reason: string }) => Promise<void>;
  /** DetailRow 앞/뒤에 끼울 추가 행 (고객·신청일 등) */
  leadingRows?: ReactNode;
  trailingRows?: ReactNode;
};

function DateValue({
  value,
  baseTimezone,
  serviceTimezone,
  country,
  badge,
}: {
  value: string;
  baseTimezone: string;
  serviceTimezone: string;
  country: ServiceCountryKey;
  badge?: string;
}) {
  return (
    <div className="space-y-1">
      {badge ? (
        <span className="inline-block rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
          {badge}
        </span>
      ) : null}
      <DualTimezoneDate
        value={value}
        baseTimezone={baseTimezone}
        serviceTimezone={serviceTimezone}
        country={country}
      />
    </div>
  );
}

/**
 * 일정·고객: 제목 | 내용 행 구조 (내용 왼쪽 정렬 — 신청일과 동일)
 * 고객 · 신청일 · 예상완료일(초기) · 예상지연일 · 완료일
 */
export function ScheduleDelayPanel({
  canEdit,
  finished,
  showHqMeta = false,
  expectedCompleteBaseAt,
  expectedDelayedAt,
  completedAt,
  delays,
  delayHoursTotal = 0,
  baseTimezone,
  serviceTimezone,
  country,
  onSubmit,
  leadingRows,
  trailingRows,
}: ScheduleDelayPanelProps) {
  const t = useT();
  const [hours, setHours] = useState<number>(24);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const hasDelay = delayHoursTotal > 0 && !!expectedDelayedAt;

  async function submit() {
    setSaving(true);
    setErr('');
    try {
      await onSubmit({ delayHours: hours, reason: reason.trim() });
      setReason('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {leadingRows}

      {expectedCompleteBaseAt && (
        <DetailRow
          label={t('usdt.col.expectedComplete')}
          value={
            <DateValue
              value={expectedCompleteBaseAt}
              baseTimezone={baseTimezone}
              serviceTimezone={serviceTimezone}
              country={country}
            />
          }
        />
      )}

      {hasDelay && (
        <DetailRow
          label={t('schedule.expectedDelayed')}
          value={
            <div className="space-y-1.5">
              <DateValue
                value={expectedDelayedAt!}
                baseTimezone={baseTimezone}
                serviceTimezone={serviceTimezone}
                country={country}
              />
              {delays.length > 0 && (
                <ul className="space-y-1">
                  {delays.map((d) => (
                    <li key={d.id} className="text-[11px] text-amber-900/90">
                      {showHqMeta ? (
                        <>
                          +{d.delayHours}h · {d.reason}
                          {d.createdBy?.name ? ` (${d.createdBy.name})` : ''}
                        </>
                      ) : (
                        d.reason
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          }
        />
      )}

      {completedAt && (
        <DetailRow
          label={t('schedule.completedAt')}
          value={
            <DateValue
              value={completedAt}
              baseTimezone={baseTimezone}
              serviceTimezone={serviceTimezone}
              country={country}
            />
          }
        />
      )}

      {trailingRows}

      {canEdit && !finished && (
        <div className="col-span-full border-t border-slate-100 pt-3 mt-1 space-y-2">
          <div className="text-[12px] font-semibold text-slate-800">{t('schedule.delayTitle')}</div>
          <p className="pg-hint text-[11px]">{t('schedule.delayHint')}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="pg-field-label">{t('schedule.delayHours')}</span>
              <select
                className="pg-input mt-1"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              >
                {SCHEDULE_DELAY_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {t('schedule.delayHoursOption', { h: String(h) })}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="pg-field-label">{t('schedule.delayReason')}</span>
              <input
                className="pg-input mt-1"
                value={reason}
                maxLength={500}
                placeholder={t('schedule.delayReasonPh')}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          </div>
          {err && <p className="pg-error text-[11px]">{err}</p>}
          <button
            type="button"
            className="pg-btn pg-btn-secondary text-[12px]"
            disabled={saving || !reason.trim()}
            onClick={() => void submit()}
          >
            {saving ? t('common.saving') : t('schedule.delaySubmit')}
          </button>
        </div>
      )}
    </>
  );
}

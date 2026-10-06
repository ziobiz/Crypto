import type { MessageKey } from '@/i18n/messages';
import type { Locale } from '@/i18n/locales';

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

const APPLY_NOTES: Record<string, MessageKey> = {
  USDT_APPLY_QUOTE: 'usdt.history.applyQuote',
  USDT_APPLY_QUOTE_REMIT: 'usdt.history.applyQuoteRemit',
  USDT_APPLY: 'usdt.history.apply',
  USDT_APPLY_REMIT: 'usdt.history.applyRemit',
};

const LOCALE_TO_BCP47: Record<Locale, string> = {
  KR: 'ko-KR',
  US: 'en-US',
  JP: 'ja-JP',
  CH: 'zh-CN',
  TH: 'th-TH',
};

function formatDeadlineIso(iso: string, locale?: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const tag = locale ? LOCALE_TO_BCP47[locale] : undefined;
  try {
    return d.toLocaleString(tag, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function pipeParts(note: string): string[] {
  return note.split('|');
}

/** 상태 이력 코드·구 한국어 메모를 화면 언어로 표시합니다. */
export function formatUsdtHistoryNote(
  note: string | null | undefined,
  t: Translate,
  locale?: Locale,
): string {
  if (!note) return '';
  const raw = note.trim();
  if (!raw) return '';

  if (raw.startsWith('USDT_DEPOSIT_PROOF|')) {
    const deadline = formatDeadlineIso(raw.slice('USDT_DEPOSIT_PROOF|'.length), locale);
    return t('usdt.history.depositProof', { deadline });
  }

  const parts = pipeParts(raw);
  const code = parts[0] || '';

  if (code === 'USDT_QUOTE_CONFIRM' && parts.length >= 3) {
    return t('usdt.history.quoteConfirm', { fiat: parts[1]!, usdt: parts[2]! });
  }
  if (code === 'USDT_QUOTE_CONFIRM_CURFEX' && parts.length >= 3) {
    return t('usdt.history.quoteConfirmCurfex', { fiat: parts[1]!, usdt: parts[2]! });
  }
  if (code === 'USDT_QUOTE_AUTO') return t('usdt.history.quoteAuto');
  if (code === 'USDT_QUOTE_AUTO_CURFEX') return t('usdt.history.quoteAutoCurfex');
  if (code === 'USDT_QUOTE_EXPIRED') return t('usdt.history.quoteExpired');
  if (code === 'USDT_DEPOSIT_EXPIRED') return t('usdt.history.depositExpired');
  if (code === 'USDT_ADMIN_CANCEL') return t('usdt.history.adminCancel');
  if (raw.startsWith('QUOTE_VALIDITY_EXPIRED')) return t('usdt.history.quoteExpired');
  if (code === 'USDT_CARD_PENDING' && parts[1]) {
    return t('usdt.history.cardPending', { currency: parts[1] });
  }
  if (code === 'USDT_ICOPAY_WEBHOOK_PAID') {
    return t('usdt.history.icopayWebhookPaid', { ref: parts[1] || '' });
  }
  if (code === 'USDT_ICOPAY_WEBHOOK_FAIL') {
    return t('usdt.history.icopayWebhookFail', { ref: parts[1] || '' });
  }
  if (code === 'USDT_ICOPAY_WEBHOOK_CANCEL') {
    return t('usdt.history.icopayWebhookCancel', { ref: parts[1] || '' });
  }
  if (code === 'USDT_ICOPAY_STATUS_PAID') {
    return t('usdt.history.icopayStatusPaid', { ref: parts[1] || '' });
  }
  if (code === 'USDT_ICOPAY_STATUS_FAIL') {
    return t('usdt.history.icopayStatusFail', { ref: parts[1] || '' });
  }
  if (code === 'USDT_ICOPAY_STATUS_CANCEL') {
    return t('usdt.history.icopayStatusCancel', { ref: parts[1] || '' });
  }
  if (code === 'USDT_WALLET_CHANGE' && parts.length >= 3) {
    return t('usdt.history.walletChange', { from: parts[1]!, to: parts[2]! });
  }
  if (code === 'USDT_CURFEX_APPROVE_FAIL') {
    return t('usdt.history.curfexApproveFail', { detail: parts.slice(1).join('|') });
  }

  const applyKey = APPLY_NOTES[code];
  if (applyKey) {
    const tier = parts[1];
    return t(applyKey, { express: tier ? ` · EXPRESS ${tier}` : '' });
  }

  // —— legacy Korean notes already stored in DB ——
  let m = raw.match(
    /^견적 확정\s*·\s*CURFEX 계좌 발급\s*\(입금\s*([^/]+)\s*\/\s*([^)]+?)\s*USDT\)\s*$/,
  );
  if (m) return t('usdt.history.quoteConfirmCurfex', { fiat: m[1]!.trim(), usdt: m[2]!.trim() });

  m = raw.match(/^견적 확정\s*\(입금\s*([^/]+)\s*\/\s*([^)]+?)\s*USDT\)\s*$/);
  if (m) return t('usdt.history.quoteConfirm', { fiat: m[1]!.trim(), usdt: m[2]!.trim() });

  if (raw === '견적 자동 확정 · CURFEX 계좌 발급') return t('usdt.history.quoteAutoCurfex');
  if (raw === '견적 자동 확정') return t('usdt.history.quoteAuto');
  if (raw === '견적 유효시간 초과 — 자동 종료(일일 1회 소진)') return t('usdt.history.quoteExpired');
  if (raw === '입금 기한(2시간) 초과 — 자동 취소') return t('usdt.history.depositExpired');
  if (raw === '관리자 취소' || raw === '관리자 수동 취소') return t('usdt.history.adminCancel');

  m = raw.match(/^입금 증빙 대기\s*\(기한:\s*(.+)\)\s*$/);
  if (m) {
    return t('usdt.history.depositProof', {
      deadline: formatDeadlineIso(m[1]!.trim(), locale),
    });
  }

  m = raw.match(/^수령 지갑 변경:\s*(.+?)\s*→\s*(.+)\s*$/);
  if (m) return t('usdt.history.walletChange', { from: m[1]!.trim(), to: m[2]!.trim() });

  m = raw.match(/^카드 결제 처리 중\s*\((.+)\)\s*$/);
  if (m) return t('usdt.history.cardPending', { currency: m[1]!.trim() });

  m = raw.match(/^ICOPAY webhook 승인\s*\((.+)\)\s*$/);
  if (m) return t('usdt.history.icopayWebhookPaid', { ref: m[1]!.trim() });

  m = raw.match(/^ICOPAY webhook 거래 실패\s*\((.+)\)\s*$/);
  if (m) return t('usdt.history.icopayWebhookFail', { ref: m[1]!.trim() });

  m = raw.match(/^ICOPAY webhook 거래 취소\s*\((.+)\)\s*$/);
  if (m) return t('usdt.history.icopayWebhookCancel', { ref: m[1]!.trim() });

  m = raw.match(/^ICOPAY status 승인\s*\((.+)\)\s*$/);
  if (m) return t('usdt.history.icopayStatusPaid', { ref: m[1]!.trim() });

  m = raw.match(/^ICOPAY status 거래 실패\s*\((.+)\)\s*$/);
  if (m) return t('usdt.history.icopayStatusFail', { ref: m[1]!.trim() });

  m = raw.match(/^ICOPAY status 거래 취소\s*\((.+)\)\s*$/);
  if (m) return t('usdt.history.icopayStatusCancel', { ref: m[1]!.trim() });

  m = raw.match(/^CURFEX decision APPROVE 실패\s*—\s*운영 확인 필요:\s*(.*)$/);
  if (m) return t('usdt.history.curfexApproveFail', { detail: m[1]!.trim() });

  return raw;
}

/** 에스크로 상태 이력 코드·구 한국어 메모 */
export function formatEscrowHistoryNote(
  note: string | null | undefined,
  t: Translate,
): string {
  if (!note) return '';
  const raw = note.trim();
  if (!raw) return '';

  const map: Record<string, MessageKey> = {
    ESCROW_BOTH_ACCEPTED: 'escrow.history.bothAccepted',
    ESCROW_APPLIED: 'escrow.history.applied',
    ESCROW_BUYER_DEPOSIT_START: 'escrow.history.buyerDepositStart',
    ESCROW_SELLER_SHIP: 'escrow.history.sellerShip',
    ESCROW_ACCEPT_EXPIRED: 'escrow.history.acceptExpired',
    ESCROW_BATCH_USDT: 'escrow.history.batchUsdt',
    ESCROW_BUYER_ACCEPT: 'escrow.history.buyerAccept',
    ESCROW_SELLER_ACCEPT: 'escrow.history.sellerAccept',
    ESCROW_DECLINED: 'escrow.history.declined',
    ESCROW_BUYER_APPROVED_SAME_DAY: 'escrow.history.buyerApprovedSameDay',
    ESCROW_BUYER_APPROVED_NEXT_DAY: 'escrow.history.buyerApprovedNextDay',
  };
  const parts = raw.split('|');
  const code = parts[0] || '';
  if (code === 'ESCROW_DECLINED' && parts[1]) {
    return t('escrow.history.declinedWithReason', { reason: parts.slice(1).join('|') });
  }
  if (map[code]) return t(map[code]!);
  if (map[raw]) return t(map[raw]!);

  if (raw === '양측 수락 완료 — 에스크로 활성화·입금 대기') return t('escrow.history.bothAccepted');
  if (raw === '에스크로 신청 — 상대방 수락 대기') return t('escrow.history.applied');
  if (raw === '구매자 입금 단계 시작') return t('escrow.history.buyerDepositStart');
  if (raw === '판매자 배송 시작') return t('escrow.history.sellerShip');
  if (raw === '수락 기한 경과 자동 파기') return t('escrow.history.acceptExpired');
  if (raw === '일괄 USDT 송금 처리') return t('escrow.history.batchUsdt');
  if (raw === '구매자 수락·면책 동의') return t('escrow.history.buyerAccept');
  if (raw === '판매자 수락·면책 동의') return t('escrow.history.sellerAccept');
  if (raw === '거래 거절') return t('escrow.history.declined');
  if (raw === '구매자 승인 — 당일 USDT 송금 예약') return t('escrow.history.buyerApprovedSameDay');
  if (raw === '구매자 승인 — 익일 13시 일괄 송금 예약') return t('escrow.history.buyerApprovedNextDay');

  return raw;
}

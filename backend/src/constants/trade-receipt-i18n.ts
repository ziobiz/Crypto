export type TradeReceiptLang = 'ko' | 'ja' | 'en';

export const DEFAULT_TRADE_RECEIPT_LANGS: TradeReceiptLang[] = ['ko', 'ja', 'en'];

type ReceiptStrings = {
  subject: string;
  greeting: string;
  ticketNo: string;
  status: string;
  statusCompleted: string;
  fiatAmount: string;
  expectedUsdt: string;
  actualUsdt: string;
  txid: string;
  footer: string;
  sectionTitle: string;
};

const STRINGS: Record<TradeReceiptLang, ReceiptStrings> = {
  ko: {
    subject: '거래명세',
    greeting: '님, 거래가 완료되었습니다.',
    ticketNo: '티켓번호',
    status: '상태',
    statusCompleted: '완료',
    fiatAmount: '신청금액',
    expectedUsdt: '예상 USDT',
    actualUsdt: '실제 송금 USDT',
    txid: 'TXID',
    footer: '본 메일은 거래 처리 결과 안내입니다.',
    sectionTitle: '한국어',
  },
  ja: {
    subject: '取引明細',
    greeting: '様、取引が完了しました。',
    ticketNo: 'チケット番号',
    status: '状態',
    statusCompleted: '完了',
    fiatAmount: '申請金額',
    expectedUsdt: '予想 USDT',
    actualUsdt: '実際送金 USDT',
    txid: 'TXID',
    footer: '本メールは取引処理結果のご案内です。',
    sectionTitle: '日本語',
  },
  en: {
    subject: 'Trade Receipt',
    greeting: ', your trade has been completed.',
    ticketNo: 'Ticket No.',
    status: 'Status',
    statusCompleted: 'Completed',
    fiatAmount: 'Order Amount',
    expectedUsdt: 'Expected USDT',
    actualUsdt: 'Actual USDT Sent',
    txid: 'TXID',
    footer: 'This email is a notification of your completed trade.',
    sectionTitle: 'English',
  },
};

export type TradeReceiptContent = {
  userName: string;
  ticketNo: string;
  fiatAmount: number;
  fiatCurrency: string;
  expectedUsdt: number;
  actualUsdt?: number | null;
  usdtTxId?: string | null;
};

function buildSection(lang: TradeReceiptLang, data: TradeReceiptContent): { text: string; html: string } {
  const s = STRINGS[lang];
  const lines = [
    `--- ${s.sectionTitle} ---`,
    `${data.userName}${s.greeting}`,
    '',
    `${s.ticketNo}: ${data.ticketNo}`,
    `${s.status}: ${s.statusCompleted}`,
    `${s.fiatAmount}: ${data.fiatAmount.toLocaleString()} ${data.fiatCurrency}`,
    `${s.expectedUsdt}: ${data.expectedUsdt}`,
  ];
  if (data.actualUsdt != null) {
    lines.push(`${s.actualUsdt}: ${data.actualUsdt}`);
  }
  if (data.usdtTxId) {
    lines.push(`${s.txid}: ${data.usdtTxId}`);
  }
  lines.push('', s.footer);

  const html = `<div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e5e7eb">
<h3 style="margin:0 0 12px;font-size:14px;color:#374151">${s.sectionTitle}</h3>
<p>${data.userName}${s.greeting}</p>
<table style="border-collapse:collapse;font-size:14px;line-height:1.8">
<tr><td style="padding-right:12px;color:#6b7280">${s.ticketNo}</td><td><strong>${data.ticketNo}</strong></td></tr>
<tr><td style="padding-right:12px;color:#6b7280">${s.status}</td><td>${s.statusCompleted}</td></tr>
<tr><td style="padding-right:12px;color:#6b7280">${s.fiatAmount}</td><td>${data.fiatAmount.toLocaleString()} ${data.fiatCurrency}</td></tr>
<tr><td style="padding-right:12px;color:#6b7280">${s.expectedUsdt}</td><td>${data.expectedUsdt}</td></tr>
${data.actualUsdt != null ? `<tr><td style="padding-right:12px;color:#6b7280">${s.actualUsdt}</td><td>${data.actualUsdt}</td></tr>` : ''}
${data.usdtTxId ? `<tr><td style="padding-right:12px;color:#6b7280">${s.txid}</td><td style="word-break:break-all">${data.usdtTxId}</td></tr>` : ''}
</table>
<p style="margin-top:12px;font-size:12px;color:#9ca3af">${s.footer}</p>
</div>`;

  return { text: lines.join('\n'), html };
}

export function buildMultilingualTradeReceipt(
  data: TradeReceiptContent,
  langs: TradeReceiptLang[] = DEFAULT_TRADE_RECEIPT_LANGS,
): { subject: string; text: string; html: string } {
  const ko = STRINGS.ko;
  const subject = `[Crypto Workflow] ${ko.subject} / ${STRINGS.ja.subject} / ${STRINGS.en.subject} — ${data.ticketNo}`;

  const sections = langs.map((lang) => buildSection(lang, data));
  const text = sections.map((s) => s.text).join('\n\n');
  const html = `<div style="font-family:sans-serif;max-width:600px;color:#111827">
${sections.map((s) => s.html).join('')}
</div>`;

  return { subject, text, html };
}

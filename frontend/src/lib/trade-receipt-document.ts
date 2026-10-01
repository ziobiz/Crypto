export type TradeReceiptDocumentInput = {
  userName: string;
  ticketNo: string;
  fiatAmount: number;
  fiatCurrency: string;
  expectedUsdt: number;
  actualUsdt?: number | null;
  usdtTxId?: string | null;
};

type Lang = 'ko' | 'en' | 'ja' | 'zh' | 'th';

const LANG_ORDER: Lang[] = ['ko', 'en', 'ja', 'zh', 'th'];

const STRINGS: Record<
  Lang,
  {
    sectionTitle: string;
    greeting: string;
    ticketNo: string;
    status: string;
    statusCompleted: string;
    fiatAmount: string;
    expectedUsdt: string;
    actualUsdt: string;
    txid: string;
    footer: string;
  }
> = {
  ko: {
    sectionTitle: '한국어',
    greeting: '님, 거래가 완료되었습니다.',
    ticketNo: '티켓번호',
    status: '상태',
    statusCompleted: '완료',
    fiatAmount: '신청금액',
    expectedUsdt: '예상 USDT',
    actualUsdt: '실제 송금 USDT',
    txid: 'TXID',
    footer: '본 메일은 거래 처리 결과 안내입니다.',
  },
  en: {
    sectionTitle: 'English',
    greeting: ', your trade has been completed.',
    ticketNo: 'Ticket No.',
    status: 'Status',
    statusCompleted: 'Completed',
    fiatAmount: 'Order Amount',
    expectedUsdt: 'Expected USDT',
    actualUsdt: 'Actual USDT Sent',
    txid: 'TXID',
    footer: 'This email is a notification of your completed trade.',
  },
  ja: {
    sectionTitle: '日本語',
    greeting: '様、取引が完了しました。',
    ticketNo: 'チケット番号',
    status: '状態',
    statusCompleted: '完了',
    fiatAmount: '申請金額',
    expectedUsdt: '予想 USDT',
    actualUsdt: '実際送金 USDT',
    txid: 'TXID',
    footer: '本メールは取引処理結果のご案内です。',
  },
  zh: {
    sectionTitle: '中文',
    greeting: '，您的交易已完成。',
    ticketNo: '票据编号',
    status: '状态',
    statusCompleted: '已完成',
    fiatAmount: '申请金额',
    expectedUsdt: '预计 USDT',
    actualUsdt: '实际汇出 USDT',
    txid: 'TXID',
    footer: '本邮件为交易处理结果通知。',
  },
  th: {
    sectionTitle: 'ไทย',
    greeting: ' การทำธุรกรรมของคุณเสร็จสมบูรณ์แล้ว',
    ticketNo: 'เลขที่ตั๋ว',
    status: 'สถานะ',
    statusCompleted: 'เสร็จสิ้น',
    fiatAmount: 'จำนวนที่ขอ',
    expectedUsdt: 'USDT ที่คาดการณ์',
    actualUsdt: 'USDT ที่โอนจริง',
    txid: 'TXID',
    footer: 'อีเมลนี้เป็นการแจ้งผลการทำธุรกรรม',
  },
};

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sectionHtml(lang: Lang, data: TradeReceiptDocumentInput) {
  const s = STRINGS[lang];
  const rows = [
    [s.ticketNo, `<strong>${esc(data.ticketNo)}</strong>`],
    [s.status, esc(s.statusCompleted)],
    [s.fiatAmount, `${data.fiatAmount.toLocaleString()} ${esc(data.fiatCurrency)}`],
    [s.expectedUsdt, String(data.expectedUsdt)],
  ];
  if (data.actualUsdt != null) rows.push([s.actualUsdt, String(data.actualUsdt)]);
  if (data.usdtTxId) rows.push([s.txid, esc(data.usdtTxId)]);
  return `<section style="margin-bottom:28px;padding-bottom:16px;border-bottom:1px solid #e5e7eb">
<h2 style="margin:0 0 12px;font-size:14px;color:#374151">${s.sectionTitle}</h2>
<p style="margin:0 0 12px">${esc(data.userName)}${s.greeting}</p>
<table style="border-collapse:collapse;font-size:14px;line-height:1.8">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="padding-right:16px;color:#6b7280;vertical-align:top">${label}</td><td style="word-break:break-all">${value}</td></tr>`,
  )
  .join('')}
</table>
<p style="margin:12px 0 0;font-size:12px;color:#9ca3af">${s.footer}</p>
</section>`;
}

export function buildTradeReceiptDocumentHtml(data: TradeReceiptDocumentInput) {
  const title = `거래명세 / Trade Receipt / 取引明細 / 交易明细 / ใบเสร็จธุรกรรม — ${data.ticketNo}`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  body { margin: 0; background: #f8fafc; color: #111827; font-family: "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans JP", "Noto Sans SC", "Noto Sans Thai", sans-serif; }
  .sheet { max-width: 720px; margin: 24px auto; background: #fff; padding: 32px 28px; box-shadow: 0 1px 4px rgba(15,23,42,.08); }
  h1 { margin: 0 0 20px; font-size: 18px; }
</style>
</head>
<body>
  <div class="sheet" id="receipt-sheet">
    <h1>${esc(title)}</h1>
    ${LANG_ORDER.map((lang) => sectionHtml(lang, data)).join('')}
  </div>
</body>
</html>`;
}

export function openTradeReceiptWindow(html: string) {
  // Blob URL — noopener 팝업에서도 document.write가 막히지 않음
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, '_blank', 'width=860,height=900');
  if (!popup) {
    URL.revokeObjectURL(url);
    return false;
  }
  // 로드 후 메모리 정리 (팝업이 닫혀도 무해)
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  try {
    popup.focus();
  } catch {
    /* ignore */
  }
  return true;
}

export async function downloadTradeReceiptPdf(html: string, filename: string) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '800px';
  iframe.style.height = '1200px';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    throw new Error('PDF_FRAME');
  }
  doc.open();
  doc.write(html);
  doc.close();
  await new Promise((resolve) => setTimeout(resolve, 250));
  const sheet = doc.getElementById('receipt-sheet') ?? doc.body;
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');
  const canvas = await html2canvas(sheet, {
    scale: 2,
    backgroundColor: '#ffffff',
    windowWidth: 800,
  });
  iframe.remove();

  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(img, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(img, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  pdf.save(filename);
}

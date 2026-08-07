import type { ManualLocale } from './version';
import { CURRENT_LIVE_VERSION } from './version';
import { getManualDoc } from './content';

export type ManualBrand = {
  siteName: string;
  logoUrl: string;
  faviconUrl?: string;
  footerText?: string;
};

function esc(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

/** blob: 창에서는 상대 경로가 깨지므로 origin 기준 절대 URL로 변환 */
export function toAbsoluteAssetUrl(url: string): string {
  const raw = String(url ?? '').trim();
  if (!raw) return '';
  if (/^(data:|blob:|https?:)/i.test(raw)) return raw;
  if (typeof window === 'undefined') return raw;
  try {
    return new URL(raw, window.location.origin).href;
  } catch {
    return raw;
  }
}

/** blob 문서용: 이미지를 data URL로 임베드 (로고/파비콘 안정 표시) */
export async function embedAssetAsDataUrl(url: string): Promise<string> {
  const abs = toAbsoluteAssetUrl(url);
  if (!abs) return '';
  if (abs.startsWith('data:')) return abs;
  try {
    const res = await fetch(abs, { credentials: 'same-origin', cache: 'force-cache' });
    if (!res.ok) return abs;
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : abs);
      reader.onerror = () => resolve(abs);
      reader.readAsDataURL(blob);
    });
  } catch {
    return abs;
  }
}

export async function resolveManualBrandAssets(brand: ManualBrand): Promise<ManualBrand> {
  const [logoUrl, faviconUrl] = await Promise.all([
    brand.logoUrl ? embedAssetAsDataUrl(brand.logoUrl) : Promise.resolve(''),
    brand.faviconUrl ? embedAssetAsDataUrl(brand.faviconUrl) : Promise.resolve(''),
  ]);
  return { ...brand, logoUrl, faviconUrl: faviconUrl || undefined };
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Segoe UI', sans-serif; font-size: 11pt; line-height: 1.75; color: #1a1a1a; background: #f0f2f8; }
  .page-wrap { max-width: 960px; margin: 32px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 18px rgba(0,0,0,.11); overflow: hidden; }
  .cover { background: linear-gradient(135deg, #1a3a5c 0%, #1976d2 55%, #42a5f5 100%); color: #fff; padding: 48px 52px 40px; display: flex; align-items: flex-start; justify-content: space-between; gap: 32px; }
  .cover-body { flex: 1; }
  .cover-logo { flex-shrink: 0; display: flex; align-items: flex-start; padding-top: 4px; }
  .cover-logo img { height: 64px; background: rgba(255,255,255,.92); padding: 10px 18px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,.20); max-width: 220px; object-fit: contain; }
  .cover .logo-line { font-size: 13pt; font-weight: 700; letter-spacing: 2px; opacity: .85; margin-bottom: 14px; }
  .cover h1 { font-size: 23pt; font-weight: 900; line-height: 1.28; margin-bottom: 10px; }
  .cover .subtitle { font-size: 11pt; opacity: .82; margin-bottom: 24px; }
  .cover .meta { font-size: 9.5pt; opacity: .65; border-top: 1px solid rgba(255,255,255,.25); padding-top: 14px; }
  .body { padding: 44px 52px 64px; }
  .toc { background: #f0f4ff; border-left: 4px solid #1565c0; border-radius: 0 8px 8px 0; padding: 20px 26px; margin-bottom: 44px; }
  .toc h2 { font-size: 12pt; font-weight: 700; color: #1565c0; margin-bottom: 12px; }
  .toc ol { padding-left: 20px; }
  .toc li { font-size: 10pt; line-height: 2.1; color: #1a3a5c; }
  .toc a { color: #1565c0; text-decoration: none; }
  h2.section-title { font-size: 15pt; font-weight: 800; color: #1a3a5c; border-bottom: 2.5px solid #1565c0; padding-bottom: 7px; margin: 48px 0 18px; }
  p { margin-bottom: 10px; }
  .info-box  { background: #e3f0ff; border: 1px solid #90caf9; border-left: 4px solid #1565c0; border-radius: 6px; padding: 12px 16px; margin: 14px 0; font-size: 10pt; color: #1a3a5c; }
  .warn-box  { background: #fff8e1; border: 1px solid #ffe082; border-left: 4px solid #f9a825; border-radius: 6px; padding: 12px 16px; margin: 14px 0; font-size: 10pt; color: #5d4037; }
  .check-box { background: #e8f5e9; border: 1px solid #a5d6a7; border-left: 4px solid #2e7d32; border-radius: 6px; padding: 12px 16px; margin: 14px 0; font-size: 10pt; color: #1b5e20; }
  .block-box { background: #fce4ec; border: 1px solid #f48fb1; border-left: 4px solid #c62828; border-radius: 6px; padding: 12px 16px; margin: 14px 0; font-size: 10pt; color: #b71c1c; }
  table { width: 100%; border-collapse: collapse; margin: 14px 0 22px; font-size: 10pt; }
  th { background: #1a3a5c; color: #fff; font-weight: 700; padding: 9px 12px; text-align: left; border: 1px solid #12274a; }
  td { padding: 8px 12px; border: 1px solid #cfd8dc; vertical-align: middle; }
  tr:nth-child(even) td { background: #f4f7ff; }
  .menu-path { display: inline-block; background: #eceff1; border: 1px solid #cfd8dc; border-radius: 5px; padding: 3px 12px; font-size: 9.5pt; color: #37474f; font-weight: 600; margin-bottom: 12px; }
  .flow { background: #f8f9fd; border: 1px solid #dce3f5; border-radius: 8px; padding: 18px 22px; margin: 14px 0 20px; font-size: 10pt; }
  .flow-row { display: flex; align-items: flex-start; margin-bottom: 6px; }
  .flow-num { display: inline-block; min-width: 28px; font-weight: 800; color: #1565c0; flex-shrink: 0; }
  .faq-item { border: 1px solid #e0e6f0; border-radius: 8px; margin-bottom: 14px; }
  .faq-q { background: #e8edf8; padding: 11px 16px; font-weight: 700; font-size: 10.5pt; color: #1a3a5c; border-radius: 8px 8px 0 0; }
  .faq-q::before { content: "Q. "; color: #1565c0; }
  .faq-a { padding: 11px 16px; font-size: 10pt; color: #37474f; }
  .faq-a::before { content: "A. "; font-weight: 700; color: #2e7d32; }
  ul, ol { padding-left: 20px; margin-bottom: 12px; }
  li { margin-bottom: 4px; }
  .footer { background: #1a3a5c; color: rgba(255,255,255,.6); text-align: center; font-size: 9pt; padding: 18px 24px; }
  .print-btn { position: fixed; bottom: 28px; right: 28px; z-index: 9999; background: #1565c0; color: #fff; border: none; border-radius: 10px; padding: 11px 20px; font-size: 10.5pt; font-weight: 700; cursor: pointer; box-shadow: 0 4px 16px rgba(21,101,192,.45); }
  @media print { .print-btn { display: none !important; } body { background: #fff; } .page-wrap { margin: 0; box-shadow: none; } }
`;

export function buildManualHtml(
  manualId: string,
  locale: ManualLocale,
  brand: ManualBrand,
  docVersion = CURRENT_LIVE_VERSION,
): string {
  const doc = getManualDoc(manualId);
  if (!doc) {
    return `<!DOCTYPE html><html><body><p>Manual not found</p></body></html>`;
  }

  const pick = <T,>(m: Record<ManualLocale, T>) => m[locale] ?? m.KR ?? m.US;
  const title = pick(doc.coverTitle);
  const subtitle = pick(doc.coverSubtitle);
  const site = brand.siteName || 'TINPASS';
  const ver = docVersion.replace(/^V/i, '');
  const logoSrc = brand.logoUrl ? toAbsoluteAssetUrl(brand.logoUrl) : '';
  const faviconSrc = brand.faviconUrl ? toAbsoluteAssetUrl(brand.faviconUrl) : '';
  const logo = logoSrc
    ? `<img src="${esc(logoSrc)}" alt="${esc(site)}" />`
    : '';
  const faviconLink = faviconSrc
    ? `<link rel="icon" href="${esc(faviconSrc)}" />`
    : '';

  const tocLabel =
    locale === 'JP' ? '目次' : locale === 'US' ? 'Contents' : locale === 'CH' ? '目录' : locale === 'TH' ? 'สารบัญ' : '목차';
  const printLabel =
    locale === 'JP' ? '印刷 / PDF' : locale === 'US' ? 'Print / PDF' : locale === 'CH' ? '打印 / PDF' : locale === 'TH' ? 'พิมพ์ / PDF' : '인쇄 / PDF 저장';

  const toc = doc.sections
    .map((s, i) => `<li><a href="#${esc(s.id)}">${i + 1}. ${esc(pick(s.title))}</a></li>`)
    .join('');

  const sections = doc.sections
    .map(
      (s, i) =>
        `<h2 class="section-title" id="${esc(s.id)}">${i + 1}. ${esc(pick(s.title))}</h2>${pick(s.bodyHtml)}`,
    )
    .join('\n<hr style="border:none;border-top:1px dashed #c5cae9;margin:40px 0" />\n');

  const footer = brand.footerText || `© ${site} · Manual V${ver}`;

  return `<!DOCTYPE html>
<html lang="${locale === 'JP' ? 'ja' : locale === 'US' ? 'en' : locale === 'CH' ? 'zh' : locale === 'TH' ? 'th' : 'ko'}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
${faviconLink}
<style>${CSS}</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">${esc(printLabel)}</button>
<div class="page-wrap">
  <div class="cover">
    <div class="cover-body">
      <div class="logo-line">${esc(site)}</div>
      <h1>${esc(title)}</h1>
      <div class="subtitle">${esc(subtitle)}</div>
      <div class="meta">${esc(site)} · Live V${esc(ver)} · ${new Date().getFullYear()}</div>
    </div>
    ${logo ? `<div class="cover-logo">${logo}</div>` : ''}
  </div>
  <div class="body">
    <div class="toc"><h2>📋 ${esc(tocLabel)}</h2><ol>${toc}</ol></div>
    ${sections}
  </div>
  <div class="footer">${esc(footer)}</div>
</div>
</body>
</html>`;
}

export function openManualWindow(html: string, existingWin?: Window | null) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = existingWin ?? window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error('POPUP_BLOCKED');
  }
  if (existingWin) {
    try {
      existingWin.location.href = url;
    } catch {
      URL.revokeObjectURL(url);
      throw new Error('POPUP_BLOCKED');
    }
  }
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }, 180_000);
}

/** 클릭 직후 동기 호출 — 팝업 차단 방지 */
export function openManualPlaceholderWindow(): Window {
  const win = window.open('about:blank', '_blank');
  if (!win) throw new Error('POPUP_BLOCKED');
  try {
    win.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>…</title></head><body style="font-family:sans-serif;padding:24px;color:#555">Loading…</body></html>',
    );
    win.document.close();
  } catch {
    /* ignore */
  }
  return win;
}

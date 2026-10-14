import { otpMailCopy, resolveOtpMailLocale } from './i18n.js';
import type {
  OtpMailBrand,
  OtpMailLocale,
  OtpMailPurpose,
  OtpMailRenderVars,
  OtpMailRendered,
} from './types.js';

export const DEFAULT_OTP_MAIL_BRAND: OtpMailBrand = {
  brandLabel: 'TINPASS By Ontheline',
  productName: 'TINPASS',
  serviceByName: 'Thinpass',
};

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fillVars(
  s: string,
  vars: { name: string; code: string; minutes: string; product: string },
): string {
  return s
    .replace(/\{name\}/g, vars.name)
    .replace(/\{code\}/g, vars.code)
    .replace(/\{minutes\}/g, vars.minutes)
    .replace(/\{product\}/g, vars.product);
}

/** Build title HTML with product name bolded (Wirex-style). */
function titleHtml(titleTemplate: string, productName: string): string {
  const safeProduct = `<strong style="font-weight:700;color:#0b0b2e;">${escapeHtml(productName)}</strong>`;
  const parts = titleTemplate.split('{product}');
  if (parts.length === 1) {
    return escapeHtml(titleTemplate);
  }
  return parts.map((p) => escapeHtml(p)).join(safeProduct);
}

/**
 * Wirex-style card HTML — table-based for email client compatibility.
 * Typography matches approved TINPASS preview (title ~17px regular, code emphasis).
 */
export function buildOtpMailHtml(opts: {
  brandLabel: string;
  productName: string;
  serviceByName: string;
  titleTemplate: string;
  yourCodeIs: string;
  code: string;
  expires: string;
  ignore: string;
  serviceByPrefix: string;
}): string {
  const title = titleHtml(opts.titleTemplate, opts.productName);
  const brand = escapeHtml(opts.brandLabel);
  const yourCodeIs = escapeHtml(opts.yourCodeIs);
  const code = escapeHtml(opts.code);
  const expires = escapeHtml(opts.expires);
  const ignore = escapeHtml(opts.ignore);
  const servicePrefix = escapeHtml(opts.serviceByPrefix);
  const serviceName = escapeHtml(opts.serviceByName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${brand}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:36px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:380px;background:#ffffff;border:1px solid #e5e7eb;border-radius:4px;">
        <tr>
          <td align="center" style="padding:36px 32px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            <p style="margin:0 0 18px;font-size:13px;font-weight:400;line-height:1.2;color:#9ca3af;">${brand}</p>
            <p style="margin:0 0 22px;font-size:17px;font-weight:400;line-height:1.35;letter-spacing:-0.01em;color:#0b0b2e;">${title}</p>
            <hr style="border:0;border-top:1px solid #e5e7eb;margin:0 0 22px;" />
            <p style="margin:0 0 14px;font-size:14px;font-weight:400;line-height:1.3;color:#374151;">${yourCodeIs}</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 14px;">
              <tr>
                <td align="center" style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 28px;background:#ffffff;">
                  <span style="font-size:28px;font-weight:700;letter-spacing:4px;line-height:1;color:#0b0b2e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${code}</span>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;font-weight:400;line-height:1.45;color:#6b7280;">${expires}</p>
            <hr style="border:0;border-top:1px solid #e5e7eb;margin:22px 0 18px;" />
            <p style="margin:0;font-size:13px;font-weight:400;line-height:1.4;color:#6b7280;">${ignore}</p>
          </td>
        </tr>
      </table>
      <p style="margin:22px 0 0;font-size:12px;font-weight:400;line-height:1.4;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        ${servicePrefix} <strong style="font-weight:700;color:#111827;">${serviceName}</strong>
      </p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function renderOtpMail(
  locale: OtpMailLocale,
  vars: OtpMailRenderVars,
): OtpMailRendered {
  const purpose: OtpMailPurpose = vars.purpose || 'LOGIN';
  const brand: OtpMailBrand = { ...DEFAULT_OTP_MAIL_BRAND, ...(vars.brand || {}) };
  const copy = otpMailCopy(locale, purpose);
  const fill = {
    name: vars.name,
    code: vars.code,
    minutes: vars.minutes,
    product: brand.productName,
  };
  const subject = fillVars(copy.subject, fill);
  const text = fillVars(copy.body, fill);
  const expires = fillVars(copy.expires, fill);
  const html = buildOtpMailHtml({
    brandLabel: brand.brandLabel,
    productName: brand.productName,
    serviceByName: brand.serviceByName,
    titleTemplate: copy.title,
    yourCodeIs: copy.yourCodeIs,
    code: vars.code,
    expires,
    ignore: copy.ignore,
    serviceByPrefix: copy.serviceByPrefix,
  });
  return { subject, text, html };
}

export function renderOtpMailFromHint(
  localeHint: string | null | undefined,
  vars: OtpMailRenderVars,
): OtpMailRendered {
  return renderOtpMail(resolveOtpMailLocale(localeHint), vars);
}

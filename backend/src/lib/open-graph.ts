import type { NextFunction, Request, Response } from 'express';
import { hqPolicyService } from '../services/hq-policy.service';

/** LINE / WhatsApp / Facebook 등 — JS를 실행하지 않는 링크 미리보기 크롤러 */
export const LINK_PREVIEW_CRAWLER_RE =
  /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|Googlebot|bingbot|Applebot|Iframely|Embedly|Pinterest|SkypeUriPreview|VKShare|KAKAOTALK|kakaotalk|LineBot|Linespider|line-poker|Line\/|Yahoo! Slurp|DuckDuckBot|embedly|outbrain|redditbot|tumblr|bitlybot|flipboard|viber|quora link preview|showyoubot/i;

const SKIP_PATH_RE = /^\/(api|_next|health)(\/|$)/i;
const STATIC_EXT_RE = /\.(?:js|css|map|png|jpe?g|gif|webp|ico|svg|woff2?|ttf|eot|txt|xml|json|pdf)$/i;

export function isLinkPreviewCrawler(userAgent: string | undefined): boolean {
  return LINK_PREVIEW_CRAWLER_RE.test(String(userAgent || ''));
}

function normalizePathname(raw: string): string {
  const path = String(raw || '/').split('?')[0] || '/';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

function shouldSkipOgPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  if (SKIP_PATH_RE.test(path)) return true;
  if (STATIC_EXT_RE.test(path)) return true;
  return false;
}

export function publicOrigin(req: Request): string {
  const xfHost = String(req.headers['x-forwarded-host'] || '')
    .split(',')[0]
    ?.trim();
  const host = xfHost || String(req.headers.host || 'tinpass.com').split(',')[0]!.trim();
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
  if (local) {
    const xfProto = String(req.headers['x-forwarded-proto'] || '')
      .split(',')[0]
      ?.trim();
    const proto = xfProto || req.protocol || 'http';
    return `${proto}://${host}`;
  }
  return `https://${host}`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildCrawlerHtml(opts: {
  canonicalUrl: string;
  title: string;
  description: string;
  siteName: string;
  imageUrl: string | null;
  imageType: string | null;
}): string {
  const title = escapeAttr(opts.title);
  const siteName = escapeAttr(opts.siteName);
  const url = escapeAttr(opts.canonicalUrl);
  const desc = opts.description.trim() ? escapeAttr(opts.description.trim()) : '';
  const image = opts.imageUrl ? escapeAttr(opts.imageUrl) : '';
  const card = image ? 'summary_large_image' : 'summary';

  const extra: string[] = [];
  if (desc) {
    extra.push(`<meta name="description" content="${desc}">`);
    extra.push(`<meta property="og:description" content="${desc}">`);
    extra.push(`<meta name="twitter:description" content="${desc}">`);
  }
  if (image) {
    extra.push(`<meta property="og:image" content="${image}">`);
    extra.push(`<meta property="og:image:secure_url" content="${image}">`);
    extra.push(`<meta name="twitter:image" content="${image}">`);
    if (opts.imageType) {
      extra.push(`<meta property="og:image:type" content="${escapeAttr(opts.imageType)}">`);
    }
  }

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:site_name" content="${siteName}">
<meta name="twitter:card" content="${card}">
<meta name="twitter:title" content="${title}">
${extra.join('\n')}
</head>
<body></body>
</html>`;
}

/** Next보다 먼저: 크롤러에게 JS 없는 OG HTML을 반환한다. 경로와 무관하게 동일 브랜드 미리보기. */
export function crawlerOpenGraphMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }
  if (!isLinkPreviewCrawler(req.headers['user-agent'])) {
    next();
    return;
  }
  const pathname = normalizePathname(req.path || req.url || '/');
  if (shouldSkipOgPath(pathname)) {
    next();
    return;
  }

  void (async () => {
    try {
      const og = await hqPolicyService.getPublicOpenGraph();
      const origin = publicOrigin(req);
      const canonicalUrl = `${origin}${pathname === '/' ? '/' : pathname}`;
      const imageUrl = og.imagePath ? `${origin}${og.imagePath}` : null;
      const html = buildCrawlerHtml({
        canonicalUrl,
        title: og.title,
        description: og.description,
        siteName: og.siteName,
        imageUrl,
        imageType: og.imageType,
      });
      res.status(200);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(html);
    } catch (err) {
      next(err);
    }
  })();
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_SESSION_COOKIE = 'tinpass_sess';
const LINK_PREVIEW_CRAWLER_RE =
  /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|Googlebot|bingbot|Applebot|Iframely|Embedly|Pinterest|SkypeUriPreview|VKShare|KAKAOTALK|kakaotalk|LineBot|Linespider|line-poker|Line\/|Yahoo! Slurp|DuckDuckBot|embedly|outbrain|redditbot|tumblr|bitlybot|flipboard|viber|quora link preview|showyoubot/i;

function lockHeaders(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  res.headers.set('Referrer-Policy', 'no-referrer');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const ua = req.headers.get('user-agent') || '';
  if (LINK_PREVIEW_CRAWLER_RE.test(ua)) {
    return NextResponse.next();
  }

  const sess = req.cookies.get(AUTH_SESSION_COOKIE)?.value;
  if (sess !== '1') {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', pathname);
    return lockHeaders(NextResponse.redirect(url));
  }

  return lockHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
};

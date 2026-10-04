/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    const noStore = [
      { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, private' },
      { key: 'Pragma', value: 'no-cache' },
      { key: 'Expires', value: '0' },
    ];
    return [
      {
        source: '/dashboard/:path*',
        headers: [
          ...noStore,
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' },
        ],
      },
      /** 로그인·가입 HTML이 구 빌드 청크를 가리키지 않도록 */
      { source: '/', headers: noStore },
      { source: '/login', headers: noStore },
      { source: '/register', headers: noStore },
      { source: '/recover', headers: noStore },
    ];
  },
};

module.exports = nextConfig;

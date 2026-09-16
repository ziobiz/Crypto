import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: "ONTHELINE's Tinpass Crypto Trading ANYTIME, ANYWHERE",
  description: "ONTHELINE's Tinpass Crypto Trading ANYTIME, ANYWHERE",
  openGraph: {
    title: "ONTHELINE's Tinpass Crypto Trading ANYTIME, ANYWHERE",
    description: "ONTHELINE's Tinpass Crypto Trading ANYTIME, ANYWHERE",
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-shell-theme="default" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

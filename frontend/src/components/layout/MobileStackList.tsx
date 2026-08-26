'use client';

import Link from 'next/link';

export function MobileStackList({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 md:hidden">{children}</div>;
}

export function MobileStackEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="pg-mobile-card">
      <p className="py-4 text-center text-sm" style={{ color: 'var(--shell-content-text-muted)' }}>
        {children}
      </p>
    </div>
  );
}

export function MobileStackCard({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  const body = <div className="pg-mobile-card">{children}</div>;
  if (!href) return body;
  return (
    <Link href={href} className="block text-inherit no-underline">
      {body}
    </Link>
  );
}

export function MobileStackFields({ children }: { children: React.ReactNode }) {
  return <div className="pg-mobile-stack-row">{children}</div>;
}

export function MobileStackField({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <span className="pg-mobile-stack-label">{label}</span>
      <span className="pg-mobile-stack-value">{children}</span>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';

export function DetailSection({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`pg-section ${className}`.trim()}>
      <div className="pg-section-head">{title}</div>
      <div className="pg-section-pad">
        <dl className="pg-detail-kv">{children}</dl>
      </div>
    </div>
  );
}

export function DetailRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`pg-detail-kv-row${highlight ? ' pg-detail-kv-row--highlight' : ''}`}>
      <dt className="pg-detail-kv-label">{label}</dt>
      <dd className={`pg-detail-kv-value${mono ? ' font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

export function DetailHero({
  fromLabel,
  toLabel,
  meta,
}: {
  fromLabel: string;
  toLabel: string;
  meta?: ReactNode;
}) {
  return (
    <div className="pg-card pg-detail-hero">
      <div className="pg-card-body">
        <div className="pg-detail-hero-amounts">
          <span className="pg-detail-hero-from">{fromLabel}</span>
          <span className="pg-detail-hero-arrow" aria-hidden>
            →
          </span>
          <span className="pg-detail-hero-to">{toLabel}</span>
        </div>
        {meta && <div className="pg-detail-hero-meta">{meta}</div>}
      </div>
    </div>
  );
}

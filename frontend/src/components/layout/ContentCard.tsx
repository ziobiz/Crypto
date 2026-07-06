'use client';

type ContentCardProps = {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function ContentCard({ title, children, className = '' }: ContentCardProps) {
  return (
    <section className={`pg-card ${className}`}>
      {title != null && title !== '' && <div className="pg-card-head">{title}</div>}
      <div className="pg-card-body">{children}</div>
    </section>
  );
}

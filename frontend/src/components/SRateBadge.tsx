type SRateBadgeProps = {
  mode?: 'LIVE' | 'SAND' | null;
  liveLabel: string;
  sandLabel: string;
};

export function SRateBadge({ mode, liveLabel, sandLabel }: SRateBadgeProps) {
  const isSand = mode === 'SAND';
  return (
    <span className={`pg-badge ${isSand ? 'pg-badge-srate-sand' : 'pg-badge-srate-live'}`}>
      {isSand ? sandLabel : liveLabel}
    </span>
  );
}

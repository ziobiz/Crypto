'use client';

type PolicyNumberInputProps = {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number | string;
};

/** 정책 수치 입력 — 스피너·휠·화살표 증감 없음 */
export function PolicyNumberInput({
  value,
  onChange,
  className,
  min,
  max,
  step = '0.01',
}: PolicyNumberInputProps) {
  return (
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={className}
      onWheel={(e) => {
        e.preventDefault();
        e.currentTarget.blur();
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
        }
      }}
    />
  );
}

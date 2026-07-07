'use client';

type PolicyCellValueProps = {
  children: React.ReactNode;
  className?: string;
};

/** 테이블 읽기 전용 셀 값 — 가운데 정렬 */
export function PolicyCellValue({ children, className = '' }: PolicyCellValueProps) {
  return (
    <span className={`inline-block font-mono tabular-nums text-gray-800 ${className}`}>
      {children}
    </span>
  );
}

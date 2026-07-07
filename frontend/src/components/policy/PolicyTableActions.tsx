'use client';

type PolicyTableActionsProps = {
  children: React.ReactNode;
};

/** 테이블 관리 열 — 버튼 상하좌우 가운데 정렬 */
export function PolicyTableActions({ children }: PolicyTableActionsProps) {
  return <div className="pg-table-actions">{children}</div>;
}

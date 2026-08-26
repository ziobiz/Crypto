import type { MouseEvent } from 'react';

/** 상세/2차 화면이 있는 목록 행 — 더블클릭으로 연다. 링크·버튼 클릭은 제외. */
export function detailRowProps(title: string, onOpen: () => void) {
  return {
    className: 'pg-row-detail',
    title,
    onDoubleClick: (e: MouseEvent<HTMLTableRowElement>) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest('a,button,input,select,textarea,label')) return;
      onOpen();
    },
  };
}

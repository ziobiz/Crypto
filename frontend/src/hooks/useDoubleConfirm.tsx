'use client';

import { useCallback, useState } from 'react';
import { DoubleConfirmDialog } from '@/components/DoubleConfirmDialog';
import { useT } from '@/context/LocaleProvider';

type PendingConfirm = {
  title: string;
  step1: string;
  step2: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
};

/** 주요 설정 저장·상태 변경용 2단계 확인 */
export function useDoubleConfirm() {
  const t = useT();
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const requestConfirm = useCallback((opts: PendingConfirm) => {
    setPending(opts);
  }, []);

  const dialog = pending ? (
    <DoubleConfirmDialog
      title={pending.title}
      step1={pending.step1}
      step2={pending.step2}
      confirmLabel={pending.confirmLabel ?? t('common.confirm')}
      onConfirm={async () => {
        await pending.onConfirm();
        setPending(null);
      }}
      onClose={() => setPending(null)}
    />
  ) : null;

  return { requestConfirm, dialog };
}

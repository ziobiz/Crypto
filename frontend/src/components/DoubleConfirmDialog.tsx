'use client';

import { useState } from 'react';
import { useT } from '@/context/LocaleProvider';

export function DoubleConfirmDialog({
  title,
  step1,
  step2,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  step1: string;
  step2: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pg-modal-overlay">
      <div className="pg-modal">
        <div className="pg-modal-head">
          <h2 className="pg-modal-title">{title}</h2>
        </div>
        <div className="pg-modal-body">
          <p className="text-[13px] whitespace-pre-wrap text-gray-700">{step === 1 ? step1 : step2}</p>
        </div>
        <div className="pg-modal-foot">
          <button type="button" onClick={onClose} className="pg-btn pg-btn-secondary" disabled={busy}>
            {t('common.cancel')}
          </button>
          {step === 1 ? (
            <button type="button" onClick={() => setStep(2)} className="pg-btn pg-btn-primary">
              {t('deletion.nextConfirm')}
            </button>
          ) : (
            <button type="button" onClick={confirm} className="pg-btn pg-btn-primary" disabled={busy}>
              {confirmLabel ?? t('deletion.confirmDelete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

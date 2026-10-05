'use client';

import { useT } from '@/context/LocaleProvider';

/** 인증·가입 화면용 1단계 확인 창 */
export function AuthConfirmDialog({
  title,
  message,
  confirmLabel,
  busy,
  hideCancel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  hideCancel?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();

  return (
    <div className="pg-modal-overlay" role="dialog" aria-modal="true">
      <div className="pg-modal max-w-md">
        <div className="pg-modal-head">
          <h2 className="pg-modal-title">{title}</h2>
        </div>
        <div className="pg-modal-body">
          <p className="whitespace-pre-wrap text-[13px] text-gray-700">{message}</p>
        </div>
        <div className="pg-modal-foot">
          {!hideCancel && (
            <button
              type="button"
              onClick={onClose}
              className="pg-btn pg-btn-secondary"
              disabled={busy}
            >
              {t('common.cancel')}
            </button>
          )}
          <button
            type="button"
            onClick={() => void onConfirm()}
            className="pg-btn pg-btn-primary"
            disabled={busy}
          >
            {busy ? t('common.loading') : confirmLabel ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

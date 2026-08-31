'use client';

type Row = { label: string; value: string; warn?: boolean };

export function OperatorAmountConfirmModal({
  open,
  title,
  warning,
  rows,
  confirmLabel,
  cancelLabel,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  warning: string;
  rows: Row[];
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="pg-modal-overlay" role="dialog" aria-modal="true">
      <div className="pg-modal max-w-lg">
        <div className="pg-modal-head">
          <h2 className="pg-modal-title text-red-700">{title}</h2>
        </div>
        <div className="pg-modal-body space-y-3">
          <div className="pg-callout pg-callout-error text-sm">{warning}</div>
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="py-1 pr-3 pg-muted whitespace-nowrap">{row.label}</td>
                  <td
                    className={`py-1 font-medium tabular-nums text-right ${
                      row.warn ? 'text-red-700' : ''
                    }`}
                  >
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pg-modal-foot">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="pg-btn pg-btn-secondary disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="pg-btn pg-btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

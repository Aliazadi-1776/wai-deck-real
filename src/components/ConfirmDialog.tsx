import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-line bg-paper text-ink shadow-pop">
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div className="flex gap-3">
            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${danger ? "bg-danger/10 text-danger" : "bg-soft text-ink"}`}>
              <AlertTriangle size={19} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">{title}</h3>
              {description && <p className="mt-2 text-sm leading-6 text-muted">{description}</p>}
            </div>
          </div>
          <button type="button" onClick={onCancel} className="btn-ghost !rounded-2xl !p-2.5" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-3 border-t border-line bg-canvas p-4">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            className={danger ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-3 text-sm font-bold text-paper transition hover:opacity-90" : "btn-primary"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

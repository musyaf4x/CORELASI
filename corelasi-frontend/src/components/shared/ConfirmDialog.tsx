import React from "react";
import { AlertTriangle } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "primary";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
  variant = "danger",
}) => {
  if (!isOpen) return null;

  const btnColors = {
    danger:
      "bg-status-danger hover:bg-status-danger/90 focus-visible:ring-status-danger text-white",
    warning:
      "bg-status-warning hover:bg-status-warning/90 focus-visible:ring-status-warning text-white",
    primary:
      "bg-primary hover:bg-primary-hover focus-visible:ring-primary text-white",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg-ink/40 backdrop-blur-[1px]"
        onClick={onCancel}
      />

      {/* Dialog box */}
      <div className="relative w-full max-w-[400px] bg-bg-surface border border-bg-border rounded-[6px] p-6 shadow-[0_10px_25px_-5px_rgba(20,33,26,0.15)] z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] ${variant === "danger" ? "bg-status-danger/10 text-status-danger border border-status-danger/25" : variant === "warning" ? "bg-status-warning/10 text-text-warning border border-status-warning/25" : "bg-primary/10 text-primary border border-primary/25"}`}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3
              id="modal-title"
              className="text-[14px] font-bold text-bg-ink leading-tight"
            >
              {title}
            </h3>
            <p className="mt-2 text-[13px] text-bg-ink-secondary leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-[6px] border border-bg-border bg-bg-surface hover:bg-bg-sage-slate px-4 py-2.5 text-[13px] font-semibold text-bg-ink-secondary transition-all active:scale-[0.98] focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex items-center justify-center rounded-[6px] px-4 py-2.5 text-[13px] font-semibold transition-all active:scale-[0.98] focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:outline-none cursor-pointer ${btnColors[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { SemanticState } from "@/utils/semanticState";

export interface ToastProps {
  message: string;
  variant?: SemanticState;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = "safe",
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    excellent:
      "border-border-excellent bg-bg-excellent-tint text-text-excellent",
    safe: "border-border-safe bg-bg-safe-tint text-text-safe",
    info: "border-status-info/25 bg-status-info/[0.04] text-text-info",
    pending: "border-border-pending bg-bg-pending-tint text-text-pending",
    warning:
      "border-status-warning/30 bg-status-warning/[0.05] text-text-warning",
    danger: "border-status-danger/30 bg-status-danger/[0.05] text-text-danger",
    neutral: "border-bg-border bg-bg-surface text-bg-ink",
    disabled: "border-border-disabled bg-bg-disabled-tint text-text-disabled",
  };

  const icons = {
    excellent: (
      <CheckCircle2 className="h-4 w-4 text-status-excellent shrink-0" />
    ),
    safe: <CheckCircle2 className="h-4 w-4 text-status-success shrink-0" />,
    info: <Info className="h-4 w-4 text-status-info shrink-0" />,
    pending: <Info className="h-4 w-4 text-status-pending shrink-0" />,
    warning: <AlertCircle className="h-4 w-4 text-status-warning shrink-0" />,
    danger: <AlertCircle className="h-4 w-4 text-status-danger shrink-0" />,
    neutral: <Info className="h-4 w-4 text-bg-ink-muted shrink-0" />,
    disabled: <AlertCircle className="h-4 w-4 text-status-disabled shrink-0" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-4 rounded-[6px] border px-4 py-2.5 text-[13px] font-semibold shadow-md ${styles[variant]} transition-all animate-in fade-in slide-in-from-top-4`}
    >
      <div className="flex items-center gap-2">
        {icons[variant]}
        <span>{message}</span>
      </div>
      <button
        onClick={onClose}
        className="opacity-70 hover:opacity-100 text-[11px] font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bg-border rounded p-0.5"
        aria-label="Tutup notifikasi"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

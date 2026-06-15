import React from "react";
import { AlertCircle } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Terjadi kesalahan",
  message,
  onRetry,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center text-center p-8 border border-status-danger/20 rounded-[6px] bg-status-danger/[0.03] min-h-[200px]"
      role="alert"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-status-danger/10 border border-status-danger/20 text-status-danger mb-3">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-[14px] font-bold text-text-danger leading-tight mb-1">
        {title}
      </h3>
      <p className="text-[13px] text-text-danger/80 leading-relaxed max-w-[340px] mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-[6px] bg-status-danger/10 hover:bg-status-danger/15 border border-status-danger/25 px-4 py-2 text-[13px] font-semibold text-text-danger transition-all active:scale-[0.98] focus-visible:ring-1 focus-visible:ring-status-danger focus-visible:outline-none cursor-pointer"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
};

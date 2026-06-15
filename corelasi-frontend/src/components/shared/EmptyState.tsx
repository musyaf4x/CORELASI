import React from "react";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-bg-border rounded-[6px] bg-bg-surface/50 min-h-[240px]">
      <div className="flex h-12 w-12 items-center justify-center rounded-[6px] bg-bg-sage-slate border border-bg-border/60 text-bg-ink-muted mb-4">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-[18px] font-bold text-bg-ink leading-tight tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-[13px] text-bg-ink-secondary leading-relaxed max-w-[320px] mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center rounded-[6px] bg-primary hover:bg-primary-hover px-4 py-2 text-[13px] font-semibold text-white transition-all active:scale-[0.98] focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

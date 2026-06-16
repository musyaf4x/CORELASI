import React from "react";
import { HelpCircle } from "lucide-react";
import type { SemanticState } from "@/utils/semanticState";

export interface SummaryMetricCardProps {
  label: string;
  value: string;
  desc: string;
  icon: React.ReactNode;
  variant: SemanticState;
  tooltip: string;
}

const variantStyles: Record<
  SemanticState,
  {
    card: string;
    border: string;
    value: string;
    label: string;
    desc: string;
    iconBox: string;
  }
> = {
  excellent: {
    card: "bg-bg-excellent-tint",
    border: "border-border-excellent",
    value: "text-text-excellent",
    label: "text-text-excellent",
    desc: "text-text-excellent/80",
    iconBox: "bg-status-excellent/10 text-status-excellent",
  },
  safe: {
    card: "bg-bg-safe-tint",
    border: "border-border-safe",
    value: "text-text-safe",
    label: "text-text-safe",
    desc: "text-text-safe/80",
    iconBox: "bg-status-safe/10 text-status-safe",
  },
  info: {
    card: "bg-status-info/[0.04]",
    border: "border-status-info/25",
    value: "text-text-info",
    label: "text-text-info",
    desc: "text-text-info/80",
    iconBox: "bg-status-info/10 text-status-info",
  },
  pending: {
    card: "bg-bg-pending-tint",
    border: "border-border-pending",
    value: "text-text-pending",
    label: "text-text-pending",
    desc: "text-text-pending/80",
    iconBox: "bg-status-pending/10 text-status-pending",
  },
  warning: {
    card: "bg-status-warning/[0.05]",
    border: "border-status-warning/30",
    value: "text-text-warning",
    label: "text-text-warning",
    desc: "text-text-warning/80",
    iconBox: "bg-status-warning/10 text-text-warning",
  },
  danger: {
    card: "bg-status-danger/[0.05]",
    border: "border-status-danger/30",
    value: "text-text-danger",
    label: "text-text-danger",
    desc: "text-text-danger/80",
    iconBox: "bg-status-danger/10 text-text-danger",
  },
  neutral: {
    card: "bg-bg-surface",
    border: "border-bg-border/70",
    value: "text-bg-ink",
    label: "text-bg-ink-secondary",
    desc: "text-bg-ink-muted",
    iconBox: "bg-primary/[0.07] text-primary",
  },
  disabled: {
    card: "bg-bg-disabled-tint opacity-75",
    border: "border-border-disabled",
    value: "text-text-disabled",
    label: "text-text-disabled",
    desc: "text-text-disabled/80",
    iconBox: "bg-status-disabled/10 text-bg-ink-muted",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export const SummaryMetricCard: React.FC<SummaryMetricCardProps> = ({
  label,
  value,
  desc,
  icon,
  variant,
  tooltip,
}) => {
  const v = variantStyles[variant] || variantStyles.neutral;
  return (
    <div
      className={`relative border rounded-[6px] p-3 flex flex-col gap-2 transition-colors ${v.card} ${v.border}`}
      role={
        variant === "danger" || variant === "warning" ? "status" : undefined
      }
      aria-label={`${label}: ${value}. ${desc}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        {/* Label & Tooltip info */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`text-[13px] font-semibold leading-tight truncate ${v.label}`}
          >
            {label}
          </span>
          <button
            type="button"
            className="relative group/tooltip shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-[4px] p-0.5 text-left text-bg-ink-muted hover:text-primary transition-colors cursor-help"
            aria-label={`Keterangan tentang ${label}`}
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <div
              role="tooltip"
              className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block group-focus-within/tooltip:block bg-bg-ink text-white text-[10px] p-2.5 rounded-[4px] shadow-lg z-50 w-48 leading-normal pointer-events-none font-sans font-normal"
            >
              <div
                className="absolute top-full left-2 border-4 border-transparent border-t-bg-ink"
                aria-hidden="true"
              />
              {tooltip}
            </div>
          </button>
        </div>

        {/* Icon box (standing alone on the right) */}
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors shrink-0 ${v.iconBox}`}
        >
          {icon}
        </span>
      </div>

      {/* Metric value */}
      <div className="mt-1">
        <span
          className={`block text-[28px] font-bold leading-none tracking-tight transition-colors ${v.value}`}
        >
          {value}
        </span>
        <p
          className={`mt-1.5 text-[13px] leading-snug transition-colors ${v.desc}`}
        >
          {desc}
        </p>
      </div>
    </div>
  );
};

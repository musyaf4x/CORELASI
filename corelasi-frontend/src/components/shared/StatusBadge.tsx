import React from "react";
import { type SemanticState, semanticStyles } from "@/utils/semanticState";

export interface StatusBadgeProps {
  label: string;
  state: SemanticState;
  size?: "xs" | "sm";
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  state,
  size = "sm",
  className = "",
  showDot = true,
}) => {
  const styles = semanticStyles[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide shadow-[0_1px_2px_rgba(20,33,26,0.02)]
        ${size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]"}
        ${styles.badge} ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.badgeDot}`}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
};

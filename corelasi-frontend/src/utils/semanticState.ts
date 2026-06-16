export type SemanticState =
  | "excellent"
  | "safe"
  | "info"
  | "pending"
  | "warning"
  | "danger"
  | "neutral"
  | "disabled";

export interface SemanticStyles {
  badge: string;
  card: string;
  border: string;
  text: string;
  metric: string;
  icon: string;
  badgeDot: string;
}

export const semanticStyles: Record<SemanticState, SemanticStyles> = {
  excellent: {
    badge: "bg-status-excellent/10 text-text-excellent border-border-excellent",
    card: "bg-bg-excellent-tint",
    border: "border-border-excellent",
    text: "text-text-excellent",
    metric: "text-text-excellent",
    icon: "text-status-excellent",
    badgeDot: "bg-status-excellent",
  },
  safe: {
    badge: "bg-status-safe/10 text-text-safe border-border-safe",
    card: "bg-bg-safe-tint",
    border: "border-border-safe",
    text: "text-text-safe",
    metric: "text-text-safe",
    icon: "text-status-safe",
    badgeDot: "bg-status-safe",
  },
  info: {
    badge: "bg-status-info/[0.08] text-text-info border-status-info/20",
    card: "bg-status-info/[0.04]",
    border: "border-status-info/25",
    text: "text-text-info",
    metric: "text-text-info",
    icon: "text-status-info",
    badgeDot: "bg-status-info",
  },
  pending: {
    badge: "bg-status-pending/10 text-text-pending border-border-pending",
    card: "bg-bg-pending-tint",
    border: "border-border-pending",
    text: "text-text-pending",
    metric: "text-text-pending",
    icon: "text-status-pending",
    badgeDot: "bg-status-pending",
  },
  warning: {
    badge:
      "bg-status-warning/[0.10] text-text-warning border-status-warning/30",
    card: "bg-status-warning/[0.05]",
    border: "border-status-warning/30",
    text: "text-text-warning",
    metric: "text-text-warning",
    icon: "text-status-warning",
    badgeDot: "bg-status-warning",
  },
  danger: {
    badge: "bg-status-danger/[0.10] text-text-danger border-status-danger/30",
    card: "bg-status-danger/[0.05]",
    border: "border-status-danger/30",
    text: "text-text-danger",
    metric: "text-text-danger",
    icon: "text-status-danger",
    badgeDot: "bg-status-danger",
  },
  neutral: {
    badge: "bg-bg-sage-slate text-bg-ink-secondary border-bg-border",
    card: "bg-bg-surface",
    border: "border-bg-border/70",
    text: "text-bg-ink-secondary",
    metric: "text-bg-ink",
    icon: "text-primary",
    badgeDot: "bg-bg-ink-muted",
  },
  disabled: {
    badge:
      "bg-bg-disabled-tint text-text-disabled border-border-disabled opacity-60",
    card: "bg-bg-disabled-tint",
    border: "border-border-disabled",
    text: "text-text-disabled",
    metric: "text-text-disabled",
    icon: "text-bg-ink-muted",
    badgeDot: "bg-bg-ink-muted",
  },
};

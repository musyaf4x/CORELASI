import React from "react";
import { cn } from "@/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "subtle" | "tinted" | "primary" | "danger" | "warning";
  accentBar?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = "surface",
  accentBar = false,
  padding = "md",
  children,
  ...props
}) => {
  // Border-only elevation — shadows are the #1 AI-slop tell in product UI.
  // A single 1px border with no shadow reads as honest, structured, precise.
  // Shadow is reserved only for floating elements (dropdowns, modals, tooltips).
  const baseStyles = "border rounded-[6px] overflow-hidden";

  const variants = {
    // White panel on cool-off-white canvas — visible via border contrast alone
    surface: "border-bg-border bg-bg-surface",
    // Secondary panels, table containers, filter areas
    subtle: "border-bg-border/60 bg-bg-sage-slate/50",
    // Primary-tinted: used for homeroom, key-action panels
    tinted: "border-primary/20 bg-bg-surface",
    primary: "border-primary/20 bg-bg-surface",
    // Semantic state cards — color carries the signal, border reinforces it
    danger: "border-status-danger/30 bg-status-danger/[0.04]",
    warning: "border-status-warning/30 bg-status-warning/[0.04]",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const accentColors = {
    surface: "bg-primary/40",
    subtle: "bg-primary/25",
    tinted: "bg-primary/45",
    primary: "bg-primary/45",
    danger: "bg-status-danger/80",
    warning: "bg-status-warning/80",
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props}>
      {accentBar && (
        <div
          className={cn("h-[3px] w-full", accentColors[variant])}
          aria-hidden="true"
        />
      )}
      {padding === "none" ? (
        children
      ) : (
        <div className={paddings[padding]}>{children}</div>
      )}
    </div>
  );
};

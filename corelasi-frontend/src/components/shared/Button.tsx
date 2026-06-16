import React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
  href?: string;
  target?: string;
  rel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = "primary",
  size = "md",
  children,
  href,
  target,
  rel,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-1.5 font-semibold rounded-[6px] " +
    "transition-colors duration-150 focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 " +
    "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer " +
    "active:brightness-95";

  const variants = {
    // Solid institutional green fill — the single accent color in this system
    primary: "bg-primary text-white hover:bg-primary-hover",
    // Neutral gray secondary — no green tint, reads as system control
    secondary:
      "bg-bg-surface text-bg-ink border border-bg-border hover:bg-bg-paper",
    // Ghost — transparent until hovered, minimal affordance
    ghost:
      "bg-transparent text-bg-ink-secondary hover:bg-bg-border/40 hover:text-bg-ink",
    // Danger — full red fill for destructive actions
    danger:
      "bg-status-danger text-white hover:bg-status-danger/90 focus-visible:ring-status-danger",
    // Warning — amber fill for caution actions
    warning:
      "bg-status-warning text-white hover:bg-status-warning/90 focus-visible:ring-status-warning",
  };

  const sizes = {
    sm: "px-2.5 py-1.5 text-[11px] leading-none",
    md: "px-3.5 py-2 text-[13px]",
    lg: "px-5 py-2.5 text-[14px]",
  };

  const combinedClassName = cn(
    baseStyles,
    variants[variant],
    sizes[size],
    className,
  );

  if (href) {
    const anchorProps = props as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        href={href}
        className={combinedClassName}
        target={target}
        rel={rel}
        {...anchorProps}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
};

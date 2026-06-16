import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "block w-full rounded-[6px] border bg-bg-surface text-bg-ink px-3.5 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-1",
          error
            ? "border-status-danger bg-status-danger/[0.04] focus-visible:border-status-danger focus-visible:ring-status-danger"
            : "border-bg-border focus-visible:border-primary focus-visible:ring-primary",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

import React, { forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "block w-full appearance-none rounded-[6px] border bg-bg-surface text-bg-ink pl-3.5 pr-10 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-1",
            error
              ? "border-status-danger bg-status-danger/[0.04] focus-visible:border-status-danger focus-visible:ring-status-danger"
              : "border-bg-border focus-visible:border-primary focus-visible:ring-primary",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-bg-ink-muted">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";

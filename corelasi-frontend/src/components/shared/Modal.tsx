import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  closeOnBackdropClick?: boolean;
  icon?: React.ReactNode;
}

const maxWidthMap = {
  sm: "max-w-[400px]",
  md: "max-w-[450px]",
  lg: "max-w-[500px]",
  xl: "max-w-[600px]",
  "2xl": "max-w-[800px]",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  closeOnBackdropClick = true,
  icon,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg-ink/40 backdrop-blur-[1px]"
        onClick={() => {
          if (closeOnBackdropClick) onClose();
        }}
      />

      {/* Modal Dialog Content */}
      <div
        className={cn(
          "relative w-full bg-bg-surface border border-bg-border rounded-[6px] p-6 shadow-[0_10px_25px_-5px_rgba(20,33,26,0.15)] z-10 animate-in fade-in zoom-in-95 duration-150",
          maxWidthMap[maxWidth],
        )}
      >
        <div className="flex justify-between items-center gap-4 border-b border-bg-border pb-3 mb-4">
          <h3 className="text-[16px] font-bold text-bg-ink leading-tight font-sans flex items-center gap-2">
            {icon && <span className="shrink-0">{icon}</span>}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-bg-ink-muted hover:text-bg-ink transition-colors p-1 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            aria-label="Tutup dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

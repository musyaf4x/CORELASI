import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback UI. If not provided, renders the default error card. */
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // In production: send to error tracking (Sentry, etc.)
    console.error(
      "[ErrorBoundary] Uncaught error:",
      error,
      info.componentStack,
    );
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-[6px] bg-status-danger/10 border border-status-danger/20 text-status-danger mb-4">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-[15px] font-bold text-bg-ink mb-1">
          Terjadi Kesalahan Tidak Terduga
        </h2>
        <p className="text-[13px] text-bg-ink-secondary max-w-[380px] leading-relaxed mb-5">
          {this.state.error?.message ??
            "Halaman mengalami error. Coba muat ulang atau kembali ke halaman sebelumnya."}
        </p>
        <button
          type="button"
          onClick={this.handleReset}
          className="inline-flex items-center gap-2 rounded-[6px] bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary active:scale-[0.98] cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </button>
      </div>
    );
  }
}

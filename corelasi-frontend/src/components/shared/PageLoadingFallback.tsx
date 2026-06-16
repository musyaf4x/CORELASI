import React from "react";

export const PageLoadingFallback: React.FC = () => {
  return (
    <div
      className="space-y-6 animate-pulse motion-reduce:animate-none"
      role="status"
      aria-label="Memuat halaman"
    >
      <div className="space-y-2">
        <div className="h-7 w-52 rounded-md bg-bg-border/70" />
        <div className="h-4 w-80 max-w-full rounded bg-bg-border/50" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-28 rounded-xl border border-bg-border bg-bg-surface"
          />
        ))}
      </div>

      <div className="space-y-4 rounded-xl border border-bg-border bg-bg-surface p-5">
        <div className="h-5 w-40 rounded bg-bg-border/60" />
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-10 rounded-lg bg-bg-border/35" />
          ))}
        </div>
      </div>
      <span className="sr-only">Memuat halaman...</span>
    </div>
  );
};

import React, { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { X } from "lucide-react";
import { PageLoadingFallback } from "@/components/shared/PageLoadingFallback";

export const AppShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-paper">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-bg-ink/40">
          <div className="relative flex w-64 flex-col bg-bg-sage-slate border-r border-bg-border shadow-2xl">
            <div className="absolute top-4.5 right-4 z-50">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="relative p-1 rounded-[6px] text-bg-ink-secondary hover:bg-bg-border/30 hover:text-bg-ink transition-colors cursor-pointer flex items-center justify-center before:content-[''] before:absolute before:inset-[-6px]"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onOverlayClick={() => setMobileMenuOpen(false)} />
          </div>
          {/* Tap outside to close */}
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={<PageLoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

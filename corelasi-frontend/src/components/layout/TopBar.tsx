import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Breadcrumb } from "./Breadcrumb";
import { LogOut, Settings, CheckSquare, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { academicService } from "@/services/academicService";

interface TopbarProps {
  onMenuToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
  const { user, logout, updateAssignments } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [activeSemLabel, setActiveSemLabel] = useState(
    "T.A. 2025/2026 • Ganjil",
  );

  useEffect(() => {
    if (!user) return;
    const fetchActiveSemester = async () => {
      try {
        const semesters = await academicService.getSemester();
        const active = semesters.find((s) => s.status === "aktif");
        if (active) {
          setActiveSemLabel(`T.A. ${active.tahunAjaran} • ${active.name}`);
        } else {
          setActiveSemLabel("Tidak Ada Semester Aktif");
        }
      } catch (err) {
        console.error("Gagal memuat semester aktif di Topbar:", err);
      }
    };
    fetchActiveSemester();
  }, [user]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return "Dashboard Overview";
    if (path.includes("/homeroom")) return "Perwalian Kelas";
    if (path.includes("/duty-attendance")) return "Koreksi Absensi Harian";
    if (path.includes("/profile")) return "Profil Saya";
    return "Sistem Akademik";
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Get active role tag styling
  const getRoleTagStyle = () => {
    return "bg-bg-sage-slate text-primary border-bg-border";
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-bg-border bg-bg-surface px-6">
      <div className="flex items-center space-x-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 rounded-[6px] text-bg-ink-secondary hover:bg-bg-border/30 hover:text-bg-ink transition-colors mr-1 cursor-pointer flex items-center justify-center border border-transparent focus:outline-none"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="flex flex-col space-y-0.5">
          <h2 className="text-[14px] font-bold text-bg-ink leading-tight tracking-tight">
            {getPageTitle()}
          </h2>
          <Breadcrumb />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Active Semester label */}
        <span className="hidden text-xs text-bg-ink-secondary sm:inline-block border-r border-bg-border pr-4">
          {activeSemLabel}
        </span>

        {/* Dynamic Teacher Assignment Chips */}
        {user?.role === "guru" && user.assignments && (
          <div className="hidden items-center space-x-1.5 md:flex">
            {/* Pattern #8: TopbarChip — semantic assignment indicators */}
            {user.assignments.isPengampu && (
              <span className="inline-flex items-center rounded-full bg-primary/[0.09] px-2.5 py-0.5 text-[10px] font-semibold text-primary border border-primary/25 tracking-wide">
                Pengampu
              </span>
            )}
            {user.assignments.isPiketToday && (
              <span className="inline-flex items-center rounded-full bg-status-warning/[0.12] px-2.5 py-0.5 text-[10px] font-semibold text-[#7d440c] border border-status-warning/35 tracking-wide">
                ⚑ Piket Hari Ini
              </span>
            )}
            {user.assignments.isWaliKelas && (
              <span className="inline-flex items-center rounded-full bg-status-success/[0.10] px-2.5 py-0.5 text-[10px] font-semibold text-[#0b5e34] border border-status-success/30 tracking-wide">
                Wali {user.assignments.waliKelasName}
              </span>
            )}

            {/* Pattern #9: ControlAssignmentButton — dev-mode control */}
            <button
              onClick={() => setShowDevPanel(!showDevPanel)}
              className={`relative inline-flex items-center gap-1.5 text-[10px] font-semibold rounded-[6px] px-2.5 py-1 border transition-all active:scale-[0.97] cursor-pointer before:content-[''] before:absolute before:inset-[-6px] ${
                showDevPanel
                  ? "bg-primary/[0.08] text-primary border-primary/30 hover:bg-primary/[0.12]"
                  : "bg-bg-sage-slate/60 text-bg-ink-secondary border-dashed border-bg-border hover:text-primary hover:border-primary/40 hover:bg-primary/[0.05]"
              }`}
              title="Toggle Dev Assignment Control"
            >
              <Settings className="h-3.5 w-3.5" /> Control Penugasan
            </button>
          </div>
        )}

        {/* User Card */}
        {user && (
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-bg-ink">{user.name}</p>
              <span
                className={`inline-block rounded px-1.5 py-0.25 text-[10px] font-medium border ${getRoleTagStyle()}`}
              >
                {user.role.toUpperCase()}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="relative rounded-[6px] p-2 text-bg-ink-secondary hover:bg-bg-paper hover:text-bg-ink transition-colors before:content-[''] before:absolute before:inset-[-6px] active:brightness-90 cursor-pointer"
              aria-label="Keluar dari akun"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Dynamic Teacher Assignment Controls (Dev Panel) */}
        {showDevPanel && user?.role === "guru" && user.assignments && (
          <div className="absolute right-6 top-16 z-50 w-64 border border-bg-border bg-bg-surface p-4 shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded-[6px]">
            <h4 className="text-xs font-bold text-bg-ink mb-3 flex items-center border-b border-bg-border pb-2">
              <CheckSquare className="h-4 w-4 mr-1 text-primary" /> Simulasi
              Penugasan Guru
            </h4>
            <div className="space-y-3">
              <label className="flex items-center text-xs text-bg-ink-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={user.assignments.isPengampu}
                  onChange={(e) =>
                    updateAssignments({
                      ...user.assignments!,
                      isPengampu: e.target.checked,
                    })
                  }
                  className="mr-2 rounded border-bg-border text-primary focus:ring-primary"
                />
                Penugasan Pengampu
              </label>

              <label className="flex items-center text-xs text-bg-ink-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={user.assignments.isPiketToday}
                  onChange={(e) =>
                    updateAssignments({
                      ...user.assignments!,
                      isPiketToday: e.target.checked,
                    })
                  }
                  className="mr-2 rounded border-bg-border text-primary focus:ring-primary"
                />
                Piket Hari Ini
              </label>

              <label className="flex items-center text-xs text-bg-ink-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={user.assignments.isWaliKelas}
                  onChange={(e) =>
                    updateAssignments({
                      ...user.assignments!,
                      isWaliKelas: e.target.checked,
                      waliKelasName: e.target.checked
                        ? "Kelas XI-A"
                        : undefined,
                    })
                  }
                  className="mr-2 rounded border-bg-border text-primary focus:ring-primary"
                />
                Wali Kelas
              </label>
            </div>
            <p className="text-[10px] text-bg-ink-muted mt-3 border-t border-bg-border pt-2">
              *Menu sidebar dan widget dashboard akan berubah secara dinamis
              berdasarkan checkbox di atas.
            </p>
          </div>
        )}
      </div>
    </header>
  );
};

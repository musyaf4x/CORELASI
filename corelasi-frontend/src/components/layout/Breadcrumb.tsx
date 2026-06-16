import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const formatPathname = (name: string) => {
    // Map URL path names to user-friendly titles
    const mapping: Record<string, string> = {
      admin: "Admin",
      guru: "Guru",
      siswa: "Siswa",
      dashboard: "Dashboard",
      homeroom: "Kelas Perwalian",
      "duty-attendance": "Koreksi Absensi",
      profile: "Profil Saya",
      schedules: "Jadwal",
    };
    return mapping[name] || name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <nav
      className="flex items-center space-x-1 text-xs text-bg-ink-secondary"
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        aria-label="Beranda"
        className="flex items-center hover:text-bg-ink transition-colors focus-visible:outline-none focus-visible:underline"
      >
        <Home className="h-3 w-3" />
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3 w-3 text-bg-border-muted shrink-0" />
            {isLast ? (
              <span
                className="font-medium text-bg-ink truncate max-w-[120px] sm:max-w-[200px]"
                aria-current="page"
              >
                {formatPathname(value)}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-bg-ink transition-colors truncate max-w-[120px] focus-visible:outline-none focus-visible:underline"
              >
                {formatPathname(value)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

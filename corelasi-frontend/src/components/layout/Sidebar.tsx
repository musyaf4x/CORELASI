import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Building,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  UserCheck,
  BarChart3,
  TrendingUp,
  FolderSearch,
  FileBarChart,
  BookOpen,
  BookOpenCheck,
  User,
  BookMarked,
  FileCheck2,
  Award,
} from "lucide-react";

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

interface SidebarProps {
  className?: string;
  onOverlayClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  onOverlayClick,
}) => {
  const { user } = useAuth();

  if (!user) return null;

  const getAdminMenu = (): MenuSection[] => [
    {
      title: "KBM & Monitoring",
      items: [
        {
          title: "Dashboard",
          path: "/admin/dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          title: "Pengguna",
          path: "/admin/users",
          icon: <Users className="h-4 w-4" />,
        },
        {
          title: "Struktur Akademik",
          path: "/admin/academic",
          icon: <Building className="h-4 w-4" />,
        },
        {
          title: "Jadwal Belajar",
          path: "/admin/schedules",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          title: "Jadwal Piket",
          path: "/admin/duty-schedules",
          icon: <CalendarDays className="h-4 w-4" />,
        },
        {
          title: "Absensi",
          path: "/admin/attendance",
          icon: <ClipboardCheck className="h-4 w-4" />,
        },
        {
          title: "Monitoring Jurnal",
          path: "/admin/journals",
          icon: <BookOpenCheck className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Laporan & Analisis",
      items: [
        {
          title: "Rekap Operasional",
          path: "/admin/reports/operational",
          icon: <BarChart3 className="h-4 w-4" />,
        },
        {
          title: "Rekap Absensi",
          path: "/admin/reports/attendance",
          icon: <FolderSearch className="h-4 w-4" />,
        },
        {
          title: "Rekap Nilai",
          path: "/admin/reports/grades",
          icon: <FileBarChart className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Akun",
      items: [
        {
          title: "Profil Saya",
          path: "/admin/profile",
          icon: <User className="h-4 w-4" />,
        },
      ],
    },
  ];

  const getGuruMenu = (): MenuSection[] => {
    const sections: MenuSection[] = [
      {
        title: "KBM Mandiri",
        items: [
          {
            title: "Dashboard",
            path: "/guru/dashboard",
            icon: <LayoutDashboard className="h-4 w-4" />,
          },
          {
            title: "Jadwal Saya",
            path: "/guru/schedules",
            icon: <Calendar className="h-4 w-4" />,
          },
          {
            title: "Kelas Saya",
            path: "/guru/classes",
            icon: <Building className="h-4 w-4" />,
          },
          {
            title: "Absensi Kelas",
            path: "/guru/attendance",
            icon: <ClipboardList className="h-4 w-4" />,
          },
          {
            title: "Materi",
            path: "/guru/materials",
            icon: <BookMarked className="h-4 w-4" />,
          },
          {
            title: "Tugas",
            path: "/guru/assignments",
            icon: <FileCheck2 className="h-4 w-4" />,
          },
          {
            title: "Penilaian",
            path: "/guru/grading",
            icon: <Award className="h-4 w-4" />,
          },
          {
            title: "Nilai Manual",
            path: "/guru/manual-grading",
            icon: <FileBarChart className="h-4 w-4" />,
          },
          {
            title: "Jurnal Pertemuan",
            path: "/guru/journals",
            icon: <BookOpen className="h-4 w-4" />,
          },
        ],
      },
      {
        title: "Laporan KBM",
        items: [
          {
            title: "Rekap Kelas Diampu",
            path: "/guru/reports/classes",
            icon: <TrendingUp className="h-4 w-4" />,
          },
        ],
      },
    ];

    if (user.assignments?.isPiketToday) {
      sections.push({
        title: "Tugas Piket",
        items: [
          {
            title: "Koreksi Absensi",
            path: "/guru/duty-attendance",
            icon: <UserCheck className="h-4 w-4" />,
          },
          {
            title: "Rekap Absensi Piket",
            path: "/guru/reports/duty-attendance",
            icon: <FolderSearch className="h-4 w-4" />,
          },
        ],
      });
    }

    if (user.assignments?.isWaliKelas) {
      sections.push({
        title: "Kelas Perwalian",
        items: [
          {
            title: "Kelas Perwalian",
            path: "/guru/homeroom",
            icon: <Users className="h-4 w-4" />,
          },
          {
            title: "Laporan Perwalian",
            path: "/guru/reports/homeroom",
            icon: <ClipboardCheck className="h-4 w-4" />,
          },
        ],
      });
    }

    sections.push({
      title: "Akun",
      items: [
        {
          title: "Profil Saya",
          path: "/guru/profile",
          icon: <User className="h-4 w-4" />,
        },
      ],
    });

    return sections;
  };

  const getSiswaMenu = (): MenuSection[] => [
    {
      title: "KBM Mandiri",
      items: [
        {
          title: "Dashboard",
          path: "/siswa/dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          title: "Jadwal Saya",
          path: "/siswa/schedules",
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          title: "Pembelajaran",
          path: "/siswa/learning",
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          title: "Tugas",
          path: "/siswa/assignments",
          icon: <FileCheck2 className="h-4 w-4" />,
        },
        {
          title: "Nilai Saya",
          path: "/siswa/grades",
          icon: <Award className="h-4 w-4" />,
        },
        {
          title: "Absensi Saya",
          path: "/siswa/attendance",
          icon: <ClipboardCheck className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Akun",
      items: [
        {
          title: "Profil Saya",
          path: "/siswa/profile",
          icon: <User className="h-4 w-4" />,
        },
      ],
    },
  ];

  const getMenuSections = (): MenuSection[] => {
    switch (user.role) {
      case "admin":
        return getAdminMenu();
      case "guru":
        return getGuruMenu();
      case "siswa":
        return getSiswaMenu();
      default:
        return [];
    }
  };

  const menuSections = getMenuSections();

  return (
    <aside
      className={`w-64 flex-col bg-[#eef0f3] text-bg-ink-secondary select-none border-r border-bg-border-sidebar shrink-0 ${className || "flex"}`}
    >
      <div className="flex h-16 items-center justify-center border-b border-bg-border-sidebar px-6">
        <div className="flex items-center space-x-2 text-bg-ink">
          <img
            src="/corelasi-02.png"
            alt=""
            width="28"
            height="28"
            className="h-7 w-7"
          />
          <span className="text-lg font-bold tracking-tight">CORELASI</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            {section.title && (
              <h4 className="px-3 text-[9px] font-bold uppercase tracking-wider text-bg-ink-muted">
                {section.title}
              </h4>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onOverlayClick}
                  className={({ isActive }) =>
                    `relative flex items-center space-x-3 rounded-[6px] px-3 py-2 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                      isActive
                        ? "bg-primary/[0.08] text-primary border border-primary/20 before:content-[''] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-primary before:rounded-r-full"
                        : "text-bg-ink-secondary hover:bg-[#e3e6ea] hover:text-bg-ink border border-transparent"
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-bg-border-sidebar p-4 text-[10px] text-bg-ink-muted text-center">
        © 2026 CORELASI Web
      </div>
    </aside>
  );
};

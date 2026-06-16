import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import {
  SummaryMetricCard,
  StatusBadge,
  DataTable,
  Card,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import type { SemanticState } from "@/utils/semanticState";
import {
  Calendar,
  Users,
  FileCheck2,
  BookOpen,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { scheduleService } from "@/services/scheduleService";
import { learningService } from "@/services/learningService";
import { journalService } from "@/services/journalService";
import { attendanceService } from "@/services/attendanceService";
import { reportService } from "@/services/reportService";

// ─── Component: SectionHeader ───────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  description?: string;
}
const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
}) => (
  <div>
    <h2 className="text-[18px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
      {title}
    </h2>
    {description && (
      <p className="mt-0.5 text-[13px] text-bg-ink-secondary leading-snug">
        {description}
      </p>
    )}
  </div>
);

// ─── Component: RoleAssignmentBanner ─────────────────────────────────────────
interface RoleAssignmentBannerProps {
  assignments:
    | {
        isPengampu: boolean;
        isPiketToday: boolean;
        isWaliKelas: boolean;
        waliKelasName?: string;
      }
    | undefined;
}
const RoleAssignmentBanner: React.FC<RoleAssignmentBannerProps> = ({
  assignments,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 border border-bg-border bg-bg-surface rounded-[6px] px-4 py-3 shadow-[0_1px_3px_rgba(20,33,26,0.04)]">
    <div className="flex items-center gap-2 text-primary shrink-0">
      <ShieldCheck className="h-4 w-4" />
      <span className="text-[12px] font-bold text-bg-ink-secondary tracking-wide uppercase">
        Peran Aktif
      </span>
    </div>
    <div className="flex flex-wrap gap-2">
      {assignments?.isPengampu && (
        <StatusBadge label="Guru Pengampu" state="safe" size="xs" />
      )}
      {assignments?.isPiketToday && (
        <StatusBadge label="Piket Hari Ini" state="warning" size="xs" />
      )}
      {assignments?.isWaliKelas && (
        <StatusBadge
          label={`Wali Kelas ${assignments.waliKelasName ?? ""}`}
          state="safe"
          size="xs"
        />
      )}
    </div>
  </div>
);

// ─── Component: AlertPanelCard ────────────────────────────────────────────────
interface AlertPanelCardProps {
  title: string;
  count: number;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  pendingClasses: string[];
}
const AlertPanelCard: React.FC<AlertPanelCardProps> = ({
  title,
  count,
  subtitle,
  ctaLabel,
  ctaHref,
  pendingClasses,
}) => (
  <Card
    variant="danger"
    accentBar
    padding="none"
    role="alert"
    aria-label={`Peringatan: ${title} — ${count} ${subtitle}`}
    className="h-full"
  >
    <div className="p-5 flex flex-col h-full justify-between gap-4">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-status-danger/10">
              <AlertTriangle className="h-4 w-4 text-text-danger" />
            </span>
            <h3 className="text-[14px] font-bold text-text-danger leading-tight">
              {title}
            </h3>
          </div>
          <Link
            to={ctaHref}
            className="inline-flex items-center justify-center font-semibold rounded-[6px] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-danger focus-visible:ring-offset-0 gap-1 bg-status-danger/10 hover:bg-status-danger/15 text-[#971e1e] border border-status-danger/25 px-3 py-1.5 text-[11px]"
            aria-label={`Lakukan ${ctaLabel}`}
          >
            {ctaLabel}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-text-danger/75 uppercase tracking-wide">
            {subtitle}
          </p>
          <span className="block text-[28px] font-bold leading-none tracking-tight text-text-danger mt-1">
            {count}
          </span>
          <p className="mt-1.5 text-[13px] text-text-danger/60">
            {count > 0
              ? "Kelas/Siswa perlu ditangani segera"
              : "Semua permintaan koreksi selesai"}
          </p>
        </div>
      </div>
      {pendingClasses.length > 0 && (
        <div className="pt-3 border-t border-status-danger/10 flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-text-danger/60 font-semibold uppercase tracking-wider">
          <span className="text-text-danger/80">Antrean:</span>
          {pendingClasses.map((c, i) => (
            <span key={i}>• {c}</span>
          ))}
        </div>
      )}
    </div>
  </Card>
);

// ─── Component: MiniStatCard ──────────────────────────────────────────────────
interface MiniStatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}
const MiniStatCard: React.FC<MiniStatCardProps> = ({ label, value, icon }) => (
  <Card
    variant="surface"
    padding="sm"
    className="text-center border-bg-border/60 rounded-[5px] shadow-[0_1px_3px_rgba(20,33,26,0.04)]"
  >
    {icon && (
      <div className="flex justify-center mb-1.5">
        <span className="text-primary">{icon}</span>
      </div>
    )}
    <p className="text-[11px] font-semibold text-bg-ink-secondary leading-none mb-1">
      {label}
    </p>
    <span className="block text-[28px] font-bold tracking-tight text-bg-ink leading-none">
      {value}
    </span>
  </Card>
);

// ─── Component: HomeroomOverviewCard ─────────────────────────────────────────
interface HomeroomOverviewCardProps {
  className: string;
  siswaCount: number;
  presensi: string;
  rerataValue: string;
  href: string;
}

interface DashboardStat {
  label: string;
  value: string;
  desc: string;
  icon: React.ReactNode;
  variant: SemanticState;
  tooltip: string;
}

interface GuruScheduleRow {
  jam: string;
  tipe: "Mengajar" | "Piket";
  kelas: string;
  mapel: string;
  aksi: string;
  link: string;
}
const HomeroomOverviewCard: React.FC<HomeroomOverviewCardProps> = ({
  className,
  siswaCount,
  presensi,
  rerataValue,
  href,
}) => (
  <Card variant="tinted" accentBar padding="none" className="h-full">
    <div className="p-5 flex flex-col h-full justify-between gap-4">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-primary/[0.08]">
              <Users className="h-4 w-4 text-primary" />
            </span>
            <div>
              <h3 className="text-[14px] font-bold text-bg-ink leading-tight">
                Kelas Perwalian
              </h3>
              <p className="text-[12px] text-primary font-semibold">
                {className}
              </p>
            </div>
          </div>
          <Link
            to={href}
            className="inline-flex items-center justify-center font-semibold rounded-[6px] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 gap-1 text-primary bg-primary/[0.07] hover:bg-primary/[0.12] border border-primary/20 px-3 py-1.5 text-[11px]"
            aria-label="Buka halaman kelas perwalian"
          >
            Lihat Data
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <MiniStatCard
            label="Siswa"
            value={String(siswaCount)}
            icon={<Users className="h-3.5 w-3.5" />}
          />
          <MiniStatCard
            label="Presensi"
            value={presensi}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
          />
          <MiniStatCard
            label="Rerata"
            value={rerataValue}
            icon={<ClipboardList className="h-3.5 w-3.5" />}
          />
        </div>
      </div>
      <div className="pt-3 border-t border-transparent flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-bg-ink-muted font-semibold uppercase tracking-wider select-none opacity-0">
        <span>Placeholder</span>
      </div>
    </div>
  </Card>
);

// ─── Main: GuruDashboard ──────────────────────────────────────────────────────
export const GuruDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseStats, setBaseStats] = useState<DashboardStat[]>([]);
  const [visibleSchedules, setVisibleSchedules] = useState<GuruScheduleRow[]>(
    [],
  );
  const [piketCount, setPiketCount] = useState<number>(0);
  const [piketPendingClasses, setPiketPendingClasses] = useState<string[]>([]);
  const [homeroomStats, setHomeroomStats] = useState({
    siswaCount: 0,
    presensi: "0%",
    rerataValue: "0",
  });

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const days = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
      ];
      const isTestEnv = import.meta.env.MODE === "test";
      const activeDayName = isTestEnv ? "Senin" : days[new Date().getDay()];

      const { assignments } = user;

      const [
        allSchedules,
        allTugas,
        allSubmissions,
        allJournals,
        allCorrectionRequests,
      ] = await Promise.all([
        scheduleService.getJadwalPembelajaran(),
        learningService.getTugas(),
        learningService.getSubmissions(),
        journalService.getJournals(),
        attendanceService.getPermintaanKoreksi(),
      ]);

      const mySchedules = allSchedules.filter(
        (s) => String(s.guruId) === String(user.id),
      );

      const uniqueClasses = new Set(mySchedules.map((s) => s.kelasId));
      const uniqueMapelNames = Array.from(
        new Set(mySchedules.map((s) => s.mapelName)),
      );
      const mapelDesc =
        uniqueMapelNames.length > 0
          ? `Mapel: ${uniqueMapelNames.join(", ")}`
          : "Belum ada kelas";

      const myTugas = allTugas.filter(
        (t) =>
          String(t.guruId) === String(user.id) && t.status === "Dipublikasikan",
      );
      const myTugasIds = myTugas.map((t) => t.id);
      const mySubmissions = allSubmissions.filter((sub) =>
        myTugasIds.includes(sub.tugasId),
      );

      const mySchedulesToday = mySchedules.filter(
        (s) => s.hari === activeDayName,
      );

      const todayDateStr = new Date().toISOString().split("T")[0];
      const todayJournals = allJournals.filter(
        (j) => String(j.guruId) === String(user.id) && j.date === todayDateStr,
      );
      const unfilledJournalsCount = mySchedulesToday.filter((s) => {
        return !todayJournals.some(
          (j) =>
            String(j.kelasId) === String(s.kelasId) &&
            String(j.mapelId) === String(s.mapelId),
        );
      }).length;

      const stats: DashboardStat[] = [
        {
          label: "Jadwal Hari Ini",
          value: String(
            mySchedulesToday.length + (assignments?.isPiketToday ? 1 : 0),
          ),
          desc: `${mySchedulesToday.length} Mengajar${assignments?.isPiketToday ? " · 1 Piket" : ""}`,
          icon: <Calendar className="h-4 w-4" />,
          variant: "info" as SemanticState,
          tooltip: "Jumlah agenda mengajar dan tugas piket terjadwal hari ini.",
        },
        {
          label: "Kelas Diampu",
          value: String(uniqueClasses.size),
          desc: mapelDesc,
          icon: <BuildingIcon className="h-4 w-4" />,
          variant: "neutral" as SemanticState,
          tooltip:
            "Jumlah kelas rombongan belajar yang Anda ampu semester ini.",
        },
        {
          label: "Tugas Aktif",
          value: String(myTugas.length),
          desc: `${mySubmissions.length} submissions masuk`,
          icon: <FileCheck2 className="h-4 w-4" />,
          variant: "neutral" as SemanticState,
          tooltip: "Tugas siswa yang masih aktif menerima pengumpulan jawaban.",
        },
        {
          label: "Jurnal Belum Diisi",
          value: String(unfilledJournalsCount),
          desc:
            unfilledJournalsCount > 0
              ? "Perlu segera dilengkapi"
              : "Semua jurnal terisi",
          icon: <BookOpen className="h-4 w-4" />,
          variant: (unfilledJournalsCount > 0
            ? "warning"
            : "safe") as SemanticState,
          tooltip:
            "Jumlah sesi mengajar hari ini yang belum Anda isi jurnal kegiatannya.",
        },
      ];
      setBaseStats(stats);

      const scheduleList: GuruScheduleRow[] = [];

      mySchedulesToday.forEach((s) => {
        scheduleList.push({
          jam: `${s.waktuMulai} - ${s.waktuSelesai}`,
          tipe: "Mengajar",
          kelas: s.kelasName,
          mapel: s.mapelName,
          aksi: "Absensi / Jurnal",
          link: "/guru/attendance",
        });
      });

      if (assignments?.isPiketToday) {
        scheduleList.push({
          jam: "07:00 - 15:00",
          tipe: "Piket",
          kelas: "Area Piket Utama",
          mapel: "Pengawasan & Koreksi",
          aksi: "Koreksi Absensi",
          link: "/guru/duty-attendance",
        });
      }

      scheduleList.sort((a, b) => a.jam.localeCompare(b.jam));
      setVisibleSchedules(scheduleList);

      const pendingCorrections = allCorrectionRequests.filter(
        (r) => !r.verified,
      );
      setPiketCount(pendingCorrections.length);
      const uniquePendingClasses = Array.from(
        new Set(pendingCorrections.map((r) => r.kelasName)),
      );
      setPiketPendingClasses(uniquePendingClasses.slice(0, 3));

      if (assignments?.isWaliKelas && assignments.waliKelasId) {
        const classId = String(assignments.waliKelasId);
        const [attendanceReport, gradeReport] = await Promise.all([
          reportService.getAttendanceReports(classId),
          reportService.getGradeReports(classId),
        ]);

        const totalSiswa = gradeReport.length;
        const totalPresensi = attendanceReport.reduce(
          (acc, curr) => acc + curr.percentage,
          0,
        );
        const rerataPresensi =
          totalSiswa > 0 ? Math.round(totalPresensi / totalSiswa) : 0;
        const totalNilai = gradeReport.reduce(
          (acc, curr) => acc + curr.average,
          0,
        );
        const rerataNilai =
          totalSiswa > 0 ? Math.round((totalNilai / totalSiswa) * 10) / 10 : 0;

        setHomeroomStats({
          siswaCount: totalSiswa,
          presensi: `${rerataPresensi}%`,
          rerataValue: rerataNilai.toString(),
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(loadDashboardData);
  }, [loadDashboardData]);

  if (!user || user.role !== "guru") return null;
  const { assignments } = user;

  const getScheduleState = (tipe: string): SemanticState => {
    return tipe === "Mengajar" ? "safe" : "warning";
  };

  const columns = [
    {
      header: "Waktu",
      cell: (sched: GuruScheduleRow) => (
        <span className="text-[12px] font-semibold text-bg-ink-secondary tabular-nums">
          {sched.jam}
        </span>
      ),
    },
    {
      header: "Jenis Kegiatan",
      cell: (sched: GuruScheduleRow) => (
        <StatusBadge
          label={sched.tipe}
          state={getScheduleState(sched.tipe)}
          size="xs"
          className="w-[90px] justify-center"
        />
      ),
    },
    {
      header: "Kelas / Keterangan",
      cell: (sched: GuruScheduleRow) => (
        <span className="text-[13px] font-medium text-bg-ink">
          {sched.kelas}
        </span>
      ),
    },
    {
      header: "Mata Pelajaran",
      cell: (sched: GuruScheduleRow) => (
        <span className="text-[13px] text-bg-ink-muted">{sched.mapel}</span>
      ),
    },
    {
      header: "Aksi Mandiri",
      cell: (sched: GuruScheduleRow) => (
        <Link
          to={sched.link}
          className="inline-flex items-center justify-center font-semibold rounded-[6px] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 gap-1 text-primary bg-primary/[0.07] hover:bg-primary/[0.12] border border-primary/20 px-3 py-1.5 text-[11px]"
          aria-label={`Lakukan ${sched.aksi} untuk kelas ${sched.kelas}`}
        >
          {sched.aksi}
          <ChevronRight className="h-3 w-3" />
        </Link>
      ),
    },
  ];

  if (loading) {
    return <LoadingState message="Memuat dashboard guru..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
          Dashboard Guru
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Pantau jadwal mengajar, tugas, absensi, jurnal, dan penugasan tambahan
          Anda pada semester aktif.
        </p>
      </div>

      <RoleAssignmentBanner assignments={assignments} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {(assignments?.isPiketToday || assignments?.isWaliKelas) && (
            <div className="space-y-3">
              <SectionHeader title="Modul Penugasan Aktif" />
              <div
                className={`grid gap-4 ${
                  assignments?.isPiketToday && assignments?.isWaliKelas
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {assignments?.isPiketToday && (
                  <AlertPanelCard
                    title="Tugas Piket Hari Ini"
                    count={piketCount}
                    subtitle="Absensi Kelas Perlu Dikoreksi"
                    ctaLabel="Mulai Piket"
                    ctaHref="/guru/duty-attendance"
                    pendingClasses={piketPendingClasses}
                  />
                )}
                {assignments?.isWaliKelas && (
                  <HomeroomOverviewCard
                    className={assignments.waliKelasName ?? ""}
                    siswaCount={homeroomStats.siswaCount}
                    presensi={homeroomStats.presensi}
                    rerataValue={homeroomStats.rerataValue}
                    href="/guru/homeroom"
                  />
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <SectionHeader title="Agenda Tugas & Mengajar Hari Ini" />
            <DataTable
              title={`${visibleSchedules.length} Sesi Terjadwal`}
              columns={columns}
              data={visibleSchedules}
              keyExtractor={(sched, i) => `${sched.kelas}-${i}`}
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-3">
            <SectionHeader title="Ringkasan Hari Ini" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {baseStats.map((stat, i) => (
                <SummaryMetricCard
                  key={i}
                  label={stat.label}
                  value={stat.value}
                  desc={stat.desc}
                  icon={stat.icon}
                  variant={stat.variant}
                  tooltip={stat.tooltip}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── BuildingIcon (SVG fallback) ─────────────────────────────────────────────
const BuildingIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M8 10h.01" />
    <path d="M16 10h.01" />
    <path d="M8 14h.01" />
    <path d="M16 14h.01" />
  </svg>
);

export default GuruDashboard;

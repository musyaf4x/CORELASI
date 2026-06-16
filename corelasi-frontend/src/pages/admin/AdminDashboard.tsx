import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  ClipboardCheck,
  BookOpen,
  Layers,
  Building,
} from "lucide-react";
import {
  SummaryMetricCard,
  StatusBadge,
  DataTable,
  Card,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import type { SemanticState } from "@/utils/semanticState";
import { userService } from "@/services/userService";
import { academicService } from "@/services/academicService";
import { scheduleService } from "@/services/scheduleService";
import { attendanceService } from "@/services/attendanceService";
import { journalService } from "@/services/journalService";
import { getActiveDateString } from "@/utils/student";

const getAbsensiState = (status: string): SemanticState => {
  if (status === "Hadir") return "safe";
  if (status === "Perlu Ditinjau") return "warning";
  if (status === "Belum Mengisi") return "danger"; // not submitted — blocking
  return "neutral";
};

const getJurnalState = (status: string): SemanticState => {
  if (status === "Sudah Diisi") return "safe";
  if (status === "Belum Diisi") return "danger"; // not filled — actionable problem
  return "neutral";
};

const isTimeActive = (waktu: string): boolean => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parts = waktu.split(" - ");
  if (parts.length !== 2) return false;

  const [startStr, endStr] = parts;
  const [startHour, startMin] = startStr.split(":").map(Number);
  const [endHour, endMin] = endStr.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

interface DailyOperation {
  kelas: string;
  mapel: string;
  guru: string;
  waktu: string;
  absensi: string;
  jurnal: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalUsers, setTotalUsers] = useState(0);
  const [semesterName, setSemesterName] = useState("-");
  const [tahunAjaran, setTahunAjaran] = useState("-");
  const [totalClasses, setTotalClasses] = useState(0);

  const [operationalStats, setOperationalStats] = useState<
    Array<{
      label: string;
      value: string;
      desc: string;
      icon: React.ReactNode;
      variant: SemanticState;
      tooltip: string;
    }>
  >([]);

  const [dailyOperations, setDailyOperations] = useState<DailyOperation[]>([]);

  const loadDashboardData = async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const activeDayName = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        timeZone: "Asia/Jakarta",
      }).format(new Date());
      const todayDateStr = getActiveDateString();

      // Fetch stats
      const [
        users,
        semesters,
        classes,
        allSchedules,
        allAttendance,
        allJournals,
        correctionRequests,
      ] = await Promise.all([
        userService.getAll(),
        academicService.getSemester(),
        academicService.getKelas(),
        scheduleService.getJadwalPembelajaran(),
        attendanceService.getAbsensiSiswa(),
        journalService.getJournals(),
        attendanceService.getPermintaanKoreksi(),
      ]);

      // 1. Core structural metrics
      setTotalUsers(users.length);
      setTotalClasses(classes.length);
      const activeSem = semesters.find((s) => s.status === "aktif");
      if (activeSem) {
        setSemesterName(activeSem.name);
        setTahunAjaran(`T.A. ${activeSem.tahunAjaran}`);
      }

      // 2. Today's schedules
      const todaySchedules = allSchedules.filter(
        (s) => s.hari === activeDayName,
      );

      // 3. Pending corrections (unverified)
      const pendingCorrections = correctionRequests.filter((r) => !r.verified);

      // 4. Journals filled today
      const todayJournals = allJournals.filter((j) => j.date === todayDateStr);

      // 5. Unfilled journals for today's active schedules
      const unfilledJournalsCount = todaySchedules.filter((s) => {
        return !todayJournals.some(
          (j) =>
            String(j.kelasId) === String(s.kelasId) &&
            String(j.mapelId) === String(s.mapelId),
        );
      }).length;

      // 6. Build operational stats
      setOperationalStats([
        {
          label: "Jadwal Hari Ini",
          value: String(todaySchedules.length),
          desc: `${todaySchedules.length} sesi aktif`,
          icon: <Calendar className="h-4 w-4" />,
          variant: "info" as SemanticState,
          tooltip: "Sesi kegiatan belajar mengajar yang dijadwalkan hari ini.",
        },
        {
          label: "Absensi Perlu Ditinjau",
          value: String(pendingCorrections.length),
          desc: `${Array.from(new Set(pendingCorrections.map((c) => c.kelasId))).length} kelas mengajukan`,
          icon: <ClipboardCheck className="h-4 w-4" />,
          variant: "warning" as SemanticState,
          tooltip:
            "Jumlah pengajuan koreksi presensi siswa yang belum divalidasi oleh piket.",
        },
        {
          label: "Jurnal Belum Lengkap",
          value: String(unfilledJournalsCount),
          desc: "Sesi pertemuan hari ini",
          icon: <BookOpen className="h-4 w-4" />,
          variant: "danger" as SemanticState,
          tooltip:
            "Kelas aktif hari ini yang guru pengampunya belum mengisi jurnal pertemuan.",
        },
      ]);

      // 7. Dynamic daily operations table rows
      const ops = todaySchedules.map((s) => {
        // Find if any student attendance records exist for this class & mapel today
        const classAttendance = allAttendance.filter(
          (a) =>
            String(a.kelasId) === String(s.kelasId) &&
            String(a.mapelId) === String(s.mapelId) &&
            a.tanggal === todayDateStr,
        );

        let absensiStatus = "Belum Mengisi";
        if (classAttendance.length > 0) {
          // Check if there are any unverified correction requests for this class & mapel today
          const classCorrections = pendingCorrections.filter(
            (c) =>
              String(c.kelasId) === String(s.kelasId) &&
              String(c.mapelName) === String(s.mapelName) &&
              c.tanggal === todayDateStr,
          );
          if (classCorrections.length > 0) {
            absensiStatus = "Perlu Ditinjau";
          } else {
            absensiStatus = "Hadir";
          }
        }

        // Check journal status
        const journalFilled = todayJournals.some(
          (j) =>
            String(j.kelasId) === String(s.kelasId) &&
            String(j.mapelId) === String(s.mapelId),
        );

        return {
          kelas: s.kelasName,
          mapel: s.mapelName,
          guru: s.guruName,
          waktu: `${s.waktuMulai} - ${s.waktuSelesai}`,
          absensi: absensiStatus,
          jurnal: journalFilled ? "Sudah Diisi" : "Belum Diisi",
        };
      });

      // Sort by waktu (start hour)
      ops.sort((a, b) => a.waktu.localeCompare(b.waktu));
      setDailyOperations(ops);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data dashboard admin.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadDashboardData);
  }, []);

  // Semantic variant grammar applied:
  //   neutral  → stable structural counts (Total Pengguna, Semester Aktif, Total Kelas)
  //   info     → passively informational system facts (Jadwal Hari Ini — schedule just is)
  //   warning  → submitted but needs review (Absensi Perlu Ditinjau)
  //   danger   → blocking, overdue (Jurnal Belum Lengkap — teachers haven't acted)
  const academicStats: Array<{
    label: string;
    value: string;
    desc: string;
    icon: React.ReactNode;
    variant: SemanticState;
    tooltip: string;
  }> = [
    {
      label: "Total Pengguna",
      value: String(totalUsers),
      desc: "Akun terdaftar",
      icon: <Users className="h-4 w-4" />,
      variant: "neutral",
      tooltip:
        "Jumlah seluruh akun aktif guru dan siswa yang terdaftar pada sistem.",
    },
    {
      label: "Semester Aktif",
      value: semesterName,
      desc: tahunAjaran,
      icon: <Layers className="h-4 w-4" />,
      variant: "neutral",
      tooltip: `Semester ${semesterName} ${tahunAjaran}. Periode aktif saat ini.`,
    },
    {
      label: "Total Kelas",
      value: String(totalClasses),
      desc: "Rombongan belajar",
      icon: <Building className="h-4 w-4" />,
      variant: "neutral",
      tooltip: "Jumlah rombongan belajar aktif pada tingkat X, XI, dan XII.",
    },
  ];

  const quickActions = [
    {
      title: "Tambah Pengguna",
      desc: "Buat akun Guru/Siswa baru",
      path: "/admin/users/create",
    },
    {
      title: "Atur Semester Aktif",
      desc: "Mulai tahun ajaran baru",
      path: "/admin/academic",
    },
    {
      title: "Buat Jadwal Belajar",
      desc: "Atur agenda sesi kelas",
      path: "/admin/schedules",
    },
    {
      title: "Lihat Rekap Absensi",
      desc: "Ekspor rekap tingkat sekolah",
      path: "/admin/reports/attendance",
    },
    {
      title: "Monitoring Jurnal",
      desc: "Tinjau status isi jurnal Guru",
      path: "/admin/journals",
    },
  ];

  const columns = [
    {
      header: "Kelas",
      cell: (op: DailyOperation) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {op.kelas}
        </span>
      ),
    },
    {
      header: "Mata Pelajaran",
      cell: (op: DailyOperation) => (
        <span className="text-[13px] font-medium text-bg-ink">{op.mapel}</span>
      ),
    },
    {
      header: "Guru",
      cell: (op: DailyOperation) => (
        <span className="text-[13px] text-bg-ink-secondary">{op.guru}</span>
      ),
    },
    {
      header: "Waktu",
      cell: (op: DailyOperation) => {
        const active = isTimeActive(op.waktu);
        return (
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-bg-ink-secondary tabular-nums">
              {op.waktu}
            </span>
            {active && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-[4px] animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Aktif
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Status Absensi",
      className: "text-center pr-0",
      width: "140px",
      cell: (op: DailyOperation) => (
        <div className="flex justify-center">
          <StatusBadge
            label={op.absensi}
            state={getAbsensiState(op.absensi)}
            className="w-[115px] justify-center"
          />
        </div>
      ),
    },
    {
      header: "Status Jurnal",
      className: "text-center pr-0",
      width: "140px",
      cell: (op: DailyOperation) => (
        <div className="flex justify-center">
          <StatusBadge
            label={op.jurnal}
            state={getJurnalState(op.jurnal)}
            className="w-[115px] justify-center"
          />
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingState message="Memuat dashboard admin..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-[-0.5px] text-bg-ink font-sans">
          Dashboard Admin
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Pantau data inti, aktivitas akademik, dan operasional semester aktif.
        </p>
      </div>

      {/* ── Main Layout Grid: Main content + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main content (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Operational Monitoring Stats ── */}
          <div className="space-y-3">
            <h2 className="text-[18px] font-bold leading-tight tracking-[-0.1px] text-bg-ink font-sans">
              Monitoring Operasional Hari Ini
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {operationalStats.map((stat, i) => (
                <SummaryMetricCard key={i} {...stat} />
              ))}
            </div>
          </div>

          {/* Daily Operations Panel using shared DataTable */}
          <DataTable
            title="Ringkasan Operasional Hari Ini"
            columns={columns}
            data={dailyOperations}
            keyExtractor={(op) => op.kelas + "-" + op.mapel}
            rowClassName={(op) =>
              isTimeActive(op.waktu) ? "bg-primary/[0.04]" : ""
            }
          />
        </div>

        {/* Right sidebar content (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* ── Academic Stats (stacked vertically) ── */}
          <div className="space-y-3">
            <h2 className="text-[18px] font-bold leading-tight tracking-[-0.1px] text-bg-ink font-sans">
              Ikhtisar Data Akademik
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {academicStats.map((stat, i) => (
                <SummaryMetricCard key={i} {...stat} />
              ))}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <Card variant="subtle">
            <h3 className="text-[14px] font-bold tracking-tight text-bg-ink mb-4 font-sans">
              Aksi Cepat
            </h3>
            <div className="space-y-2.5">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="w-full text-left p-3 border border-bg-border/60 bg-bg-surface hover:border-primary/30 hover:bg-primary/[0.02] rounded-[6px] transition-all focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.99] cursor-pointer group flex items-center justify-between"
                >
                  <div>
                    <span className="text-[13px] font-bold text-bg-ink group-hover:text-primary transition-colors font-sans block">
                      {action.title}
                    </span>
                    <p className="text-[11px] text-bg-ink-secondary mt-0.5 leading-normal">
                      {action.desc}
                    </p>
                  </div>
                  <span className="text-bg-ink-muted group-hover:text-primary group-hover:translate-x-1 transition-all text-xs font-bold font-mono">
                    →
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

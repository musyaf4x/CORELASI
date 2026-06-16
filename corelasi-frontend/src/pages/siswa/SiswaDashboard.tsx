import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  Sparkles,
  Clock,
} from "lucide-react";
import {
  SummaryMetricCard,
  StatusBadge,
  DataTable,
  Card,
  LoadingState,
} from "@/components/shared";
import type { SemanticState } from "@/utils/semanticState";

import { useAuth } from "@/hooks/useAuth";
import { attendanceService } from "@/services/attendanceService";
import { learningService } from "@/services/learningService";
import { scheduleService } from "@/services/scheduleService";
import { getSiswaKelasId, getActiveDateString } from "@/utils/student";

interface StudentScheduleRow {
  jam: string;
  mapel: string;
  guru: string;
  ruang: string;
  status: string;
}

interface StudentAssignmentCard {
  id: string;
  mapel: string;
  batas: string;
  judul: string;
  desc: string;
  urgent: boolean;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const SiswaDashboard: React.FC = () => {
  const { user } = useAuth();

  const [attendanceRate, setAttendanceRate] = useState("100%");
  const [attendanceDesc, setAttendanceDesc] = useState(
    "0 Izin · 0 Sakit · 0 Alpa",
  );
  const [averageGrade, setAverageGrade] = useState("—");
  const [activeTasksCount, setActiveTasksCount] = useState("0");
  const [newMaterialsCount, setNewMaterialsCount] = useState("0");
  const [todaySchedules, setTodaySchedules] = useState<StudentScheduleRow[]>(
    [],
  );
  const [assignments, setAssignments] = useState<StudentAssignmentCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      try {
        const classId = getSiswaKelasId(user);

        const [allAbs, allSubs, allTugas, allMateri, allSchedules] =
          await Promise.all([
            attendanceService.getAbsensiSiswa(),
            learningService.getSubmissions(),
            learningService.getTugas(),
            learningService.getMateri(),
            scheduleService.getJadwalPembelajaran(),
          ]);

        // 1. Attendance stats
        const myLogs = allAbs.filter(
          (a) => String(a.siswaId) === String(user.id),
        );
        const totalLogs = myLogs.length;
        const hadir = myLogs.filter((l) => l.status === "Hadir").length;
        const sakit = myLogs.filter((l) => l.status === "Sakit").length;
        const izin = myLogs.filter((l) => l.status === "Izin").length;
        const alpa = myLogs.filter((l) => l.status === "Alpa").length;
        const rate = totalLogs > 0 ? Math.round((hadir / totalLogs) * 100) : 0;
        setAttendanceRate(`${rate}%`);
        setAttendanceDesc(`${izin} Izin · ${sakit} Sakit · ${alpa} Alpa`);

        // 2. Grades stats
        const mySubs = allSubs.filter(
          (s) => String(s.siswaId) === String(user.id) && s.grade !== undefined,
        );
        if (mySubs.length > 0) {
          const sum = mySubs.reduce((acc, curr) => acc + (curr.grade || 0), 0);
          setAverageGrade(String(Math.round(sum / mySubs.length)));
        } else {
          setAverageGrade("—");
        }

        // 3. Tasks & Materials count
        const myTasks = allTugas.filter(
          (t) =>
            t.status === "Dipublikasikan" &&
            String(t.kelasId) === String(classId),
        );
        const myMaterials = allMateri.filter(
          (m) =>
            m.status === "Dipublikasikan" &&
            String(m.kelasId) === String(classId),
        );

        // Find tasks that have not been submitted yet
        const submittedTaskIds = allSubs
          .filter(
            (s) =>
              String(s.siswaId) === String(user.id) && s.status === "Terkumpul",
          )
          .map((s) => String(s.tugasId));
        const pendingTasks = myTasks.filter(
          (t) => !submittedTaskIds.includes(String(t.id)),
        );

        setActiveTasksCount(String(pendingTasks.length));
        setNewMaterialsCount(String(myMaterials.length));

        // 4. Today schedules mapping
        const activeDate = getActiveDateString();
        const myClassSchedules = allSchedules.filter(
          (s) => String(s.kelasId) === String(classId),
        );
        const mappedSchedules = myClassSchedules.map((s) => {
          const attendanceToday = myLogs.find(
            (a) => a.tanggal === activeDate && a.mapelName === s.mapelName,
          );
          return {
            jam: `${s.waktuMulai} - ${s.waktuSelesai}`,
            mapel: s.mapelName,
            guru: s.guruName,
            ruang: s.kelasName,
            status: attendanceToday ? attendanceToday.status : "Belum Mulai",
          };
        });
        setTodaySchedules(mappedSchedules);

        // 5. Assignments list for panel
        const mappedAssignments = myTasks.slice(0, 3).map((t) => {
          const isSubmitted = submittedTaskIds.includes(String(t.id));
          return {
            id: String(t.id),
            mapel: t.mapelName,
            batas: t.dueDate,
            judul: t.title,
            desc: t.description,
            urgent:
              !isSubmitted &&
              new Date(t.dueDate).getTime() - new Date(activeDate).getTime() <
                3 * 24 * 60 * 60 * 1000,
          };
        });
        setAssignments(mappedAssignments);
      } catch (err) {
        console.error("Gagal memuat data dashboard siswa:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  // Semantic state system applied:
  //   safe      → stable baseline (Kehadiran 98.2% is passing/good)
  //   excellent → high achievement (Rata-Rata Nilai 86.4 is well above KKM 75)
  //   pending   → active work / obligations to complete (Tugas Aktif)
  //   info      → passive informational facts (Materi Baru)
  //
  const stats: Array<{
    label: string;
    value: string;
    desc: string;
    icon: React.ReactNode;
    variant: SemanticState;
    tooltip: string;
  }> = [
    {
      label: "Kehadiran Semester",
      value: attendanceRate,
      desc: attendanceDesc,
      icon: <ClipboardCheck className="h-4 w-4" />,
      variant:
        parseFloat(attendanceRate) >= 90
          ? "safe"
          : parseFloat(attendanceRate) >= 80
            ? "warning"
            : "danger",
      tooltip: "Persentase kehadiran Anda pada semester aktif saat ini.",
    },
    {
      label: "Rata-Rata Nilai",
      value: averageGrade,
      desc: "Target KKM: 75",
      icon: <Sparkles className="h-4 w-4" />,
      variant:
        averageGrade !== "—" && Number(averageGrade) >= 75
          ? "excellent"
          : "neutral",
      tooltip: "Nilai rata-rata akumulatif dari seluruh mata pelajaran.",
    },
    {
      label: "Tugas Aktif",
      value: activeTasksCount,
      desc: "Belum dikumpulkan",
      icon: <FileText className="h-4 w-4" />,
      variant: Number(activeTasksCount) > 0 ? "pending" : "safe",
      tooltip: "Jumlah tugas mandiri dan kelompok yang belum dikumpulkan.",
    },
    {
      label: "Materi Baru",
      value: newMaterialsCount,
      desc: "Bab siap dipelajari",
      icon: <BookOpen className="h-4 w-4" />,
      variant: "info",
      tooltip: "Materi pembelajaran baru yang diunggah oleh guru Anda.",
    },
  ];

  const getAbsenState = (status: string): SemanticState => {
    return status === "Hadir" ? "safe" : "neutral";
  };

  const scheduleColumns = [
    {
      header: "Waktu",
      cell: (sched: StudentScheduleRow) => (
        <span className="text-[12px] font-semibold text-bg-ink-secondary tabular-nums">
          {sched.jam}
        </span>
      ),
    },
    {
      header: "Mata Pelajaran",
      cell: (sched: StudentScheduleRow) => (
        <span className="text-[13px] font-medium text-bg-ink">
          {sched.mapel}
        </span>
      ),
    },
    {
      header: "Guru Pengampu",
      cell: (sched: StudentScheduleRow) => (
        <span className="text-[13px] text-bg-ink-secondary">{sched.guru}</span>
      ),
    },
    {
      header: "Ruang/Rombel",
      cell: (sched: StudentScheduleRow) => (
        <span className="text-[13px] text-bg-ink-muted">{sched.ruang}</span>
      ),
    },
    {
      header: "Status Absen",
      cell: (sched: StudentScheduleRow) => (
        <StatusBadge label={sched.status} state={getAbsenState(sched.status)} />
      ),
    },
  ];

  if (loading) {
    return <LoadingState message="Memuat informasi dashboard Anda..." />;
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink">
          Halo, {user?.name || "Siswa"}!
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Selamat datang kembali di portal siswa CORELASI. Berikut ringkasan
          agenda belajar Anda hari ini.
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="space-y-3">
        <h2 className="text-[18px] font-bold leading-tight tracking-tight text-bg-ink">
          Ringkasan Hari Ini
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <SummaryMetricCard key={i} {...stat} />
          ))}
        </div>
      </div>

      {/* ── Schedules + Assignments ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Schedules Table */}
        <div className="lg:col-span-2">
          <DataTable
            title="Jadwal Belajar Hari Ini"
            columns={scheduleColumns}
            data={todaySchedules}
            keyExtractor={(sched) => sched.jam}
            emptyStateTitle="Tidak ada jadwal"
            emptyStateDescription="Hari ini Anda tidak memiliki jadwal KBM terdaftar."
          />
        </div>

        {/* Dynamic Assignment Panel */}
        <Card
          variant="surface"
          padding="none"
          className="lg:col-span-1 flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-bg-border">
            <h3 className="text-[14px] font-bold text-bg-ink">
              Tugas Perlu Dikerjakan
            </h3>
          </div>

          <div className="flex-1 p-5 space-y-3">
            {assignments.length > 0 ? (
              assignments.map((assignment) => {
                const state = assignment.urgent ? "warning" : "pending";
                return (
                  <Link
                    key={assignment.id}
                    to={`/siswa/assignments/${assignment.id}`}
                    className={`p-4 border rounded-[6px] transition-all flex flex-col focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none hover:bg-bg-sage-slate/20 ${
                      state === "warning"
                        ? "border-status-warning/30 bg-status-warning/[0.03] hover:border-status-warning/50 hover:shadow-[0_1px_4px_rgba(217,119,6,0.06)]"
                        : "border-bg-border bg-bg-surface hover:border-border-muted hover:shadow-[0_1px_4px_rgba(20,33,26,0.04)]"
                    }`}
                  >
                    <div className="w-full">
                      {/* Header: Mapel Badge + Optional Urgency Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-primary bg-primary/[0.08] px-2 py-0.5 rounded border border-primary/20">
                          {assignment.mapel}
                        </span>
                        {assignment.urgent && (
                          <span className="text-[10px] font-bold text-status-warning bg-status-warning/10 px-2 py-0.5 rounded border border-status-warning/20">
                            Mendesak
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h4 className="text-[13px] font-bold text-bg-ink mt-2 leading-snug">
                        {assignment.judul}
                      </h4>
                      <p className="text-[11px] text-bg-ink-secondary mt-1 line-clamp-2 leading-relaxed">
                        {assignment.desc}
                      </p>

                      {/* Deadline Pill Indicator */}
                      <div
                        className={`mt-3 flex items-center gap-1.5 px-2 py-1 rounded-[4px] border w-fit text-[11px] font-semibold transition-colors ${
                          state === "warning"
                            ? "bg-status-warning/10 text-status-warning border-status-warning/20"
                            : "bg-bg-sage-slate/50 text-bg-ink-secondary border-bg-border"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>Tenggat: {assignment.batas}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-bg-ink-muted">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-[12px] font-semibold">Semua Tugas Tuntas</p>
                <p className="text-[10px] mt-0.5 text-bg-ink-secondary leading-normal">
                  Tidak ada tugas mandiri/kelompok yang perlu dikumpulkan saat
                  ini.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SiswaDashboard;

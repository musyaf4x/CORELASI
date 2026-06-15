import React, { useEffect, useState } from "react";
import { reportService } from "@/services/reportService";
import { academicService } from "@/services/academicService";
import { learningService } from "@/services/learningService";
import { journalService } from "@/services/journalService";
import type { OperationalReport } from "@/types/report";
import {
  DataTable,
  Button,
  SummaryMetricCard,
  StatusBadge,
  Toast,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import type { SemanticState } from "@/utils/semanticState";
import {
  Download,
  Users,
  CheckSquare,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { exportToExcel } from "@/utils/exportHelper";

interface ClassOperationalRow {
  id: string;
  className: string;
  homeroomTeacher: string;
  attendanceRate: number;
  assignmentsCount: number;
  journalsCount: number;
}

export const OperationalReportsPage: React.FC = () => {
  const [report, setReport] = useState<OperationalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classDetails, setClassDetails] = useState<ClassOperationalRow[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const [rep, classesData] = await Promise.all([
        reportService.getOperationalReport(),
        academicService.getKelas(),
      ]);
      setReport(rep);

      // Dynamically calculate operational details per class
      const details = await Promise.all(
        classesData.map(async (c) => {
          const [att, tasks, journals] = await Promise.all([
            reportService.getAttendanceReports(String(c.id)),
            learningService.getTugasByKelas(String(c.id)),
            journalService.getJournalsByKelas(String(c.id)),
          ]);
          const totalAttPercent = att.reduce(
            (acc, curr) => acc + curr.percentage,
            0,
          );
          const attRate =
            att.length > 0 ? Math.round(totalAttPercent / att.length) : 0;
          return {
            id: String(c.id),
            className: c.name,
            homeroomTeacher: c.waliKelasName || "Belum Ditentukan",
            attendanceRate: attRate,
            assignmentsCount: tasks.length,
            journalsCount: journals.length,
          };
        }),
      );
      setClassDetails(details);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat rekap operasional sekolah.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, []);

  const handleExportExcel = () => {
    if (classDetails.length === 0) {
      setToastMessage("Tidak ada data untuk diekspor.");
      return;
    }
    const exportData = classDetails.map((c) => ({
      Kelas: c.className,
      "Wali Kelas": c.homeroomTeacher,
      "Persentase Kehadiran (%)": `${c.attendanceRate}%`,
      "Jumlah Tugas": c.assignmentsCount,
      "Jurnal Pembelajaran": c.journalsCount,
    }));
    exportToExcel(
      exportData,
      `Rekap_Operasional_Sekolah_${new Date().toISOString().split("T")[0]}`,
    );
  };

  const columns = [
    {
      header: "Kelas",
      cell: (c: ClassOperationalRow) => (
        <span className="text-[13px] font-bold text-bg-ink">{c.className}</span>
      ),
    },
    {
      header: "Wali Kelas",
      cell: (c: ClassOperationalRow) => (
        <span className="text-[12px] font-medium text-bg-ink-secondary">
          {c.homeroomTeacher}
        </span>
      ),
    },
    {
      header: "Kehadiran Kelas",
      cell: (c: ClassOperationalRow) => {
        let state: SemanticState = "safe";
        if (c.attendanceRate < 90) state = "danger";
        else if (c.attendanceRate < 95) state = "warning";

        return (
          <StatusBadge label={`${c.attendanceRate}%`} state={state} size="xs" />
        );
      },
    },
    {
      header: "Jumlah Tugas Aktif",
      cell: (c: ClassOperationalRow) => (
        <span className="text-[12px] font-mono font-semibold text-bg-ink-secondary">
          {c.assignmentsCount}
        </span>
      ),
    },
    {
      header: "Jurnal Terisi",
      cell: (c: ClassOperationalRow) => (
        <span className="text-[12px] font-mono font-semibold text-bg-ink-secondary">
          {c.journalsCount}
        </span>
      ),
    },
  ];

  if (loading) {
    return <LoadingState message="Memuat rekap operasional sekolah..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (!report) {
    return <LoadingState message="Menyiapkan data..." />;
  }
  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          message={toastMessage}
          variant="warning"
          onClose={() => setToastMessage(null)}
        />
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            Rekap Operasional
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Dashboard metrik utama kegiatan belajar mengajar (KBM) dan
            operasional presensi sekolah.
          </p>
        </div>
        <Button
          onClick={handleExportExcel}
          className="gap-1.5 font-semibold text-[12px] h-9 self-start sm:self-center"
        >
          <Download className="h-4 w-4" />
          Ekspor Excel
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryMetricCard
          label="Partisipasi Siswa"
          value={String(report.totalSiswa)}
          desc="Siswa terdaftar aktif"
          icon={<Users className="h-4 w-4" />}
          variant="info"
          tooltip="Total jumlah siswa yang terdaftar dalam rombel tahun ajaran aktif."
        />
        <SummaryMetricCard
          label="Rasio Presensi"
          value={`${report.attendanceRate}%`}
          desc="Tingkat kehadiran siswa"
          icon={<TrendingUp className="h-4 w-4" />}
          variant="excellent"
          tooltip="Persentase akumulatif rata-rata kehadiran siswa di seluruh mata pelajaran."
        />
        <SummaryMetricCard
          label="Keterisian Jurnal"
          value={`${report.journalCompletionRate}%`}
          desc="Jurnal mengajar guru terisi"
          icon={<ClipboardList className="h-4 w-4" />}
          variant="safe"
          tooltip="Rasio pengisian jurnal KBM harian dibandingkan dengan total target pertemuan."
        />
        <SummaryMetricCard
          label="Tugas & Evaluasi"
          value={String(report.activeAssignments)}
          desc="Tugas aktif dirilis"
          icon={<CheckSquare className="h-4 w-4" />}
          variant="pending"
          tooltip="Jumlah tugas mandiri siswa dengan status terpublikasi."
        />
      </div>

      {/* Main Table */}
      <DataTable
        title="Ringkasan Kinerja per Rombel Kelas"
        columns={columns}
        data={classDetails}
        keyExtractor={(c) => c.id}
        emptyStateTitle="Tidak ada data kelas"
        emptyStateDescription="Belum ada data operasional kelas terdaftar."
      />
    </div>
  );
};
export default OperationalReportsPage;

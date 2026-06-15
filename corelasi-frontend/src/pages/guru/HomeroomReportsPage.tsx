import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { reportService } from "@/services/reportService";
import { journalService } from "@/services/journalService";
import type {
  StudentAttendanceSummary,
  StudentGradeSummary,
} from "@/types/report";
import type { JurnalPertemuan } from "@/types/journal";
import {
  DetailTabs,
  DataTable,
  Button,
  StatusBadge,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import { Download, ClipboardCheck, Award, BookCopy } from "lucide-react";
import { exportToExcel } from "@/utils/exportHelper";

export const HomeroomReportsPage: React.FC = () => {
  const { user } = useAuth();

  // Homeroom class is dynamic from teacher's assignments
  const homeroomClassId = user?.assignments?.waliKelasId
    ? String(user.assignments.waliKelasId)
    : null;
  const homeroomClassName =
    user?.assignments?.waliKelasName || "Belum ditetapkan";

  const [activeTab, setActiveTab] = useState("attendance");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [attendanceList, setAttendanceList] = useState<
    StudentAttendanceSummary[]
  >([]);
  const [gradesList, setGradesList] = useState<StudentGradeSummary[]>([]);
  const [journalsList, setJournalsList] = useState<JurnalPertemuan[]>([]);

  const loadData = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    if (!homeroomClassId) {
      setAttendanceList([]);
      setGradesList([]);
      setJournalsList([]);
      setLoading(false);
      return;
    }

    try {
      const [att, grd, jrn] = await Promise.all([
        reportService.getAttendanceReports(homeroomClassId),
        reportService.getGradeReports(homeroomClassId),
        journalService.getJournalsByKelas(homeroomClassId),
      ]);
      setAttendanceList(att);
      setGradesList(grd);
      setJournalsList(jrn);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat laporan perwalian.",
      );
    } finally {
      setLoading(false);
    }
  }, [homeroomClassId]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const handleExportExcel = () => {
    if (activeTab === "attendance") {
      if (attendanceList.length === 0) return;
      const exportData = attendanceList.map((r) => ({
        NIS: r.nis,
        "Nama Siswa": r.siswaName,
        Kelas: r.kelasName,
        Hadir: r.hadir,
        Sakit: r.sakit,
        Izin: r.izin,
        Alpa: r.alpa,
        "Kehadiran (%)": `${r.percentage}%`,
      }));
      exportToExcel(
        exportData,
        `Rekap_Kehadiran_Perwalian_${homeroomClassName}_${new Date().toISOString().split("T")[0]}`,
      );
    } else if (activeTab === "grades") {
      if (gradesList.length === 0) return;
      const exportData = gradesList.map((r) => ({
        NIS: r.nis,
        "Nama Siswa": r.siswaName,
        Kelas: r.kelasName,
        "Rata-rata Nilai": r.average,
        Status: r.average >= 75 ? "Tuntas" : "Remedial",
      }));
      exportToExcel(
        exportData,
        `Rekap_Nilai_Perwalian_${homeroomClassName}_${new Date().toISOString().split("T")[0]}`,
      );
    } else if (activeTab === "journals") {
      if (journalsList.length === 0) return;
      const exportData = journalsList.map((r) => ({
        Tanggal: r.date,
        "Mata Pelajaran": r.mapelName,
        Guru: r.guruName,
        Agenda: r.agenda,
        Ringkasan: r.materialSummary,
        Status: "Sudah Diisi",
      }));
      exportToExcel(
        exportData,
        `Jurnal_Perwalian_${homeroomClassName}_${new Date().toISOString().split("T")[0]}`,
      );
    }
  };

  const tabs = [
    {
      id: "attendance",
      label: "Rekap Kehadiran",
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
    {
      id: "grades",
      label: "Rekap Nilai Siswa",
      icon: <Award className="h-4 w-4" />,
    },
    {
      id: "journals",
      label: "Jurnal Pembelajaran",
      icon: <BookCopy className="h-4 w-4" />,
    },
  ];

  const attendanceColumns = [
    {
      header: "NIS",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-bg-ink-muted font-bold">
          {r.nis}
        </span>
      ),
    },
    {
      header: "Nama Siswa",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {r.siswaName}
        </span>
      ),
    },
    {
      header: "Hadir (H)",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-text-safe font-bold">
          {r.hadir}
        </span>
      ),
    },
    {
      header: "Sakit (S)",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-text-info font-bold">
          {r.sakit}
        </span>
      ),
    },
    {
      header: "Izin (I)",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-text-warning font-bold">
          {r.izin}
        </span>
      ),
    },
    {
      header: "Alpa (A)",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-text-danger font-bold">
          {r.alpa}
        </span>
      ),
    },
    {
      header: "Persentase",
      cell: (r: StudentAttendanceSummary) => {
        let state: "safe" | "warning" | "danger" = "safe";
        if (r.percentage < 90) {
          state = "danger";
        } else if (r.percentage < 95) {
          state = "warning";
        }

        return (
          <StatusBadge label={`${r.percentage}%`} state={state} size="xs" />
        );
      },
    },
  ];

  const gradeColumns = [
    {
      header: "NIS",
      cell: (r: StudentGradeSummary) => (
        <span className="text-[13px] font-mono text-bg-ink-muted font-bold">
          {r.nis}
        </span>
      ),
    },
    {
      header: "Nama Siswa",
      cell: (r: StudentGradeSummary) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {r.siswaName}
        </span>
      ),
    },
    {
      header: "Rerata Tugas",
      cell: (r: StudentGradeSummary) => (
        <span className="text-[14px] font-bold font-mono text-primary flex items-center gap-1">
          <Award className="h-4 w-4" />
          {r.average}
        </span>
      ),
    },
    {
      header: "Keterangan KKM",
      cell: (r: StudentGradeSummary) => {
        const isTuntas = r.average >= 75;
        return (
          <StatusBadge
            label={isTuntas ? "Tuntas (>= 75)" : "Remedial (< 75)"}
            state={isTuntas ? "safe" : "danger"}
            size="xs"
          />
        );
      },
    },
  ];

  const journalColumns = [
    {
      header: "Tanggal",
      cell: (j: JurnalPertemuan) => (
        <span className="text-[13px] text-bg-ink-secondary font-mono">
          {j.date}
        </span>
      ),
    },
    {
      header: "Mata Pelajaran",
      cell: (j: JurnalPertemuan) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {j.mapelName}
        </span>
      ),
    },
    {
      header: "Guru Pengampu",
      cell: (j: JurnalPertemuan) => (
        <span className="text-[13px] font-medium text-bg-ink-secondary">
          {j.guruName}
        </span>
      ),
    },
    {
      header: "Agenda KBM",
      cell: (j: JurnalPertemuan) => (
        <div className="flex flex-col gap-0.5 max-w-[220px]">
          <span className="text-[13px] font-semibold text-bg-ink truncate">
            {j.agenda}
          </span>
          <span className="text-[11px] text-bg-ink-muted truncate">
            {j.materialSummary}
          </span>
        </div>
      ),
    },
    {
      header: "Status Jurnal",
      cell: () => <StatusBadge label="Sudah Diisi" state="safe" size="xs" />,
    },
  ];

  if (loading) {
    return <LoadingState message="Memuat laporan kelas perwalian..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            Laporan Perwalian
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Pantau ringkasan evaluasi kehadiran dan perolehan nilai akademik
            untuk siswa kelas binaan perwalian.
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

      {/* Tabs */}
      <DetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Tab Panels */}
      <div className="mt-6">
        {activeTab === "attendance" && (
          <DataTable
            title={`Rekapitulasi Kehadiran Kelas Perwalian ${homeroomClassName}`}
            columns={attendanceColumns}
            data={attendanceList}
            keyExtractor={(r) => r.siswaId}
            emptyStateTitle="Tidak ada data"
            emptyStateDescription="Belum ada catatan presensi siswa kelas perwalian."
          />
        )}

        {activeTab === "grades" && (
          <DataTable
            title={`Hasil Capaian Nilai Akademik Kelas Perwalian ${homeroomClassName}`}
            columns={gradeColumns}
            data={gradesList}
            keyExtractor={(r) => r.siswaId}
            emptyStateTitle="Tidak ada data"
            emptyStateDescription="Belum ada data evaluasi tugas akademik kelas perwalian."
          />
        )}

        {activeTab === "journals" && (
          <DataTable
            title={`Jurnal Pembelajaran Kelas Perwalian ${homeroomClassName}`}
            columns={journalColumns}
            data={journalsList}
            keyExtractor={(r) => r.id}
            emptyStateTitle="Tidak ada data jurnal"
            emptyStateDescription="Belum ada catatan jurnal pembelajaran untuk kelas perwalian ini."
          />
        )}
      </div>
    </div>
  );
};
export default HomeroomReportsPage;

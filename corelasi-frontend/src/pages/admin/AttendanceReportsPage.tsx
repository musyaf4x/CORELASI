import React, { useEffect, useMemo, useState } from "react";
import { reportService } from "@/services/reportService";
import type { StudentAttendanceSummary } from "@/types/report";
import {
  DataTable,
  Button,
  StatusBadge,
  FilterBar,
  Toast,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import type { SemanticState } from "@/utils/semanticState";
import { Download } from "lucide-react";
import { exportToExcel } from "@/utils/exportHelper";

export const AttendanceReportsPage: React.FC = () => {
  const [reports, setReports] = useState<StudentAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchReports = async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getAttendanceReports();
      setReports(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data rekap absensi.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchReports);
  }, []);

  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (r) => r.siswaName.toLowerCase().includes(term) || r.nis.includes(term),
      );
    }

    if (selectedClass) {
      result = result.filter((r) => r.kelasName === selectedClass);
    }

    return result;
  }, [search, selectedClass, reports]);

  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      setToastMessage("Tidak ada data untuk diekspor.");
      return;
    }
    const exportData = filteredReports.map((r) => ({
      NIS: r.nis,
      "Nama Siswa": r.siswaName,
      Kelas: r.kelasName,
      Hadir: r.hadir,
      Sakit: r.sakit,
      Izin: r.izin,
      Alpa: r.alpa,
      "Persentase Kehadiran (%)": `${r.percentage}%`,
    }));
    exportToExcel(
      exportData,
      `Rekap_Kehadiran_Siswa_${new Date().toISOString().split("T")[0]}`,
    );
  };

  const columns = [
    {
      header: "NIS",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[12px] font-mono text-bg-ink-muted font-bold">
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
      header: "Kelas",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[12px] text-bg-ink-secondary">{r.kelasName}</span>
      ),
    },
    {
      header: "Hadir (H)",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-primary font-bold">
          {r.hadir}
        </span>
      ),
    },
    {
      header: "Sakit (S)",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-status-info font-bold">
          {r.sakit}
        </span>
      ),
    },
    {
      header: "Izin (I)",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-status-warning font-bold">
          {r.izin}
        </span>
      ),
    },
    {
      header: "Alpa (A)",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-status-danger font-bold">
          {r.alpa}
        </span>
      ),
    },
    {
      header: "Persentase Kehadiran",
      cell: (r: StudentAttendanceSummary) => {
        let state: SemanticState = "safe";
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

  const classOptions = Array.from(new Set(reports.map((r) => r.kelasName))).map(
    (cName) => ({
      value: cName,
      label: `Kelas ${cName}`,
    }),
  );

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
            Rekap Kehadiran Siswa
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Evaluasi persentase kehadiran kumulatif seluruh siswa per mata
            pelajaran dan agenda kelas.
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

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Cari siswa atau NIS..."
        searchValue={search}
        onSearchChange={setSearch}
        filterValue={selectedClass}
        onFilterChange={setSelectedClass}
        filterPlaceholder="Semua Kelas"
        filterOptions={classOptions}
      />

      {/* Main Table */}
      {loading ? (
        <LoadingState message="Memuat data rekap absensi..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReports} />
      ) : (
        <DataTable
          title="Tabel Rekapitulasi Presensi Siswa"
          columns={columns}
          data={filteredReports}
          keyExtractor={(r) => r.siswaId}
          emptyStateTitle="Tidak ada data"
          emptyStateDescription="Belum ada data rekapitulasi kehadiran siswa yang tercatat."
        />
      )}
    </div>
  );
};
export default AttendanceReportsPage;

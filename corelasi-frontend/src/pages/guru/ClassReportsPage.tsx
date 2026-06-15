import React, { useCallback, useEffect, useState } from "react";
import { reportService } from "@/services/reportService";
import { academicService } from "@/services/academicService";
import type { StudentAttendanceSummary } from "@/types/report";
import {
  DataTable,
  Button,
  StatusBadge,
  FilterBar,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import type { SemanticState } from "@/utils/semanticState";
import { Download } from "lucide-react";
import { exportToExcel } from "@/utils/exportHelper";

export const ClassReportsPage: React.FC = () => {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState(""); // empty initially until classes load
  const [reports, setReports] = useState<StudentAttendanceSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await academicService.getKelas();
        setClasses(data);
        if (data.length > 0) {
          setSelectedClass(String(data[0].id));
        }
      } catch (err) {
        console.error("Gagal memuat daftar kelas:", err);
      }
    };
    loadClasses();
  }, []);

  const fetchClassReports = useCallback(async () => {
    if (!selectedClass) return;
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getAttendanceReports(selectedClass);
      setReports(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat rekap absensi kelas.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    void Promise.resolve().then(fetchClassReports);
  }, [fetchClassReports]);

  const filteredReports = reports.filter(
    (r) =>
      r.siswaName.toLowerCase().includes(search.toLowerCase()) ||
      r.nis.toLowerCase().includes(search.toLowerCase()),
  );

  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    const currentClass = classes.find(
      (c) => String(c.id) === String(selectedClass),
    );
    const className = currentClass ? currentClass.name : "Kelas";
    const exportData = filteredReports.map((r) => ({
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
      `Rekap_Kehadiran_Kelas_${className}_${new Date().toISOString().split("T")[0]}`,
    );
  };

  const columns = [
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            Rekap Absensi Kelas
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Pantau rekapitulasi presensi kumulatif per rombel kelas yang Anda
            ampu semester ini.
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
        filterPlaceholder="Pilih Kelas"
        filterLabel="Kelas"
        filterOptions={classes.map((c) => ({
          value: String(c.id),
          label: `Kelas ${c.name}`,
        }))}
      />

      {/* Main Table */}
      {loading ? (
        <LoadingState message="Memuat rekap absensi kelas..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchClassReports} />
      ) : (
        <DataTable
          title={`Data Kehadiran Rombel Kelas ${
            classes.find((c) => String(c.id) === String(selectedClass))?.name ||
            ""
          }`}
          columns={columns}
          data={filteredReports}
          keyExtractor={(r) => r.siswaId}
          emptyStateTitle="Tidak ada data"
          emptyStateDescription="Belum ada data rekapitulasi kehadiran kelas yang tercatat."
        />
      )}
    </div>
  );
};
export default ClassReportsPage;

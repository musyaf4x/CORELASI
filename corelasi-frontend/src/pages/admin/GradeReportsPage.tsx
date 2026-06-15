import React, { useEffect, useMemo, useState } from "react";
import { reportService } from "@/services/reportService";
import type { StudentGradeSummary } from "@/types/report";
import {
  DataTable,
  Button,
  StatusBadge,
  FilterBar,
  Toast,
  SummaryMetricCard,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import {
  Download,
  Award,
  ClipboardCheck,
  AlertCircle,
  Users,
} from "lucide-react";
import { exportToExcel } from "@/utils/exportHelper";

export const GradeReportsPage: React.FC = () => {
  const [reports, setReports] = useState<StudentGradeSummary[]>([]);
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
      const data = await reportService.getGradeReports();
      setReports(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data rekap nilai.",
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
        (r) =>
          r.siswaName.toLowerCase().includes(term) ||
          r.nis.toLowerCase().includes(term),
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
      NIS: r.nis || "—",
      "Nama Siswa": r.siswaName,
      Kelas: r.kelasName,
      "Rata-rata Nilai": r.average,
      Status: r.average >= 75 ? "Tuntas" : "Remedial",
    }));
    exportToExcel(
      exportData,
      `Rekap_Nilai_Siswa_${new Date().toISOString().split("T")[0]}`,
    );
  };

  const columns = [
    {
      header: "NIS",
      cell: (r: StudentGradeSummary) =>
        r.nis ? (
          <span className="text-[12px] font-mono text-bg-ink-muted font-bold">
            {r.nis}
          </span>
        ) : (
          <span className="text-[12px] font-mono text-bg-ink-muted/50 font-normal">
            —
          </span>
        ),
    },
    {
      header: "Nama Siswa",
      cell: (r: StudentGradeSummary) => (
        <span className="text-[13px] font-semibold text-bg-ink font-sans">
          {r.siswaName}
        </span>
      ),
    },
    {
      header: "Kelas",
      cell: (r: StudentGradeSummary) => (
        <span className="text-[12px] text-bg-ink-secondary">{r.kelasName}</span>
      ),
    },
    {
      header: "Rata-rata Nilai",
      cell: (r: StudentGradeSummary) => (
        <span
          className={`text-[14px] font-bold font-mono ${r.average >= 75 ? "text-text-safe" : "text-text-danger"}`}
        >
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
            label={isTuntas ? "Tuntas" : "Remedial"}
            state={isTuntas ? "safe" : "danger"}
            size="xs"
          />
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

  // Overview metrics calculated based on filtered data
  const totalSiswa = filteredReports.length;
  const tuntasCount = filteredReports.filter((r) => r.average >= 75).length;
  const remedialCount = totalSiswa - tuntasCount;

  let averageGrade = 0;
  if (totalSiswa > 0) {
    const sum = filteredReports.reduce((acc, curr) => acc + curr.average, 0);
    averageGrade = Math.round(sum / totalSiswa);
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
            Rekap Nilai Siswa
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Pantau dan ekspor laporan kumulatif rata-rata nilai tugas/evaluasi
            akademik seluruh siswa.
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

      {/* Overview Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryMetricCard
          label="Rata-rata Nilai"
          value={averageGrade.toString()}
          desc="Rerata kumulatif nilai seluruh siswa"
          icon={<Award className="h-4 w-4" />}
          variant="neutral"
          tooltip="Rata-rata dari nilai rata-rata seluruh siswa yang terfilter."
        />
        <SummaryMetricCard
          label="Siswa Tuntas"
          value={tuntasCount.toString()}
          desc="Nilai rata-rata ≥ 75"
          icon={<ClipboardCheck className="h-4 w-4" />}
          variant="safe"
          tooltip="Jumlah siswa dengan nilai rata-rata di atas atau sama dengan KKM (75)."
        />
        <SummaryMetricCard
          label="Siswa Remedial"
          value={remedialCount.toString()}
          desc="Nilai rata-rata < 75"
          icon={<AlertCircle className="h-4 w-4" />}
          variant="danger"
          tooltip="Jumlah siswa dengan nilai rata-rata di bawah KKM (75)."
        />
        <SummaryMetricCard
          label="Total Siswa"
          value={totalSiswa.toString()}
          desc="Siswa terdaftar aktif"
          icon={<Users className="h-4 w-4" />}
          variant="neutral"
          tooltip="Total siswa yang terdaftar dalam data rekap nilai ini."
        />
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
        <LoadingState message="Memuat data rekap nilai..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReports} />
      ) : (
        <DataTable
          title="Tabel Hasil Capaian Nilai Rata-rata Siswa"
          columns={columns}
          data={filteredReports}
          keyExtractor={(r) => r.siswaId}
          emptyStateTitle="Tidak ada data"
          emptyStateDescription="Belum ada data nilai tugas/ujian siswa yang diinput oleh guru."
          paginate={true}
          pageSize={10}
        />
      )}
    </div>
  );
};
export default GradeReportsPage;

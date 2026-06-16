import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { reportService } from "@/services/reportService";
import type { StudentAttendanceSummary } from "@/types/report";
import {
  DataTable,
  SummaryMetricCard,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import {
  ClipboardCheck,
  UserCheck,
  Activity,
  FileText,
  AlertCircle,
} from "lucide-react";

export const DutyAttendanceReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceList, setAttendanceList] = useState<
    StudentAttendanceSummary[]
  >([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // For piket scope: aggregate all classes
        const allReports = await reportService.getAttendanceReports();
        setAttendanceList(allReports);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat rekap absensi operasional.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Summary counters
  const totalHadir = attendanceList.reduce((acc, r) => acc + r.hadir, 0);
  const totalSakit = attendanceList.reduce((acc, r) => acc + r.sakit, 0);
  const totalIzin = attendanceList.reduce((acc, r) => acc + r.izin, 0);
  const totalAlpa = attendanceList.reduce((acc, r) => acc + r.alpa, 0);

  const columns = [
    {
      header: "Kelas",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {r.kelasName}
        </span>
      ),
    },
    {
      header: "Nama Siswa",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-medium text-bg-ink">
          {r.siswaName}
        </span>
      ),
    },
    {
      header: "Hadir",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-primary font-bold">
          {r.hadir}
        </span>
      ),
    },
    {
      header: "Sakit",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-status-info font-bold">
          {r.sakit}
        </span>
      ),
    },
    {
      header: "Izin",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-status-warning font-bold">
          {r.izin}
        </span>
      ),
    },
    {
      header: "Alpa",
      cell: (r: StudentAttendanceSummary) => (
        <span className="text-[13px] font-mono text-status-danger font-bold">
          {r.alpa}
        </span>
      ),
    },
  ];

  if (loading) {
    return <LoadingState message="Memuat rekap absensi operasional..." />;
  }

  if (error) {
    return (
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
          Rekap Absensi Operasional
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Ringkasan absensi untuk monitoring operasional Guru Piket.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryMetricCard
          label="Total Hadir"
          value={`${totalHadir}`}
          desc="Siswa hadir KBM"
          icon={<UserCheck className="h-4 w-4" />}
          variant="safe"
          tooltip="Akumulasi seluruh siswa dengan status Hadir hari ini."
        />
        <SummaryMetricCard
          label="Total Sakit"
          value={`${totalSakit}`}
          desc="Absen status Sakit"
          icon={<Activity className="h-4 w-4" />}
          variant="info"
          tooltip="Akumulasi seluruh siswa dengan status Sakit hari ini."
        />
        <SummaryMetricCard
          label="Total Izin"
          value={`${totalIzin}`}
          desc="Absen status Izin"
          icon={<FileText className="h-4 w-4" />}
          variant="warning"
          tooltip="Akumulasi seluruh siswa dengan status Izin hari ini."
        />
        <SummaryMetricCard
          label="Total Alpa"
          value={`${totalAlpa}`}
          desc="Absen tanpa keterangan"
          icon={<AlertCircle className="h-4 w-4" />}
          variant="danger"
          tooltip="Akumulasi seluruh siswa dengan status Alpa hari ini."
        />
      </div>

      {/* Table */}
      <DataTable
        title="Rekap Kehadiran Siswa"
        columns={columns}
        data={attendanceList}
        keyExtractor={(r) => r.siswaId}
        emptyStateTitle="Tidak ada data"
        emptyStateDescription="Belum ada data absensi pada periode ini."
      />

      <p className="text-[12px] text-bg-ink-secondary/80 flex items-center gap-1.5">
        <ClipboardCheck className="h-4 w-4 text-bg-ink-muted" />
        Untuk konteks piket, tidak tersedia ekspor nilai atau rekap akademik
        umum.
      </p>
    </div>
  );
};
export default DutyAttendanceReportsPage;

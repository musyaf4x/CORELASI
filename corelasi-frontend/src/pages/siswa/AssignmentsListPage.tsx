import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { learningService } from "@/services/learningService";
import type { Tugas, Submission } from "@/types/learning";
import {
  DataTable,
  StatusBadge,
  Button,
  SummaryMetricCard,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import { Eye, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

import { getSiswaKelasId } from "@/utils/student";

export const AssignmentsListPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const [allTugas, allSubs] = await Promise.all([
          learningService.getTugas(),
          learningService.getSubmissions(),
        ]);
        // Only published assignments for student's class
        const classId = getSiswaKelasId(user);
        const published = allTugas.filter(
          (t) =>
            t.status === "Dipublikasikan" &&
            String(t.kelasId) === String(classId),
        );
        const mySubs = allSubs.filter((s) => s.siswaId === user.id);
        setTugasList(published);
        setSubmissions(mySubs);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat data tugas.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const getSubmissionStatus = (tugasId: string) => {
    const sub = submissions.find((s) => s.tugasId === tugasId);
    if (!sub) return "Belum Mengumpulkan";
    return sub.status;
  };

  const getSubmissionGrade = (tugasId: string): string => {
    const sub = submissions.find((s) => s.tugasId === tugasId);
    if (!sub?.grade) return "-";
    return String(sub.grade);
  };

  // Summary calculations
  const belumDikumpulkan = tugasList.filter(
    (t) => getSubmissionStatus(t.id) === "Belum Mengumpulkan",
  ).length;
  const terkumpul = tugasList.filter(
    (t) => getSubmissionStatus(t.id) === "Terkumpul",
  ).length;
  const late = tugasList.filter(
    (t) => getSubmissionStatus(t.id) === "Late",
  ).length;

  const columns = [
    {
      header: "Mata Pelajaran",
      cell: (t: Tugas) => (
        <div>
          <span className="text-[13px] font-semibold text-bg-ink">
            {t.mapelName}
          </span>
          <span className="block text-[11px] text-bg-ink-muted">
            {t.kelasName}
          </span>
        </div>
      ),
    },
    {
      header: "Judul Tugas",
      cell: (t: Tugas) => (
        <Link
          to={`/siswa/assignments/${t.id}`}
          className="text-[13px] font-bold text-primary hover:underline"
        >
          {t.title}
        </Link>
      ),
    },
    {
      header: "Deadline",
      cell: (t: Tugas) => {
        const today = new Date().toISOString().split("T")[0];
        const isPast = t.dueDate < today;
        return (
          <span
            className={`text-[12px] font-mono font-semibold ${
              isPast ? "text-status-danger" : "text-bg-ink-secondary"
            }`}
          >
            {t.dueDate}
          </span>
        );
      },
    },
    {
      header: "Status Pengumpulan",
      cell: (t: Tugas) => {
        const status = getSubmissionStatus(t.id);
        const state =
          status === "Terkumpul"
            ? "safe"
            : status === "Late"
              ? "danger"
              : "warning";
        return <StatusBadge label={status} state={state} size="xs" />;
      },
    },
    {
      header: "Nilai",
      cell: (t: Tugas) => {
        const grade = getSubmissionGrade(t.id);
        return (
          <span className="text-[13px] font-bold font-mono text-primary">
            {grade}
          </span>
        );
      },
    },
    {
      header: "Aksi",
      cell: (t: Tugas) => (
        <Link to={`/siswa/assignments/${t.id}`}>
          <Button
            size="sm"
            variant="secondary"
            className="text-[11px] h-7 gap-1 font-semibold"
          >
            <Eye className="h-3 w-3" /> Detail
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
          Tugas Saya
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Daftar semua tugas yang dipublikasikan pada semester aktif.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryMetricCard
          label="Belum Dikumpulkan"
          value={String(belumDikumpulkan)}
          desc="Tugas aktif perlu dikerjakan"
          icon={<AlertCircle className="h-4 w-4" />}
          variant="warning"
          tooltip="Jumlah tugas yang belum dikumpulkan oleh Anda."
        />
        <SummaryMetricCard
          label="Terkumpul"
          value={String(terkumpul)}
          desc="Tugas selesai dikirimkan"
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="safe"
          tooltip="Jumlah tugas yang sudah Anda kumpulkan tepat waktu."
        />
        <SummaryMetricCard
          label="Terlambat"
          value={String(late)}
          desc="Melewati batas tenggat"
          icon={<Clock className="h-4 w-4" />}
          variant="danger"
          tooltip="Jumlah tugas yang dikumpulkan terlambat atau belum dikumpulkan setelah tenggat."
        />
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Memuat data tugas..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <DataTable
          title="Seluruh Tugas"
          columns={columns}
          data={tugasList}
          keyExtractor={(t) => t.id}
          emptyStateTitle="Belum ada tugas"
          emptyStateDescription="Belum ada tugas yang dipublikasikan pada semester ini."
        />
      )}
    </div>
  );
};
export default AssignmentsListPage;

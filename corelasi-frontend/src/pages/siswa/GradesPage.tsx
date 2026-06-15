import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { learningService } from "@/services/learningService";
import type { StudentGradeSummary } from "@/types/report";
import {
  DataTable,
  SummaryMetricCard,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import { Award, Clock, CheckSquare } from "lucide-react";

interface GradeRow {
  tugasId: string;
  tugasTitle: string;
  mapelName: string;
  score?: number;
  feedback?: string;
}

import { getSiswaKelasId } from "@/utils/student";

export const GradesPage: React.FC = () => {
  const { user } = useAuth();
  const [studentReport, setStudentReport] =
    useState<StudentGradeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrades = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const [allTugas, allSubs] = await Promise.all([
        learningService.getTugas(),
        learningService.getSubmissions(),
      ]);

      const classId = getSiswaKelasId(user);
      const published = allTugas.filter(
        (t) =>
          t.status === "Dipublikasikan" &&
          String(t.kelasId) === String(classId),
      );
      const mySubs = allSubs.filter((s) => s.siswaId === user.id);

      const grades: GradeRow[] = published.map((t) => {
        const sub = mySubs.find((s) => s.tugasId === t.id);
        return {
          tugasId: String(t.id),
          tugasTitle: t.title,
          mapelName: t.mapelName,
          score: sub?.grade,
          feedback: sub?.feedback,
        };
      });

      const gradedGrades = grades.filter((g) => g.score !== undefined);
      const totalScore = gradedGrades.reduce(
        (sum, g) => sum + (g.score || 0),
        0,
      );
      const average =
        gradedGrades.length > 0
          ? Math.round(totalScore / gradedGrades.length)
          : 0;

      setStudentReport({
        siswaId: user.id,
        siswaName: user.name || "",
        nis: user.nipOrNis || "",
        kelasName: user.kelasName || "",
        grades,
        average,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data nilai.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(fetchGrades);
  }, [fetchGrades]);

  const columns = [
    {
      header: "Mata Pelajaran",
      cell: (g: GradeRow) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {g.mapelName}
        </span>
      ),
    },
    {
      header: "Nama Tugas / Evaluasi",
      cell: (g: GradeRow) => (
        <span className="text-[13px] font-bold text-bg-ink font-sans">
          {g.tugasTitle}
        </span>
      ),
    },
    {
      header: "Perolehan Nilai",
      cell: (g: GradeRow) =>
        g.score !== undefined ? (
          <span className="text-[14px] font-bold font-mono text-primary flex items-center gap-1">
            <Award className="h-4 w-4" />
            {g.score}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-bg-ink-muted bg-bg-sage-slate px-2 py-0.5 rounded-[4px]">
            Belum Dinilai
          </span>
        ),
    },
    {
      header: "Umpan Balik Guru",
      cell: (g: GradeRow) =>
        g.feedback ? (
          <span className="text-[12px] text-bg-ink-secondary italic leading-relaxed">
            "{g.feedback}"
          </span>
        ) : (
          <span className="text-[11px] text-bg-ink-muted">-</span>
        ),
    },
  ];

  if (loading) {
    return <LoadingState message="Memuat data nilai Anda..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchGrades} />;
  }

  const average = studentReport?.average ?? 0;
  const grades = studentReport ? studentReport.grades : [];
  const totalTugas = grades.length;
  const gradedTugas = grades.filter((g) => g.score !== undefined).length;
  const pendingTugas = totalTugas - gradedTugas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
          Daftar Nilai Saya
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Lihat riwayat perolehan skor nilai tugas, ujian, dan umpan balik
          akademis dari guru Anda.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryMetricCard
          label="Rata-rata Nilai"
          value={String(average)}
          desc="Skor kumulatif seluruh tugas"
          icon={<Award className="h-4 w-4" />}
          variant="excellent"
          tooltip="Nilai rata-rata akumulatif dari semua tugas Anda yang telah dinilai."
        />
        <SummaryMetricCard
          label="Tugas Telah Dinilai"
          value={String(gradedTugas)}
          desc="Tugas tuntas dikoreksi"
          icon={<CheckSquare className="h-4 w-4" />}
          variant="safe"
          tooltip="Jumlah tugas yang sudah dikumpulkan dan selesai diberikan nilai oleh guru."
        />
        <SummaryMetricCard
          label="Menunggu Penilaian"
          value={String(pendingTugas)}
          desc="Tugas belum dikoreksi"
          icon={<Clock className="h-4 w-4" />}
          variant="warning"
          tooltip="Tugas yang sudah dikumpulkan atau masih berjalan tetapi belum dinilai."
        />
      </div>

      {/* Main Table */}
      <DataTable
        title="Daftar Rincian Nilai Tugas Akademik Anda"
        columns={columns}
        data={grades}
        keyExtractor={(g) => g.tugasId}
        emptyStateTitle="Tidak ada nilai"
        emptyStateDescription="Belum ada data nilai tugas mandiri yang terbit untuk kelas Anda."
      />
    </div>
  );
};
export default GradesPage;

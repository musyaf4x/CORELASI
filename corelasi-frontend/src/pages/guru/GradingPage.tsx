import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { learningService } from "@/services/learningService";
import type { Tugas, Submission } from "@/types/learning";
import {
  DataTable,
  Button,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import { Award, Eye } from "lucide-react";

export const GradingPage: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Tugas[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const [allTug, allSub] = await Promise.all([
        learningService.getTugasByGuru(user.id),
        learningService.getSubmissions(),
      ]);
      setAssignments(allTug);
      setSubmissions(allSub);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data penilaian.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const getStatsForTugas = (tugasId: string) => {
    const subs = submissions.filter((s) => s.tugasId === tugasId);
    const graded = subs.filter((s) => s.grade !== undefined);

    let averageStr = "-";
    if (graded.length > 0) {
      const sum = graded.reduce((acc, curr) => acc + (curr.grade || 0), 0);
      averageStr = String(Math.round(sum / graded.length));
    }

    return {
      totalSubmitted: subs.length,
      totalGraded: graded.length,
      average: averageStr,
    };
  };

  const columns = [
    {
      header: "Mata Pelajaran",
      cell: (t: Tugas) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {t.mapelName}
        </span>
      ),
    },
    {
      header: "Nama Tugas",
      cell: (t: Tugas) => (
        <span className="text-[13px] text-bg-ink font-sans font-bold">
          {t.title}
        </span>
      ),
    },
    {
      header: "Kelas",
      cell: (t: Tugas) => (
        <span className="text-[12px] font-semibold text-bg-ink-secondary">
          {t.kelasName}
        </span>
      ),
    },
    {
      header: "Pengumpulan",
      cell: (t: Tugas) => {
        const stats = getStatsForTugas(t.id);
        return (
          <span className="text-[11px] font-mono font-semibold text-bg-ink-secondary bg-bg-sage-slate px-2 py-0.5 rounded-[4px]">
            {stats.totalSubmitted} Terkumpul
          </span>
        );
      },
    },
    {
      header: "Telah Dinilai",
      cell: (t: Tugas) => {
        const stats = getStatsForTugas(t.id);
        return (
          <span className="text-[11px] font-mono font-semibold text-text-safe bg-bg-safe-tint border border-border-safe/40 px-2 py-0.5 rounded-[4px]">
            {stats.totalGraded} Dinilai
          </span>
        );
      },
    },
    {
      header: "Rerata Nilai",
      cell: (t: Tugas) => {
        const stats = getStatsForTugas(t.id);
        return (
          <span className="text-[13px] font-bold font-mono text-primary flex items-center gap-1">
            <Award className="h-4 w-4" />
            {stats.average}
          </span>
        );
      },
    },
    {
      header: "Aksi",
      cell: (t: Tugas) => (
        <Link to={`/guru/assignments/${t.id}`}>
          <Button
            size="sm"
            variant="secondary"
            className="text-[11px] h-7 gap-1 font-semibold"
          >
            <Eye className="h-3 w-3" />
            Kelola Nilai
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
          Penilaian & Evaluasi Tugas
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Periksa hasil solusi jawaban yang dikirimkan oleh siswa, berikan umpan
          balik, dan input nilai evaluasi KBM.
        </p>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingState message="Memuat data evaluasi tugas..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <DataTable
          title="Daftar Tugas Aktif Kelas Anda"
          columns={columns}
          data={assignments}
          keyExtractor={(t) => t.id}
          emptyStateTitle="Tidak ada tugas"
          emptyStateDescription="Belum ada tugas mandiri/evaluasi yang dipublikasikan untuk dinilai."
        />
      )}
    </div>
  );
};
export default GradingPage;

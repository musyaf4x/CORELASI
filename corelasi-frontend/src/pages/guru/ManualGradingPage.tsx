import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { learningService } from "@/services/learningService";
import {
  DataTable,
  Button,
  StatusBadge,
  Select,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import { Award, Save, Upload } from "lucide-react";

interface ManualGradeEntry {
  siswaId: string;
  siswaName: string;
  kelasName: string;
  mapelName: string;
  nilaiTugas: string;
  nilaiManual: string;
  nilaiAkhir: string;
  status: "Belum Dinilai" | "Sudah Dinilai" | "Dipublikasikan";
}

export const ManualGradingPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ManualGradeEntry[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const [tugasList, subs] = await Promise.all([
          learningService.getTugasByGuru(user.id),
          learningService.getSubmissions(),
        ]);

        // Build unique students with their average tugas grades
        const studentGrades = new Map<string, ManualGradeEntry>();

        subs.forEach((sub) => {
          const tugas = tugasList.find((t) => t.id === sub.tugasId);
          if (!tugas) return;

          const key = `${sub.siswaId}-${tugas.mapelId}`;
          if (!studentGrades.has(key)) {
            studentGrades.set(key, {
              siswaId: sub.siswaId,
              siswaName: sub.siswaName,
              kelasName: tugas.kelasName,
              mapelName: tugas.mapelName,
              nilaiTugas: sub.grade ? String(sub.grade) : "-",
              nilaiManual: "-",
              nilaiAkhir: sub.grade ? String(sub.grade) : "-",
              status: sub.grade ? "Sudah Dinilai" : "Belum Dinilai",
            });
          }
        });

        setEntries(Array.from(studentGrades.values()));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat data nilai manual.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Get unique kelas and mapel for filters
  const kelasOptions = [...new Set(entries.map((e) => e.kelasName))];
  const mapelOptions = [...new Set(entries.map((e) => e.mapelName))];

  const filteredEntries = entries.filter((e) => {
    if (selectedKelas && e.kelasName !== selectedKelas) return false;
    if (selectedMapel && e.mapelName !== selectedMapel) return false;
    return true;
  });

  const columns = [
    {
      header: "Nama Siswa",
      cell: (e: ManualGradeEntry) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {e.siswaName}
        </span>
      ),
    },
    {
      header: "Kelas",
      cell: (e: ManualGradeEntry) => (
        <span className="text-[12px] font-semibold text-bg-ink-secondary">
          {e.kelasName}
        </span>
      ),
    },
    {
      header: "Mata Pelajaran",
      cell: (e: ManualGradeEntry) => (
        <span className="text-[13px] text-bg-ink-secondary">{e.mapelName}</span>
      ),
    },
    {
      header: "Nilai Tugas",
      cell: (e: ManualGradeEntry) => (
        <span className="text-[14px] font-bold font-mono text-primary">
          {e.nilaiTugas}
        </span>
      ),
    },
    {
      header: "Nilai Manual",
      cell: (e: ManualGradeEntry) => (
        <span className="text-[14px] font-bold font-mono text-bg-ink">
          {e.nilaiManual}
        </span>
      ),
    },
    {
      header: "Nilai Akhir",
      cell: (e: ManualGradeEntry) => (
        <span className="text-[14px] font-bold font-mono text-primary flex items-center gap-1">
          <Award className="h-4 w-4" />
          {e.nilaiAkhir}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (e: ManualGradeEntry) => {
        let state: "safe" | "warning" | "disabled" = "disabled";
        if (e.status === "Dipublikasikan") state = "safe";
        else if (e.status === "Sudah Dinilai") state = "warning";
        return <StatusBadge label={e.status} state={state} size="xs" />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            Nilai Manual
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Masukkan nilai komponen offline dan simpan nilai akhir operasional.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="gap-1.5 text-[12px] font-semibold h-9"
          >
            <Save className="h-4 w-4" />
            Simpan Nilai
          </Button>
          <Button className="gap-1.5 text-[12px] font-semibold h-9">
            <Upload className="h-4 w-4" />
            Publikasikan
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 rounded-[6px] border border-bg-border bg-bg-surface p-4">
        <div className="flex-1">
          <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
            Kelas
          </label>
          <Select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
          >
            <option value="">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
            Mata Pelajaran
          </label>
          <Select
            value={selectedMapel}
            onChange={(e) => setSelectedMapel(e.target.value)}
          >
            <option value="">Semua Mapel</option>
            {mapelOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Memuat data nilai..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <DataTable
          title="Daftar Nilai Siswa"
          columns={columns}
          data={filteredEntries}
          keyExtractor={(e) => `${e.siswaId}-${e.mapelName}`}
          emptyStateTitle="Belum ada data nilai"
          emptyStateDescription="Belum ada submission yang tersedia untuk dinilai."
        />
      )}
    </div>
  );
};
export default ManualGradingPage;

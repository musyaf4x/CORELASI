import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { learningService } from "@/services/learningService";
import { scheduleService } from "@/services/scheduleService";
import { journalService } from "@/services/journalService";
import { userService } from "@/services/userService";
import { LoadingState, StatusBadge, ErrorState } from "@/components/shared";
import {
  Building,
  BookOpen,
  FileCheck2,
  Calendar,
  ArrowRight,
} from "lucide-react";

interface KelasMapelSummary {
  kelasId: string;
  kelasName: string;
  mapelId: string;
  mapelName: string;
  jumlahSiswa: number;
  jadwalRutin: string;
  tugasAktif: number;
  jurnalTerakhir: string;
}

interface MapelTheme {
  border: string;
  bgHeader: string;
  textPrimary: string;
  textSecondary: string;
  badgeState:
    | "info"
    | "safe"
    | "warning"
    | "danger"
    | "neutral"
    | "excellent"
    | "pending";
}

const getMapelTheme = (mapelName: string): MapelTheme => {
  const name = mapelName.toLowerCase();

  if (name.includes("matematika") || name.includes("math")) {
    return {
      border: "border-t-status-info",
      bgHeader: "bg-status-info/[0.04]",
      textPrimary: "text-text-info",
      textSecondary: "text-text-info/80",
      badgeState: "info",
    };
  }

  if (name.includes("fisika") || name.includes("physics")) {
    return {
      border: "border-t-primary",
      bgHeader: "bg-primary/[0.04]",
      textPrimary: "text-primary",
      textSecondary: "text-primary-hover",
      badgeState: "excellent",
    };
  }

  if (name.includes("kimia") || name.includes("chemistry")) {
    return {
      border: "border-t-status-excellent",
      bgHeader: "bg-bg-excellent-tint",
      textPrimary: "text-text-excellent",
      textSecondary: "text-text-excellent/80",
      badgeState: "excellent",
    };
  }

  if (name.includes("biologi") || name.includes("biology")) {
    return {
      border: "border-t-status-safe",
      bgHeader: "bg-bg-safe-tint",
      textPrimary: "text-text-safe",
      textSecondary: "text-text-safe/80",
      badgeState: "safe",
    };
  }

  // Default Fallback
  return {
    border: "border-t-bg-border-muted",
    bgHeader: "bg-bg-sage-slate",
    textPrimary: "text-bg-ink-secondary",
    textSecondary: "text-bg-ink-muted",
    badgeState: "neutral",
  };
};

export const ClassesPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kelasList, setKelasList] = useState<KelasMapelSummary[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const [materis, tugasList, schedules, journals, users] =
        await Promise.all([
          learningService.getMateriByGuru(user.id),
          learningService.getTugasByGuru(user.id),
          scheduleService.getJadwalPembelajaran(),
          journalService.getJournals(),
          userService.getAll(),
        ]);
      const studentCountByClass = new Map<string, number>();
      users
        .filter((item) => item.role === "siswa" && item.kelasId)
        .forEach((item) => {
          const classId = String(item.kelasId);
          studentCountByClass.set(
            classId,
            (studentCountByClass.get(classId) ?? 0) + 1,
          );
        });

      // Build unique kelas-mapel combinations from teacher's materials + assignments
      const kelasMap = new Map<string, KelasMapelSummary>();

      const addEntry = (
        kelasId: string,
        kelasName: string,
        mapelId: string,
        mapelName: string,
      ) => {
        const key = `${kelasId}-${mapelId}`;
        if (!kelasMap.has(key)) {
          // Find schedule for this kelas-mapel
          const schedule = schedules.find(
            (s) =>
              String(s.kelasId) === String(kelasId) &&
              String(s.mapelId) === String(mapelId) &&
              String(s.guruId) === String(user.id),
          );
          const jadwalRutin = schedule
            ? `${schedule.hari}, ${schedule.waktuMulai} - ${schedule.waktuSelesai}`
            : "-";

          // Count active assignments
          const activeTugas = tugasList.filter(
            (t) =>
              String(t.kelasId) === String(kelasId) &&
              String(t.mapelId) === String(mapelId) &&
              t.status === "Dipublikasikan",
          ).length;

          // Find last journal
          const relatedJournals = journals.filter(
            (j) =>
              String(j.kelasId) === String(kelasId) &&
              String(j.mapelId) === String(mapelId),
          );
          const lastJournal =
            relatedJournals.length > 0
              ? [...relatedJournals].sort((a, b) =>
                  b.date.localeCompare(a.date),
                )[0].date
              : "-";

          kelasMap.set(key, {
            kelasId,
            kelasName,
            mapelId,
            mapelName,
            jumlahSiswa: studentCountByClass.get(String(kelasId)) ?? 0,
            jadwalRutin,
            tugasAktif: activeTugas,
            jurnalTerakhir: lastJournal,
          });
        }
      };

      materis.forEach((m) =>
        addEntry(m.kelasId, m.kelasName, m.mapelId, m.mapelName),
      );
      tugasList.forEach((t) =>
        addEntry(t.kelasId, t.kelasName, t.mapelId, t.mapelName),
      );

      // Also add from schedules where this guru is assigned
      schedules
        .filter((s) => String(s.guruId) === String(user.id))
        .forEach((s) =>
          addEntry(s.kelasId, s.kelasName, s.mapelId, s.mapelName),
        );

      setKelasList(Array.from(kelasMap.values()));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data kelas mengajar.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  if (loading) {
    return <LoadingState message="Memuat data kelas mengajar..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
          Kelas Saya
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Daftar kelas dan mata pelajaran yang Anda ampu pada semester aktif.
        </p>
      </div>

      {/* Kelas Cards */}
      {kelasList.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-[6px] border border-bg-border bg-bg-surface p-8 text-center">
          <Building className="mb-3 h-10 w-10 text-bg-ink-muted" />
          <h3 className="text-[14px] font-semibold text-bg-ink">
            Belum ada kelas diampu
          </h3>
          <p className="mt-1 text-[12px] text-bg-ink-muted max-w-sm">
            Anda belum memiliki kelas-mapel yang diampu pada semester ini.
            Hubungi Admin untuk pengaturan jadwal.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((kelas) => {
            const theme = getMapelTheme(kelas.mapelName);
            return (
              <Link
                key={`${kelas.kelasId}-${kelas.mapelId}`}
                to={`/guru/classes/${kelas.kelasId}?mapel=${kelas.mapelId}`}
                className={`group rounded-[6px] border border-bg-border ${theme.border} border-t-2 bg-bg-surface shadow-[0_1px_3px_rgba(20,33,26,0.05)] transition-colors hover:border-bg-border-muted block overflow-hidden`}
              >
                {/* Card Header with subtle subject-specific tint */}
                <div
                  className={`${theme.bgHeader} border-b border-bg-border/40 px-5 py-4 flex items-start justify-between`}
                >
                  <div>
                    <h2 className="text-[15px] font-bold text-bg-ink">
                      {kelas.kelasName}
                    </h2>
                    <p
                      className={`text-[13px] font-semibold ${theme.textPrimary} mt-0.5`}
                    >
                      {kelas.mapelName}
                    </p>
                  </div>
                  <StatusBadge
                    label={`${kelas.jumlahSiswa} Siswa`}
                    state={theme.badgeState}
                    size="xs"
                    showDot={false}
                  />
                </div>

                {/* Card Body */}
                <div className="p-5">
                  {/* Stats List */}
                  <div className="mb-4 space-y-2.5 text-[13px] text-bg-ink-secondary">
                    {/* Jadwal */}
                    <div className="flex items-center justify-between h-7">
                      <span className="flex items-center gap-2 text-bg-ink-muted">
                        <Calendar className="h-3.5 w-3.5" />
                        Jadwal
                      </span>
                      {kelas.jadwalRutin === "-" ? (
                        <span className="text-bg-ink-muted flex items-center gap-1.5 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-bg-border-muted" />
                          Belum diatur
                        </span>
                      ) : (
                        <span className="font-semibold text-bg-ink text-[12px] text-right leading-none">
                          {kelas.jadwalRutin}
                        </span>
                      )}
                    </div>

                    {/* Tugas Aktif */}
                    <div className="flex items-center justify-between h-7">
                      <span className="flex items-center gap-2 text-bg-ink-muted">
                        <FileCheck2 className="h-3.5 w-3.5" />
                        Tugas Aktif
                      </span>
                      {kelas.tugasAktif > 0 ? (
                        <span className="flex items-center gap-1.5 font-semibold text-text-warning">
                          <span className="h-1.5 w-1.5 rounded-full bg-status-warning" />
                          {kelas.tugasAktif} Aktif
                        </span>
                      ) : (
                        <span className="text-bg-ink-muted flex items-center gap-1.5 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-bg-border-muted" />
                          Tidak ada
                        </span>
                      )}
                    </div>

                    {/* Jurnal Terakhir */}
                    <div className="flex items-center justify-between h-7">
                      <span className="flex items-center gap-2 text-bg-ink-muted">
                        <BookOpen className="h-3.5 w-3.5" />
                        Jurnal Terakhir
                      </span>
                      {kelas.jurnalTerakhir === "-" ? (
                        <span className="flex items-center gap-1.5 text-bg-ink-secondary font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-status-pending" />
                          Belum diisi
                        </span>
                      ) : (
                        <span className="font-semibold text-bg-ink-secondary font-mono text-[12px] flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-status-safe" />
                          {kelas.jurnalTerakhir}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Affordance */}
                  <div className="pt-3.5 border-t border-bg-border/40 flex items-center justify-between text-[12px] font-semibold text-primary group-hover:text-primary-hover transition-colors">
                    <span>Masuk Kelas</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ClassesPage;

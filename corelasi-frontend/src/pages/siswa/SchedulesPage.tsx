import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { scheduleService } from "@/services/scheduleService";
import { getSiswaKelasId } from "@/utils/student";
import type { JadwalPembelajaran } from "@/types/schedule";
import {
  FilterBar,
  LoadingState,
  CalendarBoard,
  ErrorState,
} from "@/components/shared";

export const SchedulesPage: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<JadwalPembelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("");

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const data = await scheduleService.getJadwalPembelajaran();
        // Filter by the student's class (coerced comparison)
        const classId = getSiswaKelasId(user);
        const myClassSchedules = data.filter(
          (s) => String(s.kelasId) === String(classId),
        );
        setSchedules(myClassSchedules);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat jadwal belajar.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, [user]);

  const filteredSchedules = useMemo(() => {
    let result = schedules;
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.mapelName.toLowerCase().includes(q) ||
          s.guruName.toLowerCase().includes(q),
      );
    }
    if (dayFilter !== "") {
      result = result.filter((s) => s.hari === dayFilter);
    }
    return result;
  }, [schedules, search, dayFilter]);

  const classNameVal = schedules[0]?.kelasName || "Kelas Saya";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
          Jadwal Belajar: {classNameVal}
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Daftar jadwal mata pelajaran dan ruang kelas untuk periode semester
          ini.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchPlaceholder="Cari mata pelajaran atau nama guru..."
        searchValue={search}
        onSearchChange={setSearch}
        filterValue={dayFilter}
        onFilterChange={setDayFilter}
        filterPlaceholder="Semua Hari"
        filterOptions={[
          { value: "Senin", label: "Senin" },
          { value: "Selasa", label: "Selasa" },
          { value: "Rabu", label: "Rabu" },
          { value: "Kamis", label: "Kamis" },
          { value: "Jumat", label: "Jumat" },
          { value: "Sabtu", label: "Sabtu" },
        ]}
      />

      {loading ? (
        <LoadingState message="Memuat jadwal belajar..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : (
        <CalendarBoard
          items={filteredSchedules.map((s) => {
            let theme:
              | "primary"
              | "success"
              | "warning"
              | "danger"
              | "info"
              | "excellent"
              | "pending"
              | "neutral" = "neutral";
            if (s.kelasName.startsWith("X-")) {
              theme = "excellent";
            } else if (s.kelasName.startsWith("XI-")) {
              theme = "info";
            } else if (s.kelasName.startsWith("XII-")) {
              theme = "warning";
            }
            return {
              id: s.id,
              hari: s.hari,
              waktuMulai: s.waktuMulai,
              waktuSelesai: s.waktuSelesai,
              title: s.mapelName,
              subtitle: s.guruName,
              tag: s.kelasName,
              colorTheme: theme,
            };
          })}
          emptyText="Tidak ada jadwal belajar untuk kelas Anda"
        />
      )}
    </div>
  );
};
export default SchedulesPage;

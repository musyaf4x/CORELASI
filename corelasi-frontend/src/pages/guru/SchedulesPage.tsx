import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { scheduleService } from "@/services/scheduleService";
import type { JadwalPembelajaran } from "@/types/schedule";
import {
  FilterBar,
  LoadingState,
  CalendarBoard,
  EmptyState,
  ErrorState,
} from "@/components/shared";
import { Calendar } from "lucide-react";
import type { HariBelajar } from "@/components/shared/CalendarBoard";

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
        // Filter only schedules belonging to the logged in teacher
        const mySchedules = data.filter(
          (s) => String(s.guruId) === String(user.id),
        );
        setSchedules(mySchedules);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat jadwal mengajar.",
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
          s.kelasName.toLowerCase().includes(q),
      );
    }
    if (dayFilter !== "") {
      result = result.filter((s) => s.hari === dayFilter);
    }
    return result;
  }, [schedules, search, dayFilter]);

  const isFiltered = search.trim() !== "" || dayFilter !== "";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
          Jadwal Mengajar Saya
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Daftar kelas dan mata pelajaran yang Anda ampu pada semester aktif
          ini.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchPlaceholder="Cari berdasarkan kelas atau mata pelajaran..."
        searchValue={search}
        onSearchChange={setSearch}
        filterValue={dayFilter}
        onFilterChange={setDayFilter}
        filterPlaceholder="Semua Hari"
        filterLabel="Hari"
        searchLabel="Pencarian Jadwal"
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
        <LoadingState message="Memuat jadwal mengajar..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : filteredSchedules.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={
            isFiltered
              ? "Tidak ada hasil pencarian"
              : "Tidak ada jadwal mengajar"
          }
          description={
            isFiltered
              ? "Coba ubah kata kunci pencarian atau filter hari Anda."
              : "Anda tidak memiliki jadwal mengajar terdaftar pada semester ini."
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-bg-ink font-sans">
              Jadwal Mengajar Mingguan
            </h2>
            <span className="text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-[4px]">
              {filteredSchedules.length} Kelas Terdaftar
            </span>
          </div>
          <CalendarBoard
            items={filteredSchedules.map((s) => ({
              id: s.id,
              hari: s.hari as HariBelajar,
              waktuMulai: s.waktuMulai,
              waktuSelesai: s.waktuSelesai,
              title: s.mapelName,
              tag: s.kelasName,
              colorTheme: "primary",
            }))}
            emptyText="Tidak ada jadwal"
          />
        </div>
      )}
    </div>
  );
};

export default SchedulesPage;

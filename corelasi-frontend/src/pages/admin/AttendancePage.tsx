import React, { useEffect, useMemo, useState } from "react";
import { attendanceService } from "@/services/attendanceService";
import { academicService } from "@/services/academicService";
import { userService } from "@/services/userService";
import type { AbsensiSiswa, StatusKehadiran } from "@/types/attendance";
import type { Kelas } from "@/types/academic";
import {
  DataTable,
  SummaryMetricCard,
  LoadingState,
  FilterBar,
  StatusBadge,
  Modal,
  Select,
  Button,
  Toast,
  ErrorState,
} from "@/components/shared";
import type { SemanticState } from "@/utils/semanticState";
import { getActiveDateString } from "@/utils/student";
import {
  ClipboardCheck,
  Users,
  AlertCircle,
  AlertTriangle,
  Edit3,
} from "lucide-react";

interface ClassAttendanceSummary {
  kelasId: string;
  kelasName: string;
  totalSiswa: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  percentage: number;
}

const formatTanggal = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export const AttendancePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AbsensiSiswa[]>([]);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [studentClassIds, setStudentClassIds] = useState<string[]>([]);
  const [tanggal, setTanggal] = useState(getActiveDateString());
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"rekap" | "monitoring">("rekap");

  // Log filter states
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // Override modal states
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AbsensiSiswa | null>(null);
  const [statusBaru, setStatusBaru] = useState<StatusKehadiran>("Hadir");
  const [alasanOverride, setAlasanOverride] = useState("");
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [isOverriding, setIsOverriding] = useState(false);

  const fetchData = async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const [absData, clData, users] = await Promise.all([
        attendanceService.getAbsensiSiswa(),
        academicService.getKelas(),
        userService.getAll(),
      ]);
      setAttendanceData(absData);
      setClasses(clData);
      setStudentClassIds(
        users
          .filter((user) => user.role === "siswa" && user.kelasId)
          .map((user) => String(user.kelasId)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data absensi.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, []);

  const summaryList = useMemo(() => {
    // Generate summaries for each class for the selected date
    const dateLogs = attendanceData.filter((a) => a.tanggal === tanggal);

    const summaries: ClassAttendanceSummary[] = classes.map((c) => {
      const classLogs = dateLogs.filter(
        (a) => String(a.kelasId) === String(c.id),
      );

      const studentStatusMap = new Map<string, StatusKehadiran>();
      classLogs.forEach((log) => {
        const current = studentStatusMap.get(log.siswaId);
        if (!current || (current === "Hadir" && log.status !== "Hadir")) {
          studentStatusMap.set(log.siswaId, log.status);
        }
      });

      const totalSiswa = studentClassIds.filter(
        (kelasId) => kelasId === String(c.id),
      ).length;
      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alpa = 0;

      studentStatusMap.forEach((status) => {
        if (status === "Hadir") hadir++;
        else if (status === "Sakit") sakit++;
        else if (status === "Izin") izin++;
        else if (status === "Alpa") alpa++;
      });

      const percentage =
        totalSiswa > 0 ? Math.round((hadir / totalSiswa) * 100) : 0;

      return {
        kelasId: c.id,
        kelasName: c.name,
        totalSiswa,
        hadir,
        sakit,
        izin,
        alpa,
        percentage,
      };
    });

    return summaries;
  }, [attendanceData, classes, studentClassIds, tanggal]);

  const filteredSummary = useMemo(() => {
    let result = summaryList;
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter((s) => s.kelasName.toLowerCase().includes(q));
    }
    return result;
  }, [summaryList, search]);

  // Overall Statistics
  const totalStudents = summaryList.reduce(
    (acc, curr) => acc + curr.totalSiswa,
    0,
  );
  const totalHadir = summaryList.reduce((acc, curr) => acc + curr.hadir, 0);
  const totalAlpa = summaryList.reduce((acc, curr) => acc + curr.alpa, 0);
  const averagePercentage =
    totalStudents > 0 ? Math.round((totalHadir / totalStudents) * 100) : 0;

  // Filtered student logs
  const filteredLogs = attendanceData.filter((log) => {
    // Match date
    if (log.tanggal !== tanggal) return false;

    // Match kelas
    if (selectedKelas && String(log.kelasId) !== String(selectedKelas))
      return false;

    // Match status
    if (selectedStatus && log.status !== selectedStatus) return false;

    // Match search query (student name or NIS)
    if (studentSearch.trim() !== "") {
      const q = studentSearch.toLowerCase();
      const nameMatch = log.siswaName.toLowerCase().includes(q);
      const nisMatch = log.nis && log.nis.includes(q);
      if (!nameMatch && !nisMatch) return false;
    }

    return true;
  });

  const handleOpenOverride = (log: AbsensiSiswa) => {
    setSelectedLog(log);
    setStatusBaru(log.status);
    setAlasanOverride("");
    setOverrideError(null);
    setIsOverrideModalOpen(true);
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;
    if (!alasanOverride.trim()) {
      setOverrideError("Alasan override wajib diisi.");
      return;
    }
    if (alasanOverride.trim().length < 5) {
      setOverrideError("Alasan override minimal 5 karakter.");
      return;
    }

    setIsOverriding(true);
    setOverrideError(null);
    try {
      await attendanceService.overrideAbsensiSiswa(
        selectedLog.id,
        statusBaru,
        alasanOverride.trim(),
      );
      await fetchData();
      setIsOverrideModalOpen(false);
      setToastMessage(
        `Berhasil override kehadiran ${selectedLog.siswaName} menjadi ${statusBaru}!`,
      );
    } catch (err: unknown) {
      setOverrideError(
        err instanceof Error
          ? err.message
          : "Gagal melakukan override absensi.",
      );
    } finally {
      setIsOverriding(false);
    }
  };

  const columns = [
    {
      header: "Nama Kelas",
      cell: (s: ClassAttendanceSummary) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {s.kelasName}
        </span>
      ),
    },
    {
      header: "Total Siswa",
      cell: (s: ClassAttendanceSummary) => (
        <span className="text-[13px] font-medium text-bg-ink-secondary">
          {s.totalSiswa} Siswa
        </span>
      ),
    },
    {
      header: "Hadir",
      cell: (s: ClassAttendanceSummary) => (
        <span className="text-[13px] font-semibold text-primary">
          {s.hadir}
        </span>
      ),
    },
    {
      header: "Sakit / Izin",
      cell: (s: ClassAttendanceSummary) => (
        <span className="text-[13px] font-medium text-bg-ink-secondary">
          {s.sakit + s.izin}
        </span>
      ),
    },
    {
      header: "Alpa",
      cell: (s: ClassAttendanceSummary) => (
        <span
          className={`text-[13px] font-semibold ${s.alpa > 0 ? "text-status-danger" : "text-bg-ink-muted"}`}
        >
          {s.alpa}
        </span>
      ),
    },
    {
      header: "Tingkat Kehadiran",
      cell: (s: ClassAttendanceSummary) => {
        let state: SemanticState = "safe";
        if (s.percentage < 90) state = "danger";
        else if (s.percentage < 95) state = "warning";

        return (
          <StatusBadge label={`${s.percentage}%`} state={state} size="xs" />
        );
      },
    },
  ];

  const logColumns = [
    {
      header: "Tanggal / Sesi",
      cell: (log: AbsensiSiswa) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-bg-ink">
            {formatTanggal(log.tanggal)}
          </span>
          {log.mapelName && (
            <span className="text-[10px] text-bg-ink-muted">
              {log.mapelName}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Kelas",
      cell: (log: AbsensiSiswa) => (
        <span className="text-[13px] font-medium text-bg-ink-secondary">
          {log.kelasName}
        </span>
      ),
    },
    {
      header: "Nama Siswa",
      cell: (log: AbsensiSiswa) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-bg-ink">
            {log.siswaName}
          </span>
          <span className="text-[10px] text-bg-ink-muted">NIS: {log.nis}</span>
        </div>
      ),
    },
    {
      header: "Status Awal",
      cell: (log: AbsensiSiswa) => {
        if (!log.statusAwal)
          return (
            <span className="text-[13px] text-bg-ink-muted/70 italic">
              Sama
            </span>
          );

        let state: SemanticState = "safe";
        if (log.statusAwal === "Alpa") state = "danger";
        else if (log.statusAwal === "Sakit" || log.statusAwal === "Izin")
          state = "warning";

        return <StatusBadge label={log.statusAwal} state={state} size="xs" />;
      },
    },
    {
      header: "Status Saat Ini",
      cell: (log: AbsensiSiswa) => {
        let state: SemanticState = "safe";
        if (log.status === "Alpa") state = "danger";
        else if (log.status === "Sakit" || log.status === "Izin")
          state = "warning";

        return <StatusBadge label={log.status} state={state} size="xs" />;
      },
    },
    {
      header: "Catatan",
      cell: (log: AbsensiSiswa) => (
        <span
          className="text-[13px] text-bg-ink-secondary block max-w-xs truncate"
          title={log.keterangan || ""}
        >
          {log.keterangan || "—"}
        </span>
      ),
    },
    {
      header: "Aksi",
      cell: (log: AbsensiSiswa) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleOpenOverride(log)}
          className="relative before:content-[''] before:absolute before:inset-[-6px] flex items-center gap-1 text-[11px]"
        >
          <Edit3 className="h-3 w-3" />
          Override
        </Button>
      ),
    },
  ];

  if (error && !loading) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          message={toastMessage}
          variant="safe"
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
          Monitoring Absensi
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          {activeTab === "rekap"
            ? "Rekapitulasi persentase kehadiran harian siswa di seluruh kelas."
            : "Wewenang khusus untuk mengubah status kehadiran siswa dalam kondisi urgensi administratif."}
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b border-bg-border gap-2"
        role="tablist"
        aria-label="Navigasi Monitoring Kehadiran"
      >
        <button
          role="tab"
          id="tab-rekap"
          aria-selected={activeTab === "rekap"}
          aria-controls="panel-rekap"
          tabIndex={activeTab === "rekap" ? 0 : -1}
          onClick={() => setActiveTab("rekap")}
          className={`px-4 py-2 text-[13px] font-semibold border-b-2 transition-all focus:outline-none cursor-pointer ${
            activeTab === "rekap"
              ? "border-primary text-primary"
              : "border-transparent text-bg-ink-secondary hover:text-bg-ink"
          }`}
        >
          Rekap Kelas
        </button>
        <button
          role="tab"
          id="tab-monitoring"
          aria-selected={activeTab === "monitoring"}
          aria-controls="panel-monitoring"
          tabIndex={activeTab === "monitoring" ? 0 : -1}
          onClick={() => setActiveTab("monitoring")}
          className={`px-4 py-2 text-[13px] font-semibold border-b-2 transition-all focus:outline-none cursor-pointer ${
            activeTab === "monitoring"
              ? "border-primary text-primary"
              : "border-transparent text-bg-ink-secondary hover:text-bg-ink"
          }`}
        >
          Log Kehadiran Siswa
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryMetricCard
          label="Rata-rata Kehadiran"
          value={`${averagePercentage}%`}
          desc={`Tanggal ${formatTanggal(tanggal)}`}
          icon={<ClipboardCheck className="h-4 w-4" />}
          variant={
            averagePercentage >= 95
              ? "safe"
              : averagePercentage >= 75
                ? "warning"
                : "danger"
          }
          tooltip="Persentase total kehadiran siswa yang masuk sekolah hari ini."
        />
        <SummaryMetricCard
          label="Total Siswa Hadir"
          value={`${totalHadir} / ${totalStudents}`}
          desc="Mengikuti pembelajaran"
          icon={<Users className="h-4 w-4" />}
          variant="neutral"
          tooltip="Jumlah siswa yang tercatat masuk hari ini dari total kapasitas sekolah."
        />
        <SummaryMetricCard
          label="Total Absen Alpa"
          value={`${totalAlpa}`}
          desc="Tanpa keterangan"
          icon={<AlertCircle className="h-4 w-4" />}
          variant={totalAlpa > 0 ? "danger" : "neutral"}
          tooltip="Jumlah siswa yang membolos atau tidak hadir tanpa keterangan hari ini."
        />
      </div>

      {activeTab === "rekap" ? (
        <div
          role="tabpanel"
          id="panel-rekap"
          aria-labelledby="tab-rekap"
          tabIndex={0}
          className="space-y-6 focus:outline-none"
        >
          {/* Date filter & Search */}
          <FilterBar
            searchPlaceholder="Cari kelas..."
            searchValue={search}
            onSearchChange={setSearch}
            actions={
              <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[150px]">
                <label
                  htmlFor="filter-attendance-date"
                  className="text-[10px] font-bold text-bg-ink-muted uppercase tracking-wider pl-0.5"
                >
                  Tanggal
                </label>
                <input
                  id="filter-attendance-date"
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="rounded-[6px] border border-bg-border bg-bg-surface text-bg-ink px-3.5 py-1.5 h-9 text-[13px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
            }
          />

          {loading ? (
            <LoadingState message="Memuat rekap absensi kelas..." />
          ) : (
            <DataTable
              title={`Kehadiran Kelas Tanggal ${formatTanggal(tanggal)}`}
              columns={columns}
              data={filteredSummary}
              keyExtractor={(s) => s.kelasId}
            />
          )}
        </div>
      ) : (
        <div
          role="tabpanel"
          id="panel-monitoring"
          aria-labelledby="tab-monitoring"
          tabIndex={0}
          className="space-y-6 focus:outline-none"
        >
          {/* Student Log Filter bar */}
          <FilterBar
            searchPlaceholder="Cari siswa (nama/nis)..."
            searchValue={studentSearch}
            onSearchChange={setStudentSearch}
            actions={
              <div className="flex flex-wrap sm:flex-nowrap items-end gap-3 w-full sm:w-auto">
                {/* Kelas Filter */}
                <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[150px]">
                  <label
                    htmlFor="filter-log-kelas"
                    className="text-[10px] font-bold text-bg-ink-muted uppercase tracking-wider pl-0.5"
                  >
                    Kelas
                  </label>
                  <Select
                    id="filter-log-kelas"
                    value={selectedKelas}
                    onChange={(e) => setSelectedKelas(e.target.value)}
                    className="h-9 py-1 pr-10 text-[13px]"
                  >
                    <option value="">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[150px]">
                  <label
                    htmlFor="filter-log-status"
                    className="text-[10px] font-bold text-bg-ink-muted uppercase tracking-wider pl-0.5"
                  >
                    Status
                  </label>
                  <Select
                    id="filter-log-status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-9 py-1 pr-10 text-[13px]"
                  >
                    <option value="">Semua Status</option>
                    <option value="Hadir">Hadir</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                    <option value="Alpa">Alpa</option>
                  </Select>
                </div>

                {/* Date Filter */}
                <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[150px]">
                  <label
                    htmlFor="filter-log-date"
                    className="text-[10px] font-bold text-bg-ink-muted uppercase tracking-wider pl-0.5"
                  >
                    Tanggal
                  </label>
                  <input
                    id="filter-log-date"
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="rounded-[6px] border border-bg-border bg-bg-surface text-bg-ink px-3.5 py-1.5 h-9 text-[13px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
              </div>
            }
          />

          {loading ? (
            <LoadingState message="Memuat log kehadiran siswa..." />
          ) : (
            <DataTable
              title={`Log Kehadiran Siswa Tanggal ${formatTanggal(tanggal)}`}
              columns={logColumns}
              data={filteredLogs}
              keyExtractor={(log) => log.id}
            />
          )}
        </div>
      )}

      {/* Form Override Modal */}
      {selectedLog && (
        <Modal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          title="Override Absensi Siswa"
          icon={<AlertTriangle className="h-5 w-5 text-status-warning" />}
          maxWidth="md"
        >
          <form onSubmit={handleSaveOverride} className="space-y-4">
            {overrideError && (
              <div className="flex items-center space-x-2 rounded-[6px] bg-status-danger/[0.06] p-3.5 text-[13px] text-text-danger border border-status-danger/20">
                <AlertCircle className="h-4 w-4 shrink-0 text-status-danger" />
                <span>{overrideError}</span>
              </div>
            )}

            {/* Warning block */}
            <div className="rounded-[6px] bg-status-warning/[0.06] p-3.5 text-[13px] text-amber-900 border border-status-warning/20 flex gap-2 items-start">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-status-warning" />
              <span className="font-semibold leading-snug">
                Peringatan: Override administratif hanya digunakan untuk kondisi
                khusus.
              </span>
            </div>

            {/* Read-only Student Info */}
            <div className="divide-y divide-bg-border/40 text-[13px] border-b border-bg-border/40 pb-1">
              <div className="flex justify-between py-2">
                <span className="text-bg-ink-secondary">Nama Siswa</span>
                <span className="font-semibold text-bg-ink">
                  {selectedLog.siswaName}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-bg-ink-secondary">Kelas</span>
                <span className="font-semibold text-bg-ink">
                  {selectedLog.kelasName}
                </span>
              </div>
              {selectedLog.mapelName && (
                <div className="flex justify-between py-2">
                  <span className="text-bg-ink-secondary">Mata Pelajaran</span>
                  <span className="font-semibold text-bg-ink">
                    {selectedLog.mapelName}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-bg-ink-secondary">Status Saat Ini</span>
                <StatusBadge
                  label={selectedLog.status}
                  state={
                    selectedLog.status === "Hadir"
                      ? "safe"
                      : selectedLog.status === "Alpa"
                        ? "danger"
                        : "warning"
                  }
                  size="xs"
                />
              </div>
            </div>

            {/* Status Baru Select */}
            <div>
              <label
                htmlFor="override-status"
                className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
              >
                Status Kehadiran Baru
              </label>
              <Select
                id="override-status"
                value={statusBaru}
                onChange={(e) =>
                  setStatusBaru(e.target.value as StatusKehadiran)
                }
              >
                <option value="Hadir">Hadir</option>
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
                <option value="Alpa">Alpa</option>
              </Select>
            </div>

            {/* Alasan Override textarea */}
            <div>
              <label
                htmlFor="override-reason"
                className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
              >
                Alasan Override
              </label>
              <textarea
                id="override-reason"
                rows={3}
                placeholder="Masukkan alasan urgensi melakukan override status kehadiran..."
                value={alasanOverride}
                onChange={(e) => setAlasanOverride(e.target.value)}
                className="block w-full rounded-[6px] border border-bg-border bg-bg-surface text-bg-ink px-3.5 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary placeholder:text-bg-ink-muted"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-bg-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsOverrideModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isOverriding}>
                {isOverriding ? "Menyimpan..." : "Simpan Override"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
export default AttendancePage;

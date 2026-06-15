import React, { useEffect, useState } from "react";
import { AlertCircle, Search } from "lucide-react";
import { attendanceService } from "@/services/attendanceService";
import type { PermintaanKoreksi, StatusKehadiran } from "@/types/attendance";
import {
  DataTable,
  StatusBadge,
  Toast,
  LoadingState,
  Button,
  Select,
  Input,
  ErrorState,
} from "@/components/shared";
import type { SemanticState } from "@/utils/semanticState";
import { getActiveDateString } from "@/utils/student";

const getKehadiranState = (status: string): SemanticState => {
  if (status === "Hadir") return "safe";
  if (status === "Sakit") return "info";
  if (status === "Izin") return "pending";
  if (status === "Alpa") return "danger";
  return "neutral";
};

export const DutyAttendancePage: React.FC = () => {
  const [requests, setRequests] = useState<PermintaanKoreksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States for editing inline fields
  const [editedStatuses, setEditedStatuses] = useState<
    Record<string, StatusKehadiran>
  >({});
  const [editedKeterangans, setEditedKeterangans] = useState<
    Record<string, string>
  >({});

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(getActiveDateString());

  const fetchRequests = async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const data = await attendanceService.getPermintaanKoreksi();
      setRequests(data);

      const initialStatuses: Record<string, StatusKehadiran> = {};
      const initialKets: Record<string, string> = {};
      data.forEach((r) => {
        initialStatuses[r.id] = r.statusKoreksi;
        initialKets[r.id] = r.keterangan;
      });
      setEditedStatuses(initialStatuses);
      setEditedKeterangans(initialKets);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data koreksi absensi.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchRequests);
  }, []);

  const handleVerify = async (id: string, name: string) => {
    const statusVal = editedStatuses[id] || "Hadir";
    const ketVal = editedKeterangans[id] || "";
    try {
      await attendanceService.verifyPermintaanKoreksi(id, statusVal, ketVal);
      setToastMessage(
        `Absensi ${name} berhasil dikoreksi menjadi ${statusVal}.`,
      );
      await fetchRequests();
    } catch {
      setToastMessage("Gagal menyimpan koreksi absensi.");
    }
  };

  const handleStatusChange = (id: string, status: StatusKehadiran) => {
    setEditedStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const handleKeteranganChange = (id: string, ket: string) => {
    setEditedKeterangans((prev) => ({ ...prev, [id]: ket }));
  };

  // Get unique classes for filter options
  const kelasOptions = Array.from(new Set(requests.map((r) => r.kelasName)));

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (
      searchQuery &&
      !r.siswaName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (selectedKelas && r.kelasName !== selectedKelas) {
      return false;
    }
    if (selectedStatus && r.statusKoreksi !== selectedStatus) {
      return false;
    }
    if (selectedDate && r.tanggal !== selectedDate) {
      return false;
    }
    return true;
  });

  const columns = [
    {
      header: "Siswa",
      cell: (req: PermintaanKoreksi) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-bg-ink">
            {req.siswaName}
          </span>
          <span className="text-[11px] text-bg-ink-muted font-semibold">
            {req.tanggal}
          </span>
        </div>
      ),
    },
    {
      header: "Kelas / Mapel",
      cell: (req: PermintaanKoreksi) => (
        <div className="flex flex-col gap-0.5 text-[13px] text-bg-ink-secondary">
          <span className="font-semibold">{req.kelasName}</span>
          <span className="text-[11px] text-bg-ink-muted">{req.mapelName}</span>
        </div>
      ),
    },
    {
      header: "Status Semula",
      cell: (req: PermintaanKoreksi) => (
        <StatusBadge
          label={req.statusSemula}
          state={getKehadiranState(req.statusSemula)}
          size="xs"
        />
      ),
    },
    {
      header: "Koreksi Kehadiran",
      cell: (req: PermintaanKoreksi) => {
        if (req.verified) {
          return (
            <StatusBadge
              label={req.statusKoreksi}
              state={getKehadiranState(req.statusKoreksi)}
              size="xs"
            />
          );
        }
        const currentStatus = editedStatuses[req.id] || req.statusKoreksi;
        return (
          <div className="w-[120px]">
            <Select
              value={currentStatus}
              onChange={(e) =>
                handleStatusChange(req.id, e.target.value as StatusKehadiran)
              }
              aria-label={`Ubah status koreksi kehadiran siswa ${req.siswaName}`}
              className="py-1 px-2 h-8 text-[12px]"
            >
              <option value="Hadir">Hadir</option>
              <option value="Sakit">Sakit</option>
              <option value="Izin">Izin</option>
              <option value="Alpa">Alpa</option>
            </Select>
          </div>
        );
      },
    },
    {
      header: "Keterangan Koreksi",
      cell: (req: PermintaanKoreksi) => {
        if (req.verified) {
          return (
            <span
              className="text-[13px] text-bg-ink-secondary block max-w-xs truncate"
              title={req.keterangan}
            >
              {req.keterangan}
            </span>
          );
        }
        const currentKet = editedKeterangans[req.id] ?? req.keterangan;
        return (
          <Input
            type="text"
            value={currentKet}
            onChange={(e) => handleKeteranganChange(req.id, e.target.value)}
            placeholder="Keterangan koreksi..."
            aria-label={`Keterangan koreksi untuk siswa ${req.siswaName}`}
            className="py-1 px-2.5 h-8 text-[12px] w-full max-w-xs"
          />
        );
      },
    },
    {
      header: "Aksi Verifikasi",
      cell: (req: PermintaanKoreksi) => (
        <div className="text-right">
          {req.verified ? (
            <StatusBadge label="Terverifikasi" state="safe" size="xs" />
          ) : (
            <Button
              onClick={() => handleVerify(req.id, req.siswaName)}
              size="sm"
              aria-label={`Simpan keputusan koreksi kehadiran siswa ${req.siswaName}`}
              className="h-8 py-1 text-[12px]"
            >
              Simpan Koreksi
            </Button>
          )}
        </div>
      ),
    },
  ];

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
          Koreksi Absensi (Guru Piket)
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Tentukan dan catat status kehadiran siswa serta keterangan izin
          operasional sekolah harian.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="grid gap-3 sm:grid-cols-4 bg-bg-surface border border-bg-border rounded-[6px] p-4 shadow-[0_1px_3px_rgba(20,33,26,0.05)]">
        <div>
          <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
            Cari Siswa
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-bg-ink-muted">
              <Search className="h-4 w-4" />
            </span>
            <Input
              type="text"
              placeholder="Cari nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 py-2 text-[12px] h-9"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
            Kelas
          </label>
          <Select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="py-2 text-[12px] h-9"
          >
            <option value="">Semua Kelas</option>
            {kelasOptions.map((kelas) => (
              <option key={kelas} value={kelas}>
                {kelas}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
            Status Usulan
          </label>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 text-[12px] h-9"
          >
            <option value="">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Sakit">Sakit</option>
            <option value="Izin">Izin</option>
            <option value="Alpa">Alpa</option>
          </Select>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
            Tanggal Kehadiran
          </label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-2 text-[12px] h-9"
          />
        </div>
      </div>

      {loading ? (
        <LoadingState message="Memuat usulan koreksi..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRequests} />
      ) : (
        <DataTable
          title="Permintaan Koreksi Kehadiran Hari Ini"
          columns={columns}
          data={filteredRequests}
          keyExtractor={(req) => req.id}
          actions={
            <div className="flex items-center gap-1.5 text-bg-ink-muted text-xs">
              <AlertCircle className="h-4 w-4 text-status-warning" />
              <span>
                Simpan koreksi akan langsung memperbarui status presensi utama
                siswa.
              </span>
            </div>
          }
        />
      )}
    </div>
  );
};
export default DutyAttendancePage;

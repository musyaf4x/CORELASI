import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { attendanceService } from "@/services/attendanceService";
import { scheduleService } from "@/services/scheduleService";
import {
  getSiswaKelasId,
  getSiswaKelasName,
  getActiveDateString,
} from "@/utils/student";
import type { AbsensiSiswa, StatusKehadiran } from "@/types/attendance";
import type { JadwalPembelajaran } from "@/types/schedule";
import {
  DataTable,
  SummaryMetricCard,
  LoadingState,
  Button,
  Toast,
  Select,
  Input,
  Modal,
  ErrorState,
} from "@/components/shared";
import {
  ClipboardCheck,
  ShieldAlert,
  Award,
  Send,
  RefreshCw,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AbsensiSiswa[]>([]);
  const [mySchedules, setMySchedules] = useState<JadwalPembelajaran[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Correction Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMapelName, setFormMapelName] = useState("");
  const [formTanggal, setFormTanggal] = useState(getActiveDateString());
  const [formStatusSemula, setFormStatusSemula] =
    useState<StatusKehadiran>("Alpa");
  const [formStatusKoreksi, setFormStatusKoreksi] =
    useState<StatusKehadiran>("Hadir");
  const [formAlasan, setFormAlasan] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const [absData, schData] = await Promise.all([
        attendanceService.getAbsensiSiswa(),
        scheduleService.getJadwalPembelajaran(),
      ]);
      const myLogs = absData.filter((a) => a.siswaId === user.id);
      setLogs(myLogs);
      const classId = getSiswaKelasId(user);
      const schedulesList = schData.filter(
        (s) => String(s.kelasId) === String(classId),
      );
      setMySchedules(schedulesList);

      if (schedulesList.length > 0) {
        setFormMapelName(schedulesList[0].mapelName);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data absensi.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  const handleOpenCorrection = (log?: AbsensiSiswa) => {
    if (log) {
      setFormMapelName(log.mapelName || mySchedules[0]?.mapelName || "");
      setFormTanggal(log.tanggal);
      setFormStatusSemula(log.status);
    } else {
      setFormMapelName(mySchedules[0]?.mapelName || "");
      setFormTanggal(getActiveDateString());
      setFormStatusSemula("Alpa");
    }
    setFormStatusKoreksi("Hadir");
    setFormAlasan("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formMapelName || !formTanggal || !formAlasan.trim()) {
      setFormError("Semua bidang wajib diisi.");
      return;
    }

    const classId = getSiswaKelasId(user);
    const classNameVal = getSiswaKelasName(user);

    const payload = {
      siswaId: user!.id,
      siswaName: user!.name,
      kelasId: classId,
      kelasName: classNameVal,
      mapelName: formMapelName,
      statusSemula: formStatusSemula,
      statusKoreksi: formStatusKoreksi,
      keterangan: formAlasan,
      tanggal: formTanggal,
    };

    try {
      await attendanceService.submitPermintaanKoreksi(payload);
      setToastMessage("Permintaan koreksi berhasil dikirim ke Guru Piket.");
      setIsModalOpen(false);
    } catch {
      setFormError("Gagal mengirim permintaan koreksi.");
    }
  };

  // Stats Calculations
  const total = logs.length;
  const hadir = logs.filter((l) => l.status === "Hadir").length;
  const sakit = logs.filter((l) => l.status === "Sakit").length;
  const izin = logs.filter((l) => l.status === "Izin").length;
  const alpa = logs.filter((l) => l.status === "Alpa").length;
  const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;

  const columns = [
    {
      header: "Tanggal",
      cell: (l: AbsensiSiswa) => (
        <span className="text-[13px] font-medium text-bg-ink">{l.tanggal}</span>
      ),
    },
    {
      header: "Mata Pelajaran",
      cell: (l: AbsensiSiswa) => (
        <span className="text-[13px] font-semibold text-primary">
          {l.mapelName || "Sekolah Harian"}
        </span>
      ),
    },
    {
      header: "Status Kehadiran",
      cell: (l: AbsensiSiswa) => {
        let badgeState: "safe" | "info" | "pending" | "danger" = "safe";
        if (l.status === "Sakit") badgeState = "info";
        else if (l.status === "Izin") badgeState = "pending";
        else if (l.status === "Alpa") badgeState = "danger";

        return <StatusBadge label={l.status} state={badgeState} size="xs" />;
      },
    },
    {
      header: "Keterangan",
      cell: (l: AbsensiSiswa) => (
        <span className="text-[13px] text-bg-ink-secondary">
          {l.keterangan || "-"}
        </span>
      ),
    },
    {
      header: "Koreksi",
      cell: (l: AbsensiSiswa) => {
        if (l.status === "Hadir") return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10 gap-1 px-2 h-7 text-[11px]"
            onClick={() => handleOpenCorrection(l)}
          >
            <RefreshCw className="h-3 w-3" />
            Ajukan Koreksi
          </Button>
        );
      },
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

      {/* Add Correction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ajukan Koreksi Presensi"
        icon={<RefreshCw className="h-4.5 w-4.5 text-primary" />}
        maxWidth="sm"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 text-[12px] bg-status-danger/10 text-status-danger border border-status-danger/25 rounded-[6px] font-medium">
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="form-mapel"
              className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
            >
              Mata Pelajaran
            </label>
            <Select
              id="form-mapel"
              value={formMapelName}
              onChange={(e) => setFormMapelName(e.target.value)}
            >
              {mySchedules.map((s) => (
                <option key={s.id} value={s.mapelName}>
                  {s.mapelName}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="form-tanggal"
                className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
              >
                Tanggal
              </label>
              <Input
                id="form-tanggal"
                type="date"
                value={formTanggal}
                onChange={(e) => setFormTanggal(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="form-status"
                className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
              >
                Status Usulan
              </label>
              <Select
                id="form-status"
                value={formStatusKoreksi}
                onChange={(e) =>
                  setFormStatusKoreksi(e.target.value as StatusKehadiran)
                }
              >
                <option value="Hadir">Hadir</option>
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
              </Select>
            </div>
          </div>

          <div>
            <label
              htmlFor="form-alasan"
              className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
            >
              Alasan Koreksi
            </label>
            <textarea
              id="form-alasan"
              value={formAlasan}
              onChange={(e) => setFormAlasan(e.target.value)}
              placeholder="cth. Ban bocor di jalan, surat dokter dilampirkan..."
              className="block w-full rounded-[6px] border border-bg-border bg-bg-surface text-bg-ink px-3 py-2 text-[13px] placeholder:text-bg-ink-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[80px]"
            />
          </div>

          <div className="pt-4 border-t border-bg-border flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Kirim Pengajuan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            Absensi Saya
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Pantau persentase kehadiran Anda dan ajukan koreksi jika terdapat
            kesalahan data.
          </p>
        </div>
        <Button
          className="gap-2 font-semibold"
          onClick={() => handleOpenCorrection()}
        >
          <RefreshCw className="h-4 w-4" />
          Ajukan Koreksi
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryMetricCard
          label="Tingkat Kehadiran"
          value={`${rate}%`}
          desc={`${hadir} dari ${total} sesi hadir`}
          icon={<ClipboardCheck className="h-4 w-4" />}
          variant={rate >= 90 ? "safe" : rate >= 80 ? "warning" : "danger"}
          tooltip="Rata-rata persentase kehadiran Anda pada semester aktif ini."
        />
        <SummaryMetricCard
          label="Sakit & Izin"
          value={`${sakit + izin}`}
          desc="Dengan keterangan resmi"
          icon={<Award className="h-4 w-4" />}
          variant="neutral"
          tooltip="Akumulasi ketidakhadiran dengan surat izin atau sakit resmi."
        />
        <SummaryMetricCard
          label="Ketidakhadiran Alpa"
          value={`${alpa}`}
          desc="Tanpa keterangan"
          icon={<ShieldAlert className="h-4 w-4" />}
          variant={alpa > 0 ? "danger" : "neutral"}
          tooltip="Akumulasi ketidakhadiran membolos tanpa surat keterangan."
        />
      </div>

      {loading ? (
        <LoadingState message="Memuat histori absensi..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <DataTable
          title="Histori Kehadiran Semester Ini"
          columns={columns}
          data={logs}
          keyExtractor={(l) => l.id}
          emptyStateTitle="Tidak ada catatan presensi"
          emptyStateDescription="Anda belum memiliki riwayat presensi tercatat."
        />
      )}
    </div>
  );
};
export default AttendancePage;

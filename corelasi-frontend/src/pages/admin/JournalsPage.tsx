import React, { useEffect, useMemo, useState } from "react";
import { journalService } from "@/services/journalService";
import type { JurnalPertemuan } from "@/types/journal";
import {
  DataTable,
  Button,
  FilterBar,
  Select,
  Modal,
  StatusBadge,
  Toast,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import { Calendar, Download, Eye, BookOpen } from "lucide-react";
import { exportToExcel } from "@/utils/exportHelper";

export const JournalsPage: React.FC = () => {
  const [journals, setJournals] = useState<JurnalPertemuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detail Modal State
  const [viewJournal, setViewJournal] = useState<JurnalPertemuan | null>(null);

  const fetchJournals = async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const data = await journalService.getJournals();
      setJournals(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data jurnal.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchJournals);
  }, []);

  const filteredJournals = useMemo(() => {
    let result = [...journals];

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.agenda.toLowerCase().includes(term) ||
          j.materialSummary.toLowerCase().includes(term) ||
          j.guruName.toLowerCase().includes(term),
      );
    }

    if (selectedClass) {
      result = result.filter(
        (j) => String(j.kelasId) === String(selectedClass),
      );
    }

    if (selectedMapel) {
      result = result.filter((j) =>
        j.mapelName.toLowerCase().includes(selectedMapel.toLowerCase()),
      );
    }

    return result;
  }, [search, selectedClass, selectedMapel, journals]);

  const handleExportExcel = () => {
    if (filteredJournals.length === 0) {
      setToastMessage("Tidak ada data untuk diekspor.");
      return;
    }
    const exportData = filteredJournals.map((j) => ({
      Tanggal: j.date,
      Kelas: j.kelasName,
      "Mata Pelajaran": j.mapelName,
      "Guru Pengampu": j.guruName,
      Agenda: j.agenda,
      "Ringkasan Materi": j.materialSummary,
      "Siswa Hadir": j.presentCount,
      "Siswa Absen": j.absentCount,
      Catatan: j.notes || "-",
    }));
    exportToExcel(
      exportData,
      `Monitoring_Jurnal_Mengajar_${new Date().toISOString().split("T")[0]}`,
    );
  };

  const columns = [
    {
      header: "Tanggal",
      cell: (j: JurnalPertemuan) => (
        <span className="text-[12px] text-bg-ink-secondary font-mono flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          {j.date}
        </span>
      ),
    },
    {
      header: "Kelas",
      cell: (j: JurnalPertemuan) => (
        <span className="text-[12px] font-bold text-bg-ink">{j.kelasName}</span>
      ),
    },
    {
      header: "Mata Pelajaran",
      cell: (j: JurnalPertemuan) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {j.mapelName}
        </span>
      ),
    },
    {
      header: "Guru Pengampu",
      cell: (j: JurnalPertemuan) => (
        <span className="text-[12px] font-medium text-bg-ink-secondary">
          {j.guruName}
        </span>
      ),
    },
    {
      header: "Agenda Pertemuan",
      cell: (j: JurnalPertemuan) => (
        <span className="text-[13px] text-bg-ink leading-relaxed font-sans line-clamp-1 max-w-[200px]">
          {j.agenda}
        </span>
      ),
    },
    {
      header: "Kehadiran",
      cell: (j: JurnalPertemuan) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge
            label={`${j.presentCount} Hadir`}
            state="safe"
            size="xs"
          />
          {j.absentCount > 0 && (
            <StatusBadge
              label={`${j.absentCount} Alpa`}
              state="danger"
              size="xs"
            />
          )}
        </div>
      ),
    },
    {
      header: "Aksi",
      cell: (j: JurnalPertemuan) => (
        <Button
          size="sm"
          variant="secondary"
          className="text-[11px] h-7 gap-1 font-semibold"
          onClick={() => setViewJournal(j)}
        >
          <Eye className="h-3 w-3" />
          Detail
        </Button>
      ),
    },
  ];

  const uniqueClasses = Array.from(
    new Set(journals.map((j) => String(j.kelasId))),
  ).map((id) => ({
    id,
    name:
      journals.find((j) => String(j.kelasId) === String(id))?.kelasName || "",
  }));

  const uniqueMapels = Array.from(new Set(journals.map((j) => j.mapelName)));

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          message={toastMessage}
          variant="warning"
          onClose={() => setToastMessage(null)}
        />
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            Monitoring Jurnal
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Pantau catatan jurnal mengajar dan kehadiran siswa yang diisi oleh
            seluruh Guru Pengampu.
          </p>
        </div>
        <Button
          onClick={handleExportExcel}
          className="gap-1.5 font-semibold text-[12px] h-9 self-start sm:self-center"
        >
          <Download className="h-4 w-4" />
          Ekspor Excel
        </Button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchPlaceholder="Cari agenda atau guru..."
        searchValue={search}
        onSearchChange={setSearch}
        searchLabel="Pencarian Jurnal"
        actions={
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-bg-ink-muted uppercase tracking-wider pl-0.5">
                Kelas
              </span>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                aria-label="Pilih Kelas"
                className="py-1 px-2.5 h-9 min-w-[130px] text-[13px]"
              >
                <option value="">Semua Kelas</option>
                {uniqueClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-bg-ink-muted uppercase tracking-wider pl-0.5">
                Mata Pelajaran
              </span>
              <Select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                aria-label="Pilih Mata Pelajaran"
                className="py-1 px-2.5 h-9 min-w-[150px] text-[13px]"
              >
                <option value="">Semua Mapel</option>
                {uniqueMapels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        }
      />

      {/* Main Table */}
      {loading ? (
        <LoadingState message="Memuat data monitoring jurnal..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchJournals} />
      ) : (
        <DataTable
          title="Catatan Jurnal Mengajar Guru"
          columns={columns}
          data={filteredJournals}
          keyExtractor={(j) => j.id}
          emptyStateTitle="Tidak ada jurnal"
          emptyStateDescription="Belum ada guru pengampu yang melengkapi jurnal pertemuan mengajar."
          paginate={true}
          pageSize={10}
        />
      )}

      {/* Detail Dialog Modal */}
      <Modal
        isOpen={!!viewJournal}
        onClose={() => setViewJournal(null)}
        title={viewJournal?.agenda || ""}
        icon={<BookOpen className="h-5 w-5 text-primary" />}
        maxWidth="lg"
      >
        {viewJournal && (
          <div className="space-y-5 text-bg-ink">
            {/* Meta Tags & Basic Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bg-border/60 pb-3">
              <div className="flex items-center gap-1.5">
                <StatusBadge
                  label={`Kelas ${viewJournal.kelasName}`}
                  state="neutral"
                  size="xs"
                  showDot={false}
                />
                <StatusBadge
                  label={viewJournal.mapelName}
                  state="info"
                  size="xs"
                  showDot={false}
                />
              </div>
              <div className="text-[12px] text-bg-ink-muted">
                Tanggal:{" "}
                <span className="font-mono text-bg-ink-secondary font-semibold">
                  {viewJournal.date}
                </span>
              </div>
            </div>

            {/* Guru Pengampu Detail */}
            <div className="flex items-center justify-between text-[13px] border-b border-bg-border/40 pb-3">
              <span className="text-[12px] font-bold text-bg-ink-secondary uppercase tracking-wider">
                Guru Pengampu
              </span>
              <span className="font-bold text-bg-ink">
                {viewJournal.guruName}
              </span>
            </div>

            {/* Uraian / Ringkasan Materi Pembelajaran */}
            <div className="space-y-1.5 border-b border-bg-border/40 pb-4">
              <h4 className="text-[12px] font-bold text-bg-ink-secondary uppercase tracking-wider">
                Uraian / Ringkasan Materi Pembelajaran
              </h4>
              <div className="text-[13px] text-bg-ink-secondary leading-relaxed whitespace-pre-wrap font-sans pl-0.5">
                {viewJournal.materialSummary}
              </div>
            </div>

            {/* Catatan Kelas / Catatan Khusus */}
            {viewJournal.notes && (
              <div className="space-y-1.5 border-b border-bg-border/40 pb-4">
                <h4 className="text-[12px] font-bold text-bg-ink-secondary uppercase tracking-wider">
                  Catatan Kelas / Catatan Khusus
                </h4>
                <div className="text-[12.5px] text-bg-ink-secondary leading-relaxed italic pl-0.5 flex gap-1">
                  <span className="text-bg-ink-muted select-none">“</span>
                  <span>{viewJournal.notes}</span>
                  <span className="text-bg-ink-muted select-none">”</span>
                </div>
              </div>
            )}

            {/* Attendance Roster Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[13px] pt-1">
              <span className="text-[12px] font-bold text-bg-ink-secondary uppercase tracking-wider">
                Kehadiran Siswa
              </span>
              <div className="flex items-center gap-1.5">
                <StatusBadge
                  label={`${viewJournal.presentCount} Hadir`}
                  state="safe"
                  size="xs"
                />
                {viewJournal.absentCount > 0 && (
                  <StatusBadge
                    label={`${viewJournal.absentCount} Alpa`}
                    state="danger"
                    size="xs"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-bg-border/60">
              <Button
                onClick={() => setViewJournal(null)}
                size="sm"
                className="font-semibold"
              >
                Tutup Detail
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default JournalsPage;

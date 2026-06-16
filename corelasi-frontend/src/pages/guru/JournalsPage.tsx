import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { journalService } from "@/services/journalService";
import { scheduleService } from "@/services/scheduleService";
import { userService } from "@/services/userService";
import type { JurnalPertemuan } from "@/types/journal";
import type { JadwalPembelajaran } from "@/types/schedule";
import {
  DataTable,
  Button,
  Input,
  Toast,
  Select,
  Modal,
} from "@/components/shared";
import { Plus, Calendar, Trash2, Eye } from "lucide-react";

export const JournalsPage: React.FC = () => {
  const { user } = useAuth();
  const [journals, setJournals] = useState<JurnalPertemuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [agenda, setAgenda] = useState("");
  const [summary, setSummary] = useState("");
  const [present, setPresent] = useState("0");
  const [absent, setAbsent] = useState("0");
  const [notes, setNotes] = useState("");

  // Journal Detail & Edit Modal State
  const [selectedJournal, setSelectedJournal] =
    useState<JurnalPertemuan | null>(null);
  const [isEditJournal, setIsEditJournal] = useState(false);
  const [editAgenda, setEditAgenda] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPresent, setEditPresent] = useState(0);
  const [editAbsent, setEditAbsent] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [journalError, setJournalError] = useState<string | null>(null);

  const openJournalModal = (j: JurnalPertemuan) => {
    setSelectedJournal(j);
    setIsEditJournal(false);
    setEditAgenda(j.agenda);
    setEditSummary(j.materialSummary);
    setEditDate(j.date);
    setEditPresent(j.presentCount);
    setEditAbsent(j.absentCount);
    setEditNotes(j.notes || "");
    setJournalError(null);
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJournal) return;
    if (!editAgenda.trim() || !editSummary.trim()) {
      setJournalError("Agenda dan Ringkasan Materi wajib diisi.");
      return;
    }
    try {
      const updated = await journalService.updateJournal(selectedJournal.id, {
        agenda: editAgenda,
        materialSummary: editSummary,
        date: editDate,
        presentCount: Number(editPresent),
        absentCount: Number(editAbsent),
        notes: editNotes.trim() || undefined,
      });
      setJournals((prev) =>
        prev.map((j) => (j.id === updated.id ? updated : j)),
      );
      setSelectedJournal(null);
      setIsEditJournal(false);
      setToastMessage("Jurnal mengajar berhasil diperbarui!");
    } catch {
      setJournalError("Gagal memperbarui jurnal.");
    }
  };

  // Academic list options
  const [classList, setClassList] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [teachingSchedules, setTeachingSchedules] = useState<
    JadwalPembelajaran[]
  >([]);
  const [studentCountByClass, setStudentCountByClass] = useState<
    Record<string, number>
  >({});

  const fetchJournals = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const data = await journalService.getJournalsByGuru(user.id);
      setJournals(data);
    } catch (err) {
      setToastMessage(
        err instanceof Error ? err.message : "Gagal memuat data jurnal.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMetadata = useCallback(async () => {
    if (!user) return;
    try {
      const [schedules, users] = await Promise.all([
        scheduleService.getJadwalPembelajaran(),
        userService.getAll(),
      ]);
      const ownSchedules = schedules.filter(
        (schedule) => String(schedule.guruId) === String(user.id),
      );
      const classes = Array.from(
        new Map(
          ownSchedules.map((schedule) => [
            String(schedule.kelasId),
            schedule.kelasName,
          ]),
        ).entries(),
      ).map(([id, name]) => ({ id, name }));
      const counts = users
        .filter((item) => item.role === "siswa" && item.kelasId)
        .reduce<Record<string, number>>((result, item) => {
          const classId = String(item.kelasId);
          return {
            ...result,
            [classId]: (result[classId] ?? 0) + 1,
          };
        }, {});

      setTeachingSchedules(ownSchedules);
      setStudentCountByClass(counts);
      setClassList(classes);
      setSelectedKelas((current) => current || classes[0]?.id || "");
    } catch (error: unknown) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : "Gagal memuat data kelas dan mata pelajaran.",
      );
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(() =>
      Promise.all([fetchJournals(), fetchMetadata()]),
    );
  }, [fetchJournals, fetchMetadata]);

  const mapelList = useMemo(
    () =>
      Array.from(
        new Map(
          teachingSchedules
            .filter(
              (schedule) => String(schedule.kelasId) === String(selectedKelas),
            )
            .map((schedule) => [String(schedule.mapelId), schedule.mapelName]),
        ).entries(),
      ).map(([id, name]) => ({ id, name })),
    [selectedKelas, teachingSchedules],
  );
  const effectiveSelectedMapel = mapelList.some(
    (mapel) => mapel.id === selectedMapel,
  )
    ? selectedMapel
    : mapelList[0]?.id || "";

  const handleSelectedClassChange = (classId: string) => {
    setSelectedKelas(classId);
    setSelectedMapel("");
    setPresent(String(studentCountByClass[classId] ?? 0));
    setAbsent("0");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!agenda.trim() || !summary.trim()) {
      setSubmitError("Agenda dan Ringkasan Materi wajib diisi.");
      return;
    }

    const presentNum = Number(present);
    const absentNum = Number(absent);

    if (
      isNaN(presentNum) ||
      presentNum < 0 ||
      isNaN(absentNum) ||
      absentNum < 0
    ) {
      setSubmitError("Jumlah kehadiran siswa harus berupa angka valid.");
      return;
    }
    const rosterCount = studentCountByClass[selectedKelas] ?? 0;
    if (rosterCount > 0 && presentNum + absentNum !== rosterCount) {
      setSubmitError(
        `Total hadir dan absen harus sama dengan roster kelas (${rosterCount} siswa).`,
      );
      return;
    }

    const targetClass = classList.find(
      (c) => String(c.id) === String(selectedKelas),
    );
    const targetMapel = mapelList.find(
      (m) => String(m.id) === String(effectiveSelectedMapel),
    );

    if (!targetClass || !targetMapel) {
      setSubmitError("Kelas atau mata pelajaran tidak valid.");
      return;
    }

    setSubmitting(true);
    try {
      await journalService.createJournal({
        date,
        kelasId: selectedKelas,
        kelasName: targetClass.name,
        mapelId: effectiveSelectedMapel,
        mapelName: targetMapel.name,
        guruId: user!.id,
        guruName: user!.name,
        agenda,
        materialSummary: summary,
        presentCount: presentNum,
        absentCount: absentNum,
        notes: notes.trim() || undefined,
      });

      setToastMessage("Jurnal mengajar berhasil disimpan!");
      setIsOpen(false);

      // Reset form
      setAgenda("");
      setSummary("");
      setNotes("");
      setPresent(String(studentCountByClass[selectedKelas] ?? 0));
      setAbsent("0");

      await fetchJournals();
    } catch {
      setSubmitError("Gagal menyimpan jurnal mengajar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jurnal mengajar ini?"))
      return;
    try {
      await journalService.deleteJournal(id);
      setToastMessage("Jurnal mengajar berhasil dihapus.");
      await fetchJournals();
    } catch {
      setToastMessage("Gagal menghapus jurnal.");
    }
  };

  const columns = [
    {
      header: "Tanggal",
      cell: (j: JurnalPertemuan) => (
        <span className="text-[13px] text-bg-ink-secondary font-mono flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          {j.date}
        </span>
      ),
    },
    {
      header: "Kelas",
      cell: (j: JurnalPertemuan) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {j.kelasName}
        </span>
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
      header: "Agenda KBM",
      cell: (j: JurnalPertemuan) => (
        <div className="flex flex-col gap-0.5 max-w-[220px]">
          <span className="text-[13px] font-semibold text-bg-ink truncate">
            {j.agenda}
          </span>
          <span className="text-[11px] text-bg-ink-muted truncate">
            {j.materialSummary}
          </span>
        </div>
      ),
    },
    {
      header: "Rasio Presensi",
      cell: (j: JurnalPertemuan) => (
        <span className="text-[13px] font-semibold font-mono text-bg-ink-secondary">
          {j.presentCount} Hadir / {j.absentCount} Absen
        </span>
      ),
    },
    {
      header: "Aksi",
      cell: (j: JurnalPertemuan) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="text-primary hover:bg-primary/10 h-7 w-7 p-0"
            onClick={() => openJournalModal(j)}
            title="Detail & Edit Jurnal"
            aria-label="Detail & Edit Jurnal"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-status-danger hover:bg-status-danger/10 h-7 w-7 p-0"
            onClick={() => handleDelete(j.id)}
            title="Hapus Jurnal"
            aria-label="Hapus Jurnal"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            Jurnal Mengajar Saya
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Catat agenda KBM harian, uraian topik materi ajar, dan status
            rekapitulasi kehadiran kelas.
          </p>
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="gap-1.5 font-semibold text-[12px] h-9"
        >
          <Plus className="h-4 w-4" />
          Isi Jurnal
        </Button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <span className="text-[13px] text-bg-ink-muted">
            Memuat catatan jurnal mengajar...
          </span>
        </div>
      ) : (
        <DataTable
          title="Daftar Jurnal Mengajar Anda"
          columns={columns}
          data={journals}
          keyExtractor={(j) => j.id}
          emptyStateTitle="Belum ada jurnal"
          emptyStateDescription="Silakan isi jurnal pembelajaran pertama Anda untuk mencatat riwayat mengajar."
        />
      )}

      {/* New Journal Dialog Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Formulir Jurnal Mengajar Baru"
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {submitError && (
            <div className="p-3 text-[12px] bg-status-danger/10 text-status-danger border border-status-danger/25 rounded-[6px] font-medium">
              {submitError}
            </div>
          )}

          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                  Tanggal Pertemuan{" "}
                  <span className="text-status-danger">*</span>
                </label>
                <Input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                  Rombel Kelas <span className="text-status-danger">*</span>
                </label>
                <Select
                  value={selectedKelas}
                  onChange={(e) => handleSelectedClassChange(e.target.value)}
                >
                  {classList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                Mata Pelajaran <span className="text-status-danger">*</span>
              </label>
              <Select
                value={effectiveSelectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
              >
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                Agenda / Judul Pembelajaran{" "}
                <span className="text-status-danger">*</span>
              </label>
              <Input
                required
                placeholder="Contoh: Pembahasan Aljabar Linear"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                Ringkasan / Uraian Materi Ajar{" "}
                <span className="text-status-danger">*</span>
              </label>
              <textarea
                required
                placeholder="Deskripsikan poin materi yang diajarkan..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full text-[13px] bg-bg-surface border border-bg-border rounded-[6px] p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[70px] font-sans resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                  Siswa Hadir <span className="text-status-danger">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={present}
                  onChange={(e) => setPresent(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                  Siswa Absen/Izin <span className="text-status-danger">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={absent}
                  onChange={(e) => setAbsent(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                Catatan Khusus KBM
              </label>
              <textarea
                placeholder="Catatan hambatan atau kejadian luar biasa kelas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-[13px] bg-bg-surface border border-bg-border rounded-[6px] p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[60px] font-sans resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-bg-border/60">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Jurnal"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Journal Detail & Edit Modal */}
      <Modal
        isOpen={selectedJournal !== null}
        onClose={() => {
          setSelectedJournal(null);
          setIsEditJournal(false);
        }}
        title={
          isEditJournal ? "Ubah Jurnal Pertemuan" : "Detail Jurnal Pertemuan"
        }
        maxWidth="lg"
      >
        {selectedJournal && (
          <form onSubmit={handleSaveJournal} className="space-y-4">
            {journalError && (
              <div className="p-3 text-[12px] bg-status-danger/10 text-status-danger border border-status-danger/25 rounded-[6px] font-medium">
                {journalError}
              </div>
            )}

            {!isEditJournal ? (
              // READ-ONLY DETAIL MODE
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-bg-border/40">
                  <div>
                    <span className="block text-[12px] font-semibold text-bg-ink-secondary">
                      Tanggal Pertemuan
                    </span>
                    <span className="text-[13px] font-semibold text-bg-ink font-mono mt-0.5 block">
                      {selectedJournal.date}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[12px] font-semibold text-bg-ink-secondary">
                      Kelas / Mata Pelajaran
                    </span>
                    <span className="text-[13px] font-semibold text-bg-ink mt-0.5 block">
                      {selectedJournal.kelasName} &bull;{" "}
                      {selectedJournal.mapelName}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[12px] font-semibold text-bg-ink-secondary">
                    Agenda Pembelajaran
                  </span>
                  <span className="text-[14px] font-bold text-bg-ink mt-1 block leading-snug">
                    {selectedJournal.agenda}
                  </span>
                </div>

                <div>
                  <span className="block text-[12px] font-semibold text-bg-ink-secondary">
                    Ringkasan / Uraian Materi
                  </span>
                  <p className="text-[13px] text-bg-ink-secondary mt-1 block leading-relaxed whitespace-pre-wrap">
                    {selectedJournal.materialSummary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-bg-sage-slate/40 rounded-[6px] border border-bg-border/30">
                  <div>
                    <span className="block text-[12px] font-semibold text-bg-ink-secondary">
                      Siswa Hadir
                    </span>
                    <span className="text-[16px] font-bold text-text-safe font-mono mt-0.5 block">
                      {selectedJournal.presentCount} Siswa
                    </span>
                  </div>
                  <div>
                    <span className="block text-[12px] font-semibold text-bg-ink-secondary">
                      Siswa Absen/Izin
                    </span>
                    <span className="text-[16px] font-bold text-text-danger font-mono mt-0.5 block">
                      {selectedJournal.absentCount} Siswa
                    </span>
                  </div>
                </div>

                {selectedJournal.notes && (
                  <div>
                    <span className="block text-[12px] font-semibold text-bg-ink-secondary">
                      Catatan Khusus KBM
                    </span>
                    <p className="text-[13px] text-bg-ink-secondary mt-1 block italic leading-relaxed">
                      {selectedJournal.notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-bg-border/60">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSelectedJournal(null);
                      setIsEditJournal(false);
                    }}
                  >
                    Tutup
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditJournal(true);
                    }}
                  >
                    Edit Jurnal
                  </Button>
                </div>
              </div>
            ) : (
              // EDIT FORM MODE
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                      Tanggal Pertemuan
                    </label>
                    <Input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                      Rombel Kelas / Mapel
                    </label>
                    <div className="text-[13px] font-bold text-bg-ink px-3 py-2 bg-bg-sage-slate/40 rounded-[6px] border border-bg-border/30 h-10 flex items-center">
                      {selectedJournal.kelasName} &bull;{" "}
                      {selectedJournal.mapelName}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                    Agenda / Judul Pembelajaran
                  </label>
                  <Input
                    required
                    value={editAgenda}
                    onChange={(e) => setEditAgenda(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                    Ringkasan / Uraian Materi Ajar
                  </label>
                  <textarea
                    required
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full text-[13px] bg-bg-surface border border-bg-border rounded-[6px] p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[90px] font-sans resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                      Siswa Hadir
                    </label>
                    <div className="text-[13px] font-bold text-text-safe px-3 py-2 bg-bg-sage-slate/40 rounded-[6px] border border-bg-border/30 h-10 flex items-center font-mono">
                      {editPresent} Siswa
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                      Siswa Absen/Izin
                    </label>
                    <div className="text-[13px] font-bold text-text-danger px-3 py-2 bg-bg-sage-slate/40 rounded-[6px] border border-bg-border/30 h-10 flex items-center font-mono">
                      {editAbsent} Siswa
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                    Catatan Khusus KBM
                  </label>
                  <textarea
                    placeholder="Opsional..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full text-[13px] bg-bg-surface border border-bg-border rounded-[6px] p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[60px] font-sans resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-bg-border/60">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditJournal(false);
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit">Simpan Perubahan</Button>
                </div>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
};
export default JournalsPage;

import React, { useEffect, useMemo, useState } from "react";
import { scheduleService } from "@/services/scheduleService";
import { userService } from "@/services/userService";
import { academicService } from "@/services/academicService";
import type { JadwalPiket, HariBelajar } from "@/types/schedule";
import type { UserDetail } from "@/types/user";
import type { Semester } from "@/types/academic";
import {
  FilterBar,
  Button,
  Toast,
  ConfirmDialog,
  LoadingState,
  Select,
  Modal,
  CalendarBoard,
} from "@/components/shared";
import { Plus, CalendarCheck } from "lucide-react";

export const DutySchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<JadwalPiket[]>([]);
  const [teachers, setTeachers] = useState<UserDetail[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<JadwalPiket | null>(null);
  const [formGuruId, setFormGuruId] = useState("");
  const [formHari, setFormHari] = useState<HariBelajar>("Senin");
  const [formSemesterId, setFormSemesterId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const [piketData, usrData, semData] = await Promise.all([
        scheduleService.getJadwalPiket(),
        userService.getAll(),
        academicService.getSemester(),
      ]);
      setSchedules(piketData);
      setTeachers(
        usrData.filter((u) => u.role === "guru" && u.status === "aktif"),
      );
      setSemesters(semData);

      // Set default semester filter to active semester if present
      const activeSem = semData.find((s) => s.status === "aktif");
      if (activeSem) {
        setSemesterFilter(activeSem.id);
      } else if (semData.length > 0) {
        setSemesterFilter(semData[0].id);
      }
    } catch {
      setToastMessage("Gagal memuat data jadwal piket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, []);

  const filteredSchedules = useMemo(() => {
    let result = schedules;
    if (semesterFilter !== "") {
      result = result.filter((s) => s.semesterId === semesterFilter);
    }
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter((s) => s.guruName.toLowerCase().includes(q));
    }
    if (dayFilter !== "") {
      result = result.filter((s) => s.hari === dayFilter);
    }
    return result;
  }, [schedules, search, dayFilter, semesterFilter]);

  const handleOpenAddModal = () => {
    setEditItem(null);
    setFormGuruId(teachers[0]?.id || "");
    setFormHari("Senin");
    setFormSemesterId(
      semesterFilter ||
        semesters.find((s) => s.status === "aktif")?.id ||
        semesters[0]?.id ||
        "",
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: JadwalPiket) => {
    setEditItem(item);
    setFormGuruId(item.guruId);
    setFormHari(item.hari);
    setFormSemesterId(item.semesterId || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formGuruId || !formHari || !formSemesterId) {
      setFormError("Semua bidang wajib diisi.");
      return;
    }

    const selectedGuru = teachers.find((t) => t.id === formGuruId);
    const selectedSemester = semesters.find((s) => s.id === formSemesterId);
    if (!selectedGuru || !selectedSemester) {
      setFormError("Data guru atau semester tidak valid.");
      return;
    }

    // Check if there is already a teacher assigned on this day for the same semester (coerced comparison)
    const duplicate = schedules.find(
      (s) =>
        s.hari === formHari &&
        String(s.guruId) === String(formGuruId) &&
        String(s.semesterId) === String(formSemesterId) &&
        (!editItem || String(s.id) !== String(editItem.id)),
    );
    if (duplicate) {
      setFormError(
        "Guru tersebut sudah dijadwalkan piket pada hari yang sama di semester terpilih.",
      );
      return;
    }

    const payload = {
      guruId: formGuruId,
      guruName: selectedGuru.name,
      hari: formHari,
      semesterId: formSemesterId,
      tahunAjaranId: selectedSemester.tahunAjaran,
    };

    try {
      if (editItem) {
        await scheduleService.updateJadwalPiket(editItem.id, payload);
        setToastMessage("Jadwal piket berhasil diperbarui.");
      } else {
        await scheduleService.createJadwalPiket(payload);
        setToastMessage("Jadwal piket baru berhasil ditambahkan.");
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (error: unknown) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan jadwal piket.",
      );
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await scheduleService.deleteJadwalPiket(deleteId);
      setToastMessage("Jadwal piket berhasil dihapus.");
      setDeleteId(null);
      await fetchData();
    } catch {
      setToastMessage("Gagal menghapus jadwal piket.");
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          message={toastMessage}
          variant="safe"
          onClose={() => setToastMessage(null)}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          isOpen={true}
          title="Hapus Jadwal Piket"
          message="Apakah Anda yakin ingin menghapus jadwal piket guru ini?"
          confirmLabel="Hapus"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editItem ? "Ubah Jadwal Piket" : "Tambah Jadwal Piket"}
        icon={<CalendarCheck className="h-4.5 w-4.5 text-primary" />}
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
              htmlFor="form-duty-semester"
              className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
            >
              Semester / Tahun Ajaran
            </label>
            <Select
              id="form-duty-semester"
              value={formSemesterId}
              onChange={(e) => setFormSemesterId(e.target.value)}
              required
            >
              <option value="">Pilih Semester</option>
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.tahunAjaran} - {sem.name}{" "}
                  {sem.status === "aktif" ? "(Aktif)" : ""}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label
              htmlFor="form-duty-guru"
              className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
            >
              Guru Piket
            </label>
            <Select
              id="form-duty-guru"
              value={formGuruId}
              onChange={(e) => setFormGuruId(e.target.value)}
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label
              htmlFor="form-duty-hari"
              className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
            >
              Hari Tugas
            </label>
            <Select
              id="form-duty-hari"
              value={formHari}
              onChange={(e) => setFormHari(e.target.value as HariBelajar)}
            >
              <option value="Senin">Senin</option>
              <option value="Selasa">Selasa</option>
              <option value="Rabu">Rabu</option>
              <option value="Kamis">Kamis</option>
              <option value="Jumat">Jumat</option>
              <option value="Sabtu">Sabtu</option>
            </Select>
          </div>

          <div className="pt-4 border-t border-bg-border flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            Jadwal Piket
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Kelola pembagian tugas harian guru piket untuk pemantauan presensi
            dan jurnal.
          </p>
        </div>
        <Button className="gap-2" onClick={handleOpenAddModal}>
          <Plus className="h-4 w-4" />
          Tambah Jadwal Piket
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchPlaceholder="Cari nama guru piket..."
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
        actions={
          <div className="flex gap-2 items-center">
            <Select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="py-1 pl-3.5 pr-10 h-9 min-w-[190px]"
              aria-label="Filter Semester"
            >
              <option value="">Semua Semester</option>
              {semesters.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.tahunAjaran} - {sem.name}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      {loading ? (
        <LoadingState message="Memuat jadwal piket..." />
      ) : (
        <CalendarBoard
          items={filteredSchedules.map((s) => ({
            id: s.id,
            hari: s.hari,
            title: s.guruName,
            subtitle: "Guru Piket",
            colorTheme: "primary",
          }))}
          onEdit={(item) => {
            const original = schedules.find((s) => s.id === item.id);
            if (original) handleOpenEditModal(original);
          }}
          onDelete={handleDeleteClick}
          emptyText="Tidak ada jadwal piket"
        />
      )}
    </div>
  );
};
export default DutySchedulesPage;

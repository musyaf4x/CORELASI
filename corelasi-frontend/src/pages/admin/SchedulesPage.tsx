import React, { useEffect, useMemo, useState } from "react";
import { scheduleService } from "@/services/scheduleService";
import { academicService } from "@/services/academicService";
import { userService } from "@/services/userService";
import type { JadwalPembelajaran, HariBelajar } from "@/types/schedule";
import type { Kelas, MataPelajaran, Semester } from "@/types/academic";
import type { UserDetail } from "@/types/user";
import {
  FilterBar,
  Button,
  Toast,
  ConfirmDialog,
  LoadingState,
  Input,
  Select,
  Modal,
  CalendarBoard,
  StatusBadge,
} from "@/components/shared";
import {
  Plus,
  Calendar,
  Edit,
  Trash2,
  Clock,
  Building,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export const SchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<JadwalPembelajaran[]>([]);
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [subjects, setSubjects] = useState<MataPelajaran[]>([]);
  const [teachers, setTeachers] = useState<UserDetail[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<JadwalPembelajaran | null>(null);
  const [formClassId, setFormClassId] = useState("");
  const [formMapelId, setFormMapelId] = useState("");
  const [formGuruId, setFormGuruId] = useState("");
  const [formHari, setFormHari] = useState<HariBelajar>("Senin");
  const [formWaktuMulai, setFormWaktuMulai] = useState("07:30");
  const [formWaktuSelesai, setFormWaktuSelesai] = useState("09:00");
  const [formSemesterId, setFormSemesterId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const [schData, clData, sbData, usrData, semData] = await Promise.all([
        scheduleService.getJadwalPembelajaran(),
        academicService.getKelas(),
        academicService.getMapel(),
        userService.getAll(),
        academicService.getSemester(),
      ]);
      setSchedules(schData);
      setClasses(clData);
      setSubjects(sbData);
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
      setToastMessage("Gagal memuat data jadwal.");
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
      result = result.filter(
        (s) => String(s.semesterId) === String(semesterFilter),
      );
    }
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.mapelName.toLowerCase().includes(q) ||
          s.guruName.toLowerCase().includes(q),
      );
    }
    if (classFilter !== "") {
      result = result.filter((s) => String(s.kelasId) === String(classFilter));
    }
    if (dayFilter !== "") {
      result = result.filter((s) => s.hari === dayFilter);
    }
    return result;
  }, [schedules, search, classFilter, dayFilter, semesterFilter]);

  const handleOpenAddModal = () => {
    setEditItem(null);
    setFormClassId(selectedClassId || classes[0]?.id || "");
    setFormMapelId(subjects[0]?.id || "");
    setFormGuruId(teachers[0]?.id || "");
    setFormHari("Senin");
    setFormWaktuMulai("07:30");
    setFormWaktuSelesai("09:00");
    setFormSemesterId(
      semesterFilter ||
        semesters.find((s) => s.status === "aktif")?.id ||
        semesters[0]?.id ||
        "",
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: JadwalPembelajaran) => {
    setEditItem(item);
    setFormClassId(item.kelasId);
    setFormMapelId(item.mapelId);
    setFormGuruId(item.guruId);
    setFormHari(item.hari);
    setFormWaktuMulai(item.waktuMulai);
    setFormWaktuSelesai(item.waktuSelesai);
    setFormSemesterId(item.semesterId || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (
      !formClassId ||
      !formMapelId ||
      !formGuruId ||
      !formHari ||
      !formWaktuMulai ||
      !formWaktuSelesai ||
      !formSemesterId
    ) {
      setFormError("Semua bidang wajib diisi.");
      return;
    }

    const selectedClass = classes.find(
      (c) => String(c.id) === String(formClassId),
    );
    const selectedMapel = subjects.find(
      (m) => String(m.id) === String(formMapelId),
    );
    const selectedGuru = teachers.find(
      (t) => String(t.id) === String(formGuruId),
    );
    const selectedSemester = semesters.find(
      (s) => String(s.id) === String(formSemesterId),
    );

    if (
      !selectedClass ||
      !selectedMapel ||
      !selectedGuru ||
      !selectedSemester
    ) {
      setFormError("Data referensi kelas/mapel/guru/semester tidak valid.");
      return;
    }

    const payload = {
      kelasId: formClassId,
      kelasName: selectedClass.name,
      mapelId: formMapelId,
      mapelName: selectedMapel.name,
      guruId: formGuruId,
      guruName: selectedGuru.name,
      hari: formHari,
      waktuMulai: formWaktuMulai,
      waktuSelesai: formWaktuSelesai,
      semesterId: formSemesterId,
      tahunAjaranId: selectedSemester.tahunAjaran,
    };

    try {
      if (editItem) {
        await scheduleService.updateJadwalPembelajaran(editItem.id, payload);
        setToastMessage("Jadwal pembelajaran berhasil diperbarui.");
      } else {
        await scheduleService.createJadwalPembelajaran(payload);
        setToastMessage("Jadwal pembelajaran baru berhasil ditambahkan.");
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (error: unknown) {
      setFormError(
        error instanceof Error ? error.message : "Gagal menyimpan jadwal.",
      );
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await scheduleService.deleteJadwalPembelajaran(deleteId);
      setToastMessage("Jadwal pembelajaran berhasil dihapus.");
      setDeleteId(null);
      await fetchData();
    } catch {
      setToastMessage("Gagal menghapus jadwal.");
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
          title="Hapus Jadwal"
          message="Apakah Anda yakin ingin menghapus jadwal pembelajaran ini?"
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
        title={
          editItem ? "Ubah Jadwal Pembelajaran" : "Tambah Jadwal Pembelajaran"
        }
        icon={<Calendar className="h-4.5 w-4.5 text-primary" />}
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 text-[12px] bg-status-danger/10 text-status-danger border border-status-danger/25 rounded-[6px] font-medium">
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="form-schedule-semester"
              className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
            >
              Semester / Tahun Ajaran
            </label>
            <Select
              id="form-schedule-semester"
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
              htmlFor="form-schedule-kelas"
              className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
            >
              Kelas
            </label>
            <Select
              id="form-schedule-kelas"
              value={formClassId}
              onChange={(e) => setFormClassId(e.target.value)}
              disabled={!!selectedClassId}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label
              htmlFor="form-schedule-mapel"
              className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
            >
              Mata Pelajaran
            </label>
            <Select
              id="form-schedule-mapel"
              value={formMapelId}
              onChange={(e) => setFormMapelId(e.target.value)}
            >
              {subjects.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label
              htmlFor="form-schedule-guru"
              className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
            >
              Guru Pengampu
            </label>
            <Select
              id="form-schedule-guru"
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

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label
                htmlFor="form-schedule-hari"
                className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
              >
                Hari
              </label>
              <Select
                id="form-schedule-hari"
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
            <div>
              <label
                htmlFor="form-schedule-mulai"
                className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
              >
                Mulai
              </label>
              <Input
                id="form-schedule-mulai"
                type="time"
                value={formWaktuMulai}
                onChange={(e) => setFormWaktuMulai(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="form-schedule-selesai"
                className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
              >
                Selesai
              </label>
              <Input
                id="form-schedule-selesai"
                type="time"
                value={formWaktuSelesai}
                onChange={(e) => setFormWaktuSelesai(e.target.value)}
              />
            </div>
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
        <div className="flex items-center gap-3">
          {selectedClassId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedClassId(null)}
              className="h-8 w-8 p-0 hover:bg-bg-sage-slate rounded-[4px] cursor-pointer shrink-0"
              aria-label="Kembali ke Daftar Kelas"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
          )}
          <div>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
              {selectedClassId
                ? `Jadwal Kelas ${classes.find((c) => String(c.id) === String(selectedClassId))?.name || ""}`
                : "Jadwal Pembelajaran"}
            </h1>
            <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
              {selectedClassId
                ? `Kelola plotting jadwal dan guru pengampu khusus kelas ${classes.find((c) => String(c.id) === String(selectedClassId))?.name || ""}.`
                : "Kelola plotting jadwal mata pelajaran kelas dan guru pengampu."}
            </p>
          </div>
        </div>
        <Button
          className="gap-2 shrink-0 self-start sm:self-center"
          onClick={handleOpenAddModal}
        >
          <Plus className="h-4 w-4" />
          Tambah Jadwal
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchPlaceholder="Cari berdasarkan nama mapel atau guru..."
        searchValue={search}
        onSearchChange={setSearch}
        filterValue={selectedClassId ? undefined : classFilter}
        onFilterChange={selectedClassId ? undefined : setClassFilter}
        filterPlaceholder={selectedClassId ? undefined : "Semua Kelas"}
        filterLabel={selectedClassId ? undefined : "Kelas"}
        searchLabel="Pencarian Jadwal"
        filterOptions={
          selectedClassId
            ? undefined
            : classes.map((c) => ({ value: c.id, label: c.name }))
        }
        actions={
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-bg-ink-muted uppercase tracking-wider pl-0.5">
                Semester
              </span>
              <Select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="py-1 pl-3.5 pr-10 h-9 min-w-[190px] text-[13px]"
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

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-bg-ink-muted uppercase tracking-wider pl-0.5">
                Hari
              </span>
              <Select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="py-1 pl-3.5 pr-10 h-9 min-w-[130px] text-[13px]"
                aria-label="Filter Hari"
              >
                <option value="">Semua Hari</option>
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
              </Select>
            </div>
          </div>
        }
      />

      {loading ? (
        <LoadingState message="Memuat jadwal pembelajaran..." />
      ) : selectedClassId ? (
        <CalendarBoard
          items={filteredSchedules
            .filter((s) => String(s.kelasId) === String(selectedClassId))
            .map((s) => {
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
          onEdit={(item) => {
            const original = schedules.find((s) => s.id === item.id);
            if (original) handleOpenEditModal(original);
          }}
          onDelete={handleDeleteClick}
          emptyText="Tidak ada jadwal pelajaran untuk kelas ini"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => {
            const classScheds = filteredSchedules.filter(
              (s) => String(s.kelasId) === String(c.id),
            );

            // If classFilter is active and doesn't match this class, or if search is active and this class has no matching schedules, hide it
            if (classFilter && String(classFilter) !== String(c.id))
              return null;
            if (search.trim() && classScheds.length === 0) return null;
            if (dayFilter && classScheds.length === 0) return null;

            // Determine border color based on class name
            let borderClass = "border-t-primary";
            let headerBg = "bg-primary/[0.04]";
            let badgeState:
              | "excellent"
              | "info"
              | "warning"
              | "danger"
              | "neutral" = "neutral";

            if (c.name.startsWith("X-")) {
              borderClass = "border-t-status-excellent";
              headerBg = "bg-bg-excellent-tint";
              badgeState = "excellent";
            } else if (c.name.startsWith("XI-")) {
              borderClass = "border-t-status-info";
              headerBg = "bg-status-info/[0.04]";
              badgeState = "info";
            } else if (c.name.startsWith("XII-")) {
              borderClass = "border-t-status-warning";
              headerBg = "bg-status-warning/[0.04]";
              badgeState = "warning";
            }

            return (
              <div
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className={`group rounded-[6px] border border-bg-border ${borderClass} border-t-2 bg-bg-surface shadow-[0_1px_3px_rgba(20,33,26,0.05)] transition-colors hover:border-bg-border-muted block overflow-hidden cursor-pointer`}
              >
                {/* Header */}
                <div
                  className={`${headerBg} border-b border-bg-border/40 px-5 py-4 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-bg-ink-muted" />
                    <h2 className="text-[15px] font-bold text-bg-ink font-sans">
                      {c.name}
                    </h2>
                  </div>
                  <StatusBadge
                    label={`${classScheds.length} Jadwal`}
                    state={badgeState}
                    size="xs"
                    showDot={false}
                  />
                </div>

                {/* Body */}
                <div className="p-5">
                  {classScheds.length === 0 ? (
                    <div className="py-6 text-center text-[12px] text-bg-ink-muted">
                      Belum ada jadwal pelajaran
                    </div>
                  ) : (
                    <div className="mb-4 divide-y divide-bg-border/40 max-h-[220px] overflow-y-auto pr-1">
                      {classScheds.map((s) => (
                        <div
                          key={s.id}
                          className="py-3 flex items-start justify-between gap-3 first:pt-0 last:pb-0 group/item"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <h4
                              className="text-[13px] font-bold text-bg-ink font-sans truncate"
                              title={s.mapelName}
                            >
                              {s.mapelName}
                            </h4>
                            <p
                              className="text-[11px] text-bg-ink-secondary truncate"
                              title={s.guruName}
                            >
                              {s.guruName}
                            </p>
                            <div className="flex items-center gap-1 text-[11px] font-mono text-bg-ink-muted font-bold mt-1.5">
                              <Clock className="h-3 w-3 text-bg-ink-muted/80" />
                              <span>
                                {s.hari}, {s.waktuMulai} - {s.waktuSelesai}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div
                            className="flex items-center gap-1 shrink-0 pt-0.5"
                            onClick={(e) => e.stopPropagation()} // Prevent card click navigation
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 justify-center hover:bg-bg-sage-slate rounded-[4px] cursor-pointer"
                              onClick={() => handleOpenEditModal(s)}
                              aria-label={`Ubah jadwal ${s.mapelName}`}
                            >
                              <Edit className="h-3.5 w-3.5 text-bg-ink-muted hover:text-primary transition-colors" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 justify-center hover:bg-bg-danger-tint rounded-[4px] cursor-pointer"
                              onClick={() => handleDeleteClick(s.id)}
                              aria-label={`Hapus jadwal ${s.mapelName}`}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-bg-ink-muted hover:text-text-danger transition-colors" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Link Footer */}
                  <div className="pt-3.5 border-t border-bg-border/40 flex items-center justify-between text-[12px] font-semibold text-primary group-hover:text-primary-hover transition-colors">
                    <span>Lihat Kalender Detail</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default SchedulesPage;

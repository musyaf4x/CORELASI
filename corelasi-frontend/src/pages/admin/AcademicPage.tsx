import React, { useEffect, useMemo, useState } from "react";
import { academicService } from "@/services/academicService";
import { userService } from "@/services/userService";
import type {
  TahunAjaran,
  Semester,
  Kelas,
  MataPelajaran,
} from "@/types/academic";
import type { UserDetail } from "@/types/user";
import {
  DetailTabs,
  DataTable,
  StatusBadge,
  Button,
  Select,
  Toast,
  ConfirmDialog,
  Modal,
  Input,
} from "@/components/shared";
import { Plus, Users, ArrowRightLeft, Edit, Trash2 } from "lucide-react";
import { ApiError } from "@/types/api";

interface AnggotaKelasEntry {
  siswaId: string;
  siswaName: string;
  nis: string;
  kelasName: string;
}

export const AcademicPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("ta");
  const [loading, setLoading] = useState(true);
  const [taList, setTaList] = useState<TahunAjaran[]>([]);
  const [semList, setSemList] = useState<Semester[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);

  // Anggota Kelas state
  const [selectedKelasId, setSelectedKelasId] = useState("");
  const [allStudents, setAllStudents] = useState<UserDetail[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // CRUD & Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "ta" | "semester" | "kelas" | "mapel" | null
  >(null);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<UserDetail[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "ta" | "semester" | "kelas" | "mapel";
    id: string;
  } | null>(null);

  // Form States
  const [formTaName, setFormTaName] = useState("");
  const [formTaStatus, setFormTaStatus] = useState<"aktif" | "nonaktif">(
    "aktif",
  );
  const [formTaTanggalMulai, setFormTaTanggalMulai] = useState("");
  const [formTaTanggalSelesai, setFormTaTanggalSelesai] = useState("");

  const [formSemName, setFormSemName] = useState<"Ganjil" | "Genap">("Ganjil");
  const [formSemTa, setFormSemTa] = useState("");
  const [formSemStatus, setFormSemStatus] = useState<"aktif" | "nonaktif">(
    "aktif",
  );
  const [formSemTanggalMulai, setFormSemTanggalMulai] = useState("");
  const [formSemTanggalSelesai, setFormSemTanggalSelesai] = useState("");

  const [formKelasName, setFormKelasName] = useState("");
  const [formKelasTingkat, setFormKelasTingkat] = useState<"X" | "XI" | "XII">(
    "X",
  );
  const [formKelasWaliId, setFormKelasWaliId] = useState("");
  const [formKelasTa, setFormKelasTa] = useState("");

  const [formMapelName, setFormMapelName] = useState("");
  const [formMapelKode, setFormMapelKode] = useState("");

  const loadAcademicData = async () => {
    await Promise.resolve();
    setLoading(true);
    const [ta, sem, kelas, mapel, users] = await Promise.all([
      academicService.getTahunAjaran(),
      academicService.getSemester(),
      academicService.getKelas(),
      academicService.getMapel(),
      userService.getAll(),
    ]);
    setTaList(ta);
    setSemList(sem);
    setKelasList(kelas);
    setMapelList(mapel);
    setTeachers(users.filter((u) => u.role === "guru" && u.status === "aktif"));
    setAllStudents(
      users.filter((u) => u.role === "siswa" && u.status === "aktif"),
    );
    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(loadAcademicData);
  }, []);

  const anggotaKelas = useMemo<AnggotaKelasEntry[]>(() => {
    if (!selectedKelasId) return [];
    const kelas = kelasList.find(
      (k) => String(k.id) === String(selectedKelasId),
    );
    if (!kelas) return [];

    return allStudents
      .filter((s) => s.kelasId && String(s.kelasId) === String(selectedKelasId))
      .map((s) => ({
        siswaId: String(s.id),
        siswaName: s.name,
        nis: s.nipOrNis || "-",
        kelasName: kelas.name,
      }));
  }, [selectedKelasId, allStudents, kelasList]);

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [searchStudentQuery, setSearchStudentQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentsWithoutThisClass, setStudentsWithoutThisClass] = useState<
    UserDetail[]
  >([]);

  const handleOpenAddMemberModal = () => {
    // List of active students who are not currently in the selected class
    const available = allStudents.filter(
      (s) => !s.kelasId || String(s.kelasId) !== String(selectedKelasId),
    );
    setStudentsWithoutThisClass(available);
    setSelectedStudentIds([]);
    setSearchStudentQuery("");
    setIsAddMemberModalOpen(true);
  };

  const handleAssignStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0 || !selectedKelasId) return;
    try {
      await Promise.all(
        selectedStudentIds.map((id) =>
          userService.update(id, { kelasId: selectedKelasId }),
        ),
      );
      setToastMessage(
        `${selectedStudentIds.length} siswa berhasil ditambahkan ke kelas.`,
      );
      setIsAddMemberModalOpen(false);
      await loadAcademicData();
    } catch (error: unknown) {
      setToastMessage(
        error instanceof Error ? error.message : "Gagal menambahkan siswa.",
      );
    }
  };

  const handleRemoveStudentFromClass = async (siswaId: string) => {
    try {
      await userService.update(siswaId, { kelasId: null });
      setToastMessage("Siswa berhasil dikeluarkan dari kelas.");
      await loadAcademicData();
    } catch (error: unknown) {
      setToastMessage(
        error instanceof Error ? error.message : "Gagal mengeluarkan siswa.",
      );
    }
  };

  const getClassNameOfStudent = (siswa: UserDetail) => {
    if (!siswa.kelasId) return "Belum ada kelas";
    const k = kelasList.find((c) => String(c.id) === String(siswa.kelasId));
    return k ? k.name : "Belum ada kelas";
  };

  const filteredStudentsToAssign = studentsWithoutThisClass.filter((s) => {
    const q = searchStudentQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.nipOrNis && s.nipOrNis.toLowerCase().includes(q))
    );
  });

  const handleCheckboxChange = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudentsToAssign.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudentsToAssign.map((s) => String(s.id)));
    }
  };

  const handleOpenAddModal = () => {
    setEditItemId(null);
    setFormError(null);
    if (activeTab === "ta") {
      setFormTaName("");
      setFormTaStatus("aktif");
      setFormTaTanggalMulai("");
      setFormTaTanggalSelesai("");
      setModalType("ta");
    } else if (activeTab === "semester") {
      setFormSemName("Ganjil");
      setFormSemTa(taList[0]?.name || "");
      setFormSemStatus("aktif");
      setFormSemTanggalMulai("");
      setFormSemTanggalSelesai("");
      setModalType("semester");
    } else if (activeTab === "kelas") {
      setFormKelasName("");
      setFormKelasTingkat("X");
      setFormKelasWaliId(teachers[0]?.id || "");
      setFormKelasTa(
        taList.find((t) => t.status === "aktif")?.name || taList[0]?.name || "",
      );
      setModalType("kelas");
    } else if (activeTab === "mapel") {
      setFormMapelName("");
      setFormMapelKode("");
      setModalType("mapel");
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (
    type: "ta" | "semester" | "kelas" | "mapel",
    item: TahunAjaran | Semester | Kelas | MataPelajaran,
  ) => {
    setEditItemId(item.id);
    setFormError(null);
    setModalType(type);
    if (type === "ta") {
      const tahunAjaran = item as TahunAjaran;
      setFormTaName(tahunAjaran.name);
      setFormTaStatus(tahunAjaran.status);
      setFormTaTanggalMulai(tahunAjaran.tanggalMulai || "");
      setFormTaTanggalSelesai(tahunAjaran.tanggalSelesai || "");
    } else if (type === "semester") {
      const semester = item as Semester;
      setFormSemName(semester.name as "Ganjil" | "Genap");
      setFormSemTa(semester.tahunAjaran);
      setFormSemStatus(semester.status);
      setFormSemTanggalMulai(semester.tanggalMulai || "");
      setFormSemTanggalSelesai(semester.tanggalSelesai || "");
    } else if (type === "kelas") {
      const kelas = item as Kelas;
      setFormKelasName(kelas.name);
      setFormKelasTingkat(kelas.tingkat as "X" | "XI" | "XII");
      setFormKelasWaliId(kelas.waliKelasId || "");
      setFormKelasTa(kelas.tahunAjaran || "");
    } else if (type === "mapel") {
      const mapel = item as MataPelajaran;
      setFormMapelName(mapel.name);
      setFormMapelKode(mapel.kode || "");
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (modalType === "ta") {
        if (!formTaName.trim())
          throw new Error("Nama Tahun Ajaran wajib diisi.");
        const payload = {
          name: formTaName,
          status: formTaStatus,
          tanggalMulai: formTaTanggalMulai || undefined,
          tanggalSelesai: formTaTanggalSelesai || undefined,
        };
        if (editItemId) {
          await academicService.updateTahunAjaran(editItemId, payload);
          setToastMessage("Tahun Ajaran berhasil diperbarui.");
        } else {
          await academicService.createTahunAjaran(payload);
          setToastMessage("Tahun Ajaran berhasil ditambahkan.");
        }
      } else if (modalType === "semester") {
        if (!formSemName.trim() || !formSemTa)
          throw new Error("Semua bidang wajib diisi.");
        const payload = {
          name: formSemName,
          tahunAjaran: formSemTa,
          status: formSemStatus,
          tanggalMulai: formSemTanggalMulai || undefined,
          tanggalSelesai: formSemTanggalSelesai || undefined,
        };
        if (editItemId) {
          await academicService.updateSemester(editItemId, payload);
          setToastMessage("Semester berhasil diperbarui.");
        } else {
          await academicService.createSemester(payload);
          setToastMessage("Semester berhasil ditambahkan.");
        }
      } else if (modalType === "kelas") {
        if (
          !formKelasName.trim() ||
          !formKelasTingkat ||
          !formKelasWaliId ||
          !formKelasTa
        )
          throw new Error("Semua bidang wajib diisi.");
        const selectedTeacher = teachers.find(
          (t) => String(t.id) === String(formKelasWaliId),
        );
        if (!selectedTeacher) throw new Error("Wali kelas tidak valid.");
        const payload = {
          name: formKelasName,
          tingkat: formKelasTingkat,
          waliKelasId: formKelasWaliId,
          waliKelasName: selectedTeacher.name,
          tahunAjaran: formKelasTa,
        };
        if (editItemId) {
          await academicService.updateKelas(editItemId, payload);
          setToastMessage("Kelas berhasil diperbarui.");
        } else {
          await academicService.createKelas(payload);
          setToastMessage("Kelas berhasil ditambahkan.");
        }
      } else if (modalType === "mapel") {
        if (!formMapelName.trim())
          throw new Error("Nama Mata Pelajaran wajib diisi.");
        const payload = editItemId
          ? { name: formMapelName, kode: formMapelKode || undefined }
          : { name: formMapelName };
        if (editItemId) {
          await academicService.updateMapel(editItemId, payload);
          setToastMessage("Mata Pelajaran berhasil diperbarui.");
        } else {
          await academicService.createMapel(payload);
          setToastMessage("Mata Pelajaran berhasil ditambahkan.");
        }
      }
      setIsModalOpen(false);
      await loadAcademicData();
    } catch (error: unknown) {
      if (ApiError.is(error) && error.errors) {
        const errorMessages = Object.entries(error.errors)
          .map(([field, msgs]) => {
            const fieldLabel = field === "non_field_errors" ? "" : `${field}: `;
            const cleanMsgs = Array.isArray(msgs)
              ? msgs.join(", ")
              : String(msgs);
            return `${fieldLabel}${cleanMsgs}`;
          })
          .join(" | ");
        setFormError(errorMessages || error.message || "Gagal menyimpan data.");
      } else {
        setFormError(
          error instanceof Error ? error.message : "Gagal menyimpan data.",
        );
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { type, id } = deleteTarget;
      if (type === "ta") {
        await academicService.deleteTahunAjaran(id);
        setToastMessage("Tahun Ajaran berhasil dihapus.");
      } else if (type === "semester") {
        await academicService.deleteSemester(id);
        setToastMessage("Semester berhasil dihapus.");
      } else if (type === "kelas") {
        await academicService.deleteKelas(id);
        setToastMessage("Kelas berhasil dihapus.");
      } else if (type === "mapel") {
        await academicService.deleteMapel(id);
        setToastMessage("Mata Pelajaran berhasil dihapus.");
      }
      setDeleteTarget(null);
      await loadAcademicData();
    } catch (error: unknown) {
      setToastMessage(
        error instanceof Error ? error.message : "Gagal menghapus data.",
      );
    }
  };

  const getHeaderButtonLabel = () => {
    switch (activeTab) {
      case "ta":
        return "Tambah Tahun Ajaran";
      case "semester":
        return "Tambah Semester";
      case "kelas":
        return "Tambah Kelas";
      case "mapel":
        return "Tambah Mata Pelajaran";
      default:
        return "";
    }
  };

  const headerButtonLabel = getHeaderButtonLabel();

  const tabs = [
    { id: "ta", label: "Tahun Ajaran", count: taList.length },
    { id: "semester", label: "Semester", count: semList.length },
    { id: "kelas", label: "Kelas & Wali Kelas", count: kelasList.length },
    { id: "mapel", label: "Mata Pelajaran", count: mapelList.length },
    { id: "anggota", label: "Anggota Kelas", count: anggotaKelas.length },
  ];

  const taColumns = [
    {
      header: "Tahun Ajaran",
      cell: (ta: TahunAjaran) => (
        <span className="text-[13px] font-semibold text-bg-ink">{ta.name}</span>
      ),
    },
    {
      header: "Masa Aktif",
      cell: (ta: TahunAjaran) => (
        <span className="text-[13px] text-bg-ink-secondary">
          {ta.tanggalMulai && ta.tanggalSelesai
            ? `${ta.tanggalMulai} s.d. ${ta.tanggalSelesai}`
            : "-"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (ta: TahunAjaran) => (
        <StatusBadge
          label={ta.status === "aktif" ? "Aktif" : "Tidak Aktif"}
          state={ta.status === "aktif" ? "safe" : "disabled"}
          size="xs"
        />
      ),
    },
    {
      header: "Aksi",
      cell: (ta: TahunAjaran) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => handleOpenEditModal("ta", ta)}
            title="Ubah"
            aria-label="Ubah Tahun Ajaran"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-status-danger hover:bg-status-danger/10"
            onClick={() => setDeleteTarget({ type: "ta", id: ta.id })}
            title="Hapus"
            aria-label="Hapus Tahun Ajaran"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const semColumns = [
    {
      header: "Semester",
      cell: (sem: Semester) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {sem.name}
        </span>
      ),
    },
    {
      header: "Tahun Ajaran",
      cell: (sem: Semester) => (
        <span className="text-[13px] text-bg-ink-secondary">
          {sem.tahunAjaran}
        </span>
      ),
    },
    {
      header: "Masa Aktif",
      cell: (sem: Semester) => (
        <span className="text-[13px] text-bg-ink-secondary">
          {sem.tanggalMulai && sem.tanggalSelesai
            ? `${sem.tanggalMulai} s.d. ${sem.tanggalSelesai}`
            : "-"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (sem: Semester) => (
        <StatusBadge
          label={sem.status === "aktif" ? "Aktif" : "Tidak Aktif"}
          state={sem.status === "aktif" ? "safe" : "disabled"}
          size="xs"
        />
      ),
    },
    {
      header: "Aksi",
      cell: (sem: Semester) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => handleOpenEditModal("semester", sem)}
            title="Ubah"
            aria-label="Ubah Semester"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-status-danger hover:bg-status-danger/10"
            onClick={() => setDeleteTarget({ type: "semester", id: sem.id })}
            title="Hapus"
            aria-label="Hapus Semester"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const kelasColumns = [
    {
      header: "Nama Kelas",
      cell: (k: Kelas) => (
        <span className="text-[13px] font-semibold text-bg-ink">{k.name}</span>
      ),
    },
    {
      header: "Tingkat",
      cell: (k: Kelas) => (
        <span className="text-[13px] text-bg-ink-secondary">{k.tingkat}</span>
      ),
    },
    {
      header: "Tahun Ajaran",
      cell: (k: Kelas) => (
        <span className="text-[13px] text-bg-ink-secondary">
          {k.tahunAjaran || "-"}
        </span>
      ),
    },
    {
      header: "Wali Kelas",
      cell: (k: Kelas) => (
        <span className="text-[13px] font-medium text-bg-ink-secondary">
          {k.waliKelasName}
        </span>
      ),
    },
    {
      header: "Aksi",
      cell: (k: Kelas) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => handleOpenEditModal("kelas", k)}
            title="Ubah"
            aria-label="Ubah Kelas"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-status-danger hover:bg-status-danger/10"
            onClick={() => setDeleteTarget({ type: "kelas", id: k.id })}
            title="Hapus"
            aria-label="Hapus Kelas"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const mapelColumns = [
    {
      header: "Mata Pelajaran",
      cell: (mp: MataPelajaran) => (
        <span className="text-[13px] font-semibold text-bg-ink">{mp.name}</span>
      ),
    },
    {
      header: "Kode",
      cell: (mp: MataPelajaran) => (
        <span className="text-[12px] font-mono text-bg-ink-muted font-bold">
          {mp.kode}
        </span>
      ),
    },
    {
      header: "Aksi",
      cell: (mp: MataPelajaran) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => handleOpenEditModal("mapel", mp)}
            title="Ubah"
            aria-label="Ubah Mata Pelajaran"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-status-danger hover:bg-status-danger/10"
            onClick={() => setDeleteTarget({ type: "mapel", id: mp.id })}
            title="Hapus"
            aria-label="Hapus Mata Pelajaran"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const anggotaColumns = [
    {
      header: "NIS",
      cell: (a: AnggotaKelasEntry) => (
        <span className="text-[12px] font-mono text-bg-ink-muted font-bold">
          {a.nis}
        </span>
      ),
    },
    {
      header: "Nama Siswa",
      cell: (a: AnggotaKelasEntry) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {a.siswaName}
        </span>
      ),
    },
    {
      header: "Kelas",
      cell: (a: AnggotaKelasEntry) => (
        <span className="text-[13px] text-bg-ink-secondary">{a.kelasName}</span>
      ),
    },
    {
      header: "Aksi",
      cell: (a: AnggotaKelasEntry) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-status-danger hover:bg-status-danger/10"
            onClick={() => handleRemoveStudentFromClass(a.siswaId)}
            title="Keluarkan dari kelas"
            aria-label="Keluarkan dari kelas"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const activeSemester = semList.find((s) => s.status === "aktif");

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          message={toastMessage}
          variant="safe"
          onClose={() => setToastMessage(null)}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            Struktur Akademik
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Kelola data penunjang akademik, kurikulum, kelas, dan tahun
            pelajaran aktif.
          </p>
        </div>
        {headerButtonLabel && (
          <Button className="gap-2" onClick={handleOpenAddModal}>
            <Plus className="h-4 w-4" />
            {headerButtonLabel}
          </Button>
        )}
      </div>

      <DetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <span className="text-[13px] text-bg-ink-muted font-sans">
            Memuat data akademik...
          </span>
        </div>
      ) : (
        <div className="mt-4">
          {activeTab === "ta" && (
            <DataTable
              title="Daftar Tahun Ajaran"
              columns={taColumns}
              data={taList}
              keyExtractor={(ta) => ta.id}
            />
          )}

          {activeTab === "semester" && (
            <DataTable
              title="Daftar Semester"
              columns={semColumns}
              data={semList}
              keyExtractor={(sem) => sem.id}
            />
          )}

          {activeTab === "kelas" && (
            <DataTable
              title="Daftar Rombongan Belajar (Kelas)"
              columns={kelasColumns}
              data={kelasList}
              keyExtractor={(k) => k.id}
            />
          )}

          {activeTab === "mapel" && (
            <DataTable
              title="Daftar Mata Pelajaran"
              columns={mapelColumns}
              data={mapelList}
              keyExtractor={(mp) => mp.id}
            />
          )}

          {activeTab === "anggota" && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 rounded-[6px] border border-bg-border bg-bg-surface p-4">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-bold text-bg-ink-muted uppercase tracking-wider mb-1">
                    Semester Aktif
                  </label>
                  <div
                    role="textbox"
                    aria-readonly="true"
                    className="px-3.5 py-2.5 text-[13px] font-semibold text-bg-ink bg-bg-sage-slate/50 border border-bg-border rounded-[6px] w-full block"
                  >
                    {activeSemester
                      ? `${activeSemester.tahunAjaran} - ${activeSemester.name}`
                      : "Tidak Ada Semester Aktif"}
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <label
                    htmlFor="anggota-kelas-select"
                    className="block text-[11px] font-bold text-bg-ink-muted uppercase tracking-wider mb-1"
                  >
                    Pilih Kelas
                  </label>
                  <Select
                    id="anggota-kelas-select"
                    aria-label="Pilih Kelas"
                    value={selectedKelasId}
                    onChange={(e) => setSelectedKelasId(e.target.value)}
                  >
                    <option value="">- Pilih Kelas -</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </Select>
                </div>
                {selectedKelasId && (
                  <div className="w-full sm:w-auto shrink-0">
                    <Button
                      type="button"
                      className="gap-2 w-full justify-center"
                      onClick={handleOpenAddMemberModal}
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Anggota
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-bg-ink-muted">
                <Users className="inline-block h-3 w-3 mr-1" />
                Keanggotaan kelas dikelola untuk semester aktif.
              </p>

              {selectedKelasId ? (
                <DataTable
                  title={`Anggota ${kelasList.find((k) => String(k.id) === String(selectedKelasId))?.name || "Kelas"}`}
                  columns={anggotaColumns}
                  data={anggotaKelas}
                  keyExtractor={(a) => a.siswaId}
                  emptyStateTitle="Belum ada anggota"
                  emptyStateDescription="Belum ada siswa yang terdaftar pada kelas ini."
                />
              ) : (
                <div className="flex h-32 flex-col items-center justify-center rounded-[6px] border border-dashed border-bg-border bg-bg-sage-slate/30 p-6 text-center">
                  <ArrowRightLeft className="mb-2 h-6 w-6 text-bg-ink-muted" />
                  <p className="text-[13px] text-bg-ink-muted font-medium">
                    Pilih kelas di atas untuk melihat daftar anggota.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal CRUD */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editItemId
            ? `Ubah ${modalType === "ta" ? "Tahun Ajaran" : modalType === "semester" ? "Semester" : modalType === "kelas" ? "Kelas" : "Mata Pelajaran"}`
            : `Tambah ${modalType === "ta" ? "Tahun Ajaran" : modalType === "semester" ? "Semester" : modalType === "kelas" ? "Kelas" : "Mata Pelajaran"}`
        }
        maxWidth={
          modalType === "kelas" || modalType === "semester" ? "md" : "sm"
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 text-[12px] bg-status-danger/10 text-status-danger border border-status-danger/25 rounded-[6px] font-medium">
              {formError}
            </div>
          )}

          {modalType === "ta" && (
            <>
              <div>
                <label
                  htmlFor="form-ta-name"
                  className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                >
                  Tahun Ajaran
                </label>
                <Input
                  id="form-ta-name"
                  type="text"
                  placeholder="Contoh: 2025/2026"
                  value={formTaName}
                  onChange={(e) => setFormTaName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="form-ta-mulai"
                    className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                  >
                    Tanggal Mulai
                  </label>
                  <Input
                    id="form-ta-mulai"
                    type="date"
                    value={formTaTanggalMulai}
                    onChange={(e) => setFormTaTanggalMulai(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="form-ta-selesai"
                    className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                  >
                    Tanggal Selesai
                  </label>
                  <Input
                    id="form-ta-selesai"
                    type="date"
                    value={formTaTanggalSelesai}
                    onChange={(e) => setFormTaTanggalSelesai(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="form-ta-status"
                  className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                >
                  Status
                </label>
                <Select
                  id="form-ta-status"
                  value={formTaStatus}
                  onChange={(e) =>
                    setFormTaStatus(e.target.value as "aktif" | "nonaktif")
                  }
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Tidak Aktif</option>
                </Select>
              </div>
            </>
          )}

          {modalType === "semester" && (
            <>
              <div>
                <label
                  htmlFor="form-sem-name"
                  className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                >
                  Nama Semester
                </label>
                <Select
                  id="form-sem-name"
                  value={formSemName}
                  onChange={(e) =>
                    setFormSemName(e.target.value as "Ganjil" | "Genap")
                  }
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="form-sem-ta"
                  className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                >
                  Tahun Ajaran
                </label>
                <Select
                  id="form-sem-ta"
                  value={formSemTa}
                  onChange={(e) => setFormSemTa(e.target.value)}
                >
                  {taList.map((ta) => (
                    <option key={ta.id} value={ta.name}>
                      {ta.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="form-sem-mulai"
                    className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                  >
                    Tanggal Mulai
                  </label>
                  <Input
                    id="form-sem-mulai"
                    type="date"
                    value={formSemTanggalMulai}
                    onChange={(e) => setFormSemTanggalMulai(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="form-sem-selesai"
                    className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                  >
                    Tanggal Selesai
                  </label>
                  <Input
                    id="form-sem-selesai"
                    type="date"
                    value={formSemTanggalSelesai}
                    onChange={(e) => setFormSemTanggalSelesai(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="form-sem-status"
                  className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                >
                  Status
                </label>
                <Select
                  id="form-sem-status"
                  value={formSemStatus}
                  onChange={(e) =>
                    setFormSemStatus(e.target.value as "aktif" | "nonaktif")
                  }
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Tidak Aktif</option>
                </Select>
              </div>
            </>
          )}

          {modalType === "kelas" && (
            <>
              <div>
                <label
                  htmlFor="form-kelas-name"
                  className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                >
                  Nama Kelas
                </label>
                <Input
                  id="form-kelas-name"
                  type="text"
                  placeholder="Contoh: X-A / XI-B"
                  value={formKelasName}
                  onChange={(e) => setFormKelasName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="form-kelas-ta"
                  className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                >
                  Tahun Ajaran
                </label>
                <Select
                  id="form-kelas-ta"
                  value={formKelasTa}
                  onChange={(e) => setFormKelasTa(e.target.value)}
                  required
                >
                  <option value="">Pilih Tahun Ajaran</option>
                  {taList.map((ta) => (
                    <option key={ta.id} value={ta.name}>
                      {ta.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label
                  htmlFor="form-kelas-tingkat"
                  className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                >
                  Tingkat
                </label>
                <Select
                  id="form-kelas-tingkat"
                  value={formKelasTingkat}
                  onChange={(e) =>
                    setFormKelasTingkat(e.target.value as "X" | "XI" | "XII")
                  }
                >
                  <option value="X">X</option>
                  <option value="XI">XI</option>
                  <option value="XII">XII</option>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="form-kelas-wali"
                  className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                >
                  Wali Kelas
                </label>
                <Select
                  id="form-kelas-wali"
                  value={formKelasWaliId}
                  onChange={(e) => setFormKelasWaliId(e.target.value)}
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
            </>
          )}

          {modalType === "mapel" && (
            <>
              <div>
                <label
                  htmlFor="form-mapel-name"
                  className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
                >
                  Nama Mata Pelajaran
                </label>
                <Input
                  id="form-mapel-name"
                  type="text"
                  placeholder="Contoh: Fisika / Kimia"
                  value={formMapelName}
                  onChange={(e) => setFormMapelName(e.target.value)}
                  required
                />
              </div>
            </>
          )}

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

      {/* Modal Tambah Anggota Kelas */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title={`Tambah Anggota Kelas - ${kelasList.find((k) => String(k.id) === String(selectedKelasId))?.name || ""}`}
        maxWidth="md"
      >
        <form onSubmit={handleAssignStudentSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="search-student-modal"
              className="block text-[12px] font-semibold text-bg-ink-secondary mb-1"
            >
              Cari Siswa
            </label>
            <Input
              id="search-student-modal"
              type="text"
              placeholder="Cari berdasarkan nama atau NIS..."
              value={searchStudentQuery}
              onChange={(e) => setSearchStudentQuery(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-semibold text-bg-ink-secondary">
                Daftar Siswa ({filteredStudentsToAssign.length} tersedia)
              </label>
              {filteredStudentsToAssign.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-[12px] font-semibold text-primary hover:underline"
                >
                  {selectedStudentIds.length === filteredStudentsToAssign.length
                    ? "Batal Pilih Semua"
                    : "Pilih Semua"}
                </button>
              )}
            </div>

            {filteredStudentsToAssign.length === 0 ? (
              <p className="text-[13px] text-bg-ink-muted/80 italic py-6 text-center border border-dashed border-bg-border rounded-[6px]">
                Tidak ada siswa yang sesuai pencarian atau semua sudah
                terdaftar.
              </p>
            ) : (
              <div className="max-h-[250px] overflow-y-auto border border-bg-border rounded-[6px] divide-y divide-bg-border">
                {filteredStudentsToAssign.map((s) => {
                  const isChecked = selectedStudentIds.includes(String(s.id));
                  const currentClass = getClassNameOfStudent(s);
                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-bg-sage-slate/20 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(String(s.id))}
                        className="rounded-[4px] border-bg-border text-primary focus:ring-primary h-4.5 w-4.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-bg-ink truncate">
                          {s.name}
                        </p>
                        <p className="text-[11px] text-bg-ink-muted">
                          NIS: {s.nipOrNis || "-"} • Kelas Saat Ini:{" "}
                          <span
                            className={
                              s.kelasId
                                ? "text-bg-ink-secondary font-medium"
                                : "text-amber-600 font-medium"
                            }
                          >
                            {currentClass}
                          </span>
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-bg-border">
            <span className="text-[12px] text-bg-ink-secondary font-medium">
              Terpilih:{" "}
              <strong className="text-primary font-bold text-[13px]">
                {selectedStudentIds.length}
              </strong>{" "}
              siswa
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddMemberModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={selectedStudentIds.length === 0}>
                Tambahkan ({selectedStudentIds.length})
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {deleteTarget && (
        <ConfirmDialog
          isOpen={true}
          title={`Hapus ${deleteTarget.type === "ta" ? "Tahun Ajaran" : deleteTarget.type === "semester" ? "Semester" : deleteTarget.type === "kelas" ? "Kelas" : "Mata Pelajaran"}`}
          message="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
export default AcademicPage;

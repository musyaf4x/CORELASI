import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { learningService } from "@/services/learningService";
import type { Tugas } from "@/types/learning";
import {
  DataTable,
  FilterBar,
  Button,
  Toast,
  ConfirmDialog,
  LoadingState,
  StatusBadge,
} from "@/components/shared";
import { Plus, Edit, Trash2, Eye, Calendar } from "lucide-react";

export const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Tugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const data = await learningService.getTugasByGuru(user.id);
      setAssignments(data);
    } catch {
      setToastMessage("Gagal memuat tugas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(fetchAssignments);
  }, [fetchAssignments]);

  const filteredAssignments = useMemo(() => {
    let result = assignments;
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }
    if (classFilter !== "") {
      result = result.filter((t) => String(t.kelasId) === String(classFilter));
    }
    return result;
  }, [assignments, search, classFilter]);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await learningService.deleteTugas(deleteId);
      setToastMessage("Tugas berhasil dihapus.");
      setDeleteId(null);
      await fetchAssignments();
    } catch {
      setToastMessage("Gagal menghapus tugas.");
    }
  };

  const classOptions = Array.from(
    new Set(
      assignments.map((t) =>
        JSON.stringify({ value: t.kelasId, label: t.kelasName }),
      ),
    ),
  ).map((str) => JSON.parse(str));

  const columns = [
    {
      header: "Nama Tugas",
      cell: (t: Tugas) => (
        <div>
          <Link
            to={`/guru/assignments/${t.id}`}
            className="text-[13px] font-semibold text-bg-ink hover:text-primary hover:underline block"
          >
            {t.title}
          </Link>
          <span className="text-[11px] text-bg-ink-secondary leading-snug line-clamp-1">
            {t.description}
          </span>
        </div>
      ),
    },
    {
      header: "Kelas",
      cell: (t: Tugas) => (
        <span className="text-[13px] font-medium text-bg-ink">
          {t.kelasName}
        </span>
      ),
    },
    {
      header: "Mata Pelajaran",
      cell: (t: Tugas) => (
        <span className="text-[13px] text-bg-ink-secondary">{t.mapelName}</span>
      ),
    },
    {
      header: "Batas Waktu",
      cell: (t: Tugas) => (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-status-warning font-mono">
          <Calendar className="h-3 w-3" />
          {t.dueDate}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (t: Tugas) => (
        <StatusBadge
          label={t.status}
          state={t.status === "Dipublikasikan" ? "safe" : "disabled"}
          size="xs"
        />
      ),
    },
    {
      header: "Aksi",
      cell: (t: Tugas) => (
        <div className="flex items-center gap-1">
          <Link to={`/guru/assignments/${t.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Detail / Submissions"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link to={`/guru/assignments/${t.id}/edit`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Ubah"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-status-danger hover:bg-status-danger/10"
            onClick={() => handleDeleteClick(t.id)}
            title="Hapus"
          >
            <Trash2 className="h-3.5 w-3.5" />
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

      {deleteId && (
        <ConfirmDialog
          isOpen={true}
          title="Hapus Tugas"
          message="Apakah Anda yakin ingin menghapus tugas ini?"
          confirmLabel="Hapus"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            Tugas Pembelajaran
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Kelola, publikasikan, dan pantau pengumpulan tugas mandiri atau
            kelompok siswa.
          </p>
        </div>
        <Link to="/guru/assignments/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Tugas
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchPlaceholder="Cari judul tugas..."
        searchValue={search}
        onSearchChange={setSearch}
        filterValue={classFilter}
        onFilterChange={setClassFilter}
        filterPlaceholder="Semua Kelas"
        filterOptions={classOptions}
      />

      {loading ? (
        <LoadingState message="Memuat tugas..." />
      ) : (
        <DataTable
          title="Daftar Tugas KBM Anda"
          columns={columns}
          data={filteredAssignments}
          keyExtractor={(t) => t.id}
          emptyStateTitle="Belum ada tugas"
          emptyStateDescription="Silakan tambahkan tugas pertama Anda dengan menekan tombol Tambah Tugas."
        />
      )}
    </div>
  );
};
export default AssignmentsPage;

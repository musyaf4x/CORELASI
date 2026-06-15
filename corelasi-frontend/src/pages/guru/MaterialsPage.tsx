import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { learningService } from "@/services/learningService";
import type { Materi } from "@/types/learning";
import {
  FilterBar,
  Button,
  Toast,
  ConfirmDialog,
  LoadingState,
  StatusBadge,
  Card,
} from "@/components/shared";
import { Plus, Edit, Trash2, ExternalLink, Download } from "lucide-react";

export const MaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Materi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const data = await learningService.getMateriByGuru(user.id);
      setMaterials(data);
    } catch {
      setToastMessage("Gagal memuat materi.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(fetchMaterials);
  }, [fetchMaterials]);

  const filteredMaterials = useMemo(() => {
    let result = materials;
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q),
      );
    }
    if (classFilter !== "") {
      result = result.filter((m) => String(m.kelasId) === String(classFilter));
    }
    return result;
  }, [materials, search, classFilter]);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await learningService.deleteMateri(deleteId);
      setToastMessage("Materi berhasil dihapus.");
      setDeleteId(null);
      await fetchMaterials();
    } catch {
      setToastMessage("Gagal menghapus materi.");
    }
  };

  // Extract unique classes for filter options
  const classOptions = Array.from(
    new Set(
      materials.map((m) =>
        JSON.stringify({ value: m.kelasId, label: m.kelasName }),
      ),
    ),
  ).map((str) => JSON.parse(str));

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
          title="Hapus Materi"
          message="Apakah Anda yakin ingin menghapus berkas materi ini?"
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
            Materi Pembelajaran
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Kelola dan publikasikan modul ajar, materi, atau bahan presentasi
            KBM.
          </p>
        </div>
        <Link to="/guru/materials/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Materi
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchPlaceholder="Cari judul materi..."
        searchValue={search}
        onSearchChange={setSearch}
        filterValue={classFilter}
        onFilterChange={setClassFilter}
        filterPlaceholder="Semua Kelas"
        filterLabel="Kelas"
        filterOptions={classOptions}
      />

      {loading ? (
        <LoadingState message="Memuat materi..." />
      ) : filteredMaterials.length === 0 ? (
        <div className="border border-bg-border bg-bg-surface rounded-[6px] shadow-[0_1px_4px_rgba(20,33,26,0.05)] p-8 text-center">
          <p className="text-[14px] font-bold text-bg-ink">Belum ada materi</p>
          <p className="mt-1 text-[13px] text-bg-ink-secondary">
            Silakan tambahkan modul ajar pertama Anda dengan menekan tombol
            Tambah Materi.
          </p>
        </div>
      ) : (
        <div className="border border-bg-border bg-bg-surface rounded-[6px] shadow-[0_1px_4px_rgba(20,33,26,0.05)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-bg-border">
            <h3 className="text-[14px] font-bold tracking-tight text-bg-ink font-sans">
              Daftar Materi Pembelajaran Anda
            </h3>
          </div>
          <div className="p-5 space-y-4 bg-bg-sage-slate/30">
            {filteredMaterials.map((m) => (
              <Card
                key={m.id}
                variant="surface"
                padding="none"
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-bg-border hover:border-border-muted transition-all duration-200 bg-bg-surface"
              >
                {/* Left Side: Icon + Title & Description + Badges */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-bg-ink-secondary">
                    <span className="inline-flex items-center rounded-full bg-primary/[0.08] px-2.5 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                      {m.kelasName}
                    </span>
                    <span className="font-semibold text-bg-ink">
                      {m.mapelName}
                    </span>
                    <span className="text-bg-ink-muted/60">•</span>
                    <span className="text-[11px] text-bg-ink-muted">
                      Rilis: {m.dateCreated}
                    </span>
                    <StatusBadge
                      label={m.status}
                      state={
                        m.status === "Dipublikasikan" ? "safe" : "disabled"
                      }
                      size="xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[15px] font-bold text-bg-ink leading-snug font-sans">
                      {m.title}
                    </h3>
                    <p className="text-[13px] text-bg-ink-secondary leading-relaxed line-clamp-2">
                      {m.description}
                    </p>
                  </div>
                </div>

                {/* Right Side: Lampiran (Attachment) + Actions */}
                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 border-bg-border/60 pt-3 md:pt-0 shrink-0 w-full md:w-auto">
                  {/* Lampiran Link */}
                  <div className="text-[12.5px]">
                    {m.fileUrl ? (
                      m.sourceType === "link" ? (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Buka Tautan
                        </a>
                      ) : (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Unduh Berkas
                        </a>
                      )
                    ) : (
                      <span className="text-bg-ink-muted italic">
                        Tidak ada lampiran
                      </span>
                    )}
                  </div>

                  {/* Actions Button Group */}
                  <div className="flex items-center gap-1">
                    <Link to={`/guru/materials/${m.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Ubah"
                      >
                        <Edit className="h-3.5 w-3.5 text-bg-ink-secondary" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-status-danger hover:bg-status-danger/10"
                      onClick={() => handleDeleteClick(m.id)}
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default MaterialsPage;

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useAuth } from "@/hooks/useAuth";
import { learningService } from "@/services/learningService";
import { scheduleService } from "@/services/scheduleService";
import type { JadwalPembelajaran } from "@/types/schedule";
import {
  Card,
  Input,
  Select,
  Button,
  Toast,
  LoadingState,
} from "@/components/shared";
import { ArrowLeft, AlertCircle } from "lucide-react";

const assignmentSchema = zod.object({
  title: zod.string().min(1, "Judul tugas wajib diisi."),
  description: zod.string().min(1, "Deskripsi/petunjuk tugas wajib diisi."),
  kelasId: zod.string().min(1, "Pilih kelas target."),
  mapelId: zod.string().min(1, "Pilih mata pelajaran."),
  dueDate: zod.string().min(1, "Pilih batas tanggal pengumpulan."),
  fileUrl: zod.string().url("Format URL tidak valid.").or(zod.literal("")),
  status: zod.enum(["Draft", "Dipublikasikan"]),
});

type AssignmentFormFields = zod.infer<typeof assignmentSchema>;

export const AssignmentFormPage: React.FC = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(isEditMode);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mySchedules, setMySchedules] = useState<JadwalPembelajaran[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormFields>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      kelasId: "",
      mapelId: "",
      dueDate: "",
      fileUrl: "",
      status: "Dipublikasikan",
    },
  });

  const selectedClassId = useWatch({ control, name: "kelasId" });

  useEffect(() => {
    const loadTeacherContext = async () => {
      if (!user) return;
      try {
        const sch = await scheduleService.getJadwalPembelajaran();
        const filtered = sch.filter(
          (s) => String(s.guruId) === String(user.id),
        );
        setMySchedules(filtered);

        if (!isEditMode && filtered.length > 0) {
          setValue("kelasId", filtered[0].kelasId);
          setValue("mapelId", filtered[0].mapelId);
        }
      } catch (err) {
        setToastMessage(
          err instanceof Error
            ? err.message
            : "Gagal memuat data jadwal mengajar.",
        );
      }
    };
    loadTeacherContext();
  }, [user, isEditMode, setValue]);

  useEffect(() => {
    if (selectedClassId && mySchedules.length > 0) {
      const match = mySchedules.find(
        (s) => String(s.kelasId) === String(selectedClassId),
      );
      if (match) {
        setValue("mapelId", match.mapelId);
      }
    }
  }, [selectedClassId, mySchedules, setValue]);

  useEffect(() => {
    if (isEditMode && id) {
      const loadAssignment = async () => {
        try {
          const tug = await learningService.getTugasById(id);
          if (tug) {
            setValue("title", tug.title);
            setValue("description", tug.description);
            setValue("kelasId", tug.kelasId);
            setValue("mapelId", tug.mapelId);
            setValue("dueDate", tug.dueDate);
            setValue("fileUrl", tug.fileUrl || "");
            setValue("status", tug.status);
          } else {
            setSubmitError("Tugas tidak ditemukan.");
          }
        } catch {
          setSubmitError("Gagal memuat tugas.");
        } finally {
          setLoading(false);
        }
      };
      loadAssignment();
    }
  }, [id, isEditMode, setValue]);

  const onSubmit = async (data: AssignmentFormFields) => {
    setSubmitError(null);
    if (!user) return;

    const matchedSch = mySchedules.find(
      (s) =>
        String(s.kelasId) === String(data.kelasId) &&
        String(s.mapelId) === String(data.mapelId),
    );
    const targetClass = mySchedules.find(
      (s) => String(s.kelasId) === String(data.kelasId),
    );
    const targetMapel = mySchedules.find(
      (s) => String(s.mapelId) === String(data.mapelId),
    );

    const payload = {
      title: data.title,
      description: data.description,
      kelasId: data.kelasId,
      kelasName:
        matchedSch?.kelasName || targetClass?.kelasName || "Kelas Target",
      mapelId: data.mapelId,
      mapelName: matchedSch?.mapelName || targetMapel?.mapelName || "Mapel",
      dueDate: data.dueDate,
      fileUrl: data.fileUrl || undefined,
      status: data.status,
      guruId: user.id,
      guruName: user.name,
    };

    try {
      if (isEditMode && id) {
        await learningService.updateTugas(id, payload);
        setToastMessage("Tugas berhasil diperbarui!");
      } else {
        await learningService.createTugas(payload);
        setToastMessage("Tugas baru berhasil ditambahkan!");
      }
      setTimeout(() => navigate("/guru/assignments"), 1000);
    } catch (error: unknown) {
      setSubmitError(
        error instanceof Error ? error.message : "Gagal menyimpan tugas.",
      );
    }
  };

  const availableClasses = Array.from(
    new Map(mySchedules.map((s) => [s.kelasId, s.kelasName])).entries(),
  ).map(([id, name]) => ({ id, name }));

  const availableMapels = mySchedules
    .filter((s) => String(s.kelasId) === String(selectedClassId))
    .reduce((acc: Array<{ id: string; name: string }>, curr) => {
      if (!acc.some((x) => x.id === curr.mapelId)) {
        acc.push({ id: curr.mapelId, name: curr.mapelName });
      }
      return acc;
    }, []);

  if (loading) {
    return <LoadingState message="Memuat data tugas..." />;
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

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/guru/assignments")}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            {isEditMode ? "Ubah Tugas" : "Tambah Tugas"}
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            {isEditMode
              ? "Perbarui isi detail instruksi pengumpulan tugas kelas."
              : "Masukkan isi deskripsi tugas mandiri baru beserta tanggal tenggat waktunya."}
          </p>
        </div>
      </div>

      <div className="max-w-xl">
        <Card variant="surface" className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {submitError && (
              <div className="flex items-center space-x-2 rounded-[6px] bg-status-danger/[0.06] p-3.5 text-[13px] text-text-danger border border-status-danger/20">
                <AlertCircle className="h-4 w-4 shrink-0 text-status-danger" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                  Kelas Target
                </label>
                <Select error={!!errors.kelasId} {...register("kelasId")}>
                  {availableClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                  Mata Pelajaran
                </label>
                <Select error={!!errors.mapelId} {...register("mapelId")}>
                  {availableMapels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                Judul Tugas
              </label>
              <Input
                placeholder="cth. Tugas 1 - Latihan Fungsi Aljabar"
                error={!!errors.title}
                {...register("title")}
              />
              {errors.title && (
                <p className="mt-1 text-[10px] text-status-danger font-medium">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                Deskripsi & Petunjuk Tugas
              </label>
              <textarea
                placeholder="Tuliskan petunjuk pengerjaan tugas secara lengkap dan jelas..."
                {...register("description")}
                className={`block w-full rounded-[6px] border px-3.5 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-1 min-h-[120px] ${
                  errors.description
                    ? "border-status-danger bg-status-danger/[0.04] focus-visible:border-status-danger focus-visible:ring-status-danger"
                    : "border-bg-border bg-bg-surface text-bg-ink focus-visible:border-primary focus-visible:ring-primary"
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-[10px] text-status-danger font-medium">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                  Batas Waktu (Due Date)
                </label>
                <Input
                  type="date"
                  error={!!errors.dueDate}
                  {...register("dueDate")}
                />
                {errors.dueDate && (
                  <p className="mt-1 text-[10px] text-status-danger font-medium">
                    {errors.dueDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                  Status Publikasi
                </label>
                <Select error={!!errors.status} {...register("status")}>
                  <option value="Dipublikasikan">Publikasikan Sekarang</option>
                  <option value="Draft">Draft (Simpan saja)</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                Link Template / Dokumen Pendukung (Opsional)
              </label>
              <Input
                placeholder="cth. https://drive.google.com/..."
                error={!!errors.fileUrl}
                {...register("fileUrl")}
              />
              {errors.fileUrl && (
                <p className="mt-1 text-[10px] text-status-danger font-medium">
                  {errors.fileUrl.message}
                </p>
              )}
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-bg-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/guru/assignments")}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
export default AssignmentFormPage;

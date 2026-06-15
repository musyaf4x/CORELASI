import React, { useEffect, useRef, useState } from "react";
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
import {
  ArrowLeft,
  AlertCircle,
  FileText,
  UploadCloud,
  X,
  CheckCircle,
} from "lucide-react";

const materialSchema = zod.object({
  title: zod.string().min(1, "Judul materi wajib diisi."),
  description: zod.string().min(1, "Deskripsi materi wajib diisi."),
  kelasId: zod.string().min(1, "Pilih kelas target."),
  mapelId: zod.string().min(1, "Pilih mata pelajaran."),
  sourceType: zod.enum(["link", "file"]),
  fileUrl: zod.string().url("Format URL tidak valid.").or(zod.literal("")),
  status: zod.enum(["Draft", "Dipublikasikan"]),
});

type MaterialFormFields = zod.infer<typeof materialSchema>;

export const MaterialFormPage: React.FC = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(isEditMode);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mySchedules, setMySchedules] = useState<JadwalPembelajaran[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormFields>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: "",
      description: "",
      kelasId: "",
      mapelId: "",
      sourceType: "file",
      fileUrl: "",
      status: "Dipublikasikan",
    },
  });

  const selectedClassId = useWatch({ control, name: "kelasId" });
  const selectedSourceType =
    useWatch({ control, name: "sourceType" }) || "file";
  const selectedFileUrl = useWatch({ control, name: "fileUrl" });

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError("Ukuran berkas maksimal 10MB.");
      event.target.value = "";
      return;
    }

    setSubmitError(null);
    setIsUploading(true);
    try {
      const fileUrl = await learningService.uploadFile(file);
      setValue("fileUrl", fileUrl, { shouldValidate: true });
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Gagal mengunggah berkas.",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  // Load teacher's schedules to determine valid target classes & mapels
  useEffect(() => {
    const loadTeacherContext = async () => {
      if (!user) return;
      try {
        const sch = await scheduleService.getJadwalPembelajaran();
        const filtered = sch.filter(
          (s) => String(s.guruId) === String(user.id),
        );
        setMySchedules(filtered);

        // If not in edit mode, set defaults
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

  // Dynamically update mapel selection if class changes, based on teaching schedule
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

  // Load existing material details for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadMaterial = async () => {
        try {
          const mat = await learningService.getMateriById(id);
          if (mat) {
            setValue("title", mat.title);
            setValue("description", mat.description);
            setValue("kelasId", mat.kelasId);
            setValue("mapelId", mat.mapelId);
            setValue(
              "sourceType",
              mat.sourceType || (mat.fileUrl ? "file" : "link"),
            );
            setValue("fileUrl", mat.fileUrl || "");
            setValue("status", mat.status);
          } else {
            setSubmitError("Materi tidak ditemukan.");
          }
        } catch {
          setSubmitError("Gagal memuat materi.");
        } finally {
          setLoading(false);
        }
      };
      loadMaterial();
    }
  }, [id, isEditMode, setValue]);

  const onSubmit = async (data: MaterialFormFields) => {
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
      sourceType: data.sourceType,
      fileUrl: data.fileUrl || undefined,
      status: data.status,
      guruId: user.id,
      guruName: user.name,
    };

    try {
      if (isEditMode && id) {
        await learningService.updateMateri(id, payload);
        setToastMessage("Materi berhasil diperbarui!");
      } else {
        await learningService.createMateri(payload);
        setToastMessage("Materi baru berhasil ditambahkan!");
      }
      setTimeout(() => navigate(-1), 1000);
    } catch (error: unknown) {
      setSubmitError(
        error instanceof Error ? error.message : "Gagal menyimpan materi.",
      );
    }
  };

  // Get unique classes from teacher schedule
  const availableClasses = Array.from(
    new Map(mySchedules.map((s) => [s.kelasId, s.kelasName])).entries(),
  ).map(([id, name]) => ({ id, name }));

  // Get subjects taught in the selected class
  const availableMapels = mySchedules
    .filter((s) => String(s.kelasId) === String(selectedClassId))
    .reduce((acc: Array<{ id: string; name: string }>, curr) => {
      if (!acc.some((x) => x.id === curr.mapelId)) {
        acc.push({ id: curr.mapelId, name: curr.mapelName });
      }
      return acc;
    }, []);

  if (loading) {
    return <LoadingState message="Memuat data materi..." />;
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
          onClick={() => navigate(-1)}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            {isEditMode ? "Ubah Materi" : "Tambah Materi"}
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            {isEditMode
              ? "Perbarui detail isi modul materi ajar kelas."
              : "Masukkan isi modul materi KBM baru untuk dibagikan ke siswa."}
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
                Judul Materi
              </label>
              <Input
                placeholder="cth. Pertemuan 1 - Aljabar Linier"
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
                Deskripsi
              </label>
              <textarea
                placeholder="Tuliskan petunjuk pembelajaran atau rangkuman materi..."
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

            <div>
              <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                Tipe Sumber Materi
              </label>
              <Select error={!!errors.sourceType} {...register("sourceType")}>
                <option value="file">Lampiran Berkas (PDF/Dokumen)</option>
                <option value="link">Link Eksternal (URL Link)</option>
              </Select>
            </div>

            {selectedSourceType === "link" ? (
              <div>
                <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                  Link Eksternal (Opsional)
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
            ) : (
              <div>
                <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                  Lampiran Berkas (PDF/Dokumen)
                </label>

                {selectedFileUrl ? (
                  <div className="flex items-center justify-between border border-bg-border bg-bg-surface rounded-[6px] p-3.5 shadow-[0_1px_3px_rgba(20,33,26,0.03)] transition-colors hover:border-bg-border-muted">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-primary/[0.08] text-primary rounded-[4px] shrink-0">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-bg-ink truncate">
                          {selectedFileUrl.split("/").pop()}
                        </p>
                        <span className="text-[11px] text-bg-ink-muted flex items-center gap-1 font-medium mt-0.5">
                          <CheckCircle className="h-3 w-3 text-status-success" />
                          Berkas berhasil dilampirkan
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-bg-danger-tint text-bg-ink-muted hover:text-text-danger rounded-[4px]"
                      onClick={() => setValue("fileUrl", "")}
                      aria-label="Hapus Lampiran"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,image/jpeg,image/png"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border border-dashed border-bg-border hover:border-primary/50 transition-colors bg-bg-sage-slate/5 hover:bg-primary/[0.01] rounded-[6px] p-6 flex flex-col items-center justify-center text-center cursor-pointer gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-wait disabled:opacity-60"
                    >
                      <UploadCloud className="h-6 w-6 text-bg-ink-muted transition-colors" />
                      <div>
                        <p className="text-[13px] font-bold text-bg-ink font-sans">
                          {isUploading
                            ? "Mengunggah berkas..."
                            : "Pilih berkas dokumen atau PDF"}
                        </p>
                        <span className="text-[11.5px] text-bg-ink-muted font-medium block mt-0.5">
                          PDF, DOC, DOCX, JPG, atau PNG. Maksimal 10MB.
                        </span>
                      </div>
                    </button>
                  </>
                )}
                {/* Hidden input to bind react-hook-form value */}
                <input type="hidden" {...register("fileUrl")} />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                Status Publikasi
              </label>
              <Select error={!!errors.status} {...register("status")}>
                <option value="Dipublikasikan">Publikasikan Sekarang</option>
                <option value="Draft">Draft (Simpan saja)</option>
              </Select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-bg-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
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
export default MaterialFormPage;

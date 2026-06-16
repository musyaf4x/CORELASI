import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { userService } from "@/services/userService";
import { Card, Input, Select, Button, Toast } from "@/components/shared";
import { ArrowLeft, AlertCircle } from "lucide-react";

const createUserSchema = (isEditMode: boolean) =>
  zod
    .object({
      name: zod.string().min(1, "Nama lengkap wajib diisi."),
      email: zod
        .string()
        .email("Format email tidak valid.")
        .min(1, "Email wajib diisi."),
      password: zod.string().optional(),
      role: zod.enum(["admin", "guru", "siswa"]),
      status: zod.enum(["aktif", "nonaktif"]),
      nipOrNis: zod.string().optional(),
      gender: zod.enum(["L", "P"]).optional(),
      phoneNumber: zod.string().optional(),
      angkatan: zod.preprocess((value: unknown) => {
        if (value === "" || value === undefined || value === null)
          return undefined;
        return Number(value);
      }, zod.number().int().positive("Angkatan harus berupa angka positif.").optional()),
    })
    .superRefine((data, ctx) => {
      if (!isEditMode && (!data.password || data.password.length < 8)) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: "Kata sandi minimal 8 karakter.",
          path: ["password"],
        });
      }
      if (
        data.role === "guru" &&
        (!data.nipOrNis || data.nipOrNis.trim() === "")
      ) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: "NIP wajib diisi untuk Guru.",
          path: ["nipOrNis"],
        });
      }
      if (
        data.role === "siswa" &&
        (!data.nipOrNis || data.nipOrNis.trim() === "")
      ) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: "NIS wajib diisi untuk Siswa.",
          path: ["nipOrNis"],
        });
      }
      if (data.role === "siswa" && data.angkatan === undefined) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: "Angkatan wajib diisi untuk Siswa.",
          path: ["angkatan"],
        });
      }
    });

type UserFormSchema = ReturnType<typeof createUserSchema>;
type UserFormInput = zod.input<UserFormSchema>;
type UserFormFields = zod.output<UserFormSchema>;

export const UserFormPage: React.FC = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEditMode);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const userSchema = useMemo(() => createUserSchema(isEditMode), [isEditMode]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserFormInput, unknown, UserFormFields>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "siswa",
      status: "aktif",
      nipOrNis: "",
      gender: "L",
      phoneNumber: "",
      angkatan: undefined,
    },
  });

  const selectedRole = useWatch({ control, name: "role" });

  useEffect(() => {
    if (selectedRole === "admin") {
      const currentVal = getValues("nipOrNis");
      if (!isEditMode && (!currentVal || !currentVal.startsWith("ADM-"))) {
        setValue("nipOrNis", `ADM-${Date.now().toString().slice(-6)}`);
      } else if (isEditMode && !currentVal) {
        setValue("nipOrNis", `ADM-${Date.now().toString().slice(-6)}`);
      }
    } else {
      const currentVal = getValues("nipOrNis");
      if (currentVal && currentVal.startsWith("ADM-") && !isEditMode) {
        setValue("nipOrNis", "");
      }
    }
  }, [selectedRole, setValue, getValues, isEditMode]);

  useEffect(() => {
    if (isEditMode && id) {
      const loadUser = async () => {
        const user = await userService.getById(id);
        if (user) {
          setValue("name", user.name);
          setValue("email", user.email);
          setValue("role", user.role);
          setValue("status", user.status);
          setValue("nipOrNis", user.nipOrNis || "");
          setValue("gender", user.gender || "L");
          setValue("phoneNumber", user.phoneNumber || "");
          setValue("angkatan", user.angkatan);
        } else {
          setSubmitError("User tidak ditemukan.");
        }
        setLoading(false);
      };
      loadUser();
    }
  }, [id, isEditMode, setValue]);

  const onSubmit = async (data: UserFormFields) => {
    setSubmitError(null);
    try {
      if (isEditMode && id) {
        await userService.update(id, data);
        setToastMessage("Data pengguna berhasil diperbarui!");
      } else {
        await userService.create(data);
        setToastMessage("Data pengguna baru berhasil dibuat!");
      }
      setTimeout(() => {
        navigate("/admin/users");
      }, 1000);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Gagal menyimpan data.",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <span className="text-[13px] text-bg-ink-muted">
          Memuat data pengguna...
        </span>
      </div>
    );
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
          onClick={() => navigate("/admin/users")}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            {isEditMode ? "Ubah Pengguna" : "Tambah Pengguna"}
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            {isEditMode
              ? "Ubah data detail informasi profil pengguna."
              : "Masukkan informasi akun profil sekolah baru."}
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

            {Object.keys(errors).length > 0 && (
              <div className="flex items-start space-x-2 rounded-[6px] bg-status-danger/[0.06] p-3.5 text-[13px] text-text-danger border border-status-danger/20">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-status-danger" />
                <div>
                  <p className="font-semibold mb-1">
                    Terdapat kesalahan pengisian formulir:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[12px]">
                    {Object.entries(errors).map(([key, err]) => (
                      <li key={key}>{err?.message && String(err.message)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="user-name"
                className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
              >
                Nama Lengkap <span className="text-status-danger">*</span>
              </label>
              <Input
                id="user-name"
                placeholder="cth. Budi Santoso"
                error={!!errors.name}
                {...register("name")}
              />
              {errors.name && (
                <p className="mt-1 text-[10px] text-status-danger font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="user-email"
                className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
              >
                Email <span className="text-status-danger">*</span>
              </label>
              <Input
                id="user-email"
                placeholder="cth. budi@sekolah.sch.id"
                error={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-[10px] text-status-danger font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {!isEditMode && (
              <div>
                <label
                  htmlFor="user-password"
                  className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
                >
                  Kata Sandi Awal <span className="text-status-danger">*</span>
                </label>
                <Input
                  id="user-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  error={!!errors.password}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="mt-1 text-[10px] text-status-danger font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="user-role"
                  className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
                >
                  Peran
                </label>
                <Select
                  id="user-role"
                  error={!!errors.role}
                  {...register("role")}
                >
                  <option value="admin">Admin</option>
                  <option value="guru">Guru</option>
                  <option value="siswa">Siswa</option>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="user-status"
                  className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
                >
                  Status
                </label>
                <Select
                  id="user-status"
                  error={!!errors.status}
                  {...register("status")}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </Select>
              </div>
            </div>

            <div>
              <label
                htmlFor="user-nip-nis"
                className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
              >
                {selectedRole === "admin"
                  ? "ID Pengguna"
                  : selectedRole === "guru"
                    ? "NIP"
                    : "NIS"}
                {selectedRole !== "admin" && (
                  <span className="text-status-danger"> *</span>
                )}
              </label>
              <Input
                id="user-nip-nis"
                placeholder={
                  selectedRole === "admin"
                    ? ""
                    : selectedRole === "guru"
                      ? "cth. 198203..."
                      : "cth. 2526100..."
                }
                error={!!errors.nipOrNis}
                disabled={selectedRole === "admin"}
                {...register("nipOrNis")}
              />
              {errors.nipOrNis && (
                <p className="mt-1 text-[10px] text-status-danger font-medium">
                  {errors.nipOrNis.message}
                </p>
              )}
            </div>

            {selectedRole === "siswa" && (
              <div>
                <label
                  htmlFor="user-angkatan"
                  className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
                >
                  Angkatan <span className="text-status-danger">*</span>
                </label>
                <Input
                  id="user-angkatan"
                  type="number"
                  placeholder="cth. 1"
                  error={!!errors.angkatan}
                  {...register("angkatan")}
                />
                {errors.angkatan && (
                  <p className="mt-1 text-[10px] text-status-danger font-medium">
                    {errors.angkatan.message && String(errors.angkatan.message)}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="user-gender"
                  className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
                >
                  Jenis Kelamin
                </label>
                <Select
                  id="user-gender"
                  error={!!errors.gender}
                  {...register("gender")}
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="user-phone"
                  className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
                >
                  No. Telepon (Opsional)
                </label>
                <Input
                  id="user-phone"
                  placeholder="cth. 0812..."
                  error={!!errors.phoneNumber}
                  {...register("phoneNumber")}
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-bg-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/admin/users")}
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
export default UserFormPage;

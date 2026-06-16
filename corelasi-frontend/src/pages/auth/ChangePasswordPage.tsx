import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { Card, Input, Button, Toast } from "@/components/shared";
import { AlertCircle } from "lucide-react";

const passwordSchema = zod
  .object({
    currentPassword: zod.string().min(1, "Kata sandi saat ini wajib diisi."),
    newPassword: zod.string().min(8, "Kata sandi baru minimal 8 karakter."),
    confirmPassword: zod
      .string()
      .min(8, "Konfirmasi kata sandi minimal 8 karakter."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

type PasswordFields = zod.infer<typeof passwordSchema>;

export const ChangePasswordPage: React.FC = () => {
  const { user } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFields>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFields) => {
    setSubmitError(null);
    if (!user) return;
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      setToastMessage("Kata sandi berhasil diperbarui!");
      reset();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Gagal mengubah kata sandi.",
      );
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

      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink">
          Ubah Kata Sandi
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Ganti kata sandi akun Anda secara berkala untuk menjaga keamanan.
        </p>
      </div>

      <div className="max-w-md">
        <Card variant="surface" className="space-y-6">
          <h2 className="text-[18px] font-bold text-bg-ink font-sans">
            Formulir Ubah Sandi
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {submitError && (
              <div className="flex items-center space-x-2 rounded-[6px] bg-status-danger/[0.06] p-3.5 text-[13px] text-status-danger border border-status-danger/20">
                <AlertCircle className="h-4 w-4 shrink-0 text-status-danger" />
                <span>{submitError}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="currentPassword"
                className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans cursor-pointer"
              >
                Kata Sandi Saat Ini
              </label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                error={!!errors.currentPassword}
                {...register("currentPassword")}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-[10px] text-status-danger font-medium">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans cursor-pointer"
              >
                Kata Sandi Baru
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                error={!!errors.newPassword}
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="mt-1 text-[10px] text-status-danger font-medium">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans cursor-pointer"
              >
                Konfirmasi Kata Sandi Baru
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                error={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-[10px] text-status-danger font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Memproses..." : "Perbarui Kata Sandi"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
export default ChangePasswordPage;

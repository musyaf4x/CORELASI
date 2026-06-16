import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, BookOpen, Users, Award, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { Input, Button } from "@/components/shared";
import { userService } from "@/services/userService";
import { isDemoLoginEnabled } from "@/config/demoLogin";

const loginSchema = zod.object({
  email: zod.string().email("Format email tidak valid.").min(1, "Email wajib diisi."),
  password: zod.string().min(6, "Kata sandi minimal 6 karakter."),
});

type LoginFields = zod.infer<typeof loginSchema>;

const demoLoginEnabled = isDemoLoginEnabled(
  import.meta.env.VITE_ENABLE_DEMO_LOGIN,
);

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const LoginPage: React.FC = () => {
  const { login, showcaseLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [demoSubmittingEmail, setDemoSubmittingEmail] = useState<string | null>(
    null,
  );

  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const from = location.state?.from?.pathname || "/";

  const onSubmit = async (data: LoginFields) => {
    setSubmitError(null);
    try {
      const user = await login(data.email, data.password);
      const isCompatiblePath = from.startsWith(`/${user.role}/`);
      if (isCompatiblePath) {
        navigate(from, { replace: true });
      } else {
        navigate(`/${user.role}/dashboard`, { replace: true });
      }
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error, "Gagal masuk. Coba lagi."));
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Email wajib diisi.");
      return;
    }
    setForgotSubmitting(true);
    setForgotError(null);
    try {
      await userService.createPasswordResetRequest(forgotEmail);
      setForgotSuccess(true);
    } catch (error: unknown) {
      setForgotError(getErrorMessage(error, "Gagal mengirim permintaan."));
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleDemoClick = async (email: string) => {
    setSubmitError(null);
    setDemoSubmittingEmail(email);
    try {
      const user = await showcaseLogin(email);
      const isCompatiblePath = from.startsWith(`/${user.role}/`);
      navigate(
        isCompatiblePath ? from : `/${user.role}/dashboard`,
        { replace: true },
      );
    } catch (error: unknown) {
      setSubmitError(
        getErrorMessage(error, "Gagal masuk ke akun showcase."),
      );
    } finally {
      setDemoSubmittingEmail(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-paper">
      {/* ── Brand Panel (left 40%) ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[40%] flex-col justify-between bg-primary border-r border-primary-hover px-12 py-16 relative overflow-hidden">
        {/* Geometric background texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          {/* Large offset circle top-right */}
          <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full border border-white/10" />
          <div className="absolute -top-20 -right-20 w-[280px] h-[280px] rounded-full border border-white/5" />
          {/* Bottom-left grid lines */}
          <div className="absolute bottom-0 left-0 w-64 h-64"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px),
                linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
              `,
              backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px",
            }}
          />
        </div>

        {/* Logo / Wordmark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <img
              src="/corelasi-02.png"
              alt=""
              width="40"
              height="40"
              className="h-10 w-10 brightness-0 invert"
            />
            <span className="text-white font-bold text-[18px] tracking-tight">CORELASI</span>
          </div>

          {/* Tagline */}
          <h2 className="text-white text-[28px] font-bold leading-[1.15] tracking-[-0.5px] max-w-[340px]">
            Sistem Administrasi Akademik SMAT Baiturrahman
          </h2>
          <p className="mt-4 text-white/75 text-[14px] leading-relaxed max-w-[300px]">
            Satu platform untuk pengelolaan kelas, absensi, nilai, dan jurnal pembelajaran.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-white/10 border border-white/15 shrink-0 mt-0.5">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white text-[13px] font-semibold leading-snug">Jurnal &amp; Agenda Mengajar</p>
              <p className="text-white/70 text-[10px] leading-snug mt-0.5">Catat setiap sesi kelas dan kehadiran siswa.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-white/10 border border-white/15 shrink-0 mt-0.5">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white text-[13px] font-semibold leading-snug">Manajemen Kelas &amp; Wali Kelas</p>
              <p className="text-white/70 text-[10px] leading-snug mt-0.5">Pantau perkembangan siswa per kelas perwalian.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-white/10 border border-white/15 shrink-0 mt-0.5">
              <Award className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-white text-[13px] font-semibold leading-snug">Penilaian &amp; Laporan Akademik</p>
              <p className="text-white/70 text-[10px] leading-snug mt-0.5">Input nilai dan pantau raport secara real-time.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Panel (right 60%) ─────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-bg-paper px-6 py-12 lg:px-16 relative">
        {/* Subtle background grid paper pattern (major/minor grid lines) */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.18] lg:opacity-[0.14]" aria-hidden="true"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-bg-border) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-bg-border) 1px, transparent 1px),
              linear-gradient(var(--color-bg-border-muted) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-bg-border-muted) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px",
          }}
        />

        {/* Mobile logo — only visible below lg */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <img
            src="/corelasi-02.png"
            alt=""
            width="32"
            height="32"
            className="h-8 w-8"
          />
          <span className="text-bg-ink font-bold text-[18px] tracking-tight">CORELASI</span>
        </div>

        {/* Tactile white container card for the form */}
        <div className="w-full max-w-[400px] bg-bg-surface border border-bg-border rounded-[6px] p-8 shadow-[0_1px_4px_rgba(20,33,26,0.06)] relative z-10">
          {isForgotMode ? (
            forgotSuccess ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-[24px] font-bold tracking-[-0.5px] text-bg-ink leading-tight font-sans">
                    Permintaan Dikirim
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-bg-ink-secondary">
                    Permintaan atur ulang kata sandi Anda telah berhasil dikirim ke Admin Sekolah.
                  </p>
                </div>

                <div className="bg-bg-safe-tint border border-border-safe p-4 rounded-[6px] text-[13px] text-text-safe">
                  Silakan hubungi Admin Sekolah Anda untuk meminta dan mendapatkan kata sandi baru Anda.
                </div>

                <Button
                  onClick={() => {
                    setIsForgotMode(false);
                    setForgotSuccess(false);
                    setForgotEmail("");
                    setForgotError(null);
                  }}
                  className="w-full h-10 text-[13px]"
                >
                  Kembali ke Halaman Masuk
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h1 className="text-[24px] font-bold tracking-[-0.5px] text-bg-ink leading-tight font-sans">
                    Lupa Kata Sandi?
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-bg-ink-secondary">
                    Masukkan email Anda. Admin sekolah akan membuatkan kata sandi baru untuk Anda.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  {forgotError && (
                    <div
                      className="flex items-center space-x-2 rounded-[6px] bg-status-danger/[0.06] p-3.5 text-[13px] text-status-danger border border-status-danger/20"
                      role="alert"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 text-status-danger" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="forgotEmail" className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans cursor-pointer">
                      Email Terdaftar
                    </label>
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="nama@corelasi.test"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={forgotSubmitting}
                      className="w-full h-10 text-[13px]"
                    >
                      {forgotSubmitting ? "Mengirim..." : "Kirim Permintaan"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsForgotMode(false);
                        setForgotError(null);
                      }}
                      className="w-full h-10 text-[13px] border border-bg-border hover:bg-bg-border/20 text-bg-ink-secondary"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </div>
            )
          ) : (
            <>
              {/* Heading */}
              <div className="mb-6">
                <h1 className="text-[28px] font-bold tracking-[-0.5px] text-bg-ink leading-tight font-sans">
                  Masuk ke sistem
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-bg-ink-secondary">
                  Gunakan akun sekolah Anda untuk melanjutkan.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {submitError && (
                  <div
                    className="flex items-center space-x-2 rounded-[6px] bg-status-danger/[0.06] p-3.5 text-[13px] text-status-danger border border-status-danger/20"
                    role="alert"
                    aria-live="assertive"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-status-danger" aria-hidden="true" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans cursor-pointer">
                    Email Pengguna
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@corelasi.test"
                    autoFocus
                    error={!!errors.email}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="mt-1 text-[10px] text-status-danger font-medium" role="alert">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-[13px] font-semibold text-bg-ink-secondary font-sans cursor-pointer">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(true);
                        setForgotSuccess(false);
                        setForgotError(null);
                      }}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer focus-visible:outline-none"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Kata sandi Anda"
                      error={!!errors.password}
                      {...register("password")}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-bg-ink-muted hover:text-bg-ink focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none focus-visible:text-primary rounded-[4px] cursor-pointer"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-[10px] text-status-danger font-medium" role="alert">{errors.password.message}</p>
                  )}
                </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          {/* Demo Accounts — collapsed by default */}
          {demoLoginEnabled && (
          <div className="mt-6 border-t border-bg-border pt-4">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-bg-ink-secondary hover:text-bg-ink transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-[4px] cursor-pointer"
              aria-expanded={showDemo}
              aria-controls="demo-accounts"
            >
              {showDemo ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
              Butuh akun simulasi (demo)?
            </button>

            {showDemo && (
              <div id="demo-accounts" className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => void handleDemoClick("admin@corelasi.test")}
                  disabled={demoSubmittingEmail !== null}
                  className="w-full flex items-center justify-between border border-bg-border rounded-[6px] px-3.5 py-2.5 bg-bg-surface hover:bg-bg-sage-slate hover:border-bg-border-muted transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-bg-excellent-tint border border-border-excellent group-hover:bg-white transition-colors shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5 text-status-excellent" />
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-bg-ink leading-none">Admin Sekolah</div>
                      <div className="text-[10px] text-bg-ink-muted mt-1 font-mono">admin@corelasi.test</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-bg-excellent-tint text-text-excellent border border-border-excellent shrink-0">
                    {demoSubmittingEmail === "admin@corelasi.test" ? "Memuat..." : "Showcase Admin"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleDemoClick("guru@corelasi.test")}
                  disabled={demoSubmittingEmail !== null}
                  className="w-full flex items-center justify-between border border-bg-border rounded-[6px] px-3.5 py-2.5 bg-bg-surface hover:bg-bg-sage-slate hover:border-bg-border-muted transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-bg-safe-tint border border-border-safe group-hover:bg-white transition-colors shrink-0">
                      <BookOpen className="h-3.5 w-3.5 text-status-success" />
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-bg-ink leading-none">Guru Pengajar</div>
                      <div className="text-[10px] text-bg-ink-muted mt-1 font-mono">guru@corelasi.test</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-bg-safe-tint text-text-safe border border-border-safe shrink-0">
                    Akademik &amp; Kelas
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleDemoClick("siswa@corelasi.test")}
                  disabled={demoSubmittingEmail !== null}
                  className="w-full flex items-center justify-between border border-bg-border rounded-[6px] px-3.5 py-2.5 bg-bg-surface hover:bg-bg-sage-slate hover:border-bg-border-muted transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-bg-pending-tint border border-border-pending group-hover:bg-white transition-colors shrink-0">
                      <Users className="h-3.5 w-3.5 text-status-pending" />
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-bg-ink leading-none">Siswa / Murid</div>
                      <div className="text-[10px] text-bg-ink-muted mt-1 font-mono">siswa@corelasi.test</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-bg-pending-tint text-text-pending border border-border-pending shrink-0">
                    Jadwal &amp; Nilai
                  </span>
                </button>
                <p className="px-1 text-[10px] leading-relaxed text-bg-ink-muted">
                  Masuk satu klik. Penghapusan data dan perubahan kata sandi
                  dinonaktifkan untuk akun showcase.
                </p>
              </div>
            )}
          </div>
          )}
            </>
          )}
        </div>

        {/* Institutional Footer */}
        <div className="mt-8 text-center relative z-10">
          <p className="text-[10px] text-bg-ink-muted font-sans tracking-wide">
            SISTEM ADMINISTRASI AKADEMIK TERPADU
          </p>
          <p className="text-[10px] text-bg-ink-muted mt-1">
            © {new Date().getFullYear()} CORELASI. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
};

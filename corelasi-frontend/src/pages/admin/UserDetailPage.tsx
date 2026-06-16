import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { userService } from "@/services/userService";
import { academicService } from "@/services/academicService";
import type { UserDetail } from "@/types/user";
import {
  Card,
  Button,
  StatusBadge,
  Toast,
  ConfirmDialog,
} from "@/components/shared";
import { ArrowLeft, Edit, User, Shield, Key, Copy } from "lucide-react";

export const UserDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [kelasName, setKelasName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const loadUserAndKelas = async () => {
        setLoading(true);
        const data = await userService.getById(id);
        setUser(data);
        if (data && data.role === "siswa" && data.kelasId) {
          const classes = await academicService.getKelas();
          const k = classes.find((c) => String(c.id) === String(data.kelasId));
          setKelasName(k ? k.name : "Belum terdaftar di kelas");
        } else {
          setKelasName(null);
        }
        setLoading(false);
      };
      loadUserAndKelas();
    }
  }, [id]);

  const handleResetPassword = async () => {
    if (!user) return;
    setIsResetConfirmOpen(false);

    // Generate a temporary password
    const tempPassword = "pwd-" + Math.floor(100000 + Math.random() * 900000);

    try {
      await userService.update(user.id, { password: tempPassword });
      setResetPasswordVal(tempPassword);
      setToastMessage("Kata sandi berhasil diatur ulang.");
      setUser((prev) => (prev ? { ...prev, password: tempPassword } : null));
    } catch {
      setToastMessage("Gagal mengatur ulang kata sandi.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <span className="text-[13px] text-bg-ink-muted">
          Memuat data detail pengguna...
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold text-bg-ink font-sans">
          User tidak ditemukan
        </h2>
        <Button onClick={() => navigate("/admin/users")} className="mt-4">
          Kembali ke Daftar
        </Button>
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

      {isResetConfirmOpen && (
        <ConfirmDialog
          isOpen={true}
          title="Atur Ulang Kata Sandi"
          message={`Apakah Anda yakin ingin mengatur ulang kata sandi untuk ${user.name}?`}
          confirmLabel="Atur Ulang"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={handleResetPassword}
          onCancel={() => setIsResetConfirmOpen(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              Detail Pengguna
            </h1>
            <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
              Informasi lengkap akun profil sekolah.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {user.role !== "admin" && (
            <Button
              variant="ghost"
              onClick={() => setIsResetConfirmOpen(true)}
              className="text-[13px] border border-primary/20 hover:bg-primary/5 text-primary gap-2 h-9 px-4 rounded-[6px]"
            >
              <Key className="h-4 w-4" />
              Atur Ulang Sandi
            </Button>
          )}
          <Link
            to={`/admin/users/${user.id}/edit`}
            className="inline-flex items-center justify-center font-semibold rounded-[6px] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary bg-primary text-white hover:bg-primary-hover px-4 py-2 text-[13px] gap-2"
          >
            <Edit className="h-4 w-4" />
            Ubah Data
          </Link>
        </div>
      </div>

      {resetPasswordVal && (
        <div className="bg-bg-safe-tint border border-border-safe p-4 rounded-[6px] text-[13px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-text-safe">
              Kata Sandi Berhasil Diatur Ulang!
            </p>
            <p className="text-bg-ink-secondary mt-1">
              Gunakan kata sandi sementara berikut untuk masuk:{" "}
              <strong className="font-mono text-[14px] bg-white px-2 py-0.5 border border-border-safe rounded-[4px] ml-1">
                {resetPasswordVal}
              </strong>
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(resetPasswordVal);
              setToastMessage("Kata sandi disalin ke papan klip!");
            }}
            className="text-[12px] h-8 text-primary border border-primary/20 hover:bg-primary/5 px-3 rounded-[6px] flex items-center gap-1.5 self-end sm:self-auto"
          >
            <Copy className="h-3.5 w-3.5" />
            Salin Sandi
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="surface" className="lg:col-span-2 space-y-6">
          <h2 className="text-[18px] font-bold text-bg-ink">
            Profil Identitas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
            <div>
              <p className="font-semibold text-bg-ink-secondary mb-1">
                Nama Lengkap
              </p>
              <p className="text-bg-ink font-medium text-[14px]">{user.name}</p>
            </div>
            <div>
              <p className="font-semibold text-bg-ink-secondary mb-1">
                NIP / NIS
              </p>
              <p className="text-bg-ink font-medium text-[14px]">
                {user.nipOrNis || "-"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-bg-ink-secondary mb-1">Email</p>
              <p className="text-bg-ink font-medium text-[14px]">
                {user.email}
              </p>
            </div>
            <div>
              <p className="font-semibold text-bg-ink-secondary mb-1">
                No. Telepon
              </p>
              <p className="text-bg-ink font-medium text-[14px]">
                {user.phoneNumber || "-"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-bg-ink-secondary mb-1">
                Jenis Kelamin
              </p>
              <p className="text-bg-ink font-medium text-[14px]">
                {user.gender === "L"
                  ? "Laki-laki"
                  : user.gender === "P"
                    ? "Perempuan"
                    : "-"}
              </p>
            </div>
            {user.role === "siswa" && (
              <>
                <div>
                  <p className="font-semibold text-bg-ink-secondary mb-1">
                    Kelas Aktif
                  </p>
                  <p className="text-bg-ink font-medium text-[14px]">
                    {kelasName || "-"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-bg-ink-secondary mb-1">
                    Angkatan
                  </p>
                  <p className="text-bg-ink font-medium text-[14px]">
                    {user.angkatan ? `Angkatan ${user.angkatan}` : "-"}
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card variant="subtle" className="lg:col-span-1 space-y-5">
          <h3 className="text-[14px] font-bold text-bg-ink">Status Keamanan</h3>

          <div className="space-y-4 text-[13px]">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-bg-ink-secondary">
                  Peran Utama
                </p>
                <p className="capitalize text-bg-ink font-medium mt-0.5">
                  {user.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-bg-ink-secondary">
                  Status Keaktifan
                </p>
                <div className="mt-1">
                  <StatusBadge
                    label={user.status === "aktif" ? "Aktif" : "Nonaktif"}
                    state={user.status === "aktif" ? "safe" : "disabled"}
                    size="xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default UserDetailPage;

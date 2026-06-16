import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, Button, StatusBadge } from "@/components/shared";
import { Key } from "lucide-react";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name] = useState(user?.name || "");
  const [email] = useState(user?.email || "");

  if (!user) return null;

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator Utama";
      case "guru":
        return "Tenaga Pendidik";
      case "siswa":
        return "Siswa Akademik";
      default:
        return "Pengguna Sistem";
    }
  };

  const getAccessLevel = (role: string) => {
    switch (role) {
      case "admin":
        return "Kontrol Penuh Sistem";
      case "guru":
        return "Akses Kelas & Pengajaran";
      case "siswa":
        return "Akses Belajar Mandiri";
      default:
        return "Akses Terbatas";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
          Profil Saya
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Informasi personal dan hak akses akun Anda pada sistem akademik.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Detail Panel */}
        <Card
          variant="surface"
          padding="none"
          className="lg:col-span-2 flex flex-col h-full"
        >
          <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="border-b border-bg-border pb-4">
                <h2 className="text-[18px] font-bold text-bg-ink">
                  Detail Informasi Akun
                </h2>
                <p className="text-[12px] text-bg-ink-muted mt-1">
                  Data identitas formal dan atribut akademik bersifat baca-saja.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
                <div>
                  <p className="font-semibold text-bg-ink-secondary mb-1">
                    {user.role === "admin"
                      ? "ID Pengguna"
                      : user.role === "guru"
                        ? "NIP"
                        : "NIS"}
                  </p>
                  <p className="text-bg-ink font-mono text-[13px]">
                    {user.role === "admin" ? user.id : user.nipOrNis || "-"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-bg-ink-secondary mb-1">
                    Nama Lengkap
                  </p>
                  <p className="text-bg-ink font-medium text-[14px]">{name}</p>
                </div>
                <div>
                  <p className="font-semibold text-bg-ink-secondary mb-1">
                    Alamat Email
                  </p>
                  <p className="text-bg-ink font-medium text-[14px]">{email}</p>
                </div>
                {user.role === "siswa" && (
                  <>
                    <div>
                      <p className="font-semibold text-bg-ink-secondary mb-1">
                        Kelas
                      </p>
                      <p className="text-bg-ink font-medium text-[14px]">
                        {user.kelasName || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-bg-ink-secondary mb-1">
                        Angkatan
                      </p>
                      <p className="text-bg-ink font-medium text-[14px]">
                        {user.angkatan || "-"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-bg-border flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-[12px]">
              {user.role !== "admin" ? (
                <span className="text-bg-ink-muted">
                  Butuh bantuan untuk memperbarui data? Hubungi Admin Sekolah.
                </span>
              ) : (
                <div />
              )}
              <Button
                onClick={() => navigate(`/${user.role}/change-password`)}
                className="gap-2 text-[12px] font-semibold h-9 shrink-0 self-end sm:self-auto"
              >
                <Key className="h-4 w-4" />
                Ubah Kata Sandi
              </Button>
            </div>
          </div>
        </Card>

        {/* Role & Access Info Sidebar */}
        <Card
          variant="subtle"
          padding="none"
          className="lg:col-span-1 flex flex-col h-full"
        >
          <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Profile Quick Header */}
              <div className="flex items-center gap-4 pb-5 border-b border-bg-border">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[14px] tracking-wider shrink-0 select-none">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold text-bg-ink truncate">
                    {user.name}
                  </h3>
                  <p className="text-[11px] text-bg-ink-secondary font-medium mt-0.5">
                    {getRoleBadge(user.role)}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-[13px]">
                <div>
                  <p className="font-semibold text-bg-ink-secondary">
                    Tingkat Hak Akses
                  </p>
                  <p className="text-bg-ink font-medium mt-0.5">
                    {getAccessLevel(user.role)}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-bg-ink-secondary">
                    Status Keaktifan
                  </p>
                  <div className="mt-1.5">
                    <StatusBadge
                      label={user.status === "aktif" ? "Aktif" : "Nonaktif"}
                      state={user.status === "aktif" ? "safe" : "disabled"}
                      size="xs"
                    />
                  </div>
                </div>

                {user.role === "guru" && user.assignments && (
                  <div className="border-t border-bg-border/60 pt-4 mt-4 space-y-3">
                    <p className="font-semibold text-bg-ink-secondary">
                      Penugasan Aktif
                    </p>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center bg-bg-surface p-2.5 border border-bg-border rounded-[6px]">
                        <span className="text-[12px] font-medium text-bg-ink">
                          Guru Pengampu
                        </span>
                        <StatusBadge
                          label={user.assignments.isPengampu ? "Ya" : "Tidak"}
                          state={
                            user.assignments.isPengampu ? "safe" : "neutral"
                          }
                          size="xs"
                          showDot={false}
                        />
                      </div>
                      <div className="flex justify-between items-center bg-bg-surface p-2.5 border border-bg-border rounded-[6px]">
                        <span className="text-[12px] font-medium text-bg-ink">
                          Wali Kelas
                        </span>
                        <StatusBadge
                          label={
                            user.assignments.isWaliKelas
                              ? `Ya (${user.assignments.waliKelasName})`
                              : "Tidak"
                          }
                          state={
                            user.assignments.isWaliKelas ? "safe" : "neutral"
                          }
                          size="xs"
                          showDot={false}
                        />
                      </div>
                      <div className="flex justify-between items-center bg-bg-surface p-2.5 border border-bg-border rounded-[6px]">
                        <span className="text-[12px] font-medium text-bg-ink">
                          Piket Hari Ini
                        </span>
                        <StatusBadge
                          label={user.assignments.isPiketToday ? "Ya" : "Tidak"}
                          state={
                            user.assignments.isPiketToday
                              ? "warning"
                              : "neutral"
                          }
                          size="xs"
                          showDot={false}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[11px] text-bg-ink-muted leading-relaxed pt-4 border-t border-bg-border/60">
              Sistem Akademik CORELASI v2.0. Hak akses ini diatur oleh operator
              Dapodik/Sekolah.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;

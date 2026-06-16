import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { userService } from "@/services/userService";
import type { ResetRequest, UserDetail } from "@/types/user";
import {
  DataTable,
  FilterBar,
  Button,
  Toast,
  ConfirmDialog,
  StatusBadge,
  LoadingState,
  Card,
} from "@/components/shared";
import {
  UserPlus,
  Edit,
  Eye,
  Trash2,
  Shield,
  GraduationCap,
  User,
  Key,
  Copy,
} from "lucide-react";

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
  const [resolvedTempPassword, setResolvedTempPassword] = useState<{
    name: string;
    password: string;
  } | null>(null);
  const [resolveRequestTarget, setResolveRequestTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchUsers = async () => {
    await Promise.resolve();
    setLoading(true);
    const data = await userService.getAll();
    setUsers(data);
    try {
      const requests = await userService.getPasswordResetRequests();
      setResetRequests(requests.filter((r) => r.status === "pending"));
    } catch {
      setResetRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(fetchUsers);
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.nipOrNis && u.nipOrNis.toLowerCase().includes(q)),
      );
    }
    if (roleFilter !== "") {
      result = result.filter((u) => u.role === roleFilter);
    }
    return result;
  }, [users, search, roleFilter]);

  const handleDeleteClick = (id: string) => {
    setDeleteUserId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserId) return;
    try {
      await userService.delete(deleteUserId);
      setToastMessage("User berhasil dihapus.");
      setDeleteUserId(null);
      fetchUsers();
    } catch (error: unknown) {
      setToastMessage(
        error instanceof Error ? error.message : "Gagal menghapus user.",
      );
    }
  };

  const handleResolveRequest = (requestId: string, name: string) => {
    setResolveRequestTarget({ id: requestId, name });
  };

  const columns = [
    {
      header: "Nama",
      cell: (u: UserDetail) => (
        <div>
          <span className="text-[13px] font-semibold text-bg-ink block">
            {u.name}
          </span>
          {u.nipOrNis && (
            <span className="text-[10px] text-bg-ink-muted font-mono">
              {u.nipOrNis}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Email",
      cell: (u: UserDetail) => (
        <span className="text-[13px] text-bg-ink-secondary font-mono">
          {u.email}
        </span>
      ),
    },
    {
      header: "Peran",
      cell: (u: UserDetail) => {
        const roleConfig = {
          admin: {
            icon: <Shield className="h-3.5 w-3.5 text-primary" />,
            className: "text-primary",
          },
          guru: {
            icon: <GraduationCap className="h-3.5 w-3.5 text-status-info" />,
            className: "text-text-info",
          },
          siswa: {
            icon: <User className="h-3.5 w-3.5 text-bg-ink-secondary" />,
            className: "text-bg-ink-secondary",
          },
        };
        const config = roleConfig[u.role as keyof typeof roleConfig] || {
          icon: <User className="h-3.5 w-3.5 text-bg-ink-secondary" />,
          className: "text-bg-ink-secondary",
        };
        return (
          <span
            className={`inline-flex items-center gap-1.5 text-[13px] font-semibold capitalize ${config.className}`}
          >
            {config.icon}
            {u.role}
          </span>
        );
      },
    },
    {
      header: "Status",
      cell: (u: UserDetail) => (
        <StatusBadge
          label={u.status === "aktif" ? "Aktif" : "Nonaktif"}
          state={u.status === "aktif" ? "safe" : "disabled"}
          size="xs"
        />
      ),
    },
    {
      header: "Aksi",
      cell: (u: UserDetail) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/admin/users/${u.id}`}
            className="relative before:content-[''] before:absolute before:inset-[-6px] inline-flex items-center justify-center font-semibold rounded-[6px] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary bg-transparent text-bg-ink hover:bg-bg-border/30 h-9 w-9 p-0"
            title="Detail"
            aria-label="Detail Pengguna"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            to={`/admin/users/${u.id}/edit`}
            className="relative before:content-[''] before:absolute before:inset-[-6px] inline-flex items-center justify-center font-semibold rounded-[6px] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary bg-transparent text-bg-ink hover:bg-bg-border/30 h-9 w-9 p-0"
            title="Edit"
            aria-label="Edit Pengguna"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="relative before:content-[''] before:absolute before:inset-[-6px] h-9 w-9 p-0 text-status-danger hover:bg-status-danger/10"
            onClick={() => handleDeleteClick(u.id)}
            title="Hapus"
            aria-label="Hapus Pengguna"
          >
            <Trash2 className="h-4 w-4" />
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

      {deleteUserId && (
        <ConfirmDialog
          isOpen={true}
          title="Hapus Pengguna"
          message="Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          cancelLabel="Batal"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteUserId(null)}
        />
      )}

      {resolveRequestTarget && (
        <ConfirmDialog
          isOpen={true}
          title="Proses Atur Ulang Sandi"
          message={`Apakah Anda yakin ingin memproses dan membuat kata sandi baru untuk ${resolveRequestTarget.name}?`}
          confirmLabel="Proses"
          cancelLabel="Batal"
          variant="primary"
          onConfirm={async () => {
            const target = resolveRequestTarget;
            setResolveRequestTarget(null);
            try {
              const tempPassword =
                await userService.resolvePasswordResetRequest(target.id);
              setResolvedTempPassword({
                name: target.name,
                password: tempPassword,
              });
              setToastMessage("Kata sandi berhasil diatur ulang.");
              fetchUsers();
            } catch (error: unknown) {
              setToastMessage(
                error instanceof Error
                  ? error.message
                  : "Gagal mengatur ulang kata sandi.",
              );
            }
          }}
          onCancel={() => setResolveRequestTarget(null)}
        />
      )}

      {resolvedTempPassword && (
        <div className="bg-bg-safe-tint border border-border-safe p-4 rounded-[6px] text-[13px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-text-safe">
              Kata Sandi Baru Berhasil Dibuat!
            </p>
            <div className="text-bg-ink-secondary mt-1.5 flex flex-wrap items-center gap-1">
              <span>
                Kata sandi sementara untuk{" "}
                <strong>{resolvedTempPassword.name}</strong>:
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white pl-2 pr-1 py-0.5 border border-border-safe rounded-[4px] shadow-[0_1px_2px_rgba(20,33,26,0.02)]">
                <code className="font-mono font-bold text-[13px] text-bg-ink select-all">
                  {resolvedTempPassword.password}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      resolvedTempPassword.password,
                    );
                    setToastMessage("Kata sandi disalin ke papan klip!");
                  }}
                  className="text-primary hover:text-primary-hover p-1 rounded hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  title="Salin kata sandi"
                  aria-label="Salin kata sandi"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              variant="ghost"
              onClick={() => setResolvedTempPassword(null)}
              className="text-[12px] h-8 text-bg-ink-secondary border border-bg-border hover:bg-bg-border/20 px-3 rounded-[6px]"
            >
              Tutup
            </Button>
          </div>
        </div>
      )}

      {resetRequests.length > 0 && (
        <Card
          variant="surface"
          className="border-status-warning/40 bg-status-warning/[0.02] space-y-4"
        >
          <div className="border-b border-bg-border pb-3">
            <h3 className="text-[14px] font-bold text-bg-ink flex items-center gap-2 font-sans">
              <span className="block h-2 w-2 rounded-full bg-status-warning animate-pulse translate-y-[-0.5px] shrink-0" />
              Permintaan Atur Ulang Kata Sandi
            </h3>
            <p className="text-[11px] text-bg-ink-muted mt-0.5">
              Terdapat {resetRequests.length} pengguna yang meminta pengaturan
              ulang kata sandi karena lupa password.
            </p>
          </div>

          <div className="divide-y divide-bg-border text-[13px]">
            {resetRequests.map((req) => (
              <div
                key={req.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-bg-ink">
                      {req.name}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-bg-ink-muted bg-bg-border px-1.5 py-0.5 rounded-[4px]">
                      {req.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-bg-ink-secondary text-[11px] mt-0.5">
                    <span className="font-mono">{req.email}</span>
                    <span className="text-bg-ink-muted/50 select-none">•</span>
                    <span className="text-bg-ink-muted">
                      {new Date(req.requestedAt).toLocaleDateString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    variant="ghost"
                    onClick={() => handleResolveRequest(req.id, req.name)}
                    className="text-[12px] h-8 text-primary border border-primary/20 hover:bg-primary/5 px-3 rounded-[6px] flex items-center gap-1.5"
                  >
                    <Key className="h-3.5 w-3.5" />
                    Proses &amp; Buat Sandi Baru
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            Manajemen Pengguna
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Kelola data akun admin, guru, dan siswa yang terdaftar di sekolah.
          </p>
        </div>
        <Link
          to="/admin/users/create"
          className="inline-flex items-center justify-center font-semibold rounded-[6px] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary bg-primary text-white hover:bg-primary-hover px-4 py-2 text-[13px] gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Tambah Pengguna
        </Link>
      </div>

      <FilterBar
        searchPlaceholder="Cari berdasarkan nama, email, NIP/NIS..."
        searchValue={search}
        onSearchChange={setSearch}
        filterValue={roleFilter}
        onFilterChange={setRoleFilter}
        filterPlaceholder="Semua Peran"
        filterLabel="Peran"
        searchLabel="Pencarian Pengguna"
        filterOptions={[
          { value: "admin", label: "Admin" },
          { value: "guru", label: "Guru" },
          { value: "siswa", label: "Siswa" },
        ]}
      />

      {loading ? (
        <LoadingState message="Memuat data pengguna..." />
      ) : (
        <DataTable
          title="Daftar Pengguna Sekolah"
          columns={columns}
          data={filteredUsers}
          keyExtractor={(u) => u.id}
          paginate={true}
          pageSize={10}
        />
      )}
    </div>
  );
};
export default UsersPage;

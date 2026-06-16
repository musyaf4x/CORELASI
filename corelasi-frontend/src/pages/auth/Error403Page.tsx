import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, Button } from "@/components/shared";

export const Error403Page: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return "/login";
    return `/${user.role}/dashboard`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-paper px-4">
      <Card variant="surface" className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-danger/10 text-status-danger">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-bg-ink sm:text-3xl">
          Akses Ditolak
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-bg-ink-secondary">
          Anda tidak memiliki izin untuk membuka halaman ini. Silakan kembali ke
          dashboard akun Anda.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link to={getDashboardPath()} className="w-full">
            <Button className="w-full" size="lg">
              Kembali ke Dashboard
            </Button>
          </Link>
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Kembali ke Halaman Sebelumnya
          </Button>
        </div>
      </Card>
    </div>
  );
};

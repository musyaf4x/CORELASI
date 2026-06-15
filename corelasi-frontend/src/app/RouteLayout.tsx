import React from "react";
import { Outlet } from "react-router-dom";
import { RoleGuard } from "@/components/shared/RoleGuard";
import type { UserRole } from "@/types/auth";

interface RoleLayoutProps {
  allowedRoles: UserRole[];
}

export const RoleLayout: React.FC<RoleLayoutProps> = ({ allowedRoles }) => (
  <RoleGuard allowedRoles={allowedRoles}>
    <Outlet />
  </RoleGuard>
);

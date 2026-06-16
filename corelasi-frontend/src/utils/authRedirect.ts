import type { UserRole } from "@/types/auth";

const ROLE_PATHS: UserRole[] = ["admin", "guru", "siswa"];

export function getPostLoginRedirectPath(role: UserRole, fromPath = "/"): string {
  const dashboardPath = `/${role}/dashboard`;
  const matchedRole = ROLE_PATHS.find(
    (candidate) =>
      fromPath === `/${candidate}` || fromPath.startsWith(`/${candidate}/`),
  );

  if (!matchedRole) return dashboardPath;
  return matchedRole === role ? fromPath : dashboardPath;
}

import { describe, expect, it } from "vitest";
import { getPostLoginRedirectPath } from "@/utils/authRedirect";

describe("post-login redirect", () => {
  it("keeps the requested path when it belongs to the same role", () => {
    expect(getPostLoginRedirectPath("guru", "/guru/assignments")).toBe(
      "/guru/assignments",
    );
  });

  it("falls back to the new role dashboard when the previous path belongs to another role", () => {
    expect(getPostLoginRedirectPath("guru", "/admin/users")).toBe(
      "/guru/dashboard",
    );
    expect(getPostLoginRedirectPath("siswa", "/admin/dashboard")).toBe(
      "/siswa/dashboard",
    );
  });

  it("falls back to the role dashboard for public or unknown paths", () => {
    expect(getPostLoginRedirectPath("admin", "/")).toBe("/admin/dashboard");
    expect(getPostLoginRedirectPath("siswa", "/403")).toBe("/siswa/dashboard");
  });
});

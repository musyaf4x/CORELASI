import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isDemoLoginEnabled } from "@/config/demoLogin";

describe("demo login configuration", () => {
  it("is disabled when the flag is absent", () => {
    expect(isDemoLoginEnabled(undefined)).toBe(false);
  });

  it("is enabled only by an explicit true flag", () => {
    expect(isDemoLoginEnabled("true")).toBe(true);
    expect(isDemoLoginEnabled("false")).toBe(false);
    expect(isDemoLoginEnabled("1")).toBe(false);
  });

  it("does not embed the shared demo password in the login page", () => {
    const loginPage = readFileSync(
      resolve(process.cwd(), "src/pages/auth/LoginPage.tsx"),
      "utf8",
    );
    const authService = readFileSync(
      resolve(process.cwd(), "src/services/authService.ts"),
      "utf8",
    );

    expect(loginPage).not.toContain("password123");
    expect(loginPage).toContain("demoLoginEnabled &&");
    expect(loginPage).toContain("showcaseLogin");
    expect(authService).toContain('"/auth/showcase-login/"');
  });
});

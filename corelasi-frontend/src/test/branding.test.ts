/// <reference types="node" />

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("production branding", () => {
  it("bundles the normal Inter variable font without external font stylesheets", () => {
    const html = readProjectFile("index.html");
    const css = readProjectFile("src/index.css");
    const main = readProjectFile("src/main.tsx");
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      dependencies?: Record<string, string>;
    };

    expect(`${html}\n${css}`).not.toMatch(
      /fonts\.(?:googleapis|gstatic)\.com|Plus Jakarta Sans/,
    );
    expect(
      packageJson.dependencies?.["@fontsource-variable/inter"],
    ).toBeDefined();
    expect(main).toContain("@fontsource-variable/inter/wght.css");
    expect(main).toContain("@fontsource-variable/inter/wght-italic.css");
    expect(css).toMatch(/font-style:\s*normal/);
    expect(css).toMatch(/font-synthesis:\s*none/);
  });

  it("uses icon2 and the updated institutional login panel", () => {
    const loginPage = readProjectFile("src/pages/auth/LoginPage.tsx");
    const sidebar = readProjectFile("src/components/layout/Sidebar.tsx");

    expect(loginPage).toContain(
      "Sistem Administrasi Akademik SMAT Baiturrahman",
    );
    expect(loginPage).not.toContain("Sistem Administrasi Akademik Sekolah");
    expect(loginPage).toContain('src="/corelasi-02.png"');
    expect(sidebar).toContain('src="/corelasi-02.png"');
    expect(loginPage).toContain("bg-primary");
    expect(loginPage).toContain("text-white");
    expect(existsSync(resolve(process.cwd(), "public/corelasi-02.png"))).toBe(
      true,
    );
  });
});

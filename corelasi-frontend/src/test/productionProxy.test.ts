import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("production reverse proxy security", () => {
  it("adds HSTS to frontend and API responses", () => {
    const caddyfile = readFileSync(
      resolve(process.cwd(), "../deploy/Caddyfile.container"),
      "utf8",
    );

    expect(caddyfile).toContain('Strict-Transport-Security "max-age=31536000"');
  });
});

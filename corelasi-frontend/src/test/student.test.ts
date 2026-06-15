import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getActiveDateString,
  getSiswaKelasId,
  getSiswaKelasName,
} from "../utils/student";

describe("student context utilities", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads class identity from the authenticated user", () => {
    const user = {
      kelasId: "class-42",
      kelasName: "XI RPL 1",
    };

    expect(getSiswaKelasId(user)).toBe("class-42");
    expect(getSiswaKelasName(user)).toBe("XI RPL 1");
  });

  it("does not invent a class when the session has none", () => {
    expect(getSiswaKelasId({})).toBe("");
    expect(getSiswaKelasName({})).toBe("");
  });

  it("returns the current date in the application timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-08T18:00:00.000Z"));

    expect(getActiveDateString()).toBe("2026-06-09");
  });
});

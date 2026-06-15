import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken, setAccessToken } from "../services/sessionStore";
import { ensureCsrfCookie, refreshSession } from "../services/api";

describe("API token refresh", () => {
  beforeEach(() => {
    localStorage.clear();
    setAccessToken(null);
    vi.spyOn(axios, "get").mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores only the refreshed access token in memory", async () => {
    vi.spyOn(axios, "post").mockResolvedValue({
      data: {
        success: true,
        data: {
          accessToken: "new-access",
        },
      },
    });

    await expect(refreshSession()).resolves.toBe(true);

    expect(getAccessToken()).toBe("new-access");
    expect(localStorage.getItem("corelasi_user")).toBeNull();
  });

  it("returns false and clears memory when cookie refresh fails", async () => {
    setAccessToken("expired-access");
    vi.spyOn(axios, "post").mockRejectedValue(new Error("unauthorized"));

    await expect(refreshSession()).resolves.toBe(false);
    expect(getAccessToken()).toBeNull();
  });

  it("shares one CSRF bootstrap request across concurrent auth actions", async () => {
    let resolveRequest: (() => void) | undefined;
    vi.mocked(axios.get).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = () => resolve({ data: { success: true } });
        }),
    );

    const first = ensureCsrfCookie();
    const second = ensureCsrfCookie();

    expect(axios.get).toHaveBeenCalledTimes(1);
    resolveRequest?.();
    await expect(Promise.all([first, second])).resolves.toEqual([
      undefined,
      undefined,
    ]);
  });
});

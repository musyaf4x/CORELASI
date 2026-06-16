import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type CreateAxiosDefaults,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../types/api";

type AdapterHandler = (
  config: InternalAxiosRequestConfig,
) => Promise<AxiosResponse>;

const originalCreate = axios.create.bind(axios);

const successResponse = (
  config: InternalAxiosRequestConfig,
  data: unknown,
): AxiosResponse => ({
  data: { success: true, data },
  status: 200,
  statusText: "OK",
  headers: new AxiosHeaders(),
  config,
});

const failedResponse = (
  config: InternalAxiosRequestConfig,
  status: number,
  data?: unknown,
): AxiosError => {
  const response: AxiosResponse = {
    data,
    status,
    statusText: "Request failed",
    headers: new AxiosHeaders(),
    config,
  };
  return new AxiosError(
    "Request failed",
    undefined,
    config,
    undefined,
    response,
  );
};

const loadApi = async (handler: AdapterHandler) => {
  vi.resetModules();
  const adapter: AxiosAdapter = (config) => handler(config);
  vi.spyOn(axios, "create").mockImplementation((config?: CreateAxiosDefaults) =>
    originalCreate({
      ...config,
      adapter,
    }),
  );

  const api = await import("../services/api");
  const session = await import("../services/sessionStore");
  vi.mocked(axios.create).mockRestore();
  return { api, session };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("API client contract", () => {
  it("unwraps all request helpers and attaches the in-memory bearer token", async () => {
    const requests: InternalAxiosRequestConfig[] = [];
    const { api, session } = await loadApi(async (config) => {
      requests.push(config);
      return successResponse(config, {
        method: config.method,
        contentType: config.headers.get("Content-Type"),
      });
    });
    session.setAccessToken("access-token");

    await expect(api.apiGet("/items/", { page: 2 })).resolves.toMatchObject({
      method: "get",
    });
    await expect(api.apiPost("/items/", { name: "A" })).resolves.toMatchObject({
      method: "post",
    });
    await expect(
      api.apiPatch("/items/1/", { name: "B" }),
    ).resolves.toMatchObject({
      method: "patch",
    });
    await expect(api.apiDelete("/items/1/")).resolves.toBeUndefined();
    await expect(
      api.apiUpload("/upload/", new FormData()),
    ).resolves.toMatchObject({
      method: "post",
      contentType: "multipart/form-data",
    });

    expect(requests).toHaveLength(5);
    expect(
      requests.every(
        (request) =>
          request.headers.get("Authorization") === "Bearer access-token",
      ),
    ).toBe(true);
  });

  it.each([
    [403, undefined, "Anda tidak memiliki izin", 403],
    [404, undefined, "Data tidak ditemukan", 404],
    [500, undefined, "Terjadi kesalahan pada server", 500],
    [
      422,
      { message: "Email tidak valid", errors: { email: ["invalid"] } },
      "Email tidak valid",
      422,
    ],
    [
      400,
      { message: "Permintaan gagal", errors: { field: ["invalid"] } },
      "Permintaan gagal",
      400,
    ],
  ])("normalizes HTTP %s errors", async (status, data, message, statusCode) => {
    const { api } = await loadApi(async (config) => {
      throw failedResponse(config, status, data);
    });

    try {
      await api.apiGet("/failure/");
      throw new Error("Expected request to fail");
    } catch (error) {
      expect(ApiError.is(error)).toBe(true);
      expect(error).toMatchObject({ statusCode });
      expect((error as Error).message).toContain(message);
    }
  });

  it("normalizes network failures", async () => {
    const { api } = await loadApi(async (config) => {
      throw new AxiosError("offline", undefined, config);
    });

    await expect(api.apiGet("/offline/")).rejects.toMatchObject({
      statusCode: 0,
      message:
        "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
    });
  });

  it("refreshes once and retries a rejected request with the new token", async () => {
    let attempts = 0;
    const { api, session } = await loadApi(async (config) => {
      attempts += 1;
      if (attempts === 1) {
        throw failedResponse(config, 401);
      }
      return successResponse(config, {
        authorization: config.headers.get("Authorization"),
      });
    });
    vi.spyOn(axios, "get").mockResolvedValue({ data: { success: true } });
    vi.spyOn(axios, "post").mockResolvedValue({
      data: {
        success: true,
        data: { accessToken: "rotated-access" },
      },
    });
    session.setAccessToken("expired-access");

    await expect(api.apiGet("/protected/")).resolves.toEqual({
      authorization: "Bearer rotated-access",
    });
    expect(attempts).toBe(2);
    expect(session.getAccessToken()).toBe("rotated-access");
  });
});

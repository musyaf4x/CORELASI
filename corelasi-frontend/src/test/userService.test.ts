import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_USERS_LIST } from "../mocks/users.mock";
import { userService } from "../services/userService";
import type { ResetRequest, UserDetail } from "../types/user";

const runTimed = async <T>(operation: Promise<T>): Promise<T> => {
  const observed = operation.then(
    (value) => ({ success: true as const, value }),
    (error: unknown) => ({ success: false as const, error }),
  );
  await vi.runAllTimersAsync();
  const result = await observed;
  if (!result.success) throw result.error;
  return result.value;
};

describe("User Service Mock Test", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("seeds an isolated database without mutating the shared fixture", async () => {
    const fixtureSnapshot = structuredClone(MOCK_USERS_LIST);
    const user: Omit<UserDetail, "id"> = {
      name: "Test User",
      email: "test.user@corelasi.test",
      role: "siswa",
      status: "aktif",
      password: "password123",
    };

    const created = await runTimed(userService.create(user));

    expect(created).toMatchObject(user);
    expect(MOCK_USERS_LIST).toEqual(fixtureSnapshot);
    expect(
      JSON.parse(localStorage.getItem("corelasi_users_db") ?? "[]"),
    ).toContainEqual(created);
  });

  it("lists users, restores missing passwords, and handles invalid storage", async () => {
    const withoutPassword = [{ ...MOCK_USERS_LIST[0], password: undefined }];
    localStorage.setItem("corelasi_users_db", JSON.stringify(withoutPassword));

    const restored = await runTimed(userService.getAll());
    expect(restored[0].password).toBe("password123");

    localStorage.setItem("corelasi_users_db", "{invalid");
    const fallback = await runTimed(userService.getAll());
    expect(fallback).toEqual(MOCK_USERS_LIST);
  });

  it("finds users by id and returns null for an unknown user", async () => {
    await expect(runTimed(userService.getById("2"))).resolves.toMatchObject({
      email: "guru@corelasi.test",
    });
    await expect(runTimed(userService.getById("missing"))).resolves.toBeNull();
  });

  it("updates users and resolves matching pending reset requests", async () => {
    const requests: ResetRequest[] = [
      {
        id: "req-1",
        email: "guru@corelasi.test",
        name: "Budi Santoso, M.Pd.",
        role: "guru",
        requestedAt: new Date().toISOString(),
        status: "pending",
      },
    ];
    localStorage.setItem("corelasi_reset_requests", JSON.stringify(requests));

    const updated = await runTimed(
      userService.update("2", { password: "SecurePass456!" }),
    );

    expect(updated.password).toBe("SecurePass456!");
    expect(
      JSON.parse(localStorage.getItem("corelasi_reset_requests") ?? "[]")[0]
        .status,
    ).toBe("resolved");

    await expect(
      runTimed(userService.update("missing", { name: "Unknown" })),
    ).rejects.toThrow("User tidak ditemukan");
  });

  it("deletes an existing user and rejects an unknown user", async () => {
    await expect(runTimed(userService.delete("6"))).resolves.toBeUndefined();
    await expect(runTimed(userService.getById("6"))).resolves.toBeNull();
    await expect(runTimed(userService.delete("missing"))).rejects.toThrow(
      "User tidak ditemukan",
    );
  });

  it("loads reset requests from storage and tolerates malformed data", async () => {
    await expect(
      runTimed(userService.getPasswordResetRequests()),
    ).resolves.toEqual([]);

    localStorage.setItem("corelasi_reset_requests", "{invalid");
    await expect(
      runTimed(userService.getPasswordResetRequests()),
    ).resolves.toEqual([]);
  });

  it("creates one pending reset request per registered email", async () => {
    await expect(
      runTimed(userService.createPasswordResetRequest("missing@corelasi.test")),
    ).rejects.toThrow("Email tidak terdaftar");

    await expect(
      runTimed(userService.createPasswordResetRequest("guru@corelasi.test")),
    ).resolves.toBeUndefined();
    await expect(
      runTimed(userService.createPasswordResetRequest(" GURU@corelasi.test ")),
    ).rejects.toThrow("masih dalam antrean");
  });

  it("resolves reset requests and updates the user's temporary password", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    await runTimed(
      userService.createPasswordResetRequest("siswa@corelasi.test"),
    );
    const [request] = await runTimed(userService.getPasswordResetRequests());

    const temporaryPassword = await runTimed(
      userService.resolvePasswordResetRequest(request.id),
    );
    const updatedUser = await runTimed(userService.getById("4"));
    const [resolved] = await runTimed(userService.getPasswordResetRequests());

    expect(temporaryPassword).toBe("pwd-550000");
    expect(updatedUser?.password).toBe(temporaryPassword);
    expect(resolved.status).toBe("resolved");

    await expect(
      runTimed(userService.resolvePasswordResetRequest("missing")),
    ).rejects.toThrow("Permintaan tidak ditemukan.");
  });
});

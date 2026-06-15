import { beforeEach, describe, it, expect } from "vitest";
import { authService } from "../services/authService";

describe("Auth Service Mock Test", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should authenticate mock admin successfully", async () => {
    const user = await authService.login("admin@corelasi.test", "password123");
    expect(user.role).toBe("admin");
    expect(user.name).toBe("Ahmad Sukarjo");
  });

  it("should reject invalid credentials", async () => {
    await expect(
      authService.login("admin@corelasi.test", "wrongpassword"),
    ).rejects.toThrow("Email atau kata sandi salah.");
  });

  it("should change the current user's password", async () => {
    await authService.login("admin@corelasi.test", "password123");

    await authService.changePassword("password123", "SecurePass456!");

    await expect(
      authService.login("admin@corelasi.test", "password123"),
    ).rejects.toThrow("Email atau kata sandi salah.");
    await expect(
      authService.login("admin@corelasi.test", "SecurePass456!"),
    ).resolves.toMatchObject({ email: "admin@corelasi.test" });
  });
});

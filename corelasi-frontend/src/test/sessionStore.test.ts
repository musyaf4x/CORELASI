import { beforeEach, describe, expect, it } from "vitest";

import {
  clearSession,
  getAccessToken,
  getSessionUser,
  setAccessToken,
  setSessionUser,
} from "../services/sessionStore";

describe("in-memory session store", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearSession();
  });

  it("keeps tokens and users in memory without Web Storage", () => {
    setAccessToken("access-token");
    setSessionUser({
      id: "user-1",
      name: "Alya",
      email: "alya@corelasi.test",
      role: "siswa",
      status: "aktif",
    });

    expect(getAccessToken()).toBe("access-token");
    expect(getSessionUser()?.email).toBe("alya@corelasi.test");
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("clears all in-memory session state", () => {
    setAccessToken("access-token");
    setSessionUser({
      id: "user-1",
      name: "Alya",
      email: "alya@corelasi.test",
      role: "siswa",
      status: "aktif",
    });

    clearSession();

    expect(getAccessToken()).toBeNull();
    expect(getSessionUser()).toBeNull();
  });
});

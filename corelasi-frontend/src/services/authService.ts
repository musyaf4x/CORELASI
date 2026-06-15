/**
 * @file src/services/authService.ts
 * @description Auth service for CORELASI.
 *
 * MOCK MODE (current): Reads from localStorage, validates against MOCK_USERS_LIST.
 * REAL API MODE (future): Swap implementation to call POST /auth/login via apiPost().
 *
 * Public interface MUST NOT change between modes.
 */

import { MOCK_USERS_LIST } from "@/mocks/users.mock";
import type { AuthUser } from "@/types/auth";
import {
  apiGet,
  apiPost,
  ensureCsrfCookie,
  refreshSession,
} from "@/services/api";
import {
  clearSession,
  getSessionUser,
  setAccessToken,
  setSessionUser,
} from "@/services/sessionStore";

const IS_TEST = import.meta.env.MODE === "test";

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Authenticate user by email and password.
   * Calls real API POST /auth/login/ in development/production.
   * Falls back to mock data in test suites.
   */
  login: async (email: string, passwordHash: string): Promise<AuthUser> => {
    if (IS_TEST) {
      return new Promise((resolve, reject) => {
        const usersDbJson = localStorage.getItem("corelasi_users_db");
        let usersDb: Record<string, unknown>[] = [];
        if (usersDbJson) {
          try {
            usersDb = JSON.parse(usersDbJson);
          } catch {
            usersDb = [];
          }
        }
        if (usersDb.length === 0) {
          usersDb = MOCK_USERS_LIST as unknown as Record<string, unknown>[];
          localStorage.setItem(
            "corelasi_users_db",
            JSON.stringify(MOCK_USERS_LIST),
          );
        }

        const user = usersDb.find(
          (u) =>
            typeof u["email"] === "string" &&
            u["email"].toLowerCase().trim() === email.toLowerCase().trim(),
        );

        if (user && user["password"] === passwordHash) {
          const safeUser = { ...user };
          delete safeUser["password"];
          const typedUser = safeUser as AuthUser & {
            kelasId?: string;
            kelasName?: string;
          };

          localStorage.setItem("corelasi_user", JSON.stringify(typedUser));
          resolve(typedUser as AuthUser);
        } else {
          reject(new Error("Email atau kata sandi salah."));
        }
      });
    }

    await ensureCsrfCookie();
    const response = await apiPost<{ user: AuthUser; accessToken: string }>(
      "/auth/login/",
      { email, password: passwordHash },
    );

    setAccessToken(response.accessToken);
    setSessionUser(response.user);
    return response.user;
  },

  showcaseLogin: async (email: string): Promise<AuthUser> => {
    if (IS_TEST) {
      const user = MOCK_USERS_LIST.find(
        (candidate) =>
          candidate.email.toLowerCase() === email.toLowerCase().trim(),
      );
      if (!user) {
        throw new Error("Akun showcase tidak tersedia.");
      }
      const safeUser = { ...user } as Record<string, unknown>;
      delete safeUser["password"];
      const typedUser = safeUser as unknown as AuthUser;
      localStorage.setItem("corelasi_user", JSON.stringify(typedUser));
      return typedUser;
    }

    await ensureCsrfCookie();
    const response = await apiPost<{ user: AuthUser; accessToken: string }>(
      "/auth/showcase-login/",
      { email },
    );
    setAccessToken(response.accessToken);
    setSessionUser(response.user);
    return response.user;
  },

  /**
   * Log out the current user and clear session data.
   */
  logout: async (): Promise<void> => {
    if (IS_TEST) {
      localStorage.removeItem("corelasi_user");
      return;
    }

    try {
      await ensureCsrfCookie();
      await apiPost("/auth/logout/");
    } catch {
      // The local session must still be cleared if the server is unavailable.
    } finally {
      clearSession();
    }
  },

  initializeSession: async (): Promise<AuthUser | null> => {
    if (IS_TEST) {
      return authService.getCurrentUser();
    }

    const refreshed = await refreshSession();
    if (!refreshed) return null;

    try {
      const user = await apiGet<AuthUser>("/auth/me/");
      setSessionUser(user);
      return user;
    } catch {
      clearSession();
      return null;
    }
  },

  /**
   * Get the currently authenticated user from the session.
   * Returns null if no active session.
   *
   * REAL API: GET /auth/me (or decode JWT claims from in-memory token)
   */
  getCurrentUser: (): AuthUser | null => {
    if (!IS_TEST) {
      return getSessionUser();
    }

    const userJson = localStorage.getItem("corelasi_user");
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as AuthUser;
    } catch {
      return null;
    }
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    if (!IS_TEST) {
      await apiPost("/auth/change-password/", {
        currentPassword,
        newPassword,
      });
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error("Sesi pengguna tidak ditemukan.");
    }

    const usersDbJson = localStorage.getItem("corelasi_users_db");
    const usersDb = usersDbJson
      ? (JSON.parse(usersDbJson) as Array<Record<string, unknown>>)
      : (MOCK_USERS_LIST as unknown as Array<Record<string, unknown>>);
    const userIndex = usersDb.findIndex(
      (user) =>
        user["id"] === currentUser.id || user["email"] === currentUser.email,
    );

    if (userIndex === -1) {
      throw new Error("Akun pengguna tidak ditemukan di sistem.");
    }
    if (usersDb[userIndex]["password"] !== currentPassword) {
      throw new Error("Kata sandi saat ini salah.");
    }

    const updatedDb = usersDb.map((user, index) =>
      index === userIndex ? { ...user, password: newPassword } : user,
    );
    localStorage.setItem("corelasi_users_db", JSON.stringify(updatedDb));
  },

  /**
   * Update the teacher assignment data in the current session.
   * Only valid for guru-role users.
   *
   * REAL API: PATCH /users/me/assignments
   */
  updateAssignments: (
    assignments: AuthUser["assignments"],
  ): AuthUser | null => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== "guru") return null;

    const updated: AuthUser = { ...currentUser, assignments };
    if (IS_TEST) {
      localStorage.setItem("corelasi_user", JSON.stringify(updated));
    } else {
      setSessionUser(updated);
    }
    return updated;
  },
};

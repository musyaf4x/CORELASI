import { apiGet, apiPost, apiPatch, apiDelete } from "@/services/api";
import { MOCK_USERS_LIST } from "@/mocks/users.mock";
import type { UserDetail, ResetRequest } from "@/types/user";

const IS_TEST = import.meta.env.MODE === "test";
const STORAGE_KEY = "corelasi_users_db";

const createSeedUsers = (): UserDetail[] =>
  MOCK_USERS_LIST.map((user) => ({
    ...user,
    assignments: user.assignments ? { ...user.assignments } : undefined,
  }));

const getDb = (): UserDetail[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const seededUsers = createSeedUsers();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seededUsers));
    return seededUsers;
  }
  try {
    const db = JSON.parse(data) as UserDetail[];
    const verifiedDb = db.map((user) => {
      if (user.password) return user;
      return { ...user, password: "password123" };
    });
    if (verifiedDb.some((user, index) => user !== db[index])) {
      saveDb(verifiedDb);
    }
    return verifiedDb;
  } catch {
    return createSeedUsers();
  }
};

const saveDb = (db: UserDetail[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const userService = {
  getAll: async (): Promise<UserDetail[]> => {
    if (!IS_TEST) {
      return apiGet<UserDetail[]>("/users/");
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getDb());
      }, 300);
    });
  },

  getById: async (id: string): Promise<UserDetail | null> => {
    if (!IS_TEST) {
      return apiGet<UserDetail>(`/users/${id}/`);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getDb();
        const user = db.find((u) => u.id === id);
        resolve(user || null);
      }, 200);
    });
  },

  create: async (user: Omit<UserDetail, "id">): Promise<UserDetail> => {
    if (!IS_TEST) {
      return apiPost<UserDetail>("/users/", user);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getDb();
        const newUser: UserDetail = {
          ...user,
          id: String(Date.now()),
        };
        saveDb([...db, newUser]);
        resolve(newUser);
      }, 400);
    });
  },

  update: async (
    id: string,
    updatedFields: Partial<UserDetail>,
  ): Promise<UserDetail> => {
    if (!IS_TEST) {
      return apiPatch<UserDetail>(`/users/${id}/`, updatedFields);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = getDb();
        const index = db.findIndex((u) => u.id === id);
        if (index === -1) {
          reject(new Error("User tidak ditemukan"));
          return;
        }

        // If password is being updated, resolve any pending reset requests for this user's email
        if (updatedFields.password) {
          const reqData = localStorage.getItem("corelasi_reset_requests");
          if (reqData) {
            try {
              let requests: ResetRequest[] = JSON.parse(reqData);
              const userEmail = db[index].email;
              requests = requests.map((r) => {
                if (
                  r.email.toLowerCase().trim() ===
                    userEmail.toLowerCase().trim() &&
                  r.status === "pending"
                ) {
                  return { ...r, status: "resolved" as const };
                }
                return r;
              });
              localStorage.setItem(
                "corelasi_reset_requests",
                JSON.stringify(requests),
              );
            } catch {
              // Ignore errors
            }
          }
        }

        const updatedUser = { ...db[index], ...updatedFields };
        saveDb(
          db.map((user, userIndex) =>
            userIndex === index ? updatedUser : user,
          ),
        );
        resolve(updatedUser);
      }, 400);
    });
  },

  delete: async (id: string): Promise<void> => {
    if (!IS_TEST) {
      return apiDelete(`/users/${id}/`);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = getDb();
        const filtered = db.filter((u) => u.id !== id);
        if (filtered.length === db.length) {
          reject(new Error("User tidak ditemukan"));
          return;
        }
        saveDb(filtered);
        resolve();
      }, 300);
    });
  },

  getPasswordResetRequests: async (): Promise<ResetRequest[]> => {
    if (!IS_TEST) {
      return apiGet<ResetRequest[]>("/users/password-reset-requests/");
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = localStorage.getItem("corelasi_reset_requests");
        if (!data) {
          resolve([]);
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve([]);
        }
      }, 200);
    });
  },

  createPasswordResetRequest: async (email: string): Promise<void> => {
    if (!IS_TEST) {
      // POST requires body with email
      await apiPost("/users/password-reset-requests/", { email });
      return;
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = getDb();
        const user = db.find(
          (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim(),
        );
        if (!user) {
          reject(
            new Error(
              "Email tidak terdaftar di sistem. Silakan periksa kembali email Anda atau hubungi Admin sekolah.",
            ),
          );
          return;
        }

        const data = localStorage.getItem("corelasi_reset_requests");
        let requests: ResetRequest[] = [];
        if (data) {
          try {
            requests = JSON.parse(data);
          } catch {
            requests = [];
          }
        }

        const hasPending = requests.some(
          (r) =>
            r.email.toLowerCase().trim() === email.toLowerCase().trim() &&
            r.status === "pending",
        );
        if (hasPending) {
          reject(
            new Error(
              "Permintaan atur ulang kata sandi Anda sebelumnya masih dalam antrean proses Admin.",
            ),
          );
          return;
        }

        const newRequest: ResetRequest = {
          id: "req-" + Date.now(),
          email: user.email,
          name: user.name,
          role: user.role,
          requestedAt: new Date().toISOString(),
          status: "pending",
        };

        localStorage.setItem(
          "corelasi_reset_requests",
          JSON.stringify([...requests, newRequest]),
        );
        resolve();
      }, 400);
    });
  },

  resolvePasswordResetRequest: async (requestId: string): Promise<string> => {
    if (!IS_TEST) {
      const data = await apiPatch<{ tempPassword: string }>(
        `/users/password-reset-requests/${requestId}/resolve/`,
      );
      return data.tempPassword;
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const data = localStorage.getItem("corelasi_reset_requests");
        let requests: ResetRequest[] = [];
        if (data) {
          try {
            requests = JSON.parse(data);
          } catch {
            requests = [];
          }
        }

        const reqIndex = requests.findIndex((r) => r.id === requestId);
        if (reqIndex === -1) {
          reject(new Error("Permintaan tidak ditemukan."));
          return;
        }

        const request = requests[reqIndex];
        const tempPassword =
          "pwd-" + Math.floor(100000 + Math.random() * 900000);

        try {
          // Find user by email in db
          const db = getDb();
          const userIndex = db.findIndex(
            (u) =>
              u.email.toLowerCase().trim() ===
              request.email.toLowerCase().trim(),
          );
          if (userIndex !== -1) {
            saveDb(
              db.map((user, index) =>
                index === userIndex
                  ? { ...user, password: tempPassword }
                  : user,
              ),
            );
          }

          // Mark request as resolved
          localStorage.setItem(
            "corelasi_reset_requests",
            JSON.stringify(
              requests.map((item, index) =>
                index === reqIndex ? { ...item, status: "resolved" } : item,
              ),
            ),
          );

          resolve(tempPassword);
        } catch {
          reject(new Error("Gagal memproses atur ulang kata sandi."));
        }
      }, 400);
    });
  },
};

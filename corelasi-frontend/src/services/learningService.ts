/**
 * @file src/services/learningService.ts
 * @description Learning service (Materi, Tugas, Submission) for CORELASI.
 *
 * Calls real API endpoints in dev/production, falls back to mocks in test suites.
 */

import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  apiUpload,
} from "@/services/api";
import type { Materi, Tugas, Submission } from "@/types/learning";
import {
  MOCK_MATERI,
  MOCK_TUGAS,
  MOCK_SUBMISSIONS,
} from "@/mocks/learning.mock";

const IS_TEST = import.meta.env.MODE === "test";

const STORAGE_KEYS = {
  MATERI: "corelasi_learning_materi",
  TUGAS: "corelasi_learning_tugas",
  SUBMISSIONS: "corelasi_learning_submissions",
};

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const learningService = {
  async uploadFile(file: File): Promise<string> {
    if (IS_TEST) {
      return `https://mock.corelasi.test/uploads/${encodeURIComponent(file.name)}`;
    }

    const formData = new FormData();
    formData.append("file", file);
    const response = await apiUpload<{ fileUrl: string }>(
      "/learning/upload/",
      formData,
    );
    return response.fileUrl;
  },

  // --- MATERI ---
  async getMateri(): Promise<Materi[]> {
    if (!IS_TEST) {
      return apiGet<Materi[]>("/learning/materi/");
    }
    await delay();
    const stored = localStorage.getItem(STORAGE_KEYS.MATERI);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.MATERI, JSON.stringify(MOCK_MATERI));
      return MOCK_MATERI;
    }
    return JSON.parse(stored);
  },

  async getMateriById(id: string): Promise<Materi | null> {
    if (!IS_TEST) {
      try {
        return await apiGet<Materi>(`/learning/materi/${id}/`);
      } catch {
        return null;
      }
    }
    const list = await this.getMateri();
    return list.find((m) => m.id === id) || null;
  },

  async getMateriByKelas(kelasId: string): Promise<Materi[]> {
    if (!IS_TEST) {
      return apiGet<Materi[]>("/learning/materi/", { kelasId });
    }
    const list = await this.getMateri();
    return list.filter(
      (m) => m.kelasId === kelasId && m.status === "Dipublikasikan",
    );
  },

  async getMateriByGuru(guruId: string): Promise<Materi[]> {
    if (!IS_TEST) {
      return apiGet<Materi[]>("/learning/materi/", { guruId });
    }
    const list = await this.getMateri();
    return list.filter((m) => m.guruId === guruId);
  },

  async createMateri(
    input: Omit<Materi, "id" | "dateCreated">,
  ): Promise<Materi> {
    if (!IS_TEST) {
      return apiPost<Materi>("/learning/materi/", input);
    }
    await delay();
    const list = await this.getMateri();
    const newItem: Materi = {
      ...input,
      id: `mat-${Date.now()}`,
      dateCreated: new Date().toISOString().split("T")[0],
    };
    const updated = [...list, newItem];
    localStorage.setItem(STORAGE_KEYS.MATERI, JSON.stringify(updated));
    return newItem;
  },

  async updateMateri(id: string, input: Partial<Materi>): Promise<Materi> {
    if (!IS_TEST) {
      return apiPatch<Materi>(`/learning/materi/${id}/`, input);
    }
    await delay();
    const list = await this.getMateri();
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Materi tidak ditemukan");
    const updatedItem = { ...list[idx], ...input };
    const updatedList = [...list];
    updatedList[idx] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.MATERI, JSON.stringify(updatedList));
    return updatedItem;
  },

  async deleteMateri(id: string): Promise<boolean> {
    if (!IS_TEST) {
      await apiDelete(`/learning/materi/${id}/`);
      return true;
    }
    await delay();
    const list = await this.getMateri();
    const filtered = list.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MATERI, JSON.stringify(filtered));
    return true;
  },

  // --- TUGAS ---
  async getTugas(): Promise<Tugas[]> {
    if (!IS_TEST) {
      return apiGet<Tugas[]>("/learning/tugas/");
    }
    await delay();
    const stored = localStorage.getItem(STORAGE_KEYS.TUGAS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.TUGAS, JSON.stringify(MOCK_TUGAS));
      return MOCK_TUGAS;
    }
    return JSON.parse(stored);
  },

  async getTugasById(id: string): Promise<Tugas | null> {
    if (!IS_TEST) {
      try {
        return await apiGet<Tugas>(`/learning/tugas/${id}/`);
      } catch {
        return null;
      }
    }
    const list = await this.getTugas();
    return list.find((t) => t.id === id) || null;
  },

  async getTugasByKelas(kelasId: string): Promise<Tugas[]> {
    if (!IS_TEST) {
      return apiGet<Tugas[]>("/learning/tugas/", { kelasId });
    }
    const list = await this.getTugas();
    return list.filter(
      (t) => t.kelasId === kelasId && t.status === "Dipublikasikan",
    );
  },

  async getTugasByGuru(guruId: string): Promise<Tugas[]> {
    if (!IS_TEST) {
      return apiGet<Tugas[]>("/learning/tugas/", { guruId });
    }
    const list = await this.getTugas();
    return list.filter((t) => t.guruId === guruId);
  },

  async createTugas(input: Omit<Tugas, "id" | "dateCreated">): Promise<Tugas> {
    if (!IS_TEST) {
      return apiPost<Tugas>("/learning/tugas/", input);
    }
    await delay();
    const list = await this.getTugas();
    const newItem: Tugas = {
      ...input,
      id: `tug-${Date.now()}`,
      dateCreated: new Date().toISOString().split("T")[0],
    };
    const updated = [...list, newItem];
    localStorage.setItem(STORAGE_KEYS.TUGAS, JSON.stringify(updated));
    return newItem;
  },

  async updateTugas(id: string, input: Partial<Tugas>): Promise<Tugas> {
    if (!IS_TEST) {
      return apiPatch<Tugas>(`/learning/tugas/${id}/`, input);
    }
    await delay();
    const list = await this.getTugas();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Tugas tidak ditemukan");
    const updatedItem = { ...list[idx], ...input };
    const updatedList = [...list];
    updatedList[idx] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.TUGAS, JSON.stringify(updatedList));
    return updatedItem;
  },

  async deleteTugas(id: string): Promise<boolean> {
    if (!IS_TEST) {
      await apiDelete(`/learning/tugas/${id}/`);
      return true;
    }
    await delay();
    const list = await this.getTugas();
    const filtered = list.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TUGAS, JSON.stringify(filtered));
    return true;
  },

  // --- SUBMISSIONS ---
  async getSubmissions(): Promise<Submission[]> {
    if (!IS_TEST) {
      return apiGet<Submission[]>("/learning/submissions/");
    }
    await delay();
    const stored = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (!stored) {
      localStorage.setItem(
        STORAGE_KEYS.SUBMISSIONS,
        JSON.stringify(MOCK_SUBMISSIONS),
      );
      return MOCK_SUBMISSIONS;
    }
    return JSON.parse(stored);
  },

  async getSubmissionsByTugas(tugasId: string): Promise<Submission[]> {
    if (!IS_TEST) {
      return apiGet<Submission[]>("/learning/submissions/", { tugasId });
    }
    const list = await this.getSubmissions();
    return list.filter((s) => s.tugasId === tugasId);
  },

  async getSubmissionForStudent(
    tugasId: string,
    siswaId: string,
  ): Promise<Submission | null> {
    if (!IS_TEST) {
      const list = await apiGet<Submission[]>("/learning/submissions/", {
        tugasId,
        siswaId,
      });
      return list.length > 0 ? list[0] : null;
    }
    const list = await this.getSubmissions();
    return (
      list.find((s) => s.tugasId === tugasId && s.siswaId === siswaId) || null
    );
  },

  async submitTugasSolution(
    tugasId: string,
    siswaId: string,
    siswaName: string,
    fileUrl: string,
  ): Promise<Submission> {
    if (!IS_TEST) {
      return apiPost<Submission>("/learning/submissions/", {
        tugasId,
        siswaId,
        fileUrl,
      });
    }
    await delay();
    const list = await this.getSubmissions();

    // Check if student has already submitted
    const idx = list.findIndex(
      (s) => s.tugasId === tugasId && s.siswaId === siswaId,
    );

    const targetTugas = await this.getTugasById(tugasId);
    if (!targetTugas) throw new Error("Tugas tidak ditemukan.");

    const todayStr = new Date().toISOString().split("T")[0];
    const isLate = todayStr > targetTugas.dueDate;
    const status = isLate ? "Late" : "Terkumpul";

    let resultItem: Submission;

    if (idx !== -1) {
      // Update existing submission
      resultItem = {
        ...list[idx],
        submitDate: todayStr,
        fileUrl,
        status,
      };
      const updatedList = [...list];
      updatedList[idx] = resultItem;
      localStorage.setItem(
        STORAGE_KEYS.SUBMISSIONS,
        JSON.stringify(updatedList),
      );
    } else {
      // Create new submission record
      resultItem = {
        id: `sub-${Date.now()}`,
        tugasId,
        siswaId,
        siswaName,
        submitDate: todayStr,
        fileUrl,
        status,
      };
      const updatedList = [...list, resultItem];
      localStorage.setItem(
        STORAGE_KEYS.SUBMISSIONS,
        JSON.stringify(updatedList),
      );
    }
    return resultItem;
  },

  async gradeSubmission(
    id: string,
    grade: number,
    feedback: string,
  ): Promise<Submission> {
    if (!IS_TEST) {
      return apiPatch<Submission>(`/learning/submissions/${id}/grade/`, {
        grade,
        feedback,
      });
    }
    await delay();
    const list = await this.getSubmissions();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Pengumpulan tidak ditemukan.");

    const updatedItem = {
      ...list[idx],
      grade,
      feedback,
    };
    const updatedList = [...list];
    updatedList[idx] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(updatedList));
    return updatedItem;
  },
};

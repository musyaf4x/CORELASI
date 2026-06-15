/**
 * @file src/services/academicService.ts
 * @description Academic structure service for CORELASI.
 *
 * Calls real API endpoints in dev/production, falls back to mocks in test suites.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from "@/services/api";
import {
  MOCK_TAHUN_AJARAN,
  MOCK_SEMESTER,
  MOCK_KELAS,
  MOCK_MAPEL,
} from "@/mocks/academic.mock";
import type {
  TahunAjaran,
  Semester,
  Kelas,
  MataPelajaran,
} from "@/types/academic";

const IS_TEST = import.meta.env.MODE === "test";

const KEY_TA = "corelasi_ta_db";
const KEY_SEM = "corelasi_sem_db";
const KEY_KELAS = "corelasi_kelas_db";
const KEY_MAPEL = "corelasi_mapel_db";

const getTaDb = (): TahunAjaran[] => {
  const data = localStorage.getItem(KEY_TA);
  if (!data) {
    localStorage.setItem(KEY_TA, JSON.stringify(MOCK_TAHUN_AJARAN));
    return MOCK_TAHUN_AJARAN;
  }
  try {
    return JSON.parse(data);
  } catch {
    return MOCK_TAHUN_AJARAN;
  }
};
const saveTaDb = (db: TahunAjaran[]) =>
  localStorage.setItem(KEY_TA, JSON.stringify(db));

const getSemDb = (): Semester[] => {
  const data = localStorage.getItem(KEY_SEM);
  if (!data) {
    localStorage.setItem(KEY_SEM, JSON.stringify(MOCK_SEMESTER));
    return MOCK_SEMESTER;
  }
  try {
    return JSON.parse(data);
  } catch {
    return MOCK_SEMESTER;
  }
};
const saveSemDb = (db: Semester[]) =>
  localStorage.setItem(KEY_SEM, JSON.stringify(db));

const getKelasDb = (): Kelas[] => {
  const data = localStorage.getItem(KEY_KELAS);
  if (!data) {
    localStorage.setItem(KEY_KELAS, JSON.stringify(MOCK_KELAS));
    return MOCK_KELAS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return MOCK_KELAS;
  }
};
const saveKelasDb = (db: Kelas[]) =>
  localStorage.setItem(KEY_KELAS, JSON.stringify(db));

const getMapelDb = (): MataPelajaran[] => {
  const data = localStorage.getItem(KEY_MAPEL);
  if (!data) {
    localStorage.setItem(KEY_MAPEL, JSON.stringify(MOCK_MAPEL));
    return MOCK_MAPEL;
  }
  try {
    return JSON.parse(data);
  } catch {
    return MOCK_MAPEL;
  }
};
const saveMapelDb = (db: MataPelajaran[]) =>
  localStorage.setItem(KEY_MAPEL, JSON.stringify(db));

export const academicService = {
  // Tahun Ajaran
  getTahunAjaran: async (): Promise<TahunAjaran[]> => {
    if (!IS_TEST) {
      return apiGet<TahunAjaran[]>("/academic/tahun-ajaran/");
    }
    return new Promise((resolve) => {
      setTimeout(() => resolve(getTaDb()), 200);
    });
  },
  createTahunAjaran: async (
    ta: Omit<TahunAjaran, "id">,
  ): Promise<TahunAjaran> => {
    if (!IS_TEST) {
      return apiPost<TahunAjaran>("/academic/tahun-ajaran/", ta);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getTaDb();
        const newTa: TahunAjaran = { ...ta, id: "ta-" + Date.now() };
        db.push(newTa);
        saveTaDb(db);
        resolve(newTa);
      }, 300);
    });
  },
  updateTahunAjaran: async (
    id: string,
    updated: Partial<TahunAjaran>,
  ): Promise<TahunAjaran> => {
    if (!IS_TEST) {
      return apiPatch<TahunAjaran>(`/academic/tahun-ajaran/${id}/`, updated);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = getTaDb();
        const index = db.findIndex((x) => x.id === id);
        if (index === -1)
          return reject(new Error("Tahun ajaran tidak ditemukan"));
        const newTa = { ...db[index], ...updated };
        db[index] = newTa;
        saveTaDb(db);
        resolve(newTa);
      }, 300);
    });
  },
  deleteTahunAjaran: async (id: string): Promise<void> => {
    if (!IS_TEST) {
      return apiDelete(`/academic/tahun-ajaran/${id}/`);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = getTaDb();
        const filtered = db.filter((x) => x.id !== id);
        if (filtered.length === db.length)
          return reject(new Error("Tahun ajaran tidak ditemukan"));
        saveTaDb(filtered);
        resolve();
      }, 300);
    });
  },

  // Semester
  getSemester: async (): Promise<Semester[]> => {
    if (!IS_TEST) {
      return apiGet<Semester[]>("/academic/semester/");
    }
    return new Promise((resolve) => {
      setTimeout(() => resolve(getSemDb()), 200);
    });
  },
  createSemester: async (sem: Omit<Semester, "id">): Promise<Semester> => {
    if (!IS_TEST) {
      return apiPost<Semester>("/academic/semester/", sem);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getSemDb();
        const newSem: Semester = { ...sem, id: "sem-" + Date.now() };
        db.push(newSem);
        saveSemDb(db);
        resolve(newSem);
      }, 300);
    });
  },
  updateSemester: async (
    id: string,
    updated: Partial<Semester>,
  ): Promise<Semester> => {
    if (!IS_TEST) {
      return apiPatch<Semester>(`/academic/semester/${id}/`, updated);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = getSemDb();
        const index = db.findIndex((x) => x.id === id);
        if (index === -1) return reject(new Error("Semester tidak ditemukan"));
        const newSem = { ...db[index], ...updated };
        db[index] = newSem;
        saveSemDb(db);
        resolve(newSem);
      }, 300);
    });
  },
  deleteSemester: async (id: string): Promise<void> => {
    if (!IS_TEST) {
      return apiDelete(`/academic/semester/${id}/`);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = getSemDb();
        const filtered = db.filter((x) => x.id !== id);
        if (filtered.length === db.length)
          return reject(new Error("Semester tidak ditemukan"));
        saveSemDb(filtered);
        resolve();
      }, 300);
    });
  },

  // Kelas
  getKelas: async (): Promise<Kelas[]> => {
    if (!IS_TEST) {
      return apiGet<Kelas[]>("/academic/kelas/");
    }
    return new Promise((resolve) => {
      setTimeout(() => resolve(getKelasDb()), 200);
    });
  },
  createKelas: async (k: Omit<Kelas, "id">): Promise<Kelas> => {
    if (!IS_TEST) {
      return apiPost<Kelas>("/academic/kelas/", k);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getKelasDb();
        const newKelas: Kelas = { ...k, id: "k-" + Date.now() };
        db.push(newKelas);
        saveKelasDb(db);
        resolve(newKelas);
      }, 300);
    });
  },
  updateKelas: async (id: string, updated: Partial<Kelas>): Promise<Kelas> => {
    if (!IS_TEST) {
      return apiPatch<Kelas>(`/academic/kelas/${id}/`, updated);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = getKelasDb();
        const index = db.findIndex((x) => x.id === id);
        if (index === -1) return reject(new Error("Kelas tidak ditemukan"));
        const newKelas = { ...db[index], ...updated };
        db[index] = newKelas;
        saveKelasDb(db);
        resolve(newKelas);
      }, 300);
    });
  },
  deleteKelas: async (id: string): Promise<void> => {
    if (!IS_TEST) {
      return apiDelete(`/academic/kelas/${id}/`);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = getKelasDb();
        const filtered = db.filter((x) => x.id !== id);
        if (filtered.length === db.length)
          return reject(new Error("Kelas tidak ditemukan"));
        saveKelasDb(filtered);
        resolve();
      }, 300);
    });
  },

  // Mata Pelajaran
  getMapel: async (): Promise<MataPelajaran[]> => {
    if (!IS_TEST) {
      return apiGet<MataPelajaran[]>("/academic/mapel/");
    }
    return new Promise((resolve) => {
      setTimeout(() => resolve(getMapelDb()), 200);
    });
  },
  createMapel: async (
    mp: Omit<MataPelajaran, "id">,
  ): Promise<MataPelajaran> => {
    if (!IS_TEST) {
      return apiPost<MataPelajaran>("/academic/mapel/", mp);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getMapelDb();
        const newMapel: MataPelajaran = { ...mp, id: "mp-" + Date.now() };
        db.push(newMapel);
        saveMapelDb(db);
        resolve(newMapel);
      }, 300);
    });
  },
  updateMapel: async (
    id: string,
    updated: Partial<MataPelajaran>,
  ): Promise<MataPelajaran> => {
    if (!IS_TEST) {
      return apiPatch<MataPelajaran>(`/academic/mapel/${id}/`, updated);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = getMapelDb();
        const index = db.findIndex((x) => x.id === id);
        if (index === -1)
          return reject(new Error("Mata pelajaran tidak ditemukan"));
        const newMapel = { ...db[index], ...updated };
        db[index] = newMapel;
        saveMapelDb(db);
        resolve(newMapel);
      }, 300);
    });
  },
  deleteMapel: async (id: string): Promise<void> => {
    if (!IS_TEST) {
      return apiDelete(`/academic/mapel/${id}/`);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = getMapelDb();
        const filtered = db.filter((x) => x.id !== id);
        if (filtered.length === db.length)
          return reject(new Error("Mata pelajaran tidak ditemukan"));
        saveMapelDb(filtered);
        resolve();
      }, 300);
    });
  },
};

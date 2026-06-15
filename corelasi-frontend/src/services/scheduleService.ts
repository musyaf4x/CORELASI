/**
 * @file src/services/scheduleService.ts
 * @description Schedule service for CORELASI.
 *
 * Calls real API endpoints in dev/production, falls back to mocks in test suites.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from "@/services/api";
import type { JadwalPembelajaran, JadwalPiket } from "@/types/schedule";
import {
  MOCK_JADWAL_PEMBELAJARAN,
  MOCK_JADWAL_PIKET,
} from "@/mocks/schedules.mock";

const IS_TEST = import.meta.env.MODE === "test";

const STORAGE_KEYS = {
  PEMBELAJARAN: "corelasi_schedule_pembelajaran",
  PIKET: "corelasi_schedule_piket",
};

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const scheduleService = {
  // --- JADWAL PEMBELAJARAN ---
  async getJadwalPembelajaran(): Promise<JadwalPembelajaran[]> {
    if (!IS_TEST) {
      return apiGet<JadwalPembelajaran[]>("/schedules/pembelajaran/");
    }
    await delay();
    const stored = localStorage.getItem(STORAGE_KEYS.PEMBELAJARAN);
    if (!stored) {
      localStorage.setItem(
        STORAGE_KEYS.PEMBELAJARAN,
        JSON.stringify(MOCK_JADWAL_PEMBELAJARAN),
      );
      return MOCK_JADWAL_PEMBELAJARAN;
    }
    return JSON.parse(stored);
  },

  async getJadwalPembelajaranById(
    id: string,
  ): Promise<JadwalPembelajaran | null> {
    if (!IS_TEST) {
      return apiGet<JadwalPembelajaran>(`/schedules/pembelajaran/${id}/`);
    }
    const list = await this.getJadwalPembelajaran();
    return list.find((s) => s.id === id) || null;
  },

  async createJadwalPembelajaran(
    input: Omit<JadwalPembelajaran, "id">,
  ): Promise<JadwalPembelajaran> {
    if (!IS_TEST) {
      return apiPost<JadwalPembelajaran>("/schedules/pembelajaran/", input);
    }
    await delay();
    const list = await this.getJadwalPembelajaran();
    const newItem: JadwalPembelajaran = {
      ...input,
      id: `sch-${Date.now()}`,
    };
    const updated = [...list, newItem];
    localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(updated));
    return newItem;
  },

  async updateJadwalPembelajaran(
    id: string,
    input: Partial<JadwalPembelajaran>,
  ): Promise<JadwalPembelajaran> {
    if (!IS_TEST) {
      return apiPatch<JadwalPembelajaran>(
        `/schedules/pembelajaran/${id}/`,
        input,
      );
    }
    await delay();
    const list = await this.getJadwalPembelajaran();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Jadwal pembelajaran tidak ditemukan");
    const updatedItem = { ...list[idx], ...input };
    const updatedList = [...list];
    updatedList[idx] = updatedItem;
    localStorage.setItem(
      STORAGE_KEYS.PEMBELAJARAN,
      JSON.stringify(updatedList),
    );
    return updatedItem;
  },

  async deleteJadwalPembelajaran(id: string): Promise<boolean> {
    if (!IS_TEST) {
      await apiDelete(`/schedules/pembelajaran/${id}/`);
      return true;
    }
    await delay();
    const list = await this.getJadwalPembelajaran();
    const filtered = list.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(filtered));
    return true;
  },

  // --- JADWAL PIKET ---
  async getJadwalPiket(): Promise<JadwalPiket[]> {
    if (!IS_TEST) {
      return apiGet<JadwalPiket[]>("/schedules/piket/");
    }
    await delay();
    const stored = localStorage.getItem(STORAGE_KEYS.PIKET);
    if (!stored) {
      localStorage.setItem(
        STORAGE_KEYS.PIKET,
        JSON.stringify(MOCK_JADWAL_PIKET),
      );
      return MOCK_JADWAL_PIKET;
    }
    return JSON.parse(stored);
  },

  async getJadwalPiketById(id: string): Promise<JadwalPiket | null> {
    if (!IS_TEST) {
      return apiGet<JadwalPiket>(`/schedules/piket/${id}/`);
    }
    const list = await this.getJadwalPiket();
    return list.find((p) => p.id === id) || null;
  },

  async createJadwalPiket(
    input: Omit<JadwalPiket, "id">,
  ): Promise<JadwalPiket> {
    if (!IS_TEST) {
      return apiPost<JadwalPiket>("/schedules/piket/", input);
    }
    await delay();
    const list = await this.getJadwalPiket();
    const newItem: JadwalPiket = {
      ...input,
      id: `pkt-${Date.now()}`,
    };
    const updated = [...list, newItem];
    localStorage.setItem(STORAGE_KEYS.PIKET, JSON.stringify(updated));
    return newItem;
  },

  async updateJadwalPiket(
    id: string,
    input: Partial<JadwalPiket>,
  ): Promise<JadwalPiket> {
    if (!IS_TEST) {
      return apiPatch<JadwalPiket>(`/schedules/piket/${id}/`, input);
    }
    await delay();
    const list = await this.getJadwalPiket();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Jadwal piket tidak ditemukan");
    const updatedItem = { ...list[idx], ...input };
    const updatedList = [...list];
    updatedList[idx] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.PIKET, JSON.stringify(updatedList));
    return updatedItem;
  },

  async deleteJadwalPiket(id: string): Promise<boolean> {
    if (!IS_TEST) {
      await apiDelete(`/schedules/piket/${id}/`);
      return true;
    }
    await delay();
    const list = await this.getJadwalPiket();
    const filtered = list.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PIKET, JSON.stringify(filtered));
    return true;
  },
};

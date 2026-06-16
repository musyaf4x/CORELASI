/**
 * @file src/services/journalService.ts
 * @description Journal (Jurnal Pertemuan) service for CORELASI.
 *
 * Calls real API endpoints in dev/production, falls back to mocks in test suites.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from "@/services/api";
import type { JurnalPertemuan } from "@/types/journal";
import { MOCK_JOURNALS } from "@/mocks/journals.mock";

const IS_TEST = import.meta.env.MODE === "test";

const STORAGE_KEY = "corelasi_journals";
const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const journalService = {
  async getJournals(): Promise<JurnalPertemuan[]> {
    if (!IS_TEST) {
      return apiGet<JurnalPertemuan[]>("/journals/");
    }
    await delay();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_JOURNALS));
      return MOCK_JOURNALS;
    }
    return JSON.parse(stored);
  },

  async getJournalById(id: string): Promise<JurnalPertemuan | null> {
    if (!IS_TEST) {
      try {
        return await apiGet<JurnalPertemuan>(`/journals/${id}/`);
      } catch {
        return null;
      }
    }
    const list = await this.getJournals();
    return list.find((j) => j.id === id) || null;
  },

  async getJournalsByGuru(guruId: string): Promise<JurnalPertemuan[]> {
    if (!IS_TEST) {
      return apiGet<JurnalPertemuan[]>("/journals/", { guruId });
    }
    const list = await this.getJournals();
    return list.filter((j) => j.guruId === guruId);
  },

  async getJournalsByKelas(kelasId: string): Promise<JurnalPertemuan[]> {
    if (!IS_TEST) {
      return apiGet<JurnalPertemuan[]>("/journals/", { kelasId });
    }
    const list = await this.getJournals();
    return list.filter((j) => j.kelasId === kelasId);
  },

  async createJournal(
    input: Omit<JurnalPertemuan, "id">,
  ): Promise<JurnalPertemuan> {
    if (!IS_TEST) {
      return apiPost<JurnalPertemuan>("/journals/", input);
    }
    await delay();
    const list = await this.getJournals();
    const newItem: JurnalPertemuan = {
      ...input,
      id: `jr-${Date.now()}`,
    };
    const updated = [...list, newItem];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newItem;
  },

  async updateJournal(
    id: string,
    input: Partial<JurnalPertemuan>,
  ): Promise<JurnalPertemuan> {
    if (!IS_TEST) {
      return apiPatch<JurnalPertemuan>(`/journals/${id}/`, input);
    }
    await delay();
    const list = await this.getJournals();
    const idx = list.findIndex((j) => j.id === id);
    if (idx === -1) throw new Error("Jurnal pertemuan tidak ditemukan");
    const updatedItem = { ...list[idx], ...input };
    const updatedList = [...list];
    updatedList[idx] = updatedItem;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    return updatedItem;
  },

  async deleteJournal(id: string): Promise<boolean> {
    if (!IS_TEST) {
      await apiDelete(`/journals/${id}/`);
      return true;
    }
    await delay();
    const list = await this.getJournals();
    const filtered = list.filter((j) => j.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },
};

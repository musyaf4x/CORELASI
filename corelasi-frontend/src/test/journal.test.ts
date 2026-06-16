import { describe, it, expect, beforeEach } from "vitest";
import { journalService } from "../services/journalService";

describe("Journal Service Mock Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should fetch initial journals list", async () => {
    const list = await journalService.getJournals();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("agenda");
  });

  it("should retrieve a journal by its id", async () => {
    const list = await journalService.getJournals();
    const first = list[0];
    const match = await journalService.getJournalById(first.id);
    expect(match).not.toBeNull();
    expect(match?.id).toBe(first.id);
  });

  it("should filter journals by teacher ID", async () => {
    const list = await journalService.getJournalsByGuru("2");
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((j) => j.guruId === "2")).toBe(true);
  });

  it("should filter journals by class ID", async () => {
    const list = await journalService.getJournalsByKelas("k-2");
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((j) => j.kelasId === "k-2")).toBe(true);
  });

  it("should log a new meeting journal", async () => {
    const newJournal = {
      date: "2026-06-03",
      kelasId: "k-1",
      kelasName: "X-A",
      mapelId: "mp-1",
      mapelName: "Matematika",
      guruId: "3",
      guruName: "Siti Aminah, S.Pd.",
      agenda: "Sistem Persamaan Linier Dua Variabel",
      materialSummary:
        "Penjelasan metode eliminasi dan substitusi disertai contoh penyelesaian SPLDV.",
      presentCount: 29,
      absentCount: 1,
      notes: "Satu siswa absen sakit.",
    };

    const created = await journalService.createJournal(newJournal);
    expect(created.id).toBeDefined();
    expect(created.agenda).toBe("Sistem Persamaan Linier Dua Variabel");

    const list = await journalService.getJournalsByGuru("3");
    expect(list.some((j) => j.id === created.id)).toBe(true);
  });

  it("should update a logged journal entry", async () => {
    const list = await journalService.getJournals();
    const first = list[0];

    const updated = await journalService.updateJournal(first.id, {
      agenda: "Agenda Diperbarui",
    });
    expect(updated.agenda).toBe("Agenda Diperbarui");
  });

  it("should delete a journal entry", async () => {
    const list = await journalService.getJournals();
    const first = list[0];

    const success = await journalService.deleteJournal(first.id);
    expect(success).toBe(true);

    const match = await journalService.getJournalById(first.id);
    expect(match).toBeNull();
  });
});

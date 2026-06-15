import { describe, it, expect, beforeEach } from "vitest";
import { scheduleService } from "../services/scheduleService";

describe("Schedule Service Mock Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Jadwal Pembelajaran", () => {
    it("should fetch initial learning schedules successfully", async () => {
      const list = await scheduleService.getJadwalPembelajaran();
      expect(list.length).toBeGreaterThan(0);
      expect(list[0]).toHaveProperty("kelasName");
    });

    it("should retrieve a learning schedule by its id", async () => {
      const list = await scheduleService.getJadwalPembelajaran();
      const first = list[0];
      const match = await scheduleService.getJadwalPembelajaranById(first.id);
      expect(match).not.toBeNull();
      expect(match?.id).toBe(first.id);
    });

    it("should create a new learning schedule record", async () => {
      const newSchedule = {
        kelasId: "k-1",
        kelasName: "X-A",
        mapelId: "mp-1",
        mapelName: "Matematika",
        guruId: "3",
        guruName: "Siti Aminah, S.Pd.",
        hari: "Senin" as const,
        waktuMulai: "13:00",
        waktuSelesai: "14:30",
      };

      const created =
        await scheduleService.createJadwalPembelajaran(newSchedule);
      expect(created.id).toBeDefined();
      expect(created.waktuMulai).toBe("13:00");

      const currentList = await scheduleService.getJadwalPembelajaran();
      const exists = currentList.find((s) => s.id === created.id);
      expect(exists).toBeDefined();
    });

    it("should update an existing learning schedule", async () => {
      const list = await scheduleService.getJadwalPembelajaran();
      const first = list[0];

      const updated = await scheduleService.updateJadwalPembelajaran(first.id, {
        waktuMulai: "08:00",
      });
      expect(updated.waktuMulai).toBe("08:00");

      const match = await scheduleService.getJadwalPembelajaranById(first.id);
      expect(match?.waktuMulai).toBe("08:00");
    });

    it("should delete a learning schedule", async () => {
      const list = await scheduleService.getJadwalPembelajaran();
      const first = list[0];

      const deleted = await scheduleService.deleteJadwalPembelajaran(first.id);
      expect(deleted).toBe(true);

      const match = await scheduleService.getJadwalPembelajaranById(first.id);
      expect(match).toBeNull();
    });
  });

  describe("Jadwal Piket", () => {
    it("should fetch initial duty schedules successfully", async () => {
      const list = await scheduleService.getJadwalPiket();
      expect(list.length).toBeGreaterThan(0);
    });

    it("should retrieve a duty schedule by id", async () => {
      const list = await scheduleService.getJadwalPiket();
      const first = list[0];
      const match = await scheduleService.getJadwalPiketById(first.id);
      expect(match).not.toBeNull();
      expect(match?.id).toBe(first.id);
    });

    it("should create a new duty schedule", async () => {
      const newPiket = {
        guruId: "2",
        guruName: "Budi Santoso, M.Pd.",
        hari: "Sabtu" as const,
      };

      const created = await scheduleService.createJadwalPiket(newPiket);
      expect(created.id).toBeDefined();
      expect(created.hari).toBe("Sabtu");
    });

    it("should update an existing duty schedule", async () => {
      const list = await scheduleService.getJadwalPiket();
      const first = list[0];

      const updated = await scheduleService.updateJadwalPiket(first.id, {
        hari: "Jumat",
      });
      expect(updated.hari).toBe("Jumat");
    });

    it("should delete a duty schedule", async () => {
      const list = await scheduleService.getJadwalPiket();
      const first = list[0];

      const deleted = await scheduleService.deleteJadwalPiket(first.id);
      expect(deleted).toBe(true);

      const match = await scheduleService.getJadwalPiketById(first.id);
      expect(match).toBeNull();
    });
  });
});

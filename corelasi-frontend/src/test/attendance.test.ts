import { describe, it, expect, beforeEach } from "vitest";
import { attendanceService } from "../services/attendanceService";

describe("Attendance Service Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should fetch initial student attendance logs", async () => {
    const list = await attendanceService.getAbsensiSiswa();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("siswaName");
  });

  it("should filter attendance logs by class and date", async () => {
    const list = await attendanceService.getAbsensiSiswaByKelas(
      "k-1",
      "2026-06-01",
    );
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].kelasId).toBe("k-1");
    expect(list[0].tanggal).toBe("2026-06-01");
  });

  it("should submit new/updated attendance records", async () => {
    const record = {
      id: "att-test",
      siswaId: "4",
      siswaName: "Rian Hidayat",
      nis: "25261001",
      kelasId: "k-2",
      kelasName: "XI-A",
      mapelId: "mp-1",
      mapelName: "Matematika",
      tanggal: "2026-06-02",
      status: "Sakit" as const,
      keterangan: "Sakit kepala",
    };

    const success = await attendanceService.submitAbsensiSiswa([record]);
    expect(success).toBe(true);

    const list = await attendanceService.getAbsensiSiswaByKelas(
      "k-2",
      "2026-06-02",
    );
    const matched = list.find((a) => a.siswaId === "4");
    expect(matched).toBeDefined();
    expect(matched?.status).toBe("Sakit");
    expect(matched?.keterangan).toBe("Sakit kepala");
  });

  it("should fetch initial correction requests", async () => {
    const list = await attendanceService.getPermintaanKoreksi();
    expect(list.length).toBeGreaterThan(0);
  });

  it("should submit a new correction request", async () => {
    const requestInput = {
      siswaId: "4",
      siswaName: "Rian Hidayat",
      kelasId: "k-2",
      kelasName: "XI-A",
      mapelName: "Fisika",
      statusSemula: "Alpa" as const,
      statusKoreksi: "Hadir" as const,
      keterangan: "Izin surat dokter terlambat",
      tanggal: "2026-06-01",
    };

    const created =
      await attendanceService.submitPermintaanKoreksi(requestInput);
    expect(created.id).toBeDefined();
    expect(created.verified).toBe(false);
    expect(created.keterangan).toBe("Izin surat dokter terlambat");

    const currentList = await attendanceService.getPermintaanKoreksi();
    expect(currentList.some((r) => r.id === created.id)).toBe(true);
  });

  it("should verify a correction request and update attendance state", async () => {
    const requests = await attendanceService.getPermintaanKoreksi();
    const unverified = requests.find((r) => !r.verified);
    expect(unverified).toBeDefined();

    const success = await attendanceService.verifyPermintaanKoreksi(
      unverified!.id,
      "Sakit",
      "Disetujui piket dengan bukti surat",
    );
    expect(success).toBe(true);

    // Check request state is updated to verified
    const updatedRequests = await attendanceService.getPermintaanKoreksi();
    const matchedReq = updatedRequests.find((r) => r.id === unverified!.id);
    expect(matchedReq?.verified).toBe(true);
    expect(matchedReq?.statusKoreksi).toBe("Sakit");
    expect(matchedReq?.keterangan).toBe("Disetujui piket dengan bukti surat");

    // Check actual attendance log state is updated
    const absLogs = await attendanceService.getAbsensiSiswa();
    const matchedAbs = absLogs.find(
      (a) =>
        a.siswaId === unverified!.siswaId &&
        a.kelasId === unverified!.kelasId &&
        a.tanggal === unverified!.tanggal,
    );
    expect(matchedAbs).toBeDefined();
    expect(matchedAbs?.status).toBe("Sakit");
  });

  it("should administrative override student attendance and record initial status", async () => {
    const list = await attendanceService.getAbsensiSiswa();
    const logToOverride = list[0];
    expect(logToOverride).toBeDefined();
    const originalStatus = logToOverride.status;
    const targetStatus = originalStatus === "Hadir" ? "Alpa" : "Hadir";

    const success = await attendanceService.overrideAbsensiSiswa(
      logToOverride.id,
      targetStatus,
      "Keperluan darurat administratif",
    );
    expect(success).toBe(true);

    const updatedList = await attendanceService.getAbsensiSiswa();
    const overriddenLog = updatedList.find((a) => a.id === logToOverride.id);
    expect(overriddenLog).toBeDefined();
    expect(overriddenLog?.status).toBe(targetStatus);
    expect(overriddenLog?.statusAwal).toBe(originalStatus);
    expect(overriddenLog?.keterangan).toContain(
      "Override Admin: Keperluan darurat administratif",
    );
  });
});

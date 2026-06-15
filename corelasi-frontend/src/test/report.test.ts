import { describe, it, expect, beforeEach } from "vitest";
import { reportService } from "../services/reportService";

describe("Report Service Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should compile all student attendance summaries", async () => {
    const list = await reportService.getAttendanceReports();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("percentage");
    expect(list[0]).toHaveProperty("hadir");
    expect(list[0]).toHaveProperty("nis");
  });

  it("should compile attendance summaries filtered by class ID", async () => {
    const list = await reportService.getAttendanceReports("k-1"); // X-A
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((r) => r.kelasName === "X-A")).toBe(true);
  });

  it("should report zero attendance when a student has no records", async () => {
    localStorage.setItem(
      "corelasi_users_db",
      JSON.stringify([
        {
          id: "student-empty",
          name: "Siswa Kosong",
          email: "empty@corelasi.test",
          role: "siswa",
          status: "aktif",
          kelasId: "k-1",
          kelasName: "X-A",
          password: "password123",
        },
      ]),
    );
    localStorage.setItem("corelasi_attendance_siswa", "[]");

    const [report] = await reportService.getAttendanceReports();

    expect(report).toMatchObject({
      hadir: 0,
      sakit: 0,
      izin: 0,
      alpa: 0,
      percentage: 0,
    });
  });

  it("should compile all student grade summaries with averages", async () => {
    const list = await reportService.getGradeReports();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("average");
    expect(list[0]).toHaveProperty("grades");
  });

  it("should compile grade summaries filtered by class ID", async () => {
    const list = await reportService.getGradeReports("k-2"); // XI-A
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((r) => r.kelasName === "XI-A")).toBe(true);
  });

  it("should report a zero average when a student has no graded work", async () => {
    localStorage.setItem(
      "corelasi_users_db",
      JSON.stringify([
        {
          id: "student-empty",
          name: "Siswa Kosong",
          email: "empty@corelasi.test",
          role: "siswa",
          status: "aktif",
          kelasId: "k-1",
          kelasName: "X-A",
          password: "password123",
        },
      ]),
    );
    localStorage.setItem("corelasi_learning_tugas", "[]");
    localStorage.setItem("corelasi_learning_submissions", "[]");

    const [report] = await reportService.getGradeReports();

    expect(report.average).toBe(0);
    expect(report.grades).toEqual([]);
  });

  it("should compile high-level school operational metrics", async () => {
    const report = await reportService.getOperationalReport();
    expect(report).toBeDefined();
    expect(report.totalSiswa).toBeGreaterThan(0);
    expect(report.totalGuru).toBeGreaterThan(0);
    expect(report.attendanceRate).toBeGreaterThan(0);
    expect(report.journalCompletionRate).toBeGreaterThan(0);
  });
});

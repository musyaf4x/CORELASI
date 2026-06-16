/**
 * @file src/services/reportService.ts
 * @description Report aggregation service for CORELASI.
 *
 * Calls real API endpoints in dev/production, falls back to mocks in test suites.
 */

import { apiGet } from "@/services/api";
import { attendanceService } from "./attendanceService";
import { userService } from "./userService";
import { learningService } from "./learningService";
import { journalService } from "./journalService";
import type {
  StudentAttendanceSummary,
  StudentGradeSummary,
  OperationalReport,
} from "@/types/report";

const IS_TEST = import.meta.env.MODE === "test";

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const reportService = {
  async getAttendanceReports(
    kelasId?: string,
  ): Promise<StudentAttendanceSummary[]> {
    if (!IS_TEST) {
      return apiGet<StudentAttendanceSummary[]>(
        "/reports/attendance/",
        kelasId ? { kelasId } : undefined,
      );
    }
    await delay();
    const [allUsers, allAttendance] = await Promise.all([
      userService.getAll(),
      attendanceService.getAbsensiSiswa(),
    ]);

    const students = allUsers.filter((u) => u.role === "siswa");

    const reports: StudentAttendanceSummary[] = students.map((student) => {
      const studentClassName = student.kelasName ?? "";

      const records = allAttendance.filter((a) => a.siswaId === student.id);

      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alpa = 0;

      records.forEach((r) => {
        const status = r.status.toLowerCase();
        if (status === "hadir") hadir++;
        else if (status === "sakit") sakit++;
        else if (status === "izin") izin++;
        else if (status === "alpa") alpa++;
      });

      const total = hadir + sakit + izin + alpa;
      const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

      return {
        siswaId: student.id,
        siswaName: student.name,
        nis: student.nipOrNis || "",
        gender: student.gender || "-",
        kelasName: studentClassName,
        hadir,
        sakit,
        izin,
        alpa,
        percentage,
      };
    });

    if (kelasId) {
      return reports.filter((report) => {
        const student = students.find((item) => item.id === report.siswaId);
        return String(student?.kelasId ?? "") === kelasId;
      });
    }

    return reports;
  },

  async getGradeReports(kelasId?: string): Promise<StudentGradeSummary[]> {
    if (!IS_TEST) {
      return apiGet<StudentGradeSummary[]>(
        "/reports/grades/",
        kelasId ? { kelasId } : undefined,
      );
    }
    await delay();
    const [allUsers, allTugas, allSubmissions] = await Promise.all([
      userService.getAll(),
      learningService.getTugas(),
      learningService.getSubmissions(),
    ]);

    const students = allUsers.filter((u) => u.role === "siswa");

    const reports: StudentGradeSummary[] = students.map((student) => {
      const studentClassId = String(student.kelasId ?? "");
      const studentClassName = student.kelasName ?? "";

      // Find tasks assigned to this class
      const classTugas = allTugas.filter(
        (t) => t.kelasId === studentClassId && t.status === "Dipublikasikan",
      );

      const grades = classTugas.map((t) => {
        const sub = allSubmissions.find(
          (s) => s.tugasId === t.id && s.siswaId === student.id,
        );
        return {
          tugasId: t.id,
          tugasTitle: t.title,
          mapelName: t.mapelName,
          score: sub?.grade,
          feedback: sub?.feedback,
        };
      });

      // Calculate average
      const scoredGrades = grades.filter((g) => g.score !== undefined);

      let average = 0;
      if (scoredGrades.length > 0) {
        const sum = scoredGrades.reduce(
          (acc, curr) => acc + (curr.score || 0),
          0,
        );
        average = Math.round(sum / scoredGrades.length);
      }

      return {
        siswaId: student.id,
        siswaName: student.name,
        nis: student.nipOrNis || "",
        gender: student.gender || "-",
        kelasName: studentClassName,
        grades,
        average,
      };
    });

    if (kelasId) {
      return reports.filter((report) => {
        const student = students.find((item) => item.id === report.siswaId);
        return String(student?.kelasId ?? "") === kelasId;
      });
    }

    return reports;
  },

  async getOperationalReport(): Promise<OperationalReport> {
    if (!IS_TEST) {
      return apiGet<OperationalReport>("/reports/operational/");
    }
    await delay();
    const [allUsers, allJournals, allTugas, allSubmissions, attendance] =
      await Promise.all([
        userService.getAll(),
        journalService.getJournals(),
        learningService.getTugas(),
        learningService.getSubmissions(),
        this.getAttendanceReports(),
      ]);

    const totalSiswa = allUsers.filter((u) => u.role === "siswa").length;
    const totalGuru = allUsers.filter((u) => u.role === "guru").length;
    const totalKelas = new Set(
      allUsers
        .filter((user) => user.role === "siswa" && user.kelasId)
        .map((user) => String(user.kelasId)),
    ).size;

    const totalAttPercent = attendance.reduce(
      (acc, curr) => acc + curr.percentage,
      0,
    );
    const attendanceRate =
      attendance.length > 0
        ? Math.round((totalAttPercent / attendance.length) * 10) / 10
        : 0;

    // Journal completion rate: simulated from journals logged vs weekly targets
    const expectedJournals = 15;
    const journalCompletionRate = Math.min(
      100,
      Math.round((allJournals.length / expectedJournals) * 100 * 10) / 10,
    );

    const activeAssignments = allTugas.filter(
      (t) => t.status === "Dipublikasikan",
    ).length;
    const totalSubmissions = allSubmissions.length;

    const gradedSubmissions = allSubmissions.filter(
      (s) => s.grade !== undefined,
    ).length;
    const gradedSubmissionsPercent =
      totalSubmissions > 0
        ? Math.round((gradedSubmissions / totalSubmissions) * 100)
        : 0;

    return {
      totalSiswa,
      totalGuru,
      totalKelas,
      attendanceRate,
      journalCompletionRate,
      activeAssignments,
      totalSubmissions,
      gradedSubmissionsPercent,
    };
  },
};

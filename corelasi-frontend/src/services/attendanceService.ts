/**
 * @file src/services/attendanceService.ts
 * @description Attendance service for CORELASI.
 *
 * Calls real API endpoints in dev/production, falls back to mocks in test suites.
 */

import { apiGet, apiPost, apiPatch } from "@/services/api";
import type {
  AbsensiSiswa,
  PermintaanKoreksi,
  StatusKehadiran,
} from "@/types/attendance";
import {
  MOCK_ABSENSI_SISWA,
  MOCK_PERMINTAAN_KOREKSI,
} from "@/mocks/attendance.mock";

const IS_TEST = import.meta.env.MODE === "test";

const STORAGE_KEYS = {
  ABSENSI: "corelasi_attendance_siswa",
  KOREKSI: "corelasi_attendance_koreksi",
};

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const attendanceService = {
  async getAbsensiSiswa(): Promise<AbsensiSiswa[]> {
    if (!IS_TEST) {
      return apiGet<AbsensiSiswa[]>("/attendance/siswa/");
    }
    await delay();
    const stored = localStorage.getItem(STORAGE_KEYS.ABSENSI);
    if (!stored) {
      localStorage.setItem(
        STORAGE_KEYS.ABSENSI,
        JSON.stringify(MOCK_ABSENSI_SISWA),
      );
      return MOCK_ABSENSI_SISWA;
    }
    return JSON.parse(stored);
  },

  async getAbsensiSiswaByKelas(
    kelasId: string,
    tanggal: string,
  ): Promise<AbsensiSiswa[]> {
    if (!IS_TEST) {
      return apiGet<AbsensiSiswa[]>("/attendance/siswa/", { kelasId, tanggal });
    }
    const list = await this.getAbsensiSiswa();
    return list.filter((a) => a.kelasId === kelasId && a.tanggal === tanggal);
  },

  async submitAbsensiSiswa(records: AbsensiSiswa[]): Promise<boolean> {
    if (!IS_TEST) {
      await apiPost("/attendance/siswa/batch/", records);
      return true;
    }
    await delay();
    const list = await this.getAbsensiSiswa();
    // Merge or replace records
    const updatedList = [...list];
    records.forEach((rec) => {
      const idx = updatedList.findIndex(
        (a) =>
          a.siswaId === rec.siswaId &&
          a.kelasId === rec.kelasId &&
          a.tanggal === rec.tanggal &&
          a.mapelId === rec.mapelId,
      );
      if (idx !== -1) {
        updatedList[idx] = { ...updatedList[idx], ...rec };
      } else {
        updatedList.push({
          ...rec,
          id:
            rec.id ||
            `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        });
      }
    });
    localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify(updatedList));
    return true;
  },

  async getPermintaanKoreksi(): Promise<PermintaanKoreksi[]> {
    if (!IS_TEST) {
      return apiGet<PermintaanKoreksi[]>("/attendance/koreksi/");
    }
    await delay();
    const stored = localStorage.getItem(STORAGE_KEYS.KOREKSI);
    if (!stored) {
      localStorage.setItem(
        STORAGE_KEYS.KOREKSI,
        JSON.stringify(MOCK_PERMINTAAN_KOREKSI),
      );
      return MOCK_PERMINTAAN_KOREKSI;
    }
    return JSON.parse(stored);
  },

  async submitPermintaanKoreksi(
    input: Omit<PermintaanKoreksi, "id" | "verified">,
  ): Promise<PermintaanKoreksi> {
    if (!IS_TEST) {
      return apiPost<PermintaanKoreksi>("/attendance/koreksi/", input);
    }
    await delay();
    const list = await this.getPermintaanKoreksi();
    const newItem: PermintaanKoreksi = {
      ...input,
      id: `req-${Date.now()}`,
      verified: false,
    };
    const updated = [...list, newItem];
    localStorage.setItem(STORAGE_KEYS.KOREKSI, JSON.stringify(updated));
    return newItem;
  },

  async verifyPermintaanKoreksi(
    id: string,
    statusKoreksi: StatusKehadiran,
    keterangan: string,
  ): Promise<boolean> {
    if (!IS_TEST) {
      await apiPatch(`/attendance/koreksi/${id}/verify/`, {
        statusKoreksi,
        keterangan,
      });
      return true;
    }
    await delay();
    const list = await this.getPermintaanKoreksi();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Permintaan koreksi tidak ditemukan");

    // Mark request as verified and save final status/keterangan determined by piket
    const updatedList = [...list];
    updatedList[idx] = {
      ...updatedList[idx],
      statusKoreksi,
      keterangan,
      verified: true,
    };
    localStorage.setItem(STORAGE_KEYS.KOREKSI, JSON.stringify(updatedList));

    // Update actual attendance status
    const req = updatedList[idx];
    const absensiList = await this.getAbsensiSiswa();
    const absIdx = absensiList.findIndex(
      (a) =>
        a.siswaId === req.siswaId &&
        a.kelasId === req.kelasId &&
        a.tanggal === req.tanggal,
    );

    if (absIdx !== -1) {
      const updatedAbsensi = [...absensiList];
      updatedAbsensi[absIdx] = {
        ...updatedAbsensi[absIdx],
        status: statusKoreksi,
        keterangan: `Koreksi disetujui: ${keterangan}`,
      };
      localStorage.setItem(
        STORAGE_KEYS.ABSENSI,
        JSON.stringify(updatedAbsensi),
      );
    } else {
      // If record wasn't found (unlikely), create a new one
      const newAbs: AbsensiSiswa = {
        id: `att-${Date.now()}`,
        siswaId: req.siswaId,
        siswaName: req.siswaName,
        nis: "", // fetch nis if possible, or leave blank/lookup from user service
        kelasId: req.kelasId,
        kelasName: req.kelasName,
        tanggal: req.tanggal,
        status: statusKoreksi,
        keterangan: `Koreksi disetujui: ${keterangan}`,
      };
      const updatedAbsensi = [...absensiList, newAbs];
      localStorage.setItem(
        STORAGE_KEYS.ABSENSI,
        JSON.stringify(updatedAbsensi),
      );
    }

    return true;
  },

  async overrideAbsensiSiswa(
    id: string,
    statusBaru: StatusKehadiran,
    alasanOverride: string,
  ): Promise<boolean> {
    if (!IS_TEST) {
      await apiPatch(`/attendance/siswa/${id}/override/`, {
        statusBaru,
        alasanOverride,
      });
      return true;
    }
    await delay();
    const absensiList = await this.getAbsensiSiswa();
    const idx = absensiList.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Data absensi tidak ditemukan.");

    const updatedAbsensi = [...absensiList];
    const initialStatus =
      updatedAbsensi[idx].statusAwal || updatedAbsensi[idx].status;

    updatedAbsensi[idx] = {
      ...updatedAbsensi[idx],
      statusAwal: initialStatus,
      status: statusBaru,
      keterangan: `Override Admin: ${alasanOverride}`,
    };
    localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify(updatedAbsensi));
    return true;
  },
};

import type { TahunAjaran, Semester, Kelas, MataPelajaran } from "@/types/academic";

export const MOCK_TAHUN_AJARAN: TahunAjaran[] = [
  { id: "ta-1", name: "2025/2026", status: "aktif", tanggalMulai: "2025-07-01", tanggalSelesai: "2026-06-30" },
  { id: "ta-2", name: "2024/2025", status: "nonaktif", tanggalMulai: "2024-07-01", tanggalSelesai: "2025-06-30" }
];

export const MOCK_SEMESTER: Semester[] = [
  { id: "sem-1", name: "Ganjil", tahunAjaran: "2025/2026", status: "aktif", tanggalMulai: "2025-07-01", tanggalSelesai: "2025-12-31" },
  { id: "sem-2", name: "Genap", tahunAjaran: "2025/2026", status: "nonaktif", tanggalMulai: "2026-01-02", tanggalSelesai: "2026-06-30" }
];

export const MOCK_KELAS: Kelas[] = [
  { id: "k-1", name: "X-A", tingkat: "X", waliKelasId: "3", waliKelasName: "Siti Aminah, S.Pd." },
  { id: "k-2", name: "XI-A", tingkat: "XI", waliKelasId: "2", waliKelasName: "Budi Santoso, M.Pd." },
  { id: "k-3", name: "XII-A", tingkat: "XII", waliKelasId: "2", waliKelasName: "Budi Santoso, M.Pd." }
];

export const MOCK_MAPEL: MataPelajaran[] = [
  { id: "mp-1", name: "Matematika", kode: "MTK" },
  { id: "mp-2", name: "Fisika", kode: "FIS" },
  { id: "mp-3", name: "Bahasa Indonesia", kode: "IND" },
  { id: "mp-4", name: "Bahasa Inggris", kode: "ING" }
];

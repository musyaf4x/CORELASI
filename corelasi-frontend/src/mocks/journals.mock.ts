import type { JurnalPertemuan } from "@/types/journal";

export const MOCK_JOURNALS: JurnalPertemuan[] = [
  {
    id: "jr-1",
    date: "2026-06-01",
    kelasId: "k-2",
    kelasName: "XI-A",
    mapelId: "mp-1",
    mapelName: "Matematika",
    guruId: "2",
    guruName: "Budi Santoso, M.Pd.",
    agenda: "Pertemuan Aljabar Linear",
    materialSummary: "Pembahasan matriks perkalian dan invers ordo 3x3 beserta latihan soal penyelesaian sistem persamaan linear.",
    presentCount: 28,
    absentCount: 2,
    notes: "2 siswa (Rian dan Dani) izin karena sakit."
  },
  {
    id: "jr-2",
    date: "2026-06-01",
    kelasId: "k-1",
    kelasName: "X-A",
    mapelId: "mp-2",
    mapelName: "Fisika",
    guruId: "3",
    guruName: "Siti Aminah, S.Pd.",
    agenda: "Praktikum Pengukuran Jangka Sorong",
    materialSummary: "Melakukan demonstrasi dan praktikum pengukuran ketebalan benda kerja kecil menggunakan alat ukur jangka sorong.",
    presentCount: 30,
    absentCount: 0,
    notes: "Praktikum berjalan kondusif, seluruh siswa hadir."
  },
  {
    id: "jr-3",
    date: "2026-06-02",
    kelasId: "k-2",
    kelasName: "XI-A",
    mapelId: "mp-1",
    mapelName: "Matematika",
    guruId: "2",
    guruName: "Budi Santoso, M.Pd.",
    agenda: "Ulangan Harian Bab Matriks",
    materialSummary: "Pelaksanaan evaluasi ulangan harian bab matriks secara tertulis selama 90 menit.",
    presentCount: 29,
    absentCount: 1,
    notes: "1 siswa izin dispensasi lomba basket."
  },
  {
    id: "jr-4",
    date: "2026-06-01",
    kelasId: "k-2",
    kelasName: "XI-A",
    mapelId: "mp-2",
    mapelName: "Fisika",
    guruId: "2",
    guruName: "Budi Santoso, M.Pd.",
    agenda: "Pertemuan 1: Pengenalan Dinamika Partikel",
    materialSummary: "Pengenalan gaya, hukum I Newton, hukum II Newton, dan hukum III Newton beserta penerapannya.",
    presentCount: 29,
    absentCount: 1,
    notes: "1 siswa (Rian) terlambat masuk kelas."
  },
  {
    id: "jr-5",
    date: "2026-06-03",
    kelasId: "k-2",
    kelasName: "XI-A",
    mapelId: "mp-2",
    mapelName: "Fisika",
    guruId: "2",
    guruName: "Budi Santoso, M.Pd.",
    agenda: "Pertemuan 2: Analisis Gaya Gesek",
    materialSummary: "Membahas gaya gesek statis dan kinetis pada bidang datar dan miring beserta contoh soal.",
    presentCount: 30,
    absentCount: 0,
    notes: "Siswa aktif berdiskusi."
  }
];

import type { Materi, Tugas, Submission } from "@/types/learning";

export const MOCK_MATERI: Materi[] = [
  {
    id: "mat-1",
    title: "Pengenalan Aljabar Linier",
    description: "Pertemuan pertama membahas matriks, operasi baris elementer, dan penyelesaian sistem persamaan linier.",
    sourceType: "file",
    fileUrl: "http://example.com/files/aljabar_dasar.pdf",
    dateCreated: "2026-06-01",
    kelasId: "k-1",
    kelasName: "X-A",
    mapelId: "mp-1",
    mapelName: "Matematika",
    guruId: "3",
    guruName: "Siti Aminah, S.Pd.",
    status: "Dipublikasikan"
  },
  {
    id: "mat-2",
    title: "Dinamika Partikel dan Hukum Newton",
    description: "Membahas 3 Hukum Newton tentang gerak benda beserta analisis diagram gaya bebas pada bidang miring.",
    sourceType: "file",
    fileUrl: "http://example.com/files/hukum_newton.pdf",
    dateCreated: "2026-06-01",
    kelasId: "k-2",
    kelasName: "XI-A",
    mapelId: "mp-2",
    mapelName: "Fisika",
    guruId: "2",
    guruName: "Budi Santoso, M.Pd.",
    status: "Dipublikasikan"
  },
  {
    id: "mat-3",
    title: "Struktur Atom dan Konfigurasi Elektron",
    description: "Materi pengenalan model atom modern, mekanika kuantum, orbital, dan cara pengisian elektron pada kulit atom.",
    sourceType: "link",
    dateCreated: "2026-06-02",
    kelasId: "k-3",
    kelasName: "XII-A",
    mapelId: "mp-2",
    mapelName: "Fisika", // Mapped under Physics for XII-A simulation
    guruId: "2",
    guruName: "Budi Santoso, M.Pd.",
    status: "Draft"
  }
];

export const MOCK_TUGAS: Tugas[] = [
  {
    id: "tug-1",
    title: "Latihan Soal Aljabar Elementer",
    description: "Selesaikan 5 soal persamaan linier dengan metode eliminasi Gauss-Jordan sesuai PDF materi.",
    fileUrl: "http://example.com/files/latihan_aljabar.pdf",
    dueDate: "2026-06-10",
    dateCreated: "2026-06-01",
    kelasId: "k-1",
    kelasName: "X-A",
    mapelId: "mp-1",
    mapelName: "Matematika",
    guruId: "3",
    guruName: "Siti Aminah, S.Pd.",
    status: "Dipublikasikan"
  },
  {
    id: "tug-2",
    title: "Tugas Mandiri Analisis Gaya Bebas",
    description: "Gambarkan diagram gaya bebas pada sistem katrol ganda dan hitung percepatan masing-masing beban.",
    dueDate: "2026-06-08",
    dateCreated: "2026-06-01",
    kelasId: "k-2",
    kelasName: "XI-A",
    mapelId: "mp-2",
    mapelName: "Fisika",
    guruId: "2",
    guruName: "Budi Santoso, M.Pd.",
    status: "Dipublikasikan"
  }
];

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "sub-1",
    tugasId: "tug-2",
    siswaId: "4",
    siswaName: "Rian Hidayat",
    submitDate: "2026-06-01",
    fileUrl: "http://example.com/uploads/rian-tugas-newton.pdf",
    status: "Terkumpul"
  }
];

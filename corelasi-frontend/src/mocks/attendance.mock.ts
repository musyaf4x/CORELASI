import type { AbsensiSiswa, PermintaanKoreksi } from "@/types/attendance";

export const MOCK_ABSENSI_SISWA: AbsensiSiswa[] = [
  // Class X-A Student Ahmad Fauzi (id "5")
  {
    id: "att-1",
    siswaId: "5",
    siswaName: "Ahmad Fauzi",
    nis: "25261002",
    kelasId: "k-1",
    kelasName: "X-A",
    mapelId: "mp-1",
    mapelName: "Matematika",
    tanggal: "2026-06-01",
    status: "Alpa",
    keterangan: "Tidak ada keterangan masuk kelas"
  },
  {
    id: "att-2",
    siswaId: "5",
    siswaName: "Ahmad Fauzi",
    nis: "25261002",
    kelasId: "k-1",
    kelasName: "X-A",
    mapelId: "mp-3",
    mapelName: "Bahasa Indonesia",
    tanggal: "2026-06-01",
    status: "Hadir"
  },
  // Class XI-A Student Rian Hidayat (id "4")
  {
    id: "att-3",
    siswaId: "4",
    siswaName: "Rian Hidayat",
    nis: "25261001",
    kelasId: "k-2",
    kelasName: "XI-A",
    mapelId: "mp-2",
    mapelName: "Fisika",
    tanggal: "2026-06-01",
    status: "Hadir"
  },
  {
    id: "att-4",
    siswaId: "4",
    siswaName: "Rian Hidayat",
    nis: "25261001",
    kelasId: "k-2",
    kelasName: "XI-A",
    mapelId: "mp-1",
    mapelName: "Matematika",
    tanggal: "2026-06-01",
    status: "Alpa",
    keterangan: "Ban bocor di jalan"
  },
  // Class XII-A Student Lani Wijaya (id "6")
  {
    id: "att-5",
    siswaId: "6",
    siswaName: "Lani Wijaya",
    nis: "25261003",
    kelasId: "k-3",
    kelasName: "XII-A",
    mapelId: "mp-4",
    mapelName: "Bahasa Inggris",
    tanggal: "2026-06-01",
    status: "Izin",
    keterangan: "Dispensasi lomba basket"
  }
];

export const MOCK_PERMINTAAN_KOREKSI: PermintaanKoreksi[] = [
  {
    id: "req-1",
    siswaId: "4",
    siswaName: "Rian Hidayat",
    kelasId: "k-2",
    kelasName: "XI-A",
    mapelName: "Matematika",
    statusSemula: "Alpa",
    statusKoreksi: "Hadir",
    keterangan: "Terlambat masuk karena ban bocor, tetapi mengikuti sisa jam pelajaran.",
    verified: false,
    tanggal: "2026-06-01"
  },
  {
    id: "req-2",
    siswaId: "5",
    siswaName: "Ahmad Fauzi",
    kelasId: "k-1",
    kelasName: "X-A",
    mapelName: "Matematika",
    statusSemula: "Alpa",
    statusKoreksi: "Sakit",
    keterangan: "Surat keterangan sakit dari dokter dikirimkan menyusul oleh orang tua.",
    verified: false,
    tanggal: "2026-06-01"
  },
  {
    id: "req-3",
    siswaId: "6",
    siswaName: "Lani Wijaya",
    kelasId: "k-3",
    kelasName: "XII-A",
    mapelName: "Bahasa Inggris",
    statusSemula: "Alpa",
    statusKoreksi: "Izin",
    keterangan: "Dispensasi kegiatan lomba mewakili sekolah tingkat kabupaten.",
    verified: true,
    tanggal: "2026-06-01"
  }
];

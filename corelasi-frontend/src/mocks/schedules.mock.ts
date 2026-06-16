import type { JadwalPembelajaran, JadwalPiket } from "@/types/schedule";

export const MOCK_JADWAL_PEMBELAJARAN: JadwalPembelajaran[] = [
  {
    id: "sch-1",
    kelasId: "k-1",
    kelasName: "X-A",
    mapelId: "mp-1",
    mapelName: "Matematika",
    guruId: "3",
    guruName: "Siti Aminah, S.Pd.",
    hari: "Senin",
    waktuMulai: "07:30",
    waktuSelesai: "09:00",
    semesterId: "sem-1"
  },
  {
    id: "sch-2",
    kelasId: "k-1",
    kelasName: "X-A",
    mapelId: "mp-3",
    mapelName: "Bahasa Indonesia",
    guruId: "3",
    guruName: "Siti Aminah, S.Pd.",
    hari: "Senin",
    waktuMulai: "09:15",
    waktuSelesai: "10:45",
    semesterId: "sem-1"
  },
  {
    id: "sch-3",
    kelasId: "k-2",
    kelasName: "XI-A",
    mapelId: "mp-2",
    mapelName: "Fisika",
    guruId: "2",
    guruName: "Budi Santoso, M.Pd.",
    hari: "Selasa",
    waktuMulai: "07:30",
    waktuSelesai: "09:00",
    semesterId: "sem-1"
  },
  {
    id: "sch-4",
    kelasId: "k-2",
    kelasName: "XI-A",
    mapelId: "mp-1",
    mapelName: "Matematika",
    guruId: "2",
    guruName: "Budi Santoso, M.Pd.",
    hari: "Selasa",
    waktuMulai: "09:15",
    waktuSelesai: "10:45",
    semesterId: "sem-1"
  },
  {
    id: "sch-5",
    kelasId: "k-3",
    kelasName: "XII-A",
    mapelId: "mp-4",
    mapelName: "Bahasa Inggris",
    guruId: "3",
    guruName: "Siti Aminah, S.Pd.",
    hari: "Rabu",
    waktuMulai: "08:00",
    waktuSelesai: "09:30",
    semesterId: "sem-1"
  },
  {
    id: "sch-6",
    kelasId: "k-3",
    kelasName: "XII-A",
    mapelId: "mp-3",
    mapelName: "Bahasa Indonesia",
    guruId: "3",
    guruName: "Siti Aminah, S.Pd.",
    hari: "Kamis",
    waktuMulai: "10:00",
    waktuSelesai: "11:30",
    semesterId: "sem-1"
  }
];

export const MOCK_JADWAL_PIKET: JadwalPiket[] = [
  {
    id: "pkt-1",
    guruId: "2",
    guruName: "Budi Santoso, M.Pd.",
    hari: "Senin",
    semesterId: "sem-1"
  },
  {
    id: "pkt-2",
    guruId: "3",
    guruName: "Siti Aminah, S.Pd.",
    hari: "Selasa",
    semesterId: "sem-1"
  },
  {
    id: "pkt-3",
    guruId: "2",
    guruName: "Budi Santoso, M.Pd.",
    hari: "Rabu",
    semesterId: "sem-1"
  },
  {
    id: "pkt-4",
    guruId: "3",
    guruName: "Siti Aminah, S.Pd.",
    hari: "Kamis",
    semesterId: "sem-1"
  },
  {
    id: "pkt-5",
    guruId: "2",
    guruName: "Budi Santoso, M.Pd.",
    hari: "Jumat",
    semesterId: "sem-1"
  }
];

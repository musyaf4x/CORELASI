import type { UserDetail } from "@/types/user";

export const MOCK_USERS_LIST: UserDetail[] = [
  { id: "u-admin-1", name: "Ahmad Sukarjo", email: "admin@corelasi.test", role: "admin", status: "aktif", nipOrNis: "198001012005011001", gender: "L", phoneNumber: "081234567890", password: "password123" },
  { id: "2", name: "Budi Santoso, M.Pd.", email: "guru@corelasi.test", role: "guru", status: "aktif", nipOrNis: "197505121999031002", gender: "L", phoneNumber: "081234567891", assignments: { isPengampu: true, isPiketToday: true, isWaliKelas: true, waliKelasName: "XI-A", waliKelasId: "k-2" }, password: "password123" },
  { id: "3", name: "Siti Aminah, S.Pd.", email: "siti@corelasi.test", role: "guru", status: "aktif", nipOrNis: "198508202010122003", gender: "P", phoneNumber: "081234567892", assignments: { isPengampu: true, isPiketToday: false, isWaliKelas: false }, password: "password123" },
  { id: "4", name: "Rian Hidayat", email: "siswa@corelasi.test", role: "siswa", status: "aktif", nipOrNis: "25261001", gender: "L", phoneNumber: "081234567893", kelasId: "k-2", kelasName: "XI-A", password: "password123" },
  { id: "5", name: "Ahmad Fauzi", email: "ahmad@corelasi.test", role: "siswa", status: "aktif", nipOrNis: "25261002", gender: "L", phoneNumber: "081234567894", kelasId: "k-1", kelasName: "X-A", password: "password123" },
  { id: "6", name: "Lani Wijaya", email: "lani@corelasi.test", role: "siswa", status: "aktif", nipOrNis: "25261003", gender: "P", phoneNumber: "081234567895", kelasId: "k-3", kelasName: "XII-A", password: "password123" }
];

export type UserRole = "admin" | "guru" | "siswa";

export type TeacherAssignment = {
  isPengampu: boolean;
  isPiketToday: boolean;
  isWaliKelas: boolean;
  waliKelasName?: string;
  waliKelasId?: string | number | null;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "aktif" | "nonaktif";
  nipOrNis?: string;
  password?: string;
  assignments?: TeacherAssignment;
  kelasId?: string | null;
  kelasName?: string | null;
  angkatan?: number;
};

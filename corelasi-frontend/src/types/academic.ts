export interface TahunAjaran {
  id: string;
  name: string;
  status: "aktif" | "nonaktif";
  tanggalMulai?: string;
  tanggalSelesai?: string;
}

export interface Semester {
  id: string;
  name: "Ganjil" | "Genap";
  tahunAjaran: string;
  status: "aktif" | "nonaktif";
  tanggalMulai?: string;
  tanggalSelesai?: string;
}

export interface Kelas {
  id: string;
  name: string;
  tingkat: "X" | "XI" | "XII";
  waliKelasId: string;
  waliKelasName: string;
  tahunAjaran?: string;
}

export interface MataPelajaran {
  id: string;
  name: string;
  kode?: string;
}

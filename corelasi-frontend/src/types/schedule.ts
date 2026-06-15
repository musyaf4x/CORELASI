export type HariBelajar =
  | "Senin"
  | "Selasa"
  | "Rabu"
  | "Kamis"
  | "Jumat"
  | "Sabtu";

export interface JadwalPembelajaran {
  id: string;
  kelasId: string;
  kelasName: string;
  mapelId: string;
  mapelName: string;
  guruId: string;
  guruName: string;
  hari: HariBelajar;
  waktuMulai: string; // e.g. "07:30"
  waktuSelesai: string; // e.g. "09:00"
  semesterId?: string;
  tahunAjaranId?: string;
}

export interface JadwalPiket {
  id: string;
  guruId: string;
  guruName: string;
  hari: HariBelajar;
  semesterId?: string;
  tahunAjaranId?: string;
}

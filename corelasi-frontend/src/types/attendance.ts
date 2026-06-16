export type StatusKehadiran = "Hadir" | "Sakit" | "Izin" | "Alpa";

export interface AbsensiSiswa {
  id: string;
  siswaId: string;
  siswaName: string;
  nis: string;
  kelasId: string;
  kelasName: string;
  mapelId?: string;
  mapelName?: string;
  tanggal: string; // YYYY-MM-DD
  status: StatusKehadiran;
  keterangan?: string;
  statusAwal?: StatusKehadiran;
}

export interface PermintaanKoreksi {
  id: string;
  siswaId: string;
  siswaName: string;
  kelasId: string;
  kelasName: string;
  mapelName: string;
  statusSemula: StatusKehadiran;
  statusKoreksi: StatusKehadiran;
  keterangan: string;
  verified: boolean;
  tanggal: string;
}

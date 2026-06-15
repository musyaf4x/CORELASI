export interface JurnalPertemuan {
  id: string;
  date: string;
  kelasId: string;
  kelasName: string;
  mapelId: string;
  mapelName: string;
  guruId: string;
  guruName: string;
  agenda: string;
  materialSummary: string;
  presentCount: number;
  absentCount: number;
  notes?: string;
}

export interface Materi {
  id: string;
  title: string;
  description: string;
  sourceType: "link" | "file";
  fileUrl?: string; // Attachment link
  dateCreated: string; // YYYY-MM-DD
  kelasId: string;
  kelasName: string;
  mapelId: string;
  mapelName: string;
  guruId: string;
  guruName: string;
  status: "Draft" | "Dipublikasikan";
}

export interface Tugas {
  id: string;
  title: string;
  description: string;
  fileUrl?: string; // Optional template or resource link
  dueDate: string; // YYYY-MM-DD
  dateCreated: string; // YYYY-MM-DD
  kelasId: string;
  kelasName: string;
  mapelId: string;
  mapelName: string;
  guruId: string;
  guruName: string;
  status: "Draft" | "Dipublikasikan";
}

export interface Submission {
  id: string;
  tugasId: string;
  siswaId: string;
  siswaName: string;
  submitDate: string; // YYYY-MM-DD
  fileUrl?: string; // Submission attachment or solution link
  status: "Belum Mengumpulkan" | "Terkumpul" | "Late";
  grade?: number; // Hooked for Phase 7
  feedback?: string; // Hooked for Phase 7
}

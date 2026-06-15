export interface StudentAttendanceSummary {
  siswaId: string;
  siswaName: string;
  nis: string;
  gender?: string;
  kelasName: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  percentage: number;
}

export interface StudentGradeSummary {
  siswaId: string;
  siswaName: string;
  nis: string;
  gender?: string;
  kelasName: string;
  grades: {
    tugasId: string;
    tugasTitle: string;
    mapelName: string;
    score?: number;
    feedback?: string;
  }[];
  average: number;
}

export interface OperationalReport {
  totalSiswa: number;
  totalGuru: number;
  totalKelas: number;
  attendanceRate: number; // e.g. 96.5%
  journalCompletionRate: number; // e.g. 92.0%
  activeAssignments: number;
  totalSubmissions: number;
  gradedSubmissionsPercent: number;
}

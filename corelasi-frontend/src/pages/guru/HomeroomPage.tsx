import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Users, ClipboardCheck, Award } from "lucide-react";
import {
  StatusBadge,
  DataTable,
  SummaryMetricCard,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import { reportService } from "@/services/reportService";
import { type SemanticState, semanticStyles } from "@/utils/semanticState";

const getAbsenState = (percentage: number): SemanticState => {
  if (percentage === 100) return "excellent";
  if (percentage >= 96) return "safe";
  if (percentage >= 90) return "warning";
  return "danger";
};

const getGradeState = (grade: number): SemanticState => {
  if (grade >= 90) return "excellent";
  if (grade >= 75) return "safe";
  return "danger";
};

interface HomeroomStudentRow {
  siswaId: string;
  nis: string;
  nama: string;
  gender: string;
  absen: string;
  absenVal: number;
  nilai: number;
  status: "Tuntas" | "Evaluasi" | "Remedial";
}

export const HomeroomPage: React.FC = () => {
  const { user } = useAuth();
  const className = user?.assignments?.waliKelasName || "Belum ditetapkan";
  const classId = user?.assignments?.waliKelasId
    ? String(user.assignments.waliKelasId)
    : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentsData, setStudentsData] = useState<HomeroomStudentRow[]>([]);
  const [classStats, setClassStats] = useState({
    totalSiswa: 0,
    rerataPresensi: 0,
    rerataNilai: 0,
  });

  const loadData = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    if (!classId) {
      setStudentsData([]);
      setClassStats({ totalSiswa: 0, rerataPresensi: 0, rerataNilai: 0 });
      setLoading(false);
      return;
    }

    try {
      const [attendance, grades] = await Promise.all([
        reportService.getAttendanceReports(classId),
        reportService.getGradeReports(classId),
      ]);

      // Combine by student ID
      const combined = grades.map((g) => {
        const att = attendance.find((a) => a.siswaId === g.siswaId);
        const attPercent = att ? att.percentage : 0;

        let status: "Tuntas" | "Evaluasi" | "Remedial" = "Tuntas";
        if (g.average < 75) {
          status = "Remedial";
        } else if (attPercent < 95) {
          status = "Evaluasi";
        }

        return {
          siswaId: g.siswaId,
          nis: g.nis,
          nama: g.siswaName,
          gender: g.gender || att?.gender || "-",
          absen: `${attPercent}%`,
          absenVal: attPercent,
          nilai: g.average,
          status,
        };
      });

      setStudentsData(combined);

      // Compute aggregates
      const totalSiswa = combined.length;
      const totalPresensi = attendance.reduce(
        (acc, curr) => acc + curr.percentage,
        0,
      );
      const rerataPresensi =
        totalSiswa > 0 ? Math.round(totalPresensi / totalSiswa) : 0;
      const totalNilai = combined.reduce((acc, curr) => acc + curr.nilai, 0);
      const rerataNilai =
        totalSiswa > 0 ? Math.round((totalNilai / totalSiswa) * 10) / 10 : 0;

      setClassStats({
        totalSiswa,
        rerataPresensi,
        rerataNilai,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat data kelas perwalian.",
      );
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const columns = [
    {
      header: "NIS",
      cell: (student: HomeroomStudentRow) => (
        <span className="text-[13px] font-mono text-bg-ink-muted font-bold">
          {student.nis}
        </span>
      ),
    },
    {
      header: "Nama Siswa",
      cell: (student: HomeroomStudentRow) => (
        <span className="text-[13px] font-semibold text-bg-ink">
          {student.nama}
        </span>
      ),
    },
    {
      header: "L/P",
      cell: (student: HomeroomStudentRow) => (
        <span className="text-[13px] text-bg-ink-secondary">
          {student.gender}
        </span>
      ),
    },
    {
      header: "Rasio Absensi",
      cell: (student: HomeroomStudentRow) => (
        <span
          className={`text-[13px] font-semibold font-mono tabular-nums ${semanticStyles[getAbsenState(student.absenVal)].text}`}
        >
          {student.absen}
        </span>
      ),
    },
    {
      header: "Rerata Nilai",
      cell: (student: HomeroomStudentRow) => (
        <span
          className={`text-[13px] font-bold font-mono ${student.nilai >= 75 ? "text-primary" : "text-text-danger"}`}
        >
          {student.nilai}
        </span>
      ),
    },
    {
      header: "Status Akademik",
      cell: (student: HomeroomStudentRow) => {
        let badgeState: "safe" | "warning" | "danger" = "safe";
        if (student.status === "Remedial") badgeState = "danger";
        else if (student.status === "Evaluasi") badgeState = "warning";

        return (
          <StatusBadge label={student.status} state={badgeState} size="xs" />
        );
      },
    },
  ];

  if (loading) {
    return <LoadingState message="Memuat data kelas perwalian..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
          Kelas Perwalian - {className}
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Pantau data siswa, agregat absensi kelas, dan perkembangan nilai
          akademik kelas perwalian Anda.
        </p>
      </div>

      {/* Aggregate Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryMetricCard
          label="Total Siswa"
          value={`${classStats.totalSiswa} Siswa`}
          desc="Aktif terdaftar di rombel kelas"
          icon={<Users className="h-4 w-4" />}
          variant="neutral"
          tooltip="Jumlah siswa yang aktif terdaftar dalam kelas binaan perwalian Anda."
        />

        <SummaryMetricCard
          label="Rerata Presensi"
          value={`${classStats.rerataPresensi}%`}
          desc="Tingkat kehadiran siswa"
          icon={<ClipboardCheck className="h-4 w-4" />}
          variant={getAbsenState(classStats.rerataPresensi)}
          tooltip="Persentase rata-rata kehadiran seluruh siswa kelas perwalian pada semester ini."
        />

        <SummaryMetricCard
          label="Rerata Nilai Kelas"
          value={classStats.rerataNilai.toString()}
          desc="Rerata nilai tugas akademik"
          icon={<Award className="h-4 w-4" />}
          variant={getGradeState(classStats.rerataNilai)}
          tooltip="Rata-rata akumulasi nilai tugas dari seluruh siswa kelas perwalian."
        />
      </div>

      {/* Roster Table */}
      <DataTable
        title={`Roster Siswa ${className}`}
        columns={columns}
        data={studentsData}
        keyExtractor={(student) => student.siswaId}
      />
    </div>
  );
};

export default HomeroomPage;

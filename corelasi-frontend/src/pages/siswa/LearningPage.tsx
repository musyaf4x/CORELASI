import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { scheduleService } from "@/services/scheduleService";
import { getSiswaKelasId } from "@/utils/student";
import type { JadwalPembelajaran } from "@/types/schedule";
import { Card, LoadingState, ErrorState } from "@/components/shared";
import { BookOpen, GraduationCap, ChevronRight } from "lucide-react";

export const LearningPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<JadwalPembelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const sch = await scheduleService.getJadwalPembelajaran();
        const classId = getSiswaKelasId(user);
        const mySchedules = sch.filter(
          (s) => String(s.kelasId) === String(classId),
        );

        // Filter unique courses based on mapelId
        const uniqueCourses: JadwalPembelajaran[] = [];
        mySchedules.forEach((item) => {
          if (!uniqueCourses.some((c) => c.mapelId === item.mapelId)) {
            uniqueCourses.push(item);
          }
        });

        setCourses(uniqueCourses);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat data pembelajaran.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
          Pembelajaran Saya
        </h1>
        <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
          Pilih mata pelajaran aktif Anda untuk mengakses materi modul dan tugas
          KBM.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Memuat kelas pembelajaran..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : courses.length === 0 ? (
        <div className="border border-bg-border bg-bg-surface rounded-[6px] p-8 text-center">
          <p className="text-[14px] font-bold text-bg-ink">Belum Ada Kelas</p>
          <p className="mt-1 text-[13px] text-bg-ink-secondary">
            Anda belum terdaftar pada mata pelajaran apapun semester ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/siswa/learning/${course.mapelId}`}
              className="block group"
            >
              <Card
                padding="none"
                variant="surface"
                className="flex flex-col justify-between min-h-[160px] border-bg-border group-hover:border-primary/30 group-hover:bg-primary/[0.01] hover:shadow-[0_1px_6px_rgba(20,33,26,0.06)] transition-all duration-200"
              >
                {/* Upper Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-primary">
                        <BookOpen className="h-4 w-4" />
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                          {course.mapelId}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-bg-ink-muted group-hover:text-primary transition-colors group-hover:translate-x-0.5 transform duration-200" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-bg-ink leading-snug font-sans group-hover:text-primary transition-colors duration-200 line-clamp-1">
                        {course.mapelName}
                      </h3>
                      <div className="flex items-center space-x-1.5 mt-1.5 text-bg-ink-secondary">
                        <GraduationCap className="h-3.5 w-3.5 text-bg-ink-muted" />
                        <span className="text-[12px] font-medium leading-none">
                          {course.guruName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Divider & Action */}
                <div className="px-5 py-3 border-t border-bg-border/60 bg-bg-sage-slate/10 group-hover:bg-primary/[0.02] flex items-center justify-between text-[12px] font-semibold text-bg-ink-secondary group-hover:text-primary transition-colors duration-200">
                  <span>Akses Modul & Tugas</span>
                  <div className="flex items-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <span className="mr-1 text-[11px] font-medium">Buka</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
export default LearningPage;

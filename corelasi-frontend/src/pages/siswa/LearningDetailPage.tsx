import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { learningService } from "@/services/learningService";
import { academicService } from "@/services/academicService";
import { getSiswaKelasId } from "@/utils/student";
import type { Materi, Tugas, Submission } from "@/types/learning";
import {
  DetailTabs,
  Card,
  Button,
  StatusBadge,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import {
  ArrowLeft,
  BookOpen,
  FileCheck2,
  Calendar,
  Download,
  ExternalLink,
} from "lucide-react";

export const LearningDetailPage: React.FC = () => {
  const { id } = useParams(); // mapelId
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("materi");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [materials, setMaterials] = useState<Materi[]>([]);
  const [assignments, setAssignments] = useState<Tugas[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const loadContent = async () => {
      if (!user || !id) return;
      setLoading(true);
      setError(null);
      try {
        const classId = getSiswaKelasId(user);

        // Fetch all necessary data
        const [allMapels, allMat, allTug, allSub] = await Promise.all([
          academicService.getMapel(),
          learningService.getMateri(),
          learningService.getTugas(),
          learningService.getSubmissions(),
        ]);

        const currentMapel = allMapels.find((m) => String(m.id) === String(id));
        setSubjectName(currentMapel ? currentMapel.name : "Pembelajaran");

        // Filter materials and assignments for this student's class and selected mapel
        const filteredMaterials = allMat.filter(
          (m) =>
            String(m.kelasId) === String(classId) &&
            String(m.mapelId) === String(id) &&
            m.status === "Dipublikasikan",
        );
        const filteredAssignments = allTug.filter(
          (t) =>
            String(t.kelasId) === String(classId) &&
            String(t.mapelId) === String(id) &&
            t.status === "Dipublikasikan",
        );
        const mySubmissions = allSub.filter((s) => s.siswaId === user.id);

        setMaterials(filteredMaterials);
        setAssignments(filteredAssignments);
        setSubmissions(mySubmissions);
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
    loadContent();
  }, [user, id]);

  const tabs = [
    {
      id: "materi",
      label: "Materi Pembelajaran",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: "tugas",
      label: "Tugas & Evaluasi",
      icon: <FileCheck2 className="h-4 w-4" />,
    },
  ];

  const getTugasSubmissionStatus = (tugasId: string) => {
    const sub = submissions.find((s) => s.tugasId === tugasId);
    return sub ? sub.status : "Belum Mengumpulkan";
  };

  if (loading) {
    return <LoadingState message="Memuat data pembelajaran..." />;
  }

  if (error) {
    return (
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/siswa/learning")}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            {subjectName}
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Akses seluruh materi modul bacaan dan daftar tugas evaluasi aktif.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <DetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Tab Panels */}
      <div className="mt-6">
        {activeTab === "materi" && (
          <div className="space-y-4 max-w-3xl">
            {materials.length === 0 ? (
              <div className="border border-bg-border bg-bg-surface rounded-[6px] p-8 text-center">
                <p className="text-[14px] font-bold text-bg-ink">
                  Belum Ada Materi
                </p>
                <p className="mt-1 text-[13px] text-bg-ink-secondary">
                  Belum ada modul materi ajar yang dibagikan untuk mata
                  pelajaran ini.
                </p>
              </div>
            ) : (
              materials.map((mat) => (
                <Card
                  key={mat.id}
                  variant="surface"
                  padding="none"
                  className="p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-[15px] font-bold text-bg-ink font-sans">
                      {mat.title}
                    </h3>
                    <p className="text-[13px] text-bg-ink-secondary leading-relaxed">
                      {mat.description}
                    </p>
                    <span className="block text-[11px] text-bg-ink-muted">
                      Dirilis tanggal: {mat.dateCreated}
                    </span>
                  </div>
                  {mat.fileUrl && (
                    <div className="shrink-0 flex items-center md:self-center">
                      <Button
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="secondary"
                        className="text-[12px] h-9 font-semibold gap-1.5"
                      >
                        {mat.sourceType === "link" ? (
                          <>
                            <ExternalLink className="h-3.5 w-3.5 text-primary" />
                            Buka Tautan
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5 text-primary" />
                            Unduh Materi
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "tugas" && (
          <div className="space-y-4 max-w-3xl">
            {assignments.length === 0 ? (
              <div className="border border-bg-border bg-bg-surface rounded-[6px] p-8 text-center">
                <p className="text-[14px] font-bold text-bg-ink">
                  Belum Ada Tugas
                </p>
                <p className="mt-1 text-[13px] text-bg-ink-secondary">
                  Tidak ada tugas mandiri yang dijadwalkan pada mata pelajaran
                  ini.
                </p>
              </div>
            ) : (
              assignments.map((tug) => {
                const status = getTugasSubmissionStatus(tug.id);
                let badgeState: "safe" | "warning" | "danger" | "disabled" =
                  "disabled";
                if (status === "Terkumpul") badgeState = "safe";
                else if (status === "Late") badgeState = "warning";
                else if (status === "Belum Mengumpulkan") badgeState = "danger";

                return (
                  <Card
                    key={tug.id}
                    variant="surface"
                    padding="none"
                    className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-bg-ink font-sans">
                          {tug.title}
                        </h3>
                        <StatusBadge
                          label={status}
                          state={badgeState}
                          size="xs"
                        />
                      </div>
                      <p className="text-[13px] text-bg-ink-secondary leading-relaxed line-clamp-2">
                        {tug.description}
                      </p>

                      <div className="flex items-center gap-1.5 text-[11px] text-bg-ink-muted">
                        <Calendar className="h-3.5 w-3.5 text-status-warning" />
                        <span className="font-semibold text-text-warning">
                          Batas waktu: {tug.dueDate}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Link to={`/siswa/assignments/${tug.id}`}>
                        <Button className="w-full md:w-auto text-[12px] h-9 font-semibold justify-center gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Buka Tugas
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default LearningDetailPage;

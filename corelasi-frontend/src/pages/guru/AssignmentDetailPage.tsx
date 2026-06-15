import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { learningService } from "@/services/learningService";
import { userService } from "@/services/userService";
import type { Tugas } from "@/types/learning";
import {
  Button,
  StatusBadge,
  Card,
  Toast,
  Modal,
  SummaryMetricCard,
} from "@/components/shared";
import {
  ArrowLeft,
  Edit,
  Calendar,
  ExternalLink,
  Award,
  ClipboardCheck,
  AlertCircle,
  FileText,
} from "lucide-react";

interface StudentSubmissionRoster {
  siswaId: string;
  siswaName: string;
  nis: string;
  status: "Belum Mengumpulkan" | "Terkumpul" | "Late";
  submitDate?: string;
  fileUrl?: string;
  grade?: number;
  submissionId?: string;
}

export const AssignmentDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Tugas | null>(null);
  const [roster, setRoster] = useState<StudentSubmissionRoster[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Grading states
  const [gradingSubmission, setGradingSubmission] =
    useState<StudentSubmissionRoster | null>(null);
  const [inputGrade, setInputGrade] = useState("");
  const [inputFeedback, setInputFeedback] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);

  const openGradingModal = async (submission: StudentSubmissionRoster) => {
    setGradingSubmission(submission);
    setInputGrade(
      submission.grade !== undefined ? String(submission.grade) : "",
    );
    setGradingError(null);

    if (!submission.submissionId || !id) {
      setInputFeedback("");
      return;
    }

    try {
      const submissions = await learningService.getSubmissionsByTugas(id);
      const current = submissions.find(
        (item) => item.id === submission.submissionId,
      );
      setInputFeedback(current?.feedback || "");
    } catch {
      setInputFeedback("");
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission || !gradingSubmission.submissionId) return;

    setGradingError(null);
    const gradeNum = Number(inputGrade);
    if (
      isNaN(gradeNum) ||
      inputGrade.trim() === "" ||
      gradeNum < 0 ||
      gradeNum > 100
    ) {
      setGradingError("Nilai harus berupa angka antara 0 sampai 100.");
      return;
    }

    setSubmittingGrade(true);
    try {
      await learningService.gradeSubmission(
        gradingSubmission.submissionId,
        gradeNum,
        inputFeedback,
      );
      setToastMessage(`Berhasil menilai tugas ${gradingSubmission.siswaName}`);
      setGradingSubmission(null);
      await fetchAssignmentDetails();
    } catch {
      setGradingError("Gagal menyimpan nilai.");
    } finally {
      setSubmittingGrade(false);
    }
  };

  const fetchAssignmentDetails = useCallback(async () => {
    if (!id) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const tug = await learningService.getTugasById(id);
      if (!tug) {
        setAssignment(null);
        return;
      }
      setAssignment(tug);

      const [allUsers, submissions] = await Promise.all([
        userService.getAll(),
        learningService.getSubmissionsByTugas(id),
      ]);

      // Filter students in the target class using coerced comparison
      const students = allUsers.filter(
        (u) => u.role === "siswa" && String(u.kelasId) === String(tug.kelasId),
      );

      // Roster mapping
      const mappedRoster: StudentSubmissionRoster[] = students.map(
        (student) => {
          const sub = submissions.find((s) => s.siswaId === student.id);
          return {
            siswaId: student.id,
            siswaName: student.name,
            nis: student.nipOrNis || "",
            status: sub ? sub.status : "Belum Mengumpulkan",
            submitDate: sub?.submitDate,
            fileUrl: sub?.fileUrl,
            grade: sub?.grade,
            submissionId: sub?.id,
          };
        },
      );

      setRoster(mappedRoster);
    } catch {
      setToastMessage("Gagal memuat detail tugas.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(fetchAssignmentDetails);
  }, [fetchAssignmentDetails]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <span className="text-[13px] text-bg-ink-muted">
          Memuat detail tugas...
        </span>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="border border-bg-border bg-bg-surface rounded-[6px] p-8 text-center">
        <p className="text-[14px] font-bold text-bg-ink">
          Tugas Tidak Ditemukan
        </p>
        <Button className="mt-4" onClick={() => navigate("/guru/assignments")}>
          Kembali ke Daftar Tugas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          message={toastMessage}
          variant="safe"
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/guru/assignments")}
            className="h-8 w-8 p-0"
            aria-label="Kembali ke Daftar Tugas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
              Detail Tugas
            </h1>
            <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
              Pantau status penyerahan solusi siswa untuk tugas di kelas Anda.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/guru/assignments/${assignment.id}/edit`}>
            <Button
              variant="secondary"
              className="gap-2"
              aria-label="Ubah detail tugas"
            >
              <Edit className="h-4 w-4" />
              Ubah Tugas
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="surface" padding="none" className="p-5 space-y-5">
            <div className="space-y-2">
              <div>
                <span className="inline-flex items-center rounded-full bg-primary/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
                  {assignment.kelasName} • {assignment.mapelName}
                </span>
              </div>
              <h2 className="text-[18px] font-bold text-bg-ink font-sans leading-tight">
                {assignment.title}
              </h2>
            </div>

            <div className="border-t border-bg-border/60 pt-4">
              <h4 className="text-[10px] font-bold text-bg-ink-muted mb-2 uppercase tracking-wider">
                Deskripsi Tugas
              </h4>
              <p className="text-[13px] text-bg-ink-secondary leading-relaxed whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>

            {assignment.fileUrl && (
              <div className="border-t border-bg-border/60 pt-4">
                <h4 className="text-[10px] font-bold text-bg-ink-muted mb-2 uppercase tracking-wider">
                  File Pendukung
                </h4>
                <a
                  href={assignment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-bg-border bg-bg-sage-slate/10 hover:bg-bg-sage-slate/20 rounded-[6px] hover:border-border-muted transition-all duration-200 group w-full md:w-auto md:max-w-md"
                  aria-label="Unduh dokumen pendukung tugas"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-[4px] text-primary group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[13px] font-bold text-bg-ink group-hover:text-primary transition-colors">
                        Berkas Pendukung Tugas
                      </span>
                      <span className="block text-[11px] text-bg-ink-muted">
                        Format PDF/Unduhan
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-bg-ink-muted group-hover:text-primary transition-colors mr-1" />
                </a>
              </div>
            )}
          </Card>

          {/* Student Submissions List */}
          <div className="border border-bg-border bg-bg-surface rounded-[6px] shadow-[0_1px_4px_rgba(20,33,26,0.05)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-bg-border flex justify-between items-center">
              <h3 className="text-[14px] font-bold tracking-tight text-bg-ink font-sans">
                Daftar Pengumpulan Siswa
              </h3>
              <span className="text-[11px] font-semibold bg-primary/[0.08] text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                {roster.length} Siswa Total
              </span>
            </div>

            <div className="p-5 space-y-3 bg-bg-sage-slate/30">
              {roster.map((r) => {
                let badgeState: "safe" | "warning" | "danger" | "disabled" =
                  "disabled";
                if (r.status === "Terkumpul") badgeState = "safe";
                else if (r.status === "Late") badgeState = "warning";
                else if (r.status === "Belum Mengumpulkan")
                  badgeState = "danger";

                return (
                  <Card
                    key={r.siswaId}
                    variant="surface"
                    padding="none"
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-bg-border hover:border-border-muted transition-all duration-200 bg-bg-surface"
                  >
                    {/* Left: Student Identity & Submission Status */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-[12px]">
                        <span className="font-semibold text-bg-ink text-[14px]">
                          {r.siswaName}
                        </span>
                        {r.nis && (
                          <span className="text-[11px] font-mono text-bg-ink-muted bg-bg-sage-slate px-1.5 py-0.5 rounded border border-bg-border/60">
                            NIS: {r.nis}
                          </span>
                        )}
                        <span className="text-bg-ink-muted/60">•</span>
                        <StatusBadge
                          label={r.status}
                          state={badgeState}
                          size="xs"
                        />
                      </div>

                      {r.submitDate && (
                        <div className="flex items-center gap-1.5 text-[11px] text-bg-ink-muted">
                          <Calendar className="h-3.5 w-3.5 text-bg-ink-muted" />
                          <span>Diserahkan pada: {r.submitDate}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Grade & Actions */}
                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-5 border-t md:border-t-0 border-bg-border/60 pt-3 md:pt-0 shrink-0 w-full md:w-auto">
                      {/* Grade Info / Berkas */}
                      <div className="flex items-center gap-4 text-[13px] w-full md:w-auto justify-between md:justify-end">
                        {/* File link */}
                        {r.fileUrl ? (
                          <a
                            href={r.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                            aria-label={`Unduh berkas jawaban tugas ${r.siswaName}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Berkas Pengumpulan
                          </a>
                        ) : (
                          <span className="text-bg-ink-muted italic text-[12px]">
                            Tidak ada berkas
                          </span>
                        )}

                        <span className="text-bg-ink-muted/30 hidden md:inline">
                          |
                        </span>

                        {/* Grade Score */}
                        {r.grade !== undefined ? (
                          <div className="flex items-center gap-1 font-semibold text-primary">
                            <Award className="h-4 w-4" />
                            <span>
                              Nilai:{" "}
                              <strong className="font-mono text-[14px]">
                                {r.grade}
                              </strong>
                            </span>
                          </div>
                        ) : (
                          <span className="text-bg-ink-muted italic text-[12px]">
                            Belum dinilai
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="w-full md:w-auto">
                        <Button
                          size="sm"
                          variant={
                            r.grade !== undefined ? "secondary" : "primary"
                          }
                          disabled={r.status === "Belum Mengumpulkan"}
                          onClick={() => void openGradingModal(r)}
                          className="text-[12px] h-8 font-semibold w-full md:w-auto px-4 justify-center"
                          aria-label={
                            r.grade !== undefined
                              ? `Ubah nilai tugas ${r.siswaName}`
                              : `Beri nilai tugas ${r.siswaName}`
                          }
                        >
                          {r.grade !== undefined ? "Ubah Nilai" : "Beri Nilai"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Metadata Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card variant="surface" padding="none" className="p-5 space-y-4">
            <h3 className="text-[14px] font-bold text-bg-ink border-b border-bg-border/60 pb-3 font-sans">
              Detail Pengumpulan
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-bg-border/40 pb-3">
                <span className="text-[13px] font-medium text-bg-ink-secondary">
                  Batas Waktu
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-text-warning font-mono">
                  <Calendar className="h-4 w-4" />
                  {assignment.dueDate}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-bg-ink-secondary">
                  Status Tugas
                </span>
                <StatusBadge
                  label={assignment.status}
                  state={
                    assignment.status === "Dipublikasikan" ? "safe" : "disabled"
                  }
                  size="xs"
                />
              </div>
            </div>
          </Card>

          <SummaryMetricCard
            label="Terkumpul"
            value={roster
              .filter((r) => r.status === "Terkumpul" || r.status === "Late")
              .length.toString()}
            desc="Siswa telah menyerahkan tugas"
            icon={<ClipboardCheck className="h-4 w-4" />}
            variant="safe"
            tooltip="Jumlah siswa yang sudah mengumpulkan tugas (termasuk terlambat)."
          />

          <SummaryMetricCard
            label="Belum Mengumpulkan"
            value={roster
              .filter((r) => r.status === "Belum Mengumpulkan")
              .length.toString()}
            desc="Siswa belum menyerahkan tugas"
            icon={<AlertCircle className="h-4 w-4" />}
            variant="danger"
            tooltip="Jumlah siswa yang belum menyerahkan solusi jawaban."
          />
        </div>
      </div>

      {/* Modal Penilaian */}
      <Modal
        isOpen={!!gradingSubmission}
        onClose={() => setGradingSubmission(null)}
        title={`Penilaian Tugas — ${gradingSubmission?.siswaName || ""}`}
        icon={<Award className="h-4.5 w-4.5 text-primary" />}
        maxWidth="md"
      >
        {gradingSubmission && (
          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <p className="text-[12px] text-bg-ink-secondary">
              Masukkan skor angka evaluasi dan umpan balik untuk solusi jawaban
              yang dikirimkan.
            </p>

            {gradingError && (
              <div className="p-3 text-[12px] bg-bg-danger-tint text-text-danger border border-border-danger/30 rounded-[6px] font-medium">
                {gradingError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="grade-input"
                  className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
                >
                  Nilai Angka (0 - 100){" "}
                  <span className="text-text-danger">*</span>
                </label>
                <input
                  id="grade-input"
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="Contoh: 85"
                  value={inputGrade}
                  onChange={(e) => setInputGrade(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] bg-bg-surface border border-bg-border rounded-[6px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary font-mono font-bold"
                />
              </div>

              <div>
                <label
                  htmlFor="feedback-input"
                  className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
                >
                  Umpan Balik / Catatan Guru
                </label>
                <textarea
                  id="feedback-input"
                  placeholder="Masukkan saran perbaikan atau feedback untuk siswa..."
                  value={inputFeedback}
                  onChange={(e) => setInputFeedback(e.target.value)}
                  className="w-full text-[13px] bg-bg-surface border border-bg-border rounded-[6px] p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[80px] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-bg-border/60">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setGradingSubmission(null)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submittingGrade}>
                {submittingGrade ? "Menyimpan..." : "Simpan Nilai"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default AssignmentDetailPage;

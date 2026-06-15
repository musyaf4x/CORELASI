import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { learningService } from "@/services/learningService";
import type { Tugas, Submission } from "@/types/learning";
import { Card, Button, StatusBadge, Toast, Input } from "@/components/shared";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Award,
  FileText,
  Send,
  RefreshCw,
} from "lucide-react";

export const AssignmentDetailPage: React.FC = () => {
  const { id } = useParams(); // tugasId
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Tugas | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [solutionUrl, setSolutionUrl] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchAssignmentData = useCallback(async () => {
    if (!id || !user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const [tug, sub] = await Promise.all([
        learningService.getTugasById(id),
        learningService.getSubmissionForStudent(id, user.id),
      ]);
      setAssignment(tug);
      setSubmission(sub);
      if (sub) {
        setSolutionUrl(sub.fileUrl || "");
      }
    } catch {
      setToastMessage("Gagal memuat data tugas.");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    void Promise.resolve().then(fetchAssignmentData);
  }, [fetchAssignmentData]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!solutionUrl.trim()) {
      setSubmitError("Masukkan link berkas/dokumen solusi jawaban Anda.");
      return;
    }

    try {
      new URL(solutionUrl);
    } catch {
      setSubmitError(
        "Link berkas harus berupa format URL tautan yang valid (contoh: https://drive.google.com/...)",
      );
      return;
    }

    try {
      await learningService.submitTugasSolution(
        assignment!.id,
        user!.id,
        user!.name,
        solutionUrl,
      );
      setToastMessage("Solusi jawaban tugas berhasil dikumpulkan!");
      await fetchAssignmentData();
    } catch {
      setSubmitError("Gagal mengumpulkan tugas.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <span className="text-[13px] text-bg-ink-muted">Memuat tugas...</span>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="border border-bg-border bg-bg-surface rounded-[6px] p-8 text-center">
        <p className="text-[14px] font-bold text-bg-ink">
          Tugas Tidak Ditemukan
        </p>
        <Button className="mt-4" onClick={() => navigate("/siswa/learning")}>
          Kembali ke Pembelajaran
        </Button>
      </div>
    );
  }

  const isSubmitted = !!submission;

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
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/siswa/learning/${assignment.mapelId}`)}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
            Tugas & Evaluasi
          </h1>
          <p className="mt-1 text-[13px] text-bg-ink-secondary leading-snug">
            Kumpulkan solusi jawaban tugas Anda secara online sebelum batas
            tenggat waktu.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Instruction & Description */}
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
                Petunjuk Soal
              </h4>
              <p className="text-[13px] text-bg-ink-secondary leading-relaxed whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>

            {assignment.fileUrl && (
              <div className="border-t border-bg-border/60 pt-4">
                <h4 className="text-[10px] font-bold text-bg-ink-muted mb-2 uppercase tracking-wider">
                  Lampiran Soal
                </h4>
                <a
                  href={assignment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-bg-border bg-bg-sage-slate/10 hover:bg-bg-sage-slate/20 rounded-[6px] hover:border-border-muted transition-all duration-200 group w-full md:w-auto md:max-w-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-[4px] text-primary group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[13px] font-bold text-bg-ink group-hover:text-primary transition-colors">
                        Berkas Soal Lampiran
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

          {/* Submission Form Card */}
          <Card variant="surface" padding="none" className="p-5 space-y-5">
            <h3 className="text-[15px] font-bold text-bg-ink font-sans flex items-center gap-2 border-b border-bg-border/60 pb-3">
              <FileText className="h-5 w-5 text-primary" />
              Form Pengumpulan Tugas
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {submitError && (
                <div className="p-3 text-[12px] bg-status-danger/[0.04] text-status-danger border border-status-danger/20 rounded-[6px] font-medium">
                  {submitError}
                </div>
              )}

              <div>
                <label
                  htmlFor="solution-url"
                  className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans"
                >
                  Link Tautan Berkas Jawaban (Google Drive, Github, dll.)
                </label>
                <Input
                  id="solution-url"
                  placeholder="cth. https://drive.google.com/file/d/..."
                  value={solutionUrl}
                  onChange={(e) => setSolutionUrl(e.target.value)}
                  disabled={isSubmitted && submission.grade !== undefined} // Lock if already graded
                />
              </div>

              {submission && submission.grade !== undefined ? (
                <div className="p-4 bg-primary/[0.04] border border-primary/20 rounded-[6px] text-bg-ink space-y-3">
                  <div>
                    <span className="block text-[10px] font-bold text-bg-ink-muted uppercase tracking-wider">
                      Nilai & Umpan Balik Guru
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 font-semibold text-[13px]">
                      <Award className="h-4.5 w-4.5 text-primary" />
                      <span>
                        Skor:{" "}
                        <strong className="text-primary font-mono text-[16px]">
                          {submission.grade}
                        </strong>{" "}
                        / 100
                      </span>
                    </div>
                  </div>
                  {submission.feedback && (
                    <div className="text-[12px] text-bg-ink-secondary leading-relaxed bg-bg-surface p-3 border border-bg-border rounded-[6px]">
                      <span className="block text-[10px] font-bold text-bg-ink-muted uppercase tracking-wider mb-1">
                        Catatan Guru
                      </span>
                      <p className="italic">"{submission.feedback}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-end pt-2">
                  <Button type="submit" className="gap-1.5">
                    {isSubmitted ? (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Kumpulkan Ulang
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Kumpulkan Tugas
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </div>

        {/* Right column: Status details */}
        <div className="lg:col-span-1">
          <Card variant="subtle" padding="none" className="p-5 space-y-4">
            <h3 className="text-[14px] font-bold text-bg-ink border-b border-bg-border/60 pb-3">
              Status Pengumpulan
            </h3>

            <div className="space-y-4">
              <div>
                <span className="block text-[10px] font-bold text-bg-ink-muted uppercase tracking-wider">
                  Tenggat Waktu
                </span>
                <span className="inline-flex items-center gap-1.5 mt-1.5 text-[13px] font-bold text-status-warning font-mono">
                  <Calendar className="h-4 w-4" />
                  {assignment.dueDate}
                </span>
              </div>

              <div className="border-t border-bg-border/60 pt-4">
                <span className="block text-[10px] font-bold text-bg-ink-muted uppercase tracking-wider">
                  Status Pengumpulan Anda
                </span>
                <span className="mt-1.5 block">
                  {isSubmitted ? (
                    <StatusBadge
                      label={submission.status}
                      state={
                        submission.status === "Terkumpul" ? "safe" : "warning"
                      }
                      size="sm"
                    />
                  ) : (
                    <StatusBadge
                      label="Belum Mengumpulkan"
                      state="danger"
                      size="sm"
                    />
                  )}
                </span>
                {isSubmitted && (
                  <span className="block mt-2 text-[11px] text-bg-ink-muted">
                    Dikumpulkan pada: {submission.submitDate}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default AssignmentDetailPage;

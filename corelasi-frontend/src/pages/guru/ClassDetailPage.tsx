import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { learningService } from "@/services/learningService";
import { journalService } from "@/services/journalService";
import { scheduleService } from "@/services/scheduleService";
import { userService } from "@/services/userService";
import type { Materi, Tugas, Submission } from "@/types/learning";
import type { JurnalPertemuan } from "@/types/journal";
import {
  DetailTabs,
  DataTable,
  StatusBadge,
  Button,
  Modal,
  Input,
  LoadingState,
  ErrorState,
} from "@/components/shared";
import {
  Award,
  BarChart3,
  Plus,
  Eye,
  ArrowLeft,
  Calendar,
  FileText,
  Download,
  BookOpen,
  FileCheck2,
  ExternalLink,
} from "lucide-react";

interface MapelTheme {
  border: string;
  bgHeader: string;
  textPrimary: string;
  textSecondary: string;
  badgeState:
    | "info"
    | "safe"
    | "warning"
    | "danger"
    | "neutral"
    | "excellent"
    | "pending";
}

const getMapelTheme = (mapelName: string): MapelTheme => {
  const name = mapelName.toLowerCase();

  if (name.includes("matematika") || name.includes("math")) {
    return {
      border: "border-t-status-info",
      bgHeader: "bg-status-info/[0.04]",
      textPrimary: "text-text-info",
      textSecondary: "text-text-info/80",
      badgeState: "info",
    };
  }

  if (name.includes("fisika") || name.includes("physics")) {
    return {
      border: "border-t-primary",
      bgHeader: "bg-primary/[0.04]",
      textPrimary: "text-primary",
      textSecondary: "text-primary-hover",
      badgeState: "excellent",
    };
  }

  if (name.includes("kimia") || name.includes("chemistry")) {
    return {
      border: "border-t-status-excellent",
      bgHeader: "bg-bg-excellent-tint",
      textPrimary: "text-text-excellent",
      textSecondary: "text-text-excellent/80",
      badgeState: "excellent",
    };
  }

  if (name.includes("biologi") || name.includes("biology")) {
    return {
      border: "border-t-status-safe",
      bgHeader: "bg-bg-safe-tint",
      textPrimary: "text-text-safe",
      textSecondary: "text-text-safe/80",
      badgeState: "safe",
    };
  }

  // Default Fallback
  return {
    border: "border-t-bg-border-muted",
    bgHeader: "bg-bg-sage-slate",
    textPrimary: "text-bg-ink-secondary",
    textSecondary: "text-bg-ink-muted",
    badgeState: "neutral",
  };
};

export const ClassDetailPage: React.FC = () => {
  const { id: kelasId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mapelId = searchParams.get("mapel") || "";
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("materi");
  const [penilaianFilter, setPenilaianFilter] = useState<"belum" | "sudah">(
    "belum",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [materis, setMateris] = useState<Materi[]>([]);
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [journals, setJournals] = useState<JurnalPertemuan[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [classContext, setClassContext] = useState({
    kelasName: "",
    mapelName: "",
  });

  // Journal Detail & Edit Modal State
  const [selectedJournal, setSelectedJournal] =
    useState<JurnalPertemuan | null>(null);
  const [isEditJournal, setIsEditJournal] = useState(false);
  const [editAgenda, setEditAgenda] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPresent, setEditPresent] = useState(0);
  const [editAbsent, setEditAbsent] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [journalError, setJournalError] = useState<string | null>(null);

  const openJournalModal = (j: JurnalPertemuan) => {
    setSelectedJournal(j);
    setIsEditJournal(false);
    setEditAgenda(j.agenda);
    setEditSummary(j.materialSummary);
    setEditDate(j.date);
    setEditPresent(j.presentCount);
    setEditAbsent(j.absentCount);
    setEditNotes(j.notes || "");
    setJournalError(null);
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJournal) return;
    if (!editAgenda.trim() || !editSummary.trim()) {
      setJournalError("Agenda dan Ringkasan Materi wajib diisi.");
      return;
    }
    try {
      const updated = await journalService.updateJournal(selectedJournal.id, {
        agenda: editAgenda,
        materialSummary: editSummary,
        date: editDate,
        presentCount: Number(editPresent),
        absentCount: Number(editAbsent),
        notes: editNotes.trim() || undefined,
      });
      setJournals((prev) =>
        prev.map((j) => (j.id === updated.id ? updated : j)),
      );
      setSelectedJournal(null);
      setIsEditJournal(false);
    } catch {
      setJournalError("Gagal memperbarui jurnal.");
    }
  };

  // Class info derived from data
  const kelasName =
    materis[0]?.kelasName ||
    tugasList[0]?.kelasName ||
    classContext.kelasName ||
    "-";
  const mapelName =
    materis[0]?.mapelName ||
    tugasList[0]?.mapelName ||
    classContext.mapelName ||
    "-";
  const guruName = user?.name || "-";

  useEffect(() => {
    const loadData = async () => {
      if (!kelasId || !user) return;
      setLoading(true);
      setError(null);
      try {
        const [allMateris, allTugas, allSubs, allJournals, schedules, users] =
          await Promise.all([
            learningService.getMateriByGuru(user.id),
            learningService.getTugasByGuru(user.id),
            learningService.getSubmissions(),
            journalService.getJournals(),
            scheduleService.getJadwalPembelajaran(),
            userService.getAll(),
          ]);

        const filtered = {
          materis: allMateris.filter(
            (m) =>
              String(m.kelasId) === String(kelasId) &&
              (mapelId ? String(m.mapelId) === String(mapelId) : true),
          ),
          tugas: allTugas.filter(
            (t) =>
              String(t.kelasId) === String(kelasId) &&
              (mapelId ? String(t.mapelId) === String(mapelId) : true),
          ),
          journals: allJournals.filter(
            (j) =>
              String(j.kelasId) === String(kelasId) &&
              (mapelId ? String(j.mapelId) === String(mapelId) : true),
          ),
        };

        // Get submissions for this teacher's assignments
        const tugasIds = filtered.tugas.map((t) => String(t.id));
        const filteredSubs = allSubs.filter((s) =>
          tugasIds.includes(String(s.tugasId)),
        );

        setMateris(filtered.materis);
        setTugasList(filtered.tugas);
        setSubmissions(filteredSubs);
        setJournals(filtered.journals);
        setStudentCount(
          users.filter(
            (item) =>
              item.role === "siswa" &&
              String(item.kelasId ?? "") === String(kelasId),
          ).length,
        );
        const matchingSchedule = schedules.find(
          (schedule) =>
            String(schedule.kelasId) === String(kelasId) &&
            (!mapelId || String(schedule.mapelId) === String(mapelId)),
        );
        setClassContext({
          kelasName: matchingSchedule?.kelasName ?? "",
          mapelName: matchingSchedule?.mapelName ?? "",
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat data kelas pembelajaran.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [kelasId, mapelId, user]);

  const tabs = [
    { id: "materi", label: "Materi", count: materis.length },
    { id: "tugas", label: "Tugas", count: tugasList.length },
    { id: "penilaian", label: "Penilaian", count: submissions.length },
    { id: "jurnal", label: "Jurnal", count: journals.length },
    { id: "rekap", label: "Rekap" },
  ];

  // Compute average attendance
  let avgAttendance = 0;
  let totalPresent = 0;
  let totalAbsent = 0;
  journals.forEach((j) => {
    totalPresent += j.presentCount;
    totalAbsent += j.absentCount;
  });
  const totalStudentsCombined = totalPresent + totalAbsent;
  if (totalStudentsCombined > 0) {
    avgAttendance = Math.round((totalPresent / totalStudentsCombined) * 100);
  }

  const submissionsBelum = submissions.filter(
    (s) => s.grade === undefined || s.grade === null,
  );
  const submissionsSudah = submissions.filter(
    (s) => s.grade !== undefined && s.grade !== null,
  );
  const filteredSubmissions =
    penilaianFilter === "sudah" ? submissionsSudah : submissionsBelum;

  const theme = getMapelTheme(mapelName);

  if (loading) {
    return <LoadingState message="Memuat data kelas pembelajaran..." />;
  }

  if (error) {
    return (
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to="/guru/classes"
        className="inline-flex items-center gap-1 text-[12px] text-bg-ink-muted hover:text-primary transition-colors font-medium"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke Kelas Saya
      </Link>

      {/* Header card with matching subject color theme */}
      <div
        className={`rounded-[6px] border border-bg-border ${theme.bgHeader} p-6 shadow-[0_1px_3px_rgba(20,33,26,0.05)]`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight text-bg-ink font-sans">
              {kelasName}
            </h1>
            <p
              className={`mt-0.5 text-[15px] font-semibold ${theme.textPrimary}`}
            >
              {mapelName}
            </p>
            <p className="mt-2 text-[12px] text-bg-ink-muted">
              Guru Pengampu:{" "}
              <span className="font-semibold text-bg-ink-secondary">
                {guruName}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/guru/materials/create">
              <Button
                size="sm"
                variant="secondary"
                className="gap-1 text-[11px] font-semibold h-8 bg-bg-surface hover:bg-bg-sage-slate"
              >
                <Plus className="h-3.5 w-3.5" /> Materi Baru
              </Button>
            </Link>
            <Link to="/guru/assignments/create">
              <Button size="sm" className="gap-1 text-[11px] font-semibold h-8">
                <Plus className="h-3.5 w-3.5" /> Tugas Baru
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <DetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Tab Content */}
      <div className="mt-4">
        {/* TAB: MATERI */}
        {activeTab === "materi" && (
          <div className="space-y-3">
            {materis.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-[6px] border border-bg-border bg-bg-surface p-8 text-center shadow-[0_1px_3px_rgba(20,33,26,0.04)]">
                <FileText className="mb-3 h-10 w-10 text-bg-ink-muted" />
                <h3 className="text-[14px] font-semibold text-bg-ink">
                  Belum ada materi
                </h3>
                <p className="mt-1 text-[12px] text-bg-ink-muted max-w-sm">
                  Belum ada materi yang diunggah untuk mata pelajaran ini. Klik
                  "Materi Baru" untuk mengunggah materi pertama.
                </p>
              </div>
            ) : (
              materis.map((m) => (
                <div
                  key={m.id}
                  className="rounded-[6px] border border-bg-border bg-bg-surface p-4 flex items-center justify-between shadow-[0_1px_3px_rgba(20,33,26,0.04)] hover:border-bg-border-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-bg-sage-slate rounded-[6px] text-bg-ink-secondary">
                      <FileText className={`h-5 w-5 ${theme.textPrimary}`} />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold text-bg-ink leading-snug">
                        {m.title}
                      </h3>
                      <span className="text-[11px] text-bg-ink-muted mt-1 block font-mono">
                        Dipublikasikan pada {m.dateCreated}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      label={m.status}
                      state={
                        m.status === "Dipublikasikan" ? "safe" : "disabled"
                      }
                      size="xs"
                    />
                    {m.fileUrl && (
                      <a href={m.fileUrl} target="_blank" rel="noreferrer">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 gap-1.5 text-[11px] font-semibold bg-bg-surface hover:bg-bg-sage-slate border border-bg-border"
                        >
                          {m.sourceType === "link" ? (
                            <>
                              <ExternalLink className="h-3.5 w-3.5" /> Buka
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" /> Unduh
                            </>
                          )}
                        </Button>
                      </a>
                    )}
                    <Link to={`/guru/materials/${m.id}/edit`}>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 text-[11px] font-semibold bg-bg-surface hover:bg-bg-sage-slate border border-bg-border"
                      >
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: TUGAS */}
        {activeTab === "tugas" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {tugasList.length === 0 ? (
              <div className="sm:col-span-2 flex h-48 flex-col items-center justify-center rounded-[6px] border border-bg-border bg-bg-surface p-8 text-center shadow-[0_1px_3px_rgba(20,33,26,0.04)]">
                <FileCheck2 className="mb-3 h-10 w-10 text-bg-ink-muted" />
                <h3 className="text-[14px] font-semibold text-bg-ink">
                  Belum ada tugas
                </h3>
                <p className="mt-1 text-[12px] text-bg-ink-muted max-w-sm">
                  Belum ada tugas yang diberikan untuk kelas ini. Klik "Tugas
                  Baru" untuk membuat tugas.
                </p>
              </div>
            ) : (
              tugasList.map((t) => {
                const count = submissions.filter(
                  (s) => s.tugasId === t.id,
                ).length;
                const percent =
                  studentCount > 0
                    ? Math.min(100, Math.round((count / studentCount) * 100))
                    : 0;
                return (
                  <div
                    key={t.id}
                    className="rounded-[6px] border border-bg-border bg-bg-surface p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(20,33,26,0.04)] hover:border-bg-border-muted transition-colors"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="text-[14px] font-bold text-bg-ink leading-snug">
                          {t.title}
                        </h3>
                        <StatusBadge
                          label={t.status}
                          state={
                            t.status === "Dipublikasikan" ? "safe" : "disabled"
                          }
                          size="xs"
                        />
                      </div>

                      {/* Deadline */}
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-status-warning font-semibold mb-4">
                        <Calendar className="h-3.5 w-3.5" />
                        Tenggat: {t.dueDate}
                      </div>
                    </div>

                    <div className="space-y-3 pt-3.5 border-t border-bg-border/30">
                      {/* Submission Progress */}
                      <div className="flex justify-between items-center text-[11px] font-medium text-bg-ink-secondary">
                        <span>Pengumpulan Siswa</span>
                        <span className="font-mono">
                          {count} / {studentCount} ({percent}%)
                        </span>
                      </div>
                      {/* Elegant progress bar */}
                      <div className="w-full bg-bg-sage-slate h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Action */}
                      <div className="pt-1.5 flex justify-end">
                        <Link to={`/guru/assignments/${t.id}`}>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-[11px] font-semibold gap-1.5 bg-bg-surface hover:bg-bg-sage-slate border border-bg-border"
                          >
                            <Eye className="h-3.5 w-3.5" /> Detail & Koreksi
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB: PENILAIAN */}
        {activeTab === "penilaian" && (
          <div className="space-y-4">
            {/* Segment Filter for Grading */}
            <div className="flex gap-2 border-b border-bg-border/60 pb-3">
              <button
                type="button"
                onClick={() => setPenilaianFilter("belum")}
                className={`text-[13px] font-semibold px-3 py-1.5 rounded-[6px] border transition-colors ${
                  penilaianFilter === "belum"
                    ? "bg-primary/[0.08] text-primary border-primary/20"
                    : "text-bg-ink-secondary hover:bg-bg-sage-slate border-transparent"
                }`}
              >
                Belum Dinilai ({submissionsBelum.length})
              </button>
              <button
                type="button"
                onClick={() => setPenilaianFilter("sudah")}
                className={`text-[13px] font-semibold px-3 py-1.5 rounded-[6px] border transition-colors ${
                  penilaianFilter === "sudah"
                    ? "bg-primary/[0.08] text-primary border-primary/20"
                    : "text-bg-ink-secondary hover:bg-bg-sage-slate border-transparent"
                }`}
              >
                Sudah Dinilai ({submissionsSudah.length})
              </button>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="rounded-[6px] border border-bg-border bg-bg-surface p-8 text-center shadow-[0_1px_3px_rgba(20,33,26,0.04)]">
                <Award className="mx-auto mb-3 h-10 w-10 text-bg-ink-muted" />
                <h3 className="text-[14px] font-semibold text-bg-ink">
                  {penilaianFilter === "belum"
                    ? "Semua tugas telah dinilai!"
                    : "Belum ada nilai terbit"}
                </h3>
                <p className="mt-1 text-[12px] text-bg-ink-muted max-w-sm mx-auto">
                  {penilaianFilter === "belum"
                    ? "Kerja bagus! Seluruh tugas siswa pada mapel ini telah selesai dikoreksi."
                    : "Siswa belum memiliki riwayat tugas yang telah dinilai."}
                </p>
              </div>
            ) : (
              <DataTable
                title={
                  penilaianFilter === "belum"
                    ? "Daftar Tugas Belum Dinilai"
                    : "Daftar Tugas Sudah Dinilai"
                }
                columns={[
                  {
                    header: "Nama Siswa",
                    cell: (s: Submission) => (
                      <span className="text-[13px] font-semibold text-bg-ink">
                        {s.siswaName}
                      </span>
                    ),
                  },
                  {
                    header: "Tugas",
                    cell: (s: Submission) => {
                      const tugas = tugasList.find(
                        (t) => String(t.id) === String(s.tugasId),
                      );
                      return (
                        <span className="text-[13px] text-bg-ink-secondary">
                          {tugas ? tugas.title : "Tugas Asing"}
                        </span>
                      );
                    },
                  },
                  {
                    header: "Tanggal Kumpul",
                    cell: (s: Submission) => (
                      <span className="text-[12px] font-mono text-bg-ink-secondary">
                        {s.submitDate}
                      </span>
                    ),
                  },
                  {
                    header: "Nilai",
                    cell: (s: Submission) => {
                      if (s.grade !== undefined && s.grade !== null) {
                        const isExcellent = s.grade >= 90;
                        return (
                          <StatusBadge
                            label={String(s.grade)}
                            state={isExcellent ? "excellent" : "safe"}
                            size="xs"
                            showDot={false}
                          />
                        );
                      }
                      return (
                        <StatusBadge
                          label="Belum Dinilai"
                          state="warning"
                          size="xs"
                          showDot={true}
                        />
                      );
                    },
                  },
                  {
                    header: "Aksi",
                    cell: (s: Submission) => (
                      <Link to={`/guru/assignments/${s.tugasId}`}>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-[11px] h-7 gap-1 font-semibold bg-bg-surface hover:bg-bg-sage-slate border border-bg-border"
                        >
                          {s.grade !== undefined && s.grade !== null
                            ? "Ubah Nilai"
                            : "Beri Nilai"}
                        </Button>
                      </Link>
                    ),
                  },
                ]}
                data={filteredSubmissions}
                keyExtractor={(s) => s.id}
              />
            )}
          </div>
        )}

        {/* TAB: JURNAL */}
        {activeTab === "jurnal" && (
          <div className="space-y-4">
            {journals.length === 0 ? (
              <div className="rounded-[6px] border border-bg-border bg-bg-surface p-8 text-center shadow-[0_1px_3px_rgba(20,33,26,0.04)]">
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-bg-ink-muted" />
                <h3 className="text-[14px] font-semibold text-bg-ink">
                  Belum ada jurnal
                </h3>
                <p className="mt-1 text-[12px] text-bg-ink-muted max-w-sm mx-auto">
                  Belum ada jurnal pertemuan yang diisi untuk kelas ini. Hubungi
                  Piket untuk verifikasi.
                </p>
              </div>
            ) : (
              <div className="rounded-[6px] border border-bg-border bg-bg-surface p-6 shadow-[0_1px_3px_rgba(20,33,26,0.04)]">
                <h3 className="text-[15px] font-bold text-bg-ink mb-6">
                  Linimasa Pertemuan Kelas
                </h3>
                <div className="relative pl-6 border-l border-bg-border/60 ml-2 space-y-8">
                  {journals.map((j, index) => (
                    <div key={j.id} className="relative">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full border-2 ${theme.border.replace("border-t-", "border-")} bg-bg-surface flex items-center justify-center shadow-sm`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-bold text-bg-ink">
                              Pertemuan {journals.length - index}
                            </span>
                            <span className="text-[11px] font-mono text-bg-ink-muted bg-bg-sage-slate px-2 py-0.5 rounded-[4px] border border-bg-border/30">
                              {j.date}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[13px] font-medium text-bg-ink-secondary">
                            {j.agenda}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-bg-ink-secondary bg-bg-sage-slate/50 px-3 py-1.5 rounded-[6px] border border-bg-border/40 font-mono">
                            {j.presentCount} Hadir &bull; {j.absentCount} Absen
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 text-[11px] font-semibold bg-bg-surface hover:bg-bg-sage-slate border border-bg-border"
                            onClick={() => openJournalModal(j)}
                          >
                            Detail & Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: REKAP */}
        {activeTab === "rekap" && (
          <div className="space-y-6">
            {/* Metric Overview Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              {/* Card 1: Total Pertemuan */}
              <div className="rounded-[6px] border border-bg-border bg-bg-surface p-5 shadow-[0_1px_3px_rgba(20,33,26,0.05)]">
                <span className="text-[13px] font-semibold text-bg-ink-secondary block mb-2">
                  Total Pertemuan
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-bold text-bg-ink font-mono tracking-[-0.5px] leading-none">
                    {journals.length}
                  </span>
                  <span className="text-[12px] text-bg-ink-secondary">
                    Sesi Jurnal
                  </span>
                </div>
              </div>

              {/* Card 2: Tugas Aktif */}
              <div className="rounded-[6px] border border-bg-border bg-bg-surface p-5 shadow-[0_1px_3px_rgba(20,33,26,0.05)]">
                <span className="text-[13px] font-semibold text-bg-ink-secondary block mb-2">
                  Tugas Pembelajaran
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-bold text-bg-ink font-mono tracking-[-0.5px] leading-none">
                    {tugasList.length}
                  </span>
                  <span className="text-[12px] text-bg-ink-secondary">
                    Penugasan
                  </span>
                </div>
              </div>

              {/* Card 3: Rata-Rata Kehadiran */}
              <div className="rounded-[6px] border border-bg-border bg-bg-surface p-5 shadow-[0_1px_3px_rgba(20,33,26,0.05)]">
                <span className="text-[13px] font-semibold text-bg-ink-secondary block mb-2">
                  Persentase Kehadiran
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-bold text-primary font-mono tracking-[-0.5px] leading-none">
                    {avgAttendance}%
                  </span>
                  <span className="text-[12px] text-bg-ink-secondary">
                    Rata-Rata Siswa
                  </span>
                </div>
              </div>
            </div>

            {/* Rekap Action Box */}
            <div className="rounded-[6px] border border-bg-border bg-bg-surface p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_1px_3px_rgba(20,33,26,0.04)]">
              <div>
                <h3 className="text-[15px] font-bold text-bg-ink">
                  Rekap Absensi & Nilai Lengkap
                </h3>
                <p className="mt-1 text-[12px] text-bg-ink-muted">
                  Buka laporan rekapitulasi absensi bulanan, rekap nilai kelas,
                  dan data jurnal untuk diprint atau diekspor ke Excel.
                </p>
              </div>
              <Link to="/guru/reports/classes" className="shrink-0">
                <Button className="gap-1.5 text-[12px] font-semibold">
                  <BarChart3 className="h-4 w-4" /> Buka Rekap Laporan
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Journal Detail & Edit Modal */}
      <Modal
        isOpen={selectedJournal !== null}
        onClose={() => {
          setSelectedJournal(null);
          setIsEditJournal(false);
        }}
        title={
          isEditJournal ? "Ubah Jurnal Pertemuan" : "Detail Jurnal Pertemuan"
        }
        maxWidth="lg"
      >
        {selectedJournal && (
          <form onSubmit={handleSaveJournal} className="space-y-4">
            {journalError && (
              <div className="p-3 text-[12px] bg-status-danger/10 text-status-danger border border-status-danger/25 rounded-[6px] font-medium">
                {journalError}
              </div>
            )}

            {!isEditJournal ? (
              // READ-ONLY DETAIL MODE
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-bg-border/40">
                  <div>
                    <span className="block text-[11px] font-semibold text-bg-ink-muted">
                      Tanggal Pertemuan
                    </span>
                    <span className="text-[13px] font-semibold text-bg-ink font-mono mt-0.5 block">
                      {selectedJournal.date}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-bg-ink-muted">
                      Kelas / Mata Pelajaran
                    </span>
                    <span className="text-[13px] font-semibold text-bg-ink mt-0.5 block">
                      {selectedJournal.kelasName} &bull;{" "}
                      {selectedJournal.mapelName}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-bg-ink-muted">
                    Agenda Pembelajaran
                  </span>
                  <span className="text-[14px] font-bold text-bg-ink mt-1 block leading-snug">
                    {selectedJournal.agenda}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-bg-ink-muted">
                    Ringkasan / Uraian Materi
                  </span>
                  <p className="text-[13px] text-bg-ink-secondary mt-1 block leading-relaxed whitespace-pre-wrap">
                    {selectedJournal.materialSummary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-bg-sage-slate/40 rounded-[6px] border border-bg-border/30">
                  <div>
                    <span className="block text-[11px] font-semibold text-bg-ink-muted">
                      Siswa Hadir
                    </span>
                    <span className="text-[16px] font-bold text-text-safe font-mono mt-0.5 block">
                      {selectedJournal.presentCount} Siswa
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-bg-ink-muted">
                      Siswa Absen/Izin
                    </span>
                    <span className="text-[16px] font-bold text-text-danger font-mono mt-0.5 block">
                      {selectedJournal.absentCount} Siswa
                    </span>
                  </div>
                </div>

                {selectedJournal.notes && (
                  <div>
                    <span className="block text-[11px] font-semibold text-bg-ink-muted">
                      Catatan Khusus KBM
                    </span>
                    <p className="text-[13px] text-bg-ink-secondary mt-1 block italic leading-relaxed">
                      {selectedJournal.notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-bg-border/60">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSelectedJournal(null);
                      setIsEditJournal(false);
                    }}
                  >
                    Tutup
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditJournal(true);
                    }}
                  >
                    Edit Jurnal
                  </Button>
                </div>
              </div>
            ) : (
              // EDIT FORM MODE
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                      Tanggal Pertemuan
                    </label>
                    <Input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                      Rombel Kelas / Mapel
                    </label>
                    <div className="text-[13px] font-bold text-bg-ink px-3 py-2 bg-bg-sage-slate/40 rounded-[6px] border border-bg-border/30 h-10 flex items-center">
                      {selectedJournal.kelasName} &bull;{" "}
                      {selectedJournal.mapelName}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                    Agenda / Judul Pembelajaran
                  </label>
                  <Input
                    required
                    value={editAgenda}
                    onChange={(e) => setEditAgenda(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                    Ringkasan / Uraian Materi Ajar
                  </label>
                  <textarea
                    required
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full text-[13px] bg-bg-surface border border-bg-border rounded-[6px] p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[90px] font-sans resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                      Siswa Hadir
                    </label>
                    <div className="text-[13px] font-bold text-text-safe px-3 py-2 bg-bg-sage-slate/40 rounded-[6px] border border-bg-border/30 h-10 flex items-center font-mono">
                      {editPresent} Siswa
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                      Siswa Absen/Izin
                    </label>
                    <div className="text-[13px] font-bold text-text-danger px-3 py-2 bg-bg-sage-slate/40 rounded-[6px] border border-bg-border/30 h-10 flex items-center font-mono">
                      {editAbsent} Siswa
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-bg-ink-secondary mb-1.5 font-sans">
                    Catatan Khusus KBM
                  </label>
                  <textarea
                    placeholder="Opsional..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full text-[13px] bg-bg-surface border border-bg-border rounded-[6px] p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[60px] font-sans resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-bg-border/60">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditJournal(false);
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit">Simpan Perubahan</Button>
                </div>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ClassDetailPage;

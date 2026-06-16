import { describe, it, expect, beforeEach } from "vitest";
import { learningService } from "../services/learningService";

describe("WBT — Case 1: Guru membuat materi dengan 1 file attachment valid", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("harus menyimpan materi baru dengan sourceType='file' dan fileUrl valid", async () => {
    const input = {
      title: "Gelombang Elektromagnetik",
      description: "Materi tentang spektrum EM, cepat rambat, dan aplikasinya.",
      sourceType: "file" as const,
      fileUrl: "https://files.sekolah.id/fisika/gelombang-em.pdf",
      kelasId: "k-2",
      kelasName: "XI-A",
      mapelId: "mp-2",
      mapelName: "Fisika",
      guruId: "2",
      guruName: "Budi Santoso, M.Pd.",
      status: "Dipublikasikan" as const,
    };

    const result = await learningService.createMateri(input);

    // ID dan tanggal harus di-generate otomatis
    expect(result.id).toBeDefined();
    expect(result.id).toMatch(/^mat-\d+$/);
    expect(result.dateCreated).toBeDefined();
    expect(result.dateCreated).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Field input harus tersimpan persis
    expect(result.sourceType).toBe("file");
    expect(result.fileUrl).toBe(
      "https://files.sekolah.id/fisika/gelombang-em.pdf",
    );
    expect(result.title).toBe("Gelombang Elektromagnetik");
    expect(result.status).toBe("Dipublikasikan");
    expect(result.guruId).toBe("2");
    expect(result.kelasId).toBe("k-2");
  });

  it("materi yang baru dibuat harus bisa ditemukan kembali lewat getMateriById", async () => {
    const input = {
      title: "Hukum Termodinamika I",
      description: "Energi dalam, kalor, dan kerja.",
      sourceType: "file" as const,
      fileUrl: "https://files.sekolah.id/fisika/termodinamika-1.pdf",
      kelasId: "k-2",
      kelasName: "XI-A",
      mapelId: "mp-2",
      mapelName: "Fisika",
      guruId: "2",
      guruName: "Budi Santoso, M.Pd.",
      status: "Dipublikasikan" as const,
    };

    const created = await learningService.createMateri(input);
    const found = await learningService.getMateriById(created.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.fileUrl).toBe(
      "https://files.sekolah.id/fisika/termodinamika-1.pdf",
    );
    expect(found!.sourceType).toBe("file");
  });

  it("materi yang baru dibuat harus muncul pada daftar milik guru yang bersangkutan", async () => {
    const input = {
      title: "Optika Geometri",
      description: "Pembiasan, pemantulan, dan lensa.",
      sourceType: "file" as const,
      fileUrl: "https://files.sekolah.id/fisika/optika.pdf",
      kelasId: "k-2",
      kelasName: "XI-A",
      mapelId: "mp-2",
      mapelName: "Fisika",
      guruId: "2",
      guruName: "Budi Santoso, M.Pd.",
      status: "Dipublikasikan" as const,
    };

    const created = await learningService.createMateri(input);
    const guruList = await learningService.getMateriByGuru("2");

    const match = guruList.find((m) => m.id === created.id);
    expect(match).toBeDefined();
    expect(match!.fileUrl).toBe("https://files.sekolah.id/fisika/optika.pdf");
  });

  it("fileUrl harus tersimpan utuh tanpa modifikasi (tidak di-encode atau dipotong)", async () => {
    const originalUrl =
      "https://drive.google.com/file/d/1abc-XYZ_def/view?usp=sharing";

    const input = {
      title: "Materi dengan URL Drive",
      description: "Test URL panjang.",
      sourceType: "file" as const,
      fileUrl: originalUrl,
      kelasId: "k-1",
      kelasName: "X-A",
      mapelId: "mp-1",
      mapelName: "Matematika",
      guruId: "3",
      guruName: "Siti Aminah, S.Pd.",
      status: "Dipublikasikan" as const,
    };

    const created = await learningService.createMateri(input);
    expect(created.fileUrl).toBe(originalUrl);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("WBT — Case 2: Siswa submit external link sebelum deadline", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("harus menghasilkan status 'Terkumpul' ketika submit dilakukan sebelum dueDate", async () => {
    // Buat tugas dengan dueDate jauh di masa depan
    const tugas = await learningService.createTugas({
      title: "Proyek Akhir Fisika",
      description: "Upload laporan proyek sebagai external link.",
      dueDate: "2099-12-31", // pasti belum lewat
      kelasId: "k-2",
      kelasName: "XI-A",
      mapelId: "mp-2",
      mapelName: "Fisika",
      guruId: "2",
      guruName: "Budi Santoso, M.Pd.",
      status: "Dipublikasikan" as const,
    });

    const externalLink =
      "https://docs.google.com/presentation/d/siswa-ahmad-proyek-fisika";

    const submission = await learningService.submitTugasSolution(
      tugas.id,
      "5",
      "Ahmad Fauzi",
      externalLink,
    );

    // Status harus "Terkumpul", bukan "Late"
    expect(submission.status).toBe("Terkumpul");
    expect(submission.fileUrl).toBe(externalLink);
    expect(submission.tugasId).toBe(tugas.id);
    expect(submission.siswaId).toBe("5");
    expect(submission.siswaName).toBe("Ahmad Fauzi");
    expect(submission.id).toMatch(/^sub-\d+$/);
    expect(submission.submitDate).toBeDefined();
  });

  it("submission harus bisa ditemukan kembali lewat getSubmissionForStudent", async () => {
    const tugas = await learningService.createTugas({
      title: "Laporan Praktikum",
      description: "Upload link laporan Google Docs.",
      dueDate: "2099-12-31",
      kelasId: "k-2",
      kelasName: "XI-A",
      mapelId: "mp-2",
      mapelName: "Fisika",
      guruId: "2",
      guruName: "Budi Santoso, M.Pd.",
      status: "Dipublikasikan" as const,
    });

    const externalLink =
      "https://docs.google.com/document/d/laporan-praktikum-siswa";

    await learningService.submitTugasSolution(
      tugas.id,
      "6",
      "Dewi Lestari",
      externalLink,
    );

    const found = await learningService.getSubmissionForStudent(tugas.id, "6");

    expect(found).not.toBeNull();
    expect(found!.fileUrl).toBe(externalLink);
    expect(found!.status).toBe("Terkumpul");
    expect(found!.siswaName).toBe("Dewi Lestari");
  });

  it("submit ulang (resubmit) sebelum deadline harus memperbarui fileUrl dan tetap 'Terkumpul'", async () => {
    const tugas = await learningService.createTugas({
      title: "Revisi Laporan",
      description: "Upload link revisi.",
      dueDate: "2099-12-31",
      kelasId: "k-2",
      kelasName: "XI-A",
      mapelId: "mp-2",
      mapelName: "Fisika",
      guruId: "2",
      guruName: "Budi Santoso, M.Pd.",
      status: "Dipublikasikan" as const,
    });

    const firstLink = "https://docs.google.com/document/d/draft-v1";
    const revisedLink = "https://docs.google.com/document/d/final-v2";

    // Submit pertama
    await learningService.submitTugasSolution(
      tugas.id,
      "7",
      "Fajar Nugroho",
      firstLink,
    );

    // Submit ulang dengan link revisi
    const resubmit = await learningService.submitTugasSolution(
      tugas.id,
      "7",
      "Fajar Nugroho",
      revisedLink,
    );

    expect(resubmit.fileUrl).toBe(revisedLink);
    expect(resubmit.status).toBe("Terkumpul");

    // Pastikan hanya ada 1 submission untuk siswa ini
    const all = await learningService.getSubmissionsByTugas(tugas.id);
    const forSiswa = all.filter((s) => s.siswaId === "7");
    expect(forSiswa).toHaveLength(1);
  });

  it("external link harus tersimpan utuh sebagai fileUrl (URL panjang dengan query params)", async () => {
    const tugas = await learningService.createTugas({
      title: "Upload Canva",
      description: "Presentasi via Canva.",
      dueDate: "2099-12-31",
      kelasId: "k-2",
      kelasName: "XI-A",
      mapelId: "mp-2",
      mapelName: "Fisika",
      guruId: "2",
      guruName: "Budi Santoso, M.Pd.",
      status: "Dipublikasikan" as const,
    });

    const longUrl =
      "https://www.canva.com/design/DAF_abc123XYZ/view?utm_content=DAF_abc123&utm_campaign=share";

    const submission = await learningService.submitTugasSolution(
      tugas.id,
      "8",
      "Hendra Wijaya",
      longUrl,
    );

    expect(submission.fileUrl).toBe(longUrl);
    expect(submission.status).toBe("Terkumpul");
  });
});

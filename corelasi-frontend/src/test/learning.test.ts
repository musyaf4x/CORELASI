import { describe, it, expect, beforeEach } from "vitest";
import { learningService } from "../services/learningService";

describe("Learning Service Mock Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Materi (Materials)", () => {
    it("should upload a material file through the learning service", async () => {
      const file = new File(["sample content"], "sample.pdf", {
        type: "application/pdf",
      });

      const fileUrl = await learningService.uploadFile(file);

      expect(fileUrl).toContain("sample.pdf");
      expect(fileUrl).not.toContain("example.com");
    });

    it("should fetch initial materials list", async () => {
      const list = await learningService.getMateri();
      expect(list.length).toBeGreaterThan(0);
      expect(list[0]).toHaveProperty("title");
    });

    it("should retrieve a material by its id", async () => {
      const list = await learningService.getMateri();
      const first = list[0];
      const match = await learningService.getMateriById(first.id);
      expect(match).not.toBeNull();
      expect(match?.id).toBe(first.id);
    });

    it("should filter materials by class", async () => {
      const list = await learningService.getMateriByKelas("k-1");
      expect(list.length).toBeGreaterThan(0);
      expect(list[0].kelasId).toBe("k-1");
    });

    it("should filter materials by teacher", async () => {
      const list = await learningService.getMateriByGuru("3");
      expect(list.length).toBeGreaterThan(0);
      expect(list[0].guruId).toBe("3");
    });

    it("should create new material lesson", async () => {
      const newMateri = {
        title: "Test Materi",
        description: "Test Deskripsi",
        kelasId: "k-2",
        kelasName: "XI-A",
        mapelId: "mp-2",
        mapelName: "Fisika",
        sourceType: "file" as const,
        guruId: "2",
        guruName: "Budi Santoso, M.Pd.",
        status: "Dipublikasikan" as const,
      };

      const created = await learningService.createMateri(newMateri);
      expect(created.id).toBeDefined();
      expect(created.dateCreated).toBeDefined();

      const list = await learningService.getMateriByGuru("2");
      expect(list.some((m) => m.id === created.id)).toBe(true);
    });

    it("should update a material", async () => {
      const list = await learningService.getMateri();
      const first = list[0];

      const updated = await learningService.updateMateri(first.id, {
        title: "Updated Title",
      });
      expect(updated.title).toBe("Updated Title");
    });

    it("should delete a material", async () => {
      const list = await learningService.getMateri();
      const first = list[0];

      const success = await learningService.deleteMateri(first.id);
      expect(success).toBe(true);

      const match = await learningService.getMateriById(first.id);
      expect(match).toBeNull();
    });
  });

  describe("Tugas (Assignments)", () => {
    it("should fetch initial assignments list", async () => {
      const list = await learningService.getTugas();
      expect(list.length).toBeGreaterThan(0);
    });

    it("should retrieve an assignment by id", async () => {
      const list = await learningService.getTugas();
      const first = list[0];
      const match = await learningService.getTugasById(first.id);
      expect(match?.id).toBe(first.id);
    });

    it("should filter assignments by class", async () => {
      const list = await learningService.getTugasByKelas("k-1");
      expect(list.length).toBeGreaterThan(0);
    });

    it("should filter assignments by teacher", async () => {
      const list = await learningService.getTugasByGuru("3");
      expect(list.length).toBeGreaterThan(0);
    });

    it("should create new assignment", async () => {
      const newTugas = {
        title: "Test Tugas",
        description: "Test Deskripsi",
        dueDate: "2026-06-12",
        kelasId: "k-2",
        kelasName: "XI-A",
        mapelId: "mp-2",
        mapelName: "Fisika",
        guruId: "2",
        guruName: "Budi Santoso, M.Pd.",
        status: "Dipublikasikan" as const,
      };

      const created = await learningService.createTugas(newTugas);
      expect(created.id).toBeDefined();

      const list = await learningService.getTugasByGuru("2");
      expect(list.some((t) => t.id === created.id)).toBe(true);
    });

    it("should update an assignment", async () => {
      const list = await learningService.getTugas();
      const first = list[0];

      const updated = await learningService.updateTugas(first.id, {
        title: "New Assignment Title",
      });
      expect(updated.title).toBe("New Assignment Title");
    });

    it("should delete an assignment", async () => {
      const list = await learningService.getTugas();
      const first = list[0];

      const success = await learningService.deleteTugas(first.id);
      expect(success).toBe(true);

      const match = await learningService.getTugasById(first.id);
      expect(match).toBeNull();
    });
  });

  describe("Submissions", () => {
    it("should fetch initial submissions", async () => {
      const list = await learningService.getSubmissions();
      expect(list.length).toBeGreaterThan(0);
    });

    it("should retrieve submissions by assignment id", async () => {
      const list = await learningService.getSubmissionsByTugas("tug-2");
      expect(list.length).toBeGreaterThan(0);
    });

    it("should retrieve submission for student", async () => {
      const match = await learningService.getSubmissionForStudent("tug-2", "4");
      expect(match).not.toBeNull();
      expect(match?.siswaName).toBe("Rian Hidayat");
    });

    it("should submit a student's solution solution", async () => {
      const sub = await learningService.submitTugasSolution(
        "tug-1",
        "5",
        "Ahmad Fauzi",
        "http://example.com/ahmad-aljabar.pdf",
      );

      expect(sub.id).toBeDefined();
      expect(sub.tugasId).toBe("tug-1");
      expect(sub.siswaId).toBe("5");
      expect(sub.fileUrl).toBe("http://example.com/ahmad-aljabar.pdf");

      const match = await learningService.getSubmissionForStudent("tug-1", "5");
      expect(match).not.toBeNull();
      expect(match?.fileUrl).toBe("http://example.com/ahmad-aljabar.pdf");
    });

    it("should grade a student submission", async () => {
      const list = await learningService.getSubmissions();
      const first = list[0];

      const graded = await learningService.gradeSubmission(
        first.id,
        90,
        "Kerja bagus!",
      );
      expect(graded.grade).toBe(90);
      expect(graded.feedback).toBe("Kerja bagus!");
    });
  });
});

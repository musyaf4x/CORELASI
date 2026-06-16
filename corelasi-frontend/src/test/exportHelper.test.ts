import { describe, expect, it } from "vitest";

import {
  buildExcelSheet,
  createExcelBlob,
  sanitizeWorksheetName,
} from "../utils/exportHelper";

describe("Excel export helper", () => {
  it("sanitizes worksheet names to Excel constraints", () => {
    expect(sanitizeWorksheetName("Nilai:Kelas/XI?[A]")).toBe(
      "Nilai_Kelas_XI__A_",
    );
    expect(sanitizeWorksheetName("x".repeat(40))).toHaveLength(31);
  });

  it("builds styled headers and rows in a stable column order", () => {
    const sheet = buildExcelSheet(
      [
        { Nama: "Alya", Nilai: 91 },
        { Nama: "Bima", Nilai: 87 },
      ],
      "Nilai",
    );

    expect(sheet.sheetName).toBe("Nilai");
    expect(sheet.sheetData[0]).toEqual([
      expect.objectContaining({ value: "Nama", fontWeight: "bold" }),
      expect.objectContaining({ value: "Nilai", fontWeight: "bold" }),
    ]);
    expect(sheet.sheetData[1]).toEqual(["Alya", 91]);
    expect(sheet.sheetData[2]).toEqual(["Bima", 87]);
  });

  it("creates a non-empty XLSX blob", async () => {
    const blob = await createExcelBlob([{ Nama: "Alya", Nilai: 91 }]);

    expect(blob.size).toBeGreaterThan(100);
  });
});

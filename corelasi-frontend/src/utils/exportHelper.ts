import writeExcelFile, { type SheetData } from "write-excel-file/universal";

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const sanitizeWorksheetName = (name: string) => {
  const sanitized = name
    .replace(/[\\/*?:[\]]/g, "_")
    .trim()
    .slice(0, 31);
  return sanitized || "Data";
};

const sanitizeFileName = (name: string) => {
  const invalidCharacters = '<>:"/\\|?*';
  const sanitized = Array.from(name)
    .map((character) =>
      character.charCodeAt(0) < 32 || invalidCharacters.includes(character)
        ? "_"
        : character,
    )
    .join("")
    .trim()
    .slice(0, 120);
  return sanitized || "export";
};

const normalizeCellValue = (
  value: unknown,
): string | number | boolean | Date | null => {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  ) {
    return value ?? null;
  }
  return JSON.stringify(value);
};

export const buildExcelSheet = (
  data: Record<string, unknown>[],
  sheetName = "Data",
) => {
  const headers = Array.from(new Set(data.flatMap((row) => Object.keys(row))));
  const sheetData: SheetData = headers.length
    ? [
        headers.map((header) => ({
          value: header,
          fontWeight: "bold",
          textColor: "#FFFFFF",
          backgroundColor: "#1D4ED8",
        })),
        ...data.map((row) =>
          headers.map((header) => normalizeCellValue(row[header])),
        ),
      ]
    : [["Tidak ada data"]];
  const columns: { width: number }[] = headers.map((header) => ({
    width: Math.min(
      40,
      Math.max(
        12,
        header.length + 2,
        ...data.map((row) => String(row[header] ?? "").length + 2),
      ),
    ),
  }));

  return {
    columns,
    sheetData,
    sheetName: sanitizeWorksheetName(sheetName),
  };
};

export const createExcelBlob = async (
  data: Record<string, unknown>[],
  sheetName = "Data",
) => {
  const sheet = buildExcelSheet(data, sheetName);
  return writeExcelFile(sheet.sheetData, {
    sheet: sheet.sheetName,
    columns: sheet.columns,
    stickyRowsCount: 1,
  }).toBlob();
};

export const exportToExcel = async (
  data: Record<string, unknown>[],
  fileName: string,
  sheetName = "Data",
) => {
  try {
    const generatedBlob = await createExcelBlob(data, sheetName);
    const blob = new Blob([generatedBlob], { type: XLSX_MIME_TYPE });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sanitizeFileName(fileName)}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Gagal melakukan ekspor data ke Excel:", error);
    alert("Terjadi kesalahan saat memproses ekspor data Excel.");
  }
};

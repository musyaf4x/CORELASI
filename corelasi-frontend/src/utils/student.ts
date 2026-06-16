type StudentClassContext = {
  kelasId?: string | number | null;
  kelasName?: string | null;
};

export const getSiswaKelasId = (
  user: StudentClassContext | null | undefined,
): string => String(user?.kelasId ?? "");

export const getSiswaKelasName = (
  user: StudentClassContext | null | undefined,
): string => user?.kelasName ?? "";

export const getActiveDateString = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
};

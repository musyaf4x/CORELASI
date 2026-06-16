import React, { useState } from "react";
import { CheckSquare, Square } from "lucide-react";
import { Button } from "./Button";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  selectable?: boolean;
  selectedIndexes?: number[];
  onSelectToggle?: (index: number) => void;
  onSelectAllToggle?: () => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  title?: string;
  actions?: React.ReactNode;
  rowClassName?: (item: T, index: number) => string;
  paginate?: boolean;
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  selectable = false,
  selectedIndexes = [],
  onSelectToggle,
  onSelectAllToggle,
  emptyStateTitle = "Tidak ada data",
  emptyStateDescription = "Data untuk kategori ini belum tersedia.",
  title,
  actions,
  rowClassName,
  paginate = false,
  pageSize = 10,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = data.length;
  const actualPageSize = pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / actualPageSize));
  const activePage = Math.min(currentPage, totalPages);

  const displayedData = paginate
    ? data.slice((activePage - 1) * actualPageSize, activePage * actualPageSize)
    : data;

  const allSelected =
    displayedData.length > 0 &&
    displayedData.every((_, idx) => {
      const originalIndex = paginate
        ? (activePage - 1) * actualPageSize + idx
        : idx;
      return selectedIndexes.includes(originalIndex);
    });

  if (data.length === 0) {
    return (
      <div className="border border-bg-border bg-bg-surface rounded-[6px] overflow-hidden">
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-b border-bg-border gap-2 text-left">
            {title && (
              <h3 className="text-[14px] font-bold tracking-tight text-bg-ink font-sans">
                {title}
              </h3>
            )}
            {actions}
          </div>
        )}
        <div className="p-8 text-center">
          <p className="text-[14px] font-bold text-bg-ink">{emptyStateTitle}</p>
          <p className="mt-1 text-[13px] text-bg-ink-secondary">
            {emptyStateDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-bg-border bg-bg-surface rounded-[6px] overflow-hidden">
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-b border-bg-border gap-2">
          {title && (
            <h3 className="text-[14px] font-bold tracking-tight text-bg-ink font-sans">
              {title}
            </h3>
          )}
          {actions}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-bg-border text-bg-ink-secondary font-semibold bg-bg-paper">
              {selectable && onSelectAllToggle && (
                <th className="py-3.5 pl-5 w-10">
                  <button
                    type="button"
                    onClick={onSelectAllToggle}
                    className="relative p-1.5 hover:bg-bg-sage-slate rounded transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none cursor-pointer flex items-center justify-center before:content-[''] before:absolute before:inset-[-6px]"
                    aria-label="Pilih semua baris"
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-bg-ink-muted" />
                    )}
                  </button>
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{ width: col.width }}
                  className={`py-3.5 pr-4 text-[11px] ${col.className || ""} ${!selectable && idx === 0 ? "pl-5" : ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-bg-border/60">
            {displayedData.map((item, index) => {
              const originalIndex = paginate
                ? (activePage - 1) * actualPageSize + index
                : index;
              const isSelected = selectedIndexes.includes(originalIndex);
              const customRowClass = rowClassName
                ? rowClassName(item, originalIndex)
                : "";
              return (
                <tr
                  key={keyExtractor(item, originalIndex)}
                  className={`text-bg-ink transition-colors ${isSelected ? "bg-primary/[0.04]" : "hover:bg-bg-paper"} ${customRowClass}`}
                >
                  {selectable && onSelectToggle && (
                    <td className="py-3.5 pl-5">
                      <button
                        type="button"
                        onClick={() => onSelectToggle(originalIndex)}
                        className="relative p-1.5 hover:bg-bg-sage-slate rounded transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none cursor-pointer flex items-center justify-center before:content-[''] before:absolute before:inset-[-6px]"
                        aria-label={`Pilih baris ${originalIndex + 1}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-bg-ink-muted" />
                        )}
                      </button>
                    </td>
                  )}
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`py-3.5 pr-4 text-[13px] ${col.className || ""} ${!selectable && colIdx === 0 ? "pl-5" : ""}`}
                    >
                      {col.cell
                        ? col.cell(item, originalIndex)
                        : col.accessorKey
                          ? String(item[col.accessorKey] || "")
                          : ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {paginate && totalItems > actualPageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-bg-border bg-bg-paper text-xs text-bg-ink-secondary gap-3">
          <div>
            Menampilkan{" "}
            <span className="font-semibold text-bg-ink">
              {(activePage - 1) * actualPageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-bg-ink">
              {Math.min(activePage * actualPageSize, totalItems)}
            </span>{" "}
            dari <span className="font-semibold text-bg-ink">{totalItems}</span>{" "}
            data
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={activePage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="h-8 py-0.5 px-3 text-[11px] font-semibold cursor-pointer"
            >
              Sebelumnya
            </Button>
            <span className="text-[11px] font-medium font-sans">
              Halaman {activePage} dari {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={activePage === totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className="h-8 py-0.5 px-3 text-[11px] font-semibold cursor-pointer"
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

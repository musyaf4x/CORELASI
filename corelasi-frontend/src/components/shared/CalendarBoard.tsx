import React from "react";
import { Button } from "./Button";
import { Edit, Trash2, Calendar } from "lucide-react";

export type HariBelajar =
  | "Senin"
  | "Selasa"
  | "Rabu"
  | "Kamis"
  | "Jumat"
  | "Sabtu";

export type CalendarTheme =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "excellent"
  | "pending"
  | "neutral";

export interface CalendarItem {
  id: string;
  hari: HariBelajar;
  waktuMulai?: string;
  waktuSelesai?: string;
  title: string;
  subtitle?: string;
  tag?: string;
  colorTheme?: CalendarTheme;
}

interface CalendarBoardProps {
  items: CalendarItem[];
  onEdit?: (item: CalendarItem) => void;
  onDelete?: (id: string) => void;
  emptyText?: string;
}

export const CalendarBoard: React.FC<CalendarBoardProps> = ({
  items,
  onEdit,
  onDelete,
  emptyText = "Tidak ada jadwal",
}) => {
  const days: HariBelajar[] = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  // Helper function to convert time string (HH:MM) to minutes for sorting
  const timeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const getThemeClasses = (theme?: CalendarTheme) => {
    switch (theme) {
      case "primary":
        return "border-primary/25 bg-primary/[0.03] hover:border-primary/45";
      case "success":
        return "border-status-success/25 bg-status-success/[0.03] hover:border-status-success/45";
      case "warning":
        return "border-status-warning/30 bg-status-warning/[0.03] hover:border-status-warning/45";
      case "danger":
        return "border-status-danger/25 bg-status-danger/[0.03] hover:border-status-danger/45";
      case "info":
        return "border-status-info/25 bg-status-info/[0.03] hover:border-status-info/45";
      case "excellent":
        return "border-status-excellent/25 bg-status-excellent/[0.03] hover:border-status-excellent/45";
      case "pending":
        return "border-status-pending/25 bg-status-pending/[0.03] hover:border-status-pending/45";
      default:
        return "border-bg-border bg-bg-surface hover:border-bg-border-hover";
    }
  };

  const getTagClasses = (theme?: CalendarTheme) => {
    switch (theme) {
      case "primary":
        return "bg-primary/[0.08] text-primary border-primary/20";
      case "success":
        return "bg-status-success/[0.08] text-status-success border-status-success/20";
      case "warning":
        return "bg-status-warning/[0.08] text-status-warning border-status-warning/20";
      case "danger":
        return "bg-status-danger/[0.08] text-status-danger border-status-danger/20";
      case "info":
        return "bg-status-info/[0.08] text-status-info border-status-info/20";
      case "excellent":
        return "bg-status-excellent/[0.08] text-status-excellent border-status-excellent/20";
      case "pending":
        return "bg-status-pending/[0.08] text-status-pending border-status-pending/20";
      default:
        return "bg-bg-sage-slate/60 text-bg-ink-secondary border-bg-border/60";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {days.map((day) => {
        // Filter items for this day and sort by waktuMulai
        const dayItems = items
          .filter((item) => item.hari === day)
          .sort(
            (a, b) => timeToMinutes(a.waktuMulai) - timeToMinutes(b.waktuMulai),
          );

        return (
          <div
            key={day}
            className="flex flex-col bg-bg-surface border border-bg-border rounded-[6px] p-3.5 shadow-sm min-h-[220px] w-full"
          >
            {/* Day Header */}
            <div className="flex items-center justify-between border-b border-bg-border pb-2 mb-3">
              <span className="text-[12px] font-bold text-bg-ink-muted uppercase tracking-wider">
                {day}
              </span>
              <span className="text-[10px] font-mono font-bold bg-bg-sage-slate/60 text-bg-ink-secondary px-1.5 py-0.5 rounded-[4px] border border-bg-border/30">
                {dayItems.length}
              </span>
            </div>

            {/* Stack of schedule items */}
            <div className="flex flex-col gap-2.5 flex-1">
              {dayItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-6 text-center">
                  <Calendar className="h-5 w-5 text-bg-ink-muted/40 mb-1" />
                  <p className="text-[11px] text-bg-ink-secondary/80 italic font-medium">
                    {emptyText}
                  </p>
                </div>
              ) : (
                dayItems.map((item) => {
                  const themeClasses = getThemeClasses(item.colorTheme);
                  return (
                    <div
                      key={item.id}
                      className={`relative border rounded-[6px] p-3 transition-all hover:shadow-sm flex flex-col gap-1.5 ${themeClasses}`}
                    >
                      {/* Time display */}
                      {item.waktuMulai && (
                        <span className="inline-flex items-center text-[10px] font-mono font-bold tracking-tight bg-bg-sage-slate/60 text-bg-ink-secondary px-1.5 py-0.5 rounded-[4px] self-start tabular-nums">
                          {item.waktuMulai} - {item.waktuSelesai || "?"}
                        </span>
                      )}

                      {/* Title and Subtitle */}
                      <div className="space-y-0.5">
                        <h4 className="text-[13px] font-semibold text-bg-ink leading-tight font-sans">
                          {item.title}
                        </h4>
                        {item.subtitle && (
                          <p className="text-[11px] text-bg-ink-secondary leading-snug">
                            {item.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Tag / Class Badge */}
                      {item.tag && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] border self-start ${getTagClasses(item.colorTheme)}`}
                        >
                          {item.tag}
                        </span>
                      )}

                      {/* Action buttons (Edit/Delete) */}
                      {(onEdit || onDelete) && (
                        <div className="flex justify-end gap-1 mt-1 border-t border-bg-border/30 pt-1.5">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-bg-ink-secondary hover:bg-bg-sage-slate/30 relative before:absolute before:inset-[-6px] before:content-['']"
                              onClick={() => onEdit(item)}
                              title="Ubah"
                              aria-label="Ubah Jadwal"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-status-danger hover:bg-status-danger/10 relative before:absolute before:inset-[-6px] before:content-['']"
                              onClick={() => onDelete(item.id)}
                              title="Hapus"
                              aria-label="Hapus Jadwal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

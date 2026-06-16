import React from "react";
import { Search } from "lucide-react";
import { Select } from "./Select";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterPlaceholder?: string;
  actions?: React.ReactNode;
  searchLabel?: string;
  filterLabel?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari...",
  filterValue,
  onFilterChange,
  filterOptions,
  filterPlaceholder = "Semua Status",
  actions,
  searchLabel = "Kata Kunci",
  filterLabel,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 bg-bg-surface border border-bg-border rounded-[6px] p-4">
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-end gap-3">
        {/* Search Input */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-md">
          <span className="text-[13px] font-semibold text-bg-ink-secondary pl-0.5">
            {searchLabel}
          </span>
          <div className="relative w-full">
            <Search
              className="absolute inset-y-0 left-3 h-4 w-4 text-bg-ink-muted self-center"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="block w-full rounded-[6px] border border-bg-border bg-bg-surface text-bg-ink pl-9 pr-3.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-bg-ink-muted"
            />
          </div>
        </div>

        {/* Dropdown Filter */}
        {onFilterChange && filterOptions && (
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <span className="text-[13px] font-semibold text-bg-ink-secondary pl-0.5">
              {filterLabel || "Kategori"}
            </span>
            <Select
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              aria-label={filterPlaceholder}
              className="h-9 py-1 pl-3.5 pr-10 text-[13px]"
            >
              <option value="">{filterPlaceholder}</option>
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {actions && (
        <div className="flex items-stretch sm:items-end gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

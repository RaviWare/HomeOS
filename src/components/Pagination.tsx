import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  label?: string;
  /** Denser chrome for side panels */
  compact?: boolean;
  className?: string;
}

export default function Pagination({
  page,
  total,
  pageSize,
  onPage,
  label = "items",
  compact = false,
  className = "",
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const cur = Math.min(Math.max(1, page), pageCount);
  const start = total === 0 ? 0 : (cur - 1) * pageSize + 1;
  const end = Math.min(cur * pageSize, total);
  const from = Math.max(1, Math.min(cur - 2, pageCount - 4));
  const to = Math.min(pageCount, from + 4);
  const nums: number[] = [];
  for (let i = from; i <= to; i++) nums.push(i);

  const btn = compact
    ? "min-w-[26px] h-7 px-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
    : "min-w-[28px] h-7 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center";

  return (
    <div
      className={`flex flex-col gap-2 ${
        compact
          ? "pt-2.5 border-t border-[#1F1F23]"
          : "sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 mt-1 border-t border-[#374151]/50"
      } ${className}`}
    >
      <span
        className={`${
          compact ? "text-[9px]" : "text-[10px]"
        } text-[#8E8E93] font-bold uppercase tracking-wider tabular-nums`}
      >
        {start}–{end} of {total.toLocaleString()} {label}
      </span>
      {pageCount > 1 && (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => onPage(cur - 1)}
            disabled={cur <= 1}
            className={
              btn +
              " bg-[#121215] border-[#1F1F23] text-white hover:border-white/30"
            }
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {nums.map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => onPage(n)}
              className={
                btn +
                (n === cur
                  ? " bg-white border-white text-black"
                  : " bg-[#121215] border-[#1F1F23] text-[#8E8E93] hover:text-white hover:border-white/25")
              }
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPage(cur + 1)}
            disabled={cur >= pageCount}
            className={
              btn +
              " bg-[#121215] border-[#1F1F23] text-white hover:border-white/30"
            }
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

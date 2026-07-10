/**
 * Shared premium analytics chrome for module hubs:
 * view modes, % distribution bars, KPI strip, filter chips.
 */
import React from "react";
import { BarChart3, LayoutGrid, Table2, List } from "lucide-react";
import { formatMoney, loadCurrencyPrefs } from "../../currency";

export type HubViewMode = "cards" | "graphs" | "dataset" | "list";

export const C = {
  up: "#34D399",
  down: "#FB7185",
  warn: "#FBBF24",
  flat: "#A1A1AA",
  ink: "#FAFAFA",
} as const;

export const panel =
  "bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl min-w-0";

/** Display-currency money (legacy name `inr` kept for hub call sites). */
export function inr(n: number) {
  return formatMoney(n, loadCurrencyPrefs().displayCurrency);
}

export function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
  /** optional filter value when chip/segment clicked */
  filterValue?: string;
}

export function ViewModeToggle({
  modes,
  value,
  onChange,
}: {
  modes: { id: HubViewMode; label: string }[];
  value: HubViewMode;
  onChange: (m: HubViewMode) => void;
}) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    cards: LayoutGrid,
    list: List,
    graphs: BarChart3,
    dataset: Table2,
  };
  return (
    <div className="inline-flex p-0.5 rounded-xl border border-[#1F1F23] bg-[#0C0C0F]">
      {modes.map((m) => {
        const Icon = icons[m.id] || LayoutGrid;
        const on = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
              on ? "bg-white text-black" : "text-[#8E8E93] hover:text-white"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function KpiStrip({
  items,
}: {
  items: {
    label: string;
    value: string;
    sub?: string;
    color?: string;
    onClick?: () => void;
  }[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {items.map((k) => (
        <button
          key={k.label}
          type="button"
          onClick={k.onClick}
          disabled={!k.onClick}
          className={`${panel} p-3 text-left min-h-[80px] flex flex-col justify-between ${
            k.onClick
              ? "hover:border-white/25 cursor-pointer"
              : "cursor-default"
          }`}
        >
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
            {k.label}
          </span>
          <div>
            <p
              className="text-lg font-black tabular-nums tracking-tight truncate"
              style={{ color: k.color || C.ink }}
            >
              {k.value}
            </p>
            {k.sub && (
              <p className="text-[10px] text-[#71717A] font-medium mt-0.5 truncate">
                {k.sub}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export function PercentDistribution({
  title,
  subtitle,
  segments,
  total,
  onSelect,
  activeKey,
}: {
  title: string;
  subtitle?: string;
  segments: Segment[];
  total: number;
  onSelect?: (seg: Segment) => void;
  activeKey?: string | null;
}) {
  const t = total || segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className={`${panel} p-3.5 sm:p-4`}>
      <div className="mb-3">
        <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
          Distribution
        </p>
        <h3 className="text-sm font-black text-white">{title}</h3>
        {subtitle && (
          <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
      {/* stacked % bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-black/50 mb-3 border border-white/[0.04]">
        {segments.map((s) => {
          const p = (s.value / t) * 100;
          if (p <= 0) return null;
          return (
            <button
              key={s.key}
              type="button"
              title={`${s.label}: ${s.value} (${pct(s.value, t)}%)`}
              onClick={() => onSelect?.(s)}
              className="h-full transition-opacity hover:opacity-90 cursor-pointer min-w-[2px]"
              style={{ width: `${p}%`, background: s.color }}
            />
          );
        })}
      </div>
      <div className="space-y-2">
        {segments.map((s) => {
          const p = pct(s.value, t);
          const active = activeKey === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelect?.(s)}
              className={`w-full text-left rounded-xl border px-2.5 py-2 transition-colors cursor-pointer ${
                active
                  ? "border-white/30 bg-white/[0.06]"
                  : "border-[#1F1F23] bg-[#121215] hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: s.color }}
                  />
                  <span className="text-[11px] font-bold text-white truncate">
                    {s.label}
                  </span>
                </span>
                <span className="text-[11px] font-black tabular-nums shrink-0" style={{ color: s.color }}>
                  {s.value} · {p}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(2, p)}%`, background: s.color }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterChips({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {label && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#52525B] mr-0.5">
          {label}
        </span>
      )}
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`h-7 px-2.5 rounded-lg text-[10px] font-bold border tabular-nums cursor-pointer transition-colors ${
              on
                ? "bg-white text-black border-white"
                : "bg-[#121215] text-[#8E8E93] border-[#1F1F23] hover:text-white"
            }`}
          >
            {o.label}
            {o.count != null && (
              <span className="ml-1 opacity-70">{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function DatasetTable({
  columns,
  rows,
  onRowClick,
  empty = "No rows match filters",
}: {
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: { id: string; cells: Record<string, React.ReactNode>; tone?: string }[];
  onRowClick?: (id: string) => void;
  empty?: string;
}) {
  return (
    <div className={`${panel} overflow-hidden flex flex-col min-h-[280px]`}>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-[11px] min-w-[560px]">
          <thead className="sticky top-0 z-10 bg-[#0A0A0C]">
            <tr className="text-[#71717A] border-b border-[#1F1F23]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`py-2.5 px-3 font-bold ${
                    c.align === "right" ? "text-right" : ""
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => onRowClick?.(r.id)}
                className={`border-b border-[#1F1F23]/50 ${
                  onRowClick
                    ? "hover:bg-white/[0.03] cursor-pointer"
                    : ""
                }`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`py-2.5 px-3 ${
                      c.align === "right"
                        ? "text-right tabular-nums font-bold"
                        : ""
                    }`}
                    style={
                      c.key === "status" && r.tone
                        ? { color: r.tone }
                        : undefined
                    }
                  >
                    {r.cells[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-[#71717A] font-medium"
                >
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="shrink-0 px-3 py-2 border-t border-[#1F1F23] text-[10px] text-[#52525B] font-medium">
        {rows.length} row{rows.length === 1 ? "" : "s"} · live vault data
      </div>
    </div>
  );
}

export function HubPage({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex-1 min-h-0 flex flex-col overflow-hidden ${className}`}
    >
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none safe-bottom">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 py-3 sm:py-4 pb-28 sm:pb-10 flex flex-col gap-3">
          {children}
        </div>
      </div>
    </div>
  );
}

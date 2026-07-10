import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Plus,
  PenTool,
  Download,
  AlertTriangle,
  Trash2,
  LayoutGrid,
  BarChart3,
  Table2,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
} from "lucide-react";
import { Lease } from "../types";
import Pagination from "./Pagination";

interface LeaseVaultProps {
  leases: Lease[];
  onAddLease: (newLease: Lease) => void;
  onUpdateLease: (updated: Lease) => void;
}

type LayoutMode = "split" | "graph" | "table";
type StatusFilter = "all" | Lease["status"];

const C = {
  up: "#34D399",
  down: "#FB7185",
  warn: "#FBBF24",
  flat: "#A1A1AA",
  ink: "#FAFAFA",
} as const;

const panel = "bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl";
const inr = (n: number) => "₹" + Math.round(n || 0).toLocaleString("en-IN");

function statusColor(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "active") return C.up;
  if (s === "expired" || s === "terminated") return C.down;
  if (s.includes("pending")) return C.warn;
  return C.flat;
}

function daysUntil(end: string) {
  const t = new Date(end).getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

const PAGE_SIZE = 6;

export default function LeaseVault({ leases, onUpdateLease }: LeaseVaultProps) {
  const [activeLeaseIndex, setActiveLeaseIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [newClause, setNewClause] = useState("");
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureRole, setSignatureRole] = useState<"tenant" | "landlord">("tenant");
  const [layout, setLayout] = useState<LayoutMode>("split");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leases.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.propertyName.toLowerCase().includes(q) ||
        l.tenantName.toLowerCase().includes(q) ||
        l.landlordName.toLowerCase().includes(q)
      );
    });
  }, [leases, statusFilter, query]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, query]);

  useEffect(() => {
    if (activeLeaseIndex >= filtered.length && filtered.length > 0) {
      setActiveLeaseIndex(0);
    }
  }, [filtered.length, activeLeaseIndex]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(Math.max(1, page), pageCount);
  const pageSlice = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
  const activeLease = filtered[activeLeaseIndex] || filtered[0] || null;

  const insights = useMemo(() => {
    const byStatus: Record<string, number> = {
      Active: 0,
      "Pending Signature": 0,
      Expired: 0,
      Terminated: 0,
    };
    let fullySigned = 0;
    let halfSigned = 0;
    let unsigned = 0;
    let rentSum = 0;
    const renewals: { name: string; days: number; rent: number }[] = [];
    const now = Date.now();

    leases.forEach((l) => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      rentSum += l.monthlyRent || 0;
      const t = l.signatures.tenantSigned;
      const ld = l.signatures.landlordSigned;
      if (t && ld) fullySigned++;
      else if (t || ld) halfSigned++;
      else unsigned++;
      if (l.status === "Active") {
        const days = Math.ceil((new Date(l.endDate).getTime() - now) / 86400000);
        if (!isNaN(days) && days <= 90)
          renewals.push({ name: l.propertyName, days, rent: l.monthlyRent });
      }
    });
    renewals.sort((a, b) => a.days - b.days);

    const rentSorted = [...leases].sort((a, b) => b.monthlyRent - a.monthlyRent).slice(0, 8);
    const rentMax = Math.max(...rentSorted.map((l) => l.monthlyRent), 1);

    return {
      byStatus,
      fullySigned,
      halfSigned,
      unsigned,
      rentSum,
      renewals: renewals.slice(0, 6),
      rentSorted,
      rentMax,
      total: leases.length,
      signedPct: leases.length ? Math.round((fullySigned / leases.length) * 100) : 0,
    };
  }, [leases]);

  useEffect(() => {
    if (showSignModal && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
      }
    }
  }, [showSignModal]);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    canvasRef.current?.getContext("2d")?.beginPath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (!activeLease) return;
    const dateStr = new Date().toISOString();
    const updatedSignatures = { ...activeLease.signatures };
    if (signatureRole === "tenant") {
      updatedSignatures.tenantSigned = true;
      updatedSignatures.tenantSignedAt = dateStr;
    } else {
      updatedSignatures.landlordSigned = true;
      updatedSignatures.landlordSignedAt = dateStr;
    }
    const isFullySigned =
      updatedSignatures.tenantSigned && updatedSignatures.landlordSigned;
    onUpdateLease({
      ...activeLease,
      signatures: updatedSignatures,
      status: isFullySigned ? "Active" : activeLease.status,
    });
    setShowSignModal(false);
  };

  const handleAddClause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClause.trim() || !activeLease) return;
    onUpdateLease({
      ...activeLease,
      clauses: [...activeLease.clauses, newClause.trim()],
      version: activeLease.version + 1,
    });
    setNewClause("");
  };

  const handleDeleteClause = (index: number) => {
    if (!activeLease) return;
    onUpdateLease({
      ...activeLease,
      clauses: activeLease.clauses.filter((_, i) => i !== index),
      version: activeLease.version + 1,
    });
  };

  const downloadLeaseAsText = () => {
    if (!activeLease) return;
    const textContent = `HOMEOS LEASE V${activeLease.version}
Property: ${activeLease.propertyName}
Tenant: ${activeLease.tenantName}
Landlord: ${activeLease.landlordName}
Period: ${activeLease.startDate} → ${activeLease.endDate}
Rent: ${inr(activeLease.monthlyRent)} | Deposit: ${inr(activeLease.securityDeposit)}
Status: ${activeLease.status}

CLAUSES:
${activeLease.clauses.map((c, i) => `${i + 1}. ${c}`).join("\n")}
`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([textContent], { type: "text/plain" }));
    a.download = `Lease_${activeLease.propertyName.replace(/\s+/g, "_")}.txt`;
    a.click();
  };

  const goPage = (p: number) => {
    setPage(p);
    const first = (p - 1) * PAGE_SIZE;
    if (filtered[first]) setActiveLeaseIndex(first);
  };

  const selectLease = (globalFilteredIndex: number) => {
    setActiveLeaseIndex(globalFilteredIndex);
    setPage(Math.floor(globalFilteredIndex / PAGE_SIZE) + 1);
    if (layout === "graph" || layout === "table") setLayout("split");
  };

  const statusPills: { id: StatusFilter; label: string; n: number }[] = [
    { id: "all", label: "All", n: leases.length },
    { id: "Active", label: "Active", n: insights.byStatus.Active },
    {
      id: "Pending Signature",
      label: "Pending",
      n: insights.byStatus["Pending Signature"],
    },
    { id: "Expired", label: "Expired", n: insights.byStatus.Expired },
    { id: "Terminated", label: "Ended", n: insights.byStatus.Terminated },
  ];

  const modes: { id: LayoutMode; label: string; icon: typeof LayoutGrid }[] = [
    { id: "split", label: "Cards", icon: LayoutGrid },
    { id: "graph", label: "Graphs", icon: BarChart3 },
    { id: "table", label: "Dataset", icon: Table2 },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-3 sm:px-4 py-3 flex flex-col gap-2.5">
        {/* Toolbar */}
        <header className={`${panel} px-3 sm:px-4 py-3 shrink-0`}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">
                Housing · contracts
              </p>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                Lease & Clauses
              </h1>
            </div>

            {/* View mode */}
            <div className="inline-flex p-0.5 rounded-xl border border-[#1F1F23] bg-[#0C0C0F] shrink-0">
              {modes.map((m) => {
                const Icon = m.icon;
                const on = layout === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setLayout(m.id)}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      on ? "bg-white text-black" : "text-[#8E8E93] hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-52">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search property, tenant…"
                className="w-full h-8 pl-8 pr-3 rounded-xl bg-[#121215] border border-[#1F1F23] text-[12px] text-white placeholder:text-[#555] focus:outline-none focus:border-white/25"
              />
            </div>
          </div>

          {/* Status filters + mini KPIs */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {statusPills.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setStatusFilter(p.id)}
                className={`h-7 px-2.5 rounded-lg text-[10px] font-bold border tabular-nums cursor-pointer transition-colors ${
                  statusFilter === p.id
                    ? "bg-white text-black border-white"
                    : "bg-[#121215] text-[#8E8E93] border-[#1F1F23] hover:text-white"
                }`}
              >
                {p.label}
                <span className="ml-1 opacity-70">{p.n}</span>
              </button>
            ))}
            <span className="hidden sm:inline-flex items-center gap-3 ml-auto text-[10px] font-bold text-[#71717A]">
              <span>
                Portfolio rent{" "}
                <strong className="text-white tabular-nums">{inr(insights.rentSum)}</strong>
                /mo
              </span>
              <span>
                Signed{" "}
                <strong className="text-[#34D399] tabular-nums">{insights.signedPct}%</strong>
              </span>
            </span>
          </div>
        </header>

        {/* ═══ GRAPH VIEW ═══ */}
        {layout === "graph" && (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none flex flex-col gap-2.5 pb-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                {
                  label: "Active",
                  value: insights.byStatus.Active,
                  color: C.up,
                  icon: CheckCircle2,
                },
                {
                  label: "Pending sign",
                  value: insights.byStatus["Pending Signature"],
                  color: C.warn,
                  icon: Clock,
                },
                {
                  label: "Expired",
                  value: insights.byStatus.Expired,
                  color: C.down,
                  icon: XCircle,
                },
                {
                  label: "Fully signed",
                  value: `${insights.signedPct}%`,
                  color: C.ink,
                  icon: Shield,
                },
              ].map((k) => {
                const Icon = k.icon;
                return (
                  <div key={k.label} className={`${panel} p-3 min-h-[72px] flex flex-col justify-between`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                        {k.label}
                      </span>
                      <Icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                    </div>
                    <p
                      className="text-xl font-black tabular-nums tracking-tight"
                      style={{ color: k.color }}
                    >
                      {k.value}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-12 gap-2.5">
              {/* Status mix bars */}
              <div className={`${panel} p-3.5 lg:col-span-4`}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                  Portfolio mix
                </p>
                <h3 className="text-[13px] font-black text-white mb-3">Status distribution</h3>
                <div className="space-y-2.5">
                  {(
                    [
                      ["Active", C.up],
                      ["Pending Signature", C.warn],
                      ["Expired", C.down],
                      ["Terminated", C.flat],
                    ] as const
                  ).map(([st, color]) => {
                    const n = insights.byStatus[st] || 0;
                    const pct = insights.total ? (n / insights.total) * 100 : 0;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setStatusFilter(st);
                          setLayout("split");
                        }}
                        className="w-full text-left cursor-pointer group"
                      >
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="font-bold text-white group-hover:underline">
                            {st}
                          </span>
                          <span className="tabular-nums text-[#8E8E93] font-bold">
                            {n} · {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.max(2, pct)}%`, background: color }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Signature funnel */}
              <div className={`${panel} p-3.5 lg:col-span-3`}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                  Execution
                </p>
                <h3 className="text-[13px] font-black text-white mb-3">Signature state</h3>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      ["Both signed", insights.fullySigned, C.up],
                      ["Partial", insights.halfSigned, C.warn],
                      ["None", insights.unsigned, C.down],
                    ] as const
                  ).map(([label, n, color]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl border border-[#1F1F23] bg-[#121215] px-3 py-2.5"
                    >
                      <span className="text-[11px] font-bold text-[#A1A1AA]">{label}</span>
                      <span className="text-sm font-black tabular-nums" style={{ color }}>
                        {n}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-2 rounded-full overflow-hidden flex bg-black/40">
                  <div
                    style={{
                      width: `${insights.total ? (insights.fullySigned / insights.total) * 100 : 0}%`,
                      background: C.up,
                    }}
                  />
                  <div
                    style={{
                      width: `${insights.total ? (insights.halfSigned / insights.total) * 100 : 0}%`,
                      background: C.warn,
                    }}
                  />
                  <div
                    style={{
                      width: `${insights.total ? (insights.unsigned / insights.total) * 100 : 0}%`,
                      background: C.down,
                    }}
                  />
                </div>
              </div>

              {/* Rent chart */}
              <div className={`${panel} p-3.5 lg:col-span-5`}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                  Economics
                </p>
                <h3 className="text-[13px] font-black text-white mb-3">
                  Top rents (monthly)
                </h3>
                <div className="space-y-2">
                  {insights.rentSorted.map((l) => {
                    const idx = filtered.findIndex((x) => x.id === l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => idx >= 0 && selectLease(idx)}
                        className="w-full text-left cursor-pointer"
                      >
                        <div className="flex justify-between text-[10px] mb-0.5 gap-2">
                          <span className="font-bold text-white truncate">{l.propertyName}</span>
                          <span className="tabular-nums text-[#8E8E93] shrink-0 font-bold">
                            {inr(l.monthlyRent)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-white/70"
                            style={{
                              width: `${(l.monthlyRent / insights.rentMax) * 100}%`,
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                  {!insights.rentSorted.length && (
                    <p className="text-[11px] text-[#71717A]">No lease data</p>
                  )}
                </div>
              </div>

              {/* Renewals */}
              <div className={`${panel} p-3.5 lg:col-span-12`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                      Pipeline
                    </p>
                    <h3 className="text-[13px] font-black text-white">
                      Renewals within 90 days
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: C.warn }}>
                    {insights.renewals.length} coming up
                  </span>
                </div>
                {insights.renewals.length === 0 ? (
                  <p className="text-[12px] text-[#71717A] font-medium py-2">
                    No active leases ending in the next 90 days.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {insights.renewals.map((r) => (
                      <div
                        key={r.name + r.days}
                        className="rounded-xl border border-[#1F1F23] bg-[#121215] px-3 py-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-white truncate">{r.name}</p>
                          <p className="text-[10px] text-[#71717A] tabular-nums">
                            {inr(r.rent)}/mo
                          </p>
                        </div>
                        <span
                          className="text-[11px] font-black px-2 py-1 rounded-lg border tabular-nums shrink-0"
                          style={{
                            color: r.days <= 30 ? C.down : C.warn,
                            borderColor:
                              r.days <= 30
                                ? "rgba(251,113,133,0.3)"
                                : "rgba(251,191,36,0.3)",
                            background:
                              r.days <= 30
                                ? "rgba(251,113,133,0.12)"
                                : "rgba(251,191,36,0.12)",
                          }}
                        >
                          {r.days}d
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TABLE / DATASET VIEW ═══ */}
        {layout === "table" && (
          <div className={`${panel} flex-1 min-h-0 flex flex-col overflow-hidden`}>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left text-[11px] min-w-[720px]">
                <thead className="sticky top-0 z-10 bg-[#0A0A0C]">
                  <tr className="text-[#71717A] border-b border-[#1F1F23]">
                    <th className="py-2.5 px-3 font-bold">Property</th>
                    <th className="py-2.5 px-2 font-bold">Tenant</th>
                    <th className="py-2.5 px-2 font-bold">Status</th>
                    <th className="py-2.5 px-2 font-bold text-right">Rent</th>
                    <th className="py-2.5 px-2 font-bold text-right">Deposit</th>
                    <th className="py-2.5 px-2 font-bold">Period</th>
                    <th className="py-2.5 px-2 font-bold">Sign</th>
                    <th className="py-2.5 px-3 font-bold text-right">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l, i) => {
                    const days = daysUntil(l.endDate);
                    const t = l.signatures.tenantSigned;
                    const ld = l.signatures.landlordSigned;
                    const sign =
                      t && ld ? "Both" : t || ld ? "Partial" : "None";
                    const signColor =
                      sign === "Both" ? C.up : sign === "Partial" ? C.warn : C.down;
                    return (
                      <tr
                        key={l.id}
                        onClick={() => selectLease(i)}
                        className="border-b border-[#1F1F23]/60 hover:bg-white/[0.03] cursor-pointer"
                      >
                        <td className="py-2.5 px-3 font-semibold text-white max-w-[160px] truncate">
                          {l.propertyName}
                        </td>
                        <td className="py-2.5 px-2 text-[#8E8E93] truncate max-w-[100px]">
                          {l.tenantName}
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: statusColor(l.status) }}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums font-black text-white">
                          {inr(l.monthlyRent)}
                        </td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-[#8E8E93]">
                          {inr(l.securityDeposit)}
                        </td>
                        <td className="py-2.5 px-2 text-[#8E8E93] tabular-nums whitespace-nowrap">
                          {l.startDate.slice(0, 7)} → {l.endDate.slice(0, 7)}
                          {days != null && days <= 90 && days >= 0 && (
                            <span className="ml-1" style={{ color: C.warn }}>
                              {days}d
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="font-bold" style={{ color: signColor }}>
                            {sign}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-[#71717A] font-bold">
                          v{l.version}
                        </td>
                      </tr>
                    );
                  })}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[#71717A]">
                        No leases match this filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="shrink-0 px-3 py-2 border-t border-[#1F1F23]">
              <p className="text-[10px] text-[#52525B] font-medium">
                {filtered.length} rows · click a row to open card detail
              </p>
            </div>
          </div>
        )}

        {/* ═══ SPLIT / CARDS VIEW ═══ */}
        {layout === "split" && (
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5">
            <aside className="w-full lg:w-[280px] xl:w-[300px] shrink-0 flex flex-col min-h-0 max-h-[40vh] lg:max-h-none border border-[#1F1F23] rounded-2xl bg-[#0A0A0C] overflow-hidden">
              <div className="shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-[#1F1F23]">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-[12px] font-black text-white">Documents</span>
                </div>
                <span className="text-[10px] font-bold text-[#71717A] tabular-nums">
                  {filtered.length}
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-2 py-1.5 flex flex-col gap-1">
                {pageSlice.map((l, i) => {
                  const idx = (curPage - 1) * PAGE_SIZE + i;
                  const isAct = activeLease?.id === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setActiveLeaseIndex(idx)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl border transition-colors cursor-pointer ${
                        isAct
                          ? "bg-white/[0.08] border-white/30"
                          : "bg-[#121215] border-[#1F1F23] hover:border-white/20"
                      }`}
                    >
                      <span
                        className="text-[9px] font-bold uppercase tracking-wide block"
                        style={{ color: statusColor(l.status) }}
                      >
                        v{l.version} · {l.status}
                      </span>
                      <span className="text-[11px] font-black text-white block truncate mt-0.5">
                        {l.propertyName}
                      </span>
                      <div className="flex justify-between text-[10px] text-[#71717A] font-semibold mt-0.5">
                        <span className="truncate pr-1">{l.tenantName}</span>
                        <span className="tabular-nums text-white/70 shrink-0">
                          {inr(l.monthlyRent)}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {!pageSlice.length && (
                  <p className="text-[11px] text-[#71717A] p-3 text-center">No matches</p>
                )}
              </div>

              <div className="shrink-0 px-2.5 pb-2 pt-1 border-t border-[#1F1F23]">
                <Pagination
                  page={curPage}
                  total={filtered.length}
                  pageSize={PAGE_SIZE}
                  onPage={goPage}
                  label="leases"
                  compact
                />
              </div>
            </aside>

            {/* Detail */}
            {activeLease ? (
              <div className="flex-1 min-h-0 min-w-0 overflow-y-auto scrollbar-none flex flex-col gap-2.5 pb-2">
                <div className={`${panel} p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`}>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                      v{activeLease.version} ·{" "}
                      <span style={{ color: statusColor(activeLease.status) }}>
                        {activeLease.status}
                      </span>
                    </span>
                    <h2 className="text-[15px] font-black text-white tracking-tight truncate mt-0.5">
                      {activeLease.propertyName}
                    </h2>
                    <p className="text-[11px] text-[#8E8E93] font-medium tabular-nums">
                      {activeLease.startDate} → {activeLease.endDate}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadLeaseAsText}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#1F1F23] bg-[#121215] text-[11px] font-bold text-[#A1A1AA] hover:text-white cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-2.5">
                  <div className={`${panel} p-3.5`}>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A] border-b border-[#1F1F23] pb-1.5 mb-2.5">
                      Specs
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(
                        [
                          ["Rent / mo", inr(activeLease.monthlyRent), C.ink],
                          ["Deposit", inr(activeLease.securityDeposit), C.warn],
                          ["Stamp duty", inr(activeLease.stampDutyPaid || 500), C.flat],
                          ["Notary", "Certified", C.up],
                        ] as const
                      ).map(([label, val, color]) => (
                        <div key={label}>
                          <span className="text-[9px] text-[#71717A] font-bold uppercase block">
                            {label}
                          </span>
                          <span
                            className="text-[13px] font-black tabular-nums"
                            style={{ color }}
                          >
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2.5 text-[10px] text-[#8E8E93] leading-snug bg-[#121215] border border-[#1F1F23] rounded-xl p-2.5">
                      {activeLease.notaryDetails ||
                        "E-Stamp registry validated via sub-registrar."}
                    </p>
                  </div>

                  <div className={`${panel} p-3.5`}>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A] border-b border-[#1F1F23] pb-1.5 mb-2.5">
                      E-sign
                    </p>
                    {(
                      [
                        ["Tenant", activeLease.tenantName, "tenant", activeLease.signatures.tenantSigned],
                        [
                          "Landlord",
                          activeLease.landlordName,
                          "landlord",
                          activeLease.signatures.landlordSigned,
                        ],
                      ] as const
                    ).map(([role, name, key, signed]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[#1F1F23] bg-[#121215] px-3 py-2 mb-1.5 last:mb-0"
                      >
                        <div className="min-w-0">
                          <span className="text-[9px] text-[#71717A] font-bold uppercase block">
                            {role}
                          </span>
                          <span className="text-[12px] font-bold text-white truncate block">
                            {name}
                          </span>
                        </div>
                        {signed ? (
                          <span className="text-[10px] font-bold text-[#34D399] border border-[#34D399]/30 bg-[#34D399]/10 px-2 py-0.5 rounded-md shrink-0">
                            ✓ Signed
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSignatureRole(key);
                              setShowSignModal(true);
                            }}
                            className="h-7 px-2.5 rounded-lg bg-white text-black text-[10px] font-bold cursor-pointer shrink-0"
                          >
                            Sign
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${panel} p-3.5 flex flex-col gap-2.5`}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A] border-b border-[#1F1F23] pb-1.5">
                    Clauses ({activeLease.clauses.length})
                  </p>
                  <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto scrollbar-none">
                    {activeLease.clauses.map((clause, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 rounded-xl border border-[#1F1F23] bg-[#121215] px-2.5 py-2"
                      >
                        <span className="w-5 h-5 rounded-md bg-[#1F1F23] text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-[11px] text-white font-semibold leading-snug flex-1">
                          {clause}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDeleteClause(index)}
                          className="text-[#FB7185]/70 hover:text-[#FB7185] p-0.5 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <form
                    onSubmit={handleAddClause}
                    className="flex flex-col sm:flex-row gap-1.5 border-t border-[#1F1F23] pt-2.5"
                  >
                    <input
                      type="text"
                      required
                      value={newClause}
                      onChange={(e) => setNewClause(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-xl bg-[#121215] border border-[#1F1F23] text-[12px] text-white placeholder:text-[#555] focus:outline-none focus:border-white/25"
                      placeholder="Append clause…"
                    />
                    <button
                      type="submit"
                      className="h-9 px-3 rounded-xl bg-white text-black text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Append
                    </button>
                  </form>
                </div>

                <p className="text-[9px] text-[#52525B] font-medium flex items-center gap-1 px-0.5">
                  <AlertTriangle className="w-3 h-3 text-[#FBBF24]/70" />
                  Edits bump version · notary / stamp duty rules apply
                </p>
              </div>
            ) : (
              <div className={`${panel} flex-1 flex items-center justify-center p-8`}>
                <p className="text-[12px] text-[#71717A] font-medium">Select a lease</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Signature modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${panel} max-w-md w-full p-5 shadow-2xl flex flex-col gap-4`}>
            <div className="flex items-center justify-between border-b border-[#1F1F23] pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-white/60" />
                <h3 className="font-black text-white text-sm">
                  Sign as {signatureRole === "tenant" ? "tenant" : "landlord"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="text-[#8E8E93] hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="bg-white rounded-xl overflow-hidden border border-[#1F1F23]">
              <canvas
                ref={canvasRef}
                width={380}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full touch-none cursor-crosshair"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearCanvas}
                className="flex-1 h-10 rounded-xl border border-[#1F1F23] text-[12px] font-bold text-[#8E8E93] hover:text-white cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="flex-1 h-10 rounded-xl border border-[#1F1F23] text-[12px] font-bold text-[#8E8E93] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSignature}
                className="flex-1 h-10 rounded-xl bg-white text-black text-[12px] font-bold cursor-pointer"
              >
                Affix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

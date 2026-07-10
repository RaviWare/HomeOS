import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Shield,
  Download,
  Search,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Clock,
} from "lucide-react";
import {
  getAuditLog,
  subscribeAuditLog,
  verifyAuditChain,
  exportAuditLogCsv,
  type AuditEntry,
  type AuditAction,
  type AuditEntity,
} from "../auditLog";

function downloadCsv() {
  const csv = exportAuditLogCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `homeos-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ACTION_COLOR: Record<string, string> = {
  create: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25",
  update: "text-[#60A5FA] bg-[#60A5FA]/10 border-[#60A5FA]/25",
  delete: "text-red-400 bg-red-500/10 border-red-500/25",
  settle: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25",
  import: "text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/25",
  export: "text-[#E5E5EA] bg-white/5 border-white/15",
  settings: "text-[#8E8E93] bg-white/5 border-white/10",
  sync: "text-[#29b6f6] bg-[#29b6f6]/10 border-[#29b6f6]/25",
  system: "text-[#8E8E93] bg-white/5 border-white/10",
  login: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25",
  logout: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25",
};

export default function AuditLogPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>(() => [...getAuditLog()]);
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setEntries([...getAuditLog()]);
    refresh();
    return subscribeAuditLog(refresh);
  }, []);

  const chainBad = useMemo(() => verifyAuditChain(entries), [entries]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (entityFilter !== "all" && e.entity !== entityFilter) return false;
      if (!qq) return true;
      return (
        e.summary.toLowerCase().includes(qq) ||
        e.entity.toLowerCase().includes(qq) ||
        e.action.toLowerCase().includes(qq) ||
        (e.entityId || "").toLowerCase().includes(qq) ||
        e.actor.toLowerCase().includes(qq)
      );
    });
  }, [entries, q, actionFilter, entityFilter]);

  return (
    <div className="flex-1 flex flex-col gap-3 p-3 sm:p-5 overflow-y-auto max-w-5xl w-full mx-auto pb-24 safe-bottom">
      <header className="bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-black text-white tracking-tight">Activity log</h1>
              <p className="text-xs text-[#8E8E93] mt-1 font-medium leading-relaxed max-w-xl">
                Immutable timestamped record of creates, edits, deletes, settlements, and imports.
                Entries cannot be edited or removed from this vault.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border ${
                chainBad < 0
                  ? "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25"
                  : "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25"
              }`}
            >
              {chainBad < 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Chain verified
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" /> Integrity warning
                </>
              )}
            </span>
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white text-black text-xs font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search summary, entity, actor…"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#121215] border border-[#1F1F23] text-sm text-white font-semibold focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-[#8E8E93] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-10 pl-8 pr-3 rounded-xl bg-[#121215] border border-[#1F1F23] text-xs text-white font-bold cursor-pointer"
              >
                <option value="all">All actions</option>
                {(
                  [
                    "create",
                    "update",
                    "delete",
                    "settle",
                    "import",
                    "export",
                    "settings",
                    "sync",
                  ] as AuditAction[]
                ).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-[#121215] border border-[#1F1F23] text-xs text-white font-bold cursor-pointer"
            >
              <option value="all">All entities</option>
              {(
                [
                  "property",
                  "lease",
                  "transaction",
                  "utility",
                  "maintenance",
                  "document",
                  "session",
                  "telegram",
                  "workspace",
                ] as AuditEntity[]
              ).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[10px] text-[#8E8E93] font-medium">
          <Lock className="w-3 h-3" />
          <span>
            {filtered.length} shown · {entries.length} total · append-only
          </span>
        </div>
      </header>

      <div className="bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Clock className="w-8 h-8 text-[#8E8E93] mx-auto mb-3 opacity-50" />
            <p className="text-sm font-bold text-white">No log entries yet</p>
            <p className="text-xs text-[#8E8E93] mt-1 max-w-sm mx-auto">
              Create a payment, edit a property, or settle a bill — every change appears here with a
              timestamp.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#1F1F23]">
            {filtered.slice(0, 200).map((e, i) => {
              const open = expanded === e.id;
              const badge = ACTION_COLOR[e.action] || ACTION_COLOR.system;
              return (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 15) * 0.02 }}
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : e.id)}
                    className="w-full text-left px-4 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5 shrink-0">
                        <span
                          className={`inline-flex text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md border ${badge}`}
                        >
                          {e.action}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-white leading-snug">{e.summary}</p>
                        <p className="text-[10px] text-[#8E8E93] mt-1 font-medium tabular-nums">
                          {new Date(e.ts).toLocaleString()} · {e.entity}
                          {e.entityId ? ` · ${e.entityId.slice(0, 16)}` : ""} · {e.actor}
                        </p>
                      </div>
                      <span className="text-[9px] font-mono text-white/25 shrink-0 hidden sm:inline">
                        {e.hash}
                      </span>
                    </div>
                    {open && (
                      <div className="mt-3 ml-0 sm:ml-16 p-3 rounded-xl bg-[#121215] border border-[#1F1F23] text-[10px] font-mono text-[#8E8E93] space-y-1.5">
                        <div className="flex gap-2">
                          <span className="text-white/40 w-16 shrink-0">id</span>
                          <span className="text-white/70 break-all">{e.id}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-white/40 w-16 shrink-0">hash</span>
                          <span className="text-white/70">{e.hash}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-white/40 w-16 shrink-0">prev</span>
                          <span className="text-white/70">{e.prevHash}</span>
                        </div>
                        {e.before != null && (
                          <div>
                            <span className="text-white/40 block mb-1">before</span>
                            <pre className="text-[9px] text-white/60 overflow-x-auto max-h-28 whitespace-pre-wrap">
                              {JSON.stringify(e.before, null, 2)}
                            </pre>
                          </div>
                        )}
                        {e.after != null && (
                          <div>
                            <span className="text-white/40 block mb-1">after</span>
                            <pre className="text-[9px] text-white/60 overflow-x-auto max-h-28 whitespace-pre-wrap">
                              {JSON.stringify(e.after, null, 2)}
                            </pre>
                          </div>
                        )}
                        <p className="text-[9px] text-[#F59E0B]/80 pt-1 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Read-only — cannot edit or delete
                        </p>
                      </div>
                    )}
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileText,
  GripVertical,
  Receipt,
  Settings2,
  X,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { Lease, Property, Transaction, MaintenanceTicket } from "../types";
import {
  downloadInvoicePdf,
  downloadPdfReport,
  exportFullWorkspace,
  formatMoney,
} from "../exportKit";
import {
  saveDeckPrefs,
  resetDeckPrefs,
  type DeckPrefs,
  type ModulesLayout,
  type DeckViewPref,
} from "./deckPrefs";
import {
  PERSONAS,
  personaForRole,
  roleTitle,
  type PersonaId,
} from "../userPersonas";
import { APP_NAV, navItemsForUser } from "../appNav";
import type { AppTab } from "../routing";

export type { DeckPrefs } from "./deckPrefs";
export { loadDeckPrefs, saveDeckPrefs, resetDeckPrefs } from "./deckPrefs";
export { greetingWithOptionalName as greetingLine } from "../userDisplay";

interface DeckToolkitProps {
  userName: string;
  userEmail?: string;
  userRole: string;
  workspaceName: string;
  properties: Property[];
  leases: Lease[];
  transactions: Transaction[];
  tickets: MaintenanceTicket[];
  prefs: DeckPrefs;
  onPrefsChange: (p: DeckPrefs) => void;
}

type Panel = "none" | "export" | "invoice" | "customize";

const btnBase =
  "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer select-none";

const ToggleRow: React.FC<{
  on: boolean;
  label: string;
  desc: string;
  onClick: () => void;
}> = ({ on, label, desc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left cursor-pointer min-h-[68px] transition-all ${
      on
        ? "border-white/30 bg-white/[0.07]"
        : "border-[#1F1F23] bg-[#0A0A0C] hover:border-white/15"
    }`}
  >
    <span
      className={`mt-0.5 w-10 h-6 rounded-full p-0.5 shrink-0 transition-colors ${
        on ? "bg-white" : "bg-[#2E2E33]"
      }`}
    >
      <span
        className={`block w-5 h-5 rounded-full transition-transform ${
          on ? "translate-x-4 bg-black" : "translate-x-0 bg-[#8E8E93]"
        }`}
      />
    </span>
    <span className="min-w-0">
      <span className="text-xs font-black text-white block">{label}</span>
      <span className="text-[10px] text-[#8E8E93] font-medium leading-snug block mt-0.5">
        {desc}
      </span>
    </span>
  </button>
);

export default function DeckToolkit({
  userName,
  userEmail,
  userRole,
  workspaceName,
  properties,
  leases,
  transactions,
  tickets,
  prefs,
  onPrefsChange,
}: DeckToolkitProps) {
  const [panel, setPanel] = useState<Panel>("none");
  const [msg, setMsg] = useState("");

  const paidTx = useMemo(
    () => transactions.filter((t) => t.status === "Paid" || t.status === "Pending").slice(0, 40),
    [transactions]
  );
  const [invProperty, setInvProperty] = useState("");
  const [invTo, setInvTo] = useState("");
  const [invNote, setInvNote] = useState("Thank you for your payment.");
  const [invTxId, setInvTxId] = useState("");

  useEffect(() => {
    if (!invProperty && properties[0]) setInvProperty(properties[0].name);
    if (!invTo) {
      const lease = leases.find((l) => l.status === "Active") || leases[0];
      if (lease?.tenantName) setInvTo(lease.tenantName);
    }
  }, [properties, leases, invProperty, invTo]);

  const flash = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 3200);
  };

  const runExport = (format: "csv" | "excel" | "pdf") => {
    try {
      exportFullWorkspace(format, { properties, leases, transactions, tickets, workspaceName });
      flash(
        format === "pdf"
          ? "PDF opened — use Print → Save as PDF"
          : `${format.toUpperCase()} download started`
      );
    } catch (e) {
      flash("Export failed — try again");
      console.error(e);
    }
  };

  const exportStatsPdf = () => {
    downloadPdfReport({
      title: "Lifetime Portfolio Snapshot",
      subtitle: `${workspaceName} · ${userRole}`,
      columns: ["Metric", "Value"],
      rows: [
        ["Properties", properties.length],
        ["Leases", leases.length],
        ["Transactions", transactions.length],
        ["Tickets", tickets.length],
        [
          "Total rent (paid)",
          formatMoney(
            transactions
              .filter((t) => t.category === "Rent" && t.status === "Paid")
              .reduce((s, t) => s + t.amount, 0)
          ),
        ],
      ],
    });
    flash("Snapshot PDF ready");
  };

  const generateInvoice = () => {
    const tx = paidTx.find((t) => t.id === invTxId) || paidTx[0];
    downloadInvoicePdf({
      invoiceNumber: tx?.invoiceNumber || `INV-${Date.now().toString().slice(-8)}`,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: tx?.date,
      fromName: userName && userName !== "HomeOS User" ? userName : workspaceName,
      fromEmail: userEmail,
      toName: invTo || "Recipient",
      toMeta: userRole,
      propertyName: invProperty || tx?.propertyName,
      lineItems: [
        {
          description: tx
            ? `${tx.category} — ${tx.propertyName} (${tx.date})`
            : `Charges — ${invProperty || "Property"}`,
          amount: tx?.amount || 0,
        },
      ],
      notes: invNote,
    });
    flash("Invoice opened — Print → Save as PDF");
  };

  const toggle = (id: Panel) => setPanel((p) => (p === id ? "none" : id));

  /** Atomic multi-key update — sequential setPref clobbered stale state. */
  const patchPrefs = (partial: Partial<DeckPrefs>) => {
    const next = { ...prefs, ...partial };
    onPrefsChange(next);
    saveDeckPrefs(next);
  };

  const setPref = <K extends keyof DeckPrefs>(key: K, value: DeckPrefs[K]) => {
    patchPrefs({ [key]: value } as Partial<DeckPrefs>);
  };

  return (
    <motion.div
      layout
      className="rounded-2xl border border-[#1F1F23] bg-[#0A0A0C] overflow-hidden shadow-lg shadow-black/20"
    >
      {/* Always-visible primary actions */}
      <div className="p-3 sm:p-4 border-b border-[#1F1F23]/80">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
              Actions
            </p>
            <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
              Export data, create invoices, or customize your deck
            </p>
          </div>
          {msg && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2.5 py-1.5 rounded-lg"
            >
              <Check className="w-3.5 h-3.5" />
              {msg}
            </motion.span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => toggle("export")}
            className={`${btnBase} ${
              panel === "export"
                ? "bg-white text-black"
                : "bg-[#121215] text-white border border-[#1F1F23] hover:border-white/30"
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => toggle("invoice")}
            className={`${btnBase} ${
              panel === "invoice"
                ? "bg-white text-black"
                : "bg-[#121215] text-white border border-[#1F1F23] hover:border-white/30"
            }`}
          >
            <Receipt className="w-4 h-4" />
            Invoice
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => toggle("customize")}
            className={`${btnBase} ${
              panel === "customize"
                ? "bg-white text-black"
                : "bg-[#121215] text-white border border-[#1F1F23] hover:border-white/30"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Customize
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => runExport("csv")}
            className={`${btnBase} bg-[#121215] text-white border border-[#1F1F23] hover:border-white/30`}
          >
            <FileText className="w-4 h-4" />
            Quick CSV
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {panel === "export" && (
          <motion.div
            key="export"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="p-3 sm:p-4 grid grid-cols-2 lg:grid-cols-4 gap-2 bg-[#050506]">
              {[
                {
                  label: "CSV pack",
                  desc: "Transactions, homes, leases",
                  icon: FileText,
                  color: "text-white",
                  onClick: () => runExport("csv"),
                },
                {
                  label: "Excel (.xls)",
                  desc: "Open in Excel / Sheets",
                  icon: FileSpreadsheet,
                  color: "text-[#10B981]",
                  onClick: () => runExport("excel"),
                },
                {
                  label: "PDF ledger",
                  desc: "Printable transaction report",
                  icon: Download,
                  color: "text-[#F59E0B]",
                  onClick: () => runExport("pdf"),
                },
                {
                  label: "PDF snapshot",
                  desc: "Portfolio one-pager",
                  icon: FileText,
                  color: "text-[#8B5CF6]",
                  onClick: exportStatsPdf,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    type="button"
                    whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.25)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={item.onClick}
                    className="flex flex-col items-start gap-1.5 p-3.5 rounded-xl border border-[#1F1F23] bg-[#0A0A0C] text-left cursor-pointer min-h-[88px]"
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-xs font-black text-white">{item.label}</span>
                    <span className="text-[10px] text-[#8E8E93] font-medium leading-snug">
                      {item.desc}
                    </span>
                  </motion.button>
                );
              })}
              <button
                type="button"
                onClick={() => setPanel("none")}
                className="col-span-2 lg:col-span-4 h-9 rounded-lg text-[11px] font-bold text-[#8E8E93] hover:text-white border border-[#1F1F23] cursor-pointer"
              >
                Close export panel
              </button>
            </div>
          </motion.div>
        )}

        {panel === "invoice" && (
          <motion.div
            key="invoice"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="p-3 sm:p-4 flex flex-col gap-3 bg-[#050506]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase text-[#8E8E93]">Bill to</span>
                  <input
                    value={invTo}
                    onChange={(e) => setInvTo(e.target.value)}
                    placeholder="Recipient name"
                    className="h-11 bg-[#121215] border border-[#1F1F23] focus:border-white/40 focus:outline-none rounded-xl px-3 text-sm text-white font-semibold"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase text-[#8E8E93]">Property</span>
                  <select
                    value={invProperty}
                    onChange={(e) => setInvProperty(e.target.value)}
                    className="h-11 bg-[#121215] border border-[#1F1F23] rounded-xl px-3 text-sm text-white font-semibold cursor-pointer"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                    {!properties.length && <option value="">No properties</option>}
                  </select>
                </label>
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-[#8E8E93]">
                    Line item from ledger
                  </span>
                  <select
                    value={invTxId}
                    onChange={(e) => setInvTxId(e.target.value)}
                    className="h-11 bg-[#121215] border border-[#1F1F23] rounded-xl px-3 text-sm text-white font-semibold cursor-pointer"
                  >
                    <option value="">Latest ledger line</option>
                    {paidTx.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.date} · {t.category} · {t.propertyName} · ₹{t.amount}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-[#8E8E93]">Notes</span>
                  <input
                    value={invNote}
                    onChange={(e) => setInvNote(e.target.value)}
                    className="h-11 bg-[#121215] border border-[#1F1F23] focus:border-white/40 focus:outline-none rounded-xl px-3 text-sm text-white font-semibold"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={generateInvoice}
                  className={`${btnBase} bg-white text-black flex-1 sm:flex-none min-w-[160px]`}
                >
                  <Receipt className="w-4 h-4" />
                  Generate invoice PDF
                </motion.button>
                <button
                  type="button"
                  onClick={() => setPanel("none")}
                  className={`${btnBase} border border-[#1F1F23] text-[#8E8E93] hover:text-white`}
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {panel === "customize" && (
          <motion.div
            key="customize"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="p-3 sm:p-4 flex flex-col gap-4 bg-[#050506]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-white" />
                  <span className="text-sm font-black text-white">Customize Command Deck</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const d = resetDeckPrefs();
                    onPrefsChange(d);
                    flash("Defaults restored");
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8E8E93] hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>

              <p className="text-[11px] text-[#71717A] font-medium leading-snug">
                Your deck starts from your role path. Drag modules below to match your day —
                order applies to sidebar and All modules.
              </p>

              {(() => {
                const rolePersona = personaForRole(userRole);
                const active =
                  prefs.usePersonaDefaults && prefs.personaOverride
                    ? PERSONAS[prefs.personaOverride]
                    : rolePersona;
                return (
                  <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                      Active profile
                    </p>
                    <p className="text-[13px] font-black text-white mt-0.5">
                      {active.label}
                      <span className="text-[#71717A] font-semibold">
                        {" · "}
                        {roleTitle(userRole)}
                      </span>
                    </p>
                    <p className="text-[11px] text-[#8E8E93] font-medium mt-1 leading-snug">
                      {active.tagline}
                    </p>
                    <ul className="mt-2 space-y-0.5">
                      {active.jobs.slice(0, 3).map((j) => (
                        <li key={j} className="text-[10px] text-[#71717A] font-medium">
                          · {j}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase text-[#8E8E93]">
                  Dashboard persona
                </span>
                <select
                  value={prefs.personaOverride || "from_role"}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "from_role") {
                      patchPrefs({
                        personaOverride: null,
                        usePersonaDefaults: true,
                      });
                    } else {
                      const p = PERSONAS[v as PersonaId];
                      patchPrefs({
                        personaOverride: v as PersonaId,
                        usePersonaDefaults: true,
                        ...(p ? { defaultDeckView: p.defaultDeckView } : {}),
                      });
                    }
                  }}
                  className="h-11 bg-[#121215] border border-[#1F1F23] rounded-xl px-3 text-sm text-white font-semibold cursor-pointer"
                >
                  <option value="from_role">
                    Auto from role ({personaForRole(userRole).label})
                  </option>
                  {(Object.keys(PERSONAS) as PersonaId[]).map((id) => (
                    <option key={id} value={id}>
                      {PERSONAS[id].label} — {PERSONAS[id].tagline}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-[#8E8E93]">
                    Greeting style
                  </span>
                  <select
                    value={prefs.greeting}
                    onChange={(e) =>
                      setPref("greeting", e.target.value as DeckPrefs["greeting"])
                    }
                    className="h-11 bg-[#121215] border border-[#1F1F23] rounded-xl px-3 text-sm text-white font-semibold cursor-pointer"
                  >
                    <option value="auto">Auto — time of day</option>
                    <option value="hello">Hello</option>
                    <option value="welcome">Welcome back</option>
                    <option value="good_day">Good day</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-[#8E8E93]">
                    Default deck view
                  </span>
                  <select
                    value={prefs.defaultDeckView}
                    onChange={(e) =>
                      setPref("defaultDeckView", e.target.value as DeckViewPref)
                    }
                    className="h-11 bg-[#121215] border border-[#1F1F23] rounded-xl px-3 text-sm text-white font-semibold cursor-pointer"
                  >
                    <option value="life">Life OS</option>
                    <option value="graphs">Trends</option>
                    <option value="dataset">Datasets</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase text-[#8E8E93]">
                  Modules layout
                </span>
                <select
                  value={prefs.modulesLayout}
                  onChange={(e) =>
                    setPref("modulesLayout", e.target.value as ModulesLayout)
                  }
                  className="h-11 bg-[#121215] border border-[#1F1F23] rounded-xl px-3 text-sm text-white font-semibold cursor-pointer"
                >
                  <option value="grouped">Grouped by area</option>
                  <option value="grid">Flat grid</option>
                </select>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    ["showWeather", "Weather & local time", "Region clock + conditions"],
                    ["animate", "Motion animations", "Page enter micro-motion"],
                    ["showModuleCounts", "Module live counts", "Badges on launcher tiles"],
                    [
                      "showSecondaryModules",
                      "Show secondary modules",
                      "Persona de-emphasized modules stay visible",
                    ],
                    [
                      "usePersonaDefaults",
                      "Sync to persona",
                      "Sidebar + deck order follow profile",
                    ],
                  ] as const
                ).map(([key, label, desc]) => (
                  <ToggleRow
                    key={key}
                    on={!!prefs[key]}
                    label={label}
                    desc={desc}
                    onClick={() => setPref(key, !prefs[key] as never)}
                  />
                ))}
              </div>

              {/* Drag / reorder modules */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-[10px] font-bold uppercase text-[#8E8E93]">
                    Arrange dashboard modules
                  </p>
                  {prefs.moduleOrder.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPref("moduleOrder", []);
                        flash("Order reset to persona default");
                      }}
                      className="text-[10px] font-bold text-[#8E8E93] hover:text-white cursor-pointer"
                    >
                      Clear custom order
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-[#52525B] font-medium mb-2 leading-snug">
                  Use ↑ ↓ to move. Order drives sidebar, mobile chips, and All modules.
                  {prefs.moduleOrder.length === 0
                    ? " Currently using persona defaults."
                    : " Custom order is active."}
                </p>
                <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto pr-0.5">
                  {(() => {
                    const rolePersona = personaForRole(userRole);
                    const active =
                      prefs.usePersonaDefaults && prefs.personaOverride
                        ? PERSONAS[prefs.personaOverride]
                        : rolePersona;
                    const ordered = navItemsForUser({
                      priority: active.modulePriority,
                      moduleOrder: prefs.moduleOrder,
                      secondary: active.secondaryModules,
                      includeSecondary: prefs.showSecondaryModules,
                      hidden: prefs.hiddenModules,
                    });
                    const move = (id: AppTab, dir: -1 | 1) => {
                      const base =
                        prefs.moduleOrder.length > 0
                          ? [...prefs.moduleOrder]
                          : ordered.map((i) => i.id);
                      // ensure all visible ids present
                      ordered.forEach((i) => {
                        if (!base.includes(i.id)) base.push(i.id);
                      });
                      const idx = base.indexOf(id);
                      if (idx < 0) return;
                      const j = idx + dir;
                      if (j < 0 || j >= base.length) return;
                      const next = [...base];
                      [next[idx], next[j]] = [next[j], next[idx]];
                      setPref("moduleOrder", next);
                    };
                    return ordered.map((n, i) => (
                      <div
                        key={n.id}
                        className="flex items-center gap-2 rounded-xl border border-[#1F1F23] bg-[#0E0E11] px-2 py-1.5"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-[#3F3F46] shrink-0" />
                        <span className="text-[10px] font-bold text-[#52525B] w-5 tabular-nums">
                          {i + 1}
                        </span>
                        <span className="text-[12px] font-bold text-white flex-1 truncate">
                          {n.label}
                        </span>
                        <button
                          type="button"
                          aria-label={`Move ${n.label} up`}
                          disabled={i === 0}
                          onClick={() => move(n.id, -1)}
                          className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/5 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${n.label} down`}
                          disabled={i === ordered.length - 1}
                          onClick={() => move(n.id, 1)}
                          className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/5 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-[#8E8E93] mb-2">
                  Hide modules
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {APP_NAV.filter((n) => n.id !== "dashboard" && n.id !== "settings").map(
                    (n) => {
                      const hidden = prefs.hiddenModules.includes(n.id);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            const next = hidden
                              ? prefs.hiddenModules.filter((x) => x !== n.id)
                              : [...prefs.hiddenModules, n.id];
                            setPref("hiddenModules", next as AppTab[]);
                          }}
                          className={`h-8 px-2.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                            hidden
                              ? "bg-[#FB7185]/15 border-[#FB7185]/30 text-[#FB7185]"
                              : "bg-[#121215] border-[#1F1F23] text-[#8E8E93] hover:text-white"
                          }`}
                        >
                          {hidden ? "Hidden · " : ""}
                          {n.short}
                        </button>
                      );
                    }
                  )}
                </div>
                <p className="text-[9px] text-[#52525B] font-medium mt-1.5">
                  Hidden modules leave the sidebar & deck. Settings always stays.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-[#8E8E93] mb-2">
                  Pin modules (when not using full custom order)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {APP_NAV.filter((n) => n.id !== "dashboard").map((n) => {
                    const pinned = prefs.pinnedModules.includes(n.id);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          const next = pinned
                            ? prefs.pinnedModules.filter((x) => x !== n.id)
                            : [...prefs.pinnedModules, n.id];
                          setPref("pinnedModules", next as AppTab[]);
                        }}
                        className={`h-8 px-2.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                          pinned
                            ? "bg-white text-black border-white"
                            : "bg-[#121215] border-[#1F1F23] text-[#8E8E93] hover:text-white"
                        }`}
                      >
                        {pinned ? "★ " : ""}
                        {n.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPanel("none")}
                className={`${btnBase} border border-[#1F1F23] text-[#8E8E93] hover:text-white w-full sm:w-auto self-start`}
              >
                Done · sidebar updates live
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  CreditCard,
  FolderOpen,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Zap,
  Home,
  ListChecks,
  Plane,
  Wallet,
  Droplet,
  Wrench,
  MessageSquareText,
  TrendingUp,
  ArrowRight,
  Activity,
  BarChart3,
} from "lucide-react";

type SceneId =
  | "deck"
  | "life"
  | "homes"
  | "leases"
  | "money"
  | "utils"
  | "repair"
  | "tax"
  | "vault"
  | "ask"
  | "log";

const SCENES: {
  id: SceneId;
  label: string;
  badge: string;
  title: string;
  why: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "deck",
    label: "Deck",
    badge: "Command Deck",
    title: "Live home report",
    why: "Net flow, occupancy, renewals, and spend — live numbers in one HQ.",
    icon: LayoutDashboard,
  },
  {
    id: "life",
    label: "Life",
    badge: "Home Life",
    title: "Income · assets · budgets · chores",
    why: "Side hustles and household ops on the same board as rent.",
    icon: Home,
  },
  {
    id: "homes",
    label: "Homes",
    badge: "Property Hub",
    title: "Portfolio properties",
    why: "Status, rent, and ownership — structured, not scattered.",
    icon: Building2,
  },
  {
    id: "leases",
    label: "Leases",
    badge: "Agreements",
    title: "Renewals & deposits",
    why: "Term countdown, deposit held, and renewal escalation — always visible.",
    icon: FileText,
  },
  {
    id: "money",
    label: "Money",
    badge: "Ledger",
    title: "Settle · invoice · export",
    why: "Proof-ready money trail in seconds.",
    icon: CreditCard,
  },
  {
    id: "utils",
    label: "Utils",
    badge: "Utilities",
    title: "Meters & due dates",
    why: "Power, water, internet — no surprise bills.",
    icon: Droplet,
  },
  {
    id: "repair",
    label: "Repair",
    badge: "Maintenance",
    title: "Tickets & vendors",
    why: "Open tickets, vendor spend, and priority — cost history you can export.",
    icon: Wrench,
  },
  {
    id: "tax",
    label: "Tax",
    badge: "Expense Lab",
    title: "Spend & tax clarity",
    why: "Category views ready for accountant export.",
    icon: TrendingUp,
  },
  {
    id: "vault",
    label: "Vault",
    badge: "Documents",
    title: "Leases, bills, receipts",
    why: "Searchable files with OCR import.",
    icon: FolderOpen,
  },
  {
    id: "ask",
    label: "Ask",
    badge: "Ask Your Data",
    title: "Plain-English answers",
    why: "From your records — export when you need proof.",
    icon: MessageSquareText,
  },
  {
    id: "log",
    label: "Log",
    badge: "Activity Log",
    title: "Immutable trail",
    why: "Every change timestamped and sealed.",
    icon: ShieldCheck,
  },
];

const ROTATE_MS = 4800;

/** Demo series for Portfolio pulse chart (monthly net, $k) */
const PULSE = [
  { m: "Aug", v: 4.2 },
  { m: "Sep", v: 4.8 },
  { m: "Oct", v: 5.1 },
  { m: "Nov", v: 6.4 },
  { m: "Dec", v: 6.8 },
  { m: "Jan", v: 7.6 },
  { m: "Feb", v: 8.0 },
  { m: "Mar", v: 8.4 },
];

const PULSE_MAX = 10;
const PULSE_W = 220;
const PULSE_H = 72;
const PULSE_PAD = { l: 28, r: 8, t: 10, b: 16 };

function pulsePoints() {
  const iw = PULSE_W - PULSE_PAD.l - PULSE_PAD.r;
  const ih = PULSE_H - PULSE_PAD.t - PULSE_PAD.b;
  return PULSE.map((p, i) => {
    const x = PULSE_PAD.l + (i / Math.max(1, PULSE.length - 1)) * iw;
    const y = PULSE_PAD.t + ih - (p.v / PULSE_MAX) * ih;
    return { ...p, x, y };
  });
}

interface DashboardPreviewProps {
  onCta?: () => void;
}

export default function DashboardPreview({ onCta }: DashboardPreviewProps) {
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setScene((s) => (s + 1) % SCENES.length);
      setTick((t) => t + 1);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const active = SCENES[scene];
  const Icon = active.icon;

  const pick = (i: number) => {
    setScene(i);
    setTick((t) => t + 1);
    setPaused(true);
    window.setTimeout(() => setPaused(false), 14000);
  };

  /* Brand accents — monochrome base + emerald / rose / amber (site system) */
  const B = {
    up: "#34D399",
    down: "#FB7185",
    warn: "#F59E0B",
    ink: "#FAFAFA",
    muted: "#8E8E93",
    dim: "#52525B",
    panel: "#0A0A0C",
    raised: "#121215",
    border: "#1F1F23",
  } as const;

  return (
    <div className="relative w-full max-w-xl ml-auto">
      {/* Brand ambient — soft white + amber wash (matches hero mkt-grid) */}
      <motion.div
        className="absolute -inset-8 rounded-[2.75rem] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.07), transparent 65%)",
        }}
        animate={{ opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-8 -right-2 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(245,158,11,0.12)" }}
        animate={{ opacity: [0.2, 0.45, 0.2], scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute -bottom-6 -left-4 w-32 h-32 rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(52,211,153,0.08)" }}
      />

      <div
        className="relative rounded-[1.25rem] border overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.75)]"
        style={{
          background: B.panel,
          borderColor: B.border,
          boxShadow:
            "0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Top hairline (mkt-card) */}
        <div
          className="absolute top-0 inset-x-0 h-px z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)",
          }}
        />

        {/* Window chrome */}
        <div
          className="flex items-center justify-between px-3.5 h-11 border-b"
          style={{ borderColor: B.border, background: "#08080A" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]/90" />
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                style={{ background: B.up }}
              />
              <span
                className="relative inline-flex rounded-full h-1.5 w-1.5"
                style={{ background: B.up }}
              />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/70">
              Live report
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-white/25" />
            <span className="text-[9px] font-bold tabular-nums" style={{ color: B.dim }}>
              {String(scene + 1).padStart(2, "0")}/{String(SCENES.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Progress — white brand bar */}
        <div className="h-0.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
          {!paused && (
            <motion.div
              key={tick}
              className="h-full bg-white"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: ROTATE_MS / 1000, ease: "linear" }}
            />
          )}
          {paused && <div className="h-full w-full bg-white/20" />}
        </div>

        <div className="p-3 sm:p-3.5 flex gap-2.5 relative">
          {/* subtle grid wash inside shell */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 90% 50% at 50% 0%, rgba(255,255,255,0.04), transparent 55%)",
            }}
          />

          {/* Mini rail */}
          <div className="hidden sm:flex flex-col gap-1 w-9 shrink-0 pt-0.5 relative z-[1]">
            {SCENES.slice(0, 6).map((s, i) => {
              const RailIcon = s.icon;
              const on = i === scene || (scene >= 6 && i === 5);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(i)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    on
                      ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.18)]"
                      : "text-white/35 hover:text-white/70"
                  }`}
                  style={
                    on
                      ? undefined
                      : {
                          background: B.raised,
                          border: `1px solid ${B.border}`,
                        }
                  }
                  aria-label={s.badge}
                >
                  <RailIcon className="w-3.5 h-3.5" />
                </button>
              );
            })}
            <div
              className="mt-auto w-8 h-8 rounded-xl flex items-center justify-center text-white/25"
              style={{ background: B.raised, border: `1px solid ${B.border}` }}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="min-w-0 flex-1 relative z-[1]">
            {/* Module tabs */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5 mb-2.5 -mx-0.5 px-0.5">
              {SCENES.map((s, i) => {
                const TabIcon = s.icon;
                const on = i === scene;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pick(i)}
                    className={`shrink-0 h-7 px-2.5 rounded-lg text-[9px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all ${
                      on
                        ? "bg-white text-black shadow-[0_0_16px_rgba(255,255,255,0.12)]"
                        : "text-[#8E8E93] hover:text-white"
                    }`}
                    style={
                      on
                        ? undefined
                        : {
                            background: B.raised,
                            border: `1px solid ${B.border}`,
                          }
                    }
                  >
                    <TabIcon className="w-2.5 h-2.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Scene header */}
            <div className="relative h-[54px] mb-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id + "-h"}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 rounded-xl px-2.5 flex items-center gap-2.5"
                  style={{
                    border: `1px solid ${B.border}`,
                    background:
                      "linear-gradient(105deg, rgba(255,255,255,0.06) 0%, #0A0A0C 55%, rgba(52,211,153,0.04) 100%)",
                  }}
                >
                  <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shrink-0 shadow-[0_0_24px_rgba(255,255,255,0.12)]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/40">
                      {active.badge}
                    </p>
                    <p className="text-[12px] sm:text-[13px] font-black text-white tracking-tight truncate leading-tight">
                      {active.title}
                    </p>
                  </div>
                  <span
                    className="hidden sm:inline-flex items-center gap-1.5 text-[8px] font-bold rounded-md px-2 py-1"
                    style={{
                      color: B.up,
                      border: `1px solid rgba(52,211,153,0.25)`,
                      background: "rgba(52,211,153,0.08)",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: B.up }}
                    />
                    Live
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Scene body */}
            <div
              className={`relative overflow-hidden rounded-xl p-2 ${
                active.id === "deck" ||
                active.id === "leases" ||
                active.id === "repair"
                  ? "h-[252px] sm:h-[272px]"
                  : "h-[210px] sm:h-[220px]"
              }`}
              style={{
                border: `1px solid ${B.border}`,
                background: "#08080A",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-2 flex flex-col gap-1.5"
                >
                  {active.id === "deck" && (() => {
                    const pts = pulsePoints();
                    const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
                    const area =
                      `M ${pts[0].x.toFixed(1)},${(PULSE_H - PULSE_PAD.b).toFixed(1)} ` +
                      pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
                      ` L ${pts[pts.length - 1].x.toFixed(1)},${(PULSE_H - PULSE_PAD.b).toFixed(1)} Z`;
                    const kpis = [
                      {
                        v: "$8.4k",
                        l: "Net flow",
                        sub: "+12% YoY",
                        tone: B.up,
                      },
                      {
                        v: "$22.1k",
                        l: "Income",
                        sub: "12-mo in",
                        tone: B.up,
                      },
                      {
                        v: "$13.7k",
                        l: "Spend",
                        sub: "12-mo out",
                        tone: B.down,
                      },
                      {
                        v: "94%",
                        l: "Occupied",
                        sub: "3 of 3 homes",
                        tone: B.ink,
                      },
                      {
                        v: "47d",
                        l: "Renewal",
                        sub: "Riverside 4B",
                        tone: B.warn,
                      },
                      {
                        v: "3",
                        l: "Open items",
                        sub: "1 bill · 2 tickets",
                        tone: B.warn,
                      },
                    ];
                    const tile = {
                      border: `1px solid ${B.border}`,
                      background: B.raised,
                    };
                    return (
                      <>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                          {kpis.map((k, i) => (
                            <motion.div
                              key={k.l}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className="rounded-xl px-1.5 py-1.5 text-left relative overflow-hidden"
                              style={tile}
                            >
                              <span
                                className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                                style={{
                                  background: k.tone,
                                  boxShadow: `0 0 8px ${k.tone}55`,
                                }}
                              />
                              <span
                                className="text-[12px] sm:text-[13px] font-black tabular-nums block leading-none pl-1.5"
                                style={{ color: k.tone }}
                              >
                                {k.v}
                              </span>
                              <span
                                className="text-[7px] font-bold uppercase mt-0.5 block tracking-wide pl-1.5 truncate"
                                style={{ color: B.muted }}
                              >
                                {k.l}
                              </span>
                              <span
                                className="text-[7px] font-semibold block pl-1.5 truncate"
                                style={{ color: B.dim }}
                              >
                                {k.sub}
                              </span>
                            </motion.div>
                          ))}
                        </div>

                        <div className="flex-1 grid grid-cols-5 gap-1.5 min-h-0">
                          {/* Chart */}
                          <div
                            className="col-span-3 rounded-xl p-1.5 flex flex-col min-h-0 relative overflow-hidden"
                            style={tile}
                          >
                            <div
                              className="absolute inset-0 pointer-events-none opacity-60"
                              style={{
                                background:
                                  "linear-gradient(180deg, rgba(52,211,153,0.06) 0%, transparent 50%)",
                              }}
                            />
                            <div className="relative flex items-center justify-between px-1 mb-0.5">
                              <span
                                className="text-[8px] font-bold uppercase tracking-wide"
                                style={{ color: B.muted }}
                              >
                                Portfolio pulse · net ($k)
                              </span>
                              <span
                                className="text-[9px] font-black tabular-nums"
                                style={{ color: B.up }}
                              >
                                $8.4k · +12%
                              </span>
                            </div>
                            <svg
                              viewBox={`0 0 ${PULSE_W} ${PULSE_H}`}
                              className="relative w-full flex-1 min-h-[72px]"
                              preserveAspectRatio="xMidYMid meet"
                            >
                              <defs>
                                <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={B.up} stopOpacity="0.4" />
                                  <stop offset="100%" stopColor={B.up} stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              {[0, 2.5, 5, 7.5, 10].map((tick) => {
                                const y =
                                  PULSE_PAD.t +
                                  (PULSE_H - PULSE_PAD.t - PULSE_PAD.b) *
                                    (1 - tick / PULSE_MAX);
                                return (
                                  <g key={tick}>
                                    <line
                                      x1={PULSE_PAD.l}
                                      x2={PULSE_W - PULSE_PAD.r}
                                      y1={y}
                                      y2={y}
                                      stroke="rgba(255,255,255,0.05)"
                                      strokeWidth="1"
                                    />
                                    <text
                                      x={PULSE_PAD.l - 4}
                                      y={y + 2.5}
                                      textAnchor="end"
                                      fill={B.dim}
                                      fontSize="6"
                                      fontWeight="700"
                                      fontFamily="system-ui,sans-serif"
                                    >
                                      {tick}
                                    </text>
                                  </g>
                                );
                              })}
                              <motion.path
                                d={area}
                                fill="url(#reportGrad)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.45 }}
                              />
                              <motion.polyline
                                fill="none"
                                stroke={B.up}
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={line}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.95, ease: "easeOut" }}
                                style={{
                                  filter: "drop-shadow(0 0 6px rgba(52,211,153,0.45))",
                                }}
                              />
                              {pts.map((p, i) => (
                                <g key={p.m}>
                                  <motion.circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={i === pts.length - 1 ? 3.4 : 2}
                                    fill={i === pts.length - 1 ? B.up : B.ink}
                                    stroke="#08080A"
                                    strokeWidth="1.2"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.08 * i + 0.2 }}
                                  />
                                  <text
                                    x={p.x}
                                    y={PULSE_H - 3}
                                    textAnchor="middle"
                                    fill={B.dim}
                                    fontSize="5.5"
                                    fontWeight="700"
                                    fontFamily="system-ui,sans-serif"
                                  >
                                    {p.m}
                                  </text>
                                  {(i === pts.length - 1 || i === 0 || i === 3) && (
                                    <text
                                      x={p.x}
                                      y={p.y - 5}
                                      textAnchor="middle"
                                      fill={B.muted}
                                      fontSize="6"
                                      fontWeight="800"
                                      fontFamily="system-ui,sans-serif"
                                    >
                                      {p.v}
                                    </text>
                                  )}
                                </g>
                              ))}
                            </svg>
                          </div>

                          {/* Unit yield + insight */}
                          <div className="col-span-2 flex flex-col gap-1.5 min-h-0">
                            <div
                              className="rounded-xl p-1.5 flex-1 min-h-0"
                              style={tile}
                            >
                              <p
                                className="text-[7px] font-bold uppercase tracking-wide mb-1 px-0.5"
                                style={{ color: B.muted }}
                              >
                                Unit yield / mo
                              </p>
                              <div className="space-y-1">
                                {[
                                  { n: "Riverside 4B", a: 1850, max: 2200 },
                                  { n: "Oak St 2", a: 1420, max: 2200 },
                                  { n: "Hillview", a: 980, max: 2200 },
                                ].map((u, i) => (
                                  <div key={u.n}>
                                    <div className="flex justify-between text-[8px] mb-0.5 px-0.5">
                                      <span
                                        className="font-bold truncate"
                                        style={{ color: "rgba(250,250,250,0.85)" }}
                                      >
                                        {u.n}
                                      </span>
                                      <span className="font-black tabular-nums text-white">
                                        ${(u.a / 1000).toFixed(1)}k
                                      </span>
                                    </div>
                                    <div
                                      className="h-1 rounded-full overflow-hidden"
                                      style={{ background: "rgba(0,0,0,0.55)" }}
                                    >
                                      <motion.div
                                        className="h-full rounded-full"
                                        style={{
                                          background:
                                            "linear-gradient(90deg, rgba(250,250,250,0.55), #FAFAFA)",
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{
                                          width: `${(u.a / u.max) * 100}%`,
                                        }}
                                        transition={{
                                          delay: 0.1 + i * 0.06,
                                          duration: 0.5,
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div
                              className="rounded-xl p-1.5 flex flex-col gap-0.5"
                              style={{
                                border: `1px solid rgba(245,158,11,0.28)`,
                                background:
                                  "linear-gradient(145deg, rgba(245,158,11,0.1) 0%, #121215 70%)",
                              }}
                            >
                              <div
                                className="flex items-center gap-1"
                                style={{ color: B.warn }}
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span className="text-[7px] font-black uppercase">
                                  Insight
                                </span>
                              </div>
                              <p className="text-[9px] font-bold text-white leading-snug">
                                Lease renewal in{" "}
                                <span style={{ color: B.warn }}>47 days</span>
                                {" · "}$3.7k deposit held
                              </p>
                              <span
                                className="text-[8px] font-black"
                                style={{ color: B.warn }}
                              >
                                Review pack →
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {active.id === "life" &&
                    [
                      { n: "Primary salary", t: "Income", a: "+$5,200", ic: Wallet, ok: true },
                      { n: "Freelance weekends", t: "Side hustle", a: "+$800", ic: Zap, ok: true },
                      { n: "Summer trip fund", t: "Travel 28%", a: "$850/$3k", ic: Plane, ok: false },
                      {
                        n: "Deep clean kitchen",
                        t: "Chore · You",
                        a: "Open",
                        ic: ListChecks,
                        ok: false,
                      },
                    ].map((r, i) => {
                      const Ic = r.ic;
                      return (
                        <motion.div
                          key={r.n}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#121215] px-2.5 py-1.5 flex-1 min-h-0"
                        >
                          <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
                            <Ic className="w-3.5 h-3.5 text-white/70" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-white truncate">{r.n}</p>
                            <p className="text-[9px] text-[#6B7280]">{r.t}</p>
                          </div>
                          <span
                            className={`text-[10px] font-black tabular-nums shrink-0 ${
                              r.ok ? "text-white" : "text-[#F59E0B]"
                            }`}
                          >
                            {r.a}
                          </span>
                        </motion.div>
                      );
                    })}

                  {active.id === "homes" &&
                    [
                      { n: "Riverside Apt 4B", m: "Occupied · $1,850/mo", s: "Live", p: 92 },
                      { n: "Oak Street Unit 2", m: "Listed · deposit held", s: "List", p: 64 },
                      { n: "Hillview Studio", m: "Full history kept", s: "Archive", p: 100 },
                    ].map((r, i) => (
                      <motion.div
                        key={r.n}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#121215] px-2.5 py-2 flex-1"
                      >
                        <Building2 className="w-4 h-4 text-white/45 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-bold text-white truncate">{r.n}</p>
                            <span className="text-[9px] font-black uppercase tracking-wide text-white/70 border border-white/12 rounded-md px-1.5 py-0.5 shrink-0">
                              {r.s}
                            </span>
                          </div>
                          <p className="text-[9px] text-[#6B7280] mt-0.5">{r.m}</p>
                          <div className="mt-1.5 h-1 rounded-full bg-black/60 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-white/70"
                              initial={{ width: 0 }}
                              animate={{ width: `${r.p}%` }}
                              transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}

                  {active.id === "leases" && (
                    <>
                      {/* KPI row */}
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { v: "1", l: "Active", sub: "Riverside 4B", tone: B.up },
                          { v: "334d", l: "Remaining", sub: "Ends Mar 2027", tone: B.ink },
                          { v: "$3.7k", l: "Deposit", sub: "Held · refundable", tone: B.warn },
                          { v: "5%", l: "Escalation", sub: "At renewal", tone: B.down },
                        ].map((k, i) => (
                          <motion.div
                            key={k.l}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="rounded-xl px-1.5 py-1.5 relative overflow-hidden"
                            style={{
                              border: `1px solid ${B.border}`,
                              background: B.raised,
                            }}
                          >
                            <span
                              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                              style={{
                                background: k.tone,
                                boxShadow: `0 0 8px ${k.tone}44`,
                              }}
                            />
                            <span
                              className="text-[12px] font-black tabular-nums block leading-none pl-1.5"
                              style={{ color: k.tone }}
                            >
                              {k.v}
                            </span>
                            <span
                              className="text-[7px] font-bold uppercase tracking-wide block mt-0.5 pl-1.5 truncate"
                              style={{ color: B.muted }}
                            >
                              {k.l}
                            </span>
                            <span
                              className="text-[7px] font-semibold block pl-1.5 truncate"
                              style={{ color: B.dim }}
                            >
                              {k.sub}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Active lease card */}
                      <div
                        className="rounded-xl p-2.5 flex-1 min-h-0 flex flex-col relative overflow-hidden"
                        style={{
                          border: `1px solid ${B.border}`,
                          background: B.raised,
                        }}
                      >
                        <div
                          className="absolute inset-0 pointer-events-none opacity-50"
                          style={{
                            background:
                              "linear-gradient(120deg, rgba(255,255,255,0.04) 0%, transparent 45%, rgba(245,158,11,0.05) 100%)",
                          }}
                        />
                        <div className="relative flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className="text-[8px] font-black uppercase tracking-wide"
                                style={{ color: B.muted }}
                              >
                                Active lease
                              </span>
                              <span
                                className="text-[7px] font-bold px-1.5 py-0.5 rounded-md"
                                style={{
                                  color: B.up,
                                  background: "rgba(52,211,153,0.1)",
                                  border: "1px solid rgba(52,211,153,0.22)",
                                }}
                              >
                                Dual-signed
                              </span>
                            </div>
                            <p className="text-[13px] font-black text-white tracking-tight leading-tight">
                              Riverside Apt 4B
                            </p>
                            <p
                              className="text-[9px] font-semibold mt-0.5"
                              style={{ color: B.muted }}
                            >
                              Tenant · A. Sharma · $1,850/mo
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className="text-[15px] font-black tabular-nums leading-none"
                              style={{ color: B.warn }}
                            >
                              11
                              <span className="text-[9px] font-bold ml-0.5">mo</span>
                            </p>
                            <p
                              className="text-[7px] font-bold uppercase mt-0.5"
                              style={{ color: B.dim }}
                            >
                              Until end
                            </p>
                          </div>
                        </div>

                        {/* Timeline progress */}
                        <div className="relative mt-1 mb-1.5">
                          <div className="flex justify-between text-[7px] font-bold mb-1" style={{ color: B.dim }}>
                            <span>Start Apr 2025</span>
                            <span style={{ color: B.warn }}>62% elapsed</span>
                            <span>End Mar 2027</span>
                          </div>
                          <div
                            className="h-2 rounded-full overflow-hidden relative"
                            style={{
                              background: "rgba(0,0,0,0.55)",
                              border: `1px solid ${B.border}`,
                            }}
                          >
                            <motion.div
                              className="h-full rounded-full relative"
                              style={{
                                background:
                                  "linear-gradient(90deg, rgba(250,250,250,0.55), #FAFAFA 70%, rgba(245,158,11,0.85))",
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: "62%" }}
                              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-[8px] font-black tabular-nums">
                            <span style={{ color: B.muted }}>Day 1</span>
                            <span style={{ color: B.warn }}>Day 412 / 730</span>
                            <span className="text-white">Day 730</span>
                          </div>
                        </div>

                        {/* Metric tiles */}
                        <div className="relative grid grid-cols-3 gap-1.5 mt-auto">
                          {[
                            { l: "Deposit held", v: "$3,700", s: "Refundable", tone: B.warn },
                            { l: "Renewal rate", v: "+5%", s: "If extended", tone: B.down },
                            { l: "Next action", v: "47d", s: "Prep pack", tone: B.up },
                          ].map((m, i) => (
                            <motion.div
                              key={m.l}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 + i * 0.05 }}
                              className="rounded-lg px-2 py-1.5"
                              style={{
                                background: "rgba(0,0,0,0.35)",
                                border: `1px solid ${B.border}`,
                              }}
                            >
                              <p
                                className="text-[7px] font-bold uppercase tracking-wide truncate"
                                style={{ color: B.dim }}
                              >
                                {m.l}
                              </p>
                              <p
                                className="text-[12px] font-black tabular-nums leading-tight mt-0.5"
                                style={{ color: m.tone }}
                              >
                                {m.v}
                              </p>
                              <p
                                className="text-[7px] font-semibold truncate"
                                style={{ color: B.muted }}
                              >
                                {m.s}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Status chips */}
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { t: "Lock-in tracked", ok: true },
                          { t: "Clauses searchable", ok: true },
                          { t: "Signatures dual", ok: true },
                        ].map((x, i) => (
                          <motion.div
                            key={x.t}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 + i * 0.04 }}
                            className="rounded-xl px-2 py-1.5 text-[9px] font-bold flex items-center gap-1.5"
                            style={{
                              border: `1px solid ${B.border}`,
                              background: B.raised,
                              color: B.ink,
                            }}
                          >
                            <CheckCircle2
                              className="w-3 h-3 shrink-0"
                              style={{ color: B.up }}
                            />
                            <span className="truncate">{x.t}</span>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}

                  {active.id === "money" && (
                    <>
                      {[
                        { n: "Monthly rent", a: "$1,850", s: "Paid", d: "Mar 1" },
                        { n: "Electricity", a: "$94", s: "Pending", d: "Due 4d" },
                        { n: "Internet", a: "$59", s: "Paid", d: "Mar 3" },
                      ].map((r, i) => (
                        <motion.div
                          key={r.n}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#121215] px-2.5 py-2 flex-1"
                        >
                          <div>
                            <p className="text-[11px] font-bold text-white">{r.n}</p>
                            <p className="text-[10px] text-[#6B7280] font-semibold tabular-nums">
                              {r.a} · {r.d}
                            </p>
                          </div>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                              r.s === "Paid"
                                ? "border-white/15 text-white/75"
                                : "border-[#F59E0B]/35 text-[#F59E0B]"
                            }`}
                          >
                            {r.s}
                          </span>
                        </motion.div>
                      ))}
                      <div className="rounded-lg bg-white text-black px-2.5 py-2 flex items-center justify-between">
                        <span className="text-[11px] font-black inline-flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5" /> CSV · Excel · PDF · Invoice
                        </span>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </>
                  )}

                  {active.id === "utils" &&
                    [
                      { n: "Electricity", m: "Due in 4 days · 312 kWh", a: "$94", w: 78 },
                      { n: "Water", m: "Meter synced", a: "$28", w: 40 },
                      { n: "Internet", m: "Auto-linked ledger", a: "$59", w: 100 },
                      { n: "Gas", m: "Seasonal avg", a: "$41", w: 55 },
                    ].map((r, i) => (
                      <motion.div
                        key={r.n}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#121215] px-2.5 py-1.5 flex-1"
                      >
                        <Droplet className="w-3.5 h-3.5 text-white/40 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-bold text-white">{r.n}</p>
                            <span className="text-[10px] font-black text-white tabular-nums">
                              {r.a}
                            </span>
                          </div>
                          <p className="text-[9px] text-[#6B7280]">{r.m}</p>
                          <div className="mt-1 h-0.5 rounded-full bg-black/50 overflow-hidden">
                            <motion.div
                              className="h-full bg-white/50"
                              initial={{ width: 0 }}
                              animate={{ width: `${r.w}%` }}
                              transition={{ duration: 0.5, delay: i * 0.05 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}

                  {active.id === "repair" && (
                    <>
                      {/* KPIs */}
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { v: "3", l: "Open", sub: "Needs action", tone: B.warn },
                          { v: "1", l: "In progress", sub: "Apex HVAC", tone: B.warn },
                          { v: "12", l: "Resolved", sub: "This quarter", tone: B.up },
                          { v: "$1.8k", l: "Spend MTD", sub: "Repairs + parts", tone: B.down },
                        ].map((k, i) => (
                          <motion.div
                            key={k.l}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="rounded-xl px-1.5 py-1.5 relative overflow-hidden"
                            style={{
                              border: `1px solid ${B.border}`,
                              background: B.raised,
                            }}
                          >
                            <span
                              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                              style={{
                                background: k.tone,
                                boxShadow: `0 0 8px ${k.tone}44`,
                              }}
                            />
                            <span
                              className="text-[12px] font-black tabular-nums block leading-none pl-1.5"
                              style={{ color: k.tone }}
                            >
                              {k.v}
                            </span>
                            <span
                              className="text-[7px] font-bold uppercase tracking-wide block mt-0.5 pl-1.5 truncate"
                              style={{ color: B.muted }}
                            >
                              {k.l}
                            </span>
                            <span
                              className="text-[7px] font-semibold block pl-1.5 truncate"
                              style={{ color: B.dim }}
                            >
                              {k.sub}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Ticket list */}
                      <div className="flex-1 flex flex-col gap-1 min-h-0">
                        {[
                          {
                            n: "AC not cooling",
                            s: "In progress",
                            v: "Apex HVAC",
                            c: "$0 so far",
                            p: "High",
                            tone: B.warn,
                            pct: 45,
                          },
                          {
                            n: "Kitchen leak",
                            s: "Resolved",
                            v: "Cost locked",
                            c: "$180",
                            p: "Med",
                            tone: B.up,
                            pct: 100,
                          },
                          {
                            n: "Door lock",
                            s: "Pending",
                            v: "Unassigned",
                            c: "Est. $90",
                            p: "High",
                            tone: B.down,
                            pct: 8,
                          },
                        ].map((r, i) => (
                          <motion.div
                            key={r.n}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.08 + i * 0.05 }}
                            className="flex items-center gap-2 rounded-xl px-2 py-1.5 flex-1 min-h-0"
                            style={{
                              border: `1px solid ${B.border}`,
                              background: B.raised,
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                border: `1px solid ${B.border}`,
                                background: "rgba(255,255,255,0.03)",
                              }}
                            >
                              <Wrench
                                className="w-3.5 h-3.5"
                                style={{ color: r.tone }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-bold text-white truncate">
                                  {r.n}
                                </p>
                                <span
                                  className="text-[8px] font-black uppercase shrink-0 px-1.5 py-0.5 rounded-md"
                                  style={{
                                    color: r.tone,
                                    background: `${r.tone}14`,
                                    border: `1px solid ${r.tone}33`,
                                  }}
                                >
                                  {r.s}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-0.5">
                                <p
                                  className="text-[9px] font-semibold truncate"
                                  style={{ color: B.muted }}
                                >
                                  {r.v} · {r.c}
                                </p>
                                <span
                                  className="text-[8px] font-bold tabular-nums shrink-0"
                                  style={{ color: B.dim }}
                                >
                                  {r.p}
                                </span>
                              </div>
                              <div
                                className="mt-1 h-0.5 rounded-full overflow-hidden"
                                style={{ background: "rgba(0,0,0,0.5)" }}
                              >
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ background: r.tone }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${r.pct}%` }}
                                  transition={{
                                    delay: 0.15 + i * 0.05,
                                    duration: 0.5,
                                  }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}

                  {active.id === "tax" && (
                    <>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { l: "Rent", v: "62%", n: "$22.2k" },
                          { l: "Utils", v: "18%", n: "$4.3k" },
                          { l: "Repairs", v: "12%", n: "$2.1k" },
                        ].map((c, i) => (
                          <motion.div
                            key={c.l}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-lg border border-white/[0.06] bg-[#121215] p-2.5 text-center"
                          >
                            <span className="text-base font-black text-white block leading-none">
                              {c.v}
                            </span>
                            <span className="text-[9px] font-bold text-[#6B7280] uppercase block mt-1">
                              {c.l}
                            </span>
                            <span className="text-[9px] font-semibold text-white/40 tabular-nums">
                              {c.n}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                      <div className="flex-1 rounded-lg border border-white/[0.06] bg-[#121215] p-3 flex flex-col justify-center">
                        <p className="text-[11px] font-bold text-white">Category spend YTD</p>
                        <p className="text-[10px] text-[#8E8E93] mt-1 font-medium">
                          Tax-ready aggregates · export CSV / Excel anytime
                        </p>
                        <div className="mt-3 flex gap-1 h-2">
                          {[62, 18, 12, 8].map((w, i) => (
                            <motion.div
                              key={i}
                              className="h-full rounded-full bg-white/75"
                              style={{ flex: w }}
                              initial={{ scaleX: 0, originX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ delay: 0.12 + i * 0.05, duration: 0.45 }}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {active.id === "vault" &&
                    [
                      { n: "Lease_2026.pdf", t: "Lease · OCR ready", s: "2.4 MB" },
                      { n: "Utility_July.pdf", t: "Utility · linked", s: "180 KB" },
                      { n: "Deposit_Receipt.pdf", t: "Receipt · vaulted", s: "96 KB" },
                      { n: "Trip_Budget.xlsx", t: "Budget · Home Life", s: "42 KB" },
                    ].map((d, i) => (
                      <motion.div
                        key={d.n}
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#121215] px-2.5 py-1.5 flex-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-white/45 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-white truncate">{d.n}</p>
                          <p className="text-[9px] text-[#6B7280]">{d.t}</p>
                        </div>
                        <span className="text-[9px] font-semibold text-white/35 tabular-nums">
                          {d.s}
                        </span>
                      </motion.div>
                    ))}

                  {active.id === "ask" && (
                    <>
                      <div className="rounded-lg border border-white/[0.06] bg-[#121215] px-3 py-2.5">
                        <p className="text-[9px] font-bold text-[#6B7280] uppercase mb-1">You ask</p>
                        <p className="text-[12px] font-bold text-white">
                          “What did I spend on utilities last year?”
                        </p>
                      </div>
                      <div className="flex-1 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2.5 flex flex-col">
                        <p className="text-[9px] font-black text-[#F59E0B] uppercase mb-1">
                          HomeOS · from your vault
                        </p>
                        <p className="text-[12px] text-white font-semibold leading-snug flex-1">
                          $4,280 across electricity, water, and internet — export as CSV or PDF.
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {["Taxes", "Savings", "Rent growth"].map((c) => (
                            <span
                              key={c}
                              className="text-[9px] font-bold text-[#8E8E93] border border-white/[0.08] rounded-md px-1.5 py-0.5"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {active.id === "log" &&
                    [
                      { t: "Payment settled", d: "Ledger · sealed", ic: CreditCard, ago: "2m" },
                      { t: "Chore completed", d: "Home Life · board", ic: ListChecks, ago: "18m" },
                      {
                        t: "Document uploaded",
                        d: "Vault · integrity",
                        ic: FolderOpen,
                        ago: "1h",
                      },
                      {
                        t: "Export generated",
                        d: "CSV · accountant pack",
                        ic: Download,
                        ago: "3h",
                      },
                    ].map((r, i) => {
                      const Ic = r.ic;
                      return (
                        <motion.div
                          key={r.t}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#121215] px-2.5 py-1.5 flex-1"
                        >
                          <Ic className="w-3.5 h-3.5 text-white/40 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-white">{r.t}</p>
                            <p className="text-[9px] text-[#6B7280]">{r.d}</p>
                          </div>
                          <span className="text-[9px] font-semibold text-white/30 tabular-nums flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {r.ago}
                          </span>
                        </motion.div>
                      );
                    })}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Caption */}
            <div
              className="mt-2 rounded-xl px-2.5 py-2 flex items-start gap-2"
              style={{
                border: `1px solid ${B.border}`,
                background: B.raised,
              }}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: B.muted }} />
              <div className="min-w-0 flex-1">
                <p
                  className="text-[8px] font-black uppercase tracking-[0.14em] mb-0.5"
                  style={{ color: B.dim }}
                >
                  Report note
                </p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={active.why}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[11px] font-semibold leading-snug text-white/90"
                  >
                    {active.why}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1 mt-2 h-3">
              {SCENES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(i)}
                  className={`h-1 rounded-full transition-all cursor-pointer ${
                    i === scene
                      ? "w-5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.35)]"
                      : "w-1 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={s.badge}
                />
              ))}
            </div>

            {onCta && (
              <motion.button
                type="button"
                onClick={onCta}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                className="mkt-btn-primary mt-2.5 w-full h-11 text-[12px] font-black cursor-pointer shadow-[0_0_32px_rgba(255,255,255,0.12)]"
              >
                Get started free
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

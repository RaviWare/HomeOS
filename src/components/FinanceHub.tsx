import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Transaction } from "../types";
import {
  FinanceEntry,
  RecurringRule,
  Goal,
  FinanceFlow,
  GoalKind,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  deriveMonthlyCashflow,
  savingsRate,
  dueRecurring,
  recurringToEntry,
  goalProgress,
  newFinanceId,
  loadEntries,
  saveEntries,
  loadRules,
  saveRules,
  loadGoals,
  saveGoals,
} from "../finance";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  Plus,
  Trash2,
  Repeat,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Minus,
  ArrowRight,
  Landmark,
  Gauge,
  Compass,
  Zap,
} from "lucide-react";

interface Props {
  role: string;
  transactions: Transaction[];
}

const GOAL_KINDS: GoalKind[] = ["Land", "Flat", "House", "Car", "Renovation", "Other"];

const panel =
  "bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl min-w-0";

/** In-sync finance palette (matches Command Deck portfolio language) */
const C = {
  up: "#34D399",
  upMuted: "rgba(52, 211, 153, 0.12)",
  upBorder: "rgba(52, 211, 153, 0.28)",
  down: "#FB7185",
  downMuted: "rgba(251, 113, 133, 0.12)",
  downBorder: "rgba(251, 113, 133, 0.28)",
  warn: "#FBBF24",
  warnMuted: "rgba(251, 191, 36, 0.12)",
  warnBorder: "rgba(251, 191, 36, 0.28)",
  flat: "#A1A1AA",
  ink: "#FAFAFA",
  dim: "#71717A",
  surface: "#121215",
  line: "#1F1F23",
} as const;

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => (n < 10 ? "0" + n : "" + n);
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

const inr = (n: number) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

function pctDelta(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function fmtDelta(n: number) {
  const s = n > 0 ? "+" : "";
  return s + n.toFixed(0) + "%";
}

function goalColor(pct: number) {
  if (pct >= 70) return C.up;
  if (pct >= 40) return C.ink;
  if (pct >= 20) return C.warn;
  return C.down;
}

function TrendChip({
  value,
  invert,
  label,
}: {
  value: number;
  /** When true, positive change is bad (e.g. expenses up) */
  invert?: boolean;
  label?: string;
}) {
  const good = invert ? value < -0.5 : value > 0.5;
  const bad = invert ? value > 0.5 : value < -0.5;
  const color = good ? C.up : bad ? C.down : C.flat;
  const bg = good ? C.upMuted : bad ? C.downMuted : "rgba(161,161,170,0.1)";
  const border = good ? C.upBorder : bad ? C.downBorder : "rgba(161,161,170,0.22)";
  const Icon = value > 0.5 ? TrendingUp : value < -0.5 ? TrendingDown : Minus;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border tabular-nums"
      style={{ color, background: bg, borderColor: border }}
    >
      <Icon className="w-3 h-3" strokeWidth={2.5} />
      {label ?? fmtDelta(value)}
    </span>
  );
}

export default function FinanceHub({ role, transactions }: Props) {
  const [entries, setEntries] = useState<FinanceEntry[]>(() => loadEntries());
  const [rules, setRules] = useState<RecurringRule[]>(() => loadRules());
  const [goals, setGoals] = useState<Goal[]>(() => loadGoals());
  const putEntries = (v: FinanceEntry[]) => {
    setEntries(v);
    saveEntries(v);
  };
  const putRules = (v: RecurringRule[]) => {
    setRules(v);
    saveRules(v);
  };
  const putGoals = (v: Goal[]) => {
    setGoals(v);
    saveGoals(v);
  };

  const cashflow = useMemo(
    () => deriveMonthlyCashflow(entries, transactions, role, { months: 8 }),
    [entries, transactions, role]
  );
  const current = cashflow[cashflow.length - 1] || {
    monthKey: "",
    label: "",
    inflow: 0,
    outflow: 0,
    net: 0,
  };
  const prev = cashflow[cashflow.length - 2] || current;
  const rate = savingsRate(current);
  const prevRate = savingsRate(prev);
  const due = useMemo(
    () => dueRecurring(rules, entries, current.monthKey),
    [rules, entries, current.monthKey]
  );

  const maxFlow = Math.max(...cashflow.map((c) => Math.max(c.inflow, c.outflow)), 1);
  const maxAbsNet = Math.max(...cashflow.map((c) => Math.abs(c.net)), 1);

  const inflowDelta = pctDelta(current.inflow, prev.inflow);
  const outflowDelta = pctDelta(current.outflow, prev.outflow);
  const netDelta = pctDelta(current.net, prev.net);

  const insights = useMemo(() => {
    const avgNet =
      cashflow.reduce((a, c) => a + c.net, 0) / Math.max(1, cashflow.length);
    const avgIn =
      cashflow.reduce((a, c) => a + c.inflow, 0) / Math.max(1, cashflow.length);
    const avgOut =
      cashflow.reduce((a, c) => a + c.outflow, 0) / Math.max(1, cashflow.length);
    const annualPotential = Math.max(0, avgNet) * 12;
    const idealRate = 20;
    const gapToIdeal =
      current.inflow > 0
        ? Math.max(0, (idealRate / 100) * current.inflow - current.net)
        : 0;

    // Category mix from personal entries (current month-ish last 90 days style: all entries)
    const catMap: Record<string, number> = {};
    entries
      .filter((e) => e.flow === "out")
      .forEach((e) => {
        catMap[e.category] = (catMap[e.category] || 0) + e.amount;
      });
    // Include ledger txs in spend mix (aligned with finance.ts flowOfRentalTx)
    transactions.forEach((tx) => {
      const owner = role !== "Tenant";
      let out = true;
      if (tx.category === "Rent" || tx.category === "Deposit") out = !owner;
      else if (tx.category === "Refund") out = owner;
      if (out) {
        const k = tx.category || "Other";
        catMap[k] = (catMap[k] || 0) + tx.amount;
      }
    });
    const catList = Object.entries(catMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
    const catTotal = catList.reduce((a, x) => a + x.amount, 0) || 1;
    const topCat = catList[0];

    const totalGoalTarget = goals.reduce((a, g) => a + g.targetAmount, 0);
    const totalGoalSaved = goals.reduce((a, g) => a + g.savedAmount, 0);
    const goalsPct =
      totalGoalTarget > 0
        ? Math.min(100, Math.round((totalGoalSaved / totalGoalTarget) * 100))
        : 0;
    const monthsToGoals =
      avgNet > 0 && totalGoalTarget > totalGoalSaved
        ? Math.ceil((totalGoalTarget - totalGoalSaved) / avgNet)
        : 0;

    // Scope: what monthly surplus unlocks
    const scopes = [
      {
        title: "Comfort buffer",
        desc: "3 months of expenses as emergency fund",
        amount: avgOut * 3,
        feasible: avgNet > 0 ? Math.ceil((avgOut * 3) / avgNet) : null,
      },
      {
        title: "Annual surplus",
        desc: "If this pace continues for 12 months",
        amount: annualPotential,
        feasible: null as number | null,
      },
      {
        title: "Dream runway",
        desc:
          goals.length > 0
            ? `Months to fund all goals at current net`
            : "Add goals to project runway",
        amount: totalGoalTarget - totalGoalSaved,
        feasible: monthsToGoals || null,
      },
    ];

    const headline =
      due.length > 0
        ? `${due.length} recurring item${due.length > 1 ? "s" : ""} due this month — log them to keep cashflow accurate`
        : rate < 0
          ? "You're spending more than you earn this month — tighten the top expense category"
          : rate < 10
            ? "Savings rate is thin — even 5% more kept compounds hard"
            : rate >= 20
              ? "Strong savings rate — you're in the healthy zone (≥20%)"
              : "Solid month — room to push savings toward the 20% benchmark";

    const tone: "up" | "down" | "flat" =
      rate < 0 || due.length > 3 ? "down" : rate >= 20 ? "up" : "flat";

    // Cut top category 10% potential
    const trim10 = topCat ? topCat.amount * 0.1 : 0;

    return {
      avgNet,
      avgIn,
      avgOut,
      annualPotential,
      gapToIdeal,
      catList,
      catTotal,
      topCat,
      totalGoalTarget,
      totalGoalSaved,
      goalsPct,
      monthsToGoals,
      scopes,
      headline,
      tone,
      trim10,
      idealRate,
    };
  }, [cashflow, entries, transactions, role, goals, due.length, rate, current.inflow, current.net]);

  // SVG cashflow area (net line)
  const chartW = 640;
  const chartH = 160;
  const netPts = cashflow.map((c, i) => {
    const x = (i / Math.max(1, cashflow.length - 1)) * (chartW - 32) + 16;
    // map net from -maxAbsNet..maxAbsNet to chart
    const mid = chartH / 2;
    const y = mid - (c.net / maxAbsNet) * (chartH * 0.38);
    return { x, y, ...c };
  });
  const netLine = netPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const [eFlow, setEFlow] = useState<FinanceFlow>("out");
  const [eCat, setECat] = useState("Food");
  const [eAmt, setEAmt] = useState("");
  const [eDate, setEDate] = useState(todayISO());
  const [eNote, setENote] = useState("");
  const cats = eFlow === "in" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const setFlow = (f: FinanceFlow) => {
    setEFlow(f);
    setECat(f === "in" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };
  const addEntry = () => {
    const amt = parseFloat(eAmt);
    if (!amt || amt <= 0) return;
    putEntries([
      {
        id: newFinanceId("fe"),
        date: eDate || todayISO(),
        flow: eFlow,
        category: eCat,
        amount: amt,
        note: eNote,
      },
      ...entries,
    ]);
    setEAmt("");
    setENote("");
  };
  const delEntry = (id: string) => putEntries(entries.filter((x) => x.id !== id));
  const logRule = (r: RecurringRule) =>
    putEntries([recurringToEntry(r, current.monthKey), ...entries]);
  const logAllDue = () => {
    if (due.length)
      putEntries(due.map((r) => recurringToEntry(r, current.monthKey)).concat(entries));
  };

  const [rName, setRName] = useState("");
  const [rFlow, setRFlow] = useState<FinanceFlow>("out");
  const [rCat, setRCat] = useState("Utilities");
  const [rAmt, setRAmt] = useState("");
  const [rDay, setRDay] = useState("5");
  const rCats = rFlow === "in" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const setRFlowCat = (f: FinanceFlow) => {
    setRFlow(f);
    setRCat(f === "in" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };
  const addRule = () => {
    const amt = parseFloat(rAmt);
    if (!rName.trim() || !amt || amt <= 0) return;
    putRules([
      {
        id: newFinanceId("rr"),
        name: rName.trim(),
        flow: rFlow,
        category: rCat,
        amount: amt,
        dayOfMonth: parseInt(rDay, 10) || 1,
        active: true,
      },
      ...rules,
    ]);
    setRName("");
    setRAmt("");
  };
  const delRule = (id: string) => putRules(rules.filter((x) => x.id !== id));

  const [gName, setGName] = useState("");
  const [gKind, setGKind] = useState<GoalKind>("Land");
  const [gTarget, setGTarget] = useState("");
  const [gSaved, setGSaved] = useState("");
  const [gDate, setGDate] = useState("");
  const addGoal = () => {
    const tgt = parseFloat(gTarget);
    if (!gName.trim() || !tgt || tgt <= 0) return;
    putGoals([
      {
        id: newFinanceId("goal"),
        name: gName.trim(),
        kind: gKind,
        targetAmount: tgt,
        savedAmount: parseFloat(gSaved) || 0,
        targetDate: gDate || "",
        note: "",
      },
      ...goals,
    ]);
    setGName("");
    setGTarget("");
    setGSaved("");
    setGDate("");
  };
  const addSaved = (g: Goal) => {
    const s = window.prompt("Add how much to " + g.name + "?");
    const a = parseFloat(s || "");
    if (a && a > 0)
      putGoals(
        goals.map((x) =>
          x.id === g.id ? { ...x, savedAmount: x.savedAmount + a } : x
        )
      );
  };
  const delGoal = (id: string) => putGoals(goals.filter((x) => x.id !== id));

  const inputCls =
    "bg-[#111114] border border-[#1F1F23] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-[#55555F] focus:outline-none focus:border-white/25 transition-colors";
  const btnPrimary =
    "inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-[#F0F0F0] cursor-pointer transition-colors";
  const btnGhost =
    "inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1F1F23] bg-[#121215] text-white text-[13px] font-bold hover:border-white/20 cursor-pointer transition-colors";

  return (
    <div className="flex-1 w-full min-h-0 overflow-y-auto safe-bottom">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 py-3 sm:py-5 pb-28 sm:pb-10 flex flex-col gap-4 page-stagger">
        {/* Header */}
        <header className={`${panel} px-4 py-4 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-emerald-500/[0.04] pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                Money hub
                <span className="text-white/20 mx-1.5">·</span>
                <span className="normal-case tracking-normal font-semibold text-white/35">
                  {role}
                </span>
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Finances
              </h1>
              <p className="text-[12px] text-[#8E8E93] font-medium mt-1 max-w-xl leading-snug">
                Income, spend, savings rate, and dream goals — on-device. Rental ledger{" "}
                {role === "Tenant" ? "counts as expense" : "counts as income"}.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border"
                style={{
                  color:
                    insights.tone === "up"
                      ? C.up
                      : insights.tone === "down"
                        ? C.down
                        : C.flat,
                  background:
                    insights.tone === "up"
                      ? C.upMuted
                      : insights.tone === "down"
                        ? C.downMuted
                        : "rgba(161,161,170,0.1)",
                  borderColor:
                    insights.tone === "up"
                      ? C.upBorder
                      : insights.tone === "down"
                        ? C.downBorder
                        : "rgba(161,161,170,0.22)",
                }}
              >
                {insights.tone === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : insights.tone === "down" ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {current.label || "This month"}
              </span>
              <div className="hidden sm:flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide text-[#71717A]">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.up }} />
                  Healthy
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.warn }} />
                  Watch
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.down }} />
                  Risk
                </span>
              </div>
            </div>
          </div>
          <p
            className="relative mt-3 text-[12px] font-medium leading-snug flex items-start gap-2"
            style={{
              color:
                insights.tone === "up"
                  ? C.up
                  : insights.tone === "down"
                    ? C.down
                    : "#A1A1AA",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-80" />
            {insights.headline}
          </p>
        </header>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            {
              label: "Income",
              value: inr(current.inflow),
              delta: inflowDelta,
              invert: false,
              icon: TrendingUp,
              sub: "vs last month",
            },
            {
              label: "Expenses",
              value: inr(current.outflow),
              delta: outflowDelta,
              invert: true,
              icon: TrendingDown,
              sub: "vs last month",
            },
            {
              label: "Net",
              value: inr(current.net),
              delta: netDelta,
              invert: false,
              icon: Wallet,
              sub: "income − spend",
              valueColor: current.net >= 0 ? C.up : C.down,
            },
            {
              label: "Savings rate",
              value: `${rate}%`,
              delta: rate - prevRate,
              invert: false,
              icon: PiggyBank,
              sub: rate >= 20 ? "At or above 20% target" : `Target ${insights.idealRate}%`,
              valueColor: rate >= 20 ? C.up : rate >= 0 ? C.ink : C.down,
            },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className={`${panel} p-3.5 flex flex-col justify-between min-h-[100px]`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#71717A] flex items-center gap-1">
                    <Icon className="w-3 h-3 opacity-60" />
                    {k.label}
                  </span>
                  <TrendChip value={k.delta} invert={k.invert} />
                </div>
                <div>
                  <p
                    className="text-xl font-black tracking-tight tabular-nums"
                    style={{ color: k.valueColor || C.ink }}
                  >
                    {k.value}
                  </p>
                  <p className="text-[10px] text-[#71717A] font-medium mt-0.5">{k.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-12 gap-3">
          {/* Cashflow bars + net line */}
          <div className={`${panel} p-4 lg:col-span-7`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                  8-month pulse
                </p>
                <h2 className="text-sm font-black text-white mt-0.5">Cash flow</h2>
              </div>
              <div className="flex items-center gap-3 text-[9px] font-bold text-[#71717A]">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm" style={{ background: C.up }} />
                  In
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm" style={{ background: C.down }} />
                  Out
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-0.5 rounded" style={{ background: C.ink }} />
                  Net
                </span>
              </div>
            </div>

            {/* Dual bars */}
            <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-[140px] mb-1 px-0.5">
              {cashflow.map((c, i) => {
                const isCur = i === cashflow.length - 1;
                return (
                  <div
                    key={c.monthKey}
                    className="flex-1 flex flex-col items-center gap-1 min-w-0 h-full justify-end"
                  >
                    <div className="flex items-end gap-0.5 sm:gap-1 h-[110px] w-full justify-center">
                      <motion.div
                        className="w-[40%] max-w-[14px] rounded-t-md"
                        style={{ background: C.up, opacity: isCur ? 1 : 0.55 }}
                        initial={{ height: 0 }}
                        animate={{
                          height: Math.max((c.inflow / maxFlow) * 110, 3),
                        }}
                        transition={{ delay: i * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        title={`In ${inr(c.inflow)}`}
                      />
                      <motion.div
                        className="w-[40%] max-w-[14px] rounded-t-md"
                        style={{ background: C.down, opacity: isCur ? 1 : 0.55 }}
                        initial={{ height: 0 }}
                        animate={{
                          height: Math.max((c.outflow / maxFlow) * 110, 3),
                        }}
                        transition={{
                          delay: 0.05 + i * 0.04,
                          duration: 0.45,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        title={`Out ${inr(c.outflow)}`}
                      />
                    </div>
                    <span
                      className={`text-[9px] font-bold truncate w-full text-center ${
                        isCur ? "text-white" : "text-[#52525B]"
                      }`}
                    >
                      {c.label.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Net sparkline */}
            <div className="mt-3 pt-3 border-t border-[#1F1F23]">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A] mb-2">
                Net trajectory
              </p>
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full h-[100px]"
                preserveAspectRatio="none"
                role="img"
                aria-label="Net cashflow over months"
              >
                <defs>
                  <linearGradient id="finNetFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={current.net >= 0 ? C.up : C.down}
                      stopOpacity="0.22"
                    />
                    <stop offset="100%" stopColor="#0A0A0C" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line
                  x1="16"
                  x2={chartW - 16}
                  y1={chartH / 2}
                  y2={chartH / 2}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
                <path
                  d={`M ${netPts[0]?.x ?? 0},${chartH / 2} ${netPts
                    .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                    .join(" ")} L ${netPts[netPts.length - 1]?.x ?? 0},${chartH / 2} Z`}
                  fill="url(#finNetFill)"
                />
                <polyline
                  fill="none"
                  stroke={current.net >= 0 ? C.up : C.down}
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={netLine}
                />
                {netPts.map((p, i) => (
                  <circle
                    key={p.monthKey}
                    cx={p.x}
                    cy={p.y}
                    r={i === netPts.length - 1 ? 4 : 2.5}
                    fill={p.net >= 0 ? C.up : C.down}
                    opacity={i === netPts.length - 1 ? 1 : 0.5}
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* Category mix */}
          <div className={`${panel} p-4 lg:col-span-5`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                  Where it goes
                </p>
                <h2 className="text-sm font-black text-white mt-0.5">Spend mix</h2>
              </div>
              <span className="text-[10px] font-bold text-[#71717A] tabular-nums">
                {inr(insights.catTotal)}
              </span>
            </div>
            {insights.catList.length === 0 ? (
              <p className="text-[12px] text-[#71717A] font-medium py-10 text-center">
                Add expenses or log rent to see category mix.
              </p>
            ) : (
              <div className="space-y-2.5">
                {insights.catList.map((e, i) => {
                  const share = (e.amount / insights.catTotal) * 100;
                  const t = 1 - i / Math.max(1, insights.catList.length - 1);
                  const fill = `rgba(250,250,250,${(0.3 + t * 0.55).toFixed(2)})`;
                  return (
                    <div key={e.category}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: fill }}
                          />
                          <span className="text-[11px] font-bold text-white truncate">
                            {e.category}
                          </span>
                          {i === 0 && (
                            <span
                              className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded border"
                              style={{
                                color: C.warn,
                                background: C.warnMuted,
                                borderColor: C.warnBorder,
                              }}
                            >
                              Top
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold text-[#71717A] tabular-nums">
                            {share.toFixed(0)}%
                          </span>
                          <span className="text-[11px] font-black text-white tabular-nums w-[70px] text-right">
                            {inr(e.amount)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(4, share)}%`,
                            background: fill,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Insights · potential · scope */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className={`${panel} p-4 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" style={{ color: C.up }} />
              <h3 className="text-sm font-black text-white">Potential</h3>
            </div>
            <p className="text-[22px] font-black tabular-nums" style={{ color: C.up }}>
              {inr(insights.annualPotential)}
            </p>
            <p className="text-[11px] text-[#8E8E93] font-medium mt-1 leading-snug">
              Projected annual surplus at your average monthly net
            </p>
            {insights.trim10 > 0 && (
              <p className="text-[11px] font-medium mt-3 leading-snug text-[#A1A1AA]">
                Trim 10% from{" "}
                <span className="text-white font-bold">{insights.topCat?.category}</span> →
                free up ~{inr(insights.trim10)} (one-time from logged mix)
              </p>
            )}
            {insights.gapToIdeal > 0 && (
              <p className="text-[11px] font-medium mt-2 leading-snug" style={{ color: C.warn }}>
                {inr(insights.gapToIdeal)} more kept this month hits the 20% savings benchmark
              </p>
            )}
          </div>

          <div className={`${panel} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-white/50" />
              <h3 className="text-sm font-black text-white">Scope</h3>
            </div>
            <div className="space-y-3">
              {insights.scopes.map((s) => (
                <div key={s.title} className="border-t border-[#1F1F23] first:border-0 first:pt-0 pt-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-white">{s.title}</p>
                      <p className="text-[10px] text-[#71717A] font-medium mt-0.5 leading-snug">
                        {s.desc}
                      </p>
                    </div>
                    <p className="text-[12px] font-black text-white tabular-nums shrink-0">
                      {s.amount > 0 ? inr(s.amount) : "—"}
                    </p>
                  </div>
                  {s.feasible != null && s.feasible > 0 && (
                    <p className="text-[10px] font-bold mt-1" style={{ color: C.flat }}>
                      ~{s.feasible} mo at current net
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={`${panel} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-white/50" />
              <h3 className="text-sm font-black text-white">Health check</h3>
            </div>
            <div className="space-y-2.5">
              {[
                {
                  label: "Savings rate",
                  ok: rate >= 20,
                  warn: rate >= 0 && rate < 20,
                  text:
                    rate >= 20
                      ? `${rate}% — healthy`
                      : rate >= 0
                        ? `${rate}% — build toward 20%`
                        : `${rate}% — spending above income`,
                },
                {
                  label: "Recurring due",
                  ok: due.length === 0,
                  warn: due.length > 0 && due.length <= 2,
                  text:
                    due.length === 0
                      ? "All fixed costs logged"
                      : `${due.length} still due this month`,
                },
                {
                  label: "Goals funded",
                  ok: insights.goalsPct >= 40,
                  warn: insights.goalsPct > 0 && insights.goalsPct < 40,
                  text:
                    insights.totalGoalTarget > 0
                      ? `${insights.goalsPct}% of dream targets`
                      : "No goals yet — add one below",
                },
                {
                  label: "Avg monthly net",
                  ok: insights.avgNet > 0,
                  warn: insights.avgNet === 0,
                  text: inr(insights.avgNet),
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start gap-2.5 rounded-xl border border-[#1F1F23] bg-[#121215] p-2.5"
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1 shrink-0"
                    style={{
                      background: row.ok ? C.up : row.warn ? C.warn : C.down,
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#71717A]">
                      {row.label}
                    </p>
                    <p className="text-[12px] font-bold text-white mt-0.5">{row.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add entry */}
        <div className={`${panel} p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-4 h-4 text-white/50" />
            <h3 className="text-sm font-black text-white">Add income or expense</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl overflow-hidden border border-[#1F1F23] p-0.5 bg-[#0C0C0F]">
              <button
                type="button"
                onClick={() => setFlow("in")}
                className={`px-3 py-2 text-[12px] font-bold rounded-lg cursor-pointer transition-colors ${
                  eFlow === "in" ? "bg-white text-black" : "text-[#8E8E93] hover:text-white"
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setFlow("out")}
                className={`px-3 py-2 text-[12px] font-bold rounded-lg cursor-pointer transition-colors ${
                  eFlow === "out" ? "bg-white text-black" : "text-[#8E8E93] hover:text-white"
                }`}
              >
                Expense
              </button>
            </div>
            <select
              value={eCat}
              onChange={(e) => setECat(e.target.value)}
              className={`${inputCls} cursor-pointer`}
            >
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              value={eAmt}
              onChange={(e) => setEAmt(e.target.value)}
              type="number"
              placeholder="Amount"
              className={`${inputCls} w-28`}
            />
            <input
              value={eDate}
              onChange={(e) => setEDate(e.target.value)}
              type="date"
              className={inputCls}
            />
            <input
              value={eNote}
              onChange={(e) => setENote(e.target.value)}
              placeholder="Note (optional)"
              className={`${inputCls} flex-1 min-w-[120px]`}
            />
            <button type="button" onClick={addEntry} className={btnPrimary}>
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Recent + Recurring */}
        <div className="grid lg:grid-cols-2 gap-3">
          <div className={`${panel} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="w-4 h-4 text-white/50" />
              <h3 className="text-sm font-black text-white">Recent entries</h3>
            </div>
            {entries.length === 0 ? (
              <p className="text-[12px] text-[#71717A] font-medium">
                No entries yet. Add income/expense above or log a recurring rule.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto scrollbar-none">
                {entries.slice(0, 14).map((en) => (
                  <div
                    key={en.id}
                    className="flex items-center gap-2 rounded-xl border border-[#1F1F23] bg-[#121215] px-3 py-2.5"
                  >
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 border"
                      style={{
                        color: en.flow === "in" ? C.up : C.down,
                        background: en.flow === "in" ? C.upMuted : C.downMuted,
                        borderColor: en.flow === "in" ? C.upBorder : C.downBorder,
                      }}
                    >
                      {en.flow === "in" ? "IN" : "OUT"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-white truncate">
                        {en.category}
                        {en.note ? ` · ${en.note}` : ""}
                      </p>
                      <p className="text-[10px] text-[#71717A]">{en.date}</p>
                    </div>
                    <span
                      className="text-[12px] font-black tabular-nums shrink-0"
                      style={{ color: en.flow === "in" ? C.up : C.ink }}
                    >
                      {inr(en.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => delEntry(en.id)}
                      className="text-[#52525B] hover:text-[#FB7185] cursor-pointer shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${panel} p-4`}>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-white/50" />
                <h3 className="text-sm font-black text-white">Fixed monthly</h3>
              </div>
              {due.length > 0 && (
                <button
                  type="button"
                  onClick={logAllDue}
                  className="text-[11px] font-bold cursor-pointer"
                  style={{ color: C.warn }}
                >
                  Log all due ({due.length})
                </button>
              )}
            </div>

            {due.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {due.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
                    style={{ borderColor: C.warnBorder, background: C.warnMuted }}
                  >
                    <span
                      className="text-[9px] font-black shrink-0"
                      style={{ color: C.warn }}
                    >
                      DUE
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-[#71717A]">
                        {r.category} · day {r.dayOfMonth}
                      </p>
                    </div>
                    <span className="text-[12px] font-black text-white tabular-nums shrink-0">
                      {inr(r.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => logRule(r)}
                      className={`${btnPrimary} !py-1.5 !px-2.5 !text-[10px]`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Log
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-[#1F1F23] pt-3">
              <input
                value={rName}
                onChange={(e) => setRName(e.target.value)}
                placeholder="Name (Netflix, EMI…)"
                className={`${inputCls} flex-1 min-w-[120px]`}
              />
              <div className="flex rounded-xl overflow-hidden border border-[#1F1F23] p-0.5 bg-[#0C0C0F]">
                <button
                  type="button"
                  onClick={() => setRFlowCat("out")}
                  className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer ${
                    rFlow === "out" ? "bg-white text-black" : "text-[#8E8E93]"
                  }`}
                >
                  Out
                </button>
                <button
                  type="button"
                  onClick={() => setRFlowCat("in")}
                  className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer ${
                    rFlow === "in" ? "bg-white text-black" : "text-[#8E8E93]"
                  }`}
                >
                  In
                </button>
              </div>
              <select
                value={rCat}
                onChange={(e) => setRCat(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                {rCats.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                value={rAmt}
                onChange={(e) => setRAmt(e.target.value)}
                type="number"
                placeholder="Amt"
                className={`${inputCls} w-24`}
              />
              <input
                value={rDay}
                onChange={(e) => setRDay(e.target.value)}
                type="number"
                placeholder="Day"
                title="Day of month"
                className={`${inputCls} w-16`}
              />
              <button type="button" onClick={addRule} className={btnGhost}>
                <Plus className="w-4 h-4" />
                Rule
              </button>
            </div>

            {rules.length > 0 && (
              <div className="space-y-1.5 mt-3">
                {rules.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 rounded-xl border border-[#1F1F23] bg-[#121215] px-3 py-2"
                  >
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0"
                      style={{
                        color: r.flow === "in" ? C.up : C.down,
                        background: r.flow === "in" ? C.upMuted : C.downMuted,
                        borderColor: r.flow === "in" ? C.upBorder : C.downBorder,
                      }}
                    >
                      {r.flow === "in" ? "IN" : "OUT"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-[#71717A]">
                        {r.category} · day {r.dayOfMonth}
                      </p>
                    </div>
                    <span className="text-[12px] font-black text-white tabular-nums shrink-0">
                      {inr(r.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => delRule(r.id)}
                      className="text-[#52525B] hover:text-[#FB7185] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Goals */}
        <div className={`${panel} p-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-white/50" />
              <div>
                <h3 className="text-sm font-black text-white">Dream purchases & goals</h3>
                <p className="text-[11px] text-[#71717A] font-medium">
                  {insights.totalGoalTarget > 0
                    ? `${insights.goalsPct}% funded · ${inr(insights.totalGoalSaved)} of ${inr(insights.totalGoalTarget)}`
                    : "Land, flat, car — track progress with color health"}
                </p>
              </div>
            </div>
            {insights.monthsToGoals > 0 && (
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg border"
                style={{ color: C.flat, borderColor: "rgba(161,161,170,0.25)" }}
              >
                ~{insights.monthsToGoals} mo at current net
                <ArrowRight className="w-3 h-3 inline ml-1 opacity-50" />
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-[#1F1F23] pb-3 mb-3">
            <input
              value={gName}
              onChange={(e) => setGName(e.target.value)}
              placeholder="Goal (e.g. Plot in Mysuru)"
              className={`${inputCls} flex-1 min-w-[140px]`}
            />
            <select
              value={gKind}
              onChange={(e) => setGKind(e.target.value as GoalKind)}
              className={`${inputCls} cursor-pointer`}
            >
              {GOAL_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <input
              value={gTarget}
              onChange={(e) => setGTarget(e.target.value)}
              type="number"
              placeholder="Target"
              className={`${inputCls} w-28`}
            />
            <input
              value={gSaved}
              onChange={(e) => setGSaved(e.target.value)}
              type="number"
              placeholder="Saved"
              className={`${inputCls} w-24`}
            />
            <input
              value={gDate}
              onChange={(e) => setGDate(e.target.value)}
              type="month"
              title="Target date"
              className={inputCls}
            />
            <button type="button" onClick={addGoal} className={btnPrimary}>
              <Plus className="w-4 h-4" />
              Add goal
            </button>
          </div>

          {goals.length === 0 ? (
            <p className="text-[12px] text-[#71717A] font-medium py-4 text-center">
              No goals yet. Add land, a flat, or a car and watch runway update above.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {goals.map((g) => {
                const pr = goalProgress(g);
                const color = goalColor(pr.pct);
                return (
                  <div
                    key={g.id}
                    className="rounded-xl border border-[#1F1F23] bg-[#121215] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-black text-white truncate">{g.name}</p>
                        <p className="text-[10px] text-[#71717A] uppercase font-bold mt-0.5">
                          {g.kind}
                          {g.targetDate ? ` · by ${g.targetDate}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => delGoal(g.id)}
                        className="text-[#52525B] hover:text-[#FB7185] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3 mb-1.5">
                      <span className="text-[11px] text-[#8E8E93] tabular-nums font-medium">
                        {inr(g.savedAmount)} of {inr(g.targetAmount)}
                      </span>
                      <span className="text-[12px] font-black tabular-nums" style={{ color }}>
                        {pr.pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(2, pr.pct)}%`,
                          background: color,
                          boxShadow: `0 0 12px ${color}44`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3 gap-2">
                      <p className="text-[10px] text-[#71717A] font-medium leading-snug">
                        {pr.remaining > 0
                          ? `${inr(pr.remaining)} to go` +
                            (pr.monthsLeft > 0
                              ? ` · ${inr(pr.monthlyNeeded)}/mo × ${pr.monthsLeft} mo`
                              : "")
                          : "Goal reached ✨"}
                      </p>
                      <button type="button" onClick={() => addSaved(g)} className={btnGhost + " !py-1.5 !px-2.5 !text-[10px]"}>
                        <PiggyBank className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-[#52525B] font-medium">
          Fully on-device · Emerald = healthy · Amber = watch · Rose = risk
        </p>
      </div>
    </div>
  );
}

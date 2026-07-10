import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Sliders,
  Lightbulb,
  Award,
  Calendar,
  CalendarDays,
  CalendarRange,
  Landmark,
  PiggyBank,
  AlertTriangle,
  Sparkles,
  Minus,
  ArrowRight,
  Wallet,
  Target,
} from "lucide-react";
import { Transaction } from "../types";

interface ExpenseLabProps {
  transactions: Transaction[];
}

type Period = "day" | "week" | "month" | "year" | "fy";

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
} as const;

const panel = "bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl min-w-0";
const inr = (n: number) =>
  "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

const MN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** India financial year: Apr 1 → Mar 31 */
function fyOf(d: Date): { startY: number; endY: number; key: string; label: string } {
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-11
  const startY = m >= 3 ? y : y - 1;
  const endY = startY + 1;
  return {
    startY,
    endY,
    key: `FY${startY}-${String(endY).slice(2)}`,
    label: `FY ${startY}–${String(endY).slice(2)}`,
  };
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseTxDate(s: string): Date | null {
  if (!s || s.length < 10) return null;
  const d = new Date(s.slice(0, 10) + "T12:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function isExpenseTx(t: Transaction) {
  return t.category !== "Deposit" && t.category !== "Refund";
}

function isIncomeLike(t: Transaction) {
  // Refunds / owner-side rent treated lightly as inflows for lab context
  return t.category === "Refund";
}

const PERIODS: { id: Period; label: string; short: string; icon: typeof Calendar }[] = [
  { id: "day", label: "Daily", short: "Day", icon: Calendar },
  { id: "week", label: "Weekly", short: "Week", icon: CalendarDays },
  { id: "month", label: "Monthly", short: "Month", icon: CalendarRange },
  { id: "year", label: "Calendar year", short: "Year", icon: Landmark },
  { id: "fy", label: "Financial year", short: "FY", icon: Target },
];

const TIPS = [
  {
    t: "Track rent receipts monthly",
    d: "Keep digital rent proofs — HRA claims need landlord PAN when rent exceeds ₹1L/year.",
  },
  {
    t: "Separate EMI vs lifestyle",
    d: "EMIs are fixed; lifestyle is flexible. Cut lifestyle first when the budget is tight.",
  },
  {
    t: "80C & 80D checklist",
    d: "ELSS, PPF, life insurance (80C) and health insurance (80D) often beat last-minute tax panic.",
  },
  {
    t: "Forecast = average × days",
    d: "Your forecast here uses recent spend velocity — use it to pre-fund a buffer account.",
  },
  {
    t: "Financial year rhythm",
    d: "India FY ends 31 Mar. Review Q4 spend and tax documents before April.",
  },
  {
    t: "One top category rule",
    d: "If one category is >40% of spend (ex-rent), set a soft cap and review weekly.",
  },
];

export default function ExpenseLab({ transactions }: ExpenseLabProps) {
  const [period, setPeriod] = useState<Period>("month");
  const [budgetLimit, setBudgetLimit] = useState<number>(() => {
    const v = Number(localStorage.getItem("rv_budget"));
    return v && v > 0 ? v : 60000;
  });
  const [anchor, setAnchor] = useState(() => new Date().toISOString().slice(0, 10));

  const anchorDate = useMemo(() => {
    const d = parseTxDate(anchor) || new Date();
    return startOfDay(d);
  }, [anchor]);

  const range = useMemo(() => {
    const end = new Date(anchorDate);
    end.setHours(23, 59, 59, 999);
    let start = new Date(anchorDate);

    if (period === "day") {
      // start already start of day
    } else if (period === "week") {
      const day = start.getDay(); // 0 Sun
      const diff = day === 0 ? 6 : day - 1; // Mon-start week
      start.setDate(start.getDate() - diff);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      start = new Date(start.getFullYear(), start.getMonth(), 1);
      end.setTime(
        new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999).getTime()
      );
    } else if (period === "year") {
      start = new Date(start.getFullYear(), 0, 1);
      end.setTime(new Date(start.getFullYear(), 11, 31, 23, 59, 59, 999).getTime());
    } else {
      // FY Apr–Mar
      const fy = fyOf(anchorDate);
      start = new Date(fy.startY, 3, 1);
      end.setTime(new Date(fy.endY, 2, 31, 23, 59, 59, 999).getTime());
    }

    // Previous range (same length, immediately before)
    const ms = end.getTime() - start.getTime() + 1;
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - ms + 1);

    return { start, end, prevStart, prevEnd, ms };
  }, [anchorDate, period]);

  const inRange = (d: Date, a: Date, b: Date) =>
    d.getTime() >= a.getTime() && d.getTime() <= b.getTime();

  const { currentTx, prevTx, expenses, prevExpenses, income, catList, rentFY, maintFY } =
    useMemo(() => {
      const cur: Transaction[] = [];
      const prev: Transaction[] = [];
      transactions.forEach((t) => {
        const d = parseTxDate(t.date);
        if (!d) return;
        if (inRange(d, range.start, range.end)) cur.push(t);
        else if (inRange(d, range.prevStart, range.prevEnd)) prev.push(t);
      });

      const exp = cur.filter(isExpenseTx);
      const prevExp = prev.filter(isExpenseTx);
      const expenses = exp.reduce((s, t) => s + t.amount, 0);
      const prevExpenses = prevExp.reduce((s, t) => s + t.amount, 0);
      const income = cur.filter(isIncomeLike).reduce((s, t) => s + t.amount, 0);

      const map: Record<string, number> = {};
      exp.forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
      const catList = Object.entries(map)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      // Tax base always uses FY of anchor
      const fy = fyOf(anchorDate);
      const fyStart = new Date(fy.startY, 3, 1);
      const fyEnd = new Date(fy.endY, 2, 31, 23, 59, 59, 999);
      let rentFY = 0;
      let maintFY = 0;
      transactions.forEach((t) => {
        const d = parseTxDate(t.date);
        if (!d || !inRange(d, fyStart, fyEnd)) return;
        if (t.category === "Rent" && t.status === "Paid") rentFY += t.amount;
        if (t.category === "Maintenance" || t.category === "Repairs") maintFY += t.amount;
      });

      return {
        currentTx: cur,
        prevTx: prev,
        expenses,
        prevExpenses,
        income,
        catList,
        rentFY,
        maintFY,
      };
    }, [transactions, range, anchorDate]);

  const deltaPct =
    prevExpenses > 0
      ? ((expenses - prevExpenses) / prevExpenses) * 100
      : expenses > 0
        ? 100
        : 0;

  const daysInRange = Math.max(1, Math.round(range.ms / 86400000));
  const dailyAvg = expenses / daysInRange;

  // Forecast: next period of same length at current daily velocity
  const forecast = dailyAvg * daysInRange;
  // Runway style: months of current monthly budget remaining if burn continues
  const monthlyBurn =
    period === "month"
      ? expenses
      : period === "day"
        ? dailyAvg * 30
        : period === "week"
          ? dailyAvg * 30
          : expenses / Math.max(1, daysInRange / 30);

  const pctBudget =
    period === "month" && budgetLimit > 0 ? (expenses / budgetLimit) * 100 : null;

  // Simple tax estimate (illustrative, not advice)
  const hraEst = rentFY * 0.3;
  const maintEst = maintFY * 0.2;
  const estTaxSavings = hraEst + maintEst;
  const fyMeta = fyOf(anchorDate);

  const rangeLabel = (() => {
    const fmt = (d: Date) =>
      `${d.getDate()} ${MN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
    if (period === "day") return fmt(range.start);
    if (period === "fy") return fyMeta.label;
    if (period === "year") return String(range.start.getFullYear());
    if (period === "month")
      return `${MN[range.start.getMonth()]} ${range.start.getFullYear()}`;
    return `${fmt(range.start)} – ${fmt(range.end)}`;
  })();

  // Spark bars by sub-bucket for chart
  const series = useMemo(() => {
    const buckets: { key: string; label: string; amount: number }[] = [];
    if (period === "day") {
      // hourly not available — show single day + compare prev 6 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(anchorDate);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const amount = transactions
          .filter((t) => t.date.slice(0, 10) === key && isExpenseTx(t))
          .reduce((s, t) => s + t.amount, 0);
        buckets.push({
          key,
          label: `${d.getDate()}/${d.getMonth() + 1}`,
          amount,
        });
      }
    } else if (period === "week" || period === "month") {
      // daily within range
      const cursor = new Date(range.start);
      while (cursor <= range.end) {
        const key = cursor.toISOString().slice(0, 10);
        const amount = transactions
          .filter((t) => t.date.slice(0, 10) === key && isExpenseTx(t))
          .reduce((s, t) => s + t.amount, 0);
        buckets.push({
          key,
          label: String(cursor.getDate()),
          amount,
        });
        cursor.setDate(cursor.getDate() + 1);
        if (buckets.length > 31) break;
      }
    } else {
      // monthly within year/fy
      const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
      while (cursor <= range.end) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        const amount = transactions
          .filter((t) => t.date.slice(0, 7) === key && isExpenseTx(t))
          .reduce((s, t) => s + t.amount, 0);
        buckets.push({
          key,
          label: MN[cursor.getMonth()].slice(0, 3),
          amount,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }
    return buckets;
  }, [period, range, transactions, anchorDate]);

  const seriesMax = Math.max(...series.map((b) => b.amount), 1);
  const catTotal = catList.reduce((a, c) => a + c.amount, 0) || 1;

  const spendTrend: "up" | "down" | "flat" =
    deltaPct > 3 ? "up" : deltaPct < -3 ? "down" : "flat";
  // higher spend is usually "bad" for household
  const spendColor =
    spendTrend === "up" ? C.down : spendTrend === "down" ? C.up : C.flat;

  return (
    <div className="flex-1 w-full min-h-0 overflow-y-auto safe-bottom">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 py-3 sm:py-5 pb-28 sm:pb-10 flex flex-col gap-4 page-stagger">
        {/* Header */}
        <header className={`${panel} px-4 py-4`}>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                Money lab
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Expense & Tax
              </h1>
              <p className="text-[12px] text-[#8E8E93] font-medium mt-1 max-w-xl">
                Daily → weekly → monthly → calendar year → India financial year. Forecast,
                tax estimates, and practical tips — all on-device.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase text-[#71717A]">
                  Anchor date
                </span>
                <input
                  type="date"
                  value={anchor}
                  onChange={(e) => setAnchor(e.target.value)}
                  className="h-10 bg-[#111114] border border-[#1F1F23] rounded-xl px-3 text-[13px] text-white font-semibold"
                />
              </label>
            </div>
          </div>

          {/* Period switcher */}
          <div className="mt-4 flex flex-wrap gap-1.5 p-1 rounded-2xl bg-[#0C0C0F] border border-[#1F1F23]">
            {PERIODS.map((p) => {
              const Icon = p.icon;
              const on = period === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`flex-1 min-w-[72px] inline-flex items-center justify-center gap-1.5 h-10 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                    on ? "bg-white text-black" : "text-[#8E8E93] hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{p.label}</span>
                  <span className="sm:hidden">{p.short}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-[#71717A] font-medium">
            Showing <span className="text-white font-bold">{rangeLabel}</span>
            {period === "fy" ? " (Apr–Mar)" : ""}
          </p>
        </header>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            {
              label: "Spend",
              value: inr(expenses),
              sub: `vs prior ${fmtDelta(deltaPct)}`,
              color: spendColor,
            },
            {
              label: "Daily avg",
              value: inr(dailyAvg),
              sub: `${daysInRange} days in range`,
              color: C.ink,
            },
            {
              label: "Forecast (next)",
              value: inr(forecast),
              sub: "At current velocity",
              color: C.warn,
            },
            {
              label: "Inflows (refunds)",
              value: inr(income),
              sub: "In this period",
              color: income > 0 ? C.up : C.flat,
            },
          ].map((k) => (
            <div key={k.label} className={`${panel} p-3.5 min-h-[92px] flex flex-col justify-between`}>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                {k.label}
              </span>
              <div>
                <p
                  className="text-lg font-black tabular-nums tracking-tight"
                  style={{ color: k.color }}
                >
                  {k.value}
                </p>
                <p className="text-[10px] text-[#71717A] font-medium mt-0.5">{k.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + categories */}
        <div className="grid lg:grid-cols-12 gap-3">
          <div className={`${panel} p-4 lg:col-span-7`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                  Spend rhythm
                </p>
                <h2 className="text-sm font-black text-white mt-0.5">
                  {period === "year" || period === "fy" ? "By month" : "By day"}
                </h2>
              </div>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border tabular-nums"
                style={{
                  color: spendColor,
                  background:
                    spendTrend === "up"
                      ? C.downMuted
                      : spendTrend === "down"
                        ? C.upMuted
                        : "rgba(161,161,170,0.1)",
                  borderColor:
                    spendTrend === "up"
                      ? C.downBorder
                      : spendTrend === "down"
                        ? C.upBorder
                        : "rgba(161,161,170,0.22)",
                }}
              >
                {spendTrend === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : spendTrend === "down" ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {fmtDelta(deltaPct)}
              </span>
            </div>

            <div className="flex items-end gap-0.5 sm:gap-1 h-[140px]">
              {series.map((b, i) => (
                <div
                  key={b.key}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-0"
                  title={`${b.label}: ${inr(b.amount)}`}
                >
                  <motion.div
                    className="w-full max-w-[18px] mx-auto rounded-t-md"
                    style={{
                      background:
                        b.amount === seriesMax && b.amount > 0 ? C.warn : "rgba(250,250,250,0.55)",
                    }}
                    initial={{ height: 0 }}
                    animate={{
                      height: Math.max(3, (b.amount / seriesMax) * 120),
                    }}
                    transition={{ delay: i * 0.015, duration: 0.35 }}
                  />
                  {(period === "month" ? i % 3 === 0 : true) && (
                    <span className="text-[8px] font-bold text-[#52525B] truncate w-full text-center">
                      {b.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {series.every((b) => b.amount === 0) && (
              <p className="text-center text-[12px] text-[#71717A] mt-2">
                No spend in this window — pick another anchor or period.
              </p>
            )}
          </div>

          <div className={`${panel} p-4 lg:col-span-5`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
                  Mix
                </p>
                <h2 className="text-sm font-black text-white mt-0.5">By category</h2>
              </div>
              <span className="text-[10px] font-bold text-[#71717A]">{inr(catTotal)}</span>
            </div>
            {catList.length === 0 ? (
              <p className="text-[12px] text-[#71717A] py-8 text-center">
                No categories in range
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto scrollbar-none">
                {catList.slice(0, 8).map((c, i) => {
                  const share = (c.amount / catTotal) * 100;
                  const fill = `rgba(250,250,250,${(0.3 + (1 - i / 8) * 0.5).toFixed(2)})`;
                  return (
                    <div key={c.category}>
                      <div className="flex justify-between text-[11px] mb-1 gap-2">
                        <span className="font-bold text-white truncate">{c.category}</span>
                        <span className="text-[#71717A] tabular-nums shrink-0">
                          {share.toFixed(0)}% · {inr(c.amount)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(4, share)}%`, background: fill }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Budget (month) + Forecast panel */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className={`${panel} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-white/50" />
                <h3 className="text-sm font-black text-white">Monthly budget cap</h3>
              </div>
              <span className="text-[11px] font-bold text-[#71717A] tabular-nums">
                {inr(budgetLimit)}
              </span>
            </div>
            <input
              type="range"
              min={20000}
              max={200000}
              step={5000}
              value={budgetLimit}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setBudgetLimit(v);
                localStorage.setItem("rv_budget", String(v));
              }}
              className="w-full h-1.5 bg-[#1F1F23] rounded-lg appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-[9px] text-[#52525B] font-bold mt-1">
              <span>₹20k</span>
              <span>₹2L</span>
            </div>
            {pctBudget != null ? (
              <div className="mt-4">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#8E8E93] font-medium">This month vs cap</span>
                  <span
                    className="font-black tabular-nums"
                    style={{
                      color:
                        pctBudget > 90 ? C.down : pctBudget > 70 ? C.warn : C.up,
                    }}
                  >
                    {pctBudget.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-black/50 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, pctBudget)}%`,
                      background:
                        pctBudget > 90 ? C.down : pctBudget > 70 ? C.warn : C.up,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#71717A] mt-3 font-medium">
                Switch to <strong className="text-white">Monthly</strong> to compare spend
                against this cap. Est. monthly burn now ~{inr(monthlyBurn)}.
              </p>
            )}
          </div>

          <div className={`${panel} p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" style={{ color: C.warn }} />
              <h3 className="text-sm font-black text-white">Forecast & runway</h3>
            </div>
            <p className="text-[22px] font-black tabular-nums" style={{ color: C.warn }}>
              {inr(forecast)}
            </p>
            <p className="text-[11px] text-[#8E8E93] font-medium mt-1 leading-snug">
              Projected spend for the <em>next</em> {period === "fy" ? "financial year period" : period}{" "}
              if you keep today’s average of {inr(dailyAvg)}/day.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-2.5">
                <p className="text-[9px] font-bold uppercase text-[#71717A]">Prior period</p>
                <p className="text-sm font-black text-white tabular-nums">{inr(prevExpenses)}</p>
              </div>
              <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-2.5">
                <p className="text-[9px] font-bold uppercase text-[#71717A]">Tx count</p>
                <p className="text-sm font-black text-white tabular-nums">
                  {currentTx.filter(isExpenseTx).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tax — FY based */}
        <div className={`${panel} p-4 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4" style={{ color: C.up }} />
                <h3 className="text-sm font-black text-white">
                  Tax & HRA snapshot · {fyMeta.label}
                </h3>
              </div>
              <p className="text-[11px] text-[#71717A] font-medium mb-3 max-w-lg">
                Illustrative only — not tax advice. Uses rent paid and repairs logged in the
                India financial year (1 Apr – 31 Mar).
              </p>
              <div className="grid sm:grid-cols-3 gap-2">
                <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-3">
                  <p className="text-[9px] font-bold uppercase text-[#71717A]">Rent (paid)</p>
                  <p className="text-base font-black text-white tabular-nums mt-0.5">
                    {inr(rentFY)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-3">
                  <p className="text-[9px] font-bold uppercase text-[#71717A]">
                    Repairs / maint.
                  </p>
                  <p className="text-base font-black text-white tabular-nums mt-0.5">
                    {inr(maintFY)}
                  </p>
                </div>
                <div
                  className="rounded-xl border p-3"
                  style={{ borderColor: C.upBorder, background: C.upMuted }}
                >
                  <p className="text-[9px] font-bold uppercase text-[#71717A]">
                    Est. tax leverage
                  </p>
                  <p
                    className="text-base font-black tabular-nums mt-0.5"
                    style={{ color: C.up }}
                  >
                    {inr(estTaxSavings)}
                  </p>
                  <p className="text-[9px] text-[#71717A] mt-1">
                    ~30% of rent + ~20% of repairs (rough)
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:w-56 shrink-0 rounded-xl border border-[#1F1F23] bg-[#121215] p-3">
              <p className="text-[10px] font-bold text-white mb-2 flex items-center gap-1">
                <PiggyBank className="w-3.5 h-3.5" /> Tax hygiene
              </p>
              <ul className="space-y-1.5 text-[10px] text-[#8E8E93] font-medium leading-snug">
                <li>· Store rent receipts in Document Vault</li>
                <li>· Landlord PAN if rent &gt; ₹1L / year</li>
                <li>· Log repairs with invoices for claims</li>
                <li>· Review before 31 Mar every FY</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-0.5">
            <Lightbulb className="w-4 h-4 text-white/50" />
            <h3 className="text-xs font-black text-white">Tips & tricks</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {TIPS.map((tip) => (
              <div key={tip.t} className={`${panel} p-3.5`}>
                <p className="text-[12px] font-black text-white">{tip.t}</p>
                <p className="text-[11px] text-[#8E8E93] font-medium mt-1 leading-snug">
                  {tip.d}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className={`${panel} p-3 flex flex-wrap gap-2 items-center`}>
          <span className="text-[10px] font-bold uppercase text-[#71717A] mr-1">Also open</span>
          {(
            [
              { tab: "finances" as const, label: "Finances hub" },
              { tab: "payments" as const, label: "Ledger" },
              { tab: "documents" as const, label: "Document vault" },
            ]
          ).map((l) => (
            <a
              key={l.tab}
              href={`/app/${l.tab}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#1F1F23] text-[11px] font-bold text-[#A1A1AA] hover:text-white hover:border-white/20"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                const href = e.currentTarget.getAttribute("href") || `/app/${l.tab}`;
                if (window.location.pathname !== href) {
                  window.history.pushState(null, "", href);
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }
              }}
            >
              {l.label}
              <ArrowRight className="w-3 h-3" />
            </a>
          ))}
        </div>

        <p className="text-center text-[10px] text-[#52525B] font-medium">
          Higher spend = rose · lower spend = emerald · FY = Apr–Mar (India)
        </p>
      </div>
    </div>
  );
}

function fmtDelta(n: number) {
  const s = n > 0 ? "+" : "";
  return s + n.toFixed(0) + "%";
}

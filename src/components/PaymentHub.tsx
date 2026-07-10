import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CreditCard,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  QrCode,
  Trash2,
  TrendingUp,
  Receipt,
  Search,
  X,
  Plus,
  Download,
} from "lucide-react";
import { Transaction, Lease } from "../types";
import Pagination from "./Pagination";
import PaymentAutomation from "./PaymentAutomation";
import { downloadInvoicePdf, downloadCsv } from "../exportKit";
import {
  C,
  DatasetTable,
  PercentDistribution,
  ViewModeToggle,
  pct,
  type HubViewMode,
} from "./hub/ModuleAnalytics";
import { formatMoney, loadCurrencyPrefs } from "../currency";

interface PaymentHubProps {
  transactions: Transaction[];
  onSettlePayment: (id: string, method: "UPI" | "Credit Card" | "Bank Transfer") => void;
  onAddTransaction: (tx: Transaction) => void;
  leases: Lease[];
  onAddTransactions: (ts: Transaction[]) => void;
  onDeleteTransaction: (id: string) => void;
}

const panel = "bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl";
const money = (n: number) => formatMoney(n, loadCurrencyPrefs().displayCurrency);
const num = (n: number) => Number(n || 0).toLocaleString();

export default function PaymentHub({
  transactions,
  onSettlePayment,
  onAddTransaction,
  leases,
  onAddTransactions,
  onDeleteTransaction,
}: PaymentHubProps) {
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [hubView, setHubView] = useState<HubViewMode>("cards");
  const [selectedTxForPay, setSelectedTxForPay] = useState<Transaction | null>(null);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);
  const [payMethod, setPayMethod] = useState<"UPI" | "Credit Card" | "Bank Transfer">("UPI");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    propertyName: "",
    category: "Rent" as Transaction["category"],
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
  });

  // Deep-link: Command Deck guide → open add form
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("rv_payment_nav_intent");
      if (!raw) return;
      sessionStorage.removeItem("rv_payment_nav_intent");
      const intent = JSON.parse(raw) as { openAdd?: boolean };
      if (intent.openAdd) setShowAdd(true);
    } catch {
      /* ignore */
    }
  }, []);

  const filteredTx = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (filterCategory !== "All" && tx.category !== filterCategory) return false;
      if (filterStatus !== "All" && tx.status !== filterStatus) return false;
      if (!qq) return true;
      return (
        (tx.propertyName || "").toLowerCase().includes(qq) ||
        (tx.category || "").toLowerCase().includes(qq) ||
        (tx.invoiceNumber || "").toLowerCase().includes(qq) ||
        (tx.description || "").toLowerCase().includes(qq)
      );
    });
  }, [transactions, filterCategory, filterStatus, q]);

  const PAGE_SIZE = 12;
  const pageCount = Math.max(1, Math.ceil(filteredTx.length / PAGE_SIZE));
  const curPage = Math.min(Math.max(1, page), pageCount);
  const pageItems = filteredTx.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const lifetimePaid = transactions
    .filter((t) => t.status === "Paid")
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingSum = transactions
    .filter((t) => t.status !== "Paid")
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingCount = transactions.filter((t) => t.status !== "Paid").length;
  const overdueSum = transactions
    .filter((t) => t.status === "Overdue")
    .reduce((sum, t) => sum + t.amount, 0);

  const chartData = useMemo(() => {
    const mShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const anchor = transactions.length
      ? transactions.reduce((mx, t) => (t.date > mx ? t.date : mx), transactions[0].date)
      : new Date().toISOString().slice(0, 10);
    let ay = parseInt(anchor.slice(0, 4), 10) || new Date().getFullYear();
    let am = parseInt(anchor.slice(5, 7), 10) || 6;
    const data: { month: string; amount: number }[] = [];
    for (let bi = 5; bi >= 0; bi--) {
      const tt = ay * 12 + (am - 1) - bi;
      const yy = Math.floor(tt / 12);
      const mm = tt - yy * 12;
      const key = yy + "-" + (mm + 1 < 10 ? "0" + (mm + 1) : "" + (mm + 1));
      const amt = transactions
        .filter((x) => x.date.slice(0, 7) === key && x.category !== "Refund")
        .reduce((s2, r) => s2 + r.amount, 0);
      data.push({ month: mShort[mm], amount: amt });
    }
    return data;
  }, [transactions]);

  const maxVal = Math.max(...chartData.map((d) => d.amount), 1);

  const statusSegs = useMemo(() => {
    const paid = transactions.filter((t) => t.status === "Paid").length;
    const pending = transactions.filter((t) => t.status === "Pending").length;
    const overdue = transactions.filter((t) => t.status === "Overdue").length;
    return [
      { key: "Paid", label: "Paid", value: paid, color: C.up, filterValue: "Paid" },
      { key: "Pending", label: "Pending", value: pending, color: C.warn, filterValue: "Pending" },
      { key: "Overdue", label: "Overdue", value: overdue, color: C.down, filterValue: "Overdue" },
    ].filter((s) => s.value > 0);
  }, [transactions]);

  const categorySegs = useMemo(() => {
    const m: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.status !== "Paid") return;
      m[t.category] = (m[t.category] || 0) + t.amount;
    });
    const colors = [C.ink, C.flat, C.up, C.warn, C.down, "#60A5FA", "#A78BFA"];
    return Object.entries(m)
      .map(([label, value], i) => ({
        key: label,
        label,
        value,
        color: colors[i % colors.length],
        filterValue: label,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions]);

  const amountTotal = categorySegs.reduce((a, s) => a + s.value, 0);

  const handleSettleSubmit = () => {
    if (!selectedTxForPay) return;
    onSettlePayment(selectedTxForPay.id, payMethod);
    setSelectedTxForPay(null);
  };

  const submitAdd = () => {
    const amount = Number(addForm.amount);
    if (!amount || amount <= 0) return;
    const propName = (addForm.propertyName || "").trim();
    if (!propName) return;
    const lease =
      leases.find(
        (l) =>
          l.propertyName === propName ||
          (l.status === "Active" && !propName)
      ) || leases.find((l) => l.propertyName === propName);
    const propId = lease?.propertyId || `prop-${Date.now()}`;
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      propertyId: propId,
      propertyName: propName,
      category: addForm.category,
      amount,
      date: addForm.date,
      status: "Pending",
      paymentMethod: "UPI",
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      description: addForm.description || `${addForm.category} entry`,
    };
    onAddTransaction(tx);
    setShowAdd(false);
    setAddForm({
      propertyName: "",
      category: "Rent",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      description: "",
    });
  };

  const exportLedgerCsv = () => {
    downloadCsv(
      `homeos-ledger-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Property", "Category", "Amount", "Status", "Method", "Invoice", "Description"],
      filteredTx.map((t) => [
        t.date,
        t.propertyName,
        t.category,
        t.amount,
        t.status,
        t.paymentMethod,
        t.invoiceNumber,
        t.description,
      ])
    );
  };

  const propertyNames = useMemo(() => {
    const set = new Set<string>();
    leases.forEach((l) => set.add(l.propertyName));
    transactions.forEach((t) => set.add(t.propertyName));
    return Array.from(set);
  }, [leases, transactions]);

  return (
    <div className="flex-1 flex flex-col gap-3 p-3 sm:p-5 overflow-y-auto max-w-7xl w-full mx-auto pb-24 safe-bottom">
      {/* Header */}
      <header className={`${panel} px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-white tracking-tight">Ledger & Payments</h1>
            <p className="text-[11px] text-[#8E8E93] font-medium truncate">
              Rent, deposits, utilities · settle, receipt, export
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewModeToggle
            modes={[
              { id: "cards", label: "Ledger" },
              { id: "graphs", label: "Graphs" },
              { id: "dataset", label: "Dataset" },
            ]}
            value={hubView === "list" ? "cards" : hubView}
            onChange={setHubView}
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={exportLedgerCsv}
            className="h-10 px-3 rounded-xl border border-[#1F1F23] bg-[#121215] text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAdd(true)}
            className="h-10 px-3.5 rounded-xl bg-white text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add entry
          </motion.button>
        </div>
      </header>

      {/* Status % strip — click to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          {
            l: "Paid share",
            v: `${pct(
              transactions.filter((t) => t.status === "Paid").length,
              transactions.length || 1
            )}%`,
            s: money(lifetimePaid),
            c: C.up,
            f: () => setFilterStatus("Paid"),
          },
          {
            l: "Open share",
            v: `${pct(pendingCount, transactions.length || 1)}%`,
            s: money(pendingSum),
            c: C.warn,
            f: () => setFilterStatus("Pending"),
          },
          {
            l: "Overdue",
            v: money(overdueSum),
            s: `${transactions.filter((t) => t.status === "Overdue").length} bills`,
            c: C.down,
            f: () => setFilterStatus("Overdue"),
          },
          {
            l: "Filtered",
            v: String(filteredTx.length),
            s: `of ${transactions.length} total`,
            c: C.ink,
            f: () => {
              setFilterStatus("All");
              setFilterCategory("All");
            },
          },
        ].map((k) => (
          <button
            key={k.l}
            type="button"
            onClick={k.f}
            className={`${panel} p-3 text-left hover:border-white/25 cursor-pointer min-h-[72px] flex flex-col justify-between`}
          >
            <span className="text-[9px] font-bold uppercase text-[#71717A]">{k.l}</span>
            <div>
              <p className="text-base font-black tabular-nums" style={{ color: k.c }}>
                {k.v}
              </p>
              <p className="text-[10px] text-[#71717A] font-medium">{k.s}</p>
            </div>
          </button>
        ))}
      </div>

      {hubView === "graphs" && (
        <div className="grid lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4">
            <PercentDistribution
              title="Status mix"
              subtitle="Count of entries · click to filter"
              segments={statusSegs}
              total={transactions.length}
              activeKey={filterStatus === "All" ? null : filterStatus}
              onSelect={(seg) =>
                setFilterStatus(
                  filterStatus === seg.filterValue ? "All" : seg.filterValue || "All"
                )
              }
            />
          </div>
          <div className="lg:col-span-4">
            <PercentDistribution
              title="Paid by category"
              subtitle="Amount mix (paid only)"
              segments={categorySegs}
              total={amountTotal}
              activeKey={filterCategory === "All" ? null : filterCategory}
              onSelect={(seg) =>
                setFilterCategory(
                  filterCategory === seg.filterValue ? "All" : seg.filterValue || "All"
                )
              }
            />
          </div>
          <div className={`${panel} p-4 lg:col-span-4`}>
            <p className="text-[9px] font-bold uppercase text-[#71717A]">6-month volume</p>
            <h3 className="text-sm font-black text-white mb-3">Ledger activity</h3>
            <div className="flex items-end gap-1.5 h-[120px]">
              {chartData.map((d) => (
                <div
                  key={d.month}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                >
                  <div
                    className="w-full max-w-[20px] rounded-t-md bg-white/70"
                    style={{
                      height: Math.max(4, (d.amount / maxVal) * 100),
                    }}
                    title={`${d.month}: ${money(d.amount)}`}
                  />
                  <span className="text-[9px] font-bold text-[#71717A]">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {hubView === "dataset" && (
        <DatasetTable
          columns={[
            { key: "date", label: "Date" },
            { key: "property", label: "Property" },
            { key: "category", label: "Category" },
            { key: "amount", label: "Amount", align: "right" },
            { key: "status", label: "Status" },
            { key: "method", label: "Method" },
          ]}
          rows={filteredTx.map((t) => ({
            id: t.id,
            tone:
              t.status === "Paid" ? C.up : t.status === "Overdue" ? C.down : C.warn,
            cells: {
              date: <span className="text-[#8E8E93] tabular-nums">{t.date}</span>,
              property: (
                <span className="font-semibold text-white">{t.propertyName}</span>
              ),
              category: <span className="text-[#8E8E93]">{t.category}</span>,
              amount: money(t.amount),
              status: t.status,
              method: <span className="text-[#71717A]">{t.paymentMethod}</span>,
            },
          }))}
          empty="No transactions match filters"
        />
      )}

      {/* KPIs — compact premium */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          {
            label: "Lifetime settled",
            value: money(lifetimePaid),
            hint: "Paid transactions",
            icon: TrendingUp,
            tone: "text-[#10B981]",
            bg: "bg-[#10B981]/10 border-[#10B981]/20",
          },
          {
            label: "Open dues",
            value: money(pendingSum),
            hint: `${pendingCount} open bills`,
            icon: Clock,
            tone: "text-[#F59E0B]",
            bg: "bg-[#F59E0B]/10 border-[#F59E0B]/20",
          },
          {
            label: "Overdue",
            value: money(overdueSum),
            hint: "Needs attention",
            icon: Clock,
            tone: "text-red-400",
            bg: "bg-red-500/10 border-red-500/20",
          },
          {
            label: "Entries",
            value: num(transactions.length),
            hint: `${filteredTx.length} filtered`,
            icon: Receipt,
            tone: "text-white",
            bg: "bg-white/5 border-white/10",
          },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.label}
              whileHover={{ y: -2 }}
              className={`${panel} p-3.5 flex items-start justify-between gap-2`}
            >
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#8E8E93] block">
                  {k.label}
                </span>
                <span className="text-lg font-black text-white tabular-nums block mt-1 truncate">
                  {k.value}
                </span>
                <span className="text-[10px] text-[#8E8E93] font-medium">{k.hint}</span>
              </div>
              <div className={`p-2 rounded-xl border shrink-0 ${k.bg} ${k.tone}`}>
                <Icon className="w-4 h-4" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Chart + automation + ledger (cards/ledger mode) */}
      {hubView === "cards" && (
      <>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
        <div className={`${panel} p-4 xl:col-span-2`}>
          <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 block">
            Cash outflow
          </span>
          <h3 className="text-sm font-black text-white mb-3">Last 6 months</h3>
          <div className="h-[120px] flex items-end gap-1.5 sm:gap-2">
            {chartData.map((d, idx) => {
              const h = Math.max(8, (d.amount / maxVal) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-5 text-[9px] font-black text-white bg-[#121215] border border-[#1F1F23] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                    {money(d.amount)}
                  </span>
                  <motion.div
                    className="w-full rounded-t-md bg-white/80 group-hover:bg-white origin-bottom"
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                  />
                  <span className="text-[9px] font-bold text-[#8E8E93] uppercase">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="xl:col-span-3 min-w-0">
          <PaymentAutomation
            leases={leases}
            transactions={transactions}
            onAddTransactions={onAddTransactions}
          />
        </div>
      </div>

      {/* Ledger */}
      <section className={`${panel} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-[#1F1F23] flex flex-col lg:flex-row lg:items-center gap-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CreditCard className="w-4 h-4 text-white/50 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white">Financial ledger</h3>
              <p className="text-[10px] text-[#8E8E93]">
                {filteredTx.length} of {transactions.length} entries
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8E8E93] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search…"
                className="h-9 w-36 sm:w-44 pl-8 pr-2 rounded-lg bg-[#121215] border border-[#1F1F23] text-xs text-white font-semibold focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#8E8E93]" />
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-2 rounded-lg bg-[#121215] border border-[#1F1F23] text-[11px] text-white font-bold cursor-pointer"
              >
                <option value="All">All categories</option>
                {[
                  "Rent",
                  "Channel income",
                  "Deposit",
                  "Maintenance",
                  "Electricity",
                  "Water",
                  "Repairs",
                  "Cleaning",
                  "Platform fee",
                  "Management fee",
                  "Furnishings",
                  "Society dues",
                  "Tax",
                  "Refund",
                  "Other",
                ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-2 rounded-lg bg-[#121215] border border-[#1F1F23] text-[11px] text-white font-bold cursor-pointer"
              >
                <option value="All">All status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {transactions.length === 0 && !showAdd && (
          <div className="px-4 py-12 text-center border-t border-[#1F1F23]">
            <CreditCard className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm font-black text-white">No payments yet</p>
            <p className="text-xs text-[#6B7280] mt-1 font-medium max-w-sm mx-auto">
              Log rent, deposits, or bills so cashflow and open balance appear on the Command Deck.
            </p>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-black cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Log first payment
            </button>
          </div>
        )}

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[#1F1F23]">
          {pageItems.map((tx) => (
            <div key={tx.id} className="p-3.5 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-white truncate">{tx.propertyName}</p>
                  <p className="text-[10px] text-[#8E8E93]">
                    {tx.category} · {tx.date}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-black text-white tabular-nums">{money(tx.amount)}</p>
                  <StatusPill status={tx.status} />
                </div>
              </div>
              <div className="flex gap-1.5 justify-end">
                <IconBtn
                  danger
                  title="Delete"
                  onClick={() => {
                    if (window.confirm("Delete this transaction? Logged permanently in Activity log."))
                      onDeleteTransaction(tx.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconBtn>
                {tx.status !== "Paid" ? (
                  <button
                    type="button"
                    onClick={() => setSelectedTxForPay(tx)}
                    className="h-8 px-3 rounded-lg bg-white text-black text-[10px] font-bold cursor-pointer"
                  >
                    Settle
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedTxForReceipt(tx)}
                    className="h-8 px-3 rounded-lg border border-[#1F1F23] text-[10px] font-bold text-white cursor-pointer inline-flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5" /> Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F1F23] text-[9px] text-[#8E8E93] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-4 font-bold">Property</th>
                <th className="py-2.5 px-3 font-bold">Category</th>
                <th className="py-2.5 px-3 font-bold">Amount</th>
                <th className="py-2.5 px-3 font-bold">Date</th>
                <th className="py-2.5 px-3 font-bold">Method</th>
                <th className="py-2.5 px-3 font-bold">Status</th>
                <th className="py-2.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((tx) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-[#1F1F23]/60 text-[12px] text-white hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4 font-bold max-w-[180px] truncate">{tx.propertyName}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-[#121215] border border-[#1F1F23] text-[10px] font-bold uppercase">
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-black tabular-nums">{money(tx.amount)}</td>
                  <td className="py-3 px-3 text-[#8E8E93] font-semibold tabular-nums">{tx.date}</td>
                  <td className="py-3 px-3 text-[#8E8E93] font-semibold">{tx.paymentMethod}</td>
                  <td className="py-3 px-3">
                    <StatusPill status={tx.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1.5">
                      <IconBtn
                        danger
                        title="Delete (logged)"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Delete this transaction? This action is permanently logged."
                            )
                          )
                            onDeleteTransaction(tx.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconBtn>
                      {tx.status !== "Paid" ? (
                        <button
                          type="button"
                          onClick={() => setSelectedTxForPay(tx)}
                          className="h-8 px-2.5 rounded-lg bg-white text-black text-[10px] font-bold cursor-pointer"
                        >
                          Settle
                        </button>
                      ) : (
                        <IconBtn title="Receipt" onClick={() => setSelectedTxForReceipt(tx)}>
                          <Receipt className="w-3.5 h-3.5" />
                        </IconBtn>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-[#1F1F23]">
          <Pagination
            page={curPage}
            total={filteredTx.length}
            pageSize={PAGE_SIZE}
            onPage={setPage}
            label="transactions"
          />
        </div>
      </section>
      </>
      )}

      {/* Settle modal */}
      <AnimatePresence>
        {selectedTxForPay && (
          <Modal onClose={() => setSelectedTxForPay(null)} title="Settle payment">
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="p-3 bg-white rounded-xl">
                <QrCode className="w-28 h-28 text-black" />
              </div>
              <div className="text-center">
                <p className="text-[11px] text-[#8E8E93]">{selectedTxForPay.category}</p>
                <p className="text-2xl font-black text-white tabular-nums">
                  {money(selectedTxForPay.amount)}
                </p>
                <p className="text-[11px] text-white/50 font-bold mt-0.5">{selectedTxForPay.propertyName}</p>
              </div>
              <label className="w-full flex flex-col gap-1 text-left">
                <span className="text-[10px] font-bold uppercase text-[#8E8E93]">Method</span>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                  className="h-11 w-full rounded-xl bg-[#121215] border border-[#1F1F23] px-3 text-sm text-white font-semibold cursor-pointer"
                >
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </label>
              <div className="flex gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedTxForPay(null)}
                  className="flex-1 h-11 rounded-xl border border-[#1F1F23] text-xs font-bold text-[#8E8E93] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSettleSubmit}
                  className="flex-1 h-11 rounded-xl bg-white text-black text-xs font-bold cursor-pointer"
                >
                  Confirm settle
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Receipt modal */}
      <AnimatePresence>
        {selectedTxForReceipt && (
          <Modal onClose={() => setSelectedTxForReceipt(null)} title="Receipt" light>
            <div className="bg-white text-stone-900 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex justify-between border-b border-stone-200 pb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                    HomeOS receipt
                  </p>
                  <p className="text-sm font-black mt-0.5">Payment statement</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-stone-400 uppercase">Invoice</p>
                  <p className="text-xs font-black">{selectedTxForReceipt.invoiceNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[9px] font-bold text-stone-400 uppercase">Property</p>
                  <p className="font-bold">{selectedTxForReceipt.propertyName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-stone-400 uppercase">Date</p>
                  <p className="font-bold">{selectedTxForReceipt.date}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-stone-400 uppercase">Category</p>
                  <p className="font-bold uppercase">{selectedTxForReceipt.category}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-stone-400 uppercase">Method</p>
                  <p className="font-bold">{selectedTxForReceipt.paymentMethod}</p>
                </div>
              </div>
              <div className="flex justify-between items-center bg-stone-50 border border-stone-200 rounded-xl p-3">
                <span className="text-xs font-bold">Total</span>
                <span className="text-xl font-black tabular-nums">
                  {money(selectedTxForReceipt.amount)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 h-10 rounded-xl bg-stone-100 border border-stone-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadInvoicePdf({
                      invoiceNumber: selectedTxForReceipt.invoiceNumber,
                      issueDate: selectedTxForReceipt.date,
                      fromName: "HomeOS Workspace",
                      toName: selectedTxForReceipt.propertyName,
                      propertyName: selectedTxForReceipt.propertyName,
                      lineItems: [
                        {
                          description: `${selectedTxForReceipt.category} — ${selectedTxForReceipt.description}`,
                          amount: selectedTxForReceipt.amount,
                        },
                      ],
                      notes: `Settled via ${selectedTxForReceipt.paymentMethod}`,
                    });
                  }}
                  className="flex-1 h-10 rounded-xl bg-black text-white text-xs font-bold cursor-pointer"
                >
                  Save PDF
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Add entry modal */}
      <AnimatePresence>
        {showAdd && (
          <Modal onClose={() => setShowAdd(false)} title="Add ledger entry">
            <div className="flex flex-col gap-2.5">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[#8E8E93]">
                  Property / home name
                </span>
                <input
                  list="payment-property-names"
                  value={addForm.propertyName}
                  onChange={(e) => setAddForm({ ...addForm, propertyName: e.target.value })}
                  className="h-11 rounded-xl bg-[#121215] border border-[#1F1F23] px-3 text-sm text-white font-semibold"
                  placeholder="e.g. Koramangala flat"
                  required
                />
                <datalist id="payment-property-names">
                  {propertyNames.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
                {!addForm.propertyName.trim() && (
                  <span className="text-[10px] text-amber-400/90 font-medium">
                    Required — type a name even if you have not added the home yet.
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase text-[#8E8E93]">Category</span>
                  <select
                    value={addForm.category}
                    onChange={(e) =>
                      setAddForm({ ...addForm, category: e.target.value as Transaction["category"] })
                    }
                    className="h-11 rounded-xl bg-[#121215] border border-[#1F1F23] px-3 text-sm text-white font-semibold cursor-pointer"
                  >
                    {[
                      "Rent",
                      "Deposit",
                      "Maintenance",
                      "Electricity",
                      "Water",
                      "Repairs",
                      "Tax",
                      "Other",
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase text-[#8E8E93]">Amount</span>
                  <input
                    type="number"
                    value={addForm.amount}
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    className="h-11 rounded-xl bg-[#121215] border border-[#1F1F23] px-3 text-sm text-white font-semibold"
                    placeholder="0"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[#8E8E93]">Date</span>
                <input
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                  className="h-11 rounded-xl bg-[#121215] border border-[#1F1F23] px-3 text-sm text-white font-semibold cursor-pointer"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-[#8E8E93]">Note</span>
                <input
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="h-11 rounded-xl bg-[#121215] border border-[#1F1F23] px-3 text-sm text-white font-semibold"
                  placeholder="Optional"
                />
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 h-11 rounded-xl border border-[#1F1F23] text-xs font-bold text-[#8E8E93] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitAdd}
                  className="flex-1 h-11 rounded-xl bg-white text-black text-xs font-bold cursor-pointer"
                >
                  Save entry
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "Paid"
      ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
      : status === "Pending"
        ? "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
        : "bg-red-500/15 text-red-400 border-red-500/30";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${cls}`}
    >
      {status === "Paid" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {status}
    </span>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-8 h-8 rounded-lg border inline-flex items-center justify-center cursor-pointer transition-colors ${
        danger
          ? "border-[#1F1F23] text-[#8E8E93] hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10"
          : "border-[#1F1F23] text-[#8E8E93] hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Modal({
  children,
  onClose,
  title,
  light,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  light?: boolean;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl border shadow-2xl ${
          light ? "bg-transparent border-transparent" : "bg-[#0A0A0C] border-[#1F1F23] p-4 sm:p-5"
        }`}
      >
        {!light && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-white">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-[#1F1F23] text-[#8E8E93] hover:text-white inline-flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {children}
        {light && (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full h-9 text-xs font-bold text-[#8E8E93] hover:text-white cursor-pointer"
          >
            Close
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

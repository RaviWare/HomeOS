import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  CalendarClock,
  CreditCard,
  Droplet,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  TrendingUp,
  Wallet,
  Wrench,
  Brain,
  Share2,
  Download,
  Home,
  ListChecks,
  Plane,
  ScrollText,
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  Layers,
  ShieldCheck,
} from "lucide-react";

interface FeaturesPageProps {
  onLaunch?: () => void;
}

type Category = "all" | "life" | "housing" | "money" | "ops";

const MODULES: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tag: string;
  cat: Category;
  blurb: string;
  points: string[];
}[] = [
  {
    icon: LayoutDashboard,
    title: "Command Deck",
    tag: "Dashboard",
    cat: "ops",
    blurb: "HQ for pulse stats, hubs, and one-tap entry into every module.",
    points: [
      "Lifetime snapshot with stats and hubs",
      "Rent growth, renewals, and insights",
      "Local time & weather — 24h global clock",
      "One tap into every HomeOS module",
    ],
  },
  {
    icon: Home,
    title: "Home Life",
    tag: "Life OS",
    cat: "life",
    blurb: "Income, assets, chores, travel, and budgets beside housing.",
    points: [
      "Income: salary, freelance, side hustles",
      "Assets: vehicles, gear, funds, equity",
      "Household chores with assignees",
      "Travel & budget envelopes",
    ],
  },
  {
    icon: Building2,
    title: "Property Hub",
    tag: "Housing",
    cat: "housing",
    blurb: "Every home you live in or manage — portfolio-ready.",
    points: [
      "Every home you live in or manage",
      "City, status, rent, ownership context",
      "Duplicate, update, organise portfolios",
      "Role-aware layouts for tenants & owners",
    ],
  },
  {
    icon: FileText,
    title: "Lease & Clauses",
    tag: "Agreements",
    cat: "housing",
    blurb: "Active leases, renewals, deposits, and key terms.",
    points: [
      "Active and completed lease records",
      "Renewal countdown and deposits",
      "Clause-level structure for key terms",
      "Linked to properties and payments",
    ],
  },
  {
    icon: CreditCard,
    title: "Ledger & Payments",
    tag: "Finance",
    cat: "money",
    blurb: "Full payment history with settle, invoice, and export.",
    points: [
      "Full payment history with status",
      "Settle pending items in-product",
      "Invoices and descriptions",
      "CSV · Excel · PDF exports",
    ],
  },
  {
    icon: Droplet,
    title: "Utilities Tracker",
    tag: "Bills",
    cat: "ops",
    blurb: "Meters, usage, due dates — auto-linked to the ledger.",
    points: [
      "Electricity, water, internet, and more",
      "Meter readings and usage history",
      "Due dates and unpaid status",
      "Auto-linked ledger entries",
    ],
  },
  {
    icon: Wrench,
    title: "Maintenance Ops",
    tag: "Tickets",
    cat: "ops",
    blurb: "Raise, track, and cost tickets with a full timeline.",
    points: [
      "Raise and track repair tickets",
      "Pending → in progress → resolved",
      "Actual cost capture into the ledger",
      "Timeline notes on every change",
    ],
  },
  {
    icon: TrendingUp,
    title: "Expense & Tax Lab",
    tag: "Insights",
    cat: "money",
    blurb: "Category spend and tax-relevant views from your stream.",
    points: [
      "Category-level spending analysis",
      "Tax-relevant expense views",
      "Built from your transaction stream",
      "Export-ready aggregates",
    ],
  },
  {
    icon: Wallet,
    title: "Finances",
    tag: "Money",
    cat: "money",
    blurb: "Role-aware money hub for deposits, rent, and repairs.",
    points: [
      "Role-aware financial hub",
      "Deposits, rent, repairs in one place",
      "Portfolio money view for owners",
      "Clear pending vs paid status",
    ],
  },
  {
    icon: ListChecks,
    title: "Household Chores",
    tag: "Life OS",
    cat: "life",
    blurb: "Assign tasks with cadence, priority, and status.",
    points: [
      "Assign tasks across the household",
      "Daily, weekly, monthly cadence",
      "Priority and done / open status",
      "Lives inside Home Life board",
    ],
  },
  {
    icon: Plane,
    title: "Travel & Budgets",
    tag: "Life OS",
    cat: "life",
    blurb: "Trip funds and monthly envelopes with overspend flags.",
    points: [
      "Trip funds and monthly envelopes",
      "Overspend flags when you blow the cap",
      "Side-hustle tool budgets",
      "Export with Home Life pack",
    ],
  },
  {
    icon: FolderOpen,
    title: "Document Vault",
    tag: "Files",
    cat: "ops",
    blurb: "Searchable vault for leases, bills, and OCR fields.",
    points: [
      "Searchable vault for leases and bills",
      "Optional OCR field import",
      "Organise by type and property",
      "Privacy-conscious storage guidance",
    ],
  },
  {
    icon: MessageSquareText,
    title: "Ask Your Data",
    tag: "Assistant",
    cat: "ops",
    blurb: "Plain-English answers from your private vault records.",
    points: [
      "Answers from your private records",
      "Savings, taxes, rent, utilities",
      "Export answers as text or CSV",
      "Share summaries when you need proof",
    ],
  },
  {
    icon: ScrollText,
    title: "Activity Log",
    tag: "Audit",
    cat: "ops",
    blurb: "Immutable, hash-chained trail of every change.",
    points: [
      "Immutable timestamps on changes",
      "Create, edit, settle, export events",
      "Hash-chained integrity trail",
      "Accountant-ready history",
    ],
  },
  {
    icon: Settings,
    title: "Vault Settings",
    tag: "Control",
    cat: "ops",
    blurb: "Identity, security, notifications, and wipe controls.",
    points: [
      "Workspace identity and notifications",
      "Security posture toggles",
      "Optional Telegram vault link",
      "Wipe workspace when you need to",
    ],
  },
];

const FILTERS: { id: Category; label: string; short: string }[] = [
  { id: "all", label: "All modules", short: "All" },
  { id: "life", label: "Home Life", short: "Life" },
  { id: "housing", label: "Housing", short: "Housing" },
  { id: "money", label: "Money", short: "Money" },
  { id: "ops", label: "Ops & vault", short: "Ops" },
];

const ASSISTANT_EXAMPLES = [
  "What are my savings this year?",
  "Taxes I paid last year",
  "Rent appreciation over 5 years",
  "Pending payments this month",
  "Highest electricity bill",
  "Documents for my current home",
];

const LAYERS = [
  { icon: Home, label: "Life", d: "Income · chores · goals" },
  { icon: Building2, label: "Housing", d: "Homes · leases" },
  { icon: CreditCard, label: "Money", d: "Ledger · tax lab" },
  { icon: LayoutDashboard, label: "Deck", d: "Pulse · hubs" },
  { icon: FolderOpen, label: "Vault", d: "Docs · OCR" },
  { icon: ShieldCheck, label: "Audit", d: "Activity trail" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function FeaturesPage({ onLaunch }: FeaturesPageProps) {
  const [filter, setFilter] = useState<Category>("all");
  const [activeIdx, setActiveIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);

  const visible = useMemo(
    () => (filter === "all" ? MODULES : MODULES.filter((m) => m.cat === filter)),
    [filter]
  );

  // Keep active module in range when filter changes
  useEffect(() => {
    setActiveIdx(0);
  }, [filter]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setQIdx((i) => (i + 1) % ASSISTANT_EXAMPLES.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  const mod = visible[Math.min(activeIdx, visible.length - 1)] || MODULES[0];
  const ModIcon = mod.icon;

  return (
    <div className="animate-pageEnter">
      {/* Hero + interactive module board */}
      <section className="relative pt-1 pb-5 sm:pb-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full blur-[90px] pointer-events-none" />

        <div className="relative grid lg:grid-cols-12 gap-4 lg:gap-5 items-start">
          <div className="lg:col-span-4 min-w-0 flex flex-col gap-3">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1.5"
              >
                Features
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04, ease }}
                className="text-xl sm:text-2xl font-black text-white tracking-tight leading-[1.15]"
              >
                Full home OS —
                <br />
                <span className="text-white/40">not another spreadsheet.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mt-2 text-[12px] sm:text-[13px] text-[#8E8E93] leading-relaxed font-medium max-w-[19rem]"
              >
                Housing, money, life ops, documents, and an immutable trail. Every
                module maps to a real Command Deck surface.
              </motion.p>
            </div>

            {onLaunch && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="flex flex-wrap gap-2"
              >
                <button
                  type="button"
                  onClick={onLaunch}
                  className="mkt-btn-primary text-[13px] px-4 py-2.5 min-h-[42px]"
                >
                  Start free trial
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.16 }}
              className="flex flex-wrap gap-1.5 mt-1"
            >
              {[
                { icon: Layers, label: `${MODULES.length} modules` },
                { icon: Home, label: "Life + housing" },
                { icon: Download, label: "CSV · Excel · PDF" },
                { icon: Brain, label: "Ask Your Data" },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold text-[#8E8E93]"
                >
                  <Icon className="w-3 h-3 text-white/50" />
                  {label}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Interactive module explorer */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4, ease }}
            className="lg:col-span-8 mkt-card p-3 sm:p-3.5 border border-[#1F1F23]"
          >
            {/* Filter chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {FILTERS.map((f) => {
                const on = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`h-8 px-2.5 rounded-lg text-[10px] font-bold transition-all duration-200 border ${
                      on
                        ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        : "bg-white/[0.03] text-white/50 border-white/10 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    {f.short}
                  </button>
                );
              })}
              <span className="ml-auto hidden sm:inline-flex items-center text-[10px] font-medium text-white/30">
                {visible.length} surfaces
              </span>
            </div>

            {/* Module picker — reserved 3-row height so filter changes don't jump */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3 min-h-[11rem] sm:min-h-[10.75rem] content-start">
              {visible.map((m, i) => {
                const Icon = m.icon;
                const on = i === activeIdx;
                return (
                  <button
                    key={m.title}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 min-h-[3.25rem] transition-colors duration-200 border ${
                      on
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.03] text-white/50 border-white/10 hover:border-white/20 hover:text-white/80"
                    }`}
                    aria-pressed={on}
                    aria-label={m.title}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${on ? "text-black" : ""}`} />
                    <span
                      className={`text-[9px] font-bold leading-tight text-center px-0.5 line-clamp-1 w-full ${
                        on ? "text-black/70" : "text-white/40"
                      }`}
                    >
                      {m.title.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Fixed height detail — opacity-only crossfade, no y/layout shift */}
            <div className="relative rounded-xl border border-white/10 bg-black/40 p-3.5 sm:p-4 h-[10.5rem] sm:h-[10.75rem] overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${filter}-${mod.title}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease }}
                  className="absolute inset-0 p-3.5 sm:p-4 flex gap-3 sm:gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shrink-0">
                    <ModIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-sm sm:text-[15px] font-black text-white tracking-tight line-clamp-1">
                        {mod.title}
                      </h2>
                      <span className="inline-flex items-center rounded-md bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/45">
                        {mod.tag}
                      </span>
                    </div>
                    <p className="text-[12px] sm:text-[13px] text-[#8E8E93] leading-relaxed font-medium line-clamp-2">
                      {mod.blurb}
                    </p>
                    <ul className="mt-2 grid sm:grid-cols-2 gap-1">
                      {mod.points.map((p) => (
                        <li
                          key={p}
                          className="flex items-start gap-1.5 text-[11px] text-white/55 font-medium leading-snug"
                        >
                          <Check className="w-2.5 h-2.5 text-white/40 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-white/[0.06]">
              <div className="flex items-center gap-1 flex-wrap min-w-0">
                {visible.map((m, i) => (
                  <button
                    key={m.title}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`h-1 rounded-full transition-all duration-200 shrink-0 ${
                      i === activeIdx ? "w-5 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={`Go to ${m.title}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={activeIdx === 0}
                  onClick={() => setActiveIdx((a) => Math.max(0, a - 1))}
                  className="text-[11px] font-bold text-white/40 hover:text-white disabled:opacity-30 disabled:pointer-events-none px-2 py-1 transition-colors"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeIdx < visible.length - 1) {
                      setActiveIdx((a) => a + 1);
                    } else if (onLaunch) {
                      onLaunch();
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  {activeIdx < visible.length - 1 ? "Next module" : "Start trial"}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Layer map */}
      <section className="pb-5 sm:pb-6">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
            Inside the OS
          </p>
          <p className="text-[10px] font-medium text-white/30 hidden sm:block">
            Layers you operate after setup
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {LAYERS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, ease }}
                whileHover={{ y: -2 }}
                className="mkt-card p-3 flex flex-col gap-1.5 border border-[#1F1F23]"
              >
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-[12px] font-black text-white leading-tight">{item.label}</p>
                <p className="text-[10px] text-[#6B7280] font-medium">{item.d}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Compact module catalog */}
      <section className="pb-5 sm:pb-6 border-t border-[#1F1F23] pt-5 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1">
              Module catalog
            </p>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Everything on the Command Deck.
            </h2>
          </div>
          <p className="text-[11px] text-[#6B7280] font-medium max-w-xs sm:text-right leading-snug">
            Filter above, or scan the full set. Each card is a live surface after signup.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`h-8 px-3 rounded-lg text-[10px] font-bold transition-all border ${
                  on
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.03] text-white/50 border-white/10 hover:text-white/80"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <motion.div layout className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
          <AnimatePresence mode="popLayout">
            {visible.map((m, i) => {
              const Icon = m.icon;
              const selected = m.title === mod.title;
              return (
                <motion.button
                  key={m.title}
                  type="button"
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: Math.min(i, 8) * 0.03, ease }}
                  whileHover={{ y: -2 }}
                  onClick={() => {
                    setActiveIdx(i);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`mkt-card p-3.5 text-left flex flex-col gap-2 border transition-colors ${
                    selected
                      ? "border-white/20 bg-white/[0.03]"
                      : "border-[#1F1F23]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md">
                      {m.tag}
                    </span>
                  </div>
                  <h3 className="text-[13px] font-black text-white tracking-tight">{m.title}</h3>
                  <p className="text-[11px] text-[#8E8E93] leading-snug font-medium line-clamp-2">
                    {m.blurb}
                  </p>
                  <ul className="flex flex-col gap-1 mt-0.5">
                    {m.points.slice(0, 2).map((p) => (
                      <li
                        key={p}
                        className="text-[10px] text-white/45 font-medium flex gap-1.5 leading-snug"
                      >
                        <Check className="w-2.5 h-2.5 text-white/30 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{p}</span>
                      </li>
                    ))}
                  </ul>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Ask Your Data */}
      <section className="pb-5 sm:pb-6 border-t border-[#1F1F23] pt-5 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1">
              Ask Your Data
            </p>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Type a question. Get vault answers.
            </h2>
          </div>
          <p className="text-[11px] text-[#6B7280] font-medium max-w-xs sm:text-right leading-snug">
            Core Q&amp;A needs no API key. Optional provider AI only if you enable it.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-2.5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 mkt-card p-3.5 sm:p-4 border border-[#1F1F23] flex flex-col gap-3"
          >
            <div className="flex items-center gap-2.5">
              <motion.div
                className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Brain className="w-4 h-4" />
              </motion.div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/45 block">
                  Live demo
                </span>
                <span className="text-[13px] font-black text-white">Try asking</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 min-h-[5.5rem]">
              <div className="relative min-h-[2.25rem]">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={ASSISTANT_EXAMPLES[qIdx]}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.28 }}
                    className="text-[13px] font-bold text-white absolute inset-x-0"
                  >
                    “{ASSISTANT_EXAMPLES[qIdx]}”
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="flex gap-1 mt-7">
                {ASSISTANT_EXAMPLES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQIdx(i)}
                    className={`h-1 rounded-full transition-all ${
                      i === qIdx ? "w-4 bg-white" : "w-1 bg-white/25"
                    }`}
                    aria-label={`Example ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#8E8E93]">
                <Download className="w-3 h-3" /> Export .txt / .csv
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#8E8E93]">
                <Share2 className="w-3 h-3" /> Share summaries
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#8E8E93]">
                <CalendarClock className="w-3 h-3" /> Aggregates
              </span>
            </div>
          </motion.div>

          <div className="lg:col-span-7 grid sm:grid-cols-3 gap-2.5">
            {[
              {
                t: "What it understands",
                d: "Savings, taxes, rent, utilities, deposits — plus search across docs, cities, pending payments, maintenance, and leases.",
                icon: Sparkles,
              },
              {
                t: "Optional live AI",
                d: "Plug in a provider key for web-grounded chat and document OCR. Core Q&A works without it.",
                icon: Zap,
              },
              {
                t: "Stays on your terms",
                d: "Answers grounded in your vault. You decide what to store, export, or wipe.",
                icon: ShieldCheck,
              },
            ].map(({ icon: Icon, t, d }, i) => (
              <motion.article
                key={t}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, ease }}
                whileHover={{ y: -2 }}
                className="mkt-card p-3.5 flex flex-col gap-2 border border-[#1F1F23]"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-[13px] font-black text-white">{t}</h3>
                <p className="text-[11px] text-[#8E8E93] leading-snug font-medium">{d}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-1 border-t border-[#1F1F23] pt-5 sm:pt-6">
        <div className="mkt-card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/12">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-white tracking-tight">
              Put every module on your deck.
            </h3>
            <p className="text-[11px] text-[#8E8E93] mt-0.5 font-medium leading-snug">
              14-day free trial · role-aware layout · export & rearrange anytime.
            </p>
          </div>
          {onLaunch && (
            <button
              type="button"
              onClick={onLaunch}
              className="mkt-btn-primary text-[13px] px-5 py-2.5 min-h-[42px] shrink-0 w-full sm:w-auto"
            >
              Start free trial
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Building2,
  CreditCard,
  FileText,
  FolderOpen,
  Lock,
  MessageSquareText,
  ShieldCheck,
  Zap,
  ScrollText,
  TrendingUp,
  Droplet,
  Check,
  LayoutDashboard,
  X,
  Download,
  ChevronRight,
  Home,
  Wallet,
  Landmark,
  ListChecks,
  Plane,
  Briefcase,
} from "lucide-react";
import Section from "../components/Section";
import DashboardPreview from "../components/DashboardPreview";
import type { MarketingPage } from "../types";

interface HomePageProps {
  onNavigate: (page: MarketingPage) => void;
  onLaunch: () => void;
  onLogin?: () => void;
}

/** Rotating outcome phrase — short, conversion-focused */
const ROTATE_WORDS = [
  "one Command Deck.",
  "one private vault.",
  "one home OS.",
];

const MARQUEE = [
  "Command Deck",
  "Home Life",
  "Income & Side Hustles",
  "Assets",
  "Travel Budgets",
  "Household Chores",
  "Property Hub",
  "Lease Vault",
  "Payment Ledger",
  "Utilities",
  "Maintenance",
  "Expense Lab",
  "Document Vault",
  "Ask Your Data",
  "Activity Log",
  "Invoices",
  "CSV · Excel · PDF",
];

const STACK = [
  {
    icon: LayoutDashboard,
    title: "Command Deck",
    tag: "HQ",
    desc: "Lifetime snapshot, renewals, and one-tap access to every module.",
  },
  {
    icon: Home,
    title: "Home Life",
    tag: "Life",
    desc: "Income, side hustles, assets, chores, and travel budgets.",
  },
  {
    icon: Building2,
    title: "Property Hub",
    tag: "Housing",
    desc: "Homes, status, rent, and ownership — structured forever.",
  },
  {
    icon: FileText,
    title: "Lease & Clauses",
    tag: "Housing",
    desc: "Agreements, deposits, renewals, and searchable clauses.",
  },
  {
    icon: CreditCard,
    title: "Ledger",
    tag: "Money",
    desc: "Settle, invoice, and export proof in seconds.",
  },
  {
    icon: Droplet,
    title: "Utilities & Repair",
    tag: "Ops",
    desc: "Meters, bills, tickets, and vendor cost history.",
  },
  {
    icon: FolderOpen,
    title: "Document Vault",
    tag: "Files",
    desc: "Searchable leases and bills with optional OCR import.",
  },
  {
    icon: ScrollText,
    title: "Activity Log",
    tag: "Audit",
    desc: "Immutable trail for every meaningful change.",
  },
  {
    icon: MessageSquareText,
    title: "Ask Your Data",
    tag: "AI",
    desc: "Plain-English answers from your own vault records.",
  },
];

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i, 8) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HomePage({ onNavigate, onLaunch, onLogin }: HomePageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setWordIdx((i) => (i + 1) % ROTATE_WORDS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div>
      {/*
        Full-viewport hero: content fills the fold; marquee is the last thing visible.
        Height accounts for navbar + main top padding so the next section stays below the fold.
      */}
      <section
        className="relative flex flex-col overflow-hidden
          min-h-[calc(100dvh-3.75rem-0.5rem)] sm:min-h-[calc(100dvh-5rem-0.75rem)]
          -mt-1"
      >
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[min(880px,95%)] h-52 sm:h-64 bg-white/[0.045] rounded-full blur-[100px] pointer-events-none" />

        {/* Main hero body */}
        <div className="relative flex-1 flex flex-col justify-center py-5 sm:py-8 min-h-0">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center w-full">
            {/* Copy — short, conversion-first */}
            <div className="min-w-0 flex flex-col justify-center max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 self-start text-[10px] font-black uppercase tracking-widest text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/25 px-2.5 py-1 rounded-full mb-4"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                Home operating system
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                className="text-[2rem] leading-[1.08] sm:text-[2.6rem] md:text-[2.9rem] lg:text-[3.15rem] font-black text-white tracking-tight"
              >
                Your entire home life.
                <br />
                <span className="relative inline-block min-h-[1.12em]">
                  <span className="text-white/35">Run it from </span>
                  <span className="relative inline-block min-w-[12.5ch] sm:min-w-[14ch] align-baseline">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={ROTATE_WORDS[wordIdx]}
                        initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                        transition={{ duration: 0.35 }}
                        className="mkt-shimmer-text absolute left-0 top-0 whitespace-nowrap"
                      >
                        {ROTATE_WORDS[wordIdx]}
                      </motion.span>
                    </AnimatePresence>
                    <span className="invisible whitespace-nowrap" aria-hidden>
                      one Command Deck.
                    </span>
                  </span>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 text-[15px] sm:text-base text-[#8E8E93] leading-relaxed max-w-md font-medium"
              >
                Housing, money, and household ops in one private vault — so you always know what you
                own, owe, and changed.
              </motion.p>

              {/* Outcome chips — not long bullets */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="mt-5 flex flex-wrap gap-2"
              >
                {["Rent & homes", "Income & budgets", "Docs & proof"].map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[#1F1F23] bg-[#0A0A0C] text-[11px] font-bold text-white/80"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    {chip}
                  </span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <motion.button
                  type="button"
                  onClick={onLaunch}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mkt-btn-primary text-sm px-7 py-3.5 min-h-[52px] w-full sm:w-auto shadow-[0_0_48px_rgba(255,255,255,0.14)]"
                >
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <button
                  type="button"
                  onClick={() => onNavigate("how-it-works")}
                  className="text-[13px] font-bold text-[#8E8E93] hover:text-white transition-colors min-h-[44px] sm:px-2"
                >
                  See how it works →
                </button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.24 }}
                className="mt-4 text-[11px] text-[#6B7280] font-medium"
              >
                Free to start · Private by design · Export anytime
                {onLogin && (
                  <>
                    {" · "}
                    <button
                      type="button"
                      onClick={onLogin}
                      className="text-white/70 hover:text-white font-bold underline-offset-2 hover:underline cursor-pointer"
                    >
                      Log in
                    </button>
                  </>
                )}
              </motion.p>
            </div>

            {/* Product visual */}
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative min-w-0 w-full self-center"
            >
              <DashboardPreview onCta={onLaunch} />
            </motion.div>
          </div>
        </div>

        {/* Marquee — last element of the hero (bottom of the fold) */}
        <div className="relative shrink-0 -mx-3 sm:-mx-6 border-t border-[#1F1F23] bg-[#0A0A0C]/90 overflow-hidden py-2.5 mt-auto">
          <div className="flex animate-mkt-marquee whitespace-nowrap w-max">
            {[...MARQUEE, ...MARQUEE].map((label, i) => (
              <span
                key={`${label}-${i}`}
                className="inline-flex items-center gap-2 mx-4 text-[10px] sm:text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest"
              >
                <span className="w-1 h-1 rounded-full bg-white/25" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Content below the fold starts after full hero */}
      <Section
        eyebrow="The shift"
        title="Fragmented tools hide the truth."
        subtitle="HomeOS makes the full picture obvious — money, housing, and household ops together."
        className="pt-10 sm:pt-14"
      >
        <div className="grid md:grid-cols-2 gap-3">
          {[
            {
              icon: FolderOpen,
              bad: "Spreadsheets, chats, and PDFs in five places",
              good: "One searchable vault for every record that matters",
            },
            {
              icon: Wallet,
              bad: "Side income and budgets living in notes apps",
              good: "Home Life: streams, assets, envelopes, chores",
            },
            {
              icon: ScrollText,
              bad: "No proof when memory fails",
              good: "Immutable activity log + multi-format export",
            },
            {
              icon: Building2,
              bad: "Renewals and utilities surprise you",
              good: "Property, lease, utilities, and tickets on deck",
            },
          ].map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.bad}
                custom={i}
                variants={fade}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.18)" }}
                className="mkt-card p-0 overflow-hidden border border-[#1F1F23] grid sm:grid-cols-2"
              >
                {/* Without */}
                <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-[#1F1F23] bg-black/30">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center">
                      <X className="w-3 h-3 text-white/35" />
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/35">
                      Without
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold text-[#8E8E93] leading-snug">{p.bad}</p>
                </div>
                {/* With HomeOS */}
                <div className="p-4 sm:p-5 bg-[#0A0A0C]">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white">
                      <Icon className="w-3 h-3" />
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#F59E0B]">
                      With HomeOS
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold text-white leading-snug">{p.good}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Scope */}
      <Section
        eyebrow="Built for real homes"
        title="Not rent-only. Full home ops."
        subtitle="If it lives in your house, hits your bank, or eats a weekend — it belongs here."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: Building2, t: "Housing", d: "Properties, leases, deposits, renewals, utilities." },
            { icon: Briefcase, t: "Income & hustles", d: "Salary and gigs — real monthly cash-in." },
            { icon: Landmark, t: "Assets", d: "Vehicles, gear, funds, equity estimates." },
            { icon: TrendingUp, t: "Spend clarity", d: "Expense lab and export for tax season." },
            { icon: Plane, t: "Travel & budgets", d: "Trip funds and monthly envelopes." },
            { icon: ListChecks, t: "Household chores", d: "Assign, complete, keep the house running." },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.t}
                custom={i}
                variants={fade}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="mkt-card p-4"
              >
                <Icon className="w-4.5 h-4.5 text-[#F59E0B] mb-2.5 w-4 h-4" />
                <h3 className="text-sm font-black text-white">{c.t}</h3>
                <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed font-medium">{c.d}</p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Modules — Inside the vault */}
      <Section
        eyebrow="Inside the vault"
        title="Everything you need. Nothing you don’t."
        subtitle="Housing stays sharp. Life modules make HomeOS a full home OS."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STACK.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.article
                key={f.title}
                custom={i}
                variants={fade}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-30px" }}
                whileHover={{ y: -4, borderColor: "rgba(255,255,255,0.2)" }}
                className="group mkt-card p-4 sm:p-5 flex flex-col gap-3 border border-[#1F1F23] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-white/10 group-hover:border-white/25">
                    <Icon className="w-4 h-4 text-white" strokeWidth={1.75} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/35 border border-[#1F1F23] px-2 py-1 rounded-md">
                    {f.tag}
                  </span>
                </div>
                <div className="relative">
                  <h3 className="text-[15px] font-black text-white tracking-tight">{f.title}</h3>
                  <p className="text-[12px] text-[#8E8E93] leading-relaxed font-medium mt-1.5">
                    {f.desc}
                  </p>
                </div>
                <div className="relative mt-auto pt-1 flex items-center gap-1 text-[10px] font-bold text-white/30 group-hover:text-white/55 transition-colors">
                  <span>On the Command Deck</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </motion.article>
            );
          })}
        </div>
      </Section>

      {/* FAQ — full width, 2-col, no dead right column */}
      <section className="py-8 sm:py-10 border-t border-[#1F1F23]">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-1.5">
              FAQ
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Straight answers.
            </h2>
            <p className="mt-1.5 text-[13px] text-[#8E8E93] font-medium leading-relaxed">
              Quick clarity before you start — more on Contact if you need it.
            </p>
          </div>
          <motion.button
            type="button"
            onClick={() => onNavigate("contact")}
            whileHover={{ x: 3 }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white cursor-pointer shrink-0"
          >
            Contact & more FAQ
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        <div className="grid md:grid-cols-2 gap-2">
          {[
            {
              q: "Is this only for rentals?",
              a: "No. Housing is first-class, but HomeOS also covers income, side hustles, assets, budgets, chores, documents, and an audit trail.",
            },
            {
              q: "How fast can I get value?",
              a: "Most people create an account, pick a role, and land on the Command Deck in a few minutes — then add the homes and life data they manage.",
            },
            {
              q: "Can I leave with my data?",
              a: "Yes. Export CSV, Excel, PDF invoices, and Home Life packs anytime. Your vault is not a hostage system.",
            },
            {
              q: "Who is it for?",
              a: "Households, renters, landlords, managers, and anyone tired of running home life from scattered tools.",
            },
            {
              q: "Is my workspace private?",
              a: "Yes. Access is account-based, and you control what you store, export, or wipe from Vault Settings.",
            },
          ].map((item, i) => {
            const open = openFaq === i;
            return (
              <motion.div
                key={item.q}
                custom={i}
                variants={fade}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className={`mkt-card overflow-hidden border transition-colors h-fit ${
                  open ? "border-white/20" : "border-[#1F1F23]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 text-left cursor-pointer hover:bg-white/[0.02]"
                  aria-expanded={open}
                >
                  <span className="flex items-center gap-2.5 min-w-0 pr-1">
                    <span
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 text-[11px] font-black tabular-nums transition-colors ${
                        open
                          ? "bg-white text-black border-white"
                          : "bg-white/5 border-white/10 text-white/45"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] sm:text-sm font-black text-white tracking-tight leading-snug">
                      {item.q}
                    </span>
                  </span>
                  <motion.span
                    animate={{ rotate: open ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronRight className="w-4 h-4 text-[#8E8E93]" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-0 border-t border-[#1F1F23]">
                        <p className="text-[12px] sm:text-[13px] text-[#8E8E93] leading-relaxed font-medium pt-2.5 sm:pl-9">
                          {item.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Final CTA — single clear ask, no price */}
      <section className="py-10 sm:py-12">
        <div className="mkt-card p-6 sm:p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/[0.04] rounded-full blur-[80px] pointer-events-none" />
          <div className="relative grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Ready for one home OS?
              </h2>
              <p className="mt-2 text-sm text-[#8E8E93] leading-relaxed max-w-md font-medium">
                Open the Command Deck. Log a side hustle. Settle a bill. Export proof. Your vault
                starts with your account and a workspace you control.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={onLaunch}
                  className="mkt-btn-primary text-sm px-6 py-3.5 min-h-[48px]"
                >
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </button>
                {onLogin && (
                  <button type="button" onClick={onLogin} className="mkt-btn-ghost text-sm px-5 py-3.5 min-h-[48px]">
                    Log in
                  </button>
                )}
              </div>
            </div>
            <ul className="space-y-2">
              {[
                { icon: Home, t: "Home Life: income, assets, chores, budgets" },
                { icon: Building2, t: "Housing: properties, leases, utilities" },
                { icon: ShieldCheck, t: "Immutable activity timestamps" },
                { icon: Wallet, t: "Ledger, invoices, multi-format export" },
              ].map(({ icon: Icon, t }) => (
                <li
                  key={t}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-black/40 border border-[#1F1F23]"
                >
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <Icon className="w-3.5 h-3.5 text-white/45 shrink-0" />
                  <span className="text-xs font-bold text-white">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

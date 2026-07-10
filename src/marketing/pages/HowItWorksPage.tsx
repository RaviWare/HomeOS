import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Brain,
  Building2,
  Check,
  CreditCard,
  FileText,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Sparkles,
  UserCircle,
  Zap,
  Home,
  Wallet,
  Clock,
  Gift,
  Download,
  RefreshCcw,
  UserCog,
  CalendarCheck,
  BadgePercent,
} from "lucide-react";

interface HowItWorksPageProps {
  onLaunch: () => void;
}

const STEPS = [
  {
    n: "01",
    icon: UserCircle,
    title: "Create account",
    body: "Sign up with email and password. Pick a role — Tenant, Landlord, Owner, Manager, or Society Admin. HomeOS adapts the deck to how you live and work.",
    detail:
      "Your account is the key to a private workspace. No shared demo data is forced in — you start clean and add real homes and life records.",
    time: "~1 min",
    tags: ["Email", "Role", "Trial starts"],
  },
  {
    n: "02",
    icon: Lock,
    title: "Secure workspace",
    body: "A private vault is created under your account — confidential by default, encrypted in transit and at rest.",
    detail:
      "Only you sign in. Activity is logged immutably so you always have a proof trail of what changed in the vault.",
    time: "~30 sec",
    tags: ["Privacy", "Vault", "Audit log"],
  },
  {
    n: "03",
    icon: Building2,
    title: "Add homes & life",
    body: "Add properties, leases, payments, utilities, maintenance, income, assets, budgets, chores, and documents — only what you need first.",
    detail:
      "Home Life sits beside housing: salary, side hustles, vehicles, travel, and household tasks in the same OS as rent and repairs.",
    time: "~3 min",
    tags: ["Housing", "Life", "Docs"],
  },
  {
    n: "04",
    icon: LayoutDashboard,
    title: "Run the deck",
    body: "Command Deck is HQ: pulse stats, renewals, spend, weather/time, and one-tap hubs into every module.",
    detail:
      "Operate day to day from one screen — settle payments, raise tickets, track utilities, and open the vault without hunting spreadsheets.",
    time: "Daily",
    tags: ["Pulse", "Hubs", "Ops"],
  },
  {
    n: "05",
    icon: Brain,
    title: "Ask & export",
    body: "Query records in plain English. Export CSV, Excel, PDF, or a full workspace backup whenever you need proof.",
    detail:
      "Ask Your Data answers from your vault. Encrypted backups and PDF reports are always available from Account & data.",
    time: "On demand",
    tags: ["Ask", "Export", "Backup"],
  },
  {
    n: "06",
    icon: Zap,
    title: "Trial → plan",
    body: "14-day full trial. Upgrade when ready. Annual checkout unlocks 3 bonus months free — shown before you pay.",
    detail:
      "Manage plan, download all data, and cancel auto-renewal anytime in Account settings. You stay in control after checkout.",
    time: "Optional",
    tags: ["Trial", "Annual +3 mo", "Cancel anytime"],
  },
];

const FLOW = [
  { icon: LayoutDashboard, label: "Deck", d: "HQ pulse" },
  { icon: Building2, label: "Housing", d: "Homes & leases" },
  { icon: CreditCard, label: "Money", d: "Ledger & bills" },
  { icon: Home, label: "Life", d: "Income & chores" },
  { icon: FileText, label: "Vault", d: "Docs & OCR" },
  { icon: Wallet, label: "Export", d: "CSV · PDF" },
];

const TRIAL = [
  {
    icon: CalendarCheck,
    t: "14-day free trial",
    d: "Full Command Deck access from day one — every hub unlocked while you evaluate.",
  },
  {
    icon: BadgePercent,
    t: "Annual at checkout",
    d: "Choose annual when you upgrade: yearly discount plus 3 extra months free, shown clearly at checkout.",
  },
  {
    icon: Gift,
    t: "+3 months free",
    d: "Annual plans only. Bonus months apply after payment confirmation — no hidden steps.",
  },
];

const ACCOUNT = [
  {
    icon: UserCog,
    t: "Manage account",
    d: "Update name, email, workspace, and role anytime in Settings → Account & data.",
  },
  {
    icon: Download,
    t: "Download all data",
    d: "Export full JSON backup, encrypted backup, or PDF portfolio report — your records leave with you.",
  },
  {
    icon: RefreshCcw,
    t: "Cancel auto-renewal",
    d: "Turn off auto-renewal in Plan & billing. Keep access until the period ends — no surprise charges.",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function HowItWorksPage({ onLaunch }: HowItWorksPageProps) {
  const [active, setActive] = useState(0);
  const step = STEPS[active];
  const StepIcon = step.icon;

  return (
    <div className="animate-pageEnter">
      {/* Hero + interactive board */}
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
                How it works
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04, ease }}
                className="text-xl sm:text-2xl font-black text-white tracking-tight leading-[1.15]"
              >
                From signup
                <br />
                <span className="text-white/40">to Command Deck.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mt-2 text-[12px] sm:text-[13px] text-[#8E8E93] leading-relaxed font-medium max-w-[19rem]"
              >
                HomeOS is a private home operating system: housing, money, life, and documents —
                with a 14-day trial and full control after you upgrade.
              </motion.p>
            </div>

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

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.16 }}
              className="flex flex-wrap gap-1.5 mt-1"
            >
              {[
                { icon: Clock, label: "14-day trial" },
                { icon: Gift, label: "Annual +3 mo" },
                { icon: Download, label: "Export anytime" },
                { icon: RefreshCcw, label: "Cancel renewal" },
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

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4, ease }}
            className="lg:col-span-8 mkt-card p-3 sm:p-3.5 border border-[#1F1F23]"
          >
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-3">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const on = i === active;
                return (
                  <button
                    key={s.n}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`relative flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 min-h-[4.25rem] transition-colors duration-200 border ${
                      on
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.03] text-white/50 border-white/10 hover:border-white/20 hover:text-white/80"
                    }`}
                    aria-pressed={on}
                    aria-label={`Step ${s.n}: ${s.title}`}
                  >
                    <span
                      className={`text-[9px] font-black font-mono tracking-wider ${
                        on ? "text-black/50" : "text-white/30"
                      }`}
                    >
                      {s.n}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${on ? "text-black" : ""}`} />
                    <span
                      className={`text-[9px] font-bold leading-tight text-center px-0.5 line-clamp-1 ${
                        on ? "text-black/70" : "text-white/40"
                      }`}
                    >
                      {s.title.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Fixed height detail — no layout shift when switching steps */}
            <div className="relative rounded-xl border border-white/10 bg-black/40 p-3.5 sm:p-4 h-[11.75rem] sm:h-[12.25rem] overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease }}
                  className="absolute inset-0 p-3.5 sm:p-4 flex gap-3 sm:gap-4"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white text-black flex items-center justify-center shrink-0">
                    <StepIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-sm sm:text-[15px] font-black text-white tracking-tight">
                        {step.title}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/45">
                        <Clock className="w-2.5 h-2.5" />
                        {step.time}
                      </span>
                    </div>
                    <p className="text-[12px] sm:text-[13px] text-[#8E8E93] leading-relaxed font-medium line-clamp-3">
                      {step.body}
                    </p>
                    <p className="text-[11px] text-white/45 leading-relaxed font-medium mt-1.5 line-clamp-2">
                      {step.detail}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                      {step.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold text-white/55"
                        >
                          <Check className="w-2.5 h-2.5 text-white/40" />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-white/[0.06]">
              <div className="flex items-center gap-1">
                {STEPS.map((s, i) => (
                  <button
                    key={s.n}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`h-1 rounded-full transition-all duration-200 ${
                      i === active ? "w-5 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={`Go to step ${s.n}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={active === 0}
                  onClick={() => setActive((a) => Math.max(0, a - 1))}
                  className="text-[11px] font-bold text-white/40 hover:text-white disabled:opacity-30 disabled:pointer-events-none px-2 py-1 transition-colors"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    active < STEPS.length - 1 ? setActive((a) => a + 1) : onLaunch()
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  {active < STEPS.length - 1 ? "Next step" : "Start trial"}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Module map */}
      <section className="pb-5 sm:pb-6">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
            Inside the OS
          </p>
          <p className="text-[10px] font-medium text-white/30 hidden sm:block">
            What you operate after setup
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {FLOW.map((item, i) => {
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

      {/* Trial + annual bonus */}
      <section className="pb-5 sm:pb-6 border-t border-[#1F1F23] pt-5 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1">
              Free trial & annual
            </p>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Start free. Bonus months at checkout.
            </h2>
          </div>
          <p className="text-[11px] text-[#6B7280] font-medium max-w-xs sm:text-right leading-snug">
            The +3 months free offer appears when you choose an annual plan at checkout — not
            buried in fine print.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-2.5">
          {TRIAL.map(({ icon: Icon, t, d }, i) => (
            <motion.article
              key={t}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, ease }}
              whileHover={{ y: -2 }}
              className={`mkt-card p-3.5 flex flex-col gap-2 border ${
                i === 2 ? "border-white/20 bg-white/[0.03]" : "border-[#1F1F23]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-[13px] font-black text-white">{t}</h3>
              </div>
              <p className="text-[11px] text-[#8E8E93] leading-snug font-medium">{d}</p>
            </motion.article>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-2.5 mkt-card p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 border border-white/12"
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <Sparkles className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-black text-white">Checkout preview</p>
              <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5 leading-snug">
                Annual Personal / Pro / Team → yearly price with discount → line item{" "}
                <span className="text-white/80">“+3 months free included”</span> → pay → access
                extends automatically.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLaunch}
            className="mkt-btn-primary text-[12px] px-4 py-2.5 min-h-[40px] shrink-0 w-full sm:w-auto"
          >
            Start trial
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </section>

      {/* Account control */}
      <section className="pb-5 sm:pb-6">
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1">
            You stay in control
          </p>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Account, data & renewal.
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-2.5">
          {ACCOUNT.map(({ icon: Icon, t, d }, i) => (
            <motion.article
              key={t}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, ease }}
              className="mkt-card p-3.5 flex flex-col gap-2 border border-[#1F1F23]"
            >
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-[13px] font-black text-white">{t}</h3>
              <p className="text-[11px] text-[#8E8E93] leading-snug font-medium">{d}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-1 border-t border-[#1F1F23] pt-5 sm:pt-6">
        <div className="mkt-card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/12">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-white tracking-tight">
              Ready to open your vault?
            </h3>
            <p className="text-[11px] text-[#8E8E93] mt-0.5 font-medium leading-snug">
              14-day free trial · annual checkout shows +3 months free · export & cancel renewal
              anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={onLaunch}
            className="mkt-btn-primary text-[13px] px-5 py-2.5 min-h-[42px] shrink-0 w-full sm:w-auto"
          >
            Start free trial
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
}

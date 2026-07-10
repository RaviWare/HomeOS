import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  FileText,
  Home,
  Landmark,
  Lightbulb,
  MapPin,
  Sparkles,
  Target,
  Wallet,
  X,
  Hand,
  MousePointerClick,
  Layers,
} from "lucide-react";
import {
  type GuideStepId,
  type VaultSetupSnapshot,
  loadGuideStep,
  saveGuideStep,
  setGuideDismissed,
  setLifeNavIntent,
  setPaymentNavIntent,
  setPropertyNavIntent,
  setupProgress,
} from "../deckGuide";
import { navigateView } from "../routing";

const panel = "bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl";

export interface DeckEmptyGuideProps {
  setup: VaultSetupSnapshot;
  /** Navigate to an app tab (e.g. life, properties). */
  onNavigate: (tab: string) => void;
  /** Compact strip when user dismissed the full board but still incomplete. */
  compact?: boolean;
  onExpand?: () => void;
  /** Called when user hides the full guide. */
  onDismiss?: () => void;
}

type StepDef = {
  id: GuideStepId;
  n: string;
  title: string;
  where: string;
  why: string;
  how: string[];
  gesture: string;
  done: boolean;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
};

/**
 * Interactive first-run instructions on the Command Deck.
 * Teaches where to enter income, assets (net worth), homes, leases, payments, goals.
 */
export default function DeckEmptyGuide({
  setup,
  onNavigate,
  compact = false,
  onExpand,
  onDismiss,
}: DeckEmptyGuideProps) {
  const progress = setupProgress(setup);
  const steps = useMemo((): StepDef[] => {
    return [
      {
        id: "income",
        n: "01",
        title: "Monthly income & sources",
        where: "Home Life → Income",
        why: "Powers Income / mo on the ribbon, savings rate, and cashflow estimates.",
        how: [
          "Open Home Life from the sidebar or the CTA below.",
          "Tap the Income tab, then Add.",
          "Enter a name (e.g. Primary salary), type, and monthly amount.",
          "Add more streams for freelance, side hustles, or rental income.",
        ],
        gesture: "Tap ribbon “Income / mo” or use Add income below",
        done: setup.hasIncome,
        cta: setup.hasIncome ? "Manage income" : "Add income stream",
        icon: Wallet,
        run: () => {
          setLifeNavIntent({ tab: "income", openAdd: !setup.hasIncome });
          onNavigate("life");
        },
      },
      {
        id: "assets",
        n: "02",
        title: "Assets → net worth",
        where: "Home Life → Assets",
        why: "Net worth* on the deck is built from asset values + dream savings − open balances. There is no separate “net worth field” — add assets.",
        how: [
          "Open Home Life → Assets → Add.",
          "Name the asset (e.g. Equity in home, Car, Mutual funds).",
          "Pick a category and enter estimated value.",
          "Add every major holding; totals roll into Net worth* automatically.",
        ],
        gesture: "Tap ribbon “Net worth*” to jump here",
        done: setup.hasAssets,
        cta: setup.hasAssets ? "Manage assets" : "Add first asset",
        icon: Landmark,
        run: () => {
          setLifeNavIntent({ tab: "assets", openAdd: !setup.hasAssets });
          onNavigate("life");
        },
      },
      {
        id: "property",
        n: "03",
        title: "Your home(s)",
        where: "Property Hub",
        why: "Housing context for leases, utilities, maintenance, and occupancy.",
        how: [
          "Open Property Hub from the sidebar or All modules.",
          "Add home — city, status, rent or ownership notes.",
          "Duplicate for multiple units if you manage a portfolio.",
        ],
        gesture: "Sidebar → Properties, or modules grid",
        done: setup.hasProperty,
        cta: setup.hasProperty ? "Open properties" : "Add a home",
        icon: Building2,
        run: () => {
          setPropertyNavIntent({ openAdd: !setup.hasProperty });
          onNavigate("properties");
        },
      },
      {
        id: "lease",
        n: "04",
        title: "Lease & agreements",
        where: "Leases",
        why: "Renewals, deposits, and clause structure link rent to homes.",
        how: [
          "Open Leases → create or attach a lease to a property.",
          "Set start/end, rent, deposit, and key clauses.",
          "Track renewals from the Command Deck pulse.",
        ],
        gesture: "Modules → Lease & clauses",
        done: setup.hasLease,
        cta: setup.hasLease ? "View leases" : "Add a lease",
        icon: FileText,
        run: () => onNavigate("leases"),
      },
      {
        id: "payment",
        n: "05",
        title: "Payments & ledger",
        where: "Payments / Ledger",
        why: "Builds cashflow charts, open balance, and rent history on the deck.",
        how: [
          "Open Payments → record rent paid, deposits, or income received.",
          "Mark status Paid or Pending.",
          "Export CSV / Excel / PDF when you need proof.",
        ],
        gesture: "Ribbon open balance or Payments module",
        done: setup.hasPayment,
        cta: setup.hasPayment ? "Open ledger" : "Log a payment",
        icon: CreditCard,
        run: () => {
          setPaymentNavIntent({ openAdd: !setup.hasPayment });
          onNavigate("payments");
        },
      },
      {
        id: "goal",
        n: "06",
        title: "Dream savings goal",
        where: "Home Life → Dream savings",
        why: "Tracks % funded on the deck and counts toward net worth estimate.",
        how: [
          "Home Life → Dream savings → Add.",
          "Set target amount, already saved, and optional monthly contribution.",
          "Pick kinds like Home, Car, Emergency fund, or Custom.",
        ],
        gesture: "Ribbon “Dream goals”",
        done: setup.hasGoal,
        cta: setup.hasGoal ? "View goals" : "Add a dream goal",
        icon: Target,
        run: () => {
          setLifeNavIntent({ tab: "goals", openAdd: !setup.hasGoal });
          onNavigate("life");
        },
      },
    ];
  }, [setup, onNavigate]);

  const firstOpen = steps.findIndex((s) => !s.done);
  const [active, setActive] = useState(() => {
    const saved = loadGuideStep();
    if (firstOpen >= 0) return firstOpen;
    return Math.min(saved, Math.max(0, steps.length - 1));
  });
  const [detailsOpen, setDetailsOpen] = useState(true);

  const step = steps[Math.min(active, steps.length - 1)] || steps[0];
  const StepIcon = step.icon;

  const select = (i: number) => {
    setActive(i);
    saveGuideStep(i);
    setDetailsOpen(true);
  };

  if (compact) {
    return (
      <div
        className={`${panel} px-3.5 py-3 flex flex-col sm:flex-row sm:items-center gap-3 border border-amber-500/25 bg-amber-500/[0.04]`}
      >
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[12px] font-black text-white">
              Setup {progress.done}/{progress.total} · keep building your vault
            </p>
            <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5 leading-snug">
              {!setup.hasIncome
                ? "Next: add monthly income sources in Home Life."
                : !setup.hasAssets
                  ? "Next: add assets so Net worth* has real numbers."
                  : !setup.hasProperty
                    ? "Next: add a home in Property Hub."
                    : "Open the guide anytime for where each number lives."}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!setup.hasIncome) {
                setLifeNavIntent({ tab: "income", openAdd: true });
                onNavigate("life");
              } else if (!setup.hasAssets) {
                setLifeNavIntent({ tab: "assets", openAdd: true });
                onNavigate("life");
              } else {
                onExpand?.();
              }
            }}
            className="h-9 px-3 rounded-xl bg-white text-black text-[11px] font-black inline-flex items-center gap-1.5 cursor-pointer"
          >
            Continue setup
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="h-9 px-3 rounded-xl border border-[#2E2E33] text-[11px] font-bold text-white cursor-pointer"
            >
              Full guide
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${panel} border border-white/12 overflow-hidden relative`}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.04] via-transparent to-emerald-500/[0.05]" />

      {/* Header */}
      <div className="relative px-3.5 sm:px-4 pt-3.5 sm:pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-white/50" />
              First-run guide · Command Deck
            </p>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Where to enter your numbers
            </h2>
            <p className="text-[12px] text-[#8E8E93] font-medium mt-1 max-w-xl leading-relaxed">
              Your vault is private and starts empty. Income, net worth, homes, and payments
              live in different modules — follow the steps (or tap a ribbon card).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right mr-1">
              <p className="text-[11px] font-black text-white tabular-nums">
                {progress.done}/{progress.total}
              </p>
              <p className="text-[9px] font-bold text-[#71717A] uppercase tracking-wide">
                complete
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setGuideDismissed(true);
                onDismiss?.();
              }}
              className="h-8 w-8 rounded-lg border border-[#1F1F23] text-[#8E8E93] hover:text-white inline-flex items-center justify-center cursor-pointer"
              title="Hide guide for now"
              aria-label="Dismiss guide"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-white"
            initial={false}
            animate={{ width: `${progress.pct}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>

        {/* Gesture tips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            { icon: MousePointerClick, t: "Tap ribbon KPIs to jump" },
            { icon: Hand, t: "Sidebar opens every hub" },
            { icon: Layers, t: "Life OS · Trends · Datasets" },
          ].map(({ icon: I, t }) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold text-[#8E8E93]"
            >
              <I className="w-3 h-3 text-white/45" />
              {t}
            </span>
          ))}
          <button
            type="button"
            onClick={() => navigateView({ kind: "onboarding" })}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold text-white/70 hover:text-white hover:border-white/30 cursor-pointer"
          >
            Reconfigure setup anytime
          </button>
        </div>
      </div>

      <div className="relative p-3 sm:p-3.5 grid lg:grid-cols-12 gap-3">
        {/* Step chips */}
        <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-1.5 content-start">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const on = i === active;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => select(i)}
                className={`text-left rounded-xl border px-2.5 py-2.5 transition-colors min-h-[4.25rem] ${
                  on
                    ? "border-white bg-white text-black"
                    : s.done
                      ? "border-emerald-500/30 bg-emerald-500/[0.06] text-white"
                      : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`text-[9px] font-black font-mono ${
                      on ? "text-black/45" : "text-white/30"
                    }`}
                  >
                    {s.n}
                  </span>
                  {s.done ? (
                    <Check
                      className={`w-3 h-3 ml-auto ${on ? "text-black" : "text-emerald-400"}`}
                    />
                  ) : (
                    <Icon className={`w-3 h-3 ml-auto ${on ? "text-black" : "text-white/40"}`} />
                  )}
                </div>
                <p
                  className={`text-[11px] font-black leading-tight line-clamp-2 ${
                    on ? "text-black" : "text-white"
                  }`}
                >
                  {s.title}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active step detail */}
        <div className="lg:col-span-7 rounded-xl border border-white/10 bg-black/40 p-3.5 sm:p-4 min-h-[16rem] flex flex-col">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    step.done ? "bg-emerald-400 text-black" : "bg-white text-black"
                  }`}
                >
                  {step.done ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-[15px] font-black text-white tracking-tight">
                      {step.title}
                    </h3>
                    {step.done && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-1.5 py-0.5 rounded-md">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-white/40" />
                    {step.where}
                  </p>
                </div>
              </div>

              <p className="text-[12px] text-[#A1A1AA] font-medium leading-relaxed mb-2">
                {step.why}
              </p>

              <button
                type="button"
                onClick={() => setDetailsOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-white/50 hover:text-white mb-2 cursor-pointer w-fit"
              >
                Step-by-step
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {detailsOpen && (
                <ol className="space-y-1.5 mb-3">
                  {step.how.map((line, i) => (
                    <li
                      key={line}
                      className="flex gap-2 text-[11px] text-white/55 font-medium leading-snug"
                    >
                      <span className="text-white/30 font-black tabular-nums w-4 shrink-0">
                        {i + 1}.
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              )}

              <p className="text-[10px] text-[#71717A] font-medium mb-3 flex items-start gap-1.5">
                <Hand className="w-3 h-3 shrink-0 mt-0.5 text-white/35" />
                {step.gesture}
              </p>

              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={step.run}
                  className="h-10 px-4 rounded-xl bg-white text-black text-[12px] font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {step.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {active < steps.length - 1 && (
                  <button
                    type="button"
                    onClick={() => select(active + 1)}
                    className="h-10 px-3 rounded-xl border border-[#2E2E33] text-[11px] font-bold text-white cursor-pointer"
                  >
                    Next tip
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Quick actions strip */}
      <div className="relative px-3.5 sm:px-4 pb-3.5 sm:pb-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/35 w-full sm:w-auto sm:mr-1 self-center">
          Quick add
        </span>
        <QuickBtn
          icon={Wallet}
          label="Income"
          done={setup.hasIncome}
          onClick={() => {
            setLifeNavIntent({ tab: "income", openAdd: true });
            onNavigate("life");
          }}
        />
        <QuickBtn
          icon={Landmark}
          label="Asset / net worth"
          done={setup.hasAssets}
          onClick={() => {
            setLifeNavIntent({ tab: "assets", openAdd: true });
            onNavigate("life");
          }}
        />
        <QuickBtn
          icon={Home}
          label="Home"
          done={setup.hasProperty}
          onClick={() => onNavigate("properties")}
        />
        <QuickBtn
          icon={Target}
          label="Goal"
          done={setup.hasGoal}
          onClick={() => {
            setLifeNavIntent({ tab: "goals", openAdd: true });
            onNavigate("life");
          }}
        />
      </div>
    </motion.section>
  );
}

function QuickBtn({
  icon: Icon,
  label,
  done,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-2.5 rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer border transition-colors ${
        done
          ? "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300"
          : "border-white/10 bg-white/[0.04] text-white hover:border-white/25"
      }`}
    >
      {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

/** Small help chip to re-open the guide after dismiss. */
export function DeckGuideHelpChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-[#1F1F23] bg-[#0C0C0F] text-[10px] font-bold text-[#8E8E93] hover:text-white hover:border-white/20 cursor-pointer"
    >
      <Lightbulb className="w-3.5 h-3.5 text-amber-400/80" />
      How to enter data
    </button>
  );
}
